import { c as createComponent } from './astro-component_BBDOS8Wo.mjs';
import 'piccolore';
import { p as renderHead, r as renderComponent, q as renderTemplate } from './entrypoint_B2O3fZNk.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useRef, useCallback, useMemo } from 'react';

const PASOS = [
  "Extrayendo páginas del PDF…",
  "Reconociendo texto (OCR)…",
  "Analizando registros…",
  "Calculando semanas reales…"
];
function UploadZone({ onResult, onError }) {
  const [estado, setEstado] = useState("idle");
  const [paso, setPaso] = useState(0);
  const inputRef = useRef(null);
  const procesarArchivo = useCallback(
    async (file) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        onError("El archivo debe ser un PDF.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        onError("El archivo no puede superar 50 MB.");
        return;
      }
      setEstado("loading");
      setPaso(0);
      const interval = setInterval(() => {
        setPaso((p) => Math.min(p + 1, PASOS.length - 1));
      }, 4e3);
      try {
        const form = new FormData();
        form.append("pdf", file);
        const res = await fetch("/api/process", { method: "POST", body: form });
        clearInterval(interval);
        const json = await res.json();
        if (!res.ok || json.error) {
          onError(json.error ?? "Error al procesar el archivo.");
          setEstado("idle");
          return;
        }
        setEstado("done");
        onResult(json);
      } catch (e) {
        clearInterval(interval);
        onError(e?.message ?? "Error de red.");
        setEstado("idle");
      }
    },
    [onResult, onError]
  );
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setEstado("idle");
      const file = e.dataTransfer.files[0];
      if (file) procesarArchivo(file);
    },
    [procesarArchivo]
  );
  const onFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) procesarArchivo(file);
    },
    [procesarArchivo]
  );
  if (estado === "loading") {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-6 py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-gray-800", children: PASOS[paso] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Esto puede tomar 1–3 minutos según el tamaño del PDF." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: PASOS.map((_, i) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `h-2 w-8 rounded-full transition-all ${i <= paso ? "bg-blue-600" : "bg-gray-200"}`
        },
        i
      )) })
    ] });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onDragOver: (e) => {
        e.preventDefault();
        setEstado("dragover");
      },
      onDragLeave: () => setEstado("idle"),
      onDrop,
      onClick: () => inputRef.current?.click(),
      className: `
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-200 select-none
        ${estado === "dragover" ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"}
      `,
      children: [
        /* @__PURE__ */ jsx("input", { ref: inputRef, type: "file", accept: ".pdf", className: "hidden", onChange: onFileChange }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            }
          ) }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xl font-semibold text-gray-800", children: "Cargue la historia laboral" }),
            /* @__PURE__ */ jsxs("p", { className: "text-gray-500 mt-1", children: [
              "Arrastre el PDF aquí o ",
              /* @__PURE__ */ jsx("span", { className: "text-blue-600 font-medium", children: "haga clic para seleccionar" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-2", children: "Solo archivos PDF · Máximo 50 MB" })
          ] })
        ] })
      ]
    }
  );
}

function Card({ label, value, sub, accent }) {
  const colors = {
    green: "border-green-400 bg-green-50",
    red: "border-red-400 bg-red-50",
    blue: "border-blue-400 bg-blue-50",
    gray: "border-gray-200 bg-white"
  };
  const valueColors = {
    green: "text-green-700",
    red: "text-red-700",
    blue: "text-blue-700",
    gray: "text-gray-800"
  };
  const colorClass = colors[accent ?? "gray"];
  const valueClass = valueColors[accent ?? "gray"];
  return /* @__PURE__ */ jsxs("div", { className: `rounded-xl border-2 p-5 ${colorClass}`, children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-gray-500", children: label }),
    /* @__PURE__ */ jsx("p", { className: `text-3xl font-bold mt-1 ${valueClass}`, children: value }),
    sub && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: sub })
  ] });
}
function SummaryCards({ result }) {
  const { totalDiasReportados, totalDiasReales, semanasReportadas, semanasReales, diferenciaDias, diferenciaSemanas } = result;
  const difAccent = diferenciaDias > 0 ? "green" : diferenciaDias < 0 ? "red" : "gray";
  const difPrefix = diferenciaDias > 0 ? "+" : "";
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
    /* @__PURE__ */ jsx(
      Card,
      {
        label: "Días reportados",
        value: totalDiasReportados.toLocaleString("es-CO"),
        sub: `${semanasReportadas.toFixed(2)} semanas`,
        accent: "gray"
      }
    ),
    /* @__PURE__ */ jsx(
      Card,
      {
        label: "Días reales",
        value: totalDiasReales.toLocaleString("es-CO"),
        sub: `${semanasReales.toFixed(2)} semanas`,
        accent: "blue"
      }
    ),
    /* @__PURE__ */ jsx(
      Card,
      {
        label: "Semanas reales",
        value: semanasReales.toFixed(2),
        sub: "Según calendario",
        accent: "blue"
      }
    ),
    /* @__PURE__ */ jsx(
      Card,
      {
        label: "Diferencia",
        value: `${difPrefix}${diferenciaDias} días`,
        sub: `${difPrefix}${diferenciaSemanas.toFixed(2)} semanas`,
        accent: difAccent
      }
    )
  ] });
}

