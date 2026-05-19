import React from "react";
import { type Phase, type ScanResult } from "@/hooks/use-doctor-scan";
import { NoctraButton } from "@/components/Primitives";
import { Stethoscope, Loader2, CheckCircle, ArrowRight, AlertTriangle, RotateCcw, XCircle, FileCode, Github, Shield } from "lucide-react";

const GATE_ICON: Record<string, React.ReactNode> = {
  GREEN: <CheckCircle size={13} style={{ color: "var(--noctra-emerald)" }} />,
  YELLOW: <AlertTriangle size={13} style={{ color: "var(--noctra-amber)" }} />,
  RED: <XCircle size={13} style={{ color: "var(--noctra-rose)" }} />,
};
const GATE_COLOR: Record<string, string> = {
  GREEN: "var(--noctra-emerald)", YELLOW: "var(--noctra-amber)", RED: "var(--noctra-rose)",
};

const EXAMPLE_REPOS = [
  { name: "nextjs-ecommerce", desc: "Next.js + Stripe storefront" },
  { name: "fastapi-backend", desc: "FastAPI + PostgreSQL API" },
  { name: "react-dashboard", desc: "React admin dashboard" },
];

export function DoctorInputPanel(props: {
  phase: Phase; scanResult: ScanResult | null; zipFile: File | null; error: string;
  dragOver: boolean; accent: string; fileRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (file: File) => Promise<void>; reset: () => void; setDragOver: (v: boolean) => void;
}) {
  const { phase, scanResult, zipFile, error, dragOver, accent, fileRef, handleFileSelect, reset, setDragOver } = props;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file && phase === "idle") handleFileSelect(file); }}
        onClick={() => phase === "idle" && fileRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center transition-all"
        style={{
          borderColor: dragOver ? accent : phase === "done" ? "var(--noctra-emerald)" : phase !== "idle" ? accent : "var(--noctra-border)",
          background: dragOver ? `${accent}08` : phase === "done" ? "rgba(16,185,129,0.05)" : "var(--noctra-surface2)",
          cursor: phase === "idle" ? "pointer" : "default",
        }}
      >
        <input ref={fileRef} type="file" accept=".zip" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        />
        {phase === "done" ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle size={22} style={{ color: "var(--noctra-emerald)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--noctra-emerald)" }}>{zipFile?.name}</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              {scanResult?.scan?.fileCount ?? "?"} files · Report saved · Fix queue generated
            </p>
          </div>
        ) : phase !== "idle" ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
            <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{zipFile?.name}</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              {phase === "scanning" ? "Deep scanning codebase…" : phase === "diagnosing" ? "AI diagnosing launch blockers…" : "Generating fix tasks and build prompt…"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${accent}14` }}>
              <Stethoscope size={24} style={{ color: accent }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>Upload your project ZIP</p>
            <p className="text-xs max-w-sm" style={{ color: "var(--noctra-text-muted)" }}>
              Drop your repository .zip here or click to browse. Max 50MB. Your code is never stored.
            </p>
            <div className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${accent}14`, color: accent }}>
              <Shield size={10} /> Scans · Diagnoses · Generates fix tasks & build prompt
            </div>
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Try an example repo</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_REPOS.map((repo) => (
              <button key={repo.name} onClick={() => {}} disabled
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs opacity-40 cursor-not-allowed"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
              >
                <Github size={10} /> {repo.name}
                <span className="text-[9px] ml-1" style={{ color: "var(--noctra-text-muted)" }}>coming soon</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {scanResult?.launchGates && scanResult.launchGates.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Launch Gates</p>
          <div className="space-y-1.5">
            {scanResult.launchGates.slice(0, 6).map((gate, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: `1px solid ${GATE_COLOR[gate.status]}22` }}>
                {GATE_ICON[gate.status]}
                <span className="text-xs flex-1" style={{ color: "var(--noctra-text)" }}>{gate.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${GATE_COLOR[gate.status]}18`, color: GATE_COLOR[gate.status] }}>{gate.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "error" && error && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <AlertTriangle size={13} style={{ color: "var(--noctra-rose)", marginTop: 1 }} />
            <p className="text-xs" style={{ color: "var(--noctra-rose)" }}>{error}</p>
          </div>
          <NoctraButton variant="ghost" onClick={reset} className="w-full"><RotateCcw size={13} /> Try Again</NoctraButton>
        </div>
      )}

      {phase === "done" && (
        <NoctraButton variant="ghost" onClick={reset} className="w-full"><RotateCcw size={13} /> Diagnose Another Repo</NoctraButton>
      )}

      {phase === "idle" && (
        <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
          <p style={{ color: "var(--noctra-text-muted)" }}>
            <Shield size={10} style={{ color: "var(--noctra-cyan)" }} /> Your code privacy matters.{' '}
            <a href="/privacy" className="underline hover:opacity-80" style={{ color: "var(--noctra-cyan)" }}>Learn how we handle your data</a>
          </p>
          <p className="mt-1" style={{ color: "var(--noctra-text-muted)" }}>
            Summarized code signals and redacted snippets are sent to AI to generate your report. Raw source is never stored. Secrets are detected and redacted.
          </p>
          <p className="mt-1.5 px-2 py-1 rounded text-[11px]" style={{ background: "rgba(245,158,11,0.08)", color: "var(--noctra-amber)" }}>
            Do not upload secrets, API keys, or highly sensitive repositories during beta. We detect and redact common secret patterns, but you should review and remove any sensitive data before uploading.
          </p>
        </div>
      )}
    </div>
  );
}
