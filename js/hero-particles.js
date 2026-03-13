/**
 * Hero Particle System — Rising Pixelation
 * Particles travel UPWARD along 30° SVG paths.
 * As they rise, they morph from soft circles into crisp 8-bit pixel squares.
 * Near the top they snap to a pixel grid, creating a digital dissolution effect.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const heroVisual = canvas.closest('.hero-visual');
  if (!heroVisual) return;

  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 30 : 65;
  const MOUSE_RADIUS = 90;
  const MOUSE_STRENGTH = 0.5;
  const WANDER_MAX = 3;
  const SAMPLE_STEP = 4;
  const PIXEL_GRID = 4; // px grid for 8-bit snapping

  // Stream color palettes [r, g, b]
  const HUMAN_COLORS = [
    [224, 122, 95],  // coral
    [242, 204, 143], // gold
  ];
  const AI_COLORS = [
    [129, 178, 154], // teal
    [200, 182, 255], // lavender
  ];
  const MERGED_COLOR = [155, 127, 230]; // purple

  // 8-bit palette — colors snap to these at high pixelation
  const PIXEL_PALETTE = [
    [224, 122, 95], [242, 204, 143], [129, 178, 154],
    [200, 182, 255], [155, 127, 230], [255, 255, 255],
  ];

  let streams = [];
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let animating = false;
  let rafId = null;
  let w, h;
  let svgScaleX = 1, svgScaleY = 1, svgOffsetX = 0, svgOffsetY = 0;

  // --- Path Sampling ---

  function samplePath(pathEl) {
    const totalLen = pathEl.getTotalLength();
    const points = [];
    for (let d = 0; d <= totalLen; d += SAMPLE_STEP) {
      const pt = pathEl.getPointAtLength(d);
      points.push({ x: pt.x, y: pt.y });
    }
    const last = pathEl.getPointAtLength(totalLen);
    if (points.length === 0 || points[points.length - 1].x !== last.x) {
      points.push({ x: last.x, y: last.y });
    }
    return points;
  }

  function mapToCanvas(pt) {
    return {
      x: pt.x * svgScaleX + svgOffsetX,
      y: pt.y * svgScaleY + svgOffsetY,
    };
  }


  function buildStreams() {
    const svg = heroVisual.querySelector('.hero-swirl');
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const heroRect = heroVisual.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;

    svgScaleX = svgRect.width / vb.width;
    svgScaleY = svgRect.height / vb.height;
    svgOffsetX = svgRect.left - heroRect.left;
    svgOffsetY = svgRect.top - heroRect.top;

    streams = [];

    svg.querySelectorAll('.flow-h1, .flow-h2, .flow-h3, .flow-h4').forEach(p => {
      streams.push({ el: p, points: samplePath(p), type: 'human' });
    });
    svg.querySelectorAll('.flow-a1, .flow-a2, .flow-a3, .flow-a4').forEach(p => {
      streams.push({ el: p, points: samplePath(p), type: 'ai' });
    });
    svg.querySelectorAll('.flow-m1, .flow-m2, .flow-m3').forEach(p => {
      streams.push({ el: p, points: samplePath(p), type: 'merged' });
    });
  }


  // --- Particle Creation ---

  function pickColor(type) {
    if (type === 'human') return HUMAN_COLORS[Math.random() < 0.6 ? 0 : 1];
    if (type === 'ai') return AI_COLORS[Math.random() < 0.6 ? 0 : 1];
    return MERGED_COLOR;
  }

  function createParticle(staggered) {
    const idx = Math.floor(Math.random() * streams.length);
    const stream = streams[idx];
    if (!stream || stream.points.length < 2) return null;

    const baseColor = pickColor(stream.type);
    // Paths go from bottom (start) to top (end) — progress 0=bottom, 1=top
    const progress = staggered ? Math.random() : 0;

    return {
      streamIdx: idx,
      progress,
      speed: 0.0015 + Math.random() * 0.0025,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderRadius: Math.random() * WANDER_MAX,
      size: 3 + Math.random() * 3.5,
      baseColor,
      alpha: staggered ? 0.25 + Math.random() * 0.35 : 0,
      life: 0,
      pixelPhase: Math.random() * Math.PI * 2, // for pixel shimmer
    };
  }

  function initParticles() {
    particles = [];
    if (streams.length === 0) return;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = createParticle(true);
      if (p) particles.push(p);
    }
  }

  // --- Color & Pixelation ---

  function lerpColor(c1, c2, t) {
    return [
      c1[0] + (c2[0] - c1[0]) * t,
      c1[1] + (c2[1] - c1[1]) * t,
      c1[2] + (c2[2] - c1[2]) * t,
    ];
  }

  // Snap color to nearest 8-bit palette color
  function snapToPixelPalette(col) {
    let best = PIXEL_PALETTE[0], bestDist = Infinity;
    for (const pc of PIXEL_PALETTE) {
      const d = (col[0] - pc[0]) ** 2 + (col[1] - pc[1]) ** 2 + (col[2] - pc[2]) ** 2;
      if (d < bestDist) { bestDist = d; best = pc; }
    }
    return best;
  }

  function getParticleColor(p) {
    const stream = streams[p.streamIdx];
    if (!stream) return p.baseColor;

    let col = p.baseColor;

    // Blend toward purple in upper portion
    if (stream.type !== 'merged' && p.progress > 0.6) {
      const blendT = (p.progress - 0.6) / 0.4;
      col = lerpColor(col, MERGED_COLOR, blendT * 0.6);
    }

    // 8-bit pixelation: snap to palette in upper 30%
    if (p.progress > 0.7) {
      const snapT = (p.progress - 0.7) / 0.3; // 0..1
      const snapped = snapToPixelPalette(col);
      col = lerpColor(col, snapped, snapT);
    }

    return col;
  }

  // --- Pixelation factor: 0 = smooth circle, 1 = crisp pixel square ---
  function getPixelation(progress) {
    if (progress < 0.25) return 0;
    if (progress > 0.92) return 1;
    return (progress - 0.25) / 0.67; // slow gradual 0→1 over 67% of path
  }

  // --- Position ---

  function getPositionOnStream(streamIdx, progress) {
    const stream = streams[streamIdx];
    if (!stream || stream.points.length < 2) return null;

    const pts = stream.points;
    const idx = progress * (pts.length - 1);
    const i = Math.floor(idx);
    const t = idx - i;
    const a = pts[Math.min(i, pts.length - 1)];
    const b = pts[Math.min(i + 1, pts.length - 1)];

    return mapToCanvas({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });
  }

  // --- Update ---

  function update() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const stream = streams[p.streamIdx];
      if (!stream) continue;

      // Speed: accelerate in mid-path, slow at top for dramatic pixel dissolution
      let speedMult = 1;
      if (p.progress < 0.15) speedMult = 0.5 + p.progress * 3;
      else if (p.progress > 0.5 && p.progress < 0.8) speedMult = 1.2;
      else if (p.progress > 0.85) speedMult = 0.5; // slow dissolve at top

      p.progress += p.speed * speedMult;
      p.life++;

      // Wander decreases as pixelation increases (snapping to grid)
      const pix = getPixelation(p.progress);
      p.wanderAngle += (Math.random() - 0.5) * 0.3 * (1 - pix);

      // Fade in at bottom, fade out at top with pixel shimmer
      if (p.progress < 0.06) {
        p.alpha = Math.min(p.alpha + 0.02, 0.75);
      } else if (p.progress > 0.88) {
        // Pixel shimmer: occasional flicker before dissolving
        const shimmer = Math.sin(p.life * 0.3 + p.pixelPhase) > 0.3 ? 1 : 0.3;
        p.alpha *= 0.96 * shimmer;
      } else if (p.alpha < 0.7) {
        p.alpha += 0.01;
      }

      // Respawn
      if (p.progress >= 1 || p.alpha < 0.01) {
        const np = createParticle(false);
        if (np) particles[i] = np;
      }
    }
  }

  // --- Draw ---

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      const pos = getPositionOnStream(p.streamIdx, Math.min(p.progress, 0.999));
      if (!pos) continue;

      const pix = getPixelation(p.progress);

      // Wander (decreases with pixelation)
      const wx = Math.cos(p.wanderAngle) * p.wanderRadius * (1 - pix * 0.8);
      const wy = Math.sin(p.wanderAngle) * p.wanderRadius * (1 - pix * 0.8);
      let px = pos.x + wx;
      let py = pos.y + wy;

      // Mouse interaction
      const mdx = mouse.x - px;
      const mdy = mouse.y - py;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < MOUSE_RADIUS && mDist > 1) {
        const force = (1 - mDist / MOUSE_RADIUS) * MOUSE_STRENGTH;
        px += (mdx / mDist) * force * (1 - pix * 0.6);
        py += (mdy / mDist) * force * (1 - pix * 0.6);
      }

      // Snap to pixel grid as pixelation increases
      if (pix > 0.1) {
        px = px * (1 - pix) + Math.round(px / PIXEL_GRID) * PIXEL_GRID * pix;
        py = py * (1 - pix) + Math.round(py / PIXEL_GRID) * PIXEL_GRID * pix;
      }

      const col = getParticleColor(p);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `rgb(${col[0] | 0}, ${col[1] | 0}, ${col[2] | 0})`;

      // Morph shape: circle → rounded rect → crisp square
      const size = p.size * (1 + pix * 0.4); // slightly bigger when pixelated
      const snapSize = pix > 0.5 ? Math.round(size / 2) * 2 : size; // snap to even px

      if (pix < 0.3) {
        // Smooth circle
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (pix < 0.7) {
        // Rounded square transition
        const r = size * (1 - pix); // corner radius shrinks
        const s = snapSize;
        ctx.beginPath();
        ctx.roundRect(px - s / 2, py - s / 2, s, s, r);
        ctx.fill();
      } else {
        // Crisp 8-bit pixel square
        const s = Math.max(2, Math.round(snapSize));
        ctx.fillRect(
          Math.round(px - s / 2),
          Math.round(py - s / 2),
          s, s
        );
      }

      // Glow for mid-path particles (before they pixelate)
      if (p.size > 2 && p.progress > 0.3 && p.progress < 0.6) {
        ctx.globalAlpha = p.alpha * 0.15;
        ctx.beginPath();
        ctx.arc(px, py, size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pixel trail: leave behind small static squares at high pixelation
      if (pix > 0.6 && p.life % 8 === 0 && p.alpha > 0.15) {
        ctx.globalAlpha = p.alpha * 0.25;
        const ts = 2;
        ctx.fillRect(
          Math.round(px - ts / 2 + (Math.random() - 0.5) * 4),
          Math.round(py - ts / 2 + (Math.random() - 0.5) * 4),
          ts, ts
        );
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!animating) return;
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (animating) return;
    animating = true;
    loop();
  }

  function stop() {
    animating = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // --- Resize ---

  function resize() {
    const rect = heroVisual.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    buildStreams();
  }

  // --- Observers & Events ---

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { e.isIntersecting ? start() : stop(); });
  }, { threshold: 0.1 });

  heroVisual.addEventListener('mousemove', e => {
    const rect = heroVisual.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  heroVisual.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); initParticles(); }, 200);
  });

  // --- Init (delayed for entrance choreography) ---
  setTimeout(() => {
    resize();
    initParticles();
    observer.observe(heroVisual);
  }, 400);

})();
