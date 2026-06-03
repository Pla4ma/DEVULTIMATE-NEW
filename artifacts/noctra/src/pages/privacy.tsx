import { AppShell } from "@/components/AppShell";
import { Shield, Zap, Lock, Eye, Trash2, AlertTriangle, FileText, Brain, Server, Download } from "lucide-react";

const sections = [
  {
    icon: Download,
    title: "What gets uploaded",
    body: "When you use Project Doctor, you upload a ZIP file of your repository. The ZIP is stored in server memory temporarily during scanning and is discarded after the scan completes. No raw source files are persisted to the database.",
  },
  {
    icon: Eye,
    title: "What gets scanned",
    body: "The scanner analyzes source files (.ts, .tsx, .js, .jsx, .mjs, .cjs) to extract structural signals: file counts, directory organization, framework detection, dependency listings, test coverage, TODO/FIXME counts, and code quality signals like console.log usage, debugger statements, and TypeScript `any` usage.",
  },
  {
    icon: Shield,
    title: "What gets ignored",
    body: "The following directories are never scanned: node_modules, .git, dist, build, .next, out, coverage, vendor, target, .cache, .turbo. Binary and media files are also ignored: images, videos, audio, fonts, archives, executables, PDFs, and office documents.",
  },
  {
    icon: Lock,
    title: "Secret detection & redaction",
    body: "The scanner actively detects and redacts: OpenAI API keys (sk-...), Google API keys (AIza...), AWS access keys (AKIA...), GitHub tokens (ghp_/ghs_), JWT tokens, and common patterns like api_key, secret, password, and token assignments. Redacted values are replaced with [REDACTED] before they reach any AI provider or report. .env files are detected but their contents are never read.",
  },
  {
    icon: Brain,
    title: "What gets sent to AI",
    body: "Only summarized structural signals, redacted code snippets (up to 500 chars per file, max 5 sample files), and launch gate evaluations are sent to AI providers. No raw source files, no .env contents, and no binary data are sent. All snippets are passed through secret redaction before transmission.",
  },
  {
    icon: Server,
    title: "AI providers used",
    body: "Depending on your configuration, data may be processed by: OpenAI (GPT-4o-mini), Groq (Llama 3.3 70B), or any configured OpenAI-compatible provider. Prompts consist of structural metadata and redacted snippets — not raw source code.",
  },
  {
    icon: FileText,
    title: "What gets stored",
    body: "Only the AI-generated report is saved to your account. This includes: health score, launch gate results, issue descriptions, fix tasks, and next build prompt. Raw source code is never stored. Scan summaries (file counts, framework, package manager) are stored for context.",
  },
  {
    icon: Trash2,
    title: "Data retention & deletion",
    body: "You can delete any report, scan, or project at any time from within the app. Deletion is immediate and permanent. Backend scan data is ephemeral — ZIP files are processed in memory and discarded. There is no automated retention beyond your explicit saves.",
  },
  {
    icon: AlertTriangle,
    title: "What we do NOT do",
    body: "We do not train AI models on your code. We do not share your code with third parties. We do not store raw source files. We do not read .env file contents. We do not use your data for anything other than generating your report.",
  },
];

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 pb-6 border-b" style={{ borderColor: "var(--border-default)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--signal-soft)" }}>
            <Shield size={22} style={{ color: "var(--signal)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Repo Privacy</h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              How we handle your code, data, and privacy
            </p>
          </div>
        </div>

        <div className="px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: "var(--signal-soft)", border: "1px solid var(--signal-soft)" }}>
          <Shield size={14} style={{ color: "var(--signal)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              We take code privacy seriously
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              We never store raw source code, never train on your data, and give you full control over your scans and reports.
            </p>
          </div>
        </div>

        {sections.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 p-4 glass">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--signal-soft)" }}>
              <Icon size={18} style={{ color: "var(--signal)" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{body}</p>
            </div>
          </div>
        ))}

        <div className="px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)" }}>
          <AlertTriangle size={14} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-warning)" }}>Beta caution</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              During beta, avoid uploading highly sensitive or proprietary repositories. While we take every precaution, no system is perfect. Review your scan results and delete any reports you are not comfortable keeping.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
