import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

const buf = readFileSync('./samples/reporte_semanas-silvia.pdf');
const pdf = await getDocument({
  data: new Uint8Array(buf),
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: true,
  verbosity: 0
}).promise;

console.log('Pages:', pdf.numPages);
const page = await pdf.getPage(1);
const content = await page.getTextContent();
const text = content.items.map(i => i.str).join(' ');
console.log('Total chars on page 1:', text.length);
console.log('Sample:\n', text.slice(0, 800));
