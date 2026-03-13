# Agent Handoff — emrecangulay.github.io

> This document gives a new AI agent full context to continue building this portfolio website.
> Written 2026-03-13 by Claude Code (Opus 4.6) after multiple design sessions with the owner.

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| Owner | Dr. Emrecan Gulay — HCI researcher & creative technologist |
| URL | https://emrecan713.github.io (GitHub Pages) |
| Tech | Vanilla HTML + CSS + JS — no frameworks, no build system |
| Local dev | `python -m http.server 8000` in repo root |
| Repo | `emrecan713.github.io` on GitHub |

There is also an older copy at `C:\Users\emrcn\Desktop\projects\Website Project\` — that version is outdated and should NOT be used. This repo is the current one.

---

## 2. File Map

```
index.html              — Home page (hero, about, quick facts, action buttons)
highlights.html         — Portfolio project grid (industry + academic)
publications.html       — Academic publications grouped by year (2018–2025)
css/style.css           — All styles (~950 lines, CSS variables, responsive)
js/main.js              — Navigation, scroll reveals, typing effect, parallax
js/cursor-effects.js    — Page-specific canvas cursor effects (3 variants)
projects/
  huawei.html           — Huawei tech planning project
  product-design.html   — Sour Studio product design
  seat-booking-app.html — Google UX Certificate project (if exists)
  physical-digital.html — PhD thesis project
  contextual-interviews.html
  exploratory-workshop.html
  vr-experiences.html   — Master's thesis VR project
  online-portfolio.html — Portfolio design case study
images/                 — ~42 images (profile, projects, characters, decorative)
docs/
  Emrecan-Gulay-CV.pdf  — Downloadable CV
  scraped-content.json   — Content backup from old Wix site
```

---

## 3. Design System

### CSS Variables (`:root` in style.css)

**Colors:**
- `--peach: #FFCDB2` — primary light warm
- `--blush: #FFB4A2` — secondary warm
- `--rose: #E5989B` — accent pink
- `--deep-rose: #B5838D` — muted accent
- `--charcoal: #2B2D42` — text/dark elements
- `--dark-bg: #1A1A2E` — dark section base
- `--cream: #FAF9F6` — page background
- `--accent-orange: #E07A5F` — primary accent (CTA, highlights)
- `--accent-teal: #81B29A` — secondary accent
- `--accent-gold: #F2CC8F` — tertiary accent

**Fonts:**
- Body: `Space Grotesk` (weights 300–700)
- Headings: `DM Serif Display` (weight 400)

**Responsive breakpoints:** 1024px, 768px, 480px

---

## 4. What's Already Implemented

These design enhancements were applied in previous sessions:

1. **Typography overhaul** — Changed from Inter/Playfair Display to Space Grotesk/DM Serif Display. Heading weight reduced to 400 for elegance.

2. **Gradient text effects** — `.gradient-text-orange` and `.gradient-text-teal` classes using `background-clip: text` for hero highlights.

3. **Hero section polish** — CSS-only `heroFadeUp` and `heroFadeIn` animations. Mesh gradient `::before` pseudo-element with slow rotation animation (`meshMove`).

4. **Dark section depth** — All dark sections use subtle linear gradients (`#1A1A2E → #16213E → #1A1A2E`) instead of flat `var(--dark-bg)`.

5. **Project card interactions** — Image hover zoom (scale 1.05 with 0.6s ease), gradient overlay at bottom, backdrop blur on content area.

6. **Publications enhancements** — Colored badges (`.badge-paper` orange, `.badge-patent` gold), publication count per year, styled year headers with bottom border.

7. **SEO** — Open Graph tags, Twitter Card tags, JSON-LD structured data (Person schema with Aalto University affiliation).

8. **Footer** — Google Scholar link added alongside LinkedIn and Twitter/X.

9. **Project detail pages** — 8 pages under `projects/` with full content from original Wix site.

10. **Scroll reveals simplified** — CSS transition classes are placeholder-only; JS in `main.js` handles entrance animations.

---

## 5. REMAINING WORK — Hero Visual Animation

### Current state
The hero visual is a static `swirl-decoration.png` image with a CSS `float` keyframe (gentle up/down bob). It looks generic and doesn't match the site's quality level.

### Target
Replace with a **particles-only canvas animation**. Circles rise upward and gradually morph into 8-bit pixel squares. NO SVG flowing strands.

