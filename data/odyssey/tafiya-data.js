/* ============================================================================
   Haaraya — Tafiya reader data layer
   ----------------------------------------------------------------------------
   • TAFIYA_CATALOG       — bundled fallback catalogue (used until a Supabase
                            list endpoint is available)
   • TafiyaData.getPackage(code) — fetches a book package live from Supabase
     (get_book_package RPC).
   Ported from the Haaraya/tafiya-web-reader-test reader. Plain JS — no build.
   ============================================================================ */
(function () {
  "use strict";

  const SUPABASE_URL = "https://laihhrkxnxzohaiiisou.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY";
  const STORAGE_BUCKET = "book-assets";

  const DEFAULT_LOGOS = {
    tafiya: "assets/logos/tafiya.png",
    haaraya_literacy: "assets/logos/haaraya_literacy.png",
    haaraya_education: "assets/logos/haaraya_education.png",
  };

  const TAFIYA_CATALOG = [
  {
    "book_code": "T1-C-01",
    "code": "T1-C-01",
    "title": "Colours All Around",
    "strand": "Tafiya",
    "level": 1,
    "tafiya_name": "Tashi",
    "level_name": "Tashi",
    "book_type": "Concept",
    "cover_image_path": "books/T1-C-01/T1-C-01_FC.png",
    "href": "reader/index.html?book=T1-C-01",
    "reader_url": "reader/index.html?book=T1-C-01",
    "thumbnail_image_path": "thumbnails/covers/T1-C-01_On_In_Under_fc.jpg"
  },
  {
    "book_code": "T1-C-02",
    "code": "T1-C-02",
    "title": "Big and Small",
    "strand": "Tafiya",
    "level": 1,
    "tafiya_name": "Tashi",
    "level_name": "Tashi",
    "book_type": "Concept",
    "cover_image_path": "books/T1-C-02/T1-C-02_FC.png",
    "href": "reader/index.html?book=T1-C-02",
    "reader_url": "reader/index.html?book=T1-C-02",
    "thumbnail_image_path": "thumbnails/covers/T1-C-02_Big_and_Small_fc.jpg"
  },
  {
    "book_code": "T1-F-01",
    "code": "T1-F-01",
    "title": "Naza at the Market",
    "strand": "Tafiya",
    "level": 1,
    "tafiya_name": "Tashi",
    "level_name": "Tashi",
    "book_type": "Fiction",
    "cover_image_path": "books/T1-F-01/T1-F-01_FC.png",
    "href": "reader/index.html?book=T1-F-01",
    "reader_url": "reader/index.html?book=T1-F-01",
    "thumbnail_image_path": "thumbnails/covers/T1-F-01_Naza_at_the_Market_fc.jpg"
  },
  {
    "book_code": "T1-F-02",
    "code": "T1-F-02",
    "title": "The Red Bag",
    "strand": "Tafiya",
    "level": 1,
    "tafiya_name": "Tashi",
    "level_name": "Tashi",
    "book_type": "Fiction",
    "cover_image_path": "books/T1-F-02/T1-F-02_FC.png",
    "href": "reader/index.html?book=T1-F-02",
    "reader_url": "reader/index.html?book=T1-F-02",
    "thumbnail_image_path": "thumbnails/covers/T1-F-02_Adas_Big_Bag_fc.jpg"
  },
  {
    "book_code": "T1-F-03",
    "code": "T1-F-03",
    "title": "Emeka Can Run",
    "strand": "Tafiya",
    "level": 1,
    "tafiya_name": "Tashi",
    "level_name": "Tashi",
    "book_type": "Fiction",
    "cover_image_path": "books/T1-F-03/T1-F-03_FC.png",
    "href": "reader/index.html?book=T1-F-03",
    "reader_url": "reader/index.html?book=T1-F-03",
    "thumbnail_image_path": "thumbnails/covers/T1-F-03_Emeka_Can_Run_fc.jpg"
  },
  {
    "book_code": "T1-F-04",
    "code": "T1-F-04",
    "title": "Ada and the Goat",
    "strand": "Tafiya",
    "level": 1,
    "tafiya_name": "Tashi",
    "level_name": "Tashi",
    "book_type": "Fiction",
    "cover_image_path": "books/T1-F-04/T1-F-04_FC.png",
    "href": "reader/index.html?book=T1-F-04",
    "reader_url": "reader/index.html?book=T1-F-04",
    "thumbnail_image_path": "thumbnails/covers/T1-F-04_Ada_and_the_Goat_fc.jpg"
  },
  {
    "book_code": "T1-F-05",
    "code": "T1-F-05",
    "title": "The Big Pot",
    "strand": "Tafiya",
    "level": 1,
    "tafiya_name": "Tashi",
    "level_name": "Tashi",
    "book_type": "Fiction",
    "cover_image_path": "books/T1-F-05/T1-F-05_FC.png",
    "href": "reader/index.html?book=T1-F-05",
    "reader_url": "reader/index.html?book=T1-F-05",
    "thumbnail_image_path": "thumbnails/covers/T1-F-05_The_Big_Pot_fc.jpg"
  },
  {
    "book_code": "T2-C-01",
    "code": "T2-C-01",
    "title": "One, Two, Three at the Market",
    "strand": "Tafiya",
    "level": 2,
    "tafiya_name": "Mataki",
    "level_name": "Mataki",
    "book_type": "Concept",
    "cover_image_path": "books/T2-C-01/T2-C-01_FC.png",
    "href": "reader/index.html?book=T2-C-01",
    "reader_url": "reader/index.html?book=T2-C-01",
    "thumbnail_image_path": "thumbnails/covers/T2-C-01_One_Two_Three_at_the_Market_fc.jpg"
  },
  {
    "book_code": "T2-C-02",
    "code": "T2-C-02",
    "title": "Where Is It?",
    "strand": "Tafiya",
    "level": 2,
    "tafiya_name": "Mataki",
    "level_name": "Mataki",
    "book_type": "Concept",
    "cover_image_path": "books/T2-C-02/T2-C-02_FC.png",
    "href": "reader/index.html?book=T2-C-02",
    "reader_url": "reader/index.html?book=T2-C-02",
    "thumbnail_image_path": "thumbnails/covers/T2-C-02_Where_Is_It_fc.jpg"
  },
  {
    "book_code": "T2-F-01",
    "code": "T2-F-01",
    "title": "Kemi Goes to School",
    "strand": "Tafiya",
    "level": 2,
    "tafiya_name": "Mataki",
    "level_name": "Mataki",
    "book_type": "Fiction",
    "cover_image_path": "books/T2-F-01/T2-F-01_FC.png",
    "href": "reader/index.html?book=T2-F-01",
    "reader_url": "reader/index.html?book=T2-F-01",
    "thumbnail_image_path": "thumbnails/covers/T2-F-01_Kemi_Goes_to_School_fc.jpg"
  },
  {
    "book_code": "T2-F-02",
    "code": "T2-F-02",
    "title": "He Ran, She Ran",
    "strand": "Tafiya",
    "level": 2,
    "tafiya_name": "Mataki",
    "level_name": "Mataki",
    "book_type": "Fiction",
    "cover_image_path": "books/T2-F-02/T2-F-02_FC.png",
    "href": "reader/index.html?book=T2-F-02",
    "reader_url": "reader/index.html?book=T2-F-02",
    "thumbnail_image_path": "thumbnails/covers/T2-F-02_He_Ran_She_Ran_fc.jpg"
  },
  {
    "book_code": "T2-F-03",
    "code": "T2-F-03",
    "title": "My Mother's Fan",
    "strand": "Tafiya",
    "level": 2,
    "tafiya_name": "Mataki",
    "level_name": "Mataki",
    "book_type": "Fiction",
    "cover_image_path": "books/T2-F-03/T2-F-03_FC.png",
    "href": "reader/index.html?book=T2-F-03",
    "reader_url": "reader/index.html?book=T2-F-03",
    "thumbnail_image_path": "thumbnails/covers/T2-F-03_My_Mothers_Fan_fc.jpg"
  },
  {
    "book_code": "T2-F-04",
    "code": "T2-F-04",
    "title": "Amina's Kite",
    "strand": "Tafiya",
    "level": 2,
    "tafiya_name": "Mataki",
    "level_name": "Mataki",
    "book_type": "Fiction",
    "cover_image_path": "books/T2-F-04/T2-F-04_FC.png",
    "href": "reader/index.html?book=T2-F-04",
    "reader_url": "reader/index.html?book=T2-F-04",
    "thumbnail_image_path": "thumbnails/covers/T2-F-04_Aminas_Kite_fc.jpg"
  },
  {
    "book_code": "T2-F-05",
    "code": "T2-F-05",
    "title": "The Wet Mat",
    "strand": "Tafiya",
    "level": 2,
    "tafiya_name": "Mataki",
    "level_name": "Mataki",
    "book_type": "Fiction",
    "cover_image_path": "books/T2-F-05/T2-F-05_FC.png",
    "href": "reader/index.html?book=T2-F-05",
    "reader_url": "reader/index.html?book=T2-F-05",
    "thumbnail_image_path": "thumbnails/covers/T2-F-05_The_Wet_Mat_fc.jpg"
  },
  {
    "book_code": "T3-F-01",
    "code": "T3-F-01",
    "title": "Ada and the Lost Hen",
    "strand": "Tafiya",
    "level": 3,
    "tafiya_name": "Hanya",
    "level_name": "Hanya",
    "book_type": "Fiction",
    "cover_image_path": "books/T3-F-01/T3-F-01_FC.png",
    "href": "reader/index.html?book=T3-F-01",
    "reader_url": "reader/index.html?book=T3-F-01",
    "thumbnail_image_path": "thumbnails/covers/T3-F-01_Ada_and_the_Lost_Hen_fc.jpg"
  },
  {
    "book_code": "T3-F-02",
    "code": "T3-F-02",
    "title": "Bolu Wants a Drum",
    "strand": "Tafiya",
    "level": 3,
    "tafiya_name": "Hanya",
    "level_name": "Hanya",
    "book_type": "Fiction",
    "cover_image_path": "books/T3-F-02/T3-F-02_FC.png",
    "href": "reader/index.html?book=T3-F-02",
    "reader_url": "reader/index.html?book=T3-F-02",
    "thumbnail_image_path": "thumbnails/covers/T3-F-02_Bolu_Wants_a_Drum_fc.jpg"
  },
  {
    "book_code": "T3-F-03",
    "code": "T3-F-03",
    "title": "The River Road",
    "strand": "Tafiya",
    "level": 3,
    "tafiya_name": "Hanya",
    "level_name": "Hanya",
    "book_type": "Fiction",
    "cover_image_path": "books/T3-F-03/T3-F-03_FC.png",
    "href": "reader/index.html?book=T3-F-03",
    "reader_url": "reader/index.html?book=T3-F-03",
    "thumbnail_image_path": "thumbnails/covers/T3-F-03_The_River_Road_fc.jpg"
  },
  {
    "book_code": "T3-F-04",
    "code": "T3-F-04",
    "title": "Naza and the Rain",
    "strand": "Tafiya",
    "level": 3,
    "tafiya_name": "Hanya",
    "level_name": "Hanya",
    "book_type": "Fiction",
    "cover_image_path": "books/T3-F-04/T3-F-04_FC.png",
    "href": "reader/index.html?book=T3-F-04",
    "reader_url": "reader/index.html?book=T3-F-04",
    "thumbnail_image_path": "thumbnails/covers/T3-F-04_Naza_and_the_Rain_fc.jpg"
  },
  {
    "book_code": "T3-F-05",
    "code": "T3-F-05",
    "title": "Bisi and the Bell",
    "strand": "Tafiya",
    "level": 3,
    "tafiya_name": "Hanya",
    "level_name": "Hanya",
    "book_type": "Fiction",
    "cover_image_path": "books/T3-F-05/T3-F-05_FC.png",
    "href": "reader/index.html?book=T3-F-05",
    "reader_url": "reader/index.html?book=T3-F-05",
    "thumbnail_image_path": "thumbnails/covers/T3-F-05_Bisi_and_the_Bell_fc.jpg"
  },
  {
    "book_code": "T3-FT-01",
    "code": "T3-FT-01",
    "title": "Why the Tortoise Has a Cracked Shell",
    "strand": "Tafiya",
    "level": 3,
    "tafiya_name": "Hanya",
    "level_name": "Hanya",
    "book_type": "Folktale",
    "cover_image_path": "books/T3-FT-01/T3-FT-01_FC.png",
    "href": "reader/index.html?book=T3-FT-01",
    "reader_url": "reader/index.html?book=T3-FT-01",
    "thumbnail_image_path": "thumbnails/covers/T3-FT-01_Why_the_Tortoise_Has_a_Cracked_Shell_fc.jpg"
  },
  {
    "book_code": "T3-NF-01",
    "code": "T3-NF-01",
    "title": "How We Get Water",
    "strand": "Tafiya",
    "level": 3,
    "tafiya_name": "Hanya",
    "level_name": "Hanya",
    "book_type": "Non-Fiction",
    "cover_image_path": "books/T3-NF-01/T3-NF-01_FC.png",
    "href": "reader/index.html?book=T3-NF-01",
    "reader_url": "reader/index.html?book=T3-NF-01",
    "thumbnail_image_path": "thumbnails/covers/T3-NF-01_How_We_Get_Water_fc.jpg"
  },
  {
    "book_code": "T3-NF-02",
    "code": "T3-NF-02",
    "title": "What Farmers Grow",
    "strand": "Tafiya",
    "level": 3,
    "tafiya_name": "Hanya",
    "level_name": "Hanya",
    "book_type": "Non-Fiction",
    "cover_image_path": "books/T3-NF-02/T3-NF-02_FC.png",
    "href": "reader/index.html?book=T3-NF-02",
    "reader_url": "reader/index.html?book=T3-NF-02",
    "thumbnail_image_path": "thumbnails/covers/T3-NF-02_What_Farmers_Grow_fc.jpg"
  },
  {
    "book_code": "T4-F-01",
    "code": "T4-F-01",
    "title": "Emeka's Big Day",
    "strand": "Tafiya",
    "level": 4,
    "tafiya_name": "Tafiya",
    "level_name": "Tafiya",
    "book_type": "Fiction",
    "cover_image_path": "books/T4-F-01/T4-F-01_FC.png",
    "href": "reader/index.html?book=T4-F-01",
    "reader_url": "reader/index.html?book=T4-F-01",
    "thumbnail_image_path": "thumbnails/covers/T4-F-01_Emekas_Big_Day_fc.jpg"
  },
  {
    "book_code": "T4-F-02",
    "code": "T4-F-02",
    "title": "Who Has the Drum?",
    "strand": "Tafiya",
    "level": 4,
    "tafiya_name": "Tafiya",
    "level_name": "Tafiya",
    "book_type": "Fiction",
    "cover_image_path": "books/T4-F-02/T4-F-02_FC.png",
    "href": "reader/index.html?book=T4-F-02",
    "reader_url": "reader/index.html?book=T4-F-02",
    "thumbnail_image_path": "thumbnails/covers/T4-F-02_Who_Has_the_Drum_fc.jpg"
  },
  {
    "book_code": "T4-F-03",
    "code": "T4-F-03",
    "title": "Amina Goes to the Farm",
    "strand": "Tafiya",
    "level": 4,
    "tafiya_name": "Tafiya",
    "level_name": "Tafiya",
    "book_type": "Fiction",
    "cover_image_path": "books/T4-F-03/T4-F-03_FC.png",
    "href": "reader/index.html?book=T4-F-03",
    "reader_url": "reader/index.html?book=T4-F-03",
    "thumbnail_image_path": "thumbnails/covers/T4-F-03_Amina_Goes_to_the_Farm_fc.jpg"
  },
  {
    "book_code": "T4-F-04",
    "code": "T4-F-04",
    "title": "Come to the River",
    "strand": "Tafiya",
    "level": 4,
    "tafiya_name": "Tafiya",
    "level_name": "Tafiya",
    "book_type": "Fiction",
    "cover_image_path": "books/T4-F-04/T4-F-04_FC.png",
    "href": "reader/index.html?book=T4-F-04",
    "reader_url": "reader/index.html?book=T4-F-04",
    "thumbnail_image_path": "thumbnails/covers/T4-F-04_Come_to_the_River_fc.jpg"
  },
  {
    "book_code": "T4-F-05",
    "code": "T4-F-05",
    "title": "Ada and the Crab",
    "strand": "Tafiya",
    "level": 4,
    "tafiya_name": "Tafiya",
    "level_name": "Tafiya",
    "book_type": "Fiction",
    "cover_image_path": "books/T4-F-05/T4-F-05_FC.png",
    "href": "reader/index.html?book=T4-F-05",
    "reader_url": "reader/index.html?book=T4-F-05",
    "thumbnail_image_path": "thumbnails/covers/T4-F-05_Ada_and_the_Crab_fc.jpg"
  },
  {
    "book_code": "T4-FT-01",
    "code": "T4-FT-01",
    "title": "How Anansi Got All the Stories",
    "strand": "Tafiya",
    "level": 4,
    "tafiya_name": "Tafiya",
    "level_name": "Tafiya",
    "book_type": "Folktale",
    "cover_image_path": "books/T4-FT-01/T4-FT-01_FC.png",
    "href": "reader/index.html?book=T4-FT-01",
    "reader_url": "reader/index.html?book=T4-FT-01",
    "thumbnail_image_path": "thumbnails/covers/T4-FT-01_How_Anansi_Got_All_the_Stories_fc.jpg"
  },
  {
    "book_code": "T4-NF-01",
    "code": "T4-NF-01",
    "title": "How We Cook Jollof Rice",
    "strand": "Tafiya",
    "level": 4,
    "tafiya_name": "Tafiya",
    "level_name": "Tafiya",
    "book_type": "Non-Fiction",
    "cover_image_path": "books/T4-NF-01/T4-NF-01_FC.png",
    "href": "reader/index.html?book=T4-NF-01",
    "reader_url": "reader/index.html?book=T4-NF-01",
    "thumbnail_image_path": "thumbnails/covers/T4-NF-01_How_We_Cook_Jollof_Rice_fc.jpg"
  },
  {
    "book_code": "T4-NF-02",
    "code": "T4-NF-02",
    "title": "The Keke Napep",
    "strand": "Tafiya",
    "level": 4,
    "tafiya_name": "Tafiya",
    "level_name": "Tafiya",
    "book_type": "Non-Fiction",
    "cover_image_path": "books/T4-NF-02/T4-NF-02_FC.png",
    "href": "reader/index.html?book=T4-NF-02",
    "reader_url": "reader/index.html?book=T4-NF-02",
    "thumbnail_image_path": "thumbnails/covers/T4-NF-02_The_Keke_Napep_fc.jpg"
  }
];

  // Resolve an image path to a usable URL.
  //  • assets/… and thumbnails/… are always bundled with the app → use as-is.
  //  • For a bundled (local) package, every path is already a real project path.
  //  • For a live Supabase package, relative paths point inside the storage
  //    bucket and get the public-bucket prefix.
  function assetUrl(path, local) {
    if (!path) return "";
    const raw = String(path).trim();
    if (!raw) return "";
    if (/^(https?:|data:|blob:)/.test(raw)) return raw;
    if (/^(assets\/|thumbnails\/)/.test(raw)) return raw; // always bundled
    if (local) return raw;                                // bundled sample book
    if (raw.startsWith("/storage/v1/object/public/")) return SUPABASE_URL + raw;
    let clean = raw.replace(/^\/+/, "");
    if (clean.startsWith(STORAGE_BUCKET + "/")) clean = clean.slice(STORAGE_BUCKET.length + 1);
    clean = encodeURI(clean).replace(/#/g, "%23");
    return SUPABASE_URL + "/storage/v1/object/public/" + STORAGE_BUCKET + "/" + clean;
  }

  function normalizeBookPackage(data) {
    let pkg = data;
    if (Array.isArray(pkg)) pkg = pkg[0];
    if (pkg && pkg.get_book_package) pkg = pkg.get_book_package;
    if (pkg && pkg.data && pkg.data.book) pkg = pkg.data;
    if (!pkg || typeof pkg !== "object") {
      throw new Error("Supabase returned an empty or invalid book package.");
    }
    pkg.book = pkg.book || {};
    pkg.pages = Array.isArray(pkg.pages) ? pkg.pages : [];
    pkg.skills = pkg.skills || {};
    pkg.assets = pkg.assets || {};
    pkg.assets.logos = Object.assign({}, DEFAULT_LOGOS, pkg.assets.logos || {});
    return pkg;
  }

  async function fetchBookPackage(bookCode) {
    const endpoint = SUPABASE_URL + "/rest/v1/rpc/get_book_package";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ input_book_code: bookCode }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error("Supabase RPC failed: " + response.status + " " + response.statusText + ". " + detail);
    }
    return normalizeBookPackage(await response.json());
  }

  // Books load live from Supabase (auto-includes any newly added title).
  async function getPackage(bookCode) {
    return fetchBookPackage(bookCode);
  }

  // ---- Catalogue (auto-growth ready) ----
  // Try a Supabase list RPC first so new books appear automatically once the
  // backend exposes one; fall back to the bundled catalogue meanwhile.
  var _catalogCache = null;
  var LIST_RPCS = ["get_book_list", "get_books", "list_books", "get_catalog"];
  function normalizeCatalog(rows) {
    if (!Array.isArray(rows)) rows = (rows && (rows.books || rows.data)) || [];
    return rows.filter(function (b) { return b && (b.book_code || b.code); });
  }
  async function fetchCatalog() {
    for (var i = 0; i < LIST_RPCS.length; i++) {
      try {
        var r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + LIST_RPCS[i], {
          method: "POST",
          headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json", Accept: "application/json" },
          body: "{}",
        });
        if (r.ok) { var rows = normalizeCatalog(await r.json()); if (rows.length) return rows; }
      } catch (e) { /* try next */ }
    }
    return null; // no list endpoint yet
  }
  async function loadCatalog() {
    if (_catalogCache) return _catalogCache.slice();
    var live = await fetchCatalog();
    _catalogCache = (live && live.length) ? live : TAFIYA_CATALOG.slice();
    return _catalogCache.slice();
  }
  function getCatalog() { return (_catalogCache || TAFIYA_CATALOG).slice(); }
  function codeOf(b) { return (b && (b.book_code || b.code)) || ""; }
  function getCatalogEntry(code) { return (_catalogCache || TAFIYA_CATALOG).find(function (b) { return codeOf(b) === code; }) || null; }

  // ---- Free samples: first N books in catalogue order ----
  var SAMPLE_LIMIT = 6;
  function levelNum(b) { var m = String(b.level || "").match(/\d+/); return m ? +m[0] : (typeof b.level === "number" ? b.level : 999); }
  // Strand taxonomy — resolve a book to its UI strand key, and rank strands in
  // pedagogical reading order so the catalogue sequences sensibly.
  var STRAND_UI_ORDER = ["hafwas", "soundables", "soundables-plus", "tafiya", "tafiya-nonfiction", "folktale", "poetry", "duniya", "stamina", "stamina-nonfiction"];
  var STRAND_UI_BY_NAME = {
    "Hafwas": "hafwas", "Soundables": "soundables", "Soundables+": "soundables-plus",
    "Tafiya Fiction": "tafiya", "Tafiya Non-Fiction": "tafiya-nonfiction", "Tafiya Folktale": "folktale",
    "Tafiya Poetry": "poetry", "Tafiya Duniya": "duniya", "Stamina Fiction": "stamina", "Stamina Non-Fiction": "stamina-nonfiction",
  };
  function strandKeyOf(b) {
    var name = String((b && b.strand) || "").trim();
    if (STRAND_UI_BY_NAME[name]) return STRAND_UI_BY_NAME[name];
    var t = String((b && b.book_type) || "").toLowerCase();
    if (t.indexOf("hafwas") >= 0) return "hafwas";
    if (t.indexOf("soundables+") >= 0 || t.indexOf("soundables plus") >= 0) return "soundables-plus";
    if (t.indexOf("soundable") >= 0) return "soundables";
    if (t.indexOf("stamina") >= 0) return t.indexOf("non") >= 0 ? "stamina-nonfiction" : "stamina";
    if (t.indexOf("duniya") >= 0) return "duniya";
    if (t.indexOf("poet") >= 0) return "poetry";
    if (t.indexOf("folktale") >= 0) return "folktale";
    if (t.indexOf("non") >= 0) return "tafiya-nonfiction";
    return "tafiya";
  }
  function strandRank(b) { var i = STRAND_UI_ORDER.indexOf(strandKeyOf(b)); return i < 0 ? 99 : i; }
  // Programme sequence = the numeric suffix of the book code (e.g. S-01-010 → 10,
  // H-01-040 → 40). Within a level this interleaves the strands in teaching order.
  function seqNum(b) { var m = String(codeOf(b)).split("-").pop(); var n = parseInt(m, 10); return isNaN(n) ? 999999 : n; }
  function sortedCatalog(list) {
    return (list || getCatalog()).filter(function (b) { return codeOf(b); }).slice().sort(function (a, b) {
      return (levelNum(a) - levelNum(b)) || (seqNum(a) - seqNum(b)) || codeOf(a).localeCompare(codeOf(b), undefined, { numeric: true });
    });
  }
  function freeCodes(list) { return sortedCatalog(list).slice(0, SAMPLE_LIMIT).map(codeOf); }
  function isFree(code, list) { return freeCodes(list).indexOf(code) >= 0; }

  // ---- Reading progress (per child, localStorage) ----
  function childId() { return (window.HaarayaSession && HaarayaSession.childId && HaarayaSession.childId()) || 1; }
  function progKey(cid) { return "haaraya:reading:" + (cid || childId()); }
  function readProgress(cid) { try { return JSON.parse(localStorage.getItem(progKey(cid)) || "{}") || {}; } catch (e) { return {}; } }
  function writeProgress(cid, obj) { try { localStorage.setItem(progKey(cid), JSON.stringify(obj)); } catch (e) {} }
  function emit() { try { window.dispatchEvent(new Event("haaraya:reading")); } catch (e) {} }
  function recordOpen(code, total) {
    if (!code) return; var cid = childId(); var p = readProgress(cid); var e = p[code] || {};
    e.opened = true; e.startedAt = e.startedAt || Date.now(); e.lastAt = Date.now(); if (total) e.total = total;
    p[code] = e; writeProgress(cid, p); emit();
  }
  function recordProgress(code, screen, total) {
    if (!code) return; var cid = childId(); var p = readProgress(cid); var e = p[code] || {};
    e.opened = true; e.lastScreen = screen; e.total = total || e.total; e.lastAt = Date.now();
    p[code] = e; writeProgress(cid, p);
  }
  function recordComplete(code) {
    if (!code) return; var cid = childId(); var p = readProgress(cid); var e = p[code] || {};
    e.opened = true; e.completed = true; e.completedAt = e.completedAt || Date.now(); e.lastAt = Date.now();
    p[code] = e; writeProgress(cid, p); emit();
  }
  function isCompleted(code, cid) { var e = readProgress(cid)[code]; return !!(e && e.completed); }
  function progressOf(code, cid) { return readProgress(cid)[code] || null; }
  function completedCodes(cid) { var p = readProgress(cid); return Object.keys(p).filter(function (c) { return p[c].completed; }); }
  function inProgressCodes(cid) { var p = readProgress(cid); return Object.keys(p).filter(function (c) { return p[c].opened && !p[c].completed; }); }

  window.TafiyaData = {
    SAMPLE_LIMIT: SAMPLE_LIMIT,
    loadCatalog: loadCatalog,
    getCatalog: getCatalog,
    getCatalogEntry: getCatalogEntry,
    getPackage: getPackage,
    assetUrl: assetUrl,
    sortedCatalog: sortedCatalog,
    strandKeyOf: strandKeyOf,
    strandRank: strandRank,
    freeCodes: freeCodes,
    isFree: isFree,
    levelNum: levelNum,
    recordOpen: recordOpen,
    recordProgress: recordProgress,
    recordComplete: recordComplete,
    isCompleted: isCompleted,
    progressOf: progressOf,
    completedCodes: completedCodes,
    inProgressCodes: inProgressCodes,
    DEFAULT_LOGOS: DEFAULT_LOGOS,
  };
})();
