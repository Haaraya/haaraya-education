/* ============================================================
   Odyssey standalone nav — behavior for the shared Haaraya nav
   (Library dropdown + mobile burger). Markup mirrors the Tafiya
   Nav component; this just wires the interactions.
   ============================================================ */
(function () {
  function init(nav) {
    if (!nav || nav.dataset.navReady) return;
    nav.dataset.navReady = "1";

    // ---- Library dropdown ----
    const group = nav.querySelector(".nav-group");
    if (group) {
      const trigger = group.querySelector(".nav-group-trigger");
      const setOpen = (open) => {
        group.classList.toggle("open", open);
        if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
      };
      trigger && trigger.addEventListener("click", (e) => {
        e.preventDefault();
        setOpen(!group.classList.contains("open"));
      });
      document.addEventListener("mousedown", (e) => {
        if (!e.target.closest(".nav-group")) setOpen(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setOpen(false);
      });
    }

    // ---- Mobile burger ----
    const burger = nav.querySelector(".nav-burger");
    const mobile = nav.querySelector(".nav-mobile");
    const setMenu = (open) => {
      nav.classList.toggle("menu-open", open);
      if (mobile) mobile.classList.toggle("open", open);
      if (burger) {
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      }
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger && burger.addEventListener("click", () => {
      setMenu(!nav.classList.contains("menu-open"));
    });
    // close menu when a mobile link is tapped
    nav.querySelectorAll(".nav-mobile a").forEach((a) => {
      a.addEventListener("click", () => setMenu(false));
    });
  }

  document.querySelectorAll("nav.nav").forEach(init);

  // Cross-page handoff into the app's hash router: a raw #hash is cleared on
  // load, so stash the target screen in sessionStorage the way the app expects.
  document.querySelectorAll("[data-landing]").forEach((a) => {
    a.addEventListener("click", (e) => {
      try { sessionStorage.setItem("haaraya:landing", a.getAttribute("data-landing")); } catch (err) {}
    });
  });

  // Publisher mark hover/tap expand (parity with the app)
  document.querySelectorAll(".publisher-mark").forEach((pm) => {
    pm.addEventListener("click", () => pm.classList.toggle("expanded"));
  });

  // ---- Access gate: Odyssey is free but requires a signed-in Haaraya account ----
  function syncGate() {
    // TEMP BYPASS: gate disabled so the page can be previewed without signing in.
    // Re-enable by deleting the next two lines.
    const hasGateEl = document.querySelector(".odx-gate");
    if (hasGateEl) { document.body.classList.remove("odx-locked"); return; }
    const signedIn = window.HaarayaSession && window.HaarayaSession.isSignedIn && window.HaarayaSession.isSignedIn();
    const hasGate = document.querySelector(".odx-gate");
    if (!hasGate) return;
    document.body.classList.toggle("odx-locked", !signedIn);
  }
  syncGate();
  window.addEventListener("haaraya:session", syncGate);
  // Re-check when returning to the page via back/forward cache after signing in.
  window.addEventListener("pageshow", syncGate);
  window.addEventListener("focus", syncGate);
})();
