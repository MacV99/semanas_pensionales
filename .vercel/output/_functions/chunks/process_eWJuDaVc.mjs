import * as mupdf from 'mupdf';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

const SCALE = 3.5;
async function pdfToImages(buffer) {
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const pageCount = doc.countPages();
  const images = [];
  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const matrix = mupdf.Matrix.scale(SCALE, SCALE);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
    const pngBuf = Buffer.from(pixmap.asPNG());
    const processed = await sharp(pngBuf).grayscale().normalise().sharpen({ sigma: 1.5 }).toBuffer();
    images.push(processed);
  }
  return images;
}

async function ocrImages(imageBuffers) {
  const worker = await Tesseract.createWorker("spa", 1, {
    logger: () => {
    }
  });
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    preserve_interword_spaces: "1"
  });
  const pages = [];
  for (const buf of imageBuffers) {
    const { data } = await worker.recognize(buf);
    pages.push(data.text);
  }
  await worker.terminate();
  return pages.join("\n--- PAGE BREAK ---\n");
}

const PERIODO_POST95 = /\b(199[5-9]|200\d|201\d|202[0-5])(0[1-9]|1[0-2])\b/;
const FECHA_PAIR = /(\d{2}\/\d{2}\/(?:19|20)\d{2})\s+(\d{2}\/\d{2}\/(?:19|20)\d{2})/;
const NIT_START = /^\s*[[(.]?(\d{7,11})[).\]\s]/;
const ES_APORTE_DEVUELTO = /aporte\s*devuelto/i;
const ES_CICLO_DOBLE = /ci[celo]{1,2}lo?\s*doble/i;
const ES_ALL_ZERO = /(?:so[).\]]\s*){2,}(?:ojo|jojo|lolo|[oO]jo)/;
const SECCIONES = [
  { pattern: /detalle\s+de\s+pagos\s+efectuados\s+anteriores\s+a\s+1995/i, logica: "pre95" },
  { pattern: /detalle\s+de\s+pagos\s+efectuados\s+a\s+partir\s+de\s+1995/i, logica: "post95" },
  { pattern: /resumen\s+de\s+semanas\s+cotizadas/i, logica: "ignorar" },
  { pattern: /resumen\s+de\s+tiempos?\s+p[uú]blicos?/i, logica: "ignorar" },
  { pattern: /tiempos?\s+p[uú]blicos?/i, logica: "ignorar" },
  { pattern: /historia\s+laboral/i, logica: "ignorar" }
];
function normalizarEncabezado(line) {
  return line.replace(/\s+/g, " ").trim().replace(/^[^a-záéíóúüñA-Z]+/, "").replace(/[^a-záéíóúüñA-Z0-9 ]+$/i, "").trim();
}
function parseFecha(raw) {
  const dmy = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const iso = raw.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return null;
}
function extractDiasPost95(line) {
  const cleaned = line.replace(/\s*(?:declarado|ahorro|pago?\s+(?:recibido|aplicado)|valor\s+devuelto|nividual|nividuol|velado|aporte|ci[celo]{1,2}lo|r[eé]gimen|regimen|individual|traslado|fondo|aa\s+[oa]\s+mi|\*{2,}|=+|ojo|jojo|lolo|flojo|pao\s|peg[oa]).*$/i, "").replace(/\$\s*[\d.,]+/g, " ").replace(/[—–-]\s*\$?\s*[\d.,]{4,}/g, " ").replace(/\d{2}\/\d{2}\/\d{4}/g, " ").replace(/\d{1,3}[.,]\d{3}[.,]\d{3}/g, " ").replace(/[a-zA-Z\d]{6,}/g, " ").replace(/\b\d{4,}\b/g, " ").replace(/[oO]\s*[oO]\s*[oO]/g, " ").replace(/\b[aAsS][0Oo]\b/g, "30").replace(/\bao\b/gi, "30");
  const matches = [...cleaned.matchAll(/\b(\d{1,2})\b/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const n = parseInt(matches[i][1], 10);
    if (n >= 1 && n <= 31) return n;
  }
  return null;
}
function extractNit(line) {
  const m = line.match(NIT_START);
  return m ? m[1] : "DESCONOCIDO";
}
function parseOcrText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const records = [];
  let logicaActual = "inicio";
  let tablaActual = "Detalle de pagos anteriores a 1995";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const seccionDetectada = SECCIONES.find(({ pattern }) => pattern.test(line));
    if (seccionDetectada) {
      logicaActual = seccionDetectada.logica;
      tablaActual = normalizarEncabezado(line);
      continue;
    }
    if (logicaActual === "pre95" || logicaActual === "inicio" && FECHA_PAIR.test(line)) {
      const pairMatch = line.match(FECHA_PAIR);
      if (pairMatch) {
        const f1 = parseFecha(pairMatch[1]);
        const f2 = parseFecha(pairMatch[2]);
        if (f1 && f2) {
          const diffMs = Math.abs(f2.getTime() - f1.getTime());
          const diasCalendario = Math.round(diffMs / 864e5) + 1;
          records.push({
            periodo: `${pairMatch[1]} -> ${pairMatch[2]}`,
            fechaDesde: pairMatch[1],
            fechaHasta: pairMatch[2],
            tipo: "rango",
            tabla: tablaActual,
            diasReportados: diasCalendario,
            empleador: extractNit(line),
            lineaOriginal: i + 1
          });
        }
      }
      continue;
    }
    if (logicaActual !== "post95") continue;
    if (ES_APORTE_DEVUELTO.test(line)) continue;
    if (ES_CICLO_DOBLE.test(line)) continue;
    if (ES_ALL_ZERO.test(line)) continue;
    const periodoMatch = line.match(PERIODO_POST95);
    if (!periodoMatch) continue;
    const dias = extractDiasPost95(line);
    if (dias === null) continue;
    records.push({
      periodo: periodoMatch[1] + "-" + periodoMatch[2],
      tipo: "mensual",
      tabla: tablaActual,
      diasReportados: dias,
      empleador: extractNit(line),
      lineaOriginal: i + 1
    });
  }
  return records;
}

