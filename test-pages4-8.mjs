import { readFileSync, writeFileSync } from "fs";
import * as mupdf from "mupdf";
import sharp from "sharp";
import Tesseract from "tesseract.js";

const PAGES = [4, 5, 6, 7, 8]; // 1-indexed

const buf = readFileSync("samples/reporte_semanas-silvia.pdf");
const doc = mupdf.Document.openDocument(buf, "application/pdf");

const worker = await Tesseract.createWorker("spa", 1, { logger: m => { if (m.status === "recognizing text") process.stdout.write(`\r   ${(m.progress*100).toFixed(0)}%`); } });
await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, preserve_interword_spaces: "1" });

let out = "";
for (const pageNum of PAGES) {
  const page = doc.loadPage(pageNum - 1);
  const matrix = mupdf.Matrix.scale(2.5, 2.5);
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
  const img = await sharp(Buffer.from(pixmap.asPNG())).grayscale().normalise().sharpen().toBuffer();
  console.log(`\nOCR página ${pageNum}...`);
  const { data } = await worker.recognize(img);
  out += `\n\n=== PÁGINA ${pageNum} ===\n` + data.text;
}

await worker.terminate();
writeFileSync("test-pages4-8.txt", out, "utf8");
console.log("\nGuardado en test-pages4-8.txt");
process.exit(0);
