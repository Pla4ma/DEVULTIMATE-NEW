import { useEffect, useRef, useState } from "react";

export function VoidCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClickable, setIsClickable] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouchDevice = "ontouchstart" in window;

    if (isTouchDevice) return;

    document.body.style.cursor = "none";

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickableElement =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']");
      setIsHovering(true);
      setIsClickable(!!isClickableElement);
    };

    const handleMouseOut = () => {
      setIsHovering(false);
      setIsClickable(false);
    };

    const animate = () => {
      const lerp = prefersReducedMotion ? 1 : 0.15;
      posRef.current.x += (targetRef.current.x - posRef.current.x) * lerp;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * lerp;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      cancelAnimationFrame(rafRef.current);
      document.body.style.cursor = "";
    };
  }, []);

  const size = isClickable ? 40 : isHovering ? 24 : 12;
  const color = isClickable ? "var(--signal-amber)" : "var(--text-quaternary)";

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none hidden lg:block"
      style={{ zIndex: 9999 }}
    >
      <div
        className="rounded-full border transition-all duration-150"
        style={{
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderColor: color,
          borderWidth: 1,
        }}
      />
    </div>
  );
}
