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
        <Shield size={14} style={{ color: "var(--signal)" }} />
        <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Launch Readiness Badge</p>
      </div>

      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        Embed this badge in your README to show your launch readiness score. It auto-updates with every scan.
      </p>

      <div className="flex items-center gap-3">
        <img src={badgeUrl} alt="Launch Readiness Badge" style={{ height: 20 }} />
        <div className="flex items-center gap-1.5">
          <button onClick={() => setStyle("flat")} className="px-2 py-1 rounded text-xs font-medium transition-all" style={{
            background: style === "flat" ? `${color}20` : "var(--surface-2)",
            border: `1px solid ${style === "flat" ? color : "var(--border-default)"}`,
            color: style === "flat" ? color : "var(--text-tertiary)",
          }}>Flat</button>
          <button onClick={() => setStyle("plastic")} className="px-2 py-1 rounded text-xs font-medium transition-all" style={{
            background: style === "plastic" ? `${color}20` : "var(--surface-2)",
            border: `1px solid ${style === "plastic" ? color : "var(--border-default)"}`,
            color: style === "plastic" ? color : "var(--text-tertiary)",
          }}>Plastic</button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Markdown</span>
          <button onClick={() => copyToClipboard(markdown, "Markdown")} className="flex items-center gap-1 text-[10px] hover:opacity-80" style={{ color: "var(--signal)" }}>
            {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="px-3 py-2 rounded-lg text-[10px] overflow-x-auto" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}>{markdown}</pre>
      </div>

      <details>
        <summary className="text-[10px] cursor-pointer hover:opacity-80" style={{ color: "var(--text-tertiary)" }}>Show HTML / reStructuredText formats</summary>
        <div className="mt-2 space-y-2">
          <div>
            <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>HTML</p>
            <pre className="px-3 py-2 rounded-lg text-[10px] overflow-x-auto" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}>{html}</pre>
          </div>
          <div>
            <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>reStructuredText</p>
            <pre className="px-3 py-2 rounded-lg text-[10px] overflow-x-auto" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}>{rst}</pre>
          </div>
        </div>
      </details>

      <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--color-success-soft)", border: "1px solid var(--color-success-soft)" }}>
        <ExternalLink size={11} style={{ color: "var(--color-success)", marginTop: 1 }} />
        <p className="text-[10px]" style={{ color: "var(--color-success)" }}>
          Badge updates every 5 minutes. CTRL+SHIFT+R to force refresh in your README.
        </p>
      </div>
    </div>
  );
}
