# NOCTRA — Obsidian & Signal Frontend Redesign

**Date:** 2026-06-01  
**Status:** Approved for Implementation  
**Scope:** Complete frontend visual system redesign — landing page, app shell, all tool pages, component library.  
**Designer Intent:** Industry-shaking developer-tool aesthetic. Linear meets Vercel meets Raycast. Surgical precision. One accent color. No gimmicks.

---

## 1. Design Philosophy

### "Obsidian & Signal"

The visual identity is built on three principles:

1. **Restraint over decoration.** Every pixel must earn its place. No gradients for gradients' sake. No shadows that don't create depth. No animation that doesn't guide attention.
2. **One accent, used surgically.** Signal amber (`#FF9F1C`) is the only brand color. It appears on: primary buttons, active navigation states, key metrics, focus rings, and links. Everything else is grayscale.
3. **Depth through precision, not decoration.** Surfaces read as distinct through 1px hairline borders at `rgba(255,255,255,0.06)`, subtle inner highlights, and careful elevation. Not through drop shadows that look like 2015 Bootstrap.

### What This Is NOT

- Not a "dark mode." This is a deliberate, permanent obsidian aesthetic.
- Not a "space theme." No stars, galaxies, nebulas, cosmic dust.
- Not material design. No elevation shadows, no ripples, no bouncy overscroll.
- Not glassmorphism. No frosted glass, no backdrop-filter abuse.

---

## 2. Color System

### Backgrounds (Obsidian Scale)

| Token | Value | Usage |
|---|---|---|
| `--obsidian-0` | `#050507` | Deepest background — hero sections, page root |
| `--obsidian-1` | `#0A0A0F` | Primary page background |
| `--obsidian-2` | `#12121A` | Card/panel surfaces |
| `--obsidian-3` | `#1A1A24` | Elevated surfaces — dropdowns, popovers, active inputs |
| `--obsidian-4` | `#22222E` | Highest elevation — modal overlays, focused states |

**Rule:** Backgrounds always go darker with elevation (inverted from light mode). The page is darkest. Floating elements are slightly lighter so they read as "above."

### Text Hierarchy (Warm Grayscale)

| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#F0F0F5` | Headings, primary content, button text on amber |
| `--text-secondary` | `#A0A0B0` | Body text, descriptions, secondary labels |
| `--text-tertiary` | `#6E6E80` | Metadata, timestamps, placeholders, disabled states |
| `--text-quaternary` | `#454554` | Borders-as-text — dividers, separators |

**Rule:** Text always has >= 4.5:1 contrast against its background. `--text-secondary` on `--obsidian-2` is the minimum readable combo.

### The Signal (Amber)

| Token | Value | Usage |
|---|---|---|
| `--signal` | `#FF9F1C` | Primary buttons, active nav, links, key numbers |
| `--signal-dim` | `rgba(255, 159, 28, 0.12)` | Soft backgrounds behind signal text |
| `--signal-glow` | `rgba(255, 159, 28, 0.25)` | Focus rings, subtle hover glows |
| `--signal-deep` | `#CC7E16` | Hover state on signal buttons |

**Rule:** Signal amber never appears at >30% opacity as a background wash. It is always either solid (buttons, text) or a subtle 12% tint (badges, soft highlights).

### Semantic Colors (Used Sparingly)

| Token | Value | Usage |
|---|---|---|
| `--success` | `#34D399` | Go states, checkmarks, positive scores >=70 |
| `--warning` | `#FBBF24` | Caution — only when signal amber would confuse |
| `--danger` | `#F87171` | Errors, destructive actions, red gates |

**Rule:** Semantic colors appear only in status indicators, score badges, and error states. Never as primary UI accents.

---

