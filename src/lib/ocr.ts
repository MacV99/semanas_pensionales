import Tesseract from "tesseract.js";

export async function ocrImages(imageBuffers: Buffer[]): Promise<string> {
  const worker = await Tesseract.createWorker("spa", 1, {
    logger: () => {},
  });

  // PSM.AUTO gives better row-level output for Colpensiones tables
  // (PSM.SPARSE_TEXT fragments each cell into its own line)
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    preserve_interword_spaces: "1",
  });

  const pages: string[] = [];

  for (const buf of imageBuffers) {
    const { data } = await worker.recognize(buf);
    pages.push(data.text);
  }

  await worker.terminate();

  return pages.join("\n--- PAGE BREAK ---\n");
}
