/* Two more terminal games that take over the window like Snake: Sudoku and Typefall (type the falling words). */
(() => {
  const Site = window.Site, T = Site.terminal, cv = document.getElementById("arena");
  if (!T || !cv) return;
  const { root, body, input, print } = T;
  const g = cv.getContext("2d");
  const hint = root.querySelector(".term-bar em"), hintText = hint ? hint.textContent : "";
  const MONO = "'JetBrains Mono', monospace";
  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pad2 = (n) => String(n).padStart(2, "0");
  const clock = (s) => `${pad2(Math.floor(s / 60))}:${pad2(Math.floor(s % 60))}`;
  const C = { bg: "#06130b", panel: "#0b1a12", ink: "#e4efe6", dim: "#8fa595", green: "#3ddc84", lime: "#b5e655", gold: "#e8c97a", red: "#ff6b6b" };

  let W = 0, H = 0, game = null, raf = 0;
  const fit = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = body.clientWidth; H = body.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const text = (s, x, y, size = 12, color = C.ink, align = "left", weight = 600) => {
    g.font = `${weight} ${size}px ${MONO}`; g.textAlign = align; g.fillStyle = color; g.fillText(s, x, y);
  };
  const veil = (title, sub, sub2) => {
    g.fillStyle = "rgba(3,10,6,.74)"; g.fillRect(0, 0, W, H);
    text(title, W / 2, H / 2 - 8, 18, C.ink, "center", 700);
    text(sub, W / 2, H / 2 + 16, 12, C.dim, "center", 500);
    if (sub2) text(sub2, W / 2, H / 2 + 34, 12, C.dim, "center", 500);
  };

  /* A hidden input so touch screens can raise their keyboard for Typefall. */
  const kb = document.createElement("input");
  kb.setAttribute("autocomplete", "off"); kb.setAttribute("autocapitalize", "off"); kb.setAttribute("autocorrect", "off");
  kb.setAttribute("aria-hidden", "true"); kb.tabIndex = -1; kb.spellcheck = false;
  kb.style.cssText = "position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;border:0;padding:0";
  root.appendChild(kb);
  kb.addEventListener("input", () => { const v = kb.value; kb.value = ""; if (game) [...v].forEach((ch) => game.key({ key: ch, preventDefault() {} })); });

  function onKey(e) {
    if (!game || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if ((/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable) && t !== kb) return; // never steal typing
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (game.key(e)) e.preventDefault();
  }
  const frame = (t) => { raf = requestAnimationFrame(frame); if (game && game.frame) game.frame(t); };

  function open(next, stack) {
    if (T.busy) { print('<span class="o">Finish (or Esc out of) the current game first.</span>'); return false; }
    root.classList.add("playing"); root.classList.toggle("stack", !!stack);
    cv.hidden = false; input.blur(); fit();
    if (hint) hint.textContent = "Esc to exit";
    game = next; addEventListener("keydown", onKey, true);
    root.scrollIntoView({ block: "center", behavior: Site.reduced ? "auto" : "smooth" });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    game.start(); return true;
  }
  function close() {
    if (!game) return;
    const msg = game.stop ? game.stop() : "";
    game = null; cancelAnimationFrame(raf); kb.blur();
    cv.hidden = true; root.classList.remove("playing", "stack");
    if (hint) hint.textContent = hintText;
    removeEventListener("keydown", onKey, true);
    if (msg) print(`<span class="o">${msg}</span>`);
    input.focus({ preventScroll: true });
  }

  const point = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)]; };
  let down = null, hold = 0;
  cv.addEventListener("pointerdown", (e) => {
    if (!game || e.button !== 0) return;
    const [x, y] = point(e);
    if (game.wantsKeyboard && window.matchMedia("(pointer: coarse)").matches) kb.focus({ preventScroll: true });
    if (game.context) { // a tap reveals on release; holding (touch) flags instead
      down = { x, y }; clearTimeout(hold);
      hold = setTimeout(() => { if (down) { game.context(x, y); down = null; } }, 450);
      return;
    }
    if (game.click) game.click(x, y);
  });
  cv.addEventListener("pointerup", () => { clearTimeout(hold); if (game && game.context && down) { const d = down; down = null; game.click(d.x, d.y); } });
  cv.addEventListener("pointercancel", () => { clearTimeout(hold); down = null; });
  cv.addEventListener("contextmenu", (e) => { if (game && game.context) { e.preventDefault(); clearTimeout(hold); down = null; game.context(...point(e)); } });
  // Scrolled away: pause and give the keyboard back so typing works everywhere else.
  new IntersectionObserver(([e]) => {
    if (!game) return;
    if (e.isIntersecting) addEventListener("keydown", onKey, true);
    else { game.pause && game.pause(); removeEventListener("keydown", onKey, true); }
  }).observe(cv);
  addEventListener("resize", () => { if (game) { fit(); game.resize && game.resize(); } });

  /* ====================================================================
     SUDOKU
     ==================================================================== */
  const peers = (i) => {
    const r = Math.floor(i / 9), c = i % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    return (j) => { const rr = Math.floor(j / 9), cc = j % 9; return j !== i && (rr === r || cc === c || Math.floor(rr / 3) * 3 + Math.floor(cc / 3) === b); };
  };
  const bits = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };

  // Counts solutions (stopping at `limit`) and keeps the first one; `mix` randomises the order for generating boards.
  function search(start, limit, mix) {
    const cells = Int8Array.from(start), rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
    const bx = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
    for (let i = 0; i < 81; i++) if (cells[i]) { const b = 1 << cells[i]; rows[Math.floor(i / 9)] |= b; cols[i % 9] |= b; boxes[bx(i)] |= b; }
    let n = 0, sol = null;
    const rec = () => {
      let best = -1, bestMask = 0, bestCnt = 10;
      for (let i = 0; i < 81; i++) {
        if (cells[i]) continue;
        const m = ~(rows[Math.floor(i / 9)] | cols[i % 9] | boxes[bx(i)]) & 0x3fe, k = bits(m);
        if (k < bestCnt) { best = i; bestMask = m; bestCnt = k; if (k === 0) return; }
      }
      if (best < 0) { n++; if (!sol) sol = cells.slice(); return; }
      const r = Math.floor(best / 9), c = best % 9, b = bx(best), vals = [];
      for (let v = 1; v <= 9; v++) if (bestMask & (1 << v)) vals.push(v);
      if (mix) shuffle(vals);
      for (const v of vals) {
        const bit = 1 << v; cells[best] = v; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        rec();
        cells[best] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
        if (n >= limit) return;
      }
    };
    rec();
    return { n, sol };
  }
  const LEVELS = { easy: 40, medium: 33, hard: 28 };
  function makePuzzle(level) {
    const sol = search(new Int8Array(81), 1, true).sol, puz = sol.slice(), keep = LEVELS[level];
    let clues = 81;
    for (const i of shuffle([...Array(81).keys()])) {
      if (clues <= keep) break;
      const v = puz[i]; puz[i] = 0;
      if (search(puz, 2, false).n !== 1) puz[i] = v; else clues--;
    }
    return { puz, sol };
  }

  const Sudoku = (level) => {
    let puz, sol, cells, notes, given, sel = 40, noteMode = false, mistakes = 0, hints = 0, won = false;
    let t0 = 0, acc = 0, running = false, lastShown = -1, dirty = true, hits = [], msg = "", msgT = 0, L = null;

    const elapsed = () => acc + (running ? (performance.now() - t0) / 1000 : 0);
    const resume = () => { if (!running && !won) { running = true; t0 = performance.now(); } };
    const halt = () => { if (running) { acc += (performance.now() - t0) / 1000; running = false; } };
    const note = (s) => { msg = s; msgT = performance.now(); dirty = true; };
    const fresh = () => {
      ({ puz, sol } = makePuzzle(level));
      cells = Int8Array.from(puz); notes = new Uint16Array(81); given = puz.map((v) => v !== 0);
      sel = cells.findIndex((v) => !v); if (sel < 0) sel = 40;
      mistakes = hints = 0; won = false; acc = 0; running = false; lastShown = -1; dirty = true; resume();
    };

    const layout = () => {
      const stack = root.classList.contains("stack"), hs = [];
      if (stack) {
        const cell = Math.max(20, Math.floor(Math.min((W - 16) / 9, (H - 115) / 9))), size = cell * 9, gx = Math.round((W - size) / 2), gy = 8;
        const by = gy + size + 12, bw = Math.floor((W - 16 - 8 * 4) / 9);
        return { stack, cell, size, gx, gy, by, bw, ax: 8, ay: by + bw + 10 };
      }
      const ph = Math.min(H - 24, 9 * Math.floor((H - 24) / 9)), cell = Math.floor(ph / 9), size = cell * 9, pw = 164, gap = 26;
      const ox = Math.max(8, Math.round((W - (size + gap + pw)) / 2)), gy = Math.round((H - size) / 2);
      return { stack, cell, size, gx: ox, gy, px: ox + size + gap, pw };
    };

    function cellColor(i) {
      if (i === sel) return "rgba(61,220,132,.32)";
      const p = peers(sel);
      if (cells[sel] && cells[i] === cells[sel]) return "rgba(232,201,122,.24)";
      return p(i) ? "rgba(61,220,132,.09)" : null;
    }
    function draw() {
      L = layout(); hits = [];
      const { cell, size, gx, gy } = L;
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      g.fillStyle = C.panel; g.fillRect(gx, gy, size, size);
      for (let i = 0; i < 81; i++) {
        const x = gx + (i % 9) * cell, y = gy + Math.floor(i / 9) * cell, col = cellColor(i);
        if (col) { g.fillStyle = col; g.fillRect(x, y, cell, cell); }
        hits.push({ x, y, w: cell, h: cell, act: () => { sel = i; dirty = true; } });
        const v = cells[i];
        if (v) {
          const bad = !given[i] && v !== sol[i];
          text(String(v), x + cell / 2, y + cell / 2 + cell * 0.17, Math.round(cell * 0.5), given[i] ? C.ink : bad ? C.red : C.lime, "center", given[i] ? 700 : 600);
        } else if (notes[i]) {
          const s = cell / 3;
          for (let d = 1; d <= 9; d++) if (notes[i] & (1 << d)) text(String(d), x + ((d - 1) % 3) * s + s / 2, y + Math.floor((d - 1) / 3) * s + s * 0.78, Math.max(8, Math.round(cell * 0.24)), C.dim, "center", 500);
        }
      }
      for (let k = 0; k <= 9; k++) {
        g.strokeStyle = k % 3 === 0 ? "rgba(61,220,132,.75)" : "rgba(61,220,132,.2)"; g.lineWidth = k % 3 === 0 ? 2 : 1;
        g.beginPath(); g.moveTo(gx + k * cell, gy); g.lineTo(gx + k * cell, gy + size); g.moveTo(gx, gy + k * cell); g.lineTo(gx + size, gy + k * cell); g.stroke();
      }
      const left = (d) => 9 - cells.reduce((n, v, i) => n + (v === d && v === sol[i] ? 1 : 0), 0);
      const button = (x, y, w, h, label, act, on) => {
        g.fillStyle = on ? "rgba(61,220,132,.28)" : "rgba(255,255,255,.06)"; g.beginPath(); g.roundRect(x, y, w, h, 7); g.fill();
        g.strokeStyle = on ? C.green : "rgba(61,220,132,.28)"; g.lineWidth = 1; g.stroke();
        text(label, x + w / 2, y + h / 2 + 4, Math.min(13, Math.round(h * 0.42)), C.ink, "center", 600);
        hits.push({ x, y, w, h, act });
      };
      const pad = (d, x, y, w, h) => {
        const n = left(d);
        g.globalAlpha = n ? 1 : 0.3; button(x, y, w, h, String(d), () => place(d), false);
        g.globalAlpha = 1; if (n && !L.stack) text(String(n), x + w - 5, y + 11, 9, C.dim, "right", 500);
      };
      const stats = `${clock(elapsed())}  ✕${mistakes}  ?${hints}`;
      if (!L.stack) {
        const { px, pw } = L, pb = Math.max(30, Math.min(46, Math.floor((size - 168 - 16) / 3))), bw = Math.floor((pw - 16) / 3);
        let y = gy;
        text(`SUDOKU · ${level}`, px, y + 12, 13, C.green, "left", 700); y += 24;
        text(stats, px, y + 10, 13, C.ink, "left", 600); y += 22;
        for (let d = 1; d <= 9; d++) pad(d, px + ((d - 1) % 3) * (bw + 8), y + Math.floor((d - 1) / 3) * (pb + 8), bw, pb);
        y += 3 * pb + 24 + 0;
        const hw = Math.floor((pw - 8) / 2);
        button(px, y, hw, 28, noteMode ? "Notes: on" : "Notes", () => { noteMode = !noteMode; dirty = true; }, noteMode);
        button(px + hw + 8, y, hw, 28, "Hint", hint1, false); y += 34;
        button(px, y, hw, 28, "Erase", () => place(0), false);
        button(px + hw + 8, y, hw, 28, "New", fresh, false); y += 40;
        text("N notes · H hint · X new", px, y, 10, C.dim, "left", 500);
        text("arrows move · Esc exits", px, y + 14, 10, C.dim, "left", 500);
      } else {
        const { bw, by, ax, ay } = L;
        for (let d = 1; d <= 9; d++) pad(d, ax + (d - 1) * (bw + 4), by, bw, bw);
        const aw = Math.floor((W - 16 - 3 * 6) / 4);
        button(ax, ay, aw, 28, noteMode ? "Notes✓" : "Notes", () => { noteMode = !noteMode; dirty = true; }, noteMode);
        button(ax + (aw + 6), ay, aw, 28, "Hint", hint1, false);
        button(ax + 2 * (aw + 6), ay, aw, 28, "Erase", () => place(0), false);
        button(ax + 3 * (aw + 6), ay, aw, 28, "New", fresh, false);
        text(`SUDOKU · ${level}   ${stats}`, W / 2, ay + 46, 12, C.ink, "center", 600);
      }
      if (msg && performance.now() - msgT < 1800) text(msg, L.stack ? W / 2 : L.px, L.stack ? L.ay + 64 : L.gy + size - 4, 11, C.gold, L.stack ? "center" : "left", 600);
      if (won) {
        veil("Solved!", `${clock(elapsed())} · ${mistakes} mistake${mistakes === 1 ? "" : "s"} · ${hints} hint${hints === 1 ? "" : "s"}`, "Enter for a new puzzle · Esc to exit");
        hits = [{ x: 0, y: 0, w: W, h: H, act: fresh }];
      }
      lastShown = Math.floor(elapsed()); dirty = false;
    }

    function place(d) {
      if (won || given[sel]) { if (given[sel]) note("that one is given"); return; }
      if (d === 0) { cells[sel] = 0; notes[sel] = 0; dirty = true; return; }
      if (noteMode) { if (!cells[sel]) notes[sel] ^= 1 << d; dirty = true; return; }
      cells[sel] = d; notes[sel] = 0;
      if (d !== sol[sel]) { mistakes++; note("not quite"); }
      else {
        const near = peers(sel);
        for (let j = 0; j < 81; j++) if (near(j)) notes[j] &= ~(1 << d);
      }
      check(); dirty = true;
    }
    function hint1() {
      if (won) return;
      let i = (!given[sel] && cells[sel] !== sol[sel]) ? sel : -1;
      if (i < 0) { const open = [...Array(81).keys()].filter((k) => cells[k] !== sol[k]); if (!open.length) return; i = open[rand(open.length)]; }
      sel = i; cells[i] = sol[i]; notes[i] = 0; hints++; note("revealed one"); check(); dirty = true;
    }
    function check() {
      if (won || !cells.every((v, i) => v === sol[i])) return;
      won = true; halt();
      const r = cv.getBoundingClientRect();
      Site.confetti && Site.confetti(r.left + r.width / 2, r.top + r.height / 2, 60);
      Site.achv.unlock("sudoku");
      const best = Site.store.get("sudoku_" + level, 0), t = Math.round(elapsed());
      if (!best || t < best) Site.store.set("sudoku_" + level, t);
    }
    const move = (dr, dc) => { const r = Math.min(8, Math.max(0, Math.floor(sel / 9) + dr)), c = Math.min(8, Math.max(0, (sel % 9) + dc)); sel = r * 9 + c; dirty = true; };
    const arrows = { ArrowUp: [-1, 0], w: [-1, 0], ArrowDown: [1, 0], s: [1, 0], ArrowLeft: [0, -1], a: [0, -1], ArrowRight: [0, 1], d: [0, 1] };

    return {
      name: "sudoku",
      start() { fresh(); },
      key(e) {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (!running && !won) resume();
        if (won) { if (k === "Enter") { fresh(); return true; } return false; }
        if (arrows[k]) move(...arrows[k]);
        else if (/^[1-9]$/.test(k)) place(+k);
        else if (k === "0" || k === "Backspace" || k === "Delete") place(0);
        else if (k === "n" || k === " ") { noteMode = !noteMode; dirty = true; }
        else if (k === "h") hint1();
        else if (k === "x") fresh();
        else return false;
        return true;
      },
      click(x, y) {
        resume();
        for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) { h.act(); dirty = true; return; } }
      },
      frame() { if (dirty || (running && Math.floor(elapsed()) !== lastShown)) draw(); },
      pause() { halt(); dirty = true; },
      resize() { dirty = true; },
      stop() { halt(); return won ? `Sudoku solved in ${clock(elapsed())}.` : "Sudoku closed."; }
    };
  };

  /* ====================================================================
     TYPEFALL: words fall, type them before they land
     ==================================================================== */
  const extras = ["commit", "merge", "deploy", "docker", "kernel", "socket", "branch", "lambda", "cache", "query", "token", "regex", "async", "stack", "queue", "patch", "debug", "build", "schema", "router", "binary", "syntax", "thread", "server", "client", "cookie", "script", "module", "linter", "proxy", "cipher", "daemon", "bytes", "scope", "yield"];
  const bank = [...new Set([...T.skills.map((s) => s.toLowerCase()).filter((s) => /^[a-z]{3,10}$/.test(s)), ...extras])];

  const Typefall = () => {
    let words, target, particles, lasers, stars, score, lives, level, kills, combo, hits, misses, state, best = Site.store.get("typefall", 0);
    let spawnIn, last = 0, flash = 0, banner = "", bannerT = 0;
    const FONT = 19;

    const reset = () => {
      words = []; target = null; particles = []; lasers = []; score = 0; lives = 5; level = 1; kills = 0; combo = 0; hits = 0; misses = 0;
      spawnIn = 0.4; state = "ready"; flash = 0; last = 0;
      stars = Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() }));
    };
    const speedBase = () => H * (0.085 + level * 0.014);
    const spawn = () => {
      let w = "";
      for (let tries = 0; tries < 30; tries++) { w = bank[rand(bank.length)]; if (!words.some((o) => o.text[0] === w[0] || o.text === w)) break; }
      g.font = `700 ${FONT}px ${MONO}`;
      const wd = g.measureText(w).width, x = 14 + wd / 2 + Math.random() * Math.max(1, W - 28 - wd);
      words.push({ text: w, typed: 0, x, y: -10, w: wd, v: speedBase() * (0.85 + Math.random() * 0.4) });
    };
    const burst = (x, y, color, n) => {
      if (Site.reduced) n = Math.ceil(n / 3);
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = 40 + Math.random() * 150; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, color }); }
    };
    const finish = () => {
      state = "over";
      if (score > best) { best = score; Site.store.set("typefall", best); }
    };
    const kill = (w) => {
      score += w.text.length * 10 + combo * 2; kills++; words.splice(words.indexOf(w), 1); target = null;
      burst(w.x, w.y, C.green, 16); burst(w.x, w.y, C.gold, 6);
      if (kills === 20) Site.achv.unlock("typist");
      if (kills % 8 === 0) { level++; banner = `LEVEL ${level}`; bannerT = performance.now(); }
    };
    const key = (e) => {
      const k = e.key;
      if (state === "over") { if (k === "Enter") { reset(); state = "run"; return true; } return false; }
      if (state === "paused") { state = "run"; last = 0; return true; }
      if (state === "ready") { state = "run"; last = 0; return true; }
      if (k === "Backspace" || k === "Tab") { if (target) { target.typed = 0; target = null; } return true; } // let go of a lock
      if (!/^[a-z]$/i.test(k)) return false;
      const ch = k.toLowerCase();
      if (!target) {
        const pick = words.filter((w) => w.text[0] === ch).sort((a, b) => b.y - a.y)[0];
        if (pick) target = pick;
      }
      if (target && target.text[target.typed] === ch) {
        target.typed++; hits++; combo++;
        lasers.push({ x: target.x, y: target.y, t: 0.09 });
        if (target.typed === target.text.length) kill(target);
      } else { misses++; combo = 0; flash = 0.18; }
      return true;
    };
    const update = (dt) => {
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.55, 2.1 - level * 0.16) * (0.8 + Math.random() * 0.5); }
      const floor = H - 44;
      for (const w of [...words]) {
        w.y += w.v * dt;
        if (w.y >= floor) {
          words.splice(words.indexOf(w), 1); if (target === w) target = null;
          lives--; combo = 0; flash = 0.35; burst(w.x, floor, C.red, 18);
          if (lives <= 0) { finish(); break; }
        }
      }
    };
    function draw() {
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(180,230,200,.55)";
      for (const s of stars) g.fillRect(s.x, s.y, s.z * 1.6, s.z * 1.6);
      if (flash > 0) { g.fillStyle = `rgba(255,107,107,${Math.min(0.22, flash)})`; g.fillRect(0, 0, W, H); }
      // ground line + ship
      g.strokeStyle = "rgba(61,220,132,.25)"; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(0, H - 44); g.lineTo(W, H - 44); g.stroke(); g.setLineDash([]);
      const sx = W / 2, sy = H - 22, ang = target ? Math.atan2(target.y - sy, target.x - sx) + Math.PI / 2 : 0;
      for (const l of lasers) { g.strokeStyle = `rgba(181,230,85,${Math.min(1, l.t / 0.09)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(l.x, l.y + 6); g.stroke(); }
      g.save(); g.translate(sx, sy); g.rotate(ang); g.fillStyle = C.green; g.beginPath(); g.moveTo(0, -14); g.lineTo(11, 11); g.lineTo(0, 6); g.lineTo(-11, 11); g.closePath(); g.fill(); g.restore();
      // words
      g.font = `700 ${FONT}px ${MONO}`; g.textAlign = "left";
      for (const w of words) {
        const x = w.x - w.w / 2, lock = w === target;
        if (lock) { g.fillStyle = "rgba(61,220,132,.16)"; g.beginPath(); g.roundRect(x - 6, w.y - FONT + 2, w.w + 12, FONT + 8, 6); g.fill(); g.strokeStyle = C.green; g.lineWidth = 1; g.stroke(); }
        const done = w.text.slice(0, w.typed), rest = w.text.slice(w.typed);
        g.fillStyle = C.green; g.fillText(done, x, w.y);
        g.fillStyle = lock ? C.ink : "#cfe3d3"; g.fillText(rest, x + g.measureText(done).width, w.y);
      }
      for (const p of particles) { g.globalAlpha = Math.max(0, p.life * 1.6); g.fillStyle = p.color; g.fillRect(p.x, p.y, 3, 3); }
      g.globalAlpha = 1;
      // HUD
      text(`score ${score}`, 10, 18, 12, C.ink); text(`best ${best}`, 10, 34, 12, C.dim, "left", 500);
      text(`LEVEL ${level}`, W / 2, 18, 12, C.gold, "center");
      const acc = hits + misses ? Math.round((hits / (hits + misses)) * 100) : 100;
      text(`acc ${acc}%${combo > 4 ? `  x${combo}` : ""}`, W / 2, 34, 11, C.dim, "center", 500);
      text("♥".repeat(Math.max(0, lives)) + "·".repeat(5 - Math.max(0, lives)), W - 10, 18, 13, C.red, "right", 700);
      if (banner && performance.now() - bannerT < 1400) text(banner, W / 2, H / 2, 26, "rgba(232,201,122,.85)", "center", 700);
      if (state === "ready") veil("TYPEFALL", "Type any key to start. Type a word's letters to shoot it down.", "Backspace releases a lock · Esc exits");
      else if (state === "paused") veil("Paused", "Press any key to carry on");
      else if (state === "over") veil(`Overrun. ${kills} word${kills === 1 ? "" : "s"} · ${score} pts`, `best ${best} · accuracy ${acc}%`, "Enter to retry · Esc to exit");
    }
    return {
      name: "typefall", wantsKeyboard: true,
      start() { reset(); },
      key,
      frame(t) {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
        if (state === "run") {
          update(dt);
          for (const l of lasers) l.t -= dt; lasers = lasers.filter((l) => l.t > 0);
          for (const s of stars) { s.y += s.z * 14 * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
        }
        for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
        particles = particles.filter((p) => p.life > 0); flash = Math.max(0, flash - dt);
        draw();
      },
      pause() { if (state === "run") state = "paused"; },
      resize() { if (state === "run") state = "paused"; words.forEach((w) => { w.x = Math.min(W - 14 - w.w / 2, w.x); }); },
      stop() { if (score > best) Site.store.set("typefall", score); return `Typefall over. ${kills} words, ${score} pts.`; },
      // exposed for tests
      get _s() { return { words, target, state, score, lives, level, kills, combo }; }
    };
  };


  /* ====================================================================
     MINESWEEPER (the achievement pops on the second safe click, not on finishing)
     ==================================================================== */
  const SWEEP = { easy: [9, 9, 10], medium: [16, 16, 40], hard: [16, 30, 99] }; // rows, cols, mines
  const NUM = [null, "#6ab0ff", "#5fe08a", "#ff6b6b", "#b08cff", "#ff9a6b", "#4de0d0", "#e4efe6", "#8fa595"];

  const Minesweeper = (level) => {
    const [ROWS, COLS, MINES_N] = SWEEP[level], N = ROWS * COLS;
    let mine, adj, rev, flag, placed, over, won, safe, t0, elapsed, cur, flagMode, hits = [], dirty = true, lastShown = -1, boomAt = -1;

    const near = (i) => {
      const r = Math.floor(i / COLS), c = i % COLS, out = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) out.push(rr * COLS + cc);
      }
      return out;
    };
    const fresh = () => {
      mine = new Uint8Array(N); adj = new Uint8Array(N); rev = new Uint8Array(N); flag = new Uint8Array(N);
      placed = over = won = false; safe = 0; t0 = 0; elapsed = 0; cur = Math.floor(N / 2); boomAt = -1; flagMode = flagMode || false; dirty = true; lastShown = -1;
    };
    // Mines go down after the first click, never on it or beside it, so the first reveal always opens up.
    const place = (first) => {
      const banned = new Set([first, ...near(first)]);
      const spots = shuffle([...Array(N).keys()].filter((i) => !banned.has(i)));
      spots.slice(0, MINES_N).forEach((i) => { mine[i] = 1; });
      for (let i = 0; i < N; i++) adj[i] = near(i).reduce((n, j) => n + mine[j], 0);
      placed = true; t0 = performance.now();
    };
    const flood = (start) => {
      const q = [start];
      while (q.length) {
        const i = q.pop();
        if (rev[i] || flag[i]) continue;
        rev[i] = 1;
        if (!adj[i]) near(i).forEach((j) => { if (!rev[j] && !flag[j]) q.push(j); });
      }
    };
    const lose = (i) => {
      over = true; boomAt = i; elapsed = (performance.now() - t0) / 1000;
      for (let k = 0; k < N; k++) if (mine[k]) rev[k] = 1;
      dirty = true;
    };
    const checkWin = () => {
      let left = 0; for (let i = 0; i < N; i++) if (!mine[i] && !rev[i]) left++;
      if (left) return;
      over = won = true; elapsed = (performance.now() - t0) / 1000;
      for (let i = 0; i < N; i++) if (mine[i]) flag[i] = 1;
      const r = cv.getBoundingClientRect();
      Site.confetti && Site.confetti(r.left + r.width / 2, r.top + r.height / 2, 60);
      const key = "mines_" + level, best = Site.store.get(key, 0), t = Math.round(elapsed);
      if (!best || t < best) Site.store.set(key, t);
    };
    // One player click = one "safe click" if it did not blow up. The second one unlocks Long John Silver.
    const countSafe = () => { safe++; if (safe >= 2) Site.achv.unlock("silver"); };

    const reveal = (i) => {
      if (over) return;
      if (rev[i]) return chord(i);
      if (flag[i]) return;
      if (!placed) place(i);
      if (mine[i]) return lose(i);
      flood(i); countSafe(); checkWin(); dirty = true;
    };
    const chord = (i) => {
      if (!adj[i]) return;
      const ns = near(i);
      if (ns.filter((j) => flag[j]).length !== adj[i]) return;
      let opened = false;
      for (const j of ns) {
        if (flag[j] || rev[j]) continue;
        if (mine[j]) return lose(j);
        flood(j); opened = true;
      }
      if (opened) { countSafe(); checkWin(); dirty = true; }
    };
    const toggleFlag = (i) => { if (over || rev[i]) return; flag[i] ^= 1; dirty = true; };
    const flags = () => flag.reduce((n, v) => n + v, 0);

    const geo = () => {
      const top = 40, cell = Math.max(16, Math.min(34, Math.floor((H - top - 10) / ROWS), Math.floor((W - 16) / COLS)));
      const bw = cell * COLS, bh = cell * ROWS;
      return { cell, bw, bh, bx: Math.round((W - bw) / 2), by: top + Math.max(0, Math.round((H - top - bh) / 2)) };
    };
    const secs = () => (placed ? Math.min(999, Math.floor(over ? elapsed : (performance.now() - t0) / 1000)) : 0);

    function draw() {
      const { cell, bx, by } = geo(); hits = [];
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      // HUD
      text(`MINES ${String(MINES_N - flags()).padStart(2, "0")}`, bx, 26, 13, C.gold, "left", 700);
      text(String(secs()).padStart(3, "0"), bx + COLS * cell, 26, 13, C.gold, "right", 700);
      const face = won ? "B)" : over ? "X(" : ":)", fx = W / 2 - 22;
      g.fillStyle = "rgba(255,255,255,.07)"; g.beginPath(); g.roundRect(fx, 7, 44, 26, 8); g.fill();
      g.strokeStyle = "rgba(61,220,132,.35)"; g.lineWidth = 1; g.stroke();
      text(face, W / 2, 25, 14, C.ink, "center", 700);
      hits.push({ x: fx, y: 7, w: 44, h: 26, act: fresh });
      const fw = 74, flx = Math.max(bx + 86, Math.min(fx - fw - 10, W / 2 - 22 - fw - 10));
      g.fillStyle = flagMode ? "rgba(232,201,122,.28)" : "rgba(255,255,255,.07)"; g.beginPath(); g.roundRect(flx, 7, fw, 26, 8); g.fill();
      g.strokeStyle = flagMode ? C.gold : "rgba(61,220,132,.35)"; g.stroke();
      text(flagMode ? "Flag: on" : "Flag", flx + fw / 2, 24, 11, C.ink, "center", 600);
      hits.push({ x: flx, y: 7, w: fw, h: 26, act: () => { flagMode = !flagMode; } });
      // board
      for (let i = 0; i < N; i++) {
        const x = bx + (i % COLS) * cell, y = by + Math.floor(i / COLS) * cell, s = cell - 2;
        if (rev[i]) {
          g.fillStyle = i === boomAt ? "rgba(255,107,107,.55)" : "#0d1f15"; g.fillRect(x + 1, y + 1, s, s);
          if (mine[i]) {
            const cx = x + cell / 2, cy = y + cell / 2, r = cell * 0.22;
            g.fillStyle = "#e4efe6"; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill();
            g.strokeStyle = "#e4efe6"; g.lineWidth = 2; g.beginPath();
            for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.moveTo(cx - Math.cos(a) * r * 1.7, cy - Math.sin(a) * r * 1.7); g.lineTo(cx + Math.cos(a) * r * 1.7, cy + Math.sin(a) * r * 1.7); }
            g.stroke();
          } else if (adj[i]) text(String(adj[i]), x + cell / 2, y + cell / 2 + cell * 0.17, Math.round(cell * 0.55), NUM[adj[i]], "center", 700);
        } else {
          const grad = g.createLinearGradient(x, y, x, y + cell); grad.addColorStop(0, "#2f6a47"); grad.addColorStop(1, "#1f4a31");
          g.fillStyle = grad; g.beginPath(); g.roundRect(x + 1, y + 1, s, s, 3); g.fill();
          if (flag[i]) {
            const px = x + cell * 0.42, top = y + cell * 0.2, bot = y + cell * 0.78;
            g.strokeStyle = "#e4efe6"; g.lineWidth = 2; g.beginPath(); g.moveTo(px, top); g.lineTo(px, bot); g.stroke();
            g.fillStyle = C.gold; g.beginPath(); g.moveTo(px, top); g.lineTo(px + cell * 0.38, top + cell * 0.18); g.lineTo(px, top + cell * 0.36); g.closePath(); g.fill();
          }
        }
        if (i === cur && !over) { g.strokeStyle = C.lime; g.lineWidth = 2; g.strokeRect(x + 1.5, y + 1.5, s - 1, s - 1); }
        hits.push({ x, y, w: cell, h: cell, cell: i });
      }
      if (over) text(won ? "Cleared! Enter for a new board" : "Boom. Enter for a new board", W / 2, by + ROWS * cell + 16 > H - 4 ? H - 4 : by + ROWS * cell + 16, 11, won ? C.green : C.red, "center", 600);
      else if (!placed) text("Click a square to start. Right-click (or long-press) to flag.", W / 2, Math.min(H - 4, by + ROWS * cell + 16), 11, C.dim, "center", 500);
      lastShown = secs(); dirty = false;
    }

    const cellAt = (x, y) => { const h = hits.find((q) => q.cell !== undefined && x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h); return h ? h.cell : -1; };
    return {
      name: "minesweeper", wantsContext: true,
      start() { fresh(); },
      key(e) {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (k === "Enter" && over) { fresh(); return true; }
        const mv = { ArrowUp: [-1, 0], w: [-1, 0], ArrowDown: [1, 0], s: [1, 0], ArrowLeft: [0, -1], a: [0, -1], ArrowRight: [0, 1], d: [0, 1] }[k];
        if (mv) { cur = Math.min(ROWS - 1, Math.max(0, Math.floor(cur / COLS) + mv[0])) * COLS + Math.min(COLS - 1, Math.max(0, (cur % COLS) + mv[1])); dirty = true; return true; }
        if (k === " " || k === "Enter") { flagMode ? toggleFlag(cur) : reveal(cur); dirty = true; return true; }
        if (k === "f") { toggleFlag(cur); return true; }
        if (k === "n") { fresh(); return true; }
        return false;
      },
      click(x, y) {
        for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (h.act && x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) { h.act(); dirty = true; return; } }
        const c = cellAt(x, y); if (c < 0) return;
        cur = c; flagMode ? toggleFlag(c) : reveal(c); dirty = true;
      },
      context(x, y) { const c = cellAt(x, y); if (c >= 0) { cur = c; toggleFlag(c); } },
      frame() { if (dirty || (placed && !over && secs() !== lastShown)) draw(); },
      pause() { dirty = true; },
      resize() { dirty = true; },
      stop() { return won ? "Minesweeper cleared." : "Minesweeper closed."; },
      // exposed for tests
      get _s() { return { mine, adj, rev, flag, over, won, safe, placed, ROWS, COLS }; },
      _reveal: reveal, _flag: toggleFlag
    };
  };

  /*  commands  */
  Site.games = {};
  T.add(["sudoku"], (a) => {
    const level = (a && a[0] || "easy").toLowerCase();
    if (!LEVELS[level]) { print('<span class="o">sudoku what? try: sudoku easy | medium | hard</span>'); return; }
    const narrow = body.clientWidth < 640;
    const s = Sudoku(level); Site.games.sudoku = s;
    open(s, narrow);
  });
  T.add(["minesweeper", "mines", "sweeper"], (a) => {
    const level = (a && a[0] || "easy").toLowerCase();
    if (!SWEEP[level]) { print('<span class="o">minesweeper what? try: minesweeper easy | medium | hard</span>'); return; }
    if (level === "hard" && body.clientWidth < 560) { print('<span class="o">Hard needs a wider window. Try medium.</span>'); return; }
    const m = Minesweeper(level); Site.games.minesweeper = m;
    open(m, false);
  });
  T.add(["typefall", "type"], () => { const t = Typefall(); Site.games.typefall = t; open(t, false); });

  Site.cmds.push(
    { n: "Play Sudoku (terminal)", k: "game", run: () => { Site.go("#terminal")(); setTimeout(() => T.run("sudoku"), Site.reduced ? 0 : 600); } },
    { n: "Play Minesweeper (terminal)", k: "game", run: () => { Site.go("#terminal")(); setTimeout(() => T.run("minesweeper"), Site.reduced ? 0 : 600); } },
    { n: "Play Typefall (terminal)", k: "game", run: () => { Site.go("#terminal")(); setTimeout(() => T.run("typefall"), Site.reduced ? 0 : 600); } }
  );
})();