## 3. Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
--font-display: 'Inter', sans-serif; /* Same as sans — Inter is beautiful at display sizes */
```

**Why Inter:** It is the industry standard for developer tools. Geometric, highly legible, excellent at both 12px and 72px. No need for a separate display font.

### Type Scale

| Token | Size | Weight | Tracking | Line-Height | Usage |
|---|---|---|---|---|---|
| `text-hero` | `clamp(3rem, 7vw, 6rem)` | 700 | -0.03em | 1.05 | Landing hero headline |
| `text-h1` | `clamp(2rem, 4vw, 3rem)` | 700 | -0.02em | 1.1 | Page titles |
| `text-h2` | `1.5rem` | 600 | -0.01em | 1.25 | Section headings |
| `text-h3` | `1.125rem` | 600 | -0.01em | 1.35 | Card titles, subsections |
| `text-body` | `0.875rem` | 400 | 0 | 1.6 | Body text, descriptions |
| `text-small` | `0.8125rem` | 400 | 0 | 1.5 | Secondary content |
| `text-caption` | `0.75rem` | 500 | 0.02em | 1.4 | Labels, metadata, badges |
| `text-mono` | `0.75rem` | 400 | 0 | 1.5 | Code, data values |

### Special Styles

- **Eyebrow:** `text-caption` + `uppercase` + `letter-spacing: 0.15em` + `--text-tertiary`. Used for section labels like "INSTRUMENTS" or "COMMAND CENTER".
- **Metric Value:** `text-h1` weight + `--signal` color. Large numbers that matter.
- **Metric Label:** `text-caption` + `--text-tertiary`. Small label above a metric.

---

## 4. Spacing System

Base unit: **4px**

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight internal padding |
| `space-2` | 8px | Icon gaps, small element margins |
| `space-3` | 12px | Button padding-y, input padding |
| `space-4` | 16px | Standard card padding |
| `space-5` | 20px | Larger card padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Major section separation |
| `space-12` | 48px | Page section breaks |
| `space-16` | 64px | Hero spacing |
| `space-24` | 96px | Major page divisions |

**Rule:** Sections on the landing page have `padding: space-24 0`. App pages have `padding: space-6` on containers. Never let things touch.

---

## 5. Borders & Elevation

### Hairline Borders (The Primary Elevation Mechanism)

```css
--border-subtle: rgba(255, 255, 255, 0.04);   /* Almost invisible — between similar surfaces */
--border-default: rgba(255, 255, 255, 0.06);   /* Standard card borders */
--border-strong: rgba(255, 255, 255, 0.10);   /* Active/selected states */
--border-focus: var(--signal-glow);            /* Focus rings */
```

**Rule:** Every card, panel, and container has exactly one `border: 1px solid var(--border-default)`. On hover, it becomes `--border-strong`. This is how surfaces read as distinct. Not shadows. Borders.

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Small buttons, tags, badges |
| `radius-md` | 8px | Standard buttons, inputs |
| `radius-lg` | 12px | Cards, panels |
| `radius-xl` | 16px | Modals, large containers |
| `radius-full` | 9999px | Avatars, pills |

**Rule:** Buttons are `radius-md` (8px). Cards are `radius-lg` (12px). Nothing is fully rounded except avatars and toggle pills.

---

## 6. Component Design

### Button — Primary

```
Background: var(--signal)
Color: var(--obsidian-0)  /* Black text on amber */
Border: none
Border-radius: var(--radius-md)
Padding: space-3 space-4
Font: text-small, weight 600
Hover: background var(--signal-deep), slight scale(1.02)
Active: scale(0.98)
Disabled: opacity 0.4, no hover effects
```

### Button — Secondary

```
Background: transparent
Color: var(--text-secondary)
Border: 1px solid var(--border-default)
Border-radius: var(--radius-md)
Padding: space-3 space-4
Font: text-small, weight 500
Hover: background var(--obsidian-3), border var(--border-strong)
Active: background var(--obsidian-2)
```

### Button — Ghost

```
Background: transparent
Color: var(--text-tertiary)
Border: none
Padding: space-3 space-4
Font: text-small, weight 500
Hover: color var(--text-secondary), background var(--obsidian-2)
```

### Card — Standard

```
Background: var(--obsidian-2)
Border: 1px solid var(--border-default)
Border-radius: var(--radius-lg)
Padding: space-5
Hover: border-color var(--border-strong), translateY(-1px)
Transition: border-color 0.2s, transform 0.2s
```

**No box-shadow.** The border change and 1px lift create the hover effect.

### Card — Featured (Landing)

```
Same as standard, but:
Hover: border-color rgba(255, 159, 28, 0.15)  /* Faint amber border on hover */
```

### Input / Textarea

```
Background: var(--obsidian-2)
Border: 1px solid var(--border-default)
Border-radius: var(--radius-md)
Padding: space-3 space-4
Color: var(--text-primary)
Placeholder: var(--text-tertiary)
Focus: border-color var(--signal), outline none, box-shadow 0 0 0 3px var(--signal-glow)
Hover (not focused): border-color var(--border-strong)
```

### Navigation — Sidebar

```
Width: 64px (collapsed) / 200px (expanded)
Background: var(--obsidian-1)
Border-right: 1px solid var(--border-default)

