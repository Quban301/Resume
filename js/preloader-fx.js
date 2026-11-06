/* Boot-screen animation for the preloader: ribbons of green light swirl out of the dark around a blob of living goo.
   When the site is ready, the streaks and the goo explode outward and the page appears behind them.
   Pure canvas (metaballs rendered on a small grid and scaled up), no assets. */
(() => {
  const el = document.getElementById("preloader"), cv = el && el.querySelector(".preloader__fx");
  if (!cv) return;
  const g = cv.getContext("2d"), reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BG = "#020604", COLORS = ["181,255,92", "61,220,132", "45,212,191", "140,255,122"], BOOM = 850;
  let W = 0, H = 0, cx = 0, cy = 0, M = 0;

  const size = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight; cx = W / 2; cy = H / 2; M = Math.min(W, H);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size(); addEventListener("resize", size);

  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- ribbons: tilted ellipses with a bright head and a fading tail ---------- */
  const COUNT = 11, TAIL = 1.7, SEGS = 38;
  const ribbons = Array.from({ length: COUNT }, (_, i) => ({
    tilt: (i * Math.PI) / COUNT + i * 0.05,
    squash: 0.2 + 0.72 * (((i * 5) % COUNT) / COUNT),
    speed: (i % 2 ? 1 : -1) * (0.55 + 0.09 * ((i * 7) % 6)),
    phase: i * 0.93,
    width: 1.3 + (i % 3) * 0.55,
    color: COLORS[i % COLORS.length]
  }));

  /* ---------- goo: metaballs. Each blob drifts on its own looping path; the field is drawn on a coarse grid. ---------- */
  const GN = 150, off = document.createElement("canvas");
  off.width = off.height = GN;
  const octx = off.getContext("2d"), img = octx.createImageData(GN, GN), px = img.data;
  const blobs = Array.from({ length: 9 }, (_, i) => ({
    r: 0.03 + ((i * 7) % 5) * 0.009,                  // radius, as a fraction of the goo square
    ax: 0.07 + ((i * 3) % 4) * 0.04, ay: 0.06 + ((i * 5) % 4) * 0.035,
    wx: 0.55 + ((i * 7) % 6) * 0.19, wy: 0.45 + ((i * 11) % 7) * 0.17,
    px: i * 1.7, py: i * 2.3,
    dir: (i / 9) * Math.PI * 2 + 0.4 * Math.sin(i * 5), kick: 0.7 + ((i * 13) % 5) * 0.16   // used by the explosion
  }));
  const drops = Array.from({ length: 70 }, (_, i) => ({ a: Math.random() * 6.283, v: 0.35 + Math.random() * 1.15, r: 1.2 + Math.random() * 3.2, c: COLORS[i % COLORS.length] }));

  function drawGoo(t, grow, boom) {
    const S = M * 0.86, k = boom * boom;
    const pos = blobs.map((b) => ({
      x: 0.5 + (Math.cos(b.wx * t + b.px) * b.ax) * grow + Math.cos(b.dir) * b.kick * k * 1.5,
      y: 0.5 + (Math.sin(b.wy * t + b.py) * b.ay) * grow + Math.sin(b.dir) * b.kick * k * 1.5,
      r2: Math.pow(b.r * (0.35 + 0.65 * grow) * (1 + 0.12 * Math.sin(t * 2.1 + b.px)) * (1 - 0.65 * boom), 2)
    }));
    for (let j = 0, o = 0; j < GN; j++) {
      const y = (j + 0.5) / GN;
      for (let i = 0; i < GN; i++, o += 4) {
        const x = (i + 0.5) / GN;
        let f = 0;
        for (let n = 0; n < pos.length; n++) { const dx = x - pos[n].x, dy = y - pos[n].y; f += pos[n].r2 / (dx * dx + dy * dy + 0.0004); }
        if (f < 0.4) { px[o + 3] = 0; continue; }
        const m = smooth(1, 4.5, f);                                       // 0 at the skin, 1 deep inside
        const rim = Math.max(0, 1 - Math.abs(f - 1.14) / 0.24);            // a glossy bright band just inside the edge
        const lit = Math.max(0, 1 - Math.hypot(x - 0.45, y - 0.43) / 0.45); // a soft light from the upper left
        px[o] = Math.min(255, 14 + m * 50 + rim * 80 + lit * 60);
        px[o + 1] = Math.min(255, 105 + m * 110 + rim * 120 + lit * 60);
        px[o + 2] = Math.min(255, 58 + m * 45 + rim * 35 + lit * 45);
        px[o + 3] = 255 * smooth(0.5, 1.0, f);
      }
    }
    octx.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(off, cx - S / 2, cy - S / 2, S, S);
  }

  function draw(t, boom) {
    const conv = ease(t / 2.6);                                    // 0 = ribbons wide, 1 = gathered round the goo
    const blast = ease(boom);                                      // 0 -> 1 across the explosion
    const R = M * (0.27 + 0.22 * (1 - conv)) * (1 + blast * 5.5) + Math.sin(t * 2.2) * M * 0.008 * conv;
    const power = (0.5 + 0.5 * conv) * (1 - 0.9 * blast);
    const grow = ease(t / 1.8);

    g.globalCompositeOperation = "source-over";
    g.fillStyle = BG; g.fillRect(0, 0, W, H);

    g.globalCompositeOperation = "lighter";
    const bloom = g.createRadialGradient(cx, cy, 0, cx, cy, M * (0.75 + blast * 0.6));
    bloom.addColorStop(0, `rgba(40,200,110,${(0.16 + 0.2 * conv) * (1 - blast * 0.6)})`); bloom.addColorStop(1, "rgba(40,200,110,0)");
    g.fillStyle = bloom; g.fillRect(0, 0, W, H);

    g.lineCap = "round";
    const spin = 1 + 0.8 * (1 - conv) + blast * 9;                  // streaks whip faster as they fly out
    for (const r of ribbons) {
      const head = r.phase + r.speed * t * spin, dir = r.speed > 0 ? 1 : -1;
      const cos = Math.cos(r.tilt), sin = Math.sin(r.tilt), tail = TAIL * (1 + blast * 1.5);
      let lx = 0, ly = 0;
      for (let k = 0; k <= SEGS; k++) {
        const u = head - dir * (k / SEGS) * tail, a = Math.cos(u), b = Math.sin(u) * r.squash;
        const x = cx + R * (a * cos - b * sin), y = cy + R * (a * sin + b * cos);
        if (k) {
          const f = 1 - k / SEGS, alpha = Math.pow(f, 1.7) * power;
          g.strokeStyle = `rgba(${r.color},${alpha * 0.22})`; g.lineWidth = r.width * 5 * f + 1; g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke();
          g.strokeStyle = `rgba(${r.color},${alpha})`; g.lineWidth = r.width * f + 0.4; g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke();
        }
        lx = x; ly = y;
      }
    }

    // the goo's halo, then the goo itself
    const O = M * 0.13 * (0.4 + 0.6 * grow) * (1 + Math.sin(t * 3) * 0.04) * (1 - 0.5 * blast);
    const halo = g.createRadialGradient(cx, cy, 0, cx, cy, O * 2.6);
    halo.addColorStop(0, `rgba(170,255,140,${(0.18 + 0.3 * grow) * (1 - blast)})`); halo.addColorStop(1, "rgba(30,170,90,0)");
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, O * 2.6, 0, 6.283); g.fill();

    g.globalCompositeOperation = "source-over";
    drawGoo(t, grow, blast);

    if (boom > 0) {
      g.globalCompositeOperation = "lighter";
      // droplets thrown out by the blast
      for (const d of drops) {
        const dist = M * d.v * 1.25 * blast, x = cx + Math.cos(d.a) * dist, y = cy + Math.sin(d.a) * dist, a = Math.pow(1 - blast, 1.2);
        const tx = cx + Math.cos(d.a) * dist * 0.72, ty = cy + Math.sin(d.a) * dist * 0.72;
        g.strokeStyle = `rgba(${d.c},${a * 0.5})`; g.lineWidth = d.r * 0.8; g.beginPath(); g.moveTo(tx, ty); g.lineTo(x, y); g.stroke();
        g.fillStyle = `rgba(${d.c},${a})`; g.beginPath(); g.arc(x, y, d.r * (1 - blast * 0.5), 0, 6.283); g.fill();
      }
      // shockwave ring and a hot flash at the centre
      const ring = M * (0.1 + 1.4 * blast), fa = Math.pow(1 - boom, 1.5);
      g.strokeStyle = `rgba(190,255,170,${fa * 0.8})`; g.lineWidth = 3 + 14 * (1 - blast); g.beginPath(); g.arc(cx, cy, ring, 0, 6.283); g.stroke();
      const fl = g.createRadialGradient(cx, cy, 0, cx, cy, M * (0.12 + 0.9 * blast));
      fl.addColorStop(0, `rgba(240,255,220,${fa})`); fl.addColorStop(0.5, `rgba(110,255,170,${fa * 0.55})`); fl.addColorStop(1, "rgba(60,220,130,0)");
      g.fillStyle = fl; g.fillRect(0, 0, W, H);
    }
  }

  if (reduce) { draw(3, 0); addEventListener("resize", () => draw(3, 0)); return; } // one still frame, no motion

  const t0 = performance.now(); let doneAt = 0;
  const frame = (now) => {
    if (!el.isConnected) return; // the preloader removes itself once it has faded
    if (!doneAt && el.classList.contains("done")) doneAt = now;
    draw((now - t0) / 1000, doneAt ? Math.min(1, (now - doneAt) / BOOM) : 0);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
