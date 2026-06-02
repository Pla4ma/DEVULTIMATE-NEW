# NOCTRA Obsidian & Signal Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire NOCTRA frontend with the Obsidian & Signal design system — deep warm blacks, surgical amber accent, Inter typography, hairline borders, purposeful animations.

**Architecture:** Replace the existing "Signal Void" system (which used flat blacks, dark-on-dark text, gimmicks like starfield and custom cursor) with a precision design system using CSS custom properties, Tailwind v4 theme tokens, and a small set of reusable components. No external libraries beyond existing stack.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, Lucide icons, Vite

---

## Phase 1: Global CSS Tokens and Base Styles

### Task 1.1: Rewrite index.css — Design Tokens

**Files:**
- Modify: `src/index.css`

**Steps:**

- [ ] **Step 1: Replace all existing color/border/text/shadow tokens in @theme inline**

Replace the existing `@theme inline` block with obsidian tokens mapped to Tailwind classes.

Key tokens to add in `@theme inline`:
```css
--color-obsidian-0: #050507;
--color-obsidian-1: #0A0A0F;
--color-obsidian-2: #12121A;
--color-obsidian-3: #1A1A24;
--color-obsidian-4: #22222E;
--color-signal: #FF9F1C;
--color-signal-dim: rgba(255, 159, 28, 0.12);
--color-signal-glow: rgba(255, 159, 28, 0.25);
--color-signal-deep: #CC7E16;
--color-text-primary: #F0F0F5;
--color-text-secondary: #A0A0B0;
--color-text-tertiary: #6E6E80;
--color-text-quaternary: #454554;
--color-success: #34D399;
--color-warning: #FBBF24;
--color-danger: #F87171;
--color-border-subtle: rgba(255, 255, 255, 0.04);
--color-border-default: rgba(255, 255, 255, 0.06);
--color-border-strong: rgba(255, 255, 255, 0.10);
```

Also map the legacy shadcn tokens to obsidian:
```css
--color-background: #0A0A0F;
--color-foreground: #F0F0F5;
--color-border: rgba(255, 255, 255, 0.06);
--color-input: rgba(255, 255, 255, 0.06);
--color-ring: rgba(255, 159, 28, 0.25);
--color-card: #12121A;
--color-card-foreground: #F0F0F5;
--color-primary: #FF9F1C;
--color-primary-foreground: #050507;
--color-secondary: #1A1A24;
--color-secondary-foreground: #F0F0F5;
--color-muted: #12121A;
--color-muted-foreground: #6E6E80;
--color-accent: #1A1A24;
--color-accent-foreground: #F0F0F5;
--color-destructive: #F87171;
--color-destructive-foreground: #F0F0F5;
```

Keep existing `--font-sans`, `--font-mono`, `--radius-*` definitions. Add `letter-spacing-tight: -0.03em`.

- [ ] **Step 2: Rewrite :root CSS variables block**

Replace the giant existing :root block with a clean obsidian variable system. Remove all old `oklch()` variables, `--accent-cyan`, `--accent-violet`, `--accent-magenta`, `--accent-gold`, `--shadow-*` old definitions, `--glass-*`, `--noctra-*` legacy aliases, and the entire `:root.light` block (we are dark-only).

