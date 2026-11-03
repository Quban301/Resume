/* The About-section terminal is real: type commands, find secrets, play Snake. */
(() => {
  const Site = window.Site, S = Site.S, esc = Site.esc, say = Site.say;
  const root = document.getElementById("terminal");
  if (!root) return;
  const out = root.querySelector("#termOut"), input = root.querySelector("#termIn"), body = root.querySelector(".term-body"), cv = root.querySelector("#snake");
  const rand = (n) => Math.floor(Math.random() * n);

  const print = (html = "") => { const d = document.createElement("div"); d.innerHTML = html || "&nbsp;"; out.appendChild(d); body.scrollTop = body.scrollHeight; };
  const o = (t) => print(`<span class="o">${t}</span>`);
  const skills = [...new Set(S.skills.flatMap((s) => s.items))];

  /* ================= Snake: the food is your skills ================= */
  const Snake = (() => {
    const COLS = 22, ROWS = 14, CELL = 20;
    cv.width = COLS * CELL; cv.height = ROWS * CELL;
    const g = cv.getContext("2d");
    let snake, dir, queued, food, score, timer = 0, state = "off", best = Site.store.get("snake", 0), toastText = "", toastT = 0;

    const placeFood = () => {
      do food = { x: rand(COLS), y: rand(ROWS), name: skills[rand(skills.length)] };
      while (snake.some((s) => s.x === food.x && s.y === food.y));
    };
    const reset = () => {
      snake = [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 }];
      dir = { x: 1, y: 0 }; queued = dir; score = 0; toastText = ""; placeFood(); state = "ready"; draw();
    };
    const speed = () => Math.max(60, 125 - score * 3);
    const run = () => { clearInterval(timer); timer = setInterval(tick, speed()); };

    function tick() {
      dir = queued;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || snake.some((s) => s.x === head.x && s.y === head.y)) return over();
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++; toastText = "+ " + food.name; toastT = performance.now();
        if (score === 5) Site.achv.unlock("snake");
        placeFood(); run();
      } else snake.pop();
      draw();
    }
    function over() {
      clearInterval(timer); state = "over";
      if (score > best) { best = score; Site.store.set("snake", best); }
      draw();
    }
    function draw() {
      g.fillStyle = "#06130b"; g.fillRect(0, 0, cv.width, cv.height);
      g.strokeStyle = "rgba(61,220,132,.07)"; g.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) { g.beginPath(); g.moveTo(x * CELL, 0); g.lineTo(x * CELL, cv.height); g.stroke(); }
      for (let y = 0; y <= ROWS; y++) { g.beginPath(); g.moveTo(0, y * CELL); g.lineTo(cv.width, y * CELL); g.stroke(); }
      // food: a leaf with its skill name
      const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2;
      g.fillStyle = "#e8c97a"; g.beginPath(); g.arc(fx, fy, CELL * 0.34, 0, 6.283); g.fill();
      g.font = "600 11px 'JetBrains Mono', monospace"; g.textAlign = "center"; g.fillStyle = "#e8c97a";
      const tw = g.measureText(food.name).width / 2;
      g.fillText(food.name, Math.min(cv.width - tw - 2, Math.max(tw + 2, fx)), food.y === 0 ? fy + 22 : fy - 12);
      snake.forEach((s, i) => {
        g.fillStyle = i === 0 ? "#b5e655" : `hsl(${145 - i * 1.5} 70% ${52 - Math.min(i, 20) * 0.9}%)`;
        g.beginPath(); g.roundRect(s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3, i === 0 ? 7 : 5); g.fill();
      });
      g.textAlign = "left"; g.font = "600 12px 'JetBrains Mono', monospace"; g.fillStyle = "#8fa595";
      g.fillText(`score ${score}   best ${best}`, 8, 16);
      if (toastText && performance.now() - toastT < 1400) { g.fillStyle = "#3ddc84"; g.fillText(toastText, 8, 32); }
      if (state !== "run") {
        g.fillStyle = "rgba(3,10,6,.72)"; g.fillRect(0, 0, cv.width, cv.height);
        g.textAlign = "center"; g.fillStyle = "#e4efe6"; g.font = "700 18px 'JetBrains Mono', monospace";
        const msg = state === "over" ? `Game over - ${score} skill${score === 1 ? "" : "s"} eaten` : state === "paused" ? "Paused" : "Press an arrow key to start";
        g.fillText(msg, cv.width / 2, cv.height / 2 - 6);
        g.font = "500 12px 'JetBrains Mono', monospace"; g.fillStyle = "#8fa595";
        g.fillText(state === "over" ? "Enter to retry · Esc to exit" : "WASD / arrows / swipe · Space pauses · Esc exits", cv.width / 2, cv.height / 2 + 18);
      }
    }
    const turn = (dx, dy) => {
      if (state === "over") return;
      if (dx === -dir.x && dy === -dir.y) return;
      queued = { x: dx, y: dy };
      if (state === "ready" || state === "paused") { state = "run"; run(); }
    };
    const keys = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const onKey = (e) => {
      if (state === "off" || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (keys[k]) { turn(...keys[k]); }
      else if (k === " " && (state === "run" || state === "paused")) { if (state === "run") { clearInterval(timer); state = "paused"; draw(); } else { state = "run"; run(); } }
      else if (k === "Enter" && state === "over") reset();
      else if (k === "Escape") return stop();
      else return;
      e.preventDefault();
    };
    let sx = 0, sy = 0;
    cv.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; if (state === "over") reset(); });
    cv.addEventListener("pointerup", (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy));
    });
    cv.style.touchAction = "none";
    new IntersectionObserver(([e]) => { if (!e.isIntersecting && state === "run") { clearInterval(timer); state = "paused"; draw(); } }).observe(cv);

    function start() {
      if (state !== "off") return;
      cv.hidden = false; input.blur(); reset();
      addEventListener("keydown", onKey, true);
      cv.scrollIntoView({ block: "center", behavior: Site.reduced ? "auto" : "smooth" });
      print('<span class="o">Snake started. Eat your skills. Esc to quit.</span>');
    }
    function stop() {
      if (state === "off") return;
      clearInterval(timer); state = "off"; cv.hidden = true;
      removeEventListener("keydown", onKey, true);
      print(`<span class="o">Snake over. Score ${score}, best ${best}.</span>`);
      input.focus({ preventScroll: true });
    }
    return { start, stop, get active() { return state !== "off"; } };
  })();

  /* ================= commands ================= */
  const files = {
    "now.txt": ["→ leading dev &amp; facilitating at WWISE", "→ building proctoring, LMS &amp; cert-prep platforms", "→ shipping integrations across third-party APIs"],
    "skills.txt": S.skills.map((s) => `${esc(s.name)}: ${s.items.map(esc).join(", ")}`),
    ".secret": ["the oldest cheat code in the book", "up up down down left right left right b a", "(try it with the page focused, not in here)"]
  };
  const help = [
    ["help", "this list"], ["whoami / codename", "who is this"], ["ls [-a]", "list files"], ["cat &lt;file&gt;", "read a file"], ["skills", "everything in the toolbox"],
    ["projects", "what I've built"], ["play snake", "eat your skills"], ["defend", "Network Defender: patch the infected nodes"], ["crt", "retro mode"], ["guestbook", "go sign the guestbook"], ["achievements", "secrets found so far"], ["clear", "clean up"]
  ];
  const C = {
    help() { help.forEach(([c, d]) => print(`<span class="p">${c}</span><span class="o"> - ${d}</span>`)); },
    whoami() { o("qhawe moyo"); },
    codename() { o("quban"); },
    experience() { o("senior software developer"); },
    ls(a) { o((a.includes("-a") ? Object.keys(files) : Object.keys(files).filter((f) => f[0] !== ".")).join("  ") + (a.includes("-a") ? "" : "  projects/")); },
    cat(a) { const f = files[a[0]]; f ? f.forEach(o) : o(a[0] ? `cat: ${esc(a[0])}: No such file` : "cat: missing file"); },
    skills() { files["skills.txt"].forEach(o); },
    projects() { S.projects.forEach((p, i) => o(`${String(i + 1).padStart(2, "0")}  ${esc(p.title)} - ${esc(p.tagline)}`)); o("(scroll to Projects to open them)"); },
    play(a) { a[0] === "snake" ? Snake.start() : a[0] === "defender" ? Site.defender?.start() : o("play what? try: play snake"); },
    snake() { Snake.start(); },
    defend() { Site.defender?.start(); },
    crt() { Site.toggleCRT(); },
    guestbook() { o("scrolling to the guestbook..."); Site.go("#guestbook")(); },
    theme() { Site.toggleTheme(); },
    hire() { o(`${esc(S.email)}`); },
    achievements() { o(`secrets found: ${Site.achv.lines().filter((l) => l[1] === "x").length}/${Object.keys(Site.achv.defs).length}`); Site.achv.lines().forEach(o); },
    clear() { out.innerHTML = ""; },
    sudo(a) {
      if (a.join(" ") === "hire-me") { o("[sudo] permission granted."); o(`reach me at ${esc(S.email)}`); Site.achv.unlock("sudo"); }
      else o("quban is not in the sudoers file. This incident will be reported.");
    }
  };
  C.hire_me = C.hire;

  const history = []; let hi = 0;
  const run = (line, echo) => {
    const raw = line.trim(); if (!raw) return;
    if (echo) print(`<span class="p">$</span> ${esc(raw)}`);
    const [cmd, ...args] = raw.split(/\s+/);
    const fn = Object.prototype.hasOwnProperty.call(C, cmd.toLowerCase()) ? C[cmd.toLowerCase()] : null;
    fn ? fn(args) : o(`command not found: ${esc(cmd)}. Try 'help'.`);
  };
  Site.terminal = {
    run(line, scroll) {
      if (scroll) root.scrollIntoView({ block: "center", behavior: Site.reduced ? "auto" : "smooth" });
      run(line, true);
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const v = input.value; input.value = ""; if (v.trim()) { history.push(v); hi = history.length; } run(v, true); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (hi > 0) input.value = history[--hi]; }
    else if (e.key === "ArrowDown") { e.preventDefault(); input.value = hi < history.length - 1 ? history[++hi] : ((hi = history.length), ""); }
  });
  body.addEventListener("click", (e) => { if (!Snake.active && !e.target.closest("canvas") && !getSelection().toString()) input.focus({ preventScroll: true }); });

  Site.cmds.push({ n: "Play Snake (terminal)", k: "game", run: () => { Site.go("#terminal")(); setTimeout(() => Snake.start(), Site.reduced ? 0 : 600); } });
})();