function deduplicar(records) {
  const seen = /* @__PURE__ */ new Set();
  return records.map((r) => {
    const key = `${r.periodo}|${r.empleador.toLowerCase()}`;
    if (seen.has(key)) return { ...r, _duplicado: true };
    seen.add(key);
    return r;
  });
}
function isDuplicado(r) {
  return r._duplicado === true;
}

function esBisiesto(anio) {
  return anio % 4 === 0 && anio % 100 !== 0 || anio % 400 === 0;
}
const MESES_31 = /* @__PURE__ */ new Set([1, 3, 5, 7, 8, 10, 12]);
function diasEnMes(anio, mes) {
  if (MESES_31.has(mes)) return 31;
  if (mes === 2) return esBisiesto(anio) ? 29 : 28;
  return 30;
}
function reglaMes(anio, mes) {
  const dias = diasEnMes(anio, mes);
  if (mes === 2 && dias === 29) return "MES_REAL_29_BISIESTO";
  if (mes === 2) return "MES_REAL_28";
  if (dias === 31) return "MES_REAL_31";
  return "MES_REAL_30";
}
function procesarMensual(r) {
  const match = r.periodo.match(/(\d{4})-(\d{2})/);
  if (!match) {
    return { ...r, diasReales: r.diasReportados, ajuste: 0, reglaAplicada: "SIN_CAMBIO", excluido: false };
  }
  const anio = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const maxDias = diasEnMes(anio, mes);
  if (r.diasReportados === 30) {
    const regla = reglaMes(anio, mes);
    return { ...r, diasReales: maxDias, ajuste: maxDias - 30, reglaAplicada: regla, excluido: false };
  }
  if (r.diasReportados > maxDias) {
    return { ...r, diasReales: maxDias, ajuste: maxDias - r.diasReportados, reglaAplicada: "EXCEDE_DIAS_MES", excluido: false };
  }
  return { ...r, diasReales: r.diasReportados, ajuste: 0, reglaAplicada: "SIN_CAMBIO", excluido: false };
}
function procesarRango(r) {
  if (!r.fechaDesde || !r.fechaHasta) {
    return { ...r, diasReales: r.diasReportados, ajuste: 0, reglaAplicada: "RANGO_CALENDARIO", excluido: false };
  }
  const f1 = parseFecha(r.fechaDesde);
  const f2 = parseFecha(r.fechaHasta);
  if (!f1 || !f2) {
    return { ...r, diasReales: r.diasReportados, ajuste: 0, reglaAplicada: "RANGO_CALENDARIO", excluido: false };
  }
  const diffMs = Math.abs(f2.getTime() - f1.getTime());
  const diasReales = Math.round(diffMs / 864e5) + 1;
  return { ...r, diasReales, ajuste: diasReales - r.diasReportados, reglaAplicada: "RANGO_CALENDARIO", excluido: false };
}
function calcular(rawRecords) {
  const marcados = deduplicar(rawRecords);
  const registros = marcados.map((r) => {
    if (isDuplicado(r)) {
      return { ...r, diasReales: 0, ajuste: 0, reglaAplicada: "DUPLICADO", excluido: true, razonExclusion: "Registro duplicado" };
    }
    if (r.diasReportados === 0) {
      return { ...r, diasReales: 0, ajuste: 0, reglaAplicada: "CERO_DIAS", excluido: true, razonExclusion: "0 días cotizados" };
    }
    return r.tipo === "rango" ? procesarRango(r) : procesarMensual(r);
  });
  const { totalDiasReportados, totalDiasReales } = registros.reduce(
    (acc, r) => r.excluido ? acc : {
      totalDiasReportados: acc.totalDiasReportados + r.diasReportados,
      totalDiasReales: acc.totalDiasReales + r.diasReales
    },
    { totalDiasReportados: 0, totalDiasReales: 0 }
  );
  return {
    registros,
    totalDiasReportados,
    totalDiasReales,
    semanasReportadas: Math.round(totalDiasReportados / 7 * 100) / 100,
    semanasReales: Math.round(totalDiasReales / 7 * 100) / 100,
    diferenciaDias: totalDiasReales - totalDiasReportados,
    diferenciaSemanas: Math.round((totalDiasReales - totalDiasReportados) / 7 * 100) / 100
  };
}

const POST = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf");
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No se recibió archivo PDF." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return new Response(JSON.stringify({ error: "El archivo debe ser un PDF." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const images = await pdfToImages(buffer);
    if (images.length === 0) {
      return new Response(JSON.stringify({ error: "No se pudieron extraer páginas del PDF." }), {
        status: 422,
        headers: { "Content-Type": "application/json" }
      });
    }
    const ocrText = await ocrImages(images);
    const rawRecords = parseOcrText(ocrText);
    if (rawRecords.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No se encontraron registros de cotización en el PDF. Verifique que el documento sea una historia laboral de Colpensiones.",
          ocrPreview: ocrText.slice(0, 500)
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }
    const result = calcular(rawRecords);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[process.ts] Error:", err);
    return new Response(
      JSON.stringify({ error: `Error interno: ${err?.message ?? "desconocido"}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
