/* ============================================================================
   Haaraya — Print a book (school staff, Print add-on).
   Lays out one book from the main library, using the main reader's own pages:
   front cover, About this book, every story page, back cover. Default is a
   folded booklet (two pages per side, both sides, imposed so the stack folds
   and staples into a book); one page per sheet is the alternative. A4 or US
   Letter. Printing only: the page never offers a PDF download.

   Every print is traceable. issue_print_code() (Supabase) checks the person is
   a teacher or school admin at a school with the 'print' add-on, records the
   print, and returns a print code and the school's fixed code. They appear:
     1. in the footer of every sheet,
     2. along the inner edge of every sheet,
     3. in the small print of the back cover,
     4. as a small mark drawn into the picture on one story page (page number
        = book level, last page if the book is shorter), bottom-right corner.
   ============================================================================ */
const { useState: useStatePB, useEffect: useEffectPB, useRef: useRefPB } = React;

const PB_PAPER = { a4: { label: "A4", css: "A4 portrait" }, letter: { label: "US Letter", css: "letter portrait" } };
const pbBook = () => new URLSearchParams(location.search).get("book") || "";
const pbToday = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const pbLevel = b => { const m = String((b && b.level) || "").match(/\d+/); return m ? Number(m[0]) : 1; };

/* Draws the small mark into the picture of the chosen story page. */
function PbPictureMark({ mark, sheetRef }) {
  const [pos, setPos] = useStatePB(null);
  useEffectPB(() => {
    const sheet = sheetRef.current; if (!sheet) return;
    const place = () => {
      const book = sheet.querySelector(".book"), img = sheet.querySelector(".story-img img");
      if (!book || !img || !img.naturalWidth) return;
      const b = book.getBoundingClientRect(), r = img.getBoundingClientRect();
      // object-fit: contain — find the drawn picture inside the img box.
      const k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
      const w = img.naturalWidth * k, h = img.naturalHeight * k;
      const left = r.left + (r.width - w) / 2 - b.left, top = r.top + (r.height - h) / 2 - b.top;
      setPos({ right: b.width - (left + w) + w * 0.025, bottom: b.height - (top + h) + h * 0.02 });
    };
    place();
    const img = sheet.querySelector(".story-img img"); if (img) img.addEventListener("load", place);
    window.addEventListener("resize", place); window.addEventListener("beforeprint", place);
    return () => { if (img) img.removeEventListener("load", place); window.removeEventListener("resize", place); window.removeEventListener("beforeprint", place); };
  }, [mark]);
  if (!mark || !pos) return null;
  return <span className="pb-pic-mark" style={{ right: pos.right, bottom: pos.bottom }} aria-hidden="true">{mark.school_code}{mark.code.replace("HX-", "")}</span>;
}

/* One book page, at the size set by the paper and layout (CSS variables). */
function PbPage({ children, mark, n, blank, picMark }) {
  const ref = useRefPB(null);
  if (blank) return <div className="pb-half is-blank" />;
  return <div className="pb-half" ref={ref}>
    <div className="tfr pb-frame"><article className="book">{children}{picMark && mark && <PbPictureMark mark={mark} sheetRef={ref} />}</article></div>
    <div className="pb-pfoot"><span>{mark ? `${mark.code} · ${mark.school_code}` : ""}</span><b>{n}</b></div>
  </div>;
}
function PbFootLine({ mark }) {
  return <footer className="pb-foot">{mark
    ? <span>Printed for {mark.school_name} · {mark.date} · {mark.code} · © Author Finisher Nigeria Ltd. For use by this school only. Not for resale or copying.</span>
    : <span>Preview · the print code is added when you press Print</span>}</footer>;
}
/* A printed side of paper: one page (single) or two pages with the fold between (booklet). */
function PbSide({ left, right, single, mark }) {
  return <section className={"pb-sheet " + (single ? "is-single" : "is-booklet")}>
    {mark && <div className="pb-edge" aria-hidden="true">{mark.code} · {mark.school_code} · Haaraya Education</div>}
    <div className="pb-row">{left}{!single && <div className="pb-fold" aria-hidden="true">{mark ? `${mark.code} · ${mark.school_code}` : ""}</div>}{!single && right}</div>
    <PbFootLine mark={mark} />
  </section>;
}

