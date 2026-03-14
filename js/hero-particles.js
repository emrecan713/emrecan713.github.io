/**
 * Hero Particle System - Relational Sparks
 * Approved visual baseline, tuned for calmer motion and better performance.
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

  function getPerformanceTier() {
    if (isMobile()) return 'mobile';
    const memory = navigator.deviceMemory || 0;
    const cores = navigator.hardwareConcurrency || 0;
    if ((memory && memory <= 4) || (cores && cores <= 4)) return 'lite';
    return 'full';
  }

  const PARTICLE_COUNT = () => {
    const tier = getPerformanceTier();
    return tier === 'mobile' ? 64 : tier === 'lite' ? 84 : 110;
  };
  const SAME_LINK_DISTANCE = () => {
    const tier = getPerformanceTier();
    return tier === 'mobile' ? 48 : tier === 'lite' ? 58 : 68;
  };
  const CROSS_LINK_DISTANCE = () => {
    const tier = getPerformanceTier();
    return tier === 'mobile' ? 78 : tier === 'lite' ? 94 : 112;
  };
  const SPARK_DISTANCE = () => {
    const tier = getPerformanceTier();
    return tier === 'mobile' ? 42 : tier === 'lite' ? 50 : 58;
  };
  const MOUSE_RADIUS = () => {
    const tier = getPerformanceTier();
    return tier === 'mobile' ? 96 : tier === 'lite' ? 118 : 138;
  };
  const MIN_DISTANCE = () => {
    const tier = getPerformanceTier();
    return tier === 'mobile' ? 11 : tier === 'lite' ? 12 : 13;
  };

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
    const base = 0.5 + 0.5 * Math.sin(time * 0.00045);
    return 0.42 + 0.58 * Math.pow(base, 1.1);
  }

  function createParticle(side) {
    const human = side === 'human';
    const xBias = human ? rand(0.1, 0.74) : rand(0.26, 0.9);
    const yBias = rand(0.12, 0.9);
    const anchorX = xBias * width;
    const anchorY = yBias * height;

    return {
      side,
      xBias,
      yBias,
      encounterAffinity: rand(0.76, 1.04),
      x: anchorX + rand(-width * 0.035, width * 0.035),
      y: anchorY + rand(-height * 0.045, height * 0.045),
      px: anchorX,
      py: anchorY,
      vx: rand(-7, 7),
      vy: rand(-7, 7),
      speed: rand(0.9, 1.12),
      radius: rand(3.2, 5.8),
      alpha: rand(0.46, 0.76),
      driftSeed: rand(0, Math.PI * 2),
      shimmerSeed: rand(0, Math.PI * 2),
      pulseSeed: rand(0, Math.PI * 2),
      orbitPhase: rand(0, Math.PI * 2),
      orbitSpeed: rand(0.5, 0.84),
      orbitRadius: rand(human ? 12 : 10, human ? 28 : 24),
      color: pickColor(human ? palettes.human : palettes.ai),
      linkBias: rand(0.9, 1.12),
      burst: 0
    };
  }

  function getAttractor(particle, time) {
    const human = particle.side === 'human';
    const encounter = getEncounter(time) * particle.encounterAffinity;
    const centerX = width * (human ? 0.48 : 0.52);
    const centerY = height * 0.52;
    const baseX = particle.xBias * width + Math.sin(time * 0.00062 + particle.driftSeed) * width * 0.028;
    const baseY = particle.yBias * height + Math.cos(time * 0.00054 + particle.shimmerSeed) * height * 0.04;
    const pull = clamp(encounter * 0.24, 0, 0.28);
    const x = lerp(baseX, centerX, pull);
    const y = lerp(baseY, centerY, pull * 0.12);

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
      particles.push(createParticle('human'));
    }

    for (let i = 0; i < total - perSide; i += 1) {
      particles.push(createParticle('ai'));
    }
  }

  function resize() {
    const rect = heroVisual.getBoundingClientRect();
    const tier = getPerformanceTier();
    const dprCap = tier === 'full' ? 1.5 : 1.2;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
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
    const tier = getPerformanceTier();
    const motionScale = tier === 'full' ? 1 : tier === 'lite' ? 0.84 : 0.74;
    const damping = tier === 'full' ? 0.97 : tier === 'lite' ? 0.973 : 0.976;

    particle.px = particle.x;
    particle.py = particle.y;

    const orbitTime = time * 0.00072 * particle.orbitSpeed + particle.orbitPhase;
    const orbitX = Math.sin(orbitTime) * particle.orbitRadius * (human ? 1.08 : 0.9);
    const orbitY = Math.cos(orbitTime * (human ? 0.94 : 1.04)) * particle.orbitRadius * (human ? 0.58 : 0.5);
    const targetX = human ? attractor.x + orbitX : Math.round((attractor.x + orbitX) / 8) * 8;
    const targetY = human ? attractor.y + orbitY : Math.round((attractor.y + orbitY) / 8) * 8;

    particle.vx += (targetX - particle.x) * 0.0074 * particle.speed * motionScale;
    particle.vy += (targetY - particle.y) * 0.0074 * particle.speed * motionScale;

    if (human) {
      particle.vx += Math.sin(time * 0.00095 + particle.driftSeed) * 0.09 * motionScale;
      particle.vy += Math.cos(time * 0.00082 + particle.shimmerSeed) * 0.07 * motionScale;
      particle.vx += 0.012 * motionScale;
    } else {
      particle.vx += Math.round(Math.sin(time * 0.00088 + particle.driftSeed) * 1.16) * 0.06 * motionScale;
      particle.vy += Math.round(Math.cos(time * 0.0008 + particle.shimmerSeed) * 1.06) * 0.042 * motionScale;
      particle.vx -= 0.012 * motionScale;
    }

    if (mouse.active) {
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const dist = Math.hypot(dx, dy);
      const radius = MOUSE_RADIUS();
      if (dist < radius && dist > 0.001) {
        const influence = 1 - dist / radius;
        particle.vx += dx * 0.0014 * influence * motionScale;
        particle.vy += dy * 0.0014 * influence * motionScale;
        particle.vx += (-dy / dist) * 0.07 * influence * motionScale * (human ? 1 : -1);
        particle.vy += (dx / dist) * 0.07 * influence * motionScale * (human ? 1 : -1);
        particle.burst = Math.max(particle.burst, influence * (tier === 'full' ? 0.38 : 0.3));
      }
    }

    particle.vx *= damping;
    particle.vy *= damping;
    particle.x += particle.vx * dt * 60;
    particle.y += particle.vy * dt * 60;
    particle.burst *= 0.95;

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

  function collectNearbyPairs() {
    const cellSize = CROSS_LINK_DISTANCE();
    const grid = new Map();
    const pairs = [];
    const neighborOffsets = [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 1]
    ];

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      const gx = Math.floor(p.x / cellSize);
      const gy = Math.floor(p.y / cellSize);
      const key = `${gx},${gy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(i);
    }

    for (const [key, indices] of grid.entries()) {
      const [gx, gy] = key.split(',').map(Number);

      for (let i = 0; i < indices.length; i += 1) {
        for (let j = i + 1; j < indices.length; j += 1) {
          pairs.push([indices[i], indices[j]]);
        }
      }

      for (const [ox, oy] of neighborOffsets) {
        const neighbor = grid.get(`${gx + ox},${gy + oy}`);
        if (!neighbor) continue;
        for (const a of indices) {
          for (const b of neighbor) {
            pairs.push([a, b]);
          }
        }
      }
    }

    return pairs;
  }

  function applyPairForces(pairs) {
    const minDistance = MIN_DISTANCE();
    const sameDistance = SAME_LINK_DISTANCE();
    const crossDistance = CROSS_LINK_DISTANCE();

    for (const [ai, bi] of pairs) {
      const a = particles[ai];
      const b = particles[bi];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;

      if (dist < minDistance) {
        const repel = (1 - dist / minDistance) * 0.4;
        a.vx -= nx * repel;
        a.vy -= ny * repel;
        b.vx += nx * repel;
        b.vy += ny * repel;
        continue;
      }

      if (a.side === b.side) {
        const homeGap = Math.hypot(a.xBias - b.xBias, (a.yBias - b.yBias) * 0.85);
        if (homeGap < 0.28 && dist < sameDistance) {
          const coherence = 1 - homeGap / 0.28;
          const desired = a.side === 'human' ? 40 : 36;
          const attract = ((dist - desired) / desired) * (0.0014 + coherence * 0.0018);
          a.vx += nx * attract;
          a.vy += ny * attract * 0.62;
          b.vx -= nx * attract;
          b.vy -= ny * attract * 0.62;
        }
      } else if (dist < crossDistance) {
        const midpointX = (a.x + b.x) * 0.5;
        const centerFactor = 1 - Math.min(1, Math.abs(midpointX - width * 0.5) / (width * 0.28));
        const pull = (1 - dist / crossDistance) * 0.04 * (0.18 + centerFactor * 0.72);
        a.vx += nx * pull;
        a.vy += ny * pull * 0.58;
        b.vx -= nx * pull;
        b.vy -= ny * pull * 0.58;

        if (dist < SPARK_DISTANCE()) {
          const burst = (1 - dist / SPARK_DISTANCE()) * (0.2 + centerFactor * 0.46);
          a.burst = Math.max(a.burst, burst);
          b.burst = Math.max(b.burst, burst);
        }
      }
    }
  }

  function drawParticle(particle, time) {
    const pulse = 0.9 + Math.sin(time * 0.0017 + particle.pulseSeed) * 0.12;
    const radius = particle.radius * pulse * (1 + particle.burst * 0.22);
    const centerMix = clamp(1 - Math.abs(particle.x - width * 0.5) / (width * 0.34), 0, 1);
    const color = mixColor(particle.color, palettes.spark, centerMix * 0.08 + particle.burst * 0.16);

    ctx.strokeStyle = colorToString(color, particle.alpha * (0.09 + particle.burst * 0.16));
    ctx.lineWidth = particle.side === 'human' ? 0.94 : 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(particle.px, particle.py);

    if (particle.side === 'human') {
      const mx = (particle.px + particle.x) * 0.5 + Math.sin(time * 0.0022 + particle.driftSeed) * 1.5;
      const my = (particle.py + particle.y) * 0.5 + Math.cos(time * 0.002 + particle.shimmerSeed) * 1.5;
      ctx.quadraticCurveTo(mx, my, particle.x, particle.y);
    } else {
      ctx.lineTo(Math.round(particle.x / 6) * 6, Math.round(particle.y / 6) * 6);
    }

    ctx.stroke();

    ctx.fillStyle = colorToString(color, particle.alpha * (0.14 + particle.burst * 0.08));
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * 1.95, 0, Math.PI * 2);
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
    const jitter = 4 + intensity * 7;

    const p1x = lerp(a.x, b.x, 0.34) + px * Math.sin(time * 0.012 + a.pulseSeed) * jitter;
    const p1y = lerp(a.y, b.y, 0.34) + py * Math.cos(time * 0.012 + a.shimmerSeed) * jitter;
    const p2x = lerp(a.x, b.x, 0.66) - px * Math.cos(time * 0.012 + b.pulseSeed) * jitter;
    const p2y = lerp(a.y, b.y, 0.66) - py * Math.sin(time * 0.012 + b.shimmerSeed) * jitter;
    const alpha = 0.15 + intensity * 0.36;

    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 1.15 + intensity * 1.3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function drawConnections(time, pairs) {
    const sameDistance = SAME_LINK_DISTANCE();
    const crossDistance = CROSS_LINK_DISTANCE();

    for (const [ai, bi] of pairs) {
      const a = particles[ai];
      const b = particles[bi];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const sameSide = a.side === b.side;

      if (sameSide) {
        const homeGap = Math.hypot(a.xBias - b.xBias, (a.yBias - b.yBias) * 0.85);
        if (homeGap > 0.28 || dist > sameDistance) continue;
        const closeness = 1 - dist / sameDistance;
        const coherence = 1 - homeGap / 0.28;
        const alpha = closeness * (0.05 + coherence * 0.08) * ((a.alpha + b.alpha) * 0.5);
        if (alpha < 0.012) continue;

        const color = mixColor(a.color, b.color, 0.48);
        ctx.strokeStyle = colorToString(color, alpha);
        ctx.lineWidth = coherence > 0.45 ? (a.side === 'human' ? 0.7 : 0.6) : 0.45;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        if (a.side === 'human') {
          const mx = (a.x + b.x) * 0.5 + Math.sin(time * 0.002 + ai + bi) * (1.8 + coherence * 1.2);
          const my = (a.y + b.y) * 0.5 + Math.cos(time * 0.0018 + ai + bi) * (1.8 + coherence * 1.2);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
        } else {
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
        continue;
      }

      if (dist > crossDistance) continue;

      const midpointX = (a.x + b.x) * 0.5;
      const midpointY = (a.y + b.y) * 0.5;
      const centerFactor = 1 - Math.min(1, Math.abs(midpointX - width * 0.5) / (width * 0.28));
      const mouseBoost = mouse.active
        ? 1 + clamp(1 - Math.hypot(mouse.x - midpointX, mouse.y - midpointY) / MOUSE_RADIUS(), 0, 1) * 0.28
        : 1;
      const closeness = 1 - dist / crossDistance;
      const alpha = closeness * 0.32 * (0.16 + centerFactor * 0.92) * mouseBoost;
      if (alpha < 0.018 || (centerFactor < 0.08 && closeness < 0.72)) continue;

      const color = mixColor(a.color, b.color, 0.5);
      const bend = Math.sin(time * 0.0024 + ai + bi) * (4 + centerFactor * 5);
      const mx = midpointX + (-dy / Math.max(dist, 1)) * bend;
      const my = midpointY + (dx / Math.max(dist, 1)) * bend * 0.62;

      ctx.strokeStyle = colorToString(color, alpha);
      ctx.lineWidth = 0.9 + closeness * 0.8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.stroke();

      if (dist < SPARK_DISTANCE()) {
        drawSpark(a, b, closeness * (0.62 + centerFactor * 0.48), time);
      }
    }
  }

  function draw(time, pairs) {
    ctx.clearRect(0, 0, width, height);
    drawConnections(time, pairs);
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

    const pairs = collectNearbyPairs();
    applyPairForces(pairs);
    draw(time, pairs);
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
