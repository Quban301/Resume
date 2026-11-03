(() => {
  const S = window.SITE;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /*  Toast  */
  const toast = $("#toast");
  let toastT;
  const say = (msg) => { toast.textContent = msg; toast.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("show"), 2200); };

  /*  Theme: starts dark; switching detonates from the button  */
  const root = document.documentElement;
  let netColor = null; // cached accent for the canvas, reset whenever the theme changes
  const setTheme = (t) => { root.dataset.theme = t; netColor = null; };

  const burst = (x, y) => {
    const el = document.createElement("div");
    el.className = "burst";
    el.style.setProperty("--x", x + "px"); el.style.setProperty("--y", y + "px");
    const n = 34, reach = Math.max(innerWidth, innerHeight) * 0.55;
    el.innerHTML = '<i class="shock"></i><i class="shock s2"></i><i class="flash"></i>' + Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 6.283 + Math.random() * 0.4, d = 140 + Math.random() * reach;
      return `<b style="--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--r:${Math.random() * 720 - 360}deg;--s:${0.6 + Math.random() * 1.4};--dl:${Math.random() * 0.12}s"></b>`;
    }).join("");
    return el;
  };

  let switching = false;
  const toggleTheme = (ev) => {
    if (switching) return;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const r = $("#themeBtn").getBoundingClientRect();
    const x = ev && ev.clientX ? ev.clientX : r.left + r.width / 2, y = ev && ev.clientY ? ev.clientY : r.top + r.height / 2;
    if (reduced) { setTheme(next); return; }
    switching = true;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const b = burst(x, y);
    if (!document.startViewTransition) { // no View Transitions: swap instantly, still explode
      document.body.appendChild(b); setTheme(next);
      setTimeout(() => { b.remove(); switching = false; }, 1500);
      return;
    }
    const vt = document.startViewTransition(() => { setTheme(next); document.body.appendChild(b); });
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 1100, easing: "cubic-bezier(.16,.84,.3,1)", pseudoElement: "::view-transition-new(root)" }
    )).catch(() => {});
    vt.finished.finally(() => { b.remove(); switching = false; });
  };
  $("#themeBtn").addEventListener("click", toggleTheme);

  /*  Render: experience, skills, certs  */
  $("#timeline").innerHTML = S.experience.map((j) => `<article class="job reveal">
    <span class="job-date">${esc(j.date)}</span><h3>${esc(j.role)}</h3>
    <p class="company"><b>${esc(j.company)}</b> · ${esc(j.place)}</p>
    <ul>${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    <div class="tags">${j.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div></article>`).join("");

  const allSkills = [...new Set(S.skills.flatMap((s) => s.items))];
  $("#marquee").innerHTML = [...allSkills, ...allSkills].map((s) => `<span>${esc(s)}</span>`).join("");
  $("#bento").innerHTML = S.skills.map((s, i) => `<div class="card reveal" style="--span:${s.span};--d:${(i % 4) * .07}s">
    <h3><span class="ico">${esc(s.icon)}</span>${esc(s.name)}</h3>
    <ul class="pills">${s.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
  $("#certs").innerHTML = S.certifications.map((c) => `<div class="cert"><i>✓</i><span>${esc(c)}</span></div>`).join("");
  $("#year").textContent = new Date().getFullYear();

  /*  Reveal on scroll + counters */
  const countUp = (el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 1400;
    if (reduced) { el.textContent = end + suf; return; }
    const tick = (t) => { const k = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    $$("[data-count]", e.target).forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: .12 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* Typed roles */
  const typed = $("#typed");
  if (reduced) typed.textContent = S.roles[0];
  else {
    let r = 0, c = 0, del = false;
    const step = () => {
      const w = S.roles[r];
      typed.textContent = w.slice(0, del ? --c : ++c);
      let wait = del ? 28 : 55;
      if (!del && c === w.length) { del = true; wait = 1600; }
      else if (del && c === 0) { del = false; r = (r + 1) % S.roles.length; wait = 350; }
      setTimeout(step, wait);
    };
    step();
  }

  /* Nav: scroll state, progress, active link, mobile */
  const nav = $("#nav"), bar = $("#progress"), links = $$("#navLinks a");
  const sections = links.map((a) => $(a.getAttribute("href")));
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${scrollY / (h.scrollHeight - innerHeight || 1)})`;
    nav.classList.toggle("scrolled", scrollY > 20);
    const y = scrollY + innerHeight * .35;
    let cur = null; sections.forEach((s) => { if (s && s.offsetTop <= y) cur = s.id; });
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const burger = $("#burger");
  const closeMenu = () => { $("#navLinks").classList.remove("open"); burger.setAttribute("aria-expanded", "false"); };
  burger.addEventListener("click", () => { const o = $("#navLinks").classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  links.forEach((a) => a.addEventListener("click", closeMenu));

  /* Cursor glow */
  const glow = $("#cursorGlow");
  let gx = 0, gy = 0, tx = 0, ty = 0;
  addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); }, { passive: true });
  (function loop() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = `translate(${gx}px,${gy}px)`; requestAnimationFrame(loop); })();

  /* Card spotlight + 3D tilt + magnetic buttons*/
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest(".bento .card");
    if (card) { const r = card.getBoundingClientRect(); card.style.setProperty("--mx", e.clientX - r.left + "px"); card.style.setProperty("--my", e.clientY - r.top + "px"); }
  }, { passive: true });
  if (!reduced && matchMedia("(hover: hover)").matches) {
    $$(".tilt").forEach((el) => {
      el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`; });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`; });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* Network canvas: fixed behind the whole page. Also the board for Network Defender. */
  const cv = $("#network"), ctx = cv.getContext("2d");
  let W, H, pts = [], mouse = { x: -999, y: -999 }, hidden = document.hidden, running = false;
  const accent = () => netColor || (netColor = getComputedStyle(root).getPropertyValue("--net").trim() || "#2f8f4e");
  const NET = {
    ctx, hooks: [], force: false, repel: true, onSpecial: null,
    get pts() { return pts; }, get W() { return W; }, get H() { return H; },
    color: () => accent(),
    kick: () => { if (!running) draw(); }
  };
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(120, Math.floor((W * H) / 13000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
    if (pts[0]) pts[0].special = true; // one node in the background is a hidden button
  };
  addEventListener("resize", size); size();
  const nearSpecial = (x, y) => { const p = pts.find((q) => q.special); return !!p && Math.hypot(p.x - x, p.y - y) < 22; };
  const interactive = "a,button,input,textarea,select,label,[data-frame],.palette,.loupe";
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (NET.onSpecial) document.body.style.cursor = !e.target.closest?.(interactive) && nearSpecial(e.clientX, e.clientY) ? "pointer" : "";
  }, { passive: true });
  document.addEventListener("click", (e) => {
    if (NET.onSpecial && !e.target.closest?.(interactive) && nearSpecial(e.clientX, e.clientY)) NET.onSpecial();
  });
  document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
  document.addEventListener("visibilitychange", () => { hidden = document.hidden; if (!hidden && !running) draw(); });
  function draw() {
    if (hidden) { running = false; return; }
    ctx.clearRect(0, 0, W, H);
    const col = accent();
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
    const now = performance.now();
    for (const p of pts) {
      if (!reduced || NET.force) { p.x += p.vx; p.y += p.vy; }
      if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (NET.repel && d < 140 && d > 0) { p.x += (dx / d) * 1.6; p.y += (dy / d) * 1.6; }
      ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(p.x, p.y, p.special ? 3.6 : 1.7, 0, 6.283); ctx.fill();
      if (p.special) { const t = (now / 1400) % 1; ctx.globalAlpha = .55 * (1 - t); ctx.beginPath(); ctx.arc(p.x, p.y, 4 + t * 14, 0, 6.283); ctx.stroke(); }
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 135) { ctx.globalAlpha = (1 - d / 135) * .32; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
    }
    if (NET.repel) for (const p of pts) { const d = Math.hypot(p.x - mouse.x, p.y - mouse.y); if (d < 170) { ctx.globalAlpha = (1 - d / 170) * .6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); } }
    ctx.globalAlpha = 1;
    for (const h of NET.hooks) h(ctx, W, H, now);
    running = !reduced || NET.force;
    if (running) requestAnimationFrame(draw);
  }
  draw();

  /*  Contact: copy email */
  const copyEmail = () => (navigator.clipboard ? navigator.clipboard.writeText(S.email) : Promise.reject()).then(() => say("Email copied ✓"), () => say(S.email));
  $("#copyEmail").addEventListener("click", copyEmail);

  /* Command palette */
  const pal = $("#palette"), inp = $("#paletteInput"), list = $("#paletteList");
  const go = (id) => () => { const el = $(id); el && el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); };
  const cmds = [
    ...[["About", "#about"], ["Projects", "#projects"], ["Experience", "#experience"], ["Skills", "#skills"], ["Competency tree", "#competencyTree"], ["Education", "#education"], ["Guestbook", "#guestbook"], ["Contact", "#contact"]].map(([n, id]) => ({ n: "Go to " + n, k: "section", run: go(id) })),
    ...S.projects.map((p) => ({ n: p.title, k: "project", run: go("#projects") })),
    { n: "Toggle light / dark theme", k: "action", run: () => toggleTheme() },
    { n: "Copy email address", k: "action", run: copyEmail },
    { n: "Download résumé", k: "action", run: () => { const a = document.createElement("a"); a.href = "assets/Qhawe-Moyo-CV.pdf"; a.download = ""; a.click(); } },
    { n: "Open GitHub", k: "link", run: () => open("https://github.com/" + S.githubUser, "_blank", "noopener") },
    { n: "Open LinkedIn", k: "link", run: () => open("https://www.linkedin.com/in/qhawe", "_blank", "noopener") }
  ];
  let shown = [], sel = 0;
  const paint = () => {
    const q = inp.value.trim().toLowerCase();
    shown = cmds.filter((c) => c.n.toLowerCase().includes(q) || c.k.includes(q));
    sel = Math.min(sel, Math.max(shown.length - 1, 0));
    list.innerHTML = shown.length ? shown.map((c, i) => `<li class="${i === sel ? "sel" : ""}" data-i="${i}">${esc(c.n)}<small>${c.k}</small></li>`).join("") : '<li class="muted">No matches</li>';
    const s = $(".sel", list); s && s.scrollIntoView({ block: "nearest" });
  };
  const openPal = () => { pal.hidden = false; inp.value = ""; sel = 0; paint(); inp.focus(); };
  const closePal = () => { pal.hidden = true; };
  const runSel = (i = sel) => { const c = shown[i]; if (c) { closePal(); c.run(); } };
  $("#paletteBtn").addEventListener("click", openPal);
  pal.addEventListener("mousedown", (e) => { if (e.target === pal) closePal(); });
  list.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); li && runSel(+li.dataset.i); });
  inp.addEventListener("input", () => { sel = 0; paint(); });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % shown.length; paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + shown.length) % shown.length; paint(); }
    else if (e.key === "Enter") runSel();
  });
  addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
    else if (e.key === "Escape" && !pal.hidden) closePal();
  });

  /* Shared surface for the games, and easter eggs (js/fun.js, terminal.js, defender.js) */
  window.Site = { S, say, esc, reduced, toggleTheme, cmds, go, net: NET, refreshColors: () => { netColor = null; } };
})();
