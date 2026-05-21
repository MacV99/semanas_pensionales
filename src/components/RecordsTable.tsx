import { useState, useMemo } from "react";
import type { ProcessedRecord } from "../lib/types.ts";
import { REGLA_LABELS, REGLA_COLORS } from "../lib/types.ts";

interface Props {
  registros: ProcessedRecord[];
}

type Filtro = "todos" | "ajustados" | "excluidos";

export default function RecordsTable({ registros }: Props) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");

  const visibles = useMemo(() => {
    let list = registros;
    if (filtro === "ajustados") list = list.filter((r) => !r.excluido && r.ajuste !== 0);
    if (filtro === "excluidos") list = list.filter((r) => r.excluido);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(
        (r) => r.periodo.toLowerCase().includes(q) || r.empleador.toLowerCase().includes(q)
      );
    }
    return list;
  }, [registros, filtro, busqueda]);

  const conteos = useMemo(() => {
    let ajustados = 0, excluidos = 0;
    for (const r of registros) {
      if (r.excluido) excluidos++;
      else if (r.ajuste !== 0) ajustados++;
    }
    return { todos: registros.length, ajustados, excluidos };
  }, [registros]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {(["todos", "ajustados", "excluidos"] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filtro === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "todos" ? "Todos" : f === "ajustados" ? "Ajustados" : "Excluidos"}
            <span className="ml-1.5 text-xs opacity-75">({conteos[f]})</span>
          </button>
        ))}
        <input
          type="text"
          placeholder="Buscar periodo o empleador…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tabla</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Periodo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empleador</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Días rep.</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Días reales</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ajuste</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Regla</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No hay registros con este filtro.
                </td>
              </tr>
            )}
            {visibles.map((r, idx) => (
              <tr
                key={idx}
                className={`transition-colors ${
                  r.excluido
                    ? "bg-gray-50 opacity-60"
                    : r.ajuste !== 0
                    ? "bg-white hover:bg-blue-50"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px]" title={r.tabla}>
                  <span className="line-clamp-2 leading-snug">{r.tabla}</span>
                </td>
                <td className={`px-4 py-3 font-mono font-medium ${r.excluido ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {r.periodo}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.empleador}</td>
                <td className="px-4 py-3 text-right text-gray-600">{r.diasReportados}</td>
                <td className={`px-4 py-3 text-right font-semibold ${r.excluido ? "text-gray-400" : "text-gray-800"}`}>
                  {r.excluido ? "—" : r.diasReales}
                </td>
                <td className="px-4 py-3 text-right">
                  {!r.excluido && r.ajuste !== 0 ? (
                    <span className={`font-semibold ${r.ajuste > 0 ? "text-green-600" : "text-red-600"}`}>
                      {r.ajuste > 0 ? "+" : ""}{r.ajuste}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${REGLA_COLORS[r.reglaAplicada]}`}>
                    {REGLA_LABELS[r.reglaAplicada]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 text-right">
        Mostrando {visibles.length} de {registros.length} registros · Fila corresponde a línea OCR del PDF
      </p>
    </div>
  );
}
