/* Easter eggs: secrets tracker, Konami CRT mode, leaf trail over the competency tree. */
(() => {
  const Site = window.Site, { say, reduced, cmds } = Site;
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);

  /* tiny localStorage wrapper (can throw in private windows)  */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("qm." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("qm." + k, JSON.stringify(v)); } catch {} }
  };
  Site.store = store;

  /* confetti (leaf shards) */
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

  /* secrets / achievements */
  const defs = {
    snake: ["Hungry for skills", "Ate 5 skills in terminal Snake"],
    sudoku: ["Number cruncher", "Solved a Sudoku in the terminal"],
    typist: ["Touch typist", "Shot down 20 words in Typefall"],
    patch: ["Patch Tuesday", "Patched 10 infected nodes in Network Defender"],
    retro: ["Old school", "Entered the Konami code"],
    signed: ["Pen pal", "Signed the guestbook"],
    sudo: ["Root access", "Ran sudo hire-me in the terminal"],
    silver: ["Long John Silver", "Made two safe clicks in Minesweeper"],
    clock: ["Temple Fugate Approval", "Flipped the nav clock to Roman numerals"]
  };
  const got = new Set(store.get("achv", []));
  const badge = $("#secrets"), count = $("#secretsCount"), esc = Site.esc, G = 100;
  const total = () => Object.keys(defs).length;
  const TROPHY = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M7 3h10v2h3v3a4 4 0 01-4 4h-.3A5 5 0 0113 14.9V17h3v2H8v-2h3v-2.1A5 5 0 018.3 12H8a4 4 0 01-4-4V5h3V3zM6 7v1a2 2 0 001 1.7V7H6zm12 0h-1v2.7A2 2 0 0018 8V7z"/></svg>';
  const renderBadge = () => { if (count) count.textContent = `${got.size}/${total()}`; badge?.classList.toggle("complete", got.size === total()); };

  /* Unlock sound: synthesised */
  let ac = null, muted = store.get("mute", false);
  const audio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; } catch { return null; } };
  const chime = () => {
    if (muted) return;
    const c = audio(); if (!c) return;
    const t0 = c.currentTime + 0.03, master = c.createGain(), echo = c.createDelay(), fb = c.createGain(), lp = c.createBiquadFilter();
    master.gain.value = 0.32; echo.delayTime.value = 0.21; fb.gain.value = 0.38; lp.type = "lowpass"; lp.frequency.value = 3800;
    master.connect(c.destination); master.connect(echo); echo.connect(lp); lp.connect(fb); fb.connect(echo); lp.connect(c.destination);
    const tone = (f, at, dur, vol, type = "sine") => {
      const o = c.createOscillator(), gn = c.createGain();
      o.type = type; o.frequency.value = f;
      gn.gain.setValueAtTime(0.0001, at); gn.gain.exponentialRampToValueAtTime(vol, at + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(gn); gn.connect(master); o.start(at); o.stop(at + dur + 0.05);
    };
    [659.25, 830.61, 987.77, 1318.51, 1661.22, 1975.53].forEach((f, i) => { tone(f, t0 + i * 0.075, 1, 0.5); tone(f * 2, t0 + i * 0.075, 0.5, 0.12, "triangle"); });
    [1318.51, 1661.22, 1975.53, 2637.02].forEach((f) => tone(f, t0 + 0.5, 1.8, 0.26));
    tone(329.63, t0, 1.6, 0.34, "triangle"); tone(493.88, t0 + 0.25, 1.6, 0.24, "triangle");
  };

  /* Unlock banner: a medal pops up, widens into the pill, then folds back, queued so none overlap. */
  const queue = []; let showing = false;
  const next = () => {
    if (showing || !queue.length) return;
    showing = true;
    const id = queue.shift(), el = document.createElement("div");
    el.className = "xb"; el.setAttribute("role", "status");
    el.innerHTML = `<div class="xb__pill"><span class="xb__medal">${TROPHY}</span><span class="xb__text"><small>Achievement unlocked</small><b>${esc(defs[id][0])}</b><em>${G}G</em></span></div>`;
    document.body.appendChild(el); chime();
    badge?.classList.add("ping"); setTimeout(() => badge?.classList.remove("ping"), 1800);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("pop")));
    setTimeout(() => el.classList.add("open"), 900);
    setTimeout(() => el.classList.remove("open"), 4300);
    setTimeout(() => el.classList.add("out"), 5000);
    setTimeout(() => { el.remove(); showing = false; next(); }, 5500);
  };

  /* Panel under the nav button. */
  const panel = document.createElement("div");
  panel.className = "achv-panel"; panel.id = "achvPanel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Achievements");
  document.body.appendChild(panel);
  let armed = false, armTimer = 0; // Reset progress needs a second click within 4 seconds
  const renderPanel = () => {
    panel.innerHTML = `<div class="achv-head"><b>Achievements</b><span>${got.size * G}G / ${total() * G}G</span><button type="button" class="achv-mute" aria-pressed="${muted}">${muted ? "Sound off" : "Sound on"}</button></div><ul>${Object.entries(defs).map(([id, [n, d]]) => {
      const on = got.has(id);
      return `<li class="${on ? "on" : ""}"><span class="achv-medal">${on ? TROPHY : "?"}</span><span class="achv-txt"><b>${on ? esc(n) : "Secret achievement"}</b><small>${on ? esc(d) : "Keep exploring: the terminal, the games, an old cheat code..."}</small></span><em>${G}G</em></li>`;
    }).join("")}</ul><div class="achv-foot"><button type="button" class="achv-reset${armed ? " armed" : ""}"${got.size ? "" : " disabled"}>${armed ? "Click again to confirm" : "Reset progress"}</button></div>`;
  };
  const setOpen = (open) => {
    if (open) renderPanel(); else { armed = false; clearTimeout(armTimer); }
    panel.hidden = !open; badge?.setAttribute("aria-expanded", String(open));
  };
  badge?.addEventListener("click", (e) => { e.stopPropagation(); setOpen(panel.hidden); });
  panel.addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target.closest(".achv-reset")) {
      if (!armed) {
        armed = true; renderPanel(); clearTimeout(armTimer);
        armTimer = setTimeout(() => { armed = false; if (!panel.hidden) renderPanel(); }, 4000);
        return;
      }
      armed = false; clearTimeout(armTimer); got.clear(); queue.length = 0; store.set("achv", []);
      renderBadge(); renderPanel(); say("Achievements reset. Time to hunt again.");
      return;
    }
    if (e.target.closest(".achv-mute")) { muted = !muted; store.set("mute", muted); renderPanel(); if (!muted) chime(); }
  });
  document.addEventListener("click", () => { if (!panel.hidden) setOpen(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) setOpen(false); });

  Site.achv = {
    defs,
    has: (id) => got.has(id),
    open: () => setOpen(true),
    unlock(id) {
      if (!defs[id] || got.has(id)) return;
      got.add(id); store.set("achv", [...got]); renderBadge();
      if (!panel.hidden) renderPanel();
      queue.push(id); next();
    },
    lines() { return Object.entries(defs).map(([id, [n, d]]) => (got.has(id) ? `[x] ${n} - ${d}` : "[ ] ??? - keep exploring")); }
  };
  renderBadge();

  /*  Konami -> CRT mode */
  const toggleCRT = (on, quiet) => {
    on = on === undefined ? !root.classList.contains("crt") : on;
    root.classList.toggle("crt", on);
    Site.refreshColors();
    if (!quiet) say(on ? "↑↑↓↓←→←→BA - CRT mode on. Enter the code again to exit." : "CRT mode off");
  };
  Site.toggleCRT = toggleCRT;
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let ki = 0;
  addEventListener("keydown", (e) => {
    if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === code[ki]) {
      if (++ki === code.length) { ki = 0; toggleCRT(undefined, !Site.achv.has("retro")); Site.achv.unlock("retro"); } // first time: the achievement banner is the only popup
    } else ki = k === code[0] ? 1 : 0;
  });

  /*  leaf trail: only while the pointer is over the competency tree  */
  const tc = document.createElement("canvas");
  tc.id = "trail"; tc.setAttribute("aria-hidden", "true");
  document.body.appendChild(tc);
  const tg = tc.getContext("2d");
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); tc.width = innerWidth * d; tc.height = innerHeight * d; tg.setTransform(d, 0, 0, d, 0, 0); };
  fit(); addEventListener("resize", fit);
  const tree = document.getElementById("competencyTree");
  let leaves = [], last = { x: -99, y: -99 }, tcols = null, trafId = 0;
  new MutationObserver(() => { tcols = null; }).observe(root, { attributes: true });
  const colors = () => tcols || (tcols = ["--accent", "--accent-2", "--accent-3"].map((v) => getComputedStyle(root).getPropertyValue(v).trim() || "#2f8f4e"));
  addEventListener("pointermove", (e) => {
    if (reduced || e.pointerType === "touch" || !tree) return;
    const r = tree.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
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

  /*  palette commands  */
  cmds.push(
    { n: "Toggle CRT mode", k: "fun", run: () => { toggleCRT(); } },
    { n: "Show achievements", k: "fun", run: () => setTimeout(() => Site.achv.open(), 60) }
  );
})();
