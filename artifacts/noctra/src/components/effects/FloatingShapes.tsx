/**
 * FloatingShapes — decorative 3D-ish geometric shapes that float and rotate.
 * Used as background interest in hero sections.
 */
export function FloatingShapes() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Large blurred orb 1 */}
      <div
        className="absolute animate-float-slow"
        style={{
          width: 300,
          height: 300,
          left: "5%",
          top: "20%",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(168,85,247,0.05) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Geometric ring 1 */}
      <div
        className="absolute animate-spin-slow"
        style={{
          width: 280,
          height: 280,
          right: "8%",
          top: "10%",
          border: "1px solid rgba(168,85,247,0.15)",
          borderRadius: "50%",
          background: "radial-gradient(circle, transparent 60%, rgba(168,85,247,0.04) 100%)",
        }}
      />

      {/* Geometric ring 2 (reverse) */}
      <div
        className="absolute animate-spin-reverse"
        style={{
          width: 200,
          height: 200,
          right: "12%",
          top: "15%",
          border: "1px solid rgba(232,121,249,0.1)",
          borderRadius: "50%",
        }}
      />

      {/* Morphing blob */}
      <div
        className="absolute animate-blob-morph animate-pulse-slow"
        style={{
          width: 250,
          height: 250,
          left: "60%",
          top: "40%",
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(232,121,249,0.1) 100%)",
          filter: "blur(2px)",
        }}
      />

      {/* Small accent dot */}
      <div
        className="absolute animate-pulse-soft"
        style={{
          width: 6,
          height: 6,
          right: "20%",
          top: "30%",
          background: "#c084fc",
          borderRadius: "50%",
          boxShadow: "0 0 20px #c084fc, 0 0 40px #a855f7",
        }}
      />
      <div
        className="absolute animate-pulse-soft"
        style={{
          width: 4,
          height: 4,
          left: "15%",
          top: "50%",
          background: "#e879f9",
          borderRadius: "50%",
          boxShadow: "0 0 20px #e879f9",
          animationDelay: "1s",
        }}
      />
      <div
        className="absolute animate-pulse-soft"
        style={{
          width: 3,
          height: 3,
          left: "40%",
          top: "15%",
          background: "#22d3ee",
          borderRadius: "50%",
          boxShadow: "0 0 15px #22d3ee",
          animationDelay: "2s",
        }}
      />
    </div>
  );
}
