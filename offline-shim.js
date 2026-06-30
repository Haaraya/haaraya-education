/* Offline asset resolver — rewrites <img src="assets/…"> to inlined data URIs.
   Populated by offline-assets-*.js. Works in the bundled standalone file where
   the assets/ folder is not present. */
window.__ASSETS = window.__ASSETS || {};
(function () {
  function resolve(src) {
    if (!src || src.indexOf("data:") === 0) return null;
    var i = src.indexOf("assets/");
    if (i < 0) return null;
    var key = src.slice(i);
    var hit = window.__ASSETS[key];
    return hit && hit !== src ? hit : null;
  }
  function fix(img) {
    var cur = img.getAttribute("src");
    var r = resolve(cur);
    if (r) img.setAttribute("src", r);
  }
  function sweep(root) {
    if (root && root.querySelectorAll) {
      var list = root.querySelectorAll("img");
      for (var i = 0; i < list.length; i++) fix(list[i]);
    }
  }
  var mo = new MutationObserver(function (muts) {
    for (var k = 0; k < muts.length; k++) {
      var m = muts[k];
      if (m.type === "attributes" && m.target.tagName === "IMG") fix(m.target);
      if (m.addedNodes) {
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 1) { if (n.tagName === "IMG") fix(n); sweep(n); }
        }
      }
    }
  });
  function start() {
    sweep(document);
    if (document.documentElement) {
      mo.observe(document.documentElement, {
        subtree: true, childList: true, attributes: true, attributeFilter: ["src"],
      });
    }
  }
  // Run immediately (the bundler may have already fired DOMContentLoaded) and
  // again on DOMContentLoaded for the non-bundled case.
  start();
  document.addEventListener("DOMContentLoaded", start);
  // Re-sweep periodically for the first few seconds to catch late renders.
  var n = 0, t = setInterval(function () { sweep(document); if (++n > 20) clearInterval(t); }, 250);
})();
