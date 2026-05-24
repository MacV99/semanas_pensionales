import { useState, useRef, useCallback } from "react";
import type { AnalysisResult } from "../lib/types.ts";
// @ts-ignore — Vite resolves ?url at build time
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

interface Props {
  onResult: (result: AnalysisResult) => void;
  onError: (msg: string) => void;
}

type Estado = "idle" | "dragover" | "loading" | "done";

async function pdfToTexto(
  file: File,
  onProgress: (pagina: number, total: number) => void
): Promise<string> {
  // 1. Cargar PDF
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({
    data: arrayBuffer,
    wasmUrl: "/pdfjs-wasm/",
  }).promise;
  const total = pdf.numPages;

  // 2. Cargar Tesseract
  const { createWorker } = await import("tesseract.js");
  const tessWorker = await createWorker("spa", 1, { logger: () => {} });
  await tessWorker.setParameters({
    tessedit_pageseg_mode: "1" as any,
    preserve_interword_spaces: "1",
  });

  const pages: string[] = [];

  for (let i = 1; i <= total; i++) {
    onProgress(i, total);

    // Renderizar página a canvas
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // OCR en el canvas
    const { data } = await tessWorker.recognize(canvas);
    pages.push(data.text);
  }

  await tessWorker.terminate();
  return pages.join("\n--- PAGE BREAK ---\n");
}

export default function UploadZone({ onResult, onError }: Props) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [progreso, setProgreso] = useState({ pagina: 0, total: 0, fase: "" });
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
      setProgreso({ pagina: 0, total: 0, fase: "Iniciando…" });

      try {
        // OCR en el browser
        const text = await pdfToTexto(file, (pagina, total) => {
          setProgreso({ pagina, total, fase: `Reconociendo página ${pagina} de ${total}…` });
        });

        // Enviar texto al API
        setProgreso({ pagina: 0, total: 0, fase: "Calculando semanas reales…" });
        const res = await fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const json = await res.json();

        if (!res.ok || json.error) {
          onError(json.error ?? "Error al procesar el archivo.");
          setEstado("idle");
          return;
        }

        setEstado("done");
        onResult(json as AnalysisResult);
      } catch (e: any) {
        onError(e?.message ?? "Error al procesar el PDF.");
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
    const { pagina, total, fase } = progreso;
    const pct = total > 0 ? Math.round((pagina / total) * 100) : null;

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">{fase}</p>
          {pct !== null && (
            <p className="text-sm text-gray-500 mt-1">
              Esto puede tomar varios minutos según el tamaño del PDF.
            </p>
          )}
        </div>
        {pct !== null && (
          <div className="w-64">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center mt-1">{pct}%</p>
          </div>
        )}
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
