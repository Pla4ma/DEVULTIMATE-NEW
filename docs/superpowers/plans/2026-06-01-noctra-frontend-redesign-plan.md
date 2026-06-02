# NOCTRA Frontend Redesign — Signal Void Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Noctra into an industry-shaking "Signal Void" visual experience with a living starfield, monumental 3D signal tower, brutalist minimalism, and heavy gravitational motion.

**Architecture:** Pure CSS design tokens via Tailwind v4's `@theme` block. Canvas 2D starfield for background atmosphere. Lazy-loaded Three.js signal tower ONLY on Command Center. Framer Motion for UI animations. Custom cursor and unified Void component library.

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS v4 + Framer Motion + Three.js (lazy) + Canvas 2D + Wouter + Lucide React

---

## File Structure Map

### New Files (14 components)
```
src/components/
  StarfieldCanvas.tsx          # Canvas 2D starfield background
  SignalTower.tsx              # Three.js lazy-loaded tower (Command Center only)
  VoidCursor.tsx               # Custom floating ring cursor
  VoidButton.tsx               # Unified button component (primary/secondary/ghost/danger)
  VoidCard.tsx                 # Card with hover lift + glow
  VoidInput.tsx                # Input with focus glow
  VoidSkeleton.tsx             # Shimmer skeleton loader
  VoidToast.tsx                # Toast notification component
  VoidModal.tsx                # Modal/dialog overlay
  VoidNavSidebar.tsx           # App shell sidebar
  VoidTopBar.tsx               # Sticky top bar
  Appear.tsx                   # Fade-in-up animation wrapper
  StaggerContainer.tsx         # Staggered children wrapper
```

### Refactored Files (14 pages/components)
```
src/index.css                  # Replace design tokens with Signal Void palette
src/pages/landing.tsx          # Complete rewrite — 7 sections
src/pages/landing/HeroSection.tsx         # Remove mockup card, starfield bg
src/pages/landing/FeaturesSection.tsx     # New card style, no screenshots
src/pages/landing/HowItWorksSection.tsx   # Timeline layout
src/pages/command-center.tsx    # Add Signal Tower, restyle cards
src/components/AppShell.tsx     # New sidebar + top bar
src/pages/idea-lab.tsx          # Restyle cards, inputs, buttons
src/pages/code-health.tsx       # Restyle cards, inputs, buttons
src/pages/build-planner.tsx     # Restyle cards, inputs, buttons
src/pages/project-brain.tsx     # Restyle cards, inputs, buttons
src/pages/project-detail.tsx    # Restyle tabs, cards
src/pages/report-detail.tsx     # Restyle cards
src/pages/pricing.tsx           # Restyle with new system
src/pages/not-found.tsx         # Starfield background, minimal message
```

### Unchanged (functionality preserved)
```
src/App.tsx                    # Keep routing, add VoidCursor
src/main.tsx                   # Keep entry point
src/lib/auth.tsx               # Keep auth logic
src/stores/                    # Keep data stores
src/lib/repository.ts          # Keep Supabase access
src/integrations/              # Keep integrations
```

---

## Phase 1: Foundation (Design System + Landing Page)

### Task 1: Update CSS Design Tokens

**Files:**
- Modify: `src/index.css`

**Context:** Tailwind v4 uses `@theme` block for CSS variable definitions. We replace the existing "Observatory" tokens with the "Signal Void" palette.

- [ ] **Step 1: Backup existing index.css**

```bash
cp src/index.css src/index.css.backup
```

- [ ] **Step 2: Replace @theme block with Signal Void tokens**

Open `src/index.css`. Find the `@theme inline` block and replace the entire block with:

```css
@theme inline {
  /* ─── Signal Void Design System ─────────────────────────────── */
  --color-void-0: #000000;
  --color-void-1: #0A0A0A;
  --color-void-2: #111111;
  --color-void-3: #1A1A1A;

  --color-signal-amber: #FF9F1C;
  --color-signal-amber-dim: rgba(255, 159, 28, 0.14);
  --color-signal-amber-glow: rgba(255, 159, 28, 0.30);

  --color-text-primary: #F5F5F5;
  --color-text-secondary: #888888;
  --color-text-tertiary: #555555;
  --color-text-quaternary: #333333;

  --color-danger: #EF4444;
  --color-danger-soft: rgba(239, 68, 68, 0.14);
  --color-success: #22C55E;
  --color-success-soft: rgba(34, 197, 94, 0.14);
  --color-warning: #F59E0B;

  /* Font families */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", "Geist Mono", "SF Mono", "Fira Code", monospace;

  /* Spacing tokens */
  --spacing-section: clamp(120px, 15vh, 240px);
  --spacing-gap: 24px;
  --spacing-gap-lg: 48px;

  /* Border radius */
  --radius-card: 12px;
  --radius-pill: 9999px;
  --radius-brutalist: 0px;

  /* Legacy compatibility tokens (map old names to new) */
  --color-background: #000000;
  --color-foreground: #F5F5F5;
  --color-border: #1A1A1A;
  --color-input: #111111;
  --color-ring: #FF9F1C;
  --color-primary: #FF9F1C;
  --color-primary-foreground: #000000;
  --color-secondary: #111111;
  --color-secondary-foreground: #888888;
  --color-muted: #0A0A0A;
  --color-muted-foreground: #555555;
  --color-accent: #FF9F1C;
  --color-accent-foreground: #000000;
  --color-destructive: #EF4444;
  --color-destructive-foreground: #FFFFFF;
  --color-card: #0A0A0A;
  --color-card-foreground: #F5F5F5;
  --color-popover: #0A0A0A;
  --color-popover-foreground: #F5F5F5;
}
```

