import type { RawRecord } from "./types.ts";

// ─── Patterns from real Colpensiones OCR output ───────────────────────────

const PERIODO_POST95 = /\b(199[5-9]|200\d|201\d|202[0-5])(0[1-9]|1[0-2])\b/;
const FECHA_PAIR = /(\d{2}\/\d{2}\/(?:19|20)\d{2})\s+(\d{2}\/\d{2}\/(?:19|20)\d{2})/;
const NIT_START = /^\s*[[(.]?(\d{7,11})[).\]\s]/;

const ES_APORTE_DEVUELTO = /aporte\s*devuelto/i;
// Match "Ciclo Doble" and OCR variants: cielo, cicio, cicto
const ES_CICLO_DOBLE = /ci[celo]{1,2}lo?\s*doble/i;
// Detect all-zero rows by "so) so) ojo" OCR pattern (reversed transactions)
const ES_ALL_ZERO = /(?:so[).\]]\s*){2,}(?:ojo|jojo|lolo|[oO]jo)/;

// Known section headers in Colpensiones history documents
const SECCIONES: { pattern: RegExp; logica: "pre95" | "post95" | "ignorar" }[] = [
  { pattern: /detalle\s+de\s+pagos\s+efectuados\s+anteriores\s+a\s+1995/i,    logica: "pre95"   },
  { pattern: /detalle\s+de\s+pagos\s+efectuados\s+a\s+partir\s+de\s+1995/i,  logica: "post95"  },
  { pattern: /resumen\s+de\s+semanas\s+cotizadas/i,                            logica: "ignorar" },
  { pattern: /resumen\s+de\s+tiempos?\s+p[uú]blicos?/i,                       logica: "ignorar" },
  { pattern: /tiempos?\s+p[uú]blicos?/i,                                       logica: "ignorar" },
  { pattern: /historia\s+laboral/i,                                             logica: "ignorar" },
];

function normalizarEncabezado(line: string): string {
  return line
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^a-záéíóúüñA-Z]+/, "")  // strip leading junk chars
    .replace(/[^a-záéíóúüñA-Z0-9 ]+$/i, "") // strip trailing junk chars
    .trim();
}

export function parseFecha(raw: string): Date | null {
  const dmy = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const iso = raw.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return null;
}

function extractDiasPost95(line: string): number | null {
  const cleaned = line
    // Strip observacion keywords + everything after (including OCR variants of "pago")
    .replace(/\s*(?:declarado|ahorro|pago?\s+(?:recibido|aplicado)|valor\s+devuelto|nividual|nividuol|velado|aporte|ci[celo]{1,2}lo|r[eé]gimen|regimen|individual|traslado|fondo|aa\s+[oa]\s+mi|\*{2,}|=+|ojo|jojo|lolo|flojo|pao\s|peg[oa]).*$/i, "")
    // Strip dollar amounts — with or without space after $
    .replace(/\$\s*[\d.,]+/g, " ")
    // Strip em-dash prefixed amounts (—$ or — $)
    .replace(/[—–-]\s*\$?\s*[\d.,]{4,}/g, " ")
    // Strip dates (07/06/1996)
    .replace(/\d{2}\/\d{2}\/\d{4}/g, " ")
    // Strip salary-format numbers: 1.416.190 or 1,416,190
    .replace(/\d{1,3}[.,]\d{3}[.,]\d{3}/g, " ")
    // Strip long alphanumeric tokens (NITs, references >= 6 chars)
    .replace(/[a-zA-Z\d]{6,}/g, " ")
    // Strip standalone 4+ digit numbers
    .replace(/\b\d{4,}\b/g, " ")
    // Strip "so so ojo" OCR zero-amount markers
    .replace(/[oO]\s*[oO]\s*[oO]/g, " ")
    // Fix OCR misreads of "30" in días column (a0/ao/s0/S0 → 30)
    .replace(/\b[aAsS][0Oo]\b/g, "30")
    .replace(/\bao\b/gi, "30");

  const matches = [...cleaned.matchAll(/\b(\d{1,2})\b/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const n = parseInt(matches[i][1], 10);
    if (n >= 1 && n <= 31) return n;
  }
  return null;
}

function extractNit(line: string): string {
  const m = line.match(NIT_START);
  return m ? m[1] : "DESCONOCIDO";
}

export function parseOcrText(text: string): RawRecord[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const records: RawRecord[] = [];

  type Logica = "inicio" | "pre95" | "post95" | "ignorar";
  let logicaActual: Logica = "inicio";
  let tablaActual = "Detalle de pagos anteriores a 1995";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section change
    const seccionDetectada = SECCIONES.find(({ pattern }) => pattern.test(line));
    if (seccionDetectada) {
      logicaActual = seccionDetectada.logica;
      tablaActual = normalizarEncabezado(line);
      continue;
    }

    // ── PRE-1995 ──────────────────────────────────────────────────────────
    if (logicaActual === "pre95" || (logicaActual === "inicio" && FECHA_PAIR.test(line))) {
      const pairMatch = line.match(FECHA_PAIR);
      if (pairMatch) {
        const f1 = parseFecha(pairMatch[1]);
        const f2 = parseFecha(pairMatch[2]);
        if (f1 && f2) {
          const diffMs = Math.abs(f2.getTime() - f1.getTime());
          const diasCalendario = Math.round(diffMs / 86_400_000) + 1;
          records.push({
            periodo: `${pairMatch[1]} -> ${pairMatch[2]}`,
            fechaDesde: pairMatch[1],
            fechaHasta: pairMatch[2],
            tipo: "rango",
            tabla: tablaActual,
            diasReportados: diasCalendario,
            empleador: extractNit(line),
            lineaOriginal: i + 1,
          });
        }
      }
      continue;
    }

    // ── POST-1995 ─────────────────────────────────────────────────────────
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
      lineaOriginal: i + 1,
    });
  }

  return records;
}
