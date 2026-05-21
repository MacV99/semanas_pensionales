import type { RawRecord } from "./types.ts";

export function deduplicar(records: RawRecord[]): RawRecord[] {
  const seen = new Set<string>();
  return records.map((r) => {
    const key = `${r.periodo}|${r.empleador.toLowerCase()}`;
    if (seen.has(key)) return { ...r, _duplicado: true };
    seen.add(key);
    return r;
  });
}

export function isDuplicado(r: RawRecord): boolean {
  return r._duplicado === true;
}
