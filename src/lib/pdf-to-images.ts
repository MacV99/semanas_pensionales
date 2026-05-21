import * as mupdf from "mupdf";
import sharp from "sharp";

const SCALE = 3.5; // ~252 dpi — better OCR quality for dense tables

export async function pdfToImages(buffer: Buffer): Promise<Buffer[]> {
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const pageCount = doc.countPages();
  const images: Buffer[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const matrix = mupdf.Matrix.scale(SCALE, SCALE);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
    const pngBuf = Buffer.from(pixmap.asPNG());

    const processed = await sharp(pngBuf)
      .grayscale()
      .normalise()
      .sharpen({ sigma: 1.5 })
      .toBuffer();

    images.push(processed);
  }

  return images;
}
