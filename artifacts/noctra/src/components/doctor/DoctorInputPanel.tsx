import React from "react";
import { type Phase, type ScanResult } from "@/hooks/use-doctor-scan";
import { NoctraButton } from "@/components/Primitives";
import { Stethoscope, Loader2, CheckCircle, ArrowRight, AlertTriangle, RotateCcw, XCircle, FileCode, Github, Shield, Upload, AlertCircle } from "lucide-react";

const GATE_ICON: Record<string, React.ReactNode> = {
  GREEN: <CheckCircle size={13} style={{ color: "var(--noctra-emerald)" }} />,
  YELLOW: <AlertTriangle size={13} style={{ color: "var(--noctra-amber)" }} />,
  RED: <XCircle size={13} style={{ color: "var(--noctra-rose)" }} />,
};
const GATE_COLOR: Record<string, string> = {
  GREEN: "var(--noctra-emerald)", YELLOW: "var(--noctra-amber)", RED: "var(--noctra-rose)",
};

const EXAMPLE_REPOS = [
  { name: "nextjs-ecommerce", desc: "Next.js + Stripe storefront", url: "https://github.com/vercel/next.js/archive/refs/heads/canary.zip" },
  { name: "fastapi-backend", desc: "FastAPI + PostgreSQL API", url: "" },
  { name: "react-dashboard", desc: "React admin dashboard", url: "" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DoctorInputPanel(props: {
  phase: Phase; scanResult: ScanResult | null; zipFile: File | null; error: string;
  dragOver: boolean; accent: string; fileRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (file: File) => Promise<void>; reset: () => void; setDragOver: (v: boolean) => void;
}) {
  const { phase, scanResult, zipFile, error, dragOver, accent, fileRef, handleFileSelect, reset, setDragOver } = props;
  const fileSize = zipFile ? formatFileSize(zipFile.size) : null;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file && phase === "idle") handleFileSelect(file); }}
        onClick={() => phase === "idle" && fileRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200"
        style={{
          borderColor: dragOver ? accent : phase === "done" ? "var(--noctra-emerald)" : phase !== "idle" ? accent : "var(--noctra-border)",
          background: dragOver ? `${accent}10` : phase === "done" ? "rgba(16,185,129,0.05)" : "var(--noctra-surface2)",
          cursor: phase === "idle" ? "pointer" : "default",
          transform: dragOver ? "scale(1.01)" : "scale(1)",
        }}
      >
        <input ref={fileRef} type="file" accept=".zip" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        />
        {phase === "done" ? (
          <div className="flex flex-col items-center gap-2 animate-fade-in">
            <CheckCircle size={22} style={{ color: "var(--noctra-emerald)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--noctra-emerald)" }}>{zipFile?.name}</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              {scanResult?.scan?.fileCount ?? "?"} files · {fileSize} · Report saved
            </p>
          </div>
        ) : phase !== "idle" ? (
          <div className="flex flex-col items-center gap-2 animate-fade-in">
            <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
            <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{zipFile?.name}</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              {fileSize && <span className="mr-2">{fileSize}</span>}
              {phase === "scanning" ? "Scanning codebase & evaluating launch gates..." 
                : phase === "diagnosing" ? "AI diagnosing blockers & risks..."
                : "Generating fix tasks & build prompt..."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${accent}14` }}>
              <Upload size={26} style={{ color: accent }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>Upload your project ZIP</p>
            <p className="text-xs max-w-sm" style={{ color: "var(--noctra-text-muted)" }}>
              Drop your repository .zip here or click to browse. Max 50MB.
            </p>
            <div className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${accent}14`, color: accent }}>
              <Shield size={10} /> Code never stored · Secrets redacted · AI diagnosed
            </div>
          </div>
        )}
      </div>

      {phase === "idle" && EXAMPLE_REPOS.length > 0 && (
        <div className="animate-fade-in">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Try an example repo</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_REPOS.map((repo) => (
              <button key={repo.name} onClick={() => repo.url && fetch(repo.url).then(r => r.blob()).then(b => handleFileSelect(new File([b], `${repo.name}.zip`, { type: "application/zip" }))).catch(() => {})}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}
                title={repo.desc}
              >
                <Github size={10} /> {repo.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {scanResult?.launchGates && scanResult.launchGates.length > 0 && (
        <div className="animate-fade-in">
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
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <AlertTriangle size={13} style={{ color: "var(--noctra-rose)", marginTop: 1 }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--noctra-rose)" }}>Scan failed</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{error}</p>
            </div>
          </div>
          <NoctraButton variant="ghost" onClick={reset} className="w-full"><RotateCcw size={13} /> Try Again</NoctraButton>
        </div>
      )}

      {phase === "done" && (
        <NoctraButton variant="ghost" onClick={reset} className="w-full"><RotateCcw size={13} /> Scan Another Repo</NoctraButton>
      )}

      {phase === "idle" && (
        <div className="px-3 py-2.5 rounded-lg text-xs space-y-1.5" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
          <div className="flex items-start gap-2">
            <Shield size={11} style={{ color: "var(--noctra-cyan)", marginTop: 1 }} />
            <p style={{ color: "var(--noctra-text-muted)" }}>
              <strong style={{ color: "var(--noctra-text-soft)" }}>Privacy first.</strong> Code signals and redacted snippets are sent to AI. Raw source is never stored. Secrets are detected and redacted automatically.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle size={11} style={{ color: "var(--noctra-amber)", marginTop: 1 }} />
            <p className="text-[11px]" style={{ color: "var(--noctra-amber)" }}>
              Review your ZIP before uploading — remove any secrets, API keys, or sensitive credentials.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
