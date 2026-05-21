import { useState, useRef, useCallback } from "react";
import type { AnalysisResult } from "../lib/types.ts";

interface Props {
  onResult: (result: AnalysisResult) => void;
  onError: (msg: string) => void;
}

type Estado = "idle" | "dragover" | "loading" | "done";

const PASOS = [
  "Extrayendo páginas del PDF…",
  "Reconociendo texto (OCR)…",
  "Analizando registros…",
  "Calculando semanas reales…",
];

export default function UploadZone({ onResult, onError }: Props) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [paso, setPaso] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const procesarArchivo = useCallback(
    async (file: File) => {
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

      // Simulate step progression while waiting
      const interval = setInterval(() => {
        setPaso((p) => Math.min(p + 1, PASOS.length - 1));
      }, 4000);

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
        onResult(json as AnalysisResult);
      } catch (e: any) {
        clearInterval(interval);
        onError(e?.message ?? "Error de red.");
        setEstado("idle");
      }
    },
    [onResult, onError]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setEstado("idle");
      const file = e.dataTransfer.files[0];
      if (file) procesarArchivo(file);
    },
    [procesarArchivo]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) procesarArchivo(file);
    },
    [procesarArchivo]
  );

  if (estado === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">{PASOS[paso]}</p>
          <p className="text-sm text-gray-500 mt-1">Esto puede tomar 1–3 minutos según el tamaño del PDF.</p>
        </div>
        <div className="flex gap-2">
          {PASOS.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all ${i <= paso ? "bg-blue-600" : "bg-gray-200"}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setEstado("dragover"); }}
      onDragLeave={() => setEstado("idle")}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-200 select-none
        ${estado === "dragover"
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"}
      `}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />

      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-semibold text-gray-800">Cargue la historia laboral</p>
          <p className="text-gray-500 mt-1">
            Arrastre el PDF aquí o <span className="text-blue-600 font-medium">haga clic para seleccionar</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">Solo archivos PDF · Máximo 50 MB</p>
        </div>
      </div>
    </div>
  );
}
