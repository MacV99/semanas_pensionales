import { readFileSync } from "fs";

const PERIODO_POST95 = /\b(199[5-9]|200\d|201\d|202[0-5])(0[1-9]|1[0-2])\b/;
const FECHA_PAIR = /(\d{2}\/\d{2}\/(?:19|20)\d{2})\s+(\d{2}\/\d{2}\/(?:19|20)\d{2})/;
const NIT_START = /^\s*[[(.]?(\d{7,11})[).\]\s]/;
const ES_APORTE_DEVUELTO = /aporte\s*devuelto/i;
const ES_CICLO_DOBLE = /ci[celo]{1,2}lo?\s*doble/i;
const ES_ALL_ZERO = /(?:so[).\]]\s*){2,}(?:ojo|jojo|lolo|[oO]jo)/;
const MARKER_PRE95  = /detalle\s+de\s+pagos\s+efectuados\s+anteriores\s+a\s+1995/i;
const MARKER_POST95 = /detalle\s+de\s+pagos\s+efectuados\s+a\s+partir\s+de\s+1995/i;

function parseFecha(raw) {
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function extractDias(line) {
  const cleaned = line
    .replace(/\s*(?:declarado|ahorro|pago\s+(?:recibido|aplicado)|valor\s+devuelto|nividual|nividuol|velado|aporte|ci[celo]{1,2}lo|r[eé]gimen|regimen|individual|traslado|fondo|aa\s+[oa]\s+mi|\*{2,}|=+|ojo|jojo|lolo|flojo).*$/i, "")
    .replace(/\$\s*[\d.,]+/g, " ")
    .replace(/[—–-]\s*\$?\s*[\d.,]{4,}/g, " ")
    .replace(/\d{2}\/\d{2}\/\d{4}/g, " ")
    .replace(/\d{1,3}[.,]\d{3}[.,]\d{3}/g, " ")
    .replace(/[a-zA-Z\d]{6,}/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/[oO]\s*[oO]\s*[oO]/g, " ");
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

const Seccion = { INICIO: 0, PRE95: 1, POST95: 2 };

function parseOcrText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const records = [];
  let seccion = Seccion.INICIO;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (MARKER_PRE95.test(line))  { seccion = Seccion.PRE95;  continue; }
    if (MARKER_POST95.test(line)) { seccion = Seccion.POST95; continue; }

    if (seccion === Seccion.PRE95 || (seccion === Seccion.INICIO && FECHA_PAIR.test(line))) {
      const pm = line.match(FECHA_PAIR);
      if (pm) {
        const f1 = parseFecha(pm[1]), f2 = parseFecha(pm[2]);
        if (f1 && f2) {
          const dias = Math.round(Math.abs(f2 - f1) / 86400000) + 1;
          records.push({ periodo: `${pm[1]} -> ${pm[2]}`, tipo: "rango", diasReportados: dias, empleador: extractNit(line), lineaOriginal: i + 1 });
        }
      }
      continue;
    }

    if (seccion !== Seccion.POST95) continue;
    if (ES_APORTE_DEVUELTO.test(line) || ES_CICLO_DOBLE.test(line) || ES_ALL_ZERO.test(line)) continue;

    const pm = line.match(PERIODO_POST95);
    if (!pm) continue;
    const dias = extractDias(line);
    if (dias === null) continue;

    records.push({ periodo: pm[1] + "-" + pm[2], tipo: "mensual", diasReportados: dias, empleador: extractNit(line), lineaOriginal: i + 1 });
  }
  return records;
}

const text = readFileSync("test-ocr-output.txt", "utf8") + "\n" + readFileSync("test-pages4-8.txt", "utf8");
const records = parseOcrText(text);
const allFilteredLines = text.split("\n").map(l => l.trim()).filter(Boolean);

const sospechosos = records.filter(r => r.tipo === "mensual" && r.diasReportados < 20);
if (sospechosos.length > 0) {
  console.log("Registros con dias < 20:");
  sospechosos.forEach(r => console.log(`  [L${r.lineaOriginal}] ${r.periodo} Dias:${r.diasReportados} | ${allFilteredLines[r.lineaOriginal - 1]?.slice(0, 100)}`));
}

console.log(`\nTotal registros: ${records.length} (mensuales: ${records.filter(r=>r.tipo==="mensual").length}, rangos: ${records.filter(r=>r.tipo==="rango").length})`);

console.log("\nTodos los registros:");
records.forEach(r => {
  const flag = r.diasReportados < 20 ? " ⚠" : "";
  console.log(`  ${r.periodo.padEnd(28)} Dias:${String(r.diasReportados).padStart(2)} NIT:${r.empleador}${flag}`);
});

const totalDias = records.reduce((s, r) => s + r.diasReportados, 0);
console.log(`\nTotal dias reportados (sin dedup): ${totalDias}  |  Semanas: ${(totalDias/7).toFixed(2)}`);
process.exit(0);
