# NOCTRA Frontend Redesign — "Signal Void"

**Date:** 2026-06-01
**Designer:** Kimi K2.6
**Status:** Approved — Ready for Implementation Planning

---

## 1. Design Philosophy

> **Absolute black void. One living signal. Nothing else competes for attention.**

Noctra is an observatory for shipping. The new visual identity treats the screen as deep space — a void where the only thing that matters is the amber signal of insight. Every pixel must justify its existence.

**Core Principles:**
1. **Monumental Minimalism** — Massive typography, vast whitespace, brutalist confidence
2. **Living Signal** — The amber signal breathes, pulses, and speaks only when something matters
3. **Physical Gravity** — Motion feels heavy and gravitational, like operating machinery in space
4. **Developer-First** — This is a tool for builders, not a consumer app. No playful bounces. No cartoon emojis. Precision.

---

## 2. Visual Identity & Color System

### 2.1 Philosophy
Absolute black void. One living signal. Nothing else competes for attention. Every pixel must justify its existence.

### 2.2 Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--void-0` | `#000000` | Page background — absolute black |
| `--void-1` | `#0A0A0A` | Card surfaces — barely above black |
| `--void-2` | `#111111` | Elevated panels |
| `--void-3` | `#1A1A1A` | Borders, hairlines |
| `--signal-amber` | `#FF9F1C` | Primary accent — the ONE color |
| `--signal-amber-dim` | `rgba(255, 159, 28, 0.14)` | Soft backgrounds behind signal elements |
| `--signal-amber-glow` | `rgba(255, 159, 28, 0.30)` | Glow, bloom effects |
| `--text-primary` | `#F5F5F5` | Headings — warm white |
| `--text-secondary` | `#888888` | Body — muted gray |
| `--text-tertiary` | `#555555` | Captions — almost invisible |
| `--text-quaternary` | `#333333` | Disabled — barely there |
| `--color-danger` | `#EF4444` | Error/danger — used ONLY for actual errors |
| `--color-danger-soft` | `rgba(239, 68, 68, 0.14)` | Danger backgrounds |
| `--color-success` | `#22C55E` | Success — used sparingly |
| `--color-success-soft` | `rgba(34, 197, 94, 0.14)` | Success backgrounds |
| `--color-warning` | `#F59E0B` | Warning — overlaps with signal amber; avoid |

### 2.3 Typography Scale (Monumental)

| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | `clamp(3rem, 8vw, 7rem)` | Hero headlines — Inter or Geist, weight 800, tracking -0.04em |
| `--font-h1` | `clamp(2rem, 5vw, 4rem)` | Section titles — weight 700, tracking -0.03em |
| `--font-h2` | `clamp(1.5rem, 3vw, 2.5rem)` | Card titles — weight 600, tracking -0.02em |
| `--font-body` | `16px/1.6` | Body text — weight 400 |
| `--font-mono` | `13px` | Data, scores, technical readouts — JetBrains Mono or Geist Mono |
| `--font-eyebrow` | `11px` | Labels, uppercase, tracking 0.12em |

**Font Stack:**
- Primary: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Mono: `"JetBrains Mono", "Geist Mono", "SF Mono", "Fira Code", monospace`
- Load via `next/font` or Google Fonts with `display: swap`

### 2.4 Spacing Philosophy

| Token | Value | Usage |
|-------|-------|-------|
| `--space-section` | `clamp(120px, 15vh, 240px)` | Vertical section padding |
| `--space-card` | `32px–48px` | Card internal padding |
| `--space-gap` | `24px` | Default grid gap |
| `--space-gap-lg` | `48px` | Major section gap |
| `--radius-card` | `12px` | Card border radius |
| `--radius-pill` | `9999px` | Buttons, pills |
| `--radius-brutalist` | `0px` | Structural elements |

---

## 3. 3D Elements

### 3.1 The Starfield (`<StarfieldCanvas />`)

A fullscreen, absolutely-positioned `<canvas>` layer (z-index: -1) on select pages.

