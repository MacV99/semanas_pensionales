import { readFileSync, writeFileSync } from "fs";
import * as mupdf from "mupdf";
import sharp from "sharp";
import Tesseract from "tesseract.js";

const PAGES_TO_TEST = 5;
const SCALE = 3; // ~216 dpi

console.log("1. Abriendo PDF con MuPDF...");
const buf = readFileSync("samples/reporte_semanas-silvia.pdf");
const doc = mupdf.Document.openDocument(buf, "application/pdf");
const pageCount = doc.countPages();
console.log(`   ${pageCount} páginas`);

console.log("2. Renderizando páginas...");
const images = [];
for (let i = 0; i < Math.min(PAGES_TO_TEST, pageCount); i++) {
  const page = doc.loadPage(i);
  const bounds = page.getBounds();
  const w = Math.round((bounds[2] - bounds[0]) * SCALE);
  const h = Math.round((bounds[3] - bounds[1]) * SCALE);
  const matrix = mupdf.Matrix.scale(SCALE, SCALE);
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
  const pngBuf = Buffer.from(pixmap.asPNG());

  const processed = await sharp(pngBuf).grayscale().normalise().sharpen().toBuffer();
  images.push(processed);

  // Save sample image for inspection
  if (i < 2) writeFileSync(`test-page-${i + 1}.png`, processed);
  console.log(`   Página ${i + 1} OK (${w}x${h})`);
}

console.log("3. OCR con Tesseract...");
const worker = await Tesseract.createWorker("spa", 1, {
  logger: m => { if (m.status === "recognizing text") process.stdout.write(`\r   ${(m.progress * 100).toFixed(0)}%`); }
});
await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, preserve_interword_spaces: "1" });

let fullText = "";
for (let i = 0; i < images.length; i++) {
  console.log(`\n   OCR página ${i + 1}...`);
  const { data } = await worker.recognize(images[i]);
  fullText += `\n\n=== PÁGINA ${i + 1} ===\n` + data.text;
}
await worker.terminate();

writeFileSync("test-ocr-output.txt", fullText, "utf8");
console.log("\n\nGuardado en test-ocr-output.txt");
console.log("\n=== PRIMERAS 4000 CHARS ===");
console.log(fullText.slice(0, 4000));

process.exit(0);
