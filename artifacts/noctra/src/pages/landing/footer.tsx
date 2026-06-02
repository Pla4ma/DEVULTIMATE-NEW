import { motion } from "framer-motion";
import { ArrowUp, Github, Twitter, Linkedin, Mail, Sparkles } from "lucide-react";
import { Magnetic } from "@/components/effects/Magnetic";
import { LogoMark, Logo } from "@/components/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Changelog", "Roadmap", "Integrations"],
  },
  {
    title: "Resources",
    links: ["Docs", "API", "Help Center", "Community", "Status"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "DPA", "Cookies"],
  },
];

export function Footer() {
  return (
    <footer className="footer-aurora pt-20 pb-10 relative overflow-hidden border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="section-container max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-16">
          {/* Brand col */}
          <div className="col-span-2">
            <Logo size={32} />
            <p
              className="text-sm leading-relaxed mt-5 max-w-xs text-pretty"
              style={{ color: "#7a7390" }}
            >
              The observatory for shipping. Catch launch blockers before they
              reach production — with evidence, not hope.
            </p>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "#c084fc" }}>
                Get launch intelligence weekly
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex items-center gap-2 p-1.5 rounded-xl glass-2026"
              >
                <Mail size={14} className="ml-2" style={{ color: "#7a7390" }} />
                <input
                  type="email"
                  placeholder="founder@startup.com"
                  className="bg-transparent border-none outline-none flex-1 text-sm px-1 placeholder:text-text-muted"
                  style={{ color: "#f5f0ff" }}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #e879f9)",
                    color: "#03000a",
                  }}
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2 mt-6">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Github, label: "GitHub" },
                { icon: Linkedin, label: "LinkedIn" },
              ].map((s) => (
                <Magnetic key={s.label} strength={0.4}>
                  <a
                    href="#"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:border-aurora-500/30"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#b4aec8",
                    }}
                  >
                    <s.icon size={14} />
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#f5f0ff" }}>
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <Magnetic strength={0.15}>
                      <a
                        href="#"
                        className="text-sm transition-colors duration-200 inline-block hover:text-text-primary"
                        style={{ color: "#7a7390" }}
                      >
                        {link}
                      </a>
                    </Magnetic>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="divider-glow mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs" style={{ color: "#4a4560" }}>
            <span>© 2026 NOCTRA · DEVULTIMATE Inc.</span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              All systems operational
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded"
              style={{ background: "rgba(168,85,247,0.1)", color: "#c084fc" }}
            >
              v2.0.0
            </span>
            <Magnetic strength={0.2}>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#b4aec8",
                }}
                aria-label="Back to top"
              >
                <ArrowUp size={14} />
              </button>
            </Magnetic>
          </div>
        </div>

        {/* Massive wordmark */}
        <div className="mt-16 text-center select-none pointer-events-none overflow-hidden">
          <div
            className="text-[clamp(5rem,18vw,14rem)] font-bold leading-none tracking-tighter opacity-20"
            style={{
              background: "linear-gradient(180deg, rgba(168,85,247,0.5) 0%, rgba(168,85,247,0) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            NOCTRA
          </div>
        </div>
      </div>
    </footer>
  );
}
