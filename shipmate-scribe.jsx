/* ============================================================
   Haaraya Odyssey — Shipmate Scribe  ·  UI
   "The Captain speaks. The Shipmate writes."

   <ShipmateScribe book={{book_code, book_title, book_number, level}}
                   onClose={fn} embedded />

   Flow:  Captain's Notes  →  Spin My Log Yarn  →  The Odyssey Log
   Data:  window.ShipmateScribe (scribe-data.js)
   ============================================================ */
const { useState: useStateSc, useEffect: useEffectSc, useRef: useRefSc } = React;

/* Clean a spun log for display. Strips any stray markdown and, if the server
   parser missed markdown-wrapped labels and dumped the whole reply into .text,
   re-splits the Title / Odyssey Log Entry / Shipmate Note back apart. Safe to
   run on already-saved entries. */
function scCleanLog(log) {
  if (!log) return log;
  const stripMd = (s) => String(s || "")
    .replace(/\*\*/g, "")
    .replace(/`+/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*/g, "")
    .trim();

  const raw = stripMd([log.title, log.text, log.shipmate_note].filter(Boolean).join("\n"));
  const grab = (labels) => {
    const re = new RegExp(
      "(?:" + labels + ")\\s*:\\s*([\\s\\S]*?)(?=\\n?\\s*(?:Title|Odyssey Log Entry|Log Entry|Shipmate Note)\\s*:|$)",
      "i"
    );
    const m = raw.match(re);
    return m ? m[1].trim() : "";
  };

  let title = log.title || "";
  let text = log.text || "";
  let note = log.shipmate_note || "";

  if (/(?:Odyssey Log Entry|Log Entry|Shipmate Note|Title)\s*:/i.test(raw)) {
    title = grab("Title") || title;
    text = grab("Odyssey Log Entry|Log Entry") || text;
    note = grab("Shipmate Note") || note;
    if (!grab("Title")) {
      const head = raw.split(/\n/)[0].trim();
      if (head && !/:/.test(head) && head.length <= 80) title = head;
    }
  }
  return Object.assign({}, log, { title: stripMd(title), text: stripMd(text), shipmate_note: stripMd(note) });
}

function ScribeMark() {
  return (
    <div className="sc-mark">
      <span className="sc-mark-quill" aria-hidden="true">&#x1F58B;</span>
      <div className="sc-mark-txt">
        <span className="sc-mark-name">Shipmate Scribe</span>
        <span className="sc-mark-tag">The Captain speaks. The Shipmate writes.</span>
      </div>
    </div>
  );
}

/* ---- Voice + person choices ---- */
function ScribeVoice({ voice, person, onVoice, onPerson }) {
  return (
    <div className="sc-voice">
      <div className="sc-seg" role="group" aria-label="Reading voice">
        <button type="button" className={voice === "younger_reader" ? "on" : ""} onClick={() => onVoice("younger_reader")}>Younger voice</button>
        <button type="button" className={voice === "older_reader" ? "on" : ""} onClick={() => onVoice("older_reader")}>Older voice</button>
      </div>
      <div className="sc-seg" role="group" aria-label="Point of view">
        <button type="button" className={person === "first" ? "on" : ""} onClick={() => onPerson("first")}>My log (I…)</button>
        <button type="button" className={person === "third" ? "on" : ""} onClick={() => onPerson("third")}>The Captain…</button>
      </div>
    </div>
  );
}

/* ---- The notes form ---- */
function CaptainsNotes({ notes, setNote, fields }) {
  return (
    <div className="sc-notes">
      {fields.map(f => (
        <label key={f.key} className={"sc-note sc-note--" + (f.rows > 1 ? "big" : "small")}>
          <span className="sc-note-head">
            <span className="sc-note-ic" aria-hidden="true">{f.icon}</span>
            <span className="sc-note-label">{f.label}</span>
          </span>
          {f.rows > 1 ? (
            <textarea
              className="sc-note-input" rows={f.rows} value={notes[f.key] || ""}
              onChange={e => setNote(f.key, e.target.value)} placeholder={f.prompt}
            ></textarea>
          ) : (
            <input
              className="sc-note-input" type="text" value={notes[f.key] || ""}
              onChange={e => setNote(f.key, e.target.value)} placeholder={f.prompt}
            />
          )}
        </label>
      ))}
    </div>
  );
}

/* ---- The spun log ---- */
function OdysseyLog({ log, book, onRespin, onEdit, spinning }) {
  const c = scCleanLog(log) || {};
  return (
    <div className="sc-log">
      <div className="sc-log-wax" aria-hidden="true">✦</div>
      <div className="sc-log-book">{book.book_number ? "Book " + book.book_number : "Odyssey"}</div>
      <h3 className="sc-log-title">{c.title || (book.book_title || "The Voyage")}</h3>
      <div className="sc-log-rule" aria-hidden="true"></div>
      <p className="sc-log-text">{c.text}</p>
      {c.shipmate_note ? (
        <div className="sc-log-note">
          <span className="sc-log-note-q" aria-hidden="true">&#x1F58B;</span>
          <span>{c.shipmate_note}</span>
        </div>
      ) : null}
      <div className="sc-log-actions">
        <button type="button" className="sc-btn ghost" onClick={onEdit} disabled={spinning}>Edit my notes</button>
        <button type="button" className="sc-btn ghost" onClick={onRespin} disabled={spinning}>
          {spinning ? "Spinning…" : "Spin again"}
        </button>
      </div>
    </div>
  );
}

/* ---- Teacher / parent assessment strip ---- */
function ScribeTeacherPanel({ notes, signal, status, fields }) {
  const S = window.ShipmateScribe;
  fields = (fields && fields.length) ? fields : ((S && S.NOTE_FIELDS) || []);
  const sigLabel = { thin: "Thin — may need a chat", adequate: "Adequate", strong: "Strong", unknown: "—" }[signal] || "—";
  return (
    <details className="sc-teacher">
      <summary>
        <span className="sc-teacher-title">Teacher &amp; parent view</span>
        <span className={"sc-teacher-sig sig-" + signal}>{sigLabel}</span>
      </summary>
      <div className="sc-teacher-body">
        <p className="sc-teacher-lede">The Captain’s own words — the evidence behind the log. The Scribe only polishes; it never invents facts.</p>
        <dl className="sc-teacher-notes">
          {fields.map(f => (
            <div key={f.key} className="sc-teacher-row">
              <dt>{f.label}</dt>
              <dd>{notes[f.key] ? notes[f.key] : <span className="empty">—</span>}</dd>
            </div>
          ))}
        </dl>
        <div className="sc-teacher-meta">
          <span>Completion: <strong>{status === "complete" ? "Complete" : "In progress"}</strong></span>
          <span>Comprehension signal: <strong>{sigLabel}</strong></span>
        </div>
      </div>
    </details>
  );
}

/* ============================================================
   Main component
   ============================================================ */
function ShipmateScribePanel({ book, onClose, onSaved, embedded }) {
  const S = window.ShipmateScribe;
  book = book || {};
  const bookCode = book.book_code || book.code || "unknown";

  const [phase, setPhase] = useStateSc("notes"); // notes | log
  // Fields default to the generic NOTE_FIELDS; a book with authored
  // questions swaps in its own set once loaded (see effect below).
  const [fields, setFields] = useStateSc(() => (S && S.NOTE_FIELDS) || []);
  const [spinPrompt, setSpinPrompt] = useStateSc("");
  const [notes, setNotes] = useStateSc({});
  const [voice, setVoice] = useStateSc(() => {
    const m = String(book.level || "").match(/\d+/);
    return m && Number(m[0]) >= 8 ? "older_reader" : "younger_reader";
  });
  const [person, setPerson] = useStateSc("first");
  const [log, setLog] = useStateSc(null);
  const [spinning, setSpinning] = useStateSc(false);
  const [saved, setSaved] = useStateSc(false);
  const [loaded, setLoaded] = useStateSc(false);

  // Load any existing entry for this book.
  useEffectSc(() => {
    let alive = true;
    if (!S) { setLoaded(true); return; }
    S.loadOne(S.readerKey(), bookCode).then(row => {
      if (!alive || !row) { setLoaded(true); return; }
      setNotes(row.raw_captain_notes || {});
      if (row.voice_level) setVoice(row.voice_level);
      if (row.person) setPerson(row.person);
      if (row.spun_log_entry && row.spun_log_entry.text) { setLog(row.spun_log_entry); setPhase("log"); setSaved(true); }
      setLoaded(true);
    }).catch(() => setLoaded(true));
    return () => { alive = false; };
  }, [bookCode]);

  // Load this book's own Captain's Log questions (if authored in Supabase).
  // Falls back silently to the generic NOTE_FIELDS when the book has none.
  useEffectSc(() => {
    let alive = true;
    const LP = window.HaarayaLogPrompts;
    if (!LP) return;
    LP.getForBook(book).then(pack => {
      if (!alive || !pack) return;
      setFields(pack.fields);
      setSpinPrompt(pack.spinPrompt || "");
    }).catch(() => { /* keep generic fallback */ });
    return () => { alive = false; };
  }, [bookCode, book.book_number]);

  const setNote = (k, v) => setNotes(n => Object.assign({}, n, { [k]: v }));

  const filledCount = fields.filter(f => String(notes[f.key] || "").trim()).length;
  const canSpin = filledCount >= 2 && !spinning;
  const signal = S ? S.comprehensionSignal(notes, fields) : "unknown";

  async function persist(nextLog, versionBump) {
    if (!S) return;
    const m = String(book.book_number || "").match(/\d+/);
    const row = {
      reader_key: S.readerKey(),
      child_id: (window.HaarayaSession && window.HaarayaSession.childId && window.HaarayaSession.childId()) || null,
      book_code: bookCode,
      book_number: m ? Number(m[0]) : null,
      book_title: book.book_title || book.title || null,
      raw_captain_notes: notes,
      spun_log_entry: nextLog || log,
      voice_level: voice,
      person: person,
      version: (log && versionBump ? (log._v || 1) + 1 : (log && log._v) || 1),
      completion_status: nextLog && nextLog.text ? "complete" : "in_progress",
      comprehension_signal: signal,
      needs_review: signal === "thin",
    };
    const savedRow = await S.save(row);
    return savedRow;
  }

  async function doSpin(isRespin) {
    if (!S) return;
    setSpinning(true);
    try {
      // Send question→answer pairs so the log reflects the exact questions
      // asked (book-specific or generic), plus the book's creative brief.
      const qa = fields.map(f => ({ question: f.label, answer: notes[f.key] || "" }));
      const raw = await S.spin({ notes, qa, spin_prompt: spinPrompt, book_title: book.book_title || book.title, voice_level: voice, person: person });
      const out = Object.assign({}, scCleanLog(raw), { _v: (log && log._v ? log._v + 1 : 1), need_more_clue: raw && raw.need_more_clue });
      setLog(out);
      if (!out.need_more_clue) {
        const savedRow = await persist(out, isRespin);
        setSaved(true);
        // The finished entry belongs on the illustrated logbook page, not in
        // this writing card. Hand it back and close so it renders there.
        if (onSaved) onSaved((savedRow && savedRow.book_code) || bookCode);
        if (onClose) { onClose(); return; }
        setPhase("log");
      } else {
        // Scribe needs one more clue — stay open and show its request.
        setPhase("log");
        setSaved(false);
      }
    } catch (e) {
      setLog({ title: "", text: "", shipmate_note: "The seas were rough and the Scribe couldn’t write just now. Try once more, Captain.", need_more_clue: true });
      setPhase("log");
    } finally {
      setSpinning(false);
    }
  }

  const body = (
    <div className="sc-panel">
      <div className="sc-top">
        <ScribeMark />
        {onClose ? <button type="button" className="sc-close" onClick={onClose} aria-label="Close">×</button> : null}
      </div>

      <div className="sc-book-strip">
        <span className="sc-book-badge">{book.book_number ? "Book " + book.book_number : "Captain’s Log"}</span>
        <span className="sc-book-title">{book.book_title || book.title || "This book"}</span>
        {saved ? <span className="sc-saved-pill">Entry saved</span> : null}
      </div>

      {phase === "notes" && (
        <React.Fragment>
          <p className="sc-lede">Captain, jot your notes from the voyage. A word or two each is plenty — your loyal Scribe will spin them into your Odyssey Log.</p>
          <ScribeVoice voice={voice} person={person} onVoice={setVoice} onPerson={setPerson} />
          <div className="sc-section-label">Captain’s Notes</div>
          <CaptainsNotes notes={notes} setNote={setNote} fields={fields} />
          {spinPrompt ? (
            <div className="sc-yarn-brief">
              <span className="sc-yarn-brief-ic" aria-hidden="true">✨</span>
              <span>{spinPrompt}</span>
            </div>
          ) : null}
          <div className="sc-spin-row">
            <button type="button" className="sc-btn spin" onClick={() => doSpin(false)} disabled={!canSpin}>
              <span className="sc-btn-star" aria-hidden="true">✦</span>
              {spinning ? "Spinning your yarn…" : "Spin My Log Yarn"}
            </button>
            {!canSpin && !spinning ? <span className="sc-hint">Add a couple of notes to begin.</span> : null}
          </div>
        </React.Fragment>
      )}

      {phase === "log" && log && (
        <React.Fragment>
          <div className="sc-section-label">The Odyssey Log</div>
          <OdysseyLog log={log} book={book} spinning={spinning}
            onRespin={() => doSpin(true)}
            onEdit={() => setPhase("notes")} />
          {saved && !log.need_more_clue ? (
            <div className="sc-complete">Entry saved. Another book conquered.</div>
          ) : null}
          <ScribeTeacherPanel notes={notes} signal={signal} status={saved && !log.need_more_clue ? "complete" : "in_progress"} fields={fields} />
        </React.Fragment>
      )}
    </div>
  );

  if (embedded) return body;
  return (
    <div className="sc-overlay" role="dialog" aria-label="Shipmate Scribe" onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      {body}
    </div>
  );
}

// Export the UI under its own global; the data layer keeps window.ShipmateScribe.
window.ShipmateScribeUI = ShipmateScribePanel;
window.scCleanLog = scCleanLog;
