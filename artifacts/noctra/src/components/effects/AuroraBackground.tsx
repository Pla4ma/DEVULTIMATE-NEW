/**
 * AuroraBackground — full-page animated aurora gradient with floating orbs.
 * The cosmic backdrop for premium sections.
 */
export function AuroraBackground({
  variant = "default",
}: {
  variant?: "default" | "intense" | "subtle";
}) {
  const baseClass =
    variant === "intense"
      ? "bg-aurora-intense"
      : variant === "subtle"
      ? "bg-aurora-subtle"
      : "bg-aurora";

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* Base aurora mesh */}
      <div className={`absolute inset-0 ${baseClass}`} />

      {/* Constellation pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 50h100M50 0v100' stroke='%23a855f7' stroke-width='0.3' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating orbs */}
      <div
        className="absolute rounded-full animate-float"
        style={{
          width: 600,
          height: 600,
          left: "-10%",
          top: "-10%",
          background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute rounded-full animate-float-slow"
        style={{
          width: 500,
          height: 500,
          right: "-5%",
          top: "15%",
          background: "radial-gradient(circle, rgba(232,121,249,0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute rounded-full animate-float-reverse"
        style={{
          width: 450,
          height: 450,
          left: "30%",
          top: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute rounded-full animate-float"
        style={{
          width: 400,
          height: 400,
          right: "20%",
          bottom: "10%",
          background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
          animationDelay: "3s",
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