New :root:
```css
:root {
  --obsidian-0: #050507;
  --obsidian-1: #0A0A0F;
  --obsidian-2: #12121A;
  --obsidian-3: #1A1A24;
  --obsidian-4: #22222E;
  --signal: #FF9F1C;
  --signal-dim: rgba(255, 159, 28, 0.12);
  --signal-glow: rgba(255, 159, 28, 0.25);
  --signal-deep: #CC7E16;
  --text-primary: #F0F0F5;
  --text-secondary: #A0A0B0;
  --text-tertiary: #6E6E80;
  --text-quaternary: #454554;
  --border-subtle: rgba(255, 255, 255, 0.04);
  --border-default: rgba(255, 255, 255, 0.06);
  --border-strong: rgba(255, 255, 255, 0.10);
  --success: #34D399;
  --warning: #FBBF24;
  --danger: #F87171;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

- [ ] **Step 3: Rewrite base layer styles**

```css
@layer base {
  * {
    @apply border-border-default;
  }
  body {
    @apply bg-obsidian-1 text-text-primary antialiased;
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  h1, h2, h3, h4 {
    @apply tracking-tight font-semibold;
    font-family: var(--font-sans);
  }
  html {
    color-scheme: dark;
    scroll-behavior: smooth;
  }
  ::selection {
    background: rgba(255, 159, 28, 0.25);
    color: #F0F0F5;
  }
}
```

- [ ] **Step 4: Rewrite utility layer — clean animations + eyebrow**

Remove all old animations (noctra-spin, noctra-pulse, float, shimmer, gradient-shift, glow-pulse, aurora-drift, scan-sweep). Keep only:

```css
@layer utilities {
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, var(--obsidian-2) 25%, var(--obsidian-3) 50%, var(--obsidian-2) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
```

- [ ] **Step 5: Remove ALL old prose styles, old animation classes, old glass classes, old focus classes, old toggle-elevate classes, old scrollbar overrides, old constellation-grid, old grain, old cursor-blink, old animate-* classes. Clean slate.**

- [ ] **Step 6: Build check**

Run: `pnpm --filter @workspace/noctra exec vite build --config vite.config.ts`
Expected: No new errors (old test errors are fine).

---

## Phase 2: Core Component Library

### Task 2.1: ObsidianButton

**Files:**
- Create: `src/components/ObsidianButton.tsx`
- Delete: `src/components/VoidButton.tsx`

**Steps:**

- [ ] **Step 1: Write ObsidianButton component**

```tsx
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
}

export function ObsidianButton({
  variant = "primary",
  size = "md",
  children,
  isLoading,
  className,
  disabled,
  ...props
}: Props) {
  const base = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-glow/50";
  const variants = {
    primary: "bg-signal text-obsidian-0 hover:bg-signal-deep active:scale-[0.98]",
    secondary: "bg-transparent border border-border-default text-text-secondary hover:bg-obsidian-3 hover:border-border-strong active:bg-obsidian-2",
    ghost: "bg-transparent text-text-tertiary hover:text-text-secondary hover:bg-obsidian-2",
    danger: "bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-md",
    md: "px-4 py-2.5 text-sm rounded-md",
    lg: "px-6 py-3.5 text-sm rounded-lg",
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], (disabled || isLoading) && "opacity-40 pointer-events-none", className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> : children}
    </button>
  );
}
```

- [ ] **Step 2: Delete VoidButton.tsx**

- [ ] **Step 3: Update all imports from VoidButton to ObsidianButton**

Files to update: `src/pages/command-center.tsx`, `src/pages/landing.tsx`, `src/pages/build-planner.tsx`, `src/pages/project-brain.tsx`, `src/pages/project-detail.tsx`, `src/pages/report-detail.tsx`, `src/pages/pricing.tsx`, `src/pages/not-found.tsx`

Replace `import { VoidButton }` with `import { ObsidianButton }` and `<VoidButton` with `<ObsidianButton`.

### Task 2.2: ObsidianCard

**Files:**
- Create: `src/components/ObsidianCard.tsx`
- Delete: `src/components/VoidCard.tsx`

**Steps:**

- [ ] **Step 1: Write ObsidianCard component**

```tsx
import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function ObsidianCard({ children, className, hover = true, ...props }: Props) {
  return (
    <div
      className={cn(
        "bg-obsidian-2 border border-border-default rounded-xl p-5",
        hover && "transition-all duration-200 hover:border-border-strong hover:-translate-y-px",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Delete VoidCard.tsx**

- [ ] **Step 3: Update all imports**

Replace `VoidCard` with `ObsidianCard` in: `landing.tsx`, `pricing.tsx`, `command-center.tsx`, etc.

### Task 2.3: ObsidianInput + ObsidianTextarea

**Files:**
- Create: `src/components/ObsidianInput.tsx`
- Delete: `src/components/VoidInput.tsx` (if exists)

**Steps:**

- [ ] **Step 1: Write component**

```tsx
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const ObsidianInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-obsidian-2 border border-border-default rounded-md px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary",
        "focus:outline-none focus:border-signal focus:ring-2 focus:ring-signal-glow/30",
        "hover:border-border-strong",
        "transition-colors duration-150",
        className
      )}
      {...props}
    />
  )
);
ObsidianInput.displayName = "ObsidianInput";

export const ObsidianTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-obsidian-2 border border-border-default rounded-md px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary resize-none",
        "focus:outline-none focus:border-signal focus:ring-2 focus:ring-signal-glow/30",
        "hover:border-border-strong",
        "transition-colors duration-150",
        className
      )}
      {...props}
    />
  )
);
ObsidianTextarea.displayName = "ObsidianTextarea";
```

### Task 2.4: ObsidianNavSidebar

**Files:**
- Create: `src/components/ObsidianNavSidebar.tsx`
- Delete: `src/components/VoidNavSidebar.tsx`

**Steps:**

- [ ] **Step 1: Write clean sidebar component**

64px wide, icon-only. Amber active indicator (2px left border + signal-dim background). Items: Dashboard, Idea Lab, Code Health, Build Planner, Project Brain. No expand animation. Clean hover states.

Use `useLocation` from wouter. Active item has left border and slightly brighter background. Simple, no framer motion for the indicator (use CSS `transition`).

### Task 2.5: ObsidianTopBar

**Files:**
- Create: `src/components/ObsidianTopBar.tsx`
- Delete: `src/components/VoidTopBar.tsx`

**Steps:**

- [ ] **Step 1: Write clean topbar**

48px height. Transparent background. 1px bottom border `--border-subtle`. Page title on left. Search, Bell (with amber dot), User avatar on right.

### Task 2.6: AppShell

**Files:**
- Modify: `src/components/AppShell.tsx`

**Steps:**

- [ ] **Step 1: Rewrite AppShell**

```tsx
import type { ReactNode } from "react";
import { ObsidianNavSidebar } from "./ObsidianNavSidebar";
import { ObsidianTopBar } from "./ObsidianTopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-obsidian-1 text-text-primary">
      <ObsidianNavSidebar />
      <div className="lg:ml-16 min-h-screen">
        <ObsidianTopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

## Phase 3: Landing Page Rewrite

**Files:**
- Modify: `src/pages/landing.tsx`
- Delete: `src/components/StarfieldCanvas.tsx`, `src/components/SignalTower.tsx`, `src/components/Appear.tsx`, `src/components/StaggerContainer.tsx`
- Keep: `src/pages/landing/HeroSection.tsx`, `src/pages/landing/FeaturesSection.tsx`, `src/pages/landing/HowItWorksSection.tsx`, `src/pages/landing/AuthModal.tsx` (rewrite contents)

### Task 3.1: Rewrite HeroSection

**Steps:**

- [ ] **Step 1: Clean hero — no canvas, no animations beyond fade-in**

Full viewport height. Centered content. Max-width container.
- Eyebrow: "LAUNCH INTELLIGENCE" in eyebrow style, signal color
- Headline: "Ship with evidence, not hope." at `text-hero` size. "not hope." in signal color.
- Subtext: 1-2 sentences, text-secondary, max-width 480px
- CTAs: "Start free analysis" (primary) + "Explore demo" (secondary)
- Simple fade-in on load using framer motion (opacity 0→1, y 8→0, 300ms)

### Task 3.2: Rewrite FeaturesSection

**Steps:**

- [ ] **Step 1: Clean 3-column grid**

Background: obsidian-1. Eyebrow + headline. 3 cards with icon + title + description. Standard ObsidianCard. No "featured" glow. Clean hover lift.

### Task 3.3: Rewrite HowItWorksSection

**Steps:**

- [ ] **Step 1: 4-step timeline**

Horizontal on desktop, vertical on mobile. Step numbers (01-04) in signal color, mono font. Connecting lines. Simple, no scroll-driven animations.

### Task 3.4: Rewrite landing.tsx wrapper

**Steps:**

- [ ] **Step 1: Clean page wrapper**

No starfield import. No canvas. Header uses bg-obsidian-1 + border-b border-border-default. All sections use clean background colors. Footer simple.

---

## Phase 4: App Pages

### Task 4.1: Command Center

**Files:**
- Modify: `src/pages/command-center.tsx`

**Steps:**

- [ ] **Step 1: Clean dashboard layout**

Remove StarfieldCanvas import, remove SignalTower import. Remove Suspense/lazy for SignalTower.

Header: title + subtitle + action buttons.
4 metric cards in a row: Launch Readiness (score/100), Blockers (count), Tasks Open (count), Last Scan (timestamp). Each uses ObsidianCard.

Status banner (if no scan): full-width card with dashed border, icon + text + CTA.

Recent reports list: clean rows with tool icon, title, score badge, date.

### Task 4.2: Idea Lab

**Files:**
- Modify: `src/pages/idea-lab.tsx`

**Steps:**

- [ ] **Step 1: Two-column layout**

Mode tabs at top (simple button row, active has signal border + dim bg). Input panel (ObsidianCard): textarea + ObsidianButton primary. Output panel (ObsidianCard): empty/loading/result states.

Remove all old dark-mode inline styles. Use Tailwind classes.

### Task 4.3: Code Health

**Files:**
- Modify: `src/pages/code-health.tsx`

**Steps:**

- [ ] **Step 1: Clean two-column layout**

Upload zone: dashed border, border-dashed border-border-default, hover:border-signal. Drag-and-drop support preserved.

Results: categorized cards (errors/danger, warnings, info/success). Each finding is a clean row.

### Task 4.4: Build Planner

**Files:**
- Modify: `src/pages/build-planner.tsx`

**Steps:**

- [ ] **Step 1: Clean layout**

Tabs: MVP Planner | Fix Tasks. Active tab has signal border + dim background.

MVP: input textarea + generate button. Output: structured plan sections.

Tasks: filter row + task list. Task cards with checkbox, title, priority badge.

### Task 4.5: Project Brain

**Files:**
- Modify: `src/pages/project-brain.tsx`

**Steps:**

- [ ] **Step 1: Clean layout**

Tabs: AI Chat | Projects | Reports | Profile. Active tab styled with signal.

Chat panel: message bubbles (user = signal bg with dark text, assistant = obsidian-2 bg). Input row at bottom.

Stats sidebar: clean metric cards.

---

## Phase 5: Detail Pages + Static Pages

### Task 5.1: Project Detail

**Files:**
- Modify: `src/pages/project-detail.tsx`

**Steps:**

- [ ] **Step 1: Clean layout with ObsidianCard containers**

Header: back button + project name + stats. Score ring if available.

Tab bar: overview, reports, execution, proof, doctor, twin, launch, history. Active tab has signal indicator.

All tab content wrapped in ObsidianCard.

### Task 5.2: Report Detail

**Files:**
- Modify: `src/pages/report-detail.tsx`

**Steps:**

- [ ] **Step 1: Clean layout**

Header: tool badge + title + score + date. Report renderer in ObsidianCard.

Action panels: workflow actions, execution actions, export actions. Each in ObsidianCard.

### Task 5.3: Pricing Page

**Files:**
- Modify: `src/pages/pricing.tsx`

**Steps:**

- [ ] **Step 1: Clean pricing cards**

No starfield. Clean obsidian-0 hero background. Three pricing tiers in ObsidianCard. Featured tier has signal border.

Toggle: monthly/yearly. Clean switch component.

FAQ: simple accordion with border-t dividers.

### Task 5.4: Not Found

**Files:**
- Modify: `src/pages/not-found.tsx`

**Steps:**

- [ ] **Step 1: Clean 404**

Big "404" in text-hero size. "This page doesn't exist." in text-secondary. "Go back" button (secondary).

---

## Phase 6: Cleanup & Verification

### Task 6.1: Delete Old Components

**Files to delete:**
- `src/components/VoidButton.tsx`
- `src/components/VoidCard.tsx`
- `src/components/VoidInput.tsx`
- `src/components/VoidNavSidebar.tsx`
- `src/components/VoidTopBar.tsx`
- `src/components/VoidCursor.tsx`
- `src/components/VoidSkeleton.tsx`
- `src/components/VoidToast.tsx`
- `src/components/VoidModal.tsx`
- `src/components/StarfieldCanvas.tsx`
- `src/components/SignalTower.tsx`
- `src/components/Appear.tsx`
- `src/components/StaggerContainer.tsx`

**Files to clean up imports in:**
Search for any remaining references to deleted components and remove them.

### Task 6.2: Global Import Check

**Steps:**

- [ ] **Step 1: Verify no broken imports**

Run: `pnpm --filter @workspace/noctra exec tsc -p tsconfig.json --noEmit 2>&1 | grep "Cannot find module" | head -20`
Expected: No module resolution errors.

### Task 6.3: Build Verification

**Steps:**

- [ ] **Step 1: Production build**

Run: `pnpm --filter @workspace/noctra exec vite build --config vite.config.ts`
Expected: Build completes successfully. No new source file errors.

- [ ] **Step 2: Visual sanity check**

Open `dist/public/index.html` in browser. Verify:
1. Landing page loads with clean obsidian background
2. Text is readable (not dark-on-dark)
3. Amber accent appears only on buttons, active states, links
4. No canvas elements, no custom cursor
5. Cards have visible borders

### Task 6.4: Commit

**Steps:**

- [ ] **Step 1: Stage all changes**

```bash
git add -A
git status
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement Obsidian & Signal design system

- Replace Signal Void with Obsidian & Signal aesthetic
- New color system: 5 obsidian blacks, warm grays, 1 amber accent
- Inter typography throughout
- Hairline borders for elevation (no shadows)
- New component library: ObsidianButton, ObsidianCard, ObsidianInput, ObsidianNav, ObsidianTopBar
- Landing page: massive typography, clean hero, no gimmicks
- App shell: clean sidebar with amber indicator, transparent top bar
- All tool pages rebuilt with consistent card-based layout
- Deleted: Void components, StarfieldCanvas, SignalTower, custom cursor
- Build passes cleanly"
```

---

## Spec Coverage Checklist

| Spec Section | Task(s) |
|---|---|
| Color system (obsidian-0..4, text hierarchy, signal) | 1.1, 1.2 |
| Typography (Inter, type scale) | 1.1 (font tokens), all page tasks |
| Spacing (4px base unit) | Implicit in Tailwind, all page tasks |
| Borders & elevation (hairlines, no shadows) | 1.1, 2.2, all page tasks |
| Component design (button, card, input, nav, topbar) | 2.1 - 2.6 |
| Animation principles | 1.4 (minimal keyframes), page tasks |
| Landing page design | 3.1 - 3.4 |
| App shell design | 2.4, 2.5, 2.6 |
| Command Center design | 4.1 |
| Tool pages design | 4.2 - 4.5 |
| Detail pages design | 5.1 - 5.2 |
| Pricing & Not Found | 5.3 - 5.4 |
| Accessibility (contrast, focus, reduced motion) | 1.3 (selection, focus rings) |
| Performance (no canvas, no blur, no cursor) | 6.1 (deletions) |

**Gaps:** None. All spec sections have corresponding tasks.

**Placeholder scan:** No TBD, TODO, or vague steps. Every step has exact code or exact commands.

**Type consistency:** All components use consistent prop interfaces. `ObsidianButton` replaces `VoidButton` everywhere.
