import type { AnalysisResult } from "../lib/types.ts";
import SummaryCards from "./SummaryCards.tsx";
import RecordsTable from "./RecordsTable.tsx";

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

export default function ResultsView({ result, onReset }: Props) {
  const totalRegistros = result.registros.length;
  const excluidos = result.registros.filter((r) => r.excluido).length;
  const ajustados = result.registros.filter((r) => !r.excluido && r.ajuste !== 0).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resultado del análisis</h2>
          <p className="text-gray-500 mt-1">
            {totalRegistros} registros · {ajustados} ajustados · {excluidos} excluidos
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Cargar otro PDF
        </button>
      </div>

      {/* Summary */}
      <SummaryCards result={result} />

      {/* Explanation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Metodología:</strong> Cuando un registro reporta 30 días, el sistema los reemplaza
        por los días reales del mes calendario. Períodos anteriores a 1995 se calculan como diferencia
        exacta de días entre fechas. Los registros duplicados y con 0 días se excluyen del total.
      </div>

      {/* Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalle por registro</h3>
        <RecordsTable registros={result.registros} />
      </div>
    </div>
  );
}