**Behavior:**
- ~3,000–5,000 tiny white dots, 1–2px each, with varying opacity (0.3–0.9)
- No connecting lines, no nebula, no color variation — just pure, distant pinpricks of light
- Parallax depth: Stars divided into 3 layers (near, mid, far). Scroll and mouse movement shift layers at different speeds:
  - Near: 0.08x
  - Mid: 0.04x
  - Far: 0.01x
- Subtle twinkle: Random opacity fluctuation on ~10% of stars, very slow (3–5s cycle)
- Performance: Pure Canvas 2D (NOT WebGL). `requestAnimationFrame` with visibility API pause. Mobile: reduced to 1,500 stars, no parallax

**Placement:**
- Landing page: full-bleed behind hero + features
- Command Center: behind the main content area (subtle, 50% opacity)
- NOT on: data-heavy tool pages (Idea Lab, Code Health, Build Planner, Project Brain) — they get `--void-0` black only

**Implementation:**
- Component: `src/components/StarfieldCanvas.tsx`
- Canvas 2D context
- `IntersectionObserver` to pause when not in viewport
- `prefers-reduced-motion` support: static starfield, no twinkle

### 3.2 The Signal Tower (`<SignalTower />`)

A singular, monumental 3D sculpture rendered in Three.js — ONLY on the Command Center page.

**Form:**
- Abstract crystalline obelisk/tower — sharp angles, matte black surface with thin amber signal lines tracing its edges
- Roughly 400×600px viewport size, positioned as a "guardian" on the right side of the Command Center hero area
- The tower slowly rotates on its Y-axis (1 rotation per 60 seconds — glacial, barely perceptible)

**Behavior — "The Living Signal":**

| State | Visual |
|-------|--------|
| **Idle** | Dark matte black. Only edge-lines emit a faint, breathing amber glow (pulse: 4s in, 4s out) |
| **Analysis running** | Edge-lines accelerate to a fast chase sequence (like a data stream racing up the tower) |
| **Analysis complete / success** | Entire tower flashes amber once, then settles into a brighter, steady pulse |
| **Risk detected** | Tower base sections illuminate in deep red (the ONLY exception to the one-color rule) |
| **Risk node hover** | When user hovers over a "red gate" or critical blocker card, the corresponding tower section flashes amber |

**Performance:**
- Single `MeshStandardMaterial` with emissive map for edge lines
- No real-time shadows, no post-processing
- Renders only when in viewport (`IntersectionObserver`)
- Falls back to static SVG silhouette on low-power mode
- Lazy-loaded via `React.lazy()` + dynamic `import("three")` — ONLY on Command Center

**Implementation:**
- Component: `src/components/SignalTower.tsx`
- Three.js loaded dynamically
- Props: `status: "idle" | "running" | "success" | "risk"`, `activeRisks?: string[]`
- Mobile: replaced by small amber status dot in top bar

---

## 4. Animation & Motion Language

### 4.1 Philosophy
Motion should feel **physical and gravitational**, not bouncy or playful. Like operating heavy machinery in space.

### 4.2 Motion Vocabulary

| Motion | Behavior | Duration | Easing |
|--------|----------|----------|--------|
| **Appear** | Fade in + translateY(24px → 0) | 0.6s | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Stagger** | Children cascade with 0.08s delay | — | — |
| **Hover (cards)** | translateY(-4px) + border glow intensify | 0.3s | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| **Hover (buttons)** | scale(1.02) + signal glow expand | 0.2s | ease-out |
| **Press** | scale(0.97) | 0.1s | ease-out |
| **Page transition** | Cross-fade: outgoing fades (0.15s), incoming staggers in (0.4s) | 0.4s total | ease-in-out |
| **Data update** | Number counts up with `requestAnimationFrame` | 1.2s | ease-out |
| **Loading** | Thin amber line slowly extends left→right, then snaps back | 2s cycle | linear |
| **Success state** | Element flashes signal-amber once (0.15s), then settles | 0.5s | ease-out |
| **Error state** | Sharp horizontal shake (8px, 3 cycles) + border flash red | 0.4s | ease-in-out |

