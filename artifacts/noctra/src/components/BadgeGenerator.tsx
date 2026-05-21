import { useState } from "react";
import { Copy, Check, ExternalLink, Shield } from "lucide-react";

interface BadgeGeneratorProps {
  projectId: string;
  projectName: string;
  projectScore: number | null;
}

export function BadgeGenerator({ projectId, projectName, projectScore }: BadgeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<"flat" | "plastic">("flat");
  const baseUrl = window.location.origin.replace("5173", "8080");
  const badgeUrl = `${baseUrl}/api/badge/${projectId}?style=${style}`;
  const color = projectScore == null ? "#4a5268" : projectScore >= 70 ? "#34d399" : projectScore >= 40 ? "#f59e0b" : "#f43f5e";

  const markdown = `[![Launch Readiness](https://img.shields.io/endpoint?url=${encodeURIComponent(badgeUrl)}&color=${encodeURIComponent(color)})](${window.location.origin}/app/projects/${projectId})`;

  const html = `<a href="${window.location.origin}/app/projects/${projectId}"><img src="${badgeUrl}" alt="Launch Readiness" /></a>`;

  const rst = `.. image:: ${badgeUrl}\n   :target: ${window.location.origin}/app/projects/${projectId}\n   :alt: Launch Readiness`;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={14} style={{ color: "var(--noctra-cyan)" }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Launch Readiness Badge</p>
      </div>

      <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
        Embed this badge in your README to show your launch readiness score. It auto-updates with every scan.
      </p>

      <div className="flex items-center gap-3">
        <img src={badgeUrl} alt="Launch Readiness Badge" style={{ height: 20 }} />
        <div className="flex items-center gap-1.5">
          <button onClick={() => setStyle("flat")} className="px-2 py-1 rounded text-xs font-medium transition-all" style={{
            background: style === "flat" ? `${color}20` : "var(--noctra-surface2)",
            border: `1px solid ${style === "flat" ? color : "var(--noctra-border)"}`,
            color: style === "flat" ? color : "var(--noctra-text-muted)",
          }}>Flat</button>
          <button onClick={() => setStyle("plastic")} className="px-2 py-1 rounded text-xs font-medium transition-all" style={{
            background: style === "plastic" ? `${color}20` : "var(--noctra-surface2)",
            border: `1px solid ${style === "plastic" ? color : "var(--noctra-border)"}`,
            color: style === "plastic" ? color : "var(--noctra-text-muted)",
          }}>Plastic</button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Markdown</span>
          <button onClick={() => copyToClipboard(markdown, "Markdown")} className="flex items-center gap-1 text-[10px] hover:opacity-80" style={{ color: "var(--noctra-cyan)" }}>
            {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="px-3 py-2 rounded-lg text-[10px] overflow-x-auto" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>{markdown}</pre>
      </div>

      <details>
        <summary className="text-[10px] cursor-pointer hover:opacity-80" style={{ color: "var(--noctra-text-muted)" }}>Show HTML / reStructuredText formats</summary>
        <div className="mt-2 space-y-2">
          <div>
            <p className="text-[10px] font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>HTML</p>
            <pre className="px-3 py-2 rounded-lg text-[10px] overflow-x-auto" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>{html}</pre>
          </div>
          <div>
            <p className="text-[10px] font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>reStructuredText</p>
            <pre className="px-3 py-2 rounded-lg text-[10px] overflow-x-auto" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>{rst}</pre>
          </div>
        </div>
      </details>

      <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
        <ExternalLink size={11} style={{ color: "var(--noctra-emerald)", marginTop: 1 }} />
        <p className="text-[10px]" style={{ color: "var(--noctra-emerald)" }}>
          Badge updates every 5 minutes. CTRL+SHIFT+R to force refresh in your README.
        </p>
      </div>
    </div>
  );
}
