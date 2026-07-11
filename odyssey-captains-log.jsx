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

function OdysseyCaptainsLog({ onNavigate }) {
  const S = window.ShipmateScribe;
  const ScribeUI = window.ShipmateScribeUI;
  const [rows, setRows] = useStateLog(null); // null = loading
  const [idx, setIdx] = useStateLog(0);
  const [editing, setEditing] = useStateLog(null);

  const reload = React.useCallback(() => {
    if (!S) { setRows([]); return; }
    S.load(S.readerKey()).then(m => {
      const list = Object.values(m || {})
        .filter(r => r && r.spun_log_entry && r.spun_log_entry.text)
        .sort((a, b) => (b.book_number || 0) - (a.book_number || 0)); // most recent first
      setRows(list);
    }).catch(() => setRows([]));
  }, [S]);

  useEffectLog(() => { reload(); }, [reload]);

  const row = rows && rows.length ? rows[Math.min(idx, rows.length - 1)] : null;
  const log = row ? (row.spun_log_entry || {}) : {};
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
              <p>{log.text || "This entry has notes but no finished log yet."}</p>
            </div>

            {log.shipmate_note ? <span className="odl-ov odl-ov-note">{log.shipmate_note}</span> : null}

            <span className="odl-ov odl-ov-date"><OdlQuill className="odl-quill-ic" />{whenTxt}</span>

            <button type="button" className="odl-hit odl-hit-edit" onClick={openBook} aria-label="Edit entry"></button>
          </div>
        )}
      </section>

      {rows && rows.length > 1 ? (
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
          onSaved={reload}
        />
      ) : null}
    </main>
  );
}

Object.assign(window, { OdysseyCaptainsLog });