### 4.3 Scroll-Driven Behaviors

- **Hero headline**: As user scrolls down, headline letters slightly spread apart (tracking increases from -0.04em → -0.02em over first 50vh)
- **Section reveals**: Each section uses `IntersectionObserver` with a 0.1 threshold. No parallax on content — only the starfield parallax
- **Sticky nav**: Header has `backdrop-filter: blur(12px)` with a 1px border-bottom that transitions from transparent to `--void-3` as user scrolls past hero

### 4.4 The "Void Cursor"

Custom cursor: a 12px ring (1px stroke, `--text-quaternary`) that:
- Expands to 40px on hoverable elements
- Changes to signal-amber on buttons/links
- Has a 0.15s trailing delay (lerp follow)

**Implementation:**
- Component: `src/components/VoidCursor.tsx`
- CSS `cursor: none` on `body`
- `requestAnimationFrame` loop for position tracking
- Respect `prefers-reduced-motion`: disable trailing delay

---

## 5. Page-Level Architecture

### 5.1 Landing Page — "The Descent"

Single continuous scroll, 7 sections:

#### Section 1: Hero — The Threshold (100vh)
- Full-bleed starfield background
- Massive headline: "Ship with evidence" (line 1), "not hope." (line 2, signal-amber)
- Subheadline below, max-width 560px, **left-aligned** (brutalist, not centered)
- Two buttons: [Start free analysis] (signal-amber, filled) + [Explore demo] (void-1, bordered)
- **NO screenshot/mockup card in hero** — the starfield IS the visual
- One living image: faint, distant **static SVG silhouette** of the Signal Tower in bottom-right (30% opacity), barely visible — this is NOT the interactive 3D component
- Scroll indicator: thin amber line that slowly pulses at bottom-center

#### Section 2: Signal Strip (auto-height, ~80px)
- Full-width band with `--void-1` background
- Horizontally scrolling row of logos: "Used by builders at..."
- All logos in `--text-quaternary`, no color, no animation — static, humble

#### Section 3: Features — The Instruments (min-height: 100vh)
- Section title: "Instruments" — massive, left-aligned
- 3 feature cards in a row (desktop), stacked (mobile)
- Each card: `--void-1` background, 1px `--void-3` border, 48px padding
- Icon (lucide, 24px, `--text-tertiary`), headline, description
- Hover: border transitions to `--signal-amber-glow`, card lifts 4px
- **NO screenshots inside cards** — pure typography and icon

#### Section 4: How It Works — The Loop (min-height: 80vh)
- 4-step vertical timeline, left-aligned
- Step number (01, 02, 03, 04) in Geist Mono, `--text-quaternary`, 48px
- Step title + description
- Thin vertical line connects steps, amber highlight on active step as you scroll

#### Section 5: Testimonials — The Observatory (min-height: 60vh)
- 3 cards in a row, same card style as features
- Quote mark (large, `--text-quaternary`) at top-left of each card
- Quote text, author name, role

#### Section 6: CTA — The Signal (min-height: 60vh)
- Centered, massive
- Logo mark (animated) above
- Headline: "Point the observatory at your next launch."
- Single amber button: "Start free — no credit card"
- Starfield intensifies here (more stars visible, slightly brighter)

#### Section 7: Footer (auto)
- Minimal: Logo (small), Privacy link, Pricing link, copyright
- `--void-1` background, 1px top border `--void-3`

### 5.2 Command Center — "The Bridge"

**Layout:**
- **Left sidebar**: Collapsible (desktop), slide-out (mobile). Navigation to all tools. Minimal: icon + label per item. Active item: amber left-border indicator (3px) + text color change
- **Main area**: Full width minus sidebar
- **Top bar**: Sticky, `glass` effect, breadcrumb + user menu
- **Signal Tower**: Fixed position, right side of main content area, 400px wide, 100vh tall. Desktop only. Mobile: replaced by small amber status dot in top bar