/* Booklet order. Pages 1..N (N a multiple of 4). Sheet i, front: N-2i | 2i+1; back: 2i+2 | N-2i-1. */
function pbImpose(N) {
  const sides = [];
  for (let i = 0; i < N / 4; i++) {
    sides.push([N - 2 * i, 2 * i + 1]);
    sides.push([2 * i + 2, N - 2 * i - 1]);
  }
  return sides;
}

const PB_HOW = {
  booklet: ["Press Print.",
    "In the print box, set Layout to Landscape and Paper size to the one you chose here.",
    "Turn on Print on both sides (two-sided), and choose Flip on short edge. It may be under More settings or Printer properties.",
    "Turn off Headers and footers. Leave Scale at Default (100%).",
    "Print. Keep the sheets in the order they come out.",
    "Fold the whole stack in half along the middle, with the front cover on the outside.",
    "Staple twice along the fold, about a quarter of the way in from each end."],
  single: ["Press Print.",
    "In the print box, set Layout to Portrait and Paper size to the one you chose here.",
    "Turn off Headers and footers. Leave Scale at Default (100%).",
    "Print, then staple the pages at the top left corner."]
};

function PrintBookApp() {
  const code = pbBook();
  const [who, setWho] = useStatePB(null);          // profile row, or {none:true}
  const [pkg, setPkg] = useStatePB(null); const [about, setAbout] = useStatePB(null);
  const [err, setErr] = useStatePB("");
  const [paper, setPaper] = useStatePB(() => { try { return localStorage.getItem("haaraya:print-paper") || "a4"; } catch (e) { return "a4"; } });
  const [mark, setMark] = useStatePB(null); const [busy, setBusy] = useStatePB(false);
  const [layout, setLayout] = useStatePB(() => { try { return localStorage.getItem("haaraya:print-layout") || "booklet"; } catch (e) { return "booklet"; } });

  useEffectPB(() => {
    (async () => {
      try { const p = window.HaarayaAuth && await window.HaarayaAuth.getProfile(); setWho(p || { none: true }); }
      catch (e) { setWho({ none: true }); }
    })();
  }, []);
  // Demo accounts print only the 12 showcase books (same list as access.js).
  const PB_SHOWCASE = ["S-01-06", "H-02-02", "TF-03-02", "TP-04-01", "TFT-05-01", "TD-06-01", "SN-07-01", "SP-08-01", "SF-09-01", "TN-10-02", "TN-11-01", "SN-12-01"];
  const isDemo = !!(who && who.email && /@haaraya-demo\.com$/i.test(who.email));
  const demoBlocked = isDemo && !PB_SHOWCASE.includes(code);
  const allowed = who && !who.none && !demoBlocked && ["teacher", "school_admin", "haaraya_admin"].includes(who.role);
  useEffectPB(() => {
    if (!allowed || !code) return;
    window.TafiyaData.getPackage(code).then(async p => {
      setPkg(p);
      const ac = (p.book || {}).book_code || code;
      if (window.HaarayaAboutDB) { try { setAbout(await window.HaarayaAboutDB.get(ac)); } catch (e) { /* no about page */ } }
    }).catch(e => setErr((e && e.message) || "This book could not load."));
  }, [allowed, code]);
  useEffectPB(() => {
    const size = (paper === "a4" ? "A4" : "letter") + (layout === "booklet" ? " landscape" : " portrait");
    const el = document.getElementById("print-page-size"); if (el) el.textContent = `@page { size: ${size}; margin: 0; }`;
    document.body.dataset.paper = paper; document.body.dataset.layout = layout;
    try { localStorage.setItem("haaraya:print-paper", paper); localStorage.setItem("haaraya:print-layout", layout); } catch (e) { /* ignore */ }
  }, [paper, layout]);
  useEffectPB(() => { if (pkg) document.title = `Print · ${(pkg.book || {}).title || code} · Haaraya`; }, [pkg]);

  const waitForPictures = () => Promise.all([...document.querySelectorAll(".pb-sheet img")].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
  const doPrint = async () => {
    setErr(""); setBusy(true);
    try {
      const { data, error } = await window.HaarayaSupabase.rpc("issue_print_code", { p_book: (pkg.book || {}).book_code || code, p_paper: paper });
      if (error) throw error;
      setMark({ ...data, date: pbToday() });
      await new Promise(r => setTimeout(r, 120));
      await waitForPictures(); await new Promise(r => setTimeout(r, 250));
      window.print();
    } catch (e) { setErr((e && e.message) || "Could not prepare the print. Check your connection and try again."); }
    setBusy(false);
  };

  if (!who) return <div className="pb-msg"><p>Loading…</p></div>;
  if (who.none) return <div className="pb-msg"><h1>Sign in to print</h1><p>Printing books is for teachers and school admins. Sign in on the Haaraya website, then open this page again.</p><a className="pb-btn" href="Haaraya Home.html">Go to Haaraya</a></div>;
  if (demoBlocked) return <div className="pb-msg"><h1>Not in the demo</h1><p>The demonstration prints the 12 showcase books, one for each level. Schools with the Print add-on can print any book in the library.</p><a className="pb-btn" href="Haaraya Home.html#library">Back to the library</a></div>;
  if (!allowed) return <div className="pb-msg"><h1>Printing is for schools</h1><p>Printed books are available to teachers and school admins at schools with the Print add-on.</p><a className="pb-btn" href="Haaraya Home.html">Back to Haaraya</a></div>;
  if (!code) return <div className="pb-msg"><h1>No book chosen</h1><p>Open a book in the library and press Print book.</p></div>;
  if (err && !pkg) return <div className="pb-msg"><h1>This book could not load</h1><p>{err}</p></div>;
  if (!pkg) return <div className="pb-msg"><p>Loading the book…</p></div>;

  const b = pkg.book || {};
  const pages = (pkg.pages || []).slice().sort((x, y) => (x.page_number || 0) - (y.page_number || 0));
  const hiddenAt = Math.min(Math.max(1, pbLevel(b)), pages.length) - 1;
  /* Reading order. In a booklet, blank pages go just before the back cover (inside back cover). */
  const seq = [{ k: "cover", el: <TfrCover pkg={pkg} /> }];
  if (about) seq.push({ k: "about", el: <TfrAbout pkg={pkg} about={about} /> });
  pages.forEach((p, i) => seq.push({ k: "p" + (p.page_number || i), el: <TfrPage page={p} local={!!pkg._local} level={b.level} />, pic: i === hiddenAt }));
  const backEl = <><TfrBack pkg={pkg} />{mark && <div className="pb-back-code">Print copy {mark.code} · School {mark.school_code} · {mark.date}</div>}</>;
  const booklet = layout === "booklet";
  const N = booklet ? Math.ceil((seq.length + 1) / 4) * 4 : seq.length + 1;
  while (booklet && seq.length < N - 1) seq.push({ k: "blank" + seq.length, blank: true });
  seq.push({ k: "back", el: backEl });
  const pageEl = num => { const x = seq[num - 1]; return <PbPage key={x.k} n={x.blank ? null : num} mark={mark} blank={x.blank} picMark={x.pic}>{x.el}</PbPage>; };
  const sheets = booklet ? N / 4 : N;
  return <>
    <div className="pb-bar">
      <div className="pb-bar-t"><b>{b.title || code}</b><span>{b.book_code || code} · {N} pages · {sheets} {sheets === 1 ? "sheet" : "sheets"} of paper{booklet ? ", printed on both sides" : ""}</span></div>
      <div className="pb-paper" role="group" aria-label="Layout">{[["booklet", "Folded booklet"], ["single", "One page per sheet"]].map(([k, l]) => <button key={k} className={layout === k ? "on" : ""} onClick={() => { setLayout(k); setMark(null); }}>{l}</button>)}</div>
      <div className="pb-paper" role="group" aria-label="Paper size">{Object.entries(PB_PAPER).map(([k, v]) => <button key={k} className={paper === k ? "on" : ""} onClick={() => { setPaper(k); setMark(null); }}>{v.label}</button>)}</div>
      <button className="pb-btn" disabled={busy} onClick={doPrint}>{busy ? "Preparing…" : "Print"}</button>
      {err && <p className="pb-err">{err}</p>}
      <details className="pb-how" open><summary>How to print {booklet ? "the booklet" : "it"}</summary>
        <ol>{PB_HOW[layout].map((t, i) => <li key={i}>{t}</li>)}</ol>
        {booklet && <p>No two-sided printing? Choose One page per sheet instead.</p>}
        <p>Each print is given its own code, recorded for your school.</p>
      </details>
    </div>
    <main className="pb-pages">
      {booklet
        ? pbImpose(N).map(([l, r], i) => <PbSide key={i} mark={mark} left={pageEl(l)} right={pageEl(r)} />)
        : seq.map((x, i) => <PbSide key={x.k} single mark={mark} left={pageEl(i + 1)} />)}
    </main>
  </>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<PrintBookApp />);
