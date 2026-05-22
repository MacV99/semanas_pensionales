import * as mupdf from "mupdf";

export function extractTextFromPdf(buffer: Buffer): string {
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const pageCount = doc.countPages();
  const pages: string[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const stext = page.toStructuredText("preserve-whitespace");
    pages.push(stext.asText());
  }

  return pages.join("\n--- PAGE BREAK ---\n");
}

export function isUsableText(text: string): boolean {
  // Colpensiones PDFs always contain "cotiz" and date patterns
  const hasDates = /\d{2}\/\d{2}\/\d{4}|\d{6}/.test(text);
  const hasKeywords = /cotiz|colpension|pagos/i.test(text);
  return hasDates && hasKeywords && text.length > 200;
}
