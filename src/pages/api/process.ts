import type { APIRoute } from "astro";
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

    // Step 1: PDF → images
    const images = await pdfToImages(buffer);

    if (images.length === 0) {
      return new Response(JSON.stringify({ error: "No se pudieron extraer páginas del PDF." }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: OCR
    const ocrText = await ocrImages(images);

    // Step 3: Parse
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

    // Step 4: Calculate
    const result = calcular(rawRecords);

    return new Response(JSON.stringify(result), {
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
