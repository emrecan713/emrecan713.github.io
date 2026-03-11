/* ===================================
   Elegant Cursor Effects
   Dr. Emrecan Gulay Portfolio

   HOME:         Luminous Bloom
   HIGHLIGHTS:   Breathing Constellation
   PUBLICATIONS: Ink Luminance
   =================================== */

(function () {
  // -------- Bail on touch-only or reduced-motion --------
  if (!window.matchMedia('(hover: hover)').matches) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------- Canvas setup --------
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, dpr;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  // -------- RAF-synced mouse state --------
  let rawX = w / 2, rawY = h / 2;
  let mouseX = rawX, mouseY = rawY;
  let prevX = mouseX, prevY = mouseY;
  let mouseSpeed = 0;
  let mousePresent = false;
  let hasMoved = false;
  let fadeAlpha = 0; // for smooth fade in/out

  document.addEventListener('mousemove', function (e) {
    rawX = e.clientX;
    rawY = e.clientY;
    mousePresent = true;
    hasMoved = true;
  });

  document.addEventListener('mouseleave', function () {
    mousePresent = false;
  });

  function syncMouse() {
    prevX = mouseX;
    prevY = mouseY;
    mouseX = rawX;
    mouseY = rawY;
    var dx = mouseX - prevX;
    var dy = mouseY - prevY;
    mouseSpeed = Math.sqrt(dx * dx + dy * dy);

    // Smooth fade in/out
    if (mousePresent && hasMoved) {
      fadeAlpha = Math.min(1, fadeAlpha + 0.04);
    } else {
      fadeAlpha = Math.max(0, fadeAlpha - 0.015);
    }
  }

  // -------- Visibility API --------
  let animating = true;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      animating = false;
    } else {
      animating = true;
      requestAnimationFrame(mainLoop);
    }
  });

  // -------- Page detection --------
  var page = document.body.dataset.page || 'home';

  // -------- Pre-computed colors --------
  var C = {
    peach:     { r: 255, g: 205, b: 178 },
    blush:     { r: 255, g: 180, b: 162 },
    rose:      { r: 229, g: 152, b: 155 },
    deepRose:  { r: 181, g: 131, b: 141 },
    orange:    { r: 224, g: 122, b: 95  },
    gold:      { r: 242, g: 204, b: 143 },
    teal:      { r: 129, g: 178, b: 154 },
    charcoal:  { r: 43,  g: 45,  b: 66  },
  };

  function rgba(c, a) {
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // -------- Ring Buffer --------
  function RingBuffer(size) {
    this.data = new Array(size);
    this.size = size;
    this.head = 0;
    this.count = 0;
  }
  RingBuffer.prototype.push = function (item) {
    this.data[this.head] = item;
    this.head = (this.head + 1) % this.size;
    if (this.count < this.size) this.count++;
  };
  RingBuffer.prototype.forEach = function (fn) {
    for (var i = 0; i < this.count; i++) {
      var idx = (this.head - this.count + i + this.size) % this.size;
      fn(this.data[idx], i, this.count);
    }
  };

  // -------- Smoothed position --------
  var orbX = w / 2, orbY = h / 2;
  var time = 0;

  // ========================================
  //  HOME: Luminous Bloom
  // ========================================
  var homeTrail, homeMotes;

  function initHome() {
    homeTrail = new RingBuffer(12);
    homeMotes = [];
    var moteColors = [C.peach, C.blush, C.rose, C.gold, C.orange, C.peach, C.blush];
    for (var i = 0; i < 7; i++) {
      homeMotes.push({
        orbitRadius: 65 + Math.random() * 80,
        orbitSpeed: (0.003 + Math.random() * 0.006) * (i % 2 === 0 ? 1 : -1),
        angle: (Math.PI * 2 / 7) * i + Math.random() * 0.5,
        baseSize: 1.8 + Math.random() * 1.5,
        baseAlpha: 0.15 + Math.random() * 0.12,
        phaseOffset: Math.random() * Math.PI * 2,
        color: moteColors[i],
        x: w / 2,
        y: h / 2,
      });
    }
  }

  function drawHome() {
    var lerpF = 0.08;
    orbX = lerp(orbX, mouseX, lerpF);
    orbY = lerp(orbY, mouseY, lerpF);

    var alpha = fadeAlpha;
    if (alpha <= 0.001) return;

    // Push current position to trail every 3 frames
    if (time % 3 === 0) {
      homeTrail.push({ x: orbX, y: orbY });
    }

    // --- Trailing bloom ---
    homeTrail.forEach(function (pos, i, total) {
      var t = i / total;
      var trailAlpha = 0.04 * t * alpha;
      var trailRadius = 50 + t * 40;
      var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, trailRadius);
      grad.addColorStop(0, rgba(C.peach, trailAlpha));
      grad.addColorStop(1, rgba(C.peach, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(pos.x - trailRadius, pos.y - trailRadius, trailRadius * 2, trailRadius * 2);
    });

    // --- Main orb glow ---
    var breathR = 110 + Math.sin(time * 0.002) * 12;
    var grad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, breathR);
    grad.addColorStop(0, rgba(C.peach, 0.14 * alpha));
    grad.addColorStop(0.35, rgba(C.blush, 0.07 * alpha));
    grad.addColorStop(0.65, rgba(C.rose, 0.025 * alpha));
    grad.addColorStop(1, rgba(C.peach, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(orbX - breathR, orbY - breathR, breathR * 2, breathR * 2);

    // --- Ambient motes ---
    for (var i = 0; i < homeMotes.length; i++) {
      var m = homeMotes[i];
      m.angle += m.orbitSpeed;
      var tx = orbX + Math.cos(m.angle) * m.orbitRadius;
      var ty = orbY + Math.sin(m.angle) * m.orbitRadius;
      m.x = lerp(m.x, tx, 0.045);
      m.y = lerp(m.y, ty, 0.045);

      var sizeBreath = m.baseSize + Math.sin(time * 0.003 + m.phaseOffset) * 0.5;
      var alphaBreath = m.baseAlpha + Math.sin(time * 0.002 + m.phaseOffset + 1.5) * 0.04;
      var mAlpha = Math.max(0, alphaBreath * alpha);

      // Soft glow dot
      var dotGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, sizeBreath * 3);
      dotGrad.addColorStop(0, rgba(m.color, mAlpha));
      dotGrad.addColorStop(0.4, rgba(m.color, mAlpha * 0.4));
      dotGrad.addColorStop(1, rgba(m.color, 0));
      ctx.fillStyle = dotGrad;
      ctx.fillRect(m.x - sizeBreath * 3, m.y - sizeBreath * 3, sizeBreath * 6, sizeBreath * 6);

      // Core dot
      ctx.beginPath();
      ctx.arc(m.x, m.y, sizeBreath, 0, Math.PI * 2);
      ctx.fillStyle = rgba(m.color, mAlpha * 1.2);
      ctx.fill();
    }
  }

  // ========================================
  //  HIGHLIGHTS: Breathing Constellation
  // ========================================
  var hlNodes;

  function initHighlights() {
    hlNodes = [];
    var nodeColors = [C.gold, C.teal, C.peach, C.orange, C.deepRose,
                      C.gold, C.teal, C.peach, C.gold, C.teal];
    for (var i = 0; i < 10; i++) {
      hlNodes.push({
        orbitRadius: 40 + Math.random() * 80,
        orbitSpeed: (0.004 + Math.random() * 0.008) * (i % 2 === 0 ? 1 : -1),
        angle: (Math.PI * 2 / 10) * i,
        breathPhase: Math.random() * Math.PI * 2,
        baseSize: 2 + Math.random() * 1.5,
        color: nodeColors[i],
        x: w / 2,
        y: h / 2,
      });
    }
  }

  function drawHighlights() {
    var lerpF = 0.06;
    orbX = lerp(orbX, mouseX, lerpF);
    orbY = lerp(orbY, mouseY, lerpF);

    var alpha = fadeAlpha;
    if (alpha <= 0.001) return;

    // Global breath
    var breathFactor = 1 + Math.sin(time * 0.0012) * 0.12;

    // --- Central glow ---
    var glowR = 85 + Math.sin(time * 0.0015) * 12;
    var grad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, glowR);
    grad.addColorStop(0, rgba(C.gold, 0.07 * alpha));
    grad.addColorStop(1, rgba(C.gold, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(orbX - glowR, orbY - glowR, glowR * 2, glowR * 2);

    // Update node positions
    for (var i = 0; i < hlNodes.length; i++) {
      var n = hlNodes[i];
      n.angle += n.orbitSpeed;
      var r = n.orbitRadius * breathFactor * (1 + Math.sin(time * 0.0018 + n.breathPhase) * 0.08);
      var tx = orbX + Math.cos(n.angle) * r;
      var ty = orbY + Math.sin(n.angle) * r;
      n.x = lerp(n.x, tx, 0.04);
      n.y = lerp(n.y, ty, 0.04);
    }

    // --- Connections (K=2 nearest neighbors, batched) ---
    // Compute all pairwise distances
    var conns = [];
    for (var i = 0; i < hlNodes.length; i++) {
      var dists = [];
      for (var j = 0; j < hlNodes.length; j++) {
        if (i === j) continue;
        var dx = hlNodes[i].x - hlNodes[j].x;
        var dy = hlNodes[i].y - hlNodes[j].y;
        dists.push({ j: j, d: Math.sqrt(dx * dx + dy * dy) });
      }
      dists.sort(function (a, b) { return a.d - b.d; });
      // Connect to 2 nearest
      for (var k = 0; k < 2 && k < dists.length; k++) {
        var key = Math.min(i, dists[k].j) + '-' + Math.max(i, dists[k].j);
        conns.push({ i: i, j: dists[k].j, d: dists[k].d, key: key });
      }
    }

    // Deduplicate
    var seen = {};
    var uniqueConns = [];
    for (var c = 0; c < conns.length; c++) {
      if (!seen[conns[c].key]) {
        seen[conns[c].key] = true;
        uniqueConns.push(conns[c]);
      }
    }

    // Batch draw lines by alpha bucket
    var maxDist = 180;
    var buckets = [[], [], []]; // 3 alpha buckets
    for (var c = 0; c < uniqueConns.length; c++) {
      var conn = uniqueConns[c];
      if (conn.d > maxDist) continue;
      var t = 1 - conn.d / maxDist;
      if (t > 0.6) buckets[0].push(conn);
      else if (t > 0.3) buckets[1].push(conn);
      else buckets[2].push(conn);
    }

    var bucketAlphas = [0.16 * alpha, 0.10 * alpha, 0.05 * alpha];
    ctx.lineWidth = 0.6;

    for (var b = 0; b < buckets.length; b++) {
      if (buckets[b].length === 0) continue;
      ctx.beginPath();
      for (var c = 0; c < buckets[b].length; c++) {
        var conn = buckets[b][c];
        ctx.moveTo(hlNodes[conn.i].x, hlNodes[conn.i].y);
        ctx.lineTo(hlNodes[conn.j].x, hlNodes[conn.j].y);
      }
      ctx.strokeStyle = rgba(C.gold, bucketAlphas[b]);
      ctx.stroke();
    }

    // --- Draw nodes with glow ---
    for (var i = 0; i < hlNodes.length; i++) {
      var n = hlNodes[i];
      var sizeBreath = n.baseSize + Math.sin(time * 0.002 + n.breathPhase) * 0.4;
      var nAlpha = (0.35 + Math.sin(time * 0.0025 + n.breathPhase) * 0.1) * alpha;

      // Glow halo
      var gR = sizeBreath * 4;
      var dotGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, gR);
      dotGrad.addColorStop(0, rgba(n.color, nAlpha * 0.5));
      dotGrad.addColorStop(0.5, rgba(n.color, nAlpha * 0.15));
      dotGrad.addColorStop(1, rgba(n.color, 0));
      ctx.fillStyle = dotGrad;
      ctx.fillRect(n.x - gR, n.y - gR, gR * 2, gR * 2);

      // Core
      ctx.beginPath();
      ctx.arc(n.x, n.y, sizeBreath, 0, Math.PI * 2);
      ctx.fillStyle = rgba(n.color, nAlpha);
      ctx.fill();
    }
  }

  // ========================================
  //  PUBLICATIONS: Ink Luminance
  // ========================================
  var pubTrail, pubRingX, pubRingY;

  function initPublications() {
    pubTrail = new RingBuffer(18);
    pubRingX = w / 2;
    pubRingY = h / 2;
  }

  function drawPublications() {
    var lerpF = 0.10;
    orbX = lerp(orbX, mouseX, lerpF);
    orbY = lerp(orbY, mouseY, lerpF);

    var alpha = fadeAlpha;
    if (alpha <= 0.001) return;

    // Push smoothed position every 2 frames
    if (time % 2 === 0) {
      pubTrail.push({ x: orbX, y: orbY });
    }

    // --- Ink diffusion trail ---
    pubTrail.forEach(function (pos, i, total) {
      var t = i / total;  // 0 = oldest, 1 = newest
      var trailAlpha = lerp(0.008, 0.05, t) * alpha;
      var trailRadius = lerp(10, 28, t);
      var col = t > 0.5 ? C.teal : C.deepRose;
      var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, trailRadius);
      grad.addColorStop(0, rgba(col, trailAlpha));
      grad.addColorStop(0.6, rgba(col, trailAlpha * 0.3));
      grad.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(pos.x - trailRadius, pos.y - trailRadius, trailRadius * 2, trailRadius * 2);
    });

    // --- Main cursor halo ---
    var haloR = 55;
    var haloGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, haloR);
    haloGrad.addColorStop(0, rgba(C.teal, 0.08 * alpha));
    haloGrad.addColorStop(0.5, rgba(C.teal, 0.03 * alpha));
    haloGrad.addColorStop(1, rgba(C.teal, 0));
    ctx.fillStyle = haloGrad;
    ctx.fillRect(orbX - haloR, orbY - haloR, haloR * 2, haloR * 2);

    // --- Focus ring ---
    var ringR = 28 + Math.sin(time * 0.003) * 3;
    ctx.beginPath();
    ctx.arc(orbX, orbY, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(C.deepRose, 0.07 * alpha);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // ========================================
  //  REDUCED MOTION: Static halo only
  // ========================================
  function drawReduced() {
    orbX = lerp(orbX, mouseX, 0.12);
    orbY = lerp(orbY, mouseY, 0.12);
    var alpha = fadeAlpha;
    if (alpha <= 0.001) return;
    var r = 80;
    var grad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, r);
    grad.addColorStop(0, rgba(C.peach, 0.08 * alpha));
    grad.addColorStop(1, rgba(C.peach, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(orbX - r, orbY - r, r * 2, r * 2);
  }

  // -------- Init --------
  var drawFn;
  if (prefersReduced) {
    drawFn = drawReduced;
  } else {
    switch (page) {
      case 'home':
        initHome();
        drawFn = drawHome;
        break;
      case 'highlights':
        initHighlights();
        drawFn = drawHighlights;
        break;
      case 'publications':
        initPublications();
        drawFn = drawPublications;
        break;
      default:
        initHome();
        drawFn = drawHome;
    }
  }

  // -------- Main loop --------
  function mainLoop() {
    if (!animating) return;

    time++;
    syncMouse();
    ctx.clearRect(0, 0, w, h);

    if (hasMoved || fadeAlpha > 0.001) {
      drawFn();
    }

    requestAnimationFrame(mainLoop);
  }

  requestAnimationFrame(mainLoop);
})();
