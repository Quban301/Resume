/* Guestbook: sign it, and your note is pinned up. With a Firebase endpoint configured, entries are
   moderated: a new note stays "pending" (visible only to its author) until you flip ok to true. */
(() => {
  const Site = window.Site, S = Site.S, say = Site.say, esc = Site.esc, store = Site.store;
  const host = document.getElementById("guestbook");
  if (!host) return;

  const endpoint = ((S.guestbook && S.guestbook.endpoint) || "").replace(/\/$/, "");
  const MOODS = ["😍", "🤏", "💚","🤍", "🤩", "🔥", "🫶"];
  const MAX_NAME = 24, MAX_MSG = 240, COOLDOWN = 60000;
  const form = host.querySelector("#gbForm"), list = host.querySelector("#gbList"), meta = host.querySelector("#gbMeta");
  const name = form.elements.name, msg = form.elements.msg, count = host.querySelector("#gbCount"), moods = host.querySelector("#gbMoods");
  let mood = 0, approved = [], mine = store.get("gb.mine", []), lastPost = store.get("gb.last", 0);

  moods.innerHTML = MOODS.map((m, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-m="${i}" aria-label="mood ${m}">${m}</button>`).join("");
  moods.addEventListener("click", (e) => {
    const b = e.target.closest("[data-m]"); if (!b) return;
    mood = +b.dataset.m; moods.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  });
  msg.addEventListener("input", () => { count.textContent = `${msg.value.length}/${MAX_MSG}`; });

  // Everything read back from storage is untrusted: rebuild each entry from clamped strings/numbers.
  const clean = (e, key) => {
    if (!e || typeof e !== "object") return null;
    const strip = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
    const n = strip(e.name, MAX_NAME), m = strip(e.msg, MAX_MSG), md = Math.floor(+e.mood);
    if (!n || !m) return null;
    return { k: key || "", name: n, msg: m, mood: md >= 0 && md < MOODS.length ? md : 0, t: Number.isFinite(+e.t) ? +e.t : 0 };
  };

  const local = {
    async list() { return store.get("gb.local", []).map((e) => ({ ...e, ok: true })); },
    async add(entry) { store.set("gb.local", [...store.get("gb.local", []), entry].slice(-100)); return "local-" + entry.t; }
  };
  const remote = {
    async list() {
      const r = await fetch(`${endpoint}/guestbook.json?orderBy="$key"&limitToLast=100`);
      if (!r.ok) throw new Error("offline");
      const o = await r.json();
      return o ? Object.entries(o).filter(([, v]) => v && v.ok === true).map(([k, v]) => clean(v, k)).filter(Boolean) : [];
    },
    async add(entry) {
      const r = await fetch(`${endpoint}/guestbook.json`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...entry, ok: false }) });
      if (!r.ok) throw new Error("post failed");
      return (await r.json()).name;
    }
  };
  const db = endpoint ? remote : local;

  const fmt = (t) => (t ? new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");
  const rot = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return ((Math.abs(h) % 50) - 25) / 10; }; // -2.5deg..2.5deg, stable per entry

  function render() {
    const seen = new Set(approved.map((a) => a.k));
    const pending = endpoint ? mine.filter((m) => !seen.has(m.k)).map((m) => ({ ...m, pending: true })) : [];
    const all = [...pending, ...approved.slice().sort((a, b) => b.t - a.t)];
    list.innerHTML = all.length ? all.map((e) => `<li class="note${e.pending ? " pending" : ""}" style="--rot:${rot(e.k + e.name + e.t)}deg">
        <span class="note-mood" aria-hidden="true">${MOODS[e.mood]}</span>
        <p class="note-msg">${esc(e.msg)}</p>
        <p class="note-by"><b>${esc(e.name)}</b> <time>${fmt(e.t)}</time>${e.pending ? ' <em>awaiting approval</em>' : ""}</p></li>`).join("")
      : '<li class="note-empty">No signatures yet. Be the first to sign.</li>';
    meta.textContent = endpoint
      ? `${approved.length} note${approved.length === 1 ? "" : "s"} pinned up · New notes coming soon`
      : `${approved.length} note${approved.length === 1 ? "" : "s"} · saved in this browser`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.site.value) return; // honeypot: real visitors never see this field
    const entry = clean({ name: name.value, msg: msg.value, mood, t: Date.now() });
    if (!entry) return say("Add your name and a message first.");
    if (/https?:\/\/|www\./i.test(entry.msg + " " + entry.name)) return say("Links aren't allowed in the guestbook, sorry.");
    const wait = COOLDOWN - (Date.now() - lastPost);
    if (wait > 0) return say(`One note a minute, please. ${Math.ceil(wait / 1000)}s to go.`);
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
    try {
      const key = await db.add({ name: entry.name, msg: entry.msg, mood: entry.mood, t: entry.t });
      lastPost = Date.now(); store.set("gb.last", lastPost);
      entry.k = key;
      if (endpoint) { mine = [...mine, entry].slice(-10); store.set("gb.mine", mine); } else approved.push(entry);
      render(); form.reset(); count.textContent = `0/${MAX_MSG}`; mood = 0;
      moods.querySelectorAll("button").forEach((x, i) => x.setAttribute("aria-checked", String(i === 0)));
      Site.achv.unlock("signed"); Site.confetti(innerWidth / 2, innerHeight / 2, 28);
      say(endpoint ? "📖 Thanks! Your note will appear once it's approved." : "📖 Signed. Thanks for stopping by!");
    } catch { say("Couldn't reach the guestbook. Try again in a bit."); }
    btn.disabled = false;
  });

  let loaded = false;
  new IntersectionObserver(async ([e], io) => {
    if (!e.isIntersecting || loaded) return;
    loaded = true; io.disconnect();
    try { approved = (await db.list()).map((x) => clean(x, x.k)).filter(Boolean); }
    catch { approved = []; say("The guestbook is offline right now."); }
    render();
  }, { rootMargin: "200px" }).observe(host);
  render();

  Site.cmds.push({ n: "Sign the guestbook", k: "fun", run: Site.go("#guestbook") });
})();
