import { useState } from "react";
import type { AnalysisResult } from "../lib/types.ts";
import UploadZone from "./UploadZone.tsx";
import ResultsView from "./ResultsView.tsx";

export default function AppShell() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResult = (r: AnalysisResult) => {
    setError(null);
    setResult(r);
  };

  const handleError = (msg: string) => {
    setError(msg);
    setResult(null);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  if (result) {
    return <ResultsView result={result} onReset={handleReset} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone onResult={handleResult} onError={handleError} />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