const REGLA_LABELS = {
  SIN_CAMBIO: "Sin cambio",
  MES_REAL_31: "Mes 31 días",
  MES_REAL_28: "Feb 28 días",
  MES_REAL_29_BISIESTO: "Feb 29 días (bisiesto)",
  MES_REAL_30: "Mes 30 días",
  RANGO_CALENDARIO: "Rango calendario",
  EXCEDE_DIAS_MES: "Excede días del mes",
  CERO_DIAS: "0 días",
  DUPLICADO: "Duplicado"
};
const REGLA_COLORS = {
  SIN_CAMBIO: "bg-gray-100 text-gray-700",
  MES_REAL_31: "bg-green-100 text-green-800",
  MES_REAL_28: "bg-yellow-100 text-yellow-800",
  MES_REAL_29_BISIESTO: "bg-blue-100 text-blue-800",
  MES_REAL_30: "bg-gray-100 text-gray-700",
  RANGO_CALENDARIO: "bg-purple-100 text-purple-800",
  EXCEDE_DIAS_MES: "bg-orange-100 text-orange-800",
  CERO_DIAS: "bg-red-100 text-red-700",
  DUPLICADO: "bg-red-100 text-red-700"
};

function RecordsTable({ registros }) {
  const [filtro, setFiltro] = useState("todos");
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
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      ["todos", "ajustados", "excluidos"].map((f) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setFiltro(f),
          className: `px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filtro === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
          children: [
            f === "todos" ? "Todos" : f === "ajustados" ? "Ajustados" : "Excluidos",
            /* @__PURE__ */ jsxs("span", { className: "ml-1.5 text-xs opacity-75", children: [
              "(",
              conteos[f],
              ")"
            ] })
          ]
        },
        f
      )),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Buscar periodo o empleador…",
          value: busqueda,
          onChange: (e) => setBusqueda(e.target.value),
          className: "ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-gray-200", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-gray-50 border-b border-gray-200", children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Tabla" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Periodo" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Empleador" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Días rep." }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Días reales" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Ajuste" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Regla" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-gray-100", children: [
        visibles.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-4 py-8 text-center text-gray-400", children: "No hay registros con este filtro." }) }),
        visibles.map((r, idx) => /* @__PURE__ */ jsxs(
          "tr",
          {
            className: `transition-colors ${r.excluido ? "bg-gray-50 opacity-60" : r.ajuste !== 0 ? "bg-white hover:bg-blue-50" : "bg-white hover:bg-gray-50"}`,
            children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-gray-500 max-w-[180px]", title: r.tabla, children: /* @__PURE__ */ jsx("span", { className: "line-clamp-2 leading-snug", children: r.tabla }) }),
              /* @__PURE__ */ jsx("td", { className: `px-4 py-3 font-mono font-medium ${r.excluido ? "line-through text-gray-400" : "text-gray-800"}`, children: r.periodo }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600 max-w-xs truncate", children: r.empleador }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right text-gray-600", children: r.diasReportados }),
              /* @__PURE__ */ jsx("td", { className: `px-4 py-3 text-right font-semibold ${r.excluido ? "text-gray-400" : "text-gray-800"}`, children: r.excluido ? "—" : r.diasReales }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: !r.excluido && r.ajuste !== 0 ? /* @__PURE__ */ jsxs("span", { className: `font-semibold ${r.ajuste > 0 ? "text-green-600" : "text-red-600"}`, children: [
                r.ajuste > 0 ? "+" : "",
                r.ajuste
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `inline-block px-2 py-0.5 rounded-full text-xs font-medium ${REGLA_COLORS[r.reglaAplicada]}`, children: REGLA_LABELS[r.reglaAplicada] }) })
            ]
          },
          idx
        ))
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400 text-right", children: [
      "Mostrando ",
      visibles.length,
      " de ",
      registros.length,
      " registros · Fila corresponde a línea OCR del PDF"
    ] })
  ] });
}

function ResultsView({ result, onReset }) {
  const totalRegistros = result.registros.length;
  const excluidos = result.registros.filter((r) => r.excluido).length;
  const ajustados = result.registros.filter((r) => !r.excluido && r.ajuste !== 0).length;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Resultado del análisis" }),
        /* @__PURE__ */ jsxs("p", { className: "text-gray-500 mt-1", children: [
          totalRegistros,
          " registros · ",
          ajustados,
          " ajustados · ",
          excluidos,
          " excluidos"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onReset,
          className: "flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" }) }),
            "Cargar otro PDF"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx(SummaryCards, { result }),
    /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800", children: [
      /* @__PURE__ */ jsx("strong", { children: "Metodología:" }),
      " Cuando un registro reporta 30 días, el sistema los reemplaza por los días reales del mes calendario. Períodos anteriores a 1995 se calculan como diferencia exacta de días entre fechas. Los registros duplicados y con 0 días se excluyen del total."
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-3", children: "Detalle por registro" }),
      /* @__PURE__ */ jsx(RecordsTable, { registros: result.registros })
    ] })
  ] });
}

function AppShell() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const handleResult = (r) => {
    setError(null);
    setResult(r);
  };
  const handleError = (msg) => {
    setError(msg);
    setResult(null);
  };
  const handleReset = () => {
    setResult(null);
    setError(null);
  };
  if (result) {
    return /* @__PURE__ */ jsx(ResultsView, { result, onReset: handleReset });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsx(UploadZone, { onResult: handleResult, onError: handleError }),
    error && /* @__PURE__ */ jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700", children: [
      /* @__PURE__ */ jsx("strong", { children: "Error:" }),
      " ",
      error
    ] })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="es" data-astro-cid-j7pv25f6> <head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Analizador de Semanas Pensionales · Colpensiones</title>${renderHead()}</head> <body class="min-h-screen bg-gray-50 text-gray-900" data-astro-cid-j7pv25f6> <!-- Header --> <header class="bg-white border-b border-gray-200 px-6 py-4" data-astro-cid-j7pv25f6> <div class="max-w-5xl mx-auto flex items-center gap-3" data-astro-cid-j7pv25f6> <div class="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center" data-astro-cid-j7pv25f6> <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-j7pv25f6> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" data-astro-cid-j7pv25f6></path> </svg> </div> <div data-astro-cid-j7pv25f6> <h1 class="text-lg font-bold text-gray-900 leading-tight" data-astro-cid-j7pv25f6>Semanas Pensionales</h1> <p class="text-xs text-gray-500" data-astro-cid-j7pv25f6>Recálculo por días calendario real · Colpensiones</p> </div> </div> </header> <!-- Main --> <main class="max-w-5xl mx-auto px-6 py-10" data-astro-cid-j7pv25f6> <!-- Intro --> <div class="mb-8" data-astro-cid-j7pv25f6> <h2 class="text-2xl font-bold text-gray-900" data-astro-cid-j7pv25f6>Análisis de historia laboral</h2> <p class="text-gray-600 mt-2 max-w-2xl" data-astro-cid-j7pv25f6>
Cargue el PDF de historia laboral de Colpensiones para recalcular las semanas cotizadas
          usando días calendario reales en lugar del criterio estándar de 30 días por mes.
</p> </div> <!-- App --> ${renderComponent($$result, "AppShell", AppShell, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/USUARIO/Documents/GIT PROJECTS/semanas_pensionales/src/components/AppShell.tsx", "client:component-export": "default", "data-astro-cid-j7pv25f6": true })} </main> <!-- Footer --> <footer class="mt-20 border-t border-gray-200 py-6 px-6 text-center text-xs text-gray-400" data-astro-cid-j7pv25f6>
Herramienta de apoyo jurídico · Los resultados son orientativos y deben validarse con el expediente original.
</footer> </body></html>`;
}, "C:/Users/USUARIO/Documents/GIT PROJECTS/semanas_pensionales/src/pages/index.astro", void 0);

const $$file = "C:/Users/USUARIO/Documents/GIT PROJECTS/semanas_pensionales/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