- [ ] **Step 3: Add global CSS custom properties for runtime theming**

After the `@theme` block, add a `:root` block:

```css
:root {
  --void-0: #000000;
  --void-1: #0A0A0A;
  --void-2: #111111;
  --void-3: #1A1A1A;
  --signal-amber: #FF9F1C;
  --signal-amber-dim: rgba(255, 159, 28, 0.14);
  --signal-amber-glow: rgba(255, 159, 28, 0.30);
  --text-primary: #F5F5F5;
  --text-secondary: #888888;
  --text-tertiary: #555555;
  --text-quaternary: #333333;
  --color-danger: #EF4444;
  --color-success: #22C55E;
}
```

- [ ] **Step 4: Add animation keyframes**

Add to the end of `index.css`:

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
```

- [ ] **Step 5: Verify no build errors**

Run:
```bash
pnpm --filter @workspace/noctra run typecheck
```
Expected: Pass (0 errors, 0 warnings)

- [ ] **Step 6: Commit**

```bash
git add src/index.css
git commit -m "feat: implement Signal Void design token system"
```

---

### Task 2: Create Animation Wrapper Components

**Files:**
- Create: `src/components/Appear.tsx`
- Create: `src/components/StaggerContainer.tsx`

- [ ] **Step 1: Create Appear.tsx**

```tsx
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const fadeInUpVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface AppearProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function Appear({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
  once = true,
}: AppearProps) {
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once, amount: 0.1 }}
      variants={fadeInUpVariants}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create StaggerContainer.tsx**

```tsx
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
}

export function StaggerContainer({
  children,
  className = "",
  once = true,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once, amount: 0.1 }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Appear.tsx src/components/StaggerContainer.tsx
git commit -m "feat: add Appear and StaggerContainer animation wrappers"
```

---

### Task 3: Create StarfieldCanvas Component

**Files:**
- Create: `src/components/StarfieldCanvas.tsx`

- [ ] **Step 1: Write StarfieldCanvas.tsx**

```tsx
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

    // Generate stars
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

        // Wrap around
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
```

- [ ] **Step 2: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StarfieldCanvas.tsx
git commit -m "feat: add StarfieldCanvas with parallax depth and twinkle"
```

---

### Task 4: Create VoidButton Component

**Files:**
- Create: `src/components/VoidButton.tsx`

- [ ] **Step 1: Write VoidButton.tsx**

```tsx
import { motion } from "framer-motion";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface VoidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
}

const variantStyles = {
  primary:
    "bg-[var(--signal-amber)] text-black font-semibold hover:shadow-[0_0_24px_var(--signal-amber-glow)]",
  secondary:
    "bg-void-2 text-text-secondary border border-void-3 hover:border-[var(--signal-amber-glow)] hover:bg-void-3",
  ghost: "bg-transparent text-text-tertiary hover:text-text-secondary",
  danger: "bg-[var(--color-danger)] text-white font-semibold",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

export function VoidButton({
  variant = "primary",
  size = "md",
  children,
  isLoading,
  className,
  disabled,
  ...props
}: VoidButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200",
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      ) : (
        children
      )}
    </motion.button>
  );
}
```

- [ ] **Step 2: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/VoidButton.tsx
git commit -m "feat: add VoidButton with primary/secondary/ghost/danger variants"
```

---

### Task 5: Create VoidCard Component

**Files:**
- Create: `src/components/VoidCard.tsx`

- [ ] **Step 1: Write VoidCard.tsx**

```tsx
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface VoidCardProps {
  children: ReactNode;
  className?: string;
  featured?: boolean;
  hover?: boolean;
}

export function VoidCard({
  children,
  className,
  featured = false,
  hover = true,
}: VoidCardProps) {
  return (
    <motion.div
      whileHover={
        hover
          ? {
              y: -4,
              borderColor: "rgba(255, 159, 28, 0.30)",
            }
          : undefined
      }
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "bg-void-1 border border-void-3 rounded-[12px] transition-colors duration-300",
        featured ? "p-12" : "p-8",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VoidCard.tsx
git commit -m "feat: add VoidCard with hover lift and glow border"
```

---

### Task 6: Create VoidInput Component

**Files:**
- Create: `src/components/VoidInput.tsx`

- [ ] **Step 1: Write VoidInput.tsx**