Item:
  Padding: space-3
  Border-radius: var(--radius-md)
  Color: var(--text-tertiary)

Item hover:
  Background: var(--obsidian-2)
  Color: var(--text-secondary)

Item active:
  Color: var(--signal)
  Background: var(--signal-dim)
  Border-left: 2px solid var(--signal)  /* The indicator */
```

### Top Bar

```
Height: 48px
Background: transparent (scrolls with content)
Border-bottom: 1px solid var(--border-subtle)
Backdrop-filter: none  /* No glass */
```

---

## 7. Animation Principles

### Philosophy

Animations exist to **reveal structure**, not to entertain. Every animation answers the question: "Where did this come from?"

### Timing

| Context | Duration | Easing |
|---|---|---|
| Hover states | 150ms | ease-out |
| Page transitions | 300ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Modal open | 200ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Stagger (list items) | 50ms delay each | ease-out |
| Skeleton loading | shimmer 1.5s infinite | linear |

### What Gets Animated

- **Page load:** Content fades in + translateY(8px → 0). Duration 300ms.
- **Cards:** On hover, border color transition 150ms. No bounce. No glow spread.
- **Buttons:** Hover scale(1.02), active scale(0.98). Duration 100ms.
- **Navigation:** Active indicator slides with `layoutId` (Framer Motion spring).
- **Loading states:** Skeleton shimmer on a diagonal gradient. No spinning dots.

### What Does NOT Get Animated

- No parallax.
- No floating particles.
- No gradient text that shifts colors.
- No custom cursor.
- No "breathing" glows.

---

## 8. Page Designs

### Landing Page

**Header (sticky)**
- Background: `var(--obsidian-1)` with 1px bottom border
- Left: Logo + wordmark "NOCTRA"
- Center: Nav links (Features, How It Works, Pricing) — text-caption size
- Right: "Sign in" (ghost button) + "Get Started" (primary button, small)
- Height: 56px

**Hero Section**
- Background: `var(--obsidian-0)` — the absolute darkest
- Full viewport height minus header
- Content centered vertically and left-aligned in a max-width container
- Eyebrow: "LAUNCH INTELLIGENCE" — amber color, eyebrow style
- Headline: "Ship with evidence, not hope." — text-hero, weight 700
  - "not hope." in `--signal` color (solid, not gradient)
- Subhead: 1-2 sentences, text-body, `--text-secondary`, max-width 480px
- CTAs: "Start free analysis" (primary, md) + "Explore demo" (secondary, md)
- Below CTAs: Small integration logos in a row — GitHub, Cursor, Replit, etc. Monochrome, 40% opacity
- **No starfield. No tower. No canvas.** The drama comes from the massive type and the void.

**Features Section**
- Background: `var(--obsidian-1)`
- Eyebrow: "INSTRUMENTS"
- Headline: "Point. Scan. Ship."
- 3-column grid, gap space-6
- Each card:
  - Icon (lucide, 24px, `--text-tertiary`)
  - Title (text-h3)
  - Description (text-body, `--text-secondary`)
  - "Learn more →" link (text-caption, `--signal`)
- Cards are standard Card component

**How It Works Section**
- Background: `var(--obsidian-1)`
- Eyebrow: "THE LOOP"
- Headline: "From idea to launch in four scans."
- 4-step horizontal timeline:
  - Step number (01, 02, 03, 04) in `--signal`, text-caption, mono font
  - Step title in text-h3
  - Step description in text-body
  - Connecting line between steps: 1px, `--border-default`
- On mobile: vertical stack

**Testimonials Section**
- Background: `var(--obsidian-0)`
- Eyebrow: "FROM THE FIELD"
- Headline: "Builders who shipped with evidence."
- 3-column grid of quote cards:
  - Large quotation mark icon in `--signal` at 20% opacity
  - Quote text in text-body, `--text-secondary`, italic
  - Author name in text-small, `--text-primary`
  - Author role in text-caption, `--text-tertiary`
  - Divider: 1px line, `--border-subtle`

**CTA Section**
- Background: `var(--obsidian-0)`
- Centered content, max-width 600px
- Logo mark (small) centered above
- Headline: "Point the observatory at your next launch."
- Subtext: one sentence
- Single CTA: "Start free — no credit card" (primary, lg)

**Footer**
- Background: `var(--obsidian-1)`
- Top border: 1px `--border-default`
- Left: Logo (small)
- Center: Links (Privacy, Pricing)
- Right: "© 2026 NOCTRA"
- All text in text-caption, `--text-tertiary`

### App Shell

**Sidebar**
- Fixed left, full height
- 64px wide (icon only)
- On hover/expand: 200px wide, shows labels
- Background: `var(--obsidian-1)`
- Border-right: 1px `--border-default`
- Items: Dashboard, Idea Lab, Code Health, Build Planner, Project Brain
- Active item: amber left border (2px), amber icon, `var(--signal-dim)` background
- Hover item: `var(--obsidian-2)` background

**Top Bar**
- Sticky, top of content area
- Height: 48px
- Left: Page title (text-small, weight 600)
- Right: Search icon, Bell icon (with amber dot for notifications), User avatar
- Background: transparent
- Border-bottom: 1px `--border-subtle` (appears on scroll if needed)

**Main Content Area**
- Padding: `space-6`
- Max-width: 1200px, centered
- Background: `var(--obsidian-0)` (inherited from root)

### Command Center (Dashboard)

**Header**
- Left: "Command Center" title + subtitle
- Right: "Run Product Doctor" (primary) + "Refresh" (secondary)

**Metric Cards (4-column grid)**
1. Launch Readiness — large number (score/100), color coded
2. Blockers — count of red gates
3. Tasks Open — critical + high priority count
4. Last Scan — timestamp

Each card: standard Card component. Number in metric style. Label in caption.

**Status Banner (if no scan yet)**
- Full-width card with dashed border
- Icon + "Upload your project to begin" + CTA button

**Recent Reports List**
- Section title: "Recent Reports"
- List of report rows:
  - Tool icon (20px)
  - Report title
  - Score badge (small, colored)
  - Date
  - Chevron right
- Hover: row background becomes `var(--obsidian-3)`

### Tool Pages (Idea Lab, Code Health, Build Planner, Project Brain)

**Common Layout**
- Two-column on desktop: input (left, ~45%) | output (right, ~55%)
- Stacked on mobile
- Mode selector tabs at top (if applicable)

**Input Panel**
- Card container
- Header: "Input" with eyebrow styling
- Textarea: large, 8-12 rows, input styling
- Action button: primary, full width of panel
- Secondary actions: reset, settings (ghost)

**Output Panel**
- Card container
- Header: "Output" with eyebrow styling
- Empty state: centered icon + text + hint
- Loading state: skeleton lines
- Result state: structured content based on tool
- Error state: danger-colored icon + message + retry

**Code Health Specific**
- Upload zone: dashed border area, drag-and-drop
- File list: uploaded files with remove button
- Scan results: categorized findings (errors, warnings, info)

**Build Planner Specific**
- Tabs: "MVP Planner" | "Fix Tasks"
- MVP output: structured plan with North Star, Build Now, Build Later sections
- Task output: filterable list with checkboxes, priority badges, expand/collapse

---

## 9. Accessibility

- All text meets WCAG AA: >= 4.5:1 contrast.
- Focus rings: 3px solid `var(--signal-glow)` on all interactive elements.
- `prefers-reduced-motion`: disable all animations. Show static states immediately.
- Keyboard navigation: all cards, buttons, links are tabbable with visible focus.

---

## 10. Performance Constraints

- No custom cursor (eliminates per-frame DOM manipulation).
- No canvas/starfield backgrounds (eliminates GPU load and complexity).
- No blur/backdrop-filter (eliminates compositing overhead).
- Animations use only `transform` and `opacity` (GPU-accelerated).
- Target: <1.5s First Contentful Paint on 3G.

---

## 11. Implementation Notes

### CSS Architecture

```
index.css:
  - Tailwind v4 theme tokens (mapped to obsidian/signal system)
  - Global base styles (body, headings, selection color)
  - Utility classes (eyebrow, card-beautiful, gradient-text)
  - Animation keyframes (fadeIn, slideIn, shimmer)

