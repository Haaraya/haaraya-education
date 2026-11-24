/* ============================================================
   Haaraya — book art version, per level
   ------------------------------------------------------------
   When a level's book pictures are replaced in Supabase storage,
   raise that level's number here. Every picture link for that
   level gets ?v=<number>, so browsers and the delivery network
   fetch the new files at once instead of showing saved copies.
   Levels not listed use no tag. Removing a line is always safe.
   ============================================================ */
(function () {
  var ART_VERSION = {
    "01": 2,   // Level 1 art replaced 23 Nov 2026
  };
  window.haarayaArtUrl = function (url) {
    if (!url || typeof url !== "string" || url.indexOf("/book-assets/books/") < 0 || /[?&]v=/.test(url)) return url;
    var m = url.match(/\/books\/[A-Za-z]+-(\d\d)-/);
    var v = m && ART_VERSION[m[1]];
    return v ? url + (url.indexOf("?") < 0 ? "?" : "&") + "v=" + v : url;
  };
})();
