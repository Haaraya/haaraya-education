/* ============================================================
   Haaraya Odyssey — My Captain's Log  (#odyssey-log)
   Every field lives directly on the illustrated logbook page
   (assets/captains-log-page-clean.png) — no separate card UI.
   Real entries come from window.ShipmateScribe (Supabase-backed,
   localStorage-mirrored). One entry shown at a time, like flipping
   to a page in a real logbook; prev/next moves between entries.
   ============================================================ */

const { useState: useStateLog, useEffect: useEffectLog } = React;

const ODL_WORLD_BY_PREFIX = {
  KN: "Knowledge",
  CL: "Stories",
  ST: "Tafiya Tales",
};
function odlWorldFor(code) {
  const p = String(code || "").split("-")[0].toUpperCase();
  return ODL_WORLD_BY_PREFIX[p] || "Odyssey";
}

function OdlQuill({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 4c-6.2 0-14 4-16 14 4-1 8-3 10.2-6.2M4.2 19.8l3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OdysseyCaptainsLog({ onNavigate, initialBook }) {
  const S = window.ShipmateScribe;
  const ScribeUI = window.ShipmateScribeUI;
  const [rows, setRows] = useStateLog(null); // null = loading
  const [idx, setIdx] = useStateLog(0);
  const [editing, setEditing] = useStateLog(null);
  const [autoHandled, setAutoHandled] = useStateLog(false);
  const [pendingSelect, setPendingSelect] = useStateLog(null);

  const reload = React.useCallback(() => {
    if (!S) { setRows([]); return; }
    S.load(S.readerKey()).then(m => {
      const list = Object.values(m || {})
        .filter(r => r && r.spun_log_entry && r.spun_log_entry.text)
        .sort((a, b) => {
          // Most recently written first, so the book you just logged leads
          // (falls back to book number when timestamps are missing/equal).
          const ta = Date.parse(a.updated_at || a.date_finished || "") || 0;
          const tb = Date.parse(b.updated_at || b.date_finished || "") || 0;
          if (tb !== ta) return tb - ta;
          return (b.book_number || 0) - (a.book_number || 0);
        });
      setRows(list);
    }).catch(() => setRows([]));
  }, [S]);

  useEffectLog(() => { reload(); }, [reload]);

  // Arriving straight from finishing a book (initialBook set). Run once, after
  // entries load: if this book already has a log entry, show it on the logbook
  // page; if not, open the Scribe so the Captain can write it. Never re-fires,
  // so the reader is free to close the writer afterwards.
  useEffectLog(() => {
    if (autoHandled || rows === null || !initialBook || !initialBook.book_code) return;
    const i = rows.findIndex(r => r.book_code === initialBook.book_code && r.spun_log_entry && r.spun_log_entry.text);
    if (i >= 0) setIdx(i);
    else setEditing(initialBook);
    setAutoHandled(true);
  }, [autoHandled, rows, initialBook && initialBook.book_code]);

  // After the Scribe saves an entry, jump the logbook page to that book so the
  // Captain sees their new entry on the open-book page.
  useEffectLog(() => {
    if (!pendingSelect || rows === null) return;
    const i = rows.findIndex(r => r.book_code === pendingSelect);
    if (i >= 0) setIdx(i);
    setPendingSelect(null);
  }, [pendingSelect, rows]);

  const row = rows && rows.length ? rows[Math.min(idx, rows.length - 1)] : null;
  const log = row ? (window.scCleanLog ? window.scCleanLog(row.spun_log_entry || {}) : (row.spun_log_entry || {})) : {};
  // The yarn box is a fixed size on the logbook page. Trim long (already-saved)
  // entries to whole sentences within a word budget so they never clip.
  const fitYarn = (t) => {
    const words = String(t || "").trim().split(/\s+/);
    if (words.length <= 70) return String(t || "").trim();
    let out = words.slice(0, 70).join(" ");
    const stop = Math.max(out.lastIndexOf("."), out.lastIndexOf("!"), out.lastIndexOf("?"));
    if (stop > 40) out = out.slice(0, stop + 1); else out = out.replace(/[,;:\s]+$/, "") + "…";
    return out;
  };
  const yarnText = fitYarn(log.text);
  const when = row && row.updated_at ? new Date(row.updated_at) : null;
  const whenTxt = when && !isNaN(when) ? when.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
  const world = row ? odlWorldFor(row.book_code) : "";

  const openBook = () => {
    if (!row) return;
    setEditing({
      book_code: row.book_code,
      book_title: row.book_title,
      book_number: row.book_number,
      level: row.voice_level === "older_reader" ? "Level 8" : "Level 3",
    });
  };

  return (
    <main className="odx ody-log-page">
      <button className="btn btn-ghost-dark btn-sm odl-back" onClick={() => onNavigate("odyssey")}>← The Odyssey</button>

      <section className="odl-hero">
        <img className="odl-hero-img" src="assets/captains-log-page-clean.png" alt="" />

        <div className="odl-header-overlay">
          <button type="button" className="odl-hit odl-hit-add" onClick={() => onNavigate("odyssey-library")} aria-label="Add Log Entry"></button>
        </div>

        {rows === null ? (
          <div className="odl-status">Loading your log…</div>
        ) : rows.length === 0 ? (
          <div className="odl-status">
            <p>No entries yet, Captain. Finish an Odyssey book and write your first Captain's Log entry.</p>
            <button className="btn btn-gold" onClick={() => onNavigate("odyssey-library")}>Browse the Library</button>
          </div>
        ) : (
          <div className="odl-entry-overlay">
            <span className="odl-ov odl-ov-chip1">{row.book_number ? `Book ${row.book_number} of 100` : "Odyssey Log"}</span>
            <span className="odl-ov odl-ov-chip2"><span>World:</span> <span>{world}</span></span>

            <span className="odl-ov odl-ov-booktitle">{row.book_title || "Untitled voyage"}</span>
            <h3 className="odl-ov odl-ov-title">{log.title || row.book_title || "An Odyssey Log Entry"}</h3>

            <div className="odl-ov odl-ov-notes">
              {Object.values(row.raw_captain_notes || {}).filter(Boolean).slice(0, 4).map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>

            <div className="odl-ov odl-ov-yarn">
              <p>{yarnText || "This entry has notes but no finished log yet."}</p>
            </div>

            {log.shipmate_note ? <span className="odl-ov odl-ov-note">{log.shipmate_note}</span> : null}

            <span className="odl-ov odl-ov-date"><OdlQuill className="odl-quill-ic" />{whenTxt}</span>

            <button type="button" className="odl-hit odl-hit-edit" onClick={openBook} aria-label="Edit entry"></button>
          </div>
        )}
      </section>

      {rows && rows.length ? (
        <div className="odl-pager">
          <button type="button" disabled={idx <= 0} onClick={() => setIdx(i => Math.max(0, i - 1))}>‹ Newer entry</button>
          <span>Entry {idx + 1} of {rows.length}</span>
          <button type="button" disabled={idx >= rows.length - 1} onClick={() => setIdx(i => Math.min(rows.length - 1, i + 1))}>Older entry ›</button>
        </div>
      ) : null}

      {editing && ScribeUI ? (
        <ScribeUI
          book={editing}
          onClose={() => { setEditing(null); reload(); }}
          onSaved={(code) => { if (code) setPendingSelect(code); reload(); }}
        />
      ) : null}
    </main>
  );
}

Object.assign(window, { OdysseyCaptainsLog });
