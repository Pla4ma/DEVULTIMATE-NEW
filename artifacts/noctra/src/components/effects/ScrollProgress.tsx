import { useEffect, useState } from "react";

/**
 * ScrollProgress — fixed top progress bar driven by window scroll.
 * Uses requestAnimationFrame for buttery smoothness.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
      setProgress(p);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
      style={{
        background: "transparent",
      }}
    >
      <div
        className="h-full"
        style={{
          width: `${progress * 100}%`,
          background:
            "linear-gradient(90deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)",
          boxShadow: "0 0 12px rgba(192, 132, 252, 0.7), 0 0 24px rgba(168, 85, 247, 0.4)",
          transition: "width 60ms linear",
        }}
      />
    </div>
  );
}
