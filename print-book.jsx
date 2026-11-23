/* ============================================================================
   Haaraya — Print a book (school staff, Print add-on).
   Lays out one book from the main library, using the main reader's own pages:
   front cover, About this book, every story page, back cover. One book page
   per sheet, A4 or US Letter. The teacher prints, or chooses Save as PDF.

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

function PbSheet({ children, mark, n, back }) {
  return <section className={"pb-sheet" + (back ? " is-back" : "")}>
    {mark && <div className="pb-edge" aria-hidden="true">{mark.code} · {mark.school_code} · Haaraya Education</div>}
    <div className="tfr pb-frame"><article className="book">{children}</article></div>
    <footer className="pb-foot">{mark
      ? <span>Printed for {mark.school_name} · {mark.date} · {mark.code} · © Author Finisher Nigeria Ltd. For use by this school only. Not for resale or copying.</span>
      : <span>Preview · the print code is added when you press Print</span>}<b>{n}</b></footer>
  </section>;
}

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

function PbStorySheet({ page, pkg, mark, n, hidden }) {
  const ref = useRefPB(null);
  return <div ref={ref} className="pb-wrap"><PbSheet mark={mark} n={n}>
    <TfrPage page={page} local={!!pkg._local} level={(pkg.book || {}).level} />
    {hidden && mark && <PbPictureMark mark={mark} sheetRef={ref} />}
  </PbSheet></div>;
}

function PrintBookApp() {
  const code = pbBook();
  const [who, setWho] = useStatePB(null);          // profile row, or {none:true}
  const [pkg, setPkg] = useStatePB(null); const [about, setAbout] = useStatePB(null);
  const [err, setErr] = useStatePB("");
  const [paper, setPaper] = useStatePB(() => { try { return localStorage.getItem("haaraya:print-paper") || "a4"; } catch (e) { return "a4"; } });
  const [mark, setMark] = useStatePB(null); const [busy, setBusy] = useStatePB(false);

  useEffectPB(() => {
    (async () => {
      try { const p = window.HaarayaAuth && await window.HaarayaAuth.getProfile(); setWho(p || { none: true }); }
      catch (e) { setWho({ none: true }); }
    })();
  }, []);
  const allowed = who && !who.none && ["teacher", "school_admin", "haaraya_admin"].includes(who.role);
  useEffectPB(() => {
    if (!allowed || !code) return;
    window.TafiyaData.getPackage(code).then(async p => {
      setPkg(p);
      const ac = (p.book || {}).book_code || code;
      if (window.HaarayaAboutDB) { try { setAbout(await window.HaarayaAboutDB.get(ac)); } catch (e) { /* no about page */ } }
    }).catch(e => setErr((e && e.message) || "This book could not load."));
  }, [allowed, code]);
  useEffectPB(() => {
    const el = document.getElementById("print-page-size"); if (el) el.textContent = `@page { size: ${PB_PAPER[paper].css}; margin: 0; }`;
    document.body.dataset.paper = paper;
    try { localStorage.setItem("haaraya:print-paper", paper); } catch (e) { /* ignore */ }
  }, [paper]);
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
  if (!allowed) return <div className="pb-msg"><h1>Printing is for schools</h1><p>Printed books are available to teachers and school admins at schools with the Print add-on.</p><a className="pb-btn" href="Haaraya Home.html">Back to Haaraya</a></div>;
  if (!code) return <div className="pb-msg"><h1>No book chosen</h1><p>Open a book in the library and press Print book.</p></div>;
  if (err && !pkg) return <div className="pb-msg"><h1>This book could not load</h1><p>{err}</p></div>;
  if (!pkg) return <div className="pb-msg"><p>Loading the book…</p></div>;

  const b = pkg.book || {};
  const pages = (pkg.pages || []).slice().sort((x, y) => (x.page_number || 0) - (y.page_number || 0));
  const hiddenAt = Math.min(Math.max(1, pbLevel(b)), pages.length) - 1;
  let n = 0;
  return <>
    <div className="pb-bar">
      <div className="pb-bar-t"><b>{b.title || code}</b><span>{b.book_code || code} · {pages.length + 2 + (about ? 1 : 0)} pages</span></div>
      <div className="pb-paper" role="group" aria-label="Paper size">{Object.entries(PB_PAPER).map(([k, v]) => <button key={k} className={paper === k ? "on" : ""} onClick={() => { setPaper(k); setMark(null); }}>{v.label}</button>)}</div>
      <button className="pb-btn" disabled={busy} onClick={doPrint}>{busy ? "Preparing…" : "Print or save as PDF"}</button>
      {err && <p className="pb-err">{err}</p>}
      <p className="pb-note">Each print is given its own code, recorded for your school. In the print box, choose your printer, or Save as PDF. Turn off "Headers and footers" for a clean page.</p>
    </div>
    <main className="pb-pages">
      <PbSheet mark={mark} n={++n}><TfrCover pkg={pkg} /></PbSheet>
      {about && <PbSheet mark={mark} n={++n}><TfrAbout pkg={pkg} about={about} /></PbSheet>}
      {pages.map((p, i) => <PbStorySheet key={p.page_number || i} page={p} pkg={pkg} mark={mark} n={++n} hidden={i === hiddenAt} />)}
      <PbSheet mark={mark} n={++n} back><TfrBack pkg={pkg} />{mark && <div className="pb-back-code">Print copy {mark.code} · School {mark.school_code} · {mark.date}</div>}</PbSheet>
    </main>
  </>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<PrintBookApp />);
