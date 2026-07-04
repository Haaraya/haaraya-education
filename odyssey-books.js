/* ============================================================
   Haaraya — Odyssey book registry
   ------------------------------------------------------------
   The 100 Book Odyssey is a curated selection. Only books listed
   here show the "Write your Captain's Log" (Shipmate Scribe) step
   when a child finishes them in the reader — so ordinary Tafiya /
   Hafwas / Soundables books are NOT mixed into the Odyssey.

   HOW TO ADD A BOOK TO THE ODYSSEY
   --------------------------------
   Put the book's CODE (exactly as it appears in the library, e.g.
   "H-01-04", "TF-12-210", "S-1-01") into ODYSSEY_BOOKS below.
   Optionally give it its Odyssey number (1..100) so the log reads
   "Book 12". Add books here as they're ready — nothing else needed.

   Example:
     var ODYSSEY_BOOKS = {
       "H-01-04": 1,
       "TF-12-210": 2,
       "S-1-01": 3,
     };
   ============================================================ */
(function () {
  "use strict";

  // code → Odyssey number (or true if you don't want a number yet).
  // EMPTY for now: the Captain's Log will not appear in the reader
  // until you add the books that are ready for the Odyssey.
  var ODYSSEY_BOOKS = {
    // "H-01-04": 1,
    // "TF-12-210": 2,
  };

  function norm(code) { return String(code || "").trim().toUpperCase(); }

  var INDEX = {};
  Object.keys(ODYSSEY_BOOKS).forEach(function (k) { INDEX[norm(k)] = ODYSSEY_BOOKS[k]; });

  window.HaarayaOdyssey = {
    // Is this book part of the Odyssey?
    has: function (code) { return Object.prototype.hasOwnProperty.call(INDEX, norm(code)); },
    // Its Odyssey number (1..100), or null.
    number: function (code) {
      var v = INDEX[norm(code)];
      return typeof v === "number" ? v : null;
    },
    count: function () { return Object.keys(INDEX).length; },
    codes: function () { return Object.keys(INDEX); },
  };
})();
