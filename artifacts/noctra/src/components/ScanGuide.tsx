import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronDown, Check, X, FileArchive, Terminal, AlertTriangle } from "lucide-react";

export function ScanGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="mb-6 rounded-xl border overflow-hidden transition-colors"
      style={{
        background: isOpen ? "var(--surface-1)" : "var(--surface-2)",
        borderColor: isOpen ? "var(--border-default)" : "var(--border-subtle)",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-1.5 rounded-md flex-shrink-0"
            style={{ background: "var(--accent-blue-soft)", color: "var(--accent-blue)" }}
          >
            <Info size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              How to prepare your ZIP file
            </h3>
            {!isOpen && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Follow these guidelines to ensure a clean, secure scan.
              </p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} style={{ color: "var(--text-tertiary)" }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="p-5 space-y-6">
              {/* Command Section */}
              <div className="space-y-2">
                <h4 className="eyebrow" style={{ color: "var(--text-secondary)" }}>
                  Recommended Method
                </h4>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  The safest way to create a ZIP is using Git. This automatically ignores files in your <code style={{ color: "var(--accent-cyan)", background: "var(--surface-2)", padding: "2px 4px", borderRadius: "4px" }}>.gitignore</code>.
                </p>
                <div
                  className="flex items-center justify-between p-3 rounded-lg mt-2"
                  style={{ background: "var(--surface-3)", border: "1px solid var(--border-default)" }}
                >
                  <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                    <Terminal size={14} style={{ color: "var(--text-tertiary)" }} />
                    <span>git archive --format zip --output project-scan.zip HEAD</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Checklist Section */}
                <div className="space-y-3">
                  <h4 className="eyebrow flex items-center gap-2" style={{ color: "var(--color-success)" }}>
                    <Check size={14} /> Pre-upload Checklist
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "I removed .env files",
                      "I removed private keys",
                      "I removed production database dumps",
                      "I understand this scan analyzes code structure",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <div className="mt-0.5 rounded border flex items-center justify-center w-4 h-4 flex-shrink-0" style={{ borderColor: "var(--border-strong)", background: "var(--surface-2)" }}>
                          {/* visual checkbox empty */}
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Avoid Section */}
                <div className="space-y-3">
                  <h4 className="eyebrow flex items-center gap-2" style={{ color: "var(--color-danger)" }}>
                    <X size={14} /> Never Upload
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      ".env files",
                      "node_modules or vendor directories",
                      "dist, build, or .next output",
                      "Private keys & certificates",
                      "Database dumps (.sql, .sqlite)",
                      "Customer data or PII",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
                        <X size={12} style={{ color: "var(--color-danger)" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg text-xs" style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)", border: "1px solid var(--color-warning)" }}>
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                  NOCTRA performs static analysis on your code structure. We do not need your secrets, environment variables, or database contents to analyze your architecture.
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
