import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/effects/AnimatedCounter";

const STATS = [
  { value: "10K+", label: "Projects Analyzed", sub: "across 47 countries", color: "#a855f7" },
  { value: "87%", label: "Blocker Detection", sub: "before they ship", color: "#22d3ee" },
  { value: "4.9", label: "Developer Rating", sub: "from 2,100+ reviews", color: "#e879f9" },
  { value: "<2min", label: "Avg Scan Time", sub: "to first insight", color: "#22c55e" },
];

export function Stats() {
  return (
    <section className="py-28 lg:py-36 relative">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(168,85,247,0.08) 0%, transparent 60%)",
        }}
      />
      <div className="section-container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="eyebrow mb-5">By the numbers</p>
          <h2
            className="font-bold text-white mb-5 tracking-[-0.03em] leading-[1.05] text-balance"
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)" }}
          >
            Evidence you can{" "}
            <span className="text-gradient-aurora">measure</span>
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#7a7390" }}>
            Real outcomes from builders who catch blockers before they ship.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative group"
            >
              <div
                className="relative p-6 rounded-2xl text-center transition-all duration-500"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(26,15,46,0.5) 0%, rgba(10,6,18,0.4) 100%)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${stat.color}20 0%, transparent 60%)`,
                  }}
                />
                <p
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-3 tracking-[-0.04em] leading-none text-balance"
                  style={{
                    background: `linear-gradient(135deg, #f5f0ff 0%, ${stat.color} 100%)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <AnimatedCounter value={stat.value} duration={1800} />
                </p>
                <p className="text-sm font-semibold text-white mb-1">{stat.label}</p>
                <p className="text-xs" style={{ color: "#7a7390" }}>
                  {stat.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
