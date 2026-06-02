import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star, Sparkles } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "NOCTRA found 12 critical launch blockers in my codebase — hardcoded API keys, missing rate limits, no error handling. Fixed everything before shipping. The rescan loop showed my score go from 34 to 89.",
    author: "Jonathan",
    role: "Founder · Built VEX with NOCTRA",
    metric: "34→89",
    metricLabel: "score lift",
    color: "#a855f7",
    initial: "J",
  },
  {
    quote: "The scan→fix→rescan loop is a game changer. Each rescan shows my launch readiness score improving as I fix issues. It turns code review into a measurable, gamified process.",
    author: "Early Builder",
    role: "Indie Hacker",
    metric: "12 fixes",
    metricLabel: "in 1 day",
    color: "#22d3ee",
    initial: "E",
  },
  {
    quote: "We changed our pricing from $19 to $49/mo based on market signal analysis. 3x revenue from day one. The evidence-backed blockers gave us confidence to ship without fear.",
    author: "Solo Founder",
    role: "B2B SaaS",
    metric: "3x",
    metricLabel: "revenue",
    color: "#e879f9",
    initial: "S",
  },
  {
    quote: "The AI fix prompts save me hours. I just paste the prompt into Cursor and the fix is done. NOCTRA doesn't just identify problems — it solves them with me.",
    author: "Tech Lead",
    role: "YC W24 Batch",
    metric: "<2min",
    metricLabel: "to fix",
    color: "#22c55e",
    initial: "T",
  },
  {
    quote: "We were 3 days from launch when NOCTRA caught a security vulnerability we had missed for weeks. The launch scan is now non-negotiable on every release.",
    author: "Engineering Manager",
    role: "Fintech Startup",
    metric: "0",
    metricLabel: "prod incidents",
    color: "#f472b6",
    initial: "E",
  },
  {
    quote: "As a solo founder, NOCTRA is my CTO. It catches what I miss, scores what I ship, and shows me exactly what to fix next. Worth every penny.",
    author: "Serial Builder",
    role: "3x Founder",
    metric: "5 ships",
    metricLabel: "this quarter",
    color: "#a855f7",
    initial: "S",
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % TESTIMONIALS.length);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="testimonials"
      className="py-28 lg:py-36 relative scroll-anchor"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(168,85,247,0.04) 50%, transparent 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-20 section-dots"
        style={{ maskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black 0%, transparent 70%)" }}
      />

      <div className="section-container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="eyebrow mb-5">Testimonials</p>
          <h2
            className="font-bold text-white tracking-[-0.04em] leading-[1.02] text-balance"
            style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}
          >
            Loved by{" "}
            <span className="text-gradient-aurora">founders who ship</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed mt-5" style={{ color: "#7a7390" }}>
            From solo builders to YC-backed teams. NOCTRA is the launch partner
            that never sleeps.
          </p>
        </motion.div>

        {/* Featured carousel */}
        <div className="relative max-w-4xl mx-auto mb-12">
          <div className="absolute -inset-4 -z-10 rounded-3xl opacity-50 blur-2xl" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.3), transparent 60%)" }} />
          <div
            className="glass-2026 p-10 lg:p-12 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(26,15,46,0.7) 0%, rgba(10,6,18,0.6) 100%)",
            }}
          >
            <Quote
              className="absolute top-6 right-6 opacity-10"
              size={80}
              style={{ color: "#c084fc" }}
            />
            <AnimatePresence mode="wait">
              {(() => {
                const t = TESTIMONIALS[active] ?? TESTIMONIALS[0];
                if (!t) return null;
                return (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="#c084fc"
                      style={{
                        color: "#c084fc",
                        filter: "drop-shadow(0 0 4px rgba(192,132,252,0.5))",
                      }}
                    />
                  ))}
                </div>

                <p
                  className="text-xl sm:text-2xl leading-relaxed mb-8 text-balance"
                  style={{ color: "#e9d5ff" }}
                >
                  "{t.quote}"
                </p>

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar-ring">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${t.color}30, rgba(3,0,10,0.9))`,
                          color: t.color,
                        }}
                      >
                        {t.initial}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {t.author}
                      </p>
                      <p className="text-xs" style={{ color: "#7a7390" }}>
                        {t.role}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{
                      background: `${t.color}10`,
                      border: `1px solid ${t.color}25`,
                    }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: t.color }}
                    >
                      {t.metric}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "#7a7390" }}>
                      {t.metricLabel}
                    </span>
                  </div>
                </div>
              </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex gap-1.5">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === active ? 32 : 6,
                      background: i === active ? "linear-gradient(90deg, #a855f7, #e879f9)" : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActive((a) => (a - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#b4aec8" }}
                  aria-label="Previous"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActive((a) => (a + 1) % TESTIMONIALS.length)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#b4aec8" }}
                  aria-label="Next"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mini testimonials grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="glass-2026 p-5 rounded-2xl transition-all duration-500 hover:border-aurora-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={12} style={{ color: t.color }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: t.color }}>
                  {t.metric} {t.metricLabel}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#b4aec8" }}>
                "{t.quote.slice(0, 120)}..."
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px]"
                  style={{
                    background: `${t.color}20`,
                    color: t.color,
                  }}
                >
                  {t.initial}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{t.author}</p>
                  <p className="text-[10px]" style={{ color: "#7a7390" }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
