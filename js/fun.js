/* Easter eggs: secrets tracker, Konami CRT mode, leaf cursor trail. */
(() => {
  const Site = window.Site, { say, reduced, cmds } = Site;
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);

  /* ---------- tiny localStorage wrapper (can throw in private windows) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("qm." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("qm." + k, JSON.stringify(v)); } catch {} }
  };
  Site.store = store;

  /* ---------- confetti (leaf shards; reuses the theme burst look) ---------- */
  Site.confetti = (x = innerWidth / 2, y = innerHeight / 2, n = 44) => {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.setProperty("--x", x + "px"); el.style.setProperty("--y", y + "px");
    const reach = Math.max(innerWidth, innerHeight) * 0.5;
    el.innerHTML = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 6.283 + Math.random() * 0.4, d = 120 + Math.random() * reach;
      return `<b style="--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--r:${Math.random() * 720 - 360}deg;--s:${0.6 + Math.random() * 1.4};--dl:${Math.random() * 0.12}s"></b>`;
    }).join("");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  };

  /* ---------- secrets / achievements ---------- */
  const defs = {
    snake: ["Hungry for skills", "Ate 5 skills in terminal Snake"],
    patch: ["Patch Tuesday", "Patched 10 infected nodes in Network Defender"],
    retro: ["Old school", "Entered the Konami code"],
    signed: ["Pen pal", "Signed the guestbook"],
    sudo: ["Root access", "Ran sudo hire-me in the terminal"]
  };
  const got = new Set(store.get("achv", []));
  const badge = $("#secrets");
  const renderBadge = () => { if (badge) badge.textContent = `🏆 ${got.size}/${Object.keys(defs).length} secrets`; };
  Site.achv = {
    defs,
    has: (id) => got.has(id),
    unlock(id) {
      if (!defs[id] || got.has(id)) return;
      got.add(id); store.set("achv", [...got]); renderBadge();
      say(`🏆 Secret found: ${defs[id][0]}`);
    },
    lines() { return Object.entries(defs).map(([id, [n, d]]) => (got.has(id) ? `[x] ${n} - ${d}` : "[ ] ??? - keep exploring")); }
  };
  renderBadge();
  badge?.addEventListener("click", () => { Site.terminal ? Site.terminal.run("achievements", true) : say(`${got.size}/${Object.keys(defs).length} secrets found`); });

  /* ---------- Konami -> CRT mode ---------- */
  const toggleCRT = (on) => {
    on = on === undefined ? !root.classList.contains("crt") : on;
    root.classList.toggle("crt", on);
    Site.refreshColors();
    say(on ? "↑↑↓↓←→←→BA - CRT mode on. Enter the code again to exit." : "CRT mode off");
  };
  Site.toggleCRT = toggleCRT;
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let ki = 0;
  addEventListener("keydown", (e) => {
    if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === code[ki]) {
      if (++ki === code.length) { ki = 0; toggleCRT(); Site.achv.unlock("retro"); }
    } else ki = k === code[0] ? 1 : 0;
  });

  /* ---------- leaf cursor trail ---------- */
  const tc = document.createElement("canvas");
  tc.id = "trail"; tc.setAttribute("aria-hidden", "true");
  document.body.appendChild(tc);
  const tg = tc.getContext("2d");
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); tc.width = innerWidth * d; tc.height = innerHeight * d; tg.setTransform(d, 0, 0, d, 0, 0); };
  fit(); addEventListener("resize", fit);
  let trailOn = store.get("trail", matchMedia("(hover: hover)").matches && !reduced);
  let leaves = [], last = { x: -99, y: -99 }, tcols = null, trafId = 0;
  const trailBtn = $("#trailBtn");
  const syncTrail = () => trailBtn?.setAttribute("aria-pressed", String(trailOn));
  const setTrail = (on) => { trailOn = on; store.set("trail", on); syncTrail(); say(on ? "🍃 Leaf trail on" : "Leaf trail off"); };
  syncTrail();
  trailBtn?.addEventListener("click", () => setTrail(!trailOn));
  new MutationObserver(() => { tcols = null; }).observe(root, { attributes: true });
  const colors = () => tcols || (tcols = ["--accent", "--accent-2", "--accent-3"].map((v) => getComputedStyle(root).getPropertyValue(v).trim() || "#2f8f4e"));
  addEventListener("pointermove", (e) => {
    if (!trailOn || e.pointerType === "touch") return;
    if (Math.hypot(e.clientX - last.x, e.clientY - last.y) < 20) return;
    last = { x: e.clientX, y: e.clientY };
    const c = colors();
    leaves.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 0.8, vy: 0.3 + Math.random() * 0.5, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.12, s: 5 + Math.random() * 6, life: 1, col: c[Math.floor(Math.random() * c.length)] });
    if (leaves.length > 60) leaves.shift();
    if (!trafId) trafId = requestAnimationFrame(trailFrame);
  }, { passive: true });
  function trailFrame() {
    tg.clearRect(0, 0, innerWidth, innerHeight);
    leaves = leaves.filter((l) => l.life > 0);
    for (const l of leaves) {
      l.x += l.vx + Math.sin(l.r * 2) * 0.3; l.y += l.vy; l.r += l.vr; l.life -= 0.018;
      tg.save(); tg.translate(l.x, l.y); tg.rotate(l.r); tg.globalAlpha = Math.max(0, l.life) * 0.85; tg.fillStyle = l.col; tg.strokeStyle = l.col;
      tg.beginPath(); tg.moveTo(0, -l.s); tg.quadraticCurveTo(l.s * 0.95, -l.s * 0.1, 0, l.s); tg.quadraticCurveTo(-l.s * 0.95, -l.s * 0.1, 0, -l.s); tg.fill();
      tg.lineWidth = 1; tg.beginPath(); tg.moveTo(0, l.s); tg.lineTo(0, l.s + 4); tg.stroke();
      tg.restore();
    }
    trafId = leaves.length ? requestAnimationFrame(trailFrame) : 0;
  }

  /* ---------- palette commands ---------- */
  cmds.push(
    { n: "Toggle leaf cursor trail", k: "fun", run: () => setTrail(!trailOn) },
    { n: "Toggle CRT mode", k: "fun", run: () => { toggleCRT(); } },
    { n: "Show secrets found", k: "fun", run: () => Site.terminal ? Site.terminal.run("achievements", true) : say(`${got.size}/${Object.keys(defs).length} secrets found`) }
  );
})();