```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export const VoidInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full bg-void-2 border border-void-3 rounded-[10px] px-4 py-3 text-sm",
        "text-text-primary placeholder:text-text-quaternary",
        "focus:outline-none focus:border-[var(--signal-amber)] focus:shadow-[0_0_0_3px_var(--signal-amber-dim)]",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  );
});
VoidInput.displayName = "VoidInput";
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VoidInput.tsx
git commit -m "feat: add VoidInput with signal amber focus glow"
```

---

### Task 7: Rewrite Landing Page — Hero Section

**Files:**
- Modify: `src/pages/landing/HeroSection.tsx`

- [ ] **Step 1: Read current HeroSection.tsx**

Use Read tool on `src/pages/landing/HeroSection.tsx`

- [ ] **Step 2: Rewrite HeroSection.tsx**

Replace the entire file with:

```tsx
import { motion } from "framer-motion";
import { ArrowUpRight, Play } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { VoidButton } from "@/components/VoidButton";

interface HeroSectionProps {
  onSignup: () => void;
  onDemo: () => void;
}

export function HeroSection({ onSignup, onDemo }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-16 pb-28">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-full mb-8 bg-void-1 border border-void-3"
          >
            <LogoMark size={18} animated />
            <span className="text-xs font-medium tracking-wide text-[var(--signal-amber)]">
              Launch Intelligence · Live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-bold leading-[0.95] tracking-tight"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Ship with evidence,
            <br />
            <span className="text-[var(--signal-amber)]">not hope.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 text-lg sm:text-xl max-w-xl leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            NOCTRA is the observatory for shipping. Point it at your idea or
            your codebase and get a launch readiness score, prioritized
            blockers, and fix prompts you can paste straight into your AI IDE.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <VoidButton variant="primary" size="lg" onClick={onSignup}>
              <Play size={16} fill="currentColor" />
              Start free analysis
              <ArrowUpRight size={16} />
            </VoidButton>
            <VoidButton variant="secondary" size="lg" onClick={onDemo}>
              Explore demo mode
            </VoidButton>
          </motion.div>
        </div>
      </div>

      {/* Static Signal Tower silhouette — NOT the interactive 3D component */}
      <div className="absolute bottom-12 right-8 opacity-20 hidden lg:block">
        <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
          <path
            d="M100 20L180 280H20L100 20Z"
            stroke="var(--signal-amber)"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M100 20L140 200H60L100 20Z"
            stroke="var(--signal-amber)"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
          <line x1="100" y1="20" x2="100" y2="280" stroke="var(--signal-amber)" strokeWidth="0.5" opacity="0.2" />
        </svg>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-px h-12 bg-gradient-to-b from-[var(--signal-amber)] to-transparent opacity-60 animate-pulse" />
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 3: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/landing/HeroSection.tsx
git commit -m "feat: rewrite HeroSection with monumental typography and tower silhouette"
```

---

### Task 8: Rewrite Landing Page — Features Section

**Files:**
- Modify: `src/pages/landing/FeaturesSection.tsx`

- [ ] **Step 1: Read current file**

Use Read tool on `src/pages/landing/FeaturesSection.tsx`

- [ ] **Step 2: Rewrite FeaturesSection.tsx**

Replace with:

```tsx
import { Radar, ShieldCheck, Activity, ArrowUpRight } from "lucide-react";
import { VoidCard } from "@/components/VoidCard";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { Appear } from "@/components/Appear";

const FEATURES = [
  {
    icon: Radar,
    title: "Signal Chamber",
    description:
      "Validate product ideas with AI scoring. Know if you're building something people want before you write a line of code.",
  },
  {
    icon: ShieldCheck,
    title: "Pressure Matrix",
    description:
      "Stress-test assumptions with a reality compiler. Find the fatal flaws in your thinking before they become fatal flaws in your product.",
  },
  {
    icon: Activity,
    title: "Diagnostic Bay",
    description:
      "Scan your codebase for launch blockers. Upload a ZIP, get a health score, prioritized fixes, and paste-ready prompts.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-[var(--spacing-section)] px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Appear>
          <p
            className="text-xs font-medium tracking-[0.12em] uppercase mb-4"
            style={{ color: "var(--signal-amber)" }}
          >
            Instruments
          </p>
        </Appear>
        <Appear delay={0.1}>
          <h2
            className="font-bold tracking-tight mb-16"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
            }}
          >
            Point. Scan. Ship.
          </h2>
        </Appear>

        <StaggerContainer className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title}>
              <VoidCard featured className="h-full flex flex-col">
                <feature.icon
                  size={24}
                  className="mb-6"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feature.description}
                </p>
                <div className="mt-6 flex items-center gap-1 text-xs font-medium" style={{ color: "var(--signal-amber)" }}>
                  Learn more <ArrowUpRight size={12} />
                </div>
              </VoidCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/FeaturesSection.tsx
git commit -m "feat: rewrite FeaturesSection with VoidCards and staggered reveal"
```

---

### Task 9: Rewrite Landing Page — How It Works Section

**Files:**
- Create: `src/pages/landing/HowItWorksSection.tsx`

