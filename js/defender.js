/* Network Defender: the background network gets infected. Click the red nodes to patch them
   before the breach limit is reached. Found by clicking the one glowing node, or via the
   terminal ("defend") / command palette. */
(() => {
  const Site = window.Site, NET = Site.net, store = Site.store, root = document.documentElement;
  const LIMIT = 9, SPREAD_RANGE = 150, HIT = 30;
  const cv = document.getElementById("network");
  let st = null, hud = null, panel = null, hint = null, best = store.get("defender", 0), hudAt = 0;

  const el = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; };
  const infected = () => NET.pts.filter((p) => p.inf);
  const nearest = (pool, x, y, max) => pool.reduce((b, p) => { const d = Math.hypot(p.x - x, p.y - y); return d < max && (!b || d < b.d) ? { p, d } : b; }, null)?.p;

  function start() {
    if (st) return;
    st = { score: 0, patched: 0, combo: 0, lastPatch: 0, t0: performance.now(), nextInfect: performance.now() + 900, nextSpread: performance.now() + 3000, over: false, rings: [] };
    NET.pts.forEach((p) => { p.inf = 0; });
    root.classList.add("game-on"); NET.repel = false; NET.force = true;
    hud = el(`<div class="hud" role="status"><b>NETWORK DEFENDER</b><span>Score <i data-s>0</i></span><span>Breach <i data-b>0</i>/${LIMIT}</span><span>Combo ×<i data-c>1</i></span><button type="button" data-quit>Quit</button></div>`);
    hint = el('<div class="hud-hint">Click the <b>red</b> nodes to patch them before the network goes down.</div>');
    document.body.append(hud, hint);
    setTimeout(() => hint && hint.classList.add("fade"), 5000);
    hud.querySelector("[data-quit]").addEventListener("click", quit);
    NET.hooks.push(hook); cv.addEventListener("pointerdown", hit); addEventListener("keydown", onKey, true);
    NET.kick();
  }

  function quit() {
    if (!st) return;
    NET.hooks.splice(NET.hooks.indexOf(hook), 1);
    cv.removeEventListener("pointerdown", hit); removeEventListener("keydown", onKey, true);
    NET.pts.forEach((p) => { p.inf = 0; });
    hud?.remove(); panel?.remove(); hint?.remove(); hud = panel = hint = null;
    root.classList.remove("game-on"); NET.repel = true; NET.force = false;
    st = null;
  }
  const onKey = (e) => { if (e.key === "Escape") { quit(); e.preventDefault(); e.stopPropagation(); } };

  function hit(e) {
    if (!st || st.over) return;
    const now = performance.now(), range = e.pointerType === "touch" ? 46 : HIT;
    const p = nearest(infected(), e.clientX, e.clientY, range);
    if (!p) { st.combo = 0; return; }
    p.inf = 0;
    st.combo = now - st.lastPatch < 1400 ? st.combo + 1 : 1; st.lastPatch = now;
    st.patched++; st.score += Math.round(10 * (1 + Math.min(st.combo - 1, 5) * 0.5));
    st.rings.push({ x: p.x, y: p.y, t: now });
  }

  function end() {
    st.over = true;
    if (st.score > best) { best = st.score; store.set("defender", best); }
    if (st.patched >= 10) Site.achv.unlock("patch");
    const secs = Math.round((performance.now() - st.t0) / 1000);
    panel = el(`<div class="hud-panel" role="dialog" aria-label="Game over"><h3>Network breached</h3>
      <p>You patched <b>${st.patched}</b> node${st.patched === 1 ? "" : "s"} in <b>${secs}s</b>.</p>
      <p class="muted">Score ${st.score} · Best ${best}</p>
      <div><button class="btn btn-primary" data-again>Defend again</button> <button class="btn btn-ghost" data-close>Close</button></div></div>`);
    document.body.appendChild(panel);
    panel.querySelector("[data-again]").addEventListener("click", () => { quit(); start(); });
    panel.querySelector("[data-close]").addEventListener("click", quit);
    panel.querySelector("[data-again]").focus();
  }

  function hook(ctx, W, H, now) {
    if (!st) return;
    const pts = NET.pts;
    if (!st.over) {
      if (now >= st.nextInfect) {
        const ok = pts.filter((p) => !p.inf && !p.special);
        if (ok.length) ok[Math.floor(Math.random() * ok.length)].inf = now;
        st.nextInfect = now + Math.max(420, 1500 - st.patched * 35);
      }
      if (now >= st.nextSpread) {
        const healthy = pts.filter((p) => !p.inf && !p.special);
        for (const s of infected()) if (now - s.inf > 2000 && Math.random() < 0.7) { const t = nearest(healthy, s.x, s.y, SPREAD_RANGE); if (t) t.inf = now; }
        st.nextSpread = now + Math.max(1200, 2600 - st.patched * 40);
      }
      if (st.combo && now - st.lastPatch > 1400) st.combo = 0;
      if (infected().length >= LIMIT) end();
    }
    const bad = infected();
    ctx.lineWidth = 1;
    for (let i = 0; i < bad.length; i++) for (let j = i + 1; j < bad.length; j++) {
      const d = Math.hypot(bad[i].x - bad[j].x, bad[i].y - bad[j].y);
      if (d < SPREAD_RANGE) { ctx.strokeStyle = "#ff5a3c"; ctx.globalAlpha = (1 - d / SPREAD_RANGE) * 0.6; ctx.beginPath(); ctx.moveTo(bad[i].x, bad[i].y); ctx.lineTo(bad[j].x, bad[j].y); ctx.stroke(); }
    }
    for (const p of bad) {
      const age = (now - p.inf) / 1000, pulse = 7 + Math.sin(now / 130) * 2 + Math.min(age, 4) * 1.2;
      ctx.globalAlpha = 0.25 + Math.min(age / 6, 0.45); ctx.fillStyle = "#ff5a3c";
      ctx.beginPath(); ctx.arc(p.x, p.y, pulse + 6, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, 6.283); ctx.fill();
    }
    st.rings = st.rings.filter((r) => now - r.t < 500);
    ctx.strokeStyle = NET.color(); ctx.lineWidth = 2;
    for (const r of st.rings) { const k = (now - r.t) / 500; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(r.x, r.y, 6 + k * 34, 0, 6.283); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (hud && now - hudAt > 120) {
      hudAt = now;
      hud.querySelector("[data-s]").textContent = st.score;
      const b = hud.querySelector("[data-b]"); b.textContent = bad.length; b.parentElement.classList.toggle("danger", bad.length >= LIMIT - 3);
      hud.querySelector("[data-c]").textContent = Math.max(1, st.combo);
    }
  }

  NET.onSpecial = start;
  Site.defender = { start, quit };
  Site.cmds.push({ n: "Play Network Defender", k: "game", run: start });
})();