### Detailed spec

**New file: `js/hero-particles.js`**

- Canvas-based particle system using `requestAnimationFrame`
- Particles spawn near the bottom of the hero-visual area
- Travel upward with slight horizontal drift
- Start as soft circles, gradually morph into square/pixel shapes (the "pixelation" effect)
- The circle→square morphing should be **gradual** (not abrupt snap)
- Particle radius: `2 + Math.random() * 2.5` (on the larger side)
- Max opacity: ~0.75, with gradual alpha ramp (threshold ~0.7 of lifespan)
- Fade out near the top
- Colors: sample from the site palette (peach, blush, rose, gold, orange, teal)
- Count: ~30 on mobile (≤768px), ~65 on desktop
- Init delay: ~400ms (particles appear quickly after page load)
- Mouse interaction: particles subtly respond to cursor proximity (repel or attract)
- Respect `prefers-reduced-motion`: disable animation entirely if set
- Performance: must be smooth 60fps on mid-range hardware

**HTML changes to `index.html`:**
- Add `<canvas class="hero-particle-canvas" id="heroParticles"></canvas>` inside `.hero-visual`
- Either hide `swirl-decoration.png` (CSS `display: none`) or keep as no-JS fallback with `<noscript>` wrapper
- Add `<script src="js/hero-particles.js"></script>` before `</body>`

**CSS additions to `style.css`:**
```css
.hero-particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  animation: canvasFadeIn 0.8s ease 400ms forwards;
}

@keyframes canvasFadeIn {
  to { opacity: 1; }
}
```

### REJECTED APPROACHES — Do NOT attempt these

These were tried across 4 iterations and all failed:

1. **SVG stroke-dasharray + stroke-dashoffset** — Created ugly dashed/broken lines. The user explicitly said "I didn't tell you to create dashed line."

2. **SVG mask-based fade** — `maskUnits="objectBoundingBox"` with SVG paths made curves completely invisible. Masks don't work well with individual path elements.

3. **JS per-frame bezier deformation + gradient stop-opacity** — Parsing and rebuilding 17 SVG path `d` attributes every frame plus updating gradient stops caused terrible performance lag.

4. **CSS translateX + rotate keyframes on SVG paths** — Produced rigid "dangling stick" motion. CSS transforms can't create the organic flowing wave the user wanted. Also, CSS transforms don't affect `getPointAtLength()` geometry, causing particle-curve detachment.

**The user's final words on this:** "just get rid of the strands entirely, slightly enlarge these elements turning into pixels — that is enough. You could make these elements larger and the pixelation could be more gradual."

---

## 6. Cursor Effects System

`js/cursor-effects.js` implements 3 page-specific cursor effects (detected via `data-page` attribute on `<body>`):

| Page | Effect Name | Description |
|------|-------------|-------------|
| `home` | Luminous Bloom | 7 orbiting motes + trailing bloom + breathing glow |
| `highlights` | Breathing Constellation | 10 nodes with K=2 nearest-neighbor connections |
| `publications` | Ink Luminance | Ink diffusion trail + halo + oscillating focus ring |

All use canvas overlay at z-index 9999, RAF-synced, with reduced-motion fallback, touch device detection, and high DPI support.

---

## 7. Known Issues / Debt

- **Twitter/X link** in footer: `href="https://twitter.com/"` — needs actual handle or removal
- **`nul` file** in old Website Project root — artifact, can delete
- **`Site Files/` directory** in old Website Project — 242 images from Wix migration, archive only
- **seat-booking-app.html** — referenced in highlights.html but may not exist in projects/
- **No favicon** specific to GitHub Pages (uses `images/logo.png`)

---

## 8. Design Principles

- **Performance first** — The owner rejects anything that causes visible lag or stutter
- **Vanilla only** — No React, no jQuery, no GSAP. Pure HTML/CSS/JS.
- **Accessibility** — `prefers-reduced-motion` support, semantic HTML, `aria-label` on interactive elements
- **Mobile-first** — Responsive with breakpoints at 1024/768/480px
- **Visual quality matters** — The owner is very particular. "Dangling sticks" and dashed lines were immediately rejected. Organic, smooth, and elegant is the standard.
- **No over-engineering** — Simple solutions preferred. The particle system is the ceiling of complexity needed.