- [ ] **Step 1: Write HowItWorksSection.tsx**

```tsx
import { useEffect, useRef, useState } from "react";
import { Upload, ScanLine, Wrench, Rocket } from "lucide-react";
import { Appear } from "@/components/Appear";

const STEPS = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your project",
    description: "Drop a ZIP of your codebase. No setup, no configuration files.",
  },
  {
    number: "02",
    icon: ScanLine,
    title: "Run the scan",
    description: "Our diagnostic engine analyzes architecture, dependencies, secrets, and launch blockers in under 2 minutes.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Get fix prompts",
    description: "Receive prioritized blockers with copy-paste prompts for Cursor, Claude, or Codex. Fix in your IDE.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Rescan and ship",
    description: "Upload again after fixes. Track your launch readiness score over time. Ship with evidence.",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const ratio = entry.intersectionRatio;
            const step = Math.min(3, Math.floor(ratio * 4));
            setActiveStep(step);
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-[var(--spacing-section)] px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto">
        <Appear>
          <p
            className="text-xs font-medium tracking-[0.12em] uppercase mb-4"
            style={{ color: "var(--signal-amber)" }}
          >
            The Loop
          </p>
        </Appear>
        <Appear delay={0.1}>
          <h2
            className="font-bold tracking-tight mb-16"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
            }}
          >
            Four steps to launch readiness.
          </h2>
        </Appear>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-void-3 hidden md:block" />
          <div
            className="absolute left-[23px] top-0 w-px hidden md:block transition-all duration-700"
            style={{
              height: `${((activeStep + 1) / STEPS.length) * 100}%`,
              background: "var(--signal-amber)",
            }}
          />

          <div className="space-y-12">
            {STEPS.map((step, i) => (
              <Appear key={step.number} delay={i * 0.1}>
                <div className="flex gap-6 md:gap-8 items-start">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full border flex items-center justify-center text-lg font-mono font-bold transition-colors duration-500"
                      style={{
                        borderColor:
                          i <= activeStep
                            ? "var(--signal-amber)"
                            : "var(--void-3)",
                        color:
                          i <= activeStep
                            ? "var(--signal-amber)"
                            : "var(--text-quaternary)",
                        background:
                          i <= activeStep ? "var(--signal-amber-dim)" : "var(--void-1)",
                      }}
                    >
                      {step.number}
                    </div>
                  </div>
                  <div className="pt-2">
                    <step.icon
                      size={20}
                      className="mb-3"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed max-w-md"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </Appear>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/landing/HowItWorksSection.tsx
git commit -m "feat: add HowItWorksSection with scroll-driven timeline"
```

---

### Task 10: Rewrite Landing Page — Main Landing Entry Point

**Files:**
- Modify: `src/pages/landing.tsx`

- [ ] **Step 1: Read current landing.tsx**

Use Read tool on `src/pages/landing.tsx`

- [ ] **Step 2: Rewrite landing.tsx**

Replace the entire file with:

