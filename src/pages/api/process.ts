import type { APIRoute } from "astro";
import { extractTextFromPdf, isUsableText } from "../../lib/pdf-to-text.ts";
import { pdfToImages } from "../../lib/pdf-to-images.ts";
import { ocrImages } from "../../lib/ocr.ts";
import { parseOcrText } from "../../lib/parser.ts";
import { calcular } from "../../lib/calculator.ts";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf");

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No se recibió archivo PDF." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return new Response(JSON.stringify({ error: "El archivo debe ser un PDF." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: try direct text extraction (fast path — digital PDFs)
    let ocrText = extractTextFromPdf(buffer);
    let method = "text";

    if (!isUsableText(ocrText)) {
      // Fallback: OCR for scanned PDFs
      const images = await pdfToImages(buffer);
      if (images.length === 0) {
        return new Response(JSON.stringify({ error: "No se pudieron extraer páginas del PDF." }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });
      }
      ocrText = await ocrImages(images);
      method = "ocr";
    }

    // Step 2: Parse
    const rawRecords = parseOcrText(ocrText);

    if (rawRecords.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No se encontraron registros de cotización en el PDF. Verifique que el documento sea una historia laboral de Colpensiones.",
          ocrPreview: ocrText.slice(0, 500),
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Calculate
    const result = calcular(rawRecords);

    return new Response(JSON.stringify({ ...result, method }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[process.ts] Error:", err);
    return new Response(
      JSON.stringify({ error: `Error interno: ${err?.message ?? "desconocido"}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
