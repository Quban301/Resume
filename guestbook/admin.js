/* Guestbook moderation page. Signs in with Firebase Auth (REST, no SDK) and talks to the Realtime Database over REST.
   Notes are always rendered with textContent, never innerHTML: they are untrusted visitor text. */
(() => {
  const cfg = (window.SITE && window.SITE.guestbook) || {};
  const base = (cfg.endpoint || "").replace(/\/$/, ""), apiKey = cfg.apiKey || "";
  const MOODS = ["🌱", "👋", "💚", "🚀", "🔥", "🐛"], MAX_NAME = 24, MAX_MSG = 240;
  const $ = (s) => document.querySelector(s);
  const el = (tag, props = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    kids.flat().forEach((c) => e.append(c));
    return e;
  };
  const setMsg = (node, text, kind = "") => { node.textContent = text; node.className = "ga-msg " + kind; };

  /*  theme  */
  const root = document.documentElement;
  $("#theme").addEventListener("click", () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; });

  /*  auth  */
  let tok = null; // { id, exp }
  const RT = "gb.admin.rt"; // refresh token lives in sessionStorage only: it dies when the tab closes
  const saveRefresh = (v) => { try { v ? sessionStorage.setItem(RT, v) : sessionStorage.removeItem(RT); } catch {} };
  const loadRefresh = () => { try { return sessionStorage.getItem(RT); } catch { return null; } };

  const signIn = async (email, password) => {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(/INVALID|NOT_FOUND|PASSWORD|CREDENTIAL/i.test(j.error?.message || "") ? "Wrong email or password." : (j.error?.message || "Sign-in failed."));
    tok = { id: j.idToken, exp: Date.now() + (+j.expiresIn || 3600) * 1000 };
    saveRefresh(j.refreshToken);
  };
  const refresh = async () => {
    const rt = loadRefresh(); if (!rt) throw new Error("signed out");
    const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(rt)}`
    });
    const j = await r.json();
    if (!r.ok) { saveRefresh(null); throw new Error("signed out"); }
    tok = { id: j.id_token, exp: Date.now() + (+j.expires_in || 3600) * 1000 };
    saveRefresh(j.refresh_token);
  };
  const token = async () => { if (!tok || Date.now() > tok.exp - 60000) await refresh(); return tok.id; };

  const api = async (path, method = "GET", body) => {
    const r = await fetch(`${base}/${path}.json?auth=${encodeURIComponent(await token())}`, {
      method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined
    });
    if (r.status === 401 || r.status === 403) throw new Error("Permission denied. Check the database rules and that your UID is in them.");
    if (!r.ok) throw new Error("Database error " + r.status);
    return r.json();
  };

  /*  data  */
  let notes = [], filter = "pending", busy = false;
  const str = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
  const hasLink = (n) => /https?:|www\.|\.(com|net|org|io|co|za)\b/i.test(n.name + " " + n.msg);
  const load = async () => {
    const o = (await api("guestbook")) || {};
    notes = Object.entries(o).filter(([, v]) => v && typeof v === "object").map(([k, v]) => ({
      k, name: str(v.name, MAX_NAME), msg: str(v.msg, MAX_MSG), mood: Math.max(0, Math.min(MOODS.length - 1, Math.floor(+v.mood) || 0)), t: +v.t || 0, ok: v.ok === true
    })).sort((a, b) => b.t - a.t);
  };

  /*  views  */
  const show = (which) => { for (const id of ["login", "dash", "setup"]) $("#" + id).hidden = id !== which; $("#signout").hidden = which !== "dash"; };

  function renderTabs() {
    const counts = { pending: notes.filter((n) => !n.ok).length, approved: notes.filter((n) => n.ok).length, all: notes.length };
    const tabs = $("#tabs"); tabs.replaceChildren();
    [["pending", "Pending"], ["approved", "Approved"], ["all", "All"]].forEach(([k, label]) =>
      tabs.append(el("button", { type: "button", "aria-pressed": String(filter === k), onclick: () => { filter = k; render(); } }, `${label} (${counts[k]})`)));
    tabs.append(el("button", { type: "button", onclick: () => refreshNow() }, "↻ Refresh"));
  }

  function card(n) {
    const wrap = el("article", { class: "ga-card ga-note" });
    const body = el("div", { class: "ga-body" });
    const view = () => {
      body.replaceChildren(
        el("p", {}, n.msg),
        el("div", { class: "ga-by" }, el("b", {}, n.name), n.t ? new Date(n.t).toLocaleString() : "",
          el("span", { class: "ga-badge " + (n.ok ? "live" : "pending") }, n.ok ? "live" : "pending"),
          hasLink(n) ? el("span", { class: "ga-badge link" }, "contains a link") : ""),
        el("div", { class: "ga-actions" },
          n.ok ? el("button", { class: "btn btn-ghost", type: "button", onclick: () => act(n, { ok: false }, "Unpublished.") }, "Unpublish")
               : el("button", { class: "btn btn-primary", type: "button", onclick: () => act(n, { ok: true }, "Approved. It is live now.") }, "Approve"),
          el("button", { class: "btn btn-ghost", type: "button", onclick: edit }, "Edit"),
          el("button", { class: "btn btn-ghost danger", type: "button", onclick: () => remove(n) }, n.ok ? "Delete" : "Deny")));
    };
    const edit = () => {
      const name = el("input", { type: "text", maxlength: MAX_NAME, value: n.name, "aria-label": "Name" });
      const msg = el("textarea", { maxlength: MAX_MSG, "aria-label": "Message" }); msg.value = n.msg;
      body.replaceChildren(el("div", { class: "ga-edit" }, name, msg,
        el("div", { class: "ga-actions" },
          el("button", { class: "btn btn-primary", type: "button", onclick: () => act(n, { name: str(name.value, MAX_NAME), msg: str(msg.value, MAX_MSG) }, "Saved.") }, "Save"),
          el("button", { class: "btn btn-ghost", type: "button", onclick: view }, "Cancel"))));
      msg.focus();
    };
    wrap.append(el("div", { class: "ga-mood", "aria-hidden": "true" }, MOODS[n.mood]), body);
    view();
    return wrap;
  }

  function render() {
    renderTabs();
    const list = $("#list"); list.replaceChildren();
    const shown = notes.filter((n) => filter === "all" || (filter === "approved" ? n.ok : !n.ok));
    if (!shown.length) list.append(el("div", { class: "ga-empty" }, filter === "pending" ? "Nothing waiting for approval." : "Nothing here yet."));
    shown.forEach((n) => list.append(card(n)));
  }

  /*  actions  */
  const run = async (fn, okText) => {
    if (busy) return; busy = true;
    try { await fn(); setMsg($("#dashMsg"), okText || "", "ok"); }
    catch (e) { setMsg($("#dashMsg"), e.message === "signed out" ? "Session expired. Please sign in again." : e.message, "err"); if (e.message === "signed out") show("login"); }
    busy = false;
  };
  const act = (n, patch, text) => run(async () => {
    if (patch.name !== undefined && (!patch.name || !patch.msg)) throw new Error("Name and message can't be empty.");
    await api("guestbook/" + encodeURIComponent(n.k), "PATCH", patch);
    Object.assign(n, patch); render();
  }, text);
  const remove = (n) => {
    if (!confirm(`${n.ok ? "Delete" : "Deny"} this note from ${n.name}? This can't be undone.`)) return;
    run(async () => { await api("guestbook/" + encodeURIComponent(n.k), "DELETE"); notes = notes.filter((x) => x !== n); render(); }, n.ok ? "Deleted." : "Denied and removed.");
  };
  const refreshNow = () => run(async () => { await load(); render(); }, "Up to date.");

  /*  boot  */
  $("#signout").addEventListener("click", () => { tok = null; saveRefresh(null); notes = []; show("login"); });
  $("#login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#loginMsg"), btn = e.target.querySelector("button");
    btn.disabled = true; setMsg(msg, "Signing in...");
    try { await signIn($("#email").value.trim(), $("#pw").value); $("#pw").value = ""; setMsg(msg, ""); await open(); }
    catch (err) { setMsg(msg, err.message, "err"); }
    btn.disabled = false;
  });
  async function open() { show("dash"); setMsg($("#dashMsg"), "Loading..."); await refreshNow(); }
  addEventListener("focus", () => { if (!$("#dash").hidden && !busy) load().then(render).catch(() => {}); });

  (async () => {
    if (!base || !apiKey) {
      const s = $("#setup"); show("setup");
      s.append(el("h2", {}, "Almost there"), el("p", {}, "Add your Firebase details to js/data.js, in the guestbook block: "),
        el("pre", {}, 'guestbook: { endpoint: "https://YOUR-PROJECT-default-rtdb.firebaseio.com", apiKey: "YOUR_WEB_API_KEY" }'));
      return;
    }
    if (loadRefresh()) { try { await refresh(); await open(); return; } catch {} }
    show("login");
  })();
})();