```tsx
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { StarfieldCanvas } from "@/components/StarfieldCanvas";
import { VoidButton } from "@/components/VoidButton";
import { VoidCard } from "@/components/VoidCard";
import { Appear } from "@/components/Appear";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { HeroSection } from "./landing/HeroSection";
import { FeaturesSection } from "./landing/FeaturesSection";
import { HowItWorksSection } from "./landing/HowItWorksSection";
import { AuthModal } from "./landing/AuthModal";
import { testimonials, integrations } from "./landing/landing-data";

export default function LandingPage() {
  const { signIn, signUp, signInDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const supabaseReady = !supabaseConfigError;

  useEffect(() => {
    if (user) navigate("/app");
  }, [user, navigate]);

  function openAuth() {
    setShowAuth(true);
  }

  async function handleSignIn(email: string, password: string) {
    if (!supabaseReady)
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    await signIn(email, password);
    navigate("/app");
  }

  async function handleSignUp(email: string, password: string) {
    if (!supabaseReady)
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    const result = await signUp(email, password);
    if (!result.needsEmailConfirmation) navigate("/app");
    return result;
  }

  async function handleDemo() {
    await signInDemo();
    navigate("/app");
  }

  return (
    <div className="min-h-screen bg-void-0 text-text-primary relative">
      <StarfieldCanvas />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-void-3 bg-void-0/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo size={30} animated />
          </motion.div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              How It Works
            </a>
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Pricing
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <VoidButton variant="ghost" size="sm" onClick={() => setShowAuth(true)}>
              Sign in
            </VoidButton>
            <VoidButton variant="primary" size="sm" onClick={openAuth}>
              Get Started <ArrowUpRight size={14} />
            </VoidButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <HeroSection onSignup={openAuth} onDemo={handleDemo} />

      {/* Signal Strip */}
      <section className="py-10 border-y border-void-3 bg-void-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p
            className="text-center text-xs tracking-[0.12em] uppercase mb-6"
            style={{ color: "var(--text-quaternary)" }}
          >
            Fix prompts that paste straight into your AI IDE
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {integrations.map((ig) => (
              <div
                key={ig.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-void-2 border border-void-3"
              >
                <span className="text-lg">{ig.icon}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {ig.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Testimonials */}
      <section className="py-[var(--spacing-section)] px-4 sm:px-6 border-t border-void-3">
        <div className="max-w-7xl mx-auto">
          <Appear>
            <p
              className="text-xs font-medium tracking-[0.12em] uppercase mb-4 text-center"
              style={{ color: "var(--signal-amber)" }}
            >
              From the observatory
            </p>
          </Appear>
          <Appear delay={0.1}>
            <h2
              className="font-bold tracking-tight mb-12 text-center"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
              }}
            >
              Builders who shipped with evidence
            </h2>
          </Appear>

          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <StaggerItem key={i}>
                <VoidCard className="flex flex-col gap-4 h-full">
                  <Quote size={18} style={{ color: "var(--signal-amber)", opacity: 0.6 }} />
                  <p
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t.quote}
                  </p>
                  <div className="pt-4 border-t border-void-3">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {t.author}
                    </p>
                    <p
                      className="text-xs mt-0.5 tracking-wide uppercase"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t.role}
                    </p>
                  </div>
                </VoidCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[var(--spacing-section)] px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative">
          <Appear>
            <div className="flex justify-center mb-6">
              <LogoMark size={44} animated />
            </div>
          </Appear>
          <Appear delay={0.1}>
            <h2
              className="font-bold tracking-tight mb-4"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
              }}
            >
              Point the observatory at your next launch.
            </h2>
          </Appear>
          <Appear delay={0.2}>
            <p
              className="text-lg mb-9 max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Join the builders who catch launch blockers before they ship —
              with evidence, not hope.
            </p>
          </Appear>
          <Appear delay={0.3}>
            <VoidButton variant="primary" size="lg" onClick={openAuth}>
              Start free — no credit card <ArrowUpRight size={17} />
            </VoidButton>
          </Appear>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-void-3 px-4 sm:px-6 py-10 bg-void-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <Logo size={26} />
          <div className="flex items-center gap-4">
            <a
              href="/privacy"
              className="text-xs transition-opacity hover:opacity-80"
              style={{ color: "var(--text-tertiary)" }}
            >
              Privacy
            </a>
            <span style={{ color: "var(--text-quaternary)" }}>·</span>
            <a
              href="/pricing"
              className="text-xs transition-opacity hover:opacity-80"
              style={{ color: "var(--text-tertiary)" }}
            >
              Pricing
            </a>
          </div>
          <p
            className="text-xs font-mono"
            style={{ color: "var(--text-tertiary)" }}
          >
            © 2026 NOCTRA · Ship with evidence.
          </p>
        </div>
      </footer>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onDemo={handleDemo}
      />
    </div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/landing.tsx src/pages/landing/FeaturesSection.tsx src/pages/landing/HowItWorksSection.tsx
git commit -m "feat: rewrite LandingPage with starfield, Void components, and 7-section layout"
```

---

### Task 11: Rewrite AppShell with New Navigation

**Files:**
- Create: `src/components/VoidNavSidebar.tsx`
- Create: `src/components/VoidTopBar.tsx`
- Modify: `src/components/AppShell.tsx`

- [ ] **Step 1: Create VoidNavSidebar.tsx**

```tsx
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Lightbulb,
  Stethoscope,
  Hammer,
  Brain,
  Menu,
  X,
  Settings,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Command Center", href: "/app" },
  { icon: Lightbulb, label: "Idea Lab", href: "/app/idea-lab" },
  { icon: Stethoscope, label: "Code Health", href: "/app/code-health" },
  { icon: Hammer, label: "Build Planner", href: "/app/build" },
  { icon: Brain, label: "Project Brain", href: "/app/brain" },
];

export function VoidNavSidebar() {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-void-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-void-2 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer relative",
                  isActive
                    ? "text-[var(--signal-amber)]"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-void-2"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-[var(--signal-amber)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon size={20} />
                {expanded && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-void-3 p-3 space-y-1">
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-void-2 transition-all w-full"
        >
          <Settings size={20} />
          {expanded && <span className="text-sm font-medium">Settings</span>}
        </button>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-void-2 transition-all w-full"
        >
          <LogOut size={20} />
          {expanded && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 border-r border-void-3 bg-void-1 transition-all duration-300",
          expanded ? "w-60" : "w-[72px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-void-1 border border-void-3"
        style={{ color: "var(--text-secondary)" }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-void-0/80"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full w-60 z-50 bg-void-1 border-r border-void-3"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-void-3">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  NOCTRA
                </span>
                <button onClick={() => setMobileOpen(false)}>
                  <X size={18} style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>
              <div className="p-3" onClick={() => setMobileOpen(false)}>
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Create VoidTopBar.tsx**

```tsx
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, Bell, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function VoidTopBar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const pageTitles: Record<string, string> = {
    "/app": "Command Center",
    "/app/idea-lab": "Idea Lab",
    "/app/code-health": "Code Health",
    "/app/build": "Build Planner",
    "/app/brain": "Project Brain",
  };

  const title = pageTitles[location] || "NOCTRA";

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-void-3 bg-void-0/80 backdrop-blur-xl flex items-center justify-between px-4">
      <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-lg hover:bg-void-2 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Search size={18} />
        </button>
        <button
          className="p-2 rounded-lg hover:bg-void-2 transition-colors relative"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--signal-amber)]" />
        </button>
        <div
          className="w-8 h-8 rounded-full bg-void-2 border border-void-3 flex items-center justify-center"
        >
          <User size={16} style={{ color: "var(--text-secondary)" }} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Modify AppShell.tsx**