Component CSS:
  - Each component uses Tailwind utility classes + CSS variables
  - No inline styles for colors (use Tailwind classes mapped to tokens)
  - Complex gradients/animations in component CSS modules if needed
```

### Component Inventory

| Component | File | Status |
|---|---|---|
| ObsidianButton | `components/ObsidianButton.tsx` | New |
| ObsidianCard | `components/ObsidianCard.tsx` | New |
| ObsidianInput | `components/ObsidianInput.tsx` | New |
| ObsidianNav | `components/ObsidianNav.tsx` | New |
| ObsidianTopBar | `components/ObsidianTopBar.tsx` | New |
| LandingPage | `pages/landing.tsx` | Rewrite |
| AppShell | `components/AppShell.tsx` | Rewrite |
| CommandCenter | `pages/command-center.tsx` | Rewrite |
| IdeaLab | `pages/idea-lab.tsx` | Rewrite |
| CodeHealth | `pages/code-health.tsx` | Rewrite |
| BuildPlanner | `pages/build-planner.tsx` | Rewrite |
| ProjectBrain | `pages/project-brain.tsx` | Rewrite |
| ProjectDetail | `pages/project-detail.tsx` | Rewrite |
| ReportDetail | `pages/report-detail.tsx` | Rewrite |
| NotFound | `pages/not-found.tsx` | Rewrite |
| Pricing | `pages/pricing.tsx` | Rewrite |

### Cleanup

The following components from the previous "Signal Void" attempt will be **deleted**:
- `VoidCursor.tsx`
- `StarfieldCanvas.tsx`
- `SignalTower.tsx`
- `VoidButton.tsx` (replaced by ObsidianButton)
- `VoidCard.tsx` (replaced by ObsidianCard)
- `VoidInput.tsx` (replaced by ObsidianInput)
- `VoidNavSidebar.tsx` (replaced by ObsidianNav)
- `VoidTopBar.tsx` (replaced by ObsidianTopBar)
- `VoidSkeleton.tsx`
- `VoidToast.tsx`
- `VoidModal.tsx`
- `Appear.tsx` (if too specific)
- `StaggerContainer.tsx` (if too specific)

---

## 12. Success Criteria

1. **Build passes** with zero type errors in source files (test file errors from pre-existing issues are acceptable).
2. **Every page** uses the obsidian color system consistently — no rogue colors.
3. **Text is readable** — no dark-on-dark anywhere.
4. **One accent** — amber only. No cyan, magenta, violet, or gold accents in the UI.
5. **No gimmicks** — no starfield, no custom cursor, no glassmorphism, no aurora orbs.
6. **Animations are purposeful** — only hover states, page transitions, and nav indicator slides.
7. **The landing page feels premium** — like visiting Linear.co or Vercel.com for the first time.

---

**Next Step:** Writing the implementation plan via `writing-plans` skill.
