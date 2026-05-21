import type { RawRecord, ProcessedRecord, ReglaCodigo, AnalysisResult } from "./types.ts";
import { deduplicar, isDuplicado } from "./deduplicator.ts";
import { parseFecha } from "./parser.ts";

function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

const MESES_31 = new Set([1, 3, 5, 7, 8, 10, 12]);

function diasEnMes(anio: number, mes: number): number {
  if (MESES_31.has(mes)) return 31;
  if (mes === 2) return esBisiesto(anio) ? 29 : 28;
  return 30;
}

function reglaMes(anio: number, mes: number): ReglaCodigo {
  const dias = diasEnMes(anio, mes);
  if (mes === 2 && dias === 29) return "MES_REAL_29_BISIESTO";
  if (mes === 2) return "MES_REAL_28";
  if (dias === 31) return "MES_REAL_31";
  return "MES_REAL_30";
}

function procesarMensual(r: RawRecord): ProcessedRecord {
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

function procesarRango(r: RawRecord): ProcessedRecord {
  if (!r.fechaDesde || !r.fechaHasta) {
    return { ...r, diasReales: r.diasReportados, ajuste: 0, reglaAplicada: "RANGO_CALENDARIO", excluido: false };
  }

  const f1 = parseFecha(r.fechaDesde);
  const f2 = parseFecha(r.fechaHasta);

  if (!f1 || !f2) {
    return { ...r, diasReales: r.diasReportados, ajuste: 0, reglaAplicada: "RANGO_CALENDARIO", excluido: false };
  }

  const diffMs = Math.abs(f2.getTime() - f1.getTime());
  const diasReales = Math.round(diffMs / 86_400_000) + 1;

  return { ...r, diasReales, ajuste: diasReales - r.diasReportados, reglaAplicada: "RANGO_CALENDARIO", excluido: false };
}

export function calcular(rawRecords: RawRecord[]): AnalysisResult {
  const marcados = deduplicar(rawRecords);

  const registros: ProcessedRecord[] = marcados.map((r) => {
    if (isDuplicado(r)) {
      return { ...r, diasReales: 0, ajuste: 0, reglaAplicada: "DUPLICADO" as ReglaCodigo, excluido: true, razonExclusion: "Registro duplicado" };
    }
    if (r.diasReportados === 0) {
      return { ...r, diasReales: 0, ajuste: 0, reglaAplicada: "CERO_DIAS", excluido: true, razonExclusion: "0 días cotizados" };
    }
    return r.tipo === "rango" ? procesarRango(r) : procesarMensual(r);
  });

  const { totalDiasReportados, totalDiasReales } = registros.reduce(
    (acc, r) => r.excluido ? acc : {
      totalDiasReportados: acc.totalDiasReportados + r.diasReportados,
      totalDiasReales: acc.totalDiasReales + r.diasReales,
    },
    { totalDiasReportados: 0, totalDiasReales: 0 }
  );

  return {
    registros,
    totalDiasReportados,
    totalDiasReales,
    semanasReportadas: Math.round((totalDiasReportados / 7) * 100) / 100,
    semanasReales: Math.round((totalDiasReales / 7) * 100) / 100,
    diferenciaDias: totalDiasReales - totalDiasReportados,
    diferenciaSemanas: Math.round(((totalDiasReales - totalDiasReportados) / 7) * 100) / 100,
  };
}