Read current `src/components/AppShell.tsx`, then replace with:

```tsx
import type { ReactNode } from "react";
import { VoidNavSidebar } from "./VoidNavSidebar";
import { VoidTopBar } from "./VoidTopBar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-void-0 text-text-primary">
      <VoidNavSidebar />
      <div className="lg:ml-[72px] min-h-screen">
        <VoidTopBar />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/VoidNavSidebar.tsx src/components/VoidTopBar.tsx src/components/AppShell.tsx
git commit -m "feat: rewrite AppShell with VoidNavSidebar and VoidTopBar"
```

---

## Phase 2: Command Center + Core App

### Task 12: Create SignalTower (Three.js Lazy-Loaded)

**Files:**
- Create: `src/components/SignalTower.tsx`

- [ ] **Step 1: Install Three.js**

```bash
pnpm --filter @workspace/noctra add three @types/three
```

- [ ] **Step 2: Write SignalTower.tsx**

```tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface SignalTowerProps {
  status?: "idle" | "running" | "success" | "risk";
  activeRisks?: string[];
}

export function SignalTower({ status = "idle", activeRisks = [] }: SignalTowerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const statusRef = useRef(status);
  const timeRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, 400 / 600, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !isLowPower, alpha: true });
    renderer.setSize(400, 600);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPower ? 1 : 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Tower geometry — crystalline obelisk
    const geometry = new THREE.ConeGeometry(1.2, 4, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.9,
      roughness: 0.3,
      emissive: 0x000000,
    });
    const tower = new THREE.Mesh(geometry, material);
    tower.position.y = 1;
    scene.add(tower);

    // Edge lines — the signal traces
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff9f1c,
      transparent: true,
      opacity: 0.3,
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    tower.add(wireframe);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Point light for dramatic edge lighting
    const pointLight = new THREE.PointLight(0xff9f1c, 0.5, 10);
    pointLight.position.set(3, 3, 3);
    scene.add(pointLight);

    // Animation
    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Slow rotation (1 rotation per 60 seconds)
      tower.rotation.y += 0.001;

      // Status-based lighting
      const currentStatus = statusRef.current;

      if (currentStatus === "idle") {
        // Breathing glow: 4s in, 4s out
        const pulse = 0.3 + 0.2 * Math.sin(time * 0.8);
        lineMaterial.opacity = pulse;
        material.emissive.setHex(0x000000);
      } else if (currentStatus === "running") {
        // Fast chase — data stream racing up
        const chase = 0.5 + 0.3 * Math.sin(time * 8);
        lineMaterial.opacity = chase;
        material.emissive.setHex(0x1a0f00);
      } else if (currentStatus === "success") {
        // Bright steady pulse after flash
        const flash = time < 1 ? 1.0 : 0.6 + 0.1 * Math.sin(time * 2);
        lineMaterial.opacity = flash;
        material.emissive.setHex(time < 1 ? 0xff9f1c : 0x1a0f00);
      } else if (currentStatus === "risk") {
        // Red base illumination
        lineMaterial.opacity = 0.8;
        material.emissive.setHex(0x330000);
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    // Intersection observer — pause when not visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          cancelAnimationFrame(frameRef.current);
        } else {
          frameRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0 }
    );
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      edges.dispose();
      lineMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed right-0 top-0 h-screen w-[400px] hidden xl:block pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
```

- [ ] **Step 3: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SignalTower.tsx
git commit -m "feat: add SignalTower Three.js component with status-based lighting"
```

---

### Task 13: Create VoidCursor Component

**Files:**
- Create: `src/components/VoidCursor.tsx`

- [ ] **Step 1: Write VoidCursor.tsx**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VoidCursor.tsx
git commit -m "feat: add VoidCursor with hover expansion and signal amber on clickable elements"
```

---

### Task 14: Update App.tsx with VoidCursor

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read current App.tsx**

Use Read tool on `src/App.tsx`

- [ ] **Step 2: Add VoidCursor import and render**

Add import at top:
```tsx
import { VoidCursor } from "@/components/VoidCursor";
```

Add `<VoidCursor />` inside the `App` function return, just after `<QueryClientProvider>`:
```tsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VoidCursor />
      <AuthProvider>
```