**Content Sections (top to bottom):**
1. **Header area**: "Command Center" title + subtitle + action buttons (Rescan, Refresh)
2. **Stat Cards Row**: 4 cards (Launch Readiness, Top Blockers, Next Fix, Task Queue)
3. **Action Bar**: Horizontal row of buttons (Rescan, View Tasks, Reports)
4. **Alert Banner** (conditional): Red blockers warning — full-width, `--color-danger-soft`, sharp left border 3px red
5. **Product Brain Card**: Insight summary
6. **Daily Briefing Card**: Greeting + focus
7. **Launch Readiness Trend Chart**: Area chart (restyled with new colors)

### 5.3 App Shell (Global Navigation)

- **Left sidebar**: 72px wide (icon-only) or 240px wide (icon + label). Collapsible via hamburger
- **Background**: `--void-1`, 1px right border `--void-3`
- **Nav items**: Icon (20px, `--text-tertiary`) + label. Active: icon + label in `--signal-amber`, 3px amber left-border
- **Hover**: background transitions to `--void-2`
- **Bottom section**: User avatar, theme toggle, settings
- **Mobile**: Slide-out drawer, full-screen overlay with `--void-0` at 80% opacity

### 5.4 Inner Tool Pages (Idea Lab, Code Health, Build Planner, Project Brain)

- **NO starfield** — pure `--void-0` background
- **NO signal tower** — these are "instrument panels", not the bridge
- **Layout**: Full-width content, max-width 1200px, centered
- **Card system**: All tool UIs use the same card component: `--void-1` bg, 1px `--void-3` border, 32px padding, 12px radius
- **Form elements**: Inputs have `--void-2` background, 1px `--void-3` border, focus: border → `--signal-amber` with subtle glow

### 5.5 Detail Pages (Project Detail, Report Detail)

- **Breadcrumb header**: Back arrow + title + metadata
- **Tab navigation**: Horizontal tabs with amber underline indicator (2px), animates between tabs
- **Content**: Card-based layouts, same as inner tools

---

## 6. Global Components & Interactions

### 6.1 Buttons

| Variant | Style | Hover | Active |
|---------|-------|-------|--------|
| **Primary** | `--signal-amber` bg, black text, 12px radius | Scale 1.02, glow expand | Scale 0.97 |
| **Secondary** | `--void-2` bg, `--text-secondary`, 1px `--void-3` border | Border → `--signal-amber-glow`, bg → `--void-3` | Scale 0.97 |
| **Ghost** | Transparent bg, `--text-tertiary` | Text → `--text-secondary` | — |
| **Danger** | `--color-danger` bg, white text | Scale 1.02 | Scale 0.97 |

### 6.2 Cards

