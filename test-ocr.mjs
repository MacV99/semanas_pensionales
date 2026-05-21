import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.join(__dirname, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = "file:///" + workerPath.replace(/\\/g, "/");

const buf = readFileSync("samples/reporte_semanas-silvia.pdf");
const uint8 = new Uint8Array(buf);
const doc = await pdfjs.getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false }).promise;

console.log("Páginas:", doc.numPages);

for (let i = 1; i <= Math.min(4, doc.numPages); i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const text = content.items.map(it => ("str" in it ? it.str : "")).join(" ");
  console.log(`\n--- PÁGINA ${i} (${text.length} chars) ---`);
  console.log(text.slice(0, 1200));
}

process.exit(0);
