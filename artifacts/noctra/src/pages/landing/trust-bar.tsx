import { Marquee } from "@/components/effects/Marquee";

const LOGOS_ROW_A = [
  { name: "Stripe", mark: "◆" },
  { name: "Vercel", mark: "▲" },
  { name: "Linear", mark: "◢" },
  { name: "Notion", mark: "▢" },
  { name: "Figma", mark: "◐" },
  { name: "Raycast", mark: "⌘" },
  { name: "Supabase", mark: "◢" },
  { name: "GitHub", mark: "◉" },
  { name: "Cursor", mark: "⏶" },
  { name: "Resend", mark: "✉" },
];

const LOGOS_ROW_B = [
  { name: "Anthropic", mark: "✦" },
  { name: "OpenAI", mark: "✺" },
  { name: "Cloudflare", mark: "☁" },
  { name: "Fly.io", mark: "✈" },
  { name: "PlanetScale", mark: "◐" },
  { name: "Tailwind", mark: "≈" },
  { name: "Framer", mark: "◧" },
  { name: "Loom", mark: "▶" },
  { name: "Linear", mark: "◢" },
  { name: "Vercel", mark: "▲" },
];

export function TrustBar() {
  return (
    <section className="py-16 border-y relative overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(168,85,247,0.03) 50%, transparent 100%)",
        }}
      />
      <div className="section-container mb-10">
        <p className="text-center text-[10px] uppercase tracking-[0.3em] font-mono" style={{ color: "#7a7390" }}>
          Powering launch readiness for teams shipping serious software
        </p>
      </div>

      <Marquee speed="slow" pauseOnHover className="py-2">
        {LOGOS_ROW_A.map((logo) => (
          <LogoChip key={logo.name} name={logo.name} mark={logo.mark} />
        ))}
      </Marquee>

      <div className="h-4" />

      <Marquee speed="slow" direction="right" pauseOnHover className="py-2">
        {LOGOS_ROW_B.map((logo) => (
          <LogoChip key={logo.name} name={logo.name} mark={logo.mark} dim />
        ))}
      </Marquee>
    </section>
  );
}

function LogoChip({ name, mark, dim = false }: { name: string; mark: string; dim?: boolean }) {
  return (
    <div
      className="flex items-center gap-2.5 px-5 py-2.5 mx-2 rounded-xl transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        color: dim ? "#4a4560" : "#7a7390",
      }}
    >
      <span className="text-lg" style={{ color: "#c084fc", opacity: dim ? 0.4 : 0.8 }}>
        {mark}
      </span>
      <span className="text-sm font-semibold tracking-tight whitespace-nowrap">{name}</span>
    </div>
  );
}
