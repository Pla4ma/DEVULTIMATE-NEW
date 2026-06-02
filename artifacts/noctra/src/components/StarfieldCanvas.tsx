import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  layer: number;
  opacity: number;
  size: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface StarfieldCanvasProps {
  opacity?: number;
  className?: string;
}

export function StarfieldCanvas({ opacity = 1, className = "" }: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    let starCount = 5000;
    if (isMobile) starCount = 1500;
    if (isLowPower) starCount = 800;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    starsRef.current = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      layer: Math.random(),
      opacity: 0.3 + Math.random() * 0.6,
      size: 1 + Math.random(),
      twinkleSpeed: prefersReducedMotion ? 0 : 0.0005 + Math.random() * 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", resize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const animate = (time: number) => {
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const scroll = scrollRef.current;

      for (const star of starsRef.current) {
        const layerSpeed = star.layer < 0.33 ? 0.01 : star.layer < 0.66 ? 0.04 : 0.08;

        let x = star.x;
        let y = star.y;

        if (!isMobile && !prefersReducedMotion) {
          const mouseOffsetX = (mouse.x - canvas.width / 2) * layerSpeed * 0.05;
          const mouseOffsetY = (mouse.y - canvas.height / 2) * layerSpeed * 0.05;
          x += mouseOffsetX;
          y += mouseOffsetY;
        }

        const scrollOffsetY = scroll * layerSpeed * 0.1;
        y -= scrollOffsetY;

        x = ((x % canvas.width) + canvas.width) % canvas.width;
        y = ((y % canvas.height) + canvas.height) % canvas.height;

        let finalOpacity = star.opacity;
        if (!prefersReducedMotion && star.twinkleSpeed > 0) {
          finalOpacity *= 0.7 + 0.3 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        }

        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity * opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
