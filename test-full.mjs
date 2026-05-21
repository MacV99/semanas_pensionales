import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { createCanvas } from "canvas";
import sharp from "sharp";
import Tesseract from "tesseract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.join(__dirname, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = "file:///" + workerPath.replace(/\\/g, "/");

const PAGES_TO_TEST = 4; // First 4 pages only

console.log("1. Cargando PDF...");
const buf = readFileSync("samples/reporte_semanas-silvia.pdf");
const uint8 = new Uint8Array(buf);
const doc = await pdfjs.getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false, disableFontFace: true }).promise;
console.log(`   ${doc.numPages} páginas encontradas`);

console.log("2. Renderizando páginas como imágenes...");
const images = [];
for (let i = 1; i <= Math.min(PAGES_TO_TEST, doc.numPages); i++) {
  const page = await doc.getPage(i);
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  const rawPng = canvas.toBuffer("image/png");
  const processed = await sharp(rawPng).grayscale().normalise().sharpen().toBuffer();
  images.push(processed);
  console.log(`   Página ${i} renderizada (${viewport.width}x${viewport.height})`);
}

console.log("3. OCR con Tesseract (español)...");
const worker = await Tesseract.createWorker("spa", 1, { logger: m => { if (m.status === "recognizing text") process.stdout.write(`\r   Progreso: ${(m.progress * 100).toFixed(0)}%`); } });
await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, preserve_interword_spaces: "1" });

let fullText = "";
for (let i = 0; i < images.length; i++) {
  console.log(`\n   OCR página ${i + 1}...`);
  const { data } = await worker.recognize(images[i]);
  fullText += `\n\n=== PÁGINA ${i + 1} ===\n` + data.text;
}
await worker.terminate();

writeFileSync("test-ocr-output.txt", fullText, "utf8");
console.log("\n4. Texto guardado en test-ocr-output.txt");
console.log("\n=== PRIMERAS 3000 CHARS ===");
console.log(fullText.slice(0, 3000));

process.exit(0);
