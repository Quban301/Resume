/* Nav clock: click to swap Flip <-> Roman numerals. Each face has its own look (miniature versions of a
   classic "clock faces" page: split-flap digits, and glowing Cinzel numerals with Latin labels). */
(() => {
  const Site = window.Site, btn = document.getElementById("flipClock");
  if (!btn) return;
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(2, "0");

  const ROMAN = [["XL", 40], ["L", 50], ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]].sort((a, b) => b[1] - a[1]);
  const roman = (n) => { if (!n) return "–"; let s = ""; for (const [r, v] of ROMAN) while (n >= v) { s += r; n -= v; } return s; };

  /*  markup  */
  const digit = () => '<span class="fd"><span class="fd-top"><span>0</span></span><span class="fd-bot"><span>0</span></span></span>';
  const group = (k) => `<span class="fg" data-k="${k}">${digit()}${digit()}</span>`;
  const unit = (k, label) => `<span class="ru"><span class="rv" data-k="${k}"></span><span class="rl">${label}</span></span>`;
  btn.innerHTML =
    `<span class="face face-flip">${group("h")}<i class="fsep">:</i>${group("m")}<i class="fsep">:</i>${group("s")}</span>` +
    `<span class="face face-roman">${unit("h", "HORAE")}<i class="rsep">·</i>${unit("m", "MINUTAE")}<i class="rsep">·</i>${unit("s", "SECUNDAE")}</span>`;

  /*  flip  */
  const prev = {};
  const digits = {};
  btn.querySelectorAll(".fg").forEach((g) => { const d = g.querySelectorAll(".fd"); digits[g.dataset.k + "0"] = d[0]; digits[g.dataset.k + "1"] = d[1]; });
  const setDigit = (key, val) => {
    if (prev[key] === val) return;
    const old = prev[key]; prev[key] = val;
    const el = digits[key];
    el.querySelector(".fd-top span").textContent = val;
    el.querySelector(".fd-bot span").textContent = val;
    if (old === undefined || reduced()) return;
    const top = document.createElement("span"), bot = document.createElement("span");
    top.className = "fd-top-fold"; top.innerHTML = `<span>${old}</span>`;
    bot.className = "fd-bot-fold"; bot.innerHTML = `<span>${val}</span>`;
    el.classList.add("flipping"); el.append(top, bot);
    top.addEventListener("animationend", () => top.remove(), { once: true });
    bot.addEventListener("animationend", () => { bot.remove(); el.classList.remove("flipping"); }, { once: true });
  };

  /*  roman  */
  const romanEl = {};
  btn.querySelectorAll(".rv").forEach((e) => (romanEl[e.dataset.k] = e));

  const MODES = ["flip", "roman"];
  let mode = 0;
  const render = () => {
    const d = new Date(), t = { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
    for (const k of ["h", "m", "s"]) {
      const s = pad(t[k]);
      setDigit(k + "0", s[0]); setDigit(k + "1", s[1]);
      romanEl[k].textContent = roman(t[k]);
    }
    btn.dataset.mode = MODES[mode];
    btn.title = `${pad(t.h)}:${pad(t.m)}:${pad(t.s)} - ${MODES[mode]} clock. Click to change.`;
  };
  const tick = () => { render(); setTimeout(tick, 1000 - (Date.now() % 1000) + 8); };
  btn.dataset.mode = MODES[0];
  tick();

  btn.addEventListener("click", () => {
    mode = (mode + 1) % MODES.length;
    render();
    if (MODES[mode] === "roman") Site.achv.unlock("clock");
  });
})();
