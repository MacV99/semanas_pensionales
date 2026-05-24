import type { APIRoute } from "astro";
import { parseOcrText } from "../../lib/parser.ts";
import { calcular } from "../../lib/calculator.ts";

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Content-Type no soportado. Use application/json." }),
        { status: 415, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    if (!body?.text || typeof body.text !== "string") {
      return new Response(
        JSON.stringify({ error: "No se recibió texto del PDF." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const rawRecords = parseOcrText(body.text);

    if (rawRecords.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No se encontraron registros de cotización en el PDF. Verifique que el documento sea una historia laboral de Colpensiones.",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(calcular(rawRecords)), {
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
