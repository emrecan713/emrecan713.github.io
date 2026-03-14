/**
 * Hero Particle System - Relational Sparks
 * A broader overlapping field with warm/cool populations, local clustering, and brief spark encounters.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const heroVisual = canvas.closest('.hero-visual');
  if (!ctx || !heroVisual) return;

  const isMobile = () => window.innerWidth < 768;
  const PARTICLE_COUNT = () => (isMobile() ? 92 : 150);
  const SAME_LINK_DISTANCE = () => (isMobile() ? 56 : 74);
  const CROSS_LINK_DISTANCE = () => (isMobile() ? 94 : 122);
  const SPARK_DISTANCE = () => (isMobile() ? 50 : 64);
  const MOUSE_RADIUS = () => (isMobile() ? 115 : 150);
  const MIN_DISTANCE = () => (isMobile() ? 12 : 14);

  const palettes = {
    human: [
      [224, 122, 95],
      [242, 204, 143],
      [255, 205, 178],
      [229, 152, 155]
    ],
    ai: [
      [129, 178, 154],
      [200, 182, 255],
      [110, 196, 168],
      [155, 127, 230]
    ],
    spark: [255, 255, 255]
  };

  let width = 0;
  let height = 0;
  let active = false;
  let rafId = null;
  let lastTime = 0;
  let particles = [];
  let mouse = { x: -9999, y: -9999, active: false };

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function mixColor(a, b, t) {
    return [
      lerp(a[0], b[0], t),
      lerp(a[1], b[1], t),
      lerp(a[2], b[2], t)
    ];
  }

  function pickColor(list) {
    return list[Math.floor(Math.random() * list.length)].slice();
  }

  function colorToString(color, alpha) {
    return `rgba(${color[0] | 0}, ${color[1] | 0}, ${color[2] | 0}, ${alpha})`;
  }

  function getEncounter(time) {
    const base = 0.5 + 0.5 * Math.sin(time * 0.00055);
    return 0.42 + 0.58 * Math.pow(base, 1.14);
  }

  function createParticle(side, time) {
    const human = side === 'human';
    const xBias = human ? rand(0.1, 0.74) : rand(0.26, 0.9);
    const yBias = rand(0.12, 0.9);
    const anchorX = xBias * width;
    const anchorY = yBias * height;

    return {
      side,
      xBias,
      yBias,
      encounterAffinity: rand(0.74, 1.08),
      x: anchorX + rand(-width * 0.04, width * 0.04),
      y: anchorY + rand(-height * 0.05, height * 0.05),
      px: anchorX,
      py: anchorY,
      vx: rand(-10, 10),
      vy: rand(-10, 10),
      speed: rand(0.88, 1.22),
      radius: rand(3.3, 6.0),
      alpha: rand(0.46, 0.78),
      driftSeed: rand(0, Math.PI * 2),
      shimmerSeed: rand(0, Math.PI * 2),
      pulseSeed: rand(0, Math.PI * 2),
      orbitPhase: rand(0, Math.PI * 2),
      orbitSpeed: rand(0.78, 1.3),
      orbitRadius: rand(human ? 16 : 12, human ? 34 : 28),
      color: pickColor(human ? palettes.human : palettes.ai),
      linkBias: rand(0.88, 1.18),
      burst: 0
    };
  }

  function getAttractor(particle, time) {
    const human = particle.side === 'human';
    const encounter = getEncounter(time) * particle.encounterAffinity;
    const centerX = width * (human ? 0.48 : 0.52);
    const centerY = height * 0.52;
    const baseX = particle.xBias * width + Math.sin(time * 0.00085 + particle.driftSeed) * width * 0.036;
    const baseY = particle.yBias * height + Math.cos(time * 0.00072 + particle.shimmerSeed) * height * 0.05;
    const pull = clamp(encounter * 0.28, 0, 0.34);
    const x = lerp(baseX, centerX, pull);
    const y = lerp(baseY, centerY, pull * 0.14);

    return {
      x: human ? x : Math.round(x / 8) * 8,
      y: human ? y : Math.round(y / 8) * 8,
      encounter
    };
  }

  function seedParticles() {
    particles = [];
    const total = PARTICLE_COUNT();
    const perSide = Math.floor(total / 2);

    for (let i = 0; i < perSide; i += 1) {
      particles.push(createParticle('human', performance.now()));
    }

    for (let i = 0; i < total - perSide; i += 1) {
      particles.push(createParticle('ai', performance.now()));
    }
  }

  function resize() {
    const rect = heroVisual.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateParticle(particle, dt, time) {
    const human = particle.side === 'human';
    const attractor = getAttractor(particle, time);

    particle.px = particle.x;
    particle.py = particle.y;

    const orbitTime = time * 0.00102 * particle.orbitSpeed + particle.orbitPhase;
    const orbitX = Math.sin(orbitTime) * particle.orbitRadius * (human ? 1.14 : 0.92);
    const orbitY = Math.cos(orbitTime * (human ? 0.92 : 1.05)) * particle.orbitRadius * (human ? 0.72 : 0.62);
    const targetX = human ? attractor.x + orbitX : Math.round((attractor.x + orbitX) / 8) * 8;
    const targetY = human ? attractor.y + orbitY : Math.round((attractor.y + orbitY) / 8) * 8;

    particle.vx += (targetX - particle.x) * 0.0102 * particle.speed;
    particle.vy += (targetY - particle.y) * 0.0102 * particle.speed;

    if (human) {
      particle.vx += Math.sin(time * 0.00145 + particle.driftSeed) * 0.17;
      particle.vy += Math.cos(time * 0.0012 + particle.shimmerSeed) * 0.14;
      particle.vx += 0.03;
    } else {
      particle.vx += Math.round(Math.sin(time * 0.00112 + particle.driftSeed) * 1.28) * 0.12;
      particle.vy += Math.round(Math.cos(time * 0.00105 + particle.shimmerSeed) * 1.2) * 0.09;
      particle.vx -= 0.03;
    }

    if (mouse.active) {
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const dist = Math.hypot(dx, dy);
      const radius = MOUSE_RADIUS();
      if (dist < radius && dist > 0.001) {
        const influence = 1 - dist / radius;
        particle.vx += dx * 0.0028 * influence;
        particle.vy += dy * 0.0028 * influence;
        particle.vx += (-dy / dist) * 0.16 * influence * (human ? 1 : -1);
        particle.vy += (dx / dist) * 0.16 * influence * (human ? 1 : -1);
        particle.burst = Math.max(particle.burst, influence * 0.56);
      }
    }

    particle.vx *= 0.958;
    particle.vy *= 0.958;
    particle.x += particle.vx * dt * 60;
    particle.y += particle.vy * dt * 60;
    particle.burst *= 0.94;

    if (particle.x < 14) {
      particle.x = 14;
      particle.vx *= -0.45;
    }
    if (particle.x > width - 14) {
      particle.x = width - 14;
      particle.vx *= -0.45;
    }
    if (particle.y < 14) {
      particle.y = 14;
      particle.vy *= -0.45;
    }
    if (particle.y > height - 14) {
      particle.y = height - 14;
      particle.vy *= -0.45;
    }
  }

  function applyPairForces() {
    const minDistance = MIN_DISTANCE();

    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];

      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const nx = dx / dist;
        const ny = dy / dist;

        if (dist < minDistance) {
          const repel = (1 - dist / minDistance) * 0.45;
          a.vx -= nx * repel;
          a.vy -= ny * repel;
          b.vx += nx * repel;
          b.vy += ny * repel;
          continue;
        }

        if (a.side === b.side) {
          const homeGap = Math.hypot(a.xBias - b.xBias, (a.yBias - b.yBias) * 0.85);
          if (homeGap < 0.28 && dist < SAME_LINK_DISTANCE()) {
            const coherence = 1 - homeGap / 0.28;
            const desired = a.side === 'human' ? 42 : 38;
            const attract = ((dist - desired) / desired) * (0.0024 + coherence * 0.0024);
            a.vx += nx * attract;
            a.vy += ny * attract * 0.64;
            b.vx -= nx * attract;
            b.vy -= ny * attract * 0.64;
          }
        } else if (dist < CROSS_LINK_DISTANCE()) {
          const midpointX = (a.x + b.x) * 0.5;
          const centerFactor = 1 - Math.min(1, Math.abs(midpointX - width * 0.5) / (width * 0.28));
          const pull = (1 - dist / CROSS_LINK_DISTANCE()) * 0.066 * (0.14 + centerFactor * 0.96);
          a.vx += nx * pull;
          a.vy += ny * pull * 0.58;
          b.vx -= nx * pull;
          b.vy -= ny * pull * 0.58;

          if (dist < SPARK_DISTANCE()) {
            const burst = (1 - dist / SPARK_DISTANCE()) * (0.22 + centerFactor * 0.58);
            a.burst = Math.max(a.burst, burst);
            b.burst = Math.max(b.burst, burst);
          }
        }
      }
    }
  }

  function drawParticle(particle, time) {
    const pulse = 0.88 + Math.sin(time * 0.002 + particle.pulseSeed) * 0.17;
    const radius = particle.radius * pulse * (1 + particle.burst * 0.28);
    const centerMix = clamp(1 - Math.abs(particle.x - width * 0.5) / (width * 0.34), 0, 1);
    const color = mixColor(particle.color, palettes.spark, centerMix * 0.1 + particle.burst * 0.22);

    ctx.strokeStyle = colorToString(color, particle.alpha * (0.11 + particle.burst * 0.22));
    ctx.lineWidth = particle.side === 'human' ? 1.08 : 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(particle.px, particle.py);

    if (particle.side === 'human') {
      const mx = (particle.px + particle.x) * 0.5 + Math.sin(time * 0.003 + particle.driftSeed) * 2;
      const my = (particle.py + particle.y) * 0.5 + Math.cos(time * 0.003 + particle.shimmerSeed) * 2;
      ctx.quadraticCurveTo(mx, my, particle.x, particle.y);
    } else {
      ctx.lineTo(Math.round(particle.x / 6) * 6, Math.round(particle.y / 6) * 6);
    }

    ctx.stroke();

    ctx.fillStyle = colorToString(color, particle.alpha * (0.16 + particle.burst * 0.12));
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * 2.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colorToString(color, particle.alpha);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSpark(a, b, intensity, time) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const px = -dy / dist;
    const py = dx / dist;
    const jitter = 5 + intensity * 10;

    const p1x = lerp(a.x, b.x, 0.32) + px * Math.sin(time * 0.014 + a.pulseSeed) * jitter;
    const p1y = lerp(a.y, b.y, 0.32) + py * Math.cos(time * 0.014 + a.shimmerSeed) * jitter;
    const p2x = lerp(a.x, b.x, 0.68) - px * Math.cos(time * 0.014 + b.pulseSeed) * jitter;
    const p2y = lerp(a.y, b.y, 0.68) - py * Math.sin(time * 0.014 + b.shimmerSeed) * jitter;
    const alpha = 0.19 + intensity * 0.5;

    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 1.5 + intensity * 1.8;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.78})`;
    ctx.beginPath();
    ctx.arc((p1x + p2x) * 0.5, (p1y + p2y) * 0.5, 1.2 + intensity * 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawConnections(time) {
    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];

      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const sameSide = a.side === b.side;

        if (sameSide) {
          const homeGap = Math.hypot(a.xBias - b.xBias, (a.yBias - b.yBias) * 0.85);
          if (homeGap > 0.28 || dist > SAME_LINK_DISTANCE()) continue;
          const closeness = 1 - dist / SAME_LINK_DISTANCE();
          const coherence = 1 - homeGap / 0.28;
          const alpha = closeness * (0.08 + coherence * 0.12) * ((a.alpha + b.alpha) * 0.5);
          if (alpha < 0.012) continue;

          const color = mixColor(a.color, b.color, 0.48);
          ctx.strokeStyle = colorToString(color, alpha);
          ctx.lineWidth = coherence > 0.5 ? (a.side === 'human' ? 0.86 : 0.78) : 0.62;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          if (a.side === 'human') {
            const mx = (a.x + b.x) * 0.5 + Math.sin(time * 0.0025 + i + j) * (2.4 + coherence * 1.7);
            const my = (a.y + b.y) * 0.5 + Math.cos(time * 0.0022 + i + j) * (2.4 + coherence * 1.7);
            ctx.quadraticCurveTo(mx, my, b.x, b.y);
          } else {
            ctx.lineTo(b.x, b.y);
          }
          ctx.stroke();
          continue;
        }

        if (dist > CROSS_LINK_DISTANCE()) continue;

        const midpointX = (a.x + b.x) * 0.5;
        const midpointY = (a.y + b.y) * 0.5;
        const centerFactor = 1 - Math.min(1, Math.abs(midpointX - width * 0.5) / (width * 0.28));
        const mouseBoost = mouse.active
          ? 1 + clamp(1 - Math.hypot(mouse.x - midpointX, mouse.y - midpointY) / MOUSE_RADIUS(), 0, 1) * 0.5
          : 1;
        const closeness = 1 - dist / CROSS_LINK_DISTANCE();
        const alpha = closeness * 0.42 * (0.16 + centerFactor * 1.26) * mouseBoost;
        if (alpha < 0.02 || (centerFactor < 0.1 && closeness < 0.66)) continue;

        const color = mixColor(a.color, b.color, 0.5);
        const bend = Math.sin(time * 0.003 + i + j) * (6 + centerFactor * 9);
        const mx = midpointX + (-dy / Math.max(dist, 1)) * bend;
        const my = midpointY + (dx / Math.max(dist, 1)) * bend * 0.68;

        ctx.strokeStyle = colorToString(color, alpha);
        ctx.lineWidth = 1 + closeness * 1.12;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.stroke();

        if (dist < SPARK_DISTANCE()) {
          drawSpark(a, b, closeness * (0.72 + centerFactor * 0.68), time);
        }
      }
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    drawConnections(time);
    for (let i = 0; i < particles.length; i += 1) {
      drawParticle(particles[i], time);
    }
  }

  function frame(time) {
    if (!active) return;
    const dt = Math.min(0.05, ((time - lastTime) || 16.7) / 1000);
    lastTime = time;

    for (let i = 0; i < particles.length; i += 1) {
      updateParticle(particles[i], dt, time);
    }

    applyPairForces();
    draw(time);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (active) return;
    active = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) start();
      else stop();
    });
  }, { threshold: 0.15 });

  heroVisual.addEventListener('pointermove', (event) => {
    const rect = heroVisual.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
  });

  heroVisual.addEventListener('pointerleave', () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      seedParticles();
    }, 120);
  });

  setTimeout(() => {
    resize();
    seedParticles();
    observer.observe(heroVisual);
  }, 300);
})();
