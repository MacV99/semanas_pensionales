export type ReglaCodigo =
  | "SIN_CAMBIO"
  | "MES_REAL_31"
  | "MES_REAL_28"
  | "MES_REAL_29_BISIESTO"
  | "MES_REAL_30"
  | "RANGO_CALENDARIO"
  | "EXCEDE_DIAS_MES"
  | "CERO_DIAS"
  | "DUPLICADO";

export interface RawRecord {
  periodo: string;
  fechaDesde?: string;
  fechaHasta?: string;
  tipo: "mensual" | "rango";
  tabla: string;
  diasReportados: number;
  empleador: string;
  lineaOriginal: number;
  _duplicado?: boolean;
}

export interface ProcessedRecord extends RawRecord {
  diasReales: number;
  ajuste: number;
  reglaAplicada: ReglaCodigo;
  excluido: boolean;
  razonExclusion?: string;
}

export interface AnalysisResult {
  registros: ProcessedRecord[];
  totalDiasReportados: number;
  totalDiasReales: number;
  semanasReportadas: number;
  semanasReales: number;
  diferenciaDias: number;
  diferenciaSemanas: number;
}

export const REGLA_LABELS: Record<ReglaCodigo, string> = {
  SIN_CAMBIO: "Sin cambio",
  MES_REAL_31: "Mes 31 días",
  MES_REAL_28: "Feb 28 días",
  MES_REAL_29_BISIESTO: "Feb 29 días (bisiesto)",
  MES_REAL_30: "Mes 30 días",
  RANGO_CALENDARIO: "Rango calendario",
  EXCEDE_DIAS_MES: "Excede días del mes",
  CERO_DIAS: "0 días",
  DUPLICADO: "Duplicado",
};

export const REGLA_COLORS: Record<ReglaCodigo, string> = {
  SIN_CAMBIO: "bg-gray-100 text-gray-700",
  MES_REAL_31: "bg-green-100 text-green-800",
  MES_REAL_28: "bg-yellow-100 text-yellow-800",
  MES_REAL_29_BISIESTO: "bg-blue-100 text-blue-800",
  MES_REAL_30: "bg-gray-100 text-gray-700",
  RANGO_CALENDARIO: "bg-purple-100 text-purple-800",
  EXCEDE_DIAS_MES: "bg-orange-100 text-orange-800",
  CERO_DIAS: "bg-red-100 text-red-700",
  DUPLICADO: "bg-red-100 text-red-700",
};
