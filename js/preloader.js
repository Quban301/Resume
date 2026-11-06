/* Preloader: an animated loading screen that stays up until the page, the fonts and the guestbook data are all ready,
   so the guestbook is already filled in by the time someone scrolls to it. It deliberately says nothing about what it
   is waiting for. It never blocks for long: after MAX ms it lets go regardless and the guestbook finishes in the background.
   Other scripts use window.Preload:  Preload.track("guestbook", promise)  and  Preload.ready (resolves once it is gone). */
(() => {
  const root = document.documentElement, el = document.getElementById("preloader");
  // The full boot animation plays on the first load of a visit; later loads in the same tab get a quick version.
  let seen = false;
  try { seen = !!sessionStorage.getItem("qm.boot"); sessionStorage.setItem("qm.boot", "1"); } catch {}
  const MIN = seen ? 900 : 2600, MAX = 4000, t0 = performance.now(); // MIN lets the animation play even when everything is cached
  let release;
  const ready = new Promise((r) => (release = r));
  window.Preload = { ready, track() {} };
  if (!el) { root.classList.remove("preloading"); release(); return; }

  // One slot per thing we wait for. track() fills a slot whether the promise resolves or fails.
  const slots = {}, wanted = ["page", "fonts", "guestbook"];
  wanted.forEach((name) => { slots[name] = new Promise((res) => { slots[name + "_done"] = res; }); });
  const track = (name, promise) => { const done = slots[name + "_done"]; if (done) Promise.resolve(promise).then(done, done); };
  window.Preload.track = track;

  track("page", new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true }))));
  track("fonts", (document.fonts && document.fonts.ready) || Promise.resolve());

  const wait = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
  (async () => {
    await Promise.race([Promise.all(wanted.map((n) => slots[n])), wait(MAX - (performance.now() - t0))]);
    await wait(MIN - (performance.now() - t0));
    el.classList.add("done");
    await wait(950); // let the explosion and fade finish (also covers reduced motion, where transitions are skipped)
    el.remove(); root.classList.remove("preloading"); release();
    window.dispatchEvent(new Event("preloaded"));
  })();
})();
