# TASK-1: Design Improvements

> Read `AGENT-HANDOFF.md` first for full project context, design system, and file map.

---

## Priority 1 — Hero Particle Animation

Replace the static `swirl-decoration.png` with a canvas-based particle system.

### What to build
Create `js/hero-particles.js` — particles rise upward and gradually morph from soft circles into 8-bit pixel squares.

### Spec
- Particle radius: `2 + Math.random() * 2.5`
- Colors: sample from site palette (peach `#FFCDB2`, blush `#FFB4A2`, rose `#E5989B`, gold `#F2CC8F`, orange `#E07A5F`, teal `#81B29A`)
- Count: ~30 mobile / ~65 desktop
- Circle → square morphing must be **gradual**, not abrupt
- Max opacity ~0.75
- Particles spawn near bottom, drift upward with slight horizontal wander, fade out near top
- Mouse proximity: subtle repel or attract
- Init: visible within ~400ms of page load
- `prefers-reduced-motion`: disable entirely
- Must run smooth 60fps

### HTML changes (`index.html`)
- Add `<canvas class="hero-particle-canvas" id="heroParticles"></canvas>` inside `.hero-visual`
- Hide or wrap `swirl-decoration.png` in `<noscript>` as fallback
- Add `<script src="js/hero-particles.js"></script>` before `</body>`

### CSS additions (`css/style.css`)
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

### DO NOT attempt
- SVG stroke-dasharray animations (creates dashed lines)
- SVG masks on paths (makes them invisible)
- Per-frame SVG path `d` attribute rewriting (terrible performance)
- CSS transforms on SVG paths (rigid motion, breaks getPointAtLength)

---

## Priority 2 — Polish & Micro-interactions

### 2a. Smooth page transitions
Add a subtle fade transition when navigating between pages. CSS-only approach:
```css
body {
  animation: pageIn 0.4s ease;
}
@keyframes pageIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 2b. Hero greeting animation
The "Hello!" text currently uses a JS typing effect in `main.js`. Consider enhancing with a subtle hand-wave emoji or a soft entrance animation that feels more personal.

### 2c. Scroll progress indicator
Add a thin progress bar at the top of the page (below navbar) showing scroll position. Use the accent-orange color, 2-3px height. JS-driven with `scroll` event + `requestAnimationFrame`.

### 2d. Back-to-top button
Floating button that appears after scrolling past the hero section. Subtle, small, uses the peach/blush palette. Smooth scroll to top on click.

### 2e. Image lazy loading
Add `loading="lazy"` to all `<img>` tags that are below the fold (about section, highlights grid, project pages). Do NOT add to hero or navbar images.

---

## Priority 3 — Content Fixes

### 3a. Twitter/X link
Footer has `href="https://twitter.com/"` with no handle. Either:
- Update to the correct X/Twitter profile URL, or
- Remove the Twitter link entirely and keep LinkedIn + Google Scholar

### 3b. Favicon
Currently uses `images/logo.png`. Consider generating proper favicon sizes (16x16, 32x32, 180x180 apple-touch) from the logo.

### 3c. 404 page
Create a simple `404.html` for GitHub Pages with a friendly message and link back to home. Match the dark theme.

---

## Testing

1. `python -m http.server 8000` in repo root
2. Check all 3 pages (home, highlights, publications)
3. Test hero particles on desktop and mobile viewport (responsive)
4. Verify `prefers-reduced-motion` disables particle animation
5. Check performance in Chrome DevTools (should stay under 16ms per frame)
6. Test navigation between pages
7. Verify all project page links work from highlights.html

---

## Constraints

- **Vanilla JS only** — no libraries, no frameworks
- **Performance** — owner rejects anything that lags
- **Visual quality** — organic, smooth, elegant. No rigid/mechanical effects
- **Accessibility** — reduced motion, semantic HTML, aria labels
- **Mobile-first** — test at 375px, 768px, 1024px, 1280px
