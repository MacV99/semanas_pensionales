import type { AnalysisResult } from "../lib/types.ts";

interface Props {
  result: AnalysisResult;
}

function Card({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "green" | "red" | "blue" | "gray" }) {
  const colors = {
    green: "border-green-400 bg-green-50",
    red: "border-red-400 bg-red-50",
    blue: "border-blue-400 bg-blue-50",
    gray: "border-gray-200 bg-white",
  };
  const valueColors = {
    green: "text-green-700",
    red: "text-red-700",
    blue: "text-blue-700",
    gray: "text-gray-800",
  };

  const colorClass = colors[accent ?? "gray"];
  const valueClass = valueColors[accent ?? "gray"];

  return (
    <div className={`rounded-xl border-2 p-5 ${colorClass}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${valueClass}`}>{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function SummaryCards({ result }: Props) {
  const { totalDiasReportados, totalDiasReales, semanasReportadas, semanasReales, diferenciaDias, diferenciaSemanas } = result;

  const difAccent = diferenciaDias > 0 ? "green" : diferenciaDias < 0 ? "red" : "gray";
  const difPrefix = diferenciaDias > 0 ? "+" : "";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card
        label="Días reportados"
        value={totalDiasReportados.toLocaleString("es-CO")}
        sub={`${semanasReportadas.toFixed(2)} semanas`}
        accent="gray"
      />
      <Card
        label="Días reales"
        value={totalDiasReales.toLocaleString("es-CO")}
        sub={`${semanasReales.toFixed(2)} semanas`}
        accent="blue"
      />
      <Card
        label="Semanas reales"
        value={semanasReales.toFixed(2)}
        sub="Según calendario"
        accent="blue"
      />
      <Card
        label="Diferencia"
        value={`${difPrefix}${diferenciaDias} días`}
        sub={`${difPrefix}${diferenciaSemanas.toFixed(2)} semanas`}
        accent={difAccent}
      />
    </div>
  );
}
