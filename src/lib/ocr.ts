import Tesseract from "tesseract.js";

async function ocrPage(buf: Buffer): Promise<string> {
  const worker = await Tesseract.createWorker("spa", 1, { logger: () => {} });
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    preserve_interword_spaces: "1",
  });
  const { data } = await worker.recognize(buf);
  await worker.terminate();
  return data.text;
}

export async function ocrImages(imageBuffers: Buffer[]): Promise<string> {
  const CONCURRENCY = 3;
  const results: string[] = new Array(imageBuffers.length);

  for (let i = 0; i < imageBuffers.length; i += CONCURRENCY) {
    const batch = imageBuffers.slice(i, i + CONCURRENCY);
    const texts = await Promise.all(batch.map(ocrPage));
    texts.forEach((t, j) => { results[i + j] = t; });
  }

  return results.join("\n--- PAGE BREAK ---\n");
}
