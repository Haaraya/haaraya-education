/* ============================================================
   Haaraya — error monitoring (Sentry)
   Paste the DSN from sentry.io → Project settings → Client Keys.
   Empty DSN = monitoring off (the site works exactly as before).

   Child privacy: no user identity, no IPs, no typed text or page
   content leaves the browser — only the error, page and browser.
   ============================================================ */
(function () {
  var DSN = "";            // e.g. "https://abc123@o456.ingest.sentry.io/789"
  var RELEASE = "haaraya@2026-09-29";
  if (!DSN || /^(localhost|127\.)/.test(location.hostname) || location.protocol === "file:") return;

  var s = document.createElement("script");
  s.src = "https://browser.sentry-cdn.com/8.33.0/bundle.min.js";
  s.crossOrigin = "anonymous";
  s.onload = function () {
    if (!window.Sentry) return;
    window.Sentry.init({
      dsn: DSN,
      release: RELEASE,
      environment: location.hostname,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection captured", "Load failed", "NetworkError"],
      beforeBreadcrumb: function (b) {
        if (b.category === "ui.input") return null;                       // never record typing
        if (b.category === "console" && b.level !== "error") return null;
        return b;
      },
      beforeSend: function (ev) {
        delete ev.user;
        if (ev.request) { delete ev.request.cookies; delete ev.request.headers; if (ev.request.url) ev.request.url = ev.request.url.split("?")[0]; }
        var page = decodeURIComponent(location.pathname.split("/").pop() || "index");
        ev.tags = Object.assign({}, ev.tags, { page: page, screen: location.hash.replace(/^#/, "") || "-" });
        return ev;
      }
    });
    // The Supabase layer failing is the one outage that silently shows placeholder content.
    setTimeout(function () {
      if (!window.HaarayaSupabase && document.querySelector('script[src*="supabase-client.js"]')) {
        window.Sentry.captureMessage("HaarayaSupabase missing after load — supabase-client.js failed", "error");
      }
    }, 8000);
  };
  document.head.appendChild(s);
})();