- Background: `--void-1`
- Border: 1px solid `--void-3`
- Border-radius: 12px
- Padding: 32px (standard), 48px (featured)
- Shadow: none (flat design — the void doesn't cast shadows)
- Hover: translateY(-4px), border-color → `--signal-amber-glow`, transition 0.3s

### 6.3 Inputs & Forms

- Background: `--void-2`
- Border: 1px solid `--void-3`
- Border-radius: 10px
- Padding: 12px 16px
- Focus: border → `--signal-amber`, box-shadow: `0 0 0 3px var(--signal-amber-dim)`
- Placeholder: `--text-quaternary`

### 6.4 Loading States

- **Global page load**: Thin amber line at top of viewport (2px height), animates left→right, loops
- **Card skeleton**: Shimmer effect — diagonal gradient sweep across `--void-2` to `--void-3`, every 1.5s
- **Button loading**: Text replaced by amber dot that pulses (scale 0.8→1.2, opacity 0.5→1)

### 6.5 Toast / Notifications

- Position: bottom-right, 24px from edges
- Background: `--void-2`
- Border-left: 3px solid (amber for info, red for error, green for success)
- Border-radius: 12px
- Entry: slide up from bottom + fade in, 0.4s
- Exit: fade out + slide down, 0.3s

### 6.6 Modals / Dialogs

- Backdrop: `--void-0` at 80% opacity, no blur (brutalist — the void is absolute)
- Modal container: `--void-1` bg, 1px `--void-3` border, 16px radius
- Entry: scale 0.95→1 + fade in, 0.3s
- Exit: scale 1→0.95 + fade out, 0.2s

---

## 7. Performance & Fallback Strategy

### 7.1 Performance Budget

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Total JS bundle (landing) | < 300kb gzipped |

### 7.2 Starfield Performance

- Canvas 2D (not WebGL) — 5,000 stars max
- `requestAnimationFrame` with `IntersectionObserver` pause when not visible
- Mobile: 1,500 stars, no parallax, no mouse tracking
- Low-power mode (`navigator.hardwareConcurrency < 4`): 800 stars, static (no twinkle)

### 7.3 Signal Tower Performance

- Three.js lazy-loaded ONLY on Command Center page (`React.lazy` + dynamic import)
- Renders only when in viewport
- `requestAnimationFrame` with delta-time cap (max 30fps for tower, 60fps for UI)
- Low-power mode: fallback to static SVG silhouette with CSS pulsing
- No real-time shadows, no post-processing passes

### 7.4 Animation Performance

- All animations use `transform` and `opacity` only (GPU-composited)
- No `box-shadow` animations — use pseudo-elements with opacity transitions
- `will-change` applied sparingly, only on elements currently animating
- Respect `prefers-reduced-motion`: disable parallax, disable starfield twinkle, use instant transitions

### 7.5 Asset Strategy

- **No custom icon font** — Lucide React only
- **No custom font files** — use `next/font` or system font stack (Inter/Geist via Google Fonts or local)
- **No heavy images** — the starfield and tower ARE the visuals. Any product screenshots must be < 100kb WebP
- **CSS**: All design tokens in CSS variables for runtime theme switching

---

## 8. Component Inventory

### 8.1 New Components to Build

| Component | Location | Purpose |
|-----------|----------|---------|
| `<StarfieldCanvas />` | `src/components/StarfieldCanvas.tsx` | Background starfield (Canvas 2D) |
| `<SignalTower />` | `src/components/SignalTower.tsx` | 3D tower sculpture (Three.js, lazy-loaded) |
| `<VoidCursor />` | `src/components/VoidCursor.tsx` | Custom cursor with trailing delay |
| `<VoidButton />` | `src/components/VoidButton.tsx` | Unified button component with all variants |
| `<VoidCard />` | `src/components/VoidCard.tsx` | Card component with hover lift + glow |
| `<VoidInput />` | `src/components/VoidInput.tsx` | Input with focus glow |
| `<VoidSkeleton />` | `src/components/VoidSkeleton.tsx` | Shimmer skeleton loader |
| `<VoidToast />` | `src/components/VoidToast.tsx` | Toast notification |
| `<VoidModal />` | `src/components/VoidModal.tsx` | Modal/dialog |
| `<VoidNavSidebar />` | `src/components/VoidNavSidebar.tsx` | App shell sidebar |
| `<VoidTopBar />` | `src/components/VoidTopBar.tsx` | Sticky top bar |
| `<Appear />` | `src/components/Appear.tsx` | Wrapper for fade-in-up animation |
| `<StaggerContainer />` | `src/components/StaggerContainer.tsx` | Wrapper for staggered children |

### 8.2 Components to Refactor

| Component | Location | Changes |
|-----------|----------|---------|
| `<LandingPage />` | `src/pages/landing.tsx` | Complete rewrite with new sections |
| `<HeroSection />` | `src/pages/landing/HeroSection.tsx` | Remove mockup card, add starfield |
| `<FeaturesSection />` | `src/pages/landing/FeaturesSection.tsx` | New card style, no screenshots |
| `<HowItWorksSection />` | `src/pages/landing/HowItWorksSection.tsx` | Timeline layout |
| `<CommandCenterPage />` | `src/pages/command-center.tsx` | Add Signal Tower, restyle cards |
| `<AppShell />` | `src/components/AppShell.tsx` | New sidebar, top bar |
| `<IdeaLabPage />` | `src/pages/idea-lab.tsx` | Restyle cards, inputs, buttons |
| `<CodeHealthPage />` | `src/pages/code-health.tsx` | Restyle cards, inputs, buttons |
| `<BuildPlannerPage />` | `src/pages/build-planner.tsx` | Restyle cards, inputs, buttons |
| `<ProjectBrainPage />` | `src/pages/project-brain.tsx` | Restyle cards, inputs, buttons |
| `<ProjectDetailPage />` | `src/pages/project-detail.tsx` | Restyle tabs, cards |
| `<ReportDetailPage />` | `src/pages/report-detail.tsx` | Restyle cards |
| `<PricingPage />` | `src/pages/pricing.tsx` | Restyle with new system |
| `<NotFound />` | `src/pages/not-found.tsx` | Starfield background, minimal message |

### 8.3 CSS/Styles to Update

| File | Changes |
|------|---------|
| `src/index.css` | Replace existing design tokens with Signal Void tokens in the `@theme` block (Tailwind v4 uses CSS-based theming, not `tailwind.config`) |

---

## 9. Implementation Phases

### Phase 1: Foundation (Design System + Landing Page)
- Update CSS tokens in `index.css`
- Build `<StarfieldCanvas />`
- Build `<VoidButton />`, `<VoidCard />`, `<VoidInput />`
- Build `<Appear />`, `<StaggerContainer />`
- Rewrite Landing Page with all 7 sections
- Rewrite `<AppShell />` with new sidebar + top bar
- Update `src/index.css` `@theme` block with new tokens (Tailwind v4 CSS-based theming)

### Phase 2: Command Center + Core App
- Build `<SignalTower />` (Three.js, lazy-loaded)
- Build `<VoidCursor />`
- Rewrite Command Center with Signal Tower integration
- Update all tool pages (Idea Lab, Code Health, Build Planner, Project Brain) with new card/input/button styles
- Build `<VoidSkeleton />`, `<VoidToast />`, `<VoidModal />`

### Phase 3: Detail Pages + Polish
- Update Project Detail, Report Detail with new tab styles + cards
- Update Pricing page
- Update Not Found page
- Performance audit
- Accessibility audit (`prefers-reduced-motion`, keyboard nav, focus states)
- Mobile responsive pass

---

## 10. Open Questions & Decisions

| Question | Decision | Date |
|----------|----------|------|
| Font loading strategy | Use Google Fonts with `display: swap` for Inter + JetBrains Mono | 2026-06-01 |
| Three.js loading | Dynamic import via `React.lazy()` in SignalTower component | 2026-06-01 |
| Mobile starfield | 1,500 stars, no parallax, no mouse tracking | 2026-06-01 |
| Custom cursor | Implement with `cursor: none` on body, respect `prefers-reduced-motion` | 2026-06-01 |
| Theme switching | Keep existing dark/light toggle, but default to dark. Light mode: invert void scale (white→near-white surfaces) | 2026-06-01 |

---

## 11. Success Criteria

- [ ] Landing page renders with starfield in < 1.5s on desktop
- [ ] Signal Tower loads lazily and renders only on Command Center
- [ ] All pages use unified design tokens (no hardcoded colors)
- [ ] Hover states feel "heavy" and physical
- [ ] Mobile experience is fully functional (starfield reduced, no tower)
- [ ] `prefers-reduced-motion` is fully respected
- [ ] No visual regressions in functionality (all buttons, forms, charts work)
- [ ] TypeScript compiles without errors
- [ ] Build passes (`pnpm run build`)