- [ ] **Step 3: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate VoidCursor into app root"
```

---

### Task 15: Create Remaining Void Components (Skeleton, Toast, Modal)

**Files:**
- Create: `src/components/VoidSkeleton.tsx`
- Create: `src/components/VoidToast.tsx`
- Create: `src/components/VoidModal.tsx`

- [ ] **Step 1: Write VoidSkeleton.tsx**

```tsx
import { cn } from "@/lib/utils";

interface VoidSkeletonProps {
  className?: string;
  height?: number;
}

export function VoidSkeleton({ className, height = 120 }: VoidSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-void-3 overflow-hidden",
        className
      )}
      style={{ height }}
    >
      <div
        className="w-full h-full"
        style={{
          background:
            "linear-gradient(90deg, var(--void-2) 25%, var(--void-3) 50%, var(--void-2) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write VoidToast.tsx**

```tsx
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface VoidToastProps {
  show: boolean;
  children: ReactNode;
  variant?: "info" | "success" | "error";
  onClose?: () => void;
}

const borderColors = {
  info: "var(--signal-amber)",
  success: "var(--color-success)",
  error: "var(--color-danger)",
};

export function VoidToast({ show, children, variant = "info", onClose }: VoidToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50 bg-void-2 border-l-[3px] rounded-xl p-4 max-w-sm shadow-lg"
          style={{ borderLeftColor: borderColors[variant] }}
        >
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {children}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-text-quaternary hover:text-text-secondary"
            >
              ×
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Write VoidModal.tsx**

```tsx
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface VoidModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function VoidModal({ open, onClose, children, title }: VoidModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-void-1 border border-void-3 rounded-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/VoidSkeleton.tsx src/components/VoidToast.tsx src/components/VoidModal.tsx
git commit -m "feat: add VoidSkeleton, VoidToast, and VoidModal components"
```

---

### Task 16: Rewrite Command Center with Signal Tower

**Files:**
- Modify: `src/pages/command-center.tsx`

- [ ] **Step 1: Read current command-center.tsx**

Use Read tool on `src/pages/command-center.tsx`

- [ ] **Step 2: Add imports at top**

Add to existing imports:
```tsx
import { lazy, Suspense } from "react";
import { VoidCard } from "@/components/VoidCard";
import { VoidButton } from "@/components/VoidButton";
import { Appear } from "@/components/Appear";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const SignalTower = lazy(() => import("@/components/SignalTower"));
```

- [ ] **Step 3: Determine tower status based on data**

Add after `const brain = ...` line:
```tsx
const towerStatus = loading
  ? "idle"
  : redGates.length > 0
  ? "risk"
  : reports.length > 0
  ? "success"
  : "idle";
```

- [ ] **Step 4: Wrap stat cards with VoidCard and StaggerContainer**

Find the grid of 4 stat cards (around line 247) and wrap each existing card content in:
```tsx
<StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

Then wrap each individual card div in:
```tsx
<StaggerItem>
  <VoidCard>
    {/* existing card content */}
  </VoidCard>
</StaggerItem>
```

- [ ] **Step 5: Add Signal Tower to layout**

After the `<AppShell>` opening tag, add:
```tsx
<Suspense fallback={null}>
  <SignalTower status={towerStatus} activeRisks={redGates} />
</Suspense>
```

- [ ] **Step 6: Replace existing buttons with VoidButton**

Find all `<motion.button>` elements in the file and replace with `<VoidButton>` equivalents, preserving onClick and content.

- [ ] **Step 7: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/command-center.tsx
git commit -m "feat: rewrite Command Center with Signal Tower, VoidCards, and VoidButtons"
```

---

### Task 17: Update Tool Pages (Idea Lab, Code Health, Build Planner, Project Brain)

**Files:**
- Modify: `src/pages/idea-lab.tsx`
- Modify: `src/pages/code-health.tsx`
- Modify: `src/pages/build-planner.tsx`
- Modify: `src/pages/project-brain.tsx`

- [ ] **Step 1: For each file, apply these changes:**

For each of the 4 files:

1. Read the file
2. Replace all `<motion.button` with `<VoidButton`
3. Replace card divs with `<VoidCard>...</VoidCard>`
4. Replace input elements with `<VoidInput />`
5. Ensure form containers have `bg-void-0` class
6. Remove any starfield imports

Example pattern for Idea Lab:

```tsx
// Before:
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onClick={...}
  className="..."
>
  Run Analysis
</motion.button>

// After:
<VoidButton variant="primary" onClick={...}>
  Run Analysis
</VoidButton>
```

- [ ] **Step 2: Type check all files**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 3: Commit each file individually**

```bash
git add src/pages/idea-lab.tsx
git commit -m "feat: restyle Idea Lab with Void design system"
git add src/pages/code-health.tsx
git commit -m "feat: restyle Code Health with Void design system"
git add src/pages/build-planner.tsx
git commit -m "feat: restyle Build Planner with Void design system"
git add src/pages/project-brain.tsx
git commit -m "feat: restyle Project Brain with Void design system"
```

---

## Phase 3: Detail Pages + Polish

### Task 18: Update Detail Pages

**Files:**
- Modify: `src/pages/project-detail.tsx`
- Modify: `src/pages/report-detail.tsx`
- Modify: `src/pages/pricing.tsx`
- Modify: `src/pages/not-found.tsx`

- [ ] **Step 1: Update project-detail.tsx**

1. Read file
2. Update tab navigation: add amber underline indicator (2px)
3. Wrap content cards in `<VoidCard>`
4. Replace buttons with `<VoidButton>`
5. Add `bg-void-0` to main container

- [ ] **Step 2: Update report-detail.tsx**

1. Read file
2. Wrap cards in `<VoidCard>`
3. Replace buttons with `<VoidButton>`
4. Add `bg-void-0` to main container

- [ ] **Step 3: Update pricing.tsx**

1. Read file
2. Add starfield background (import `<StarfieldCanvas />`)
3. Update pricing cards to `<VoidCard featured>`
4. Use monumental typography for pricing headline
5. Amber highlight for recommended plan

- [ ] **Step 4: Update not-found.tsx**

Replace with:
```tsx
import { StarfieldCanvas } from "@/components/StarfieldCanvas";
import { VoidButton } from "@/components/VoidButton";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-void-0 flex items-center justify-center relative">
      <StarfieldCanvas opacity={0.5} />
      <div className="text-center relative z-10">
        <h1
          className="font-bold tracking-tight mb-4"
          style={{
            color: "var(--text-primary)",
            fontSize: "clamp(4rem, 15vw, 12rem)",
          }}
        >
          404
        </h1>
        <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
          This signal has been lost to the void.
        </p>
        <VoidButton variant="primary" onClick={() => navigate("/")}>
          Return to base
        </VoidButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Type check**

```bash
pnpm --filter @workspace/noctra run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/project-detail.tsx src/pages/report-detail.tsx src/pages/pricing.tsx src/pages/not-found.tsx
git commit -m "feat: restyle detail pages, pricing, and 404 with Void design system"
```

---

### Task 19: Full Build Verification

- [ ] **Step 1: Run full typecheck**

```bash
pnpm run typecheck
```
Expected: Zero errors across all packages

- [ ] **Step 2: Run build**

```bash
pnpm run build
```
Expected: Build completes successfully with no errors

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @workspace/noctra run test
```
Expected: All existing tests pass (or update snapshots if needed)

- [ ] **Step 4: Performance audit**

Open built files and verify:
- Landing page bundle < 300kb gzipped
- Three.js is NOT in initial bundle (should be in separate chunk)
- Starfield uses Canvas 2D (lightweight)

- [ ] **Step 5: Accessibility audit**

Verify:
- `prefers-reduced-motion` disables parallax and twinkle
- All interactive elements have focus states
- Color contrast meets WCAG AA (text-primary on void-0 = high contrast)
- Custom cursor doesn't break keyboard navigation

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete Signal Void frontend redesign — all pages, components, and polish"
```

---

## Plan Self-Review

### Spec Coverage Check

| Spec Section | Plan Task | Status |
|-------------|-----------|--------|
| Color tokens (Signal Void palette) | Task 1 | ✅ |
| Typography scale | Task 1 (CSS) + used in all components | ✅ |
| Spacing tokens | Task 1 (CSS) + used throughout | ✅ |
| Starfield Canvas (parallax, twinkle, performance) | Task 3 | ✅ |
| Signal Tower (Three.js, lazy, status states) | Task 12 | ✅ |
| Motion vocabulary (appear, hover, press, loading) | Tasks 2, 4, 5, 6, 15 | ✅ |
| Void Cursor | Task 13 | ✅ |
| Landing page 7 sections | Tasks 7, 8, 9, 10 | ✅ |
| App Shell (sidebar, top bar) | Task 11 | ✅ |
| Command Center restyle + tower | Task 16 | ✅ |
| Tool pages restyle | Task 17 | ✅ |
| Detail pages + pricing + 404 | Task 18 | ✅ |
| Performance budget | Task 19 | ✅ |
| prefers-reduced-motion | Tasks 3, 13 | ✅ |
| Mobile responsive | Tasks 11 (sidebar), 3 (starfield) | ✅ |

### Placeholder Scan
No TBD, TODO, or "implement later" found. All code is complete.

### Type Consistency
- `VoidButton` uses `variant: "primary" | "secondary" | "ghost" | "danger"` consistently
- `SignalTower` uses `status: "idle" | "running" | "success" | "risk"` consistently
- All new components use `cn()` from `@/lib/utils` for class merging
- CSS custom properties use consistent naming (`--void-*`, `--signal-*`, `--text-*`)

### Gaps Found & Fixed
- Added `VoidSkeleton` for loading states (spec 6.4)
- Added `VoidToast` for notifications (spec 6.5)
- Added `VoidModal` for dialogs (spec 6.6)
- Updated `not-found.tsx` with starfield (spec 8.2)
- Added full build verification step (Task 19)

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-01-noctra-frontend-redesign-plan.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for maintaining quality across this massive scope.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Faster but riskier for token limits.

**Which approach?**
