/* ============================================================
   Haaraya — school enrolment modals
   ------------------------------------------------------------
   The write-side UI for a school admin: create a classroom,
   enrol a pupil, link an existing teacher, mint sponsored codes.
   All four go through HaarayaEnrol, so the RLS policies in
   supabase/enrolment_policies.sql are what actually authorise
   them. Every failure is shown verbatim rather than swallowed.
   ============================================================ */

const { useState: useStateEnrol } = React;

/* ---------- create a classroom ---------- */
function CreateClassroomModal({ schoolId, teachers, onClose, onDone }) {
  const [name, setName] = useStateEnrol("");
  const [teacher, setTeacher] = useStateEnrol("");
  const [busy, setBusy] = useStateEnrol(false);
  const [msg, setMsg] = useStateEnrol("");

  const submit = async () => {
    if (!name.trim()) { setMsg("Give the class a name."); return; }
    setBusy(true); setMsg("");
    const res = await window.HaarayaEnrol.createClassroom({
      schoolId: schoolId, name: name, teacherUserId: teacher || null,
    });
    setBusy(false);
    if (res && res.ok) { onDone && onDone(); onClose && onClose(); return; }
    setMsg((res && (res.detail || res.reason)) || "Could not create the class.");
  };

  return (
    <div className="assign-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div className="assign-modal addkid-modal" role="dialog" aria-modal="true" aria-label="Create a classroom">
        <div className="assign-head">
          <div>
            <h4>Create a classroom</h4>
            <div className="sub">Pupils are enrolled into classes; a teacher leads each one.</div>
          </div>
          <button className="assign-x" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="assign-body addkid-body">
          <div className="addkid-row">
            <div className="assign-col">
              <div className="assign-lbl">Class name</div>
              <input className="assign-search" value={name} onChange={(e) => setName(e.target.value)} placeholder="Primary 4 Blue" autoFocus />
            </div>
            <div className="assign-col">
              <div className="assign-lbl">Teacher <span className="opt">optional</span></div>
              <select className="assign-search" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                <option value="">Assign later</option>
                {(teachers || []).map(t => (
                  <option key={t.id} value={t.id}>{t.teacher.displayName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="assign-foot">
          <div className="assign-picked">{name.trim() ? <span>Creating <strong>{name.trim()}</strong></span> : "Name the class to continue."}</div>
          <button className="btn btn-ghost-dark btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-forest btn-sm" onClick={submit} disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create class"}</button>
          {msg && <div className="assign-msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- enrol a pupil ---------- */
/* School pupils have no guardian login, which is why the children table lets
   parent_user_id be null (see enrolment_migration.sql). */
function AddPupilModal({ schoolId, classrooms, onClose, onDone }) {
  const [first, setFirst] = useStateEnrol("");
  const [last, setLast] = useStateEnrol("");
  const [display, setDisplay] = useStateEnrol("");
  const [classroom, setClassroom] = useStateEnrol("");
  const [level, setLevel] = useStateEnrol(1);
  const [mode, setMode] = useStateEnrol("automatic");
  const [busy, setBusy] = useStateEnrol(false);
  const [msg, setMsg] = useStateEnrol("");
  const levels = (window.HaarayaSeed && HaarayaSeed.levels) || [];

  const submit = async () => {
    if (!first.trim()) { setMsg("A first name is needed."); return; }
    setBusy(true); setMsg("");
    const res = await window.HaarayaEnrol.enrolPupil({
      schoolId: schoolId,
      classroomId: classroom || null,
      child: {
        firstName: first, lastName: last, passportName: display,
        currentLevelId: Number(level) || 1, readingMode: mode,
      },
    });
    setBusy(false);
    if (res && res.ok) {
      if (res.warnings && res.warnings.length) {
        setMsg("Pupil added, but not seated in the class: " + (res.warnings[0].detail || res.warnings[0].reason));
        onDone && onDone();
        return;
      }
      onDone && onDone(); onClose && onClose(); return;
    }
    setMsg((res && (res.detail || res.reason)) || "Could not enrol this pupil.");
  };

  return (
    <div className="assign-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div className="assign-modal addkid-modal" role="dialog" aria-modal="true" aria-label="Enrol a pupil">
        <div className="assign-head">
          <div>
            <h4>Enrol a pupil</h4>
            <div className="sub">School pupils read without a guardian login.</div>
          </div>
          <button className="assign-x" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="assign-body addkid-body">
          <div className="addkid-row">
            <div className="assign-col">
              <div className="assign-lbl">First name</div>
              <input className="assign-search" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Amara" autoFocus />
            </div>
            <div className="assign-col">
              <div className="assign-lbl">Last name <span className="opt">optional</span></div>
              <input className="assign-search" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Okoro" />
            </div>
          </div>
          <div className="addkid-row">
            <div className="assign-col">
              <div className="assign-lbl">Passport name <span className="opt">optional</span></div>
              <input className="assign-search" value={display} onChange={(e) => setDisplay(e.target.value)} placeholder="What the passport should say" />
            </div>
            <div className="assign-col">
              <div className="assign-lbl">Classroom <span className="opt">optional</span></div>
              <select className="assign-search" value={classroom} onChange={(e) => setClassroom(e.target.value)}>
                <option value="">No class yet</option>
                {(classrooms || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="addkid-row">
            <div className="assign-col">
              <div className="assign-lbl">Starting level</div>
              <select className="assign-search" value={level} onChange={(e) => setLevel(e.target.value)}>
                {(levels.length ? levels : [{ number: 1, name: "Level 1" }]).map(l => (
                  <option key={l.number} value={l.number}>L{l.number} &middot; {l.name}</option>
                ))}
              </select>
            </div>
            <div className="assign-col">
              <div className="assign-lbl">Book choice</div>
              <div className="assign-seg">
                <button className={mode === "automatic" ? "on" : ""} onClick={() => setMode("automatic")}>School chooses</button>
                <button className={mode === "choose" ? "on" : ""} onClick={() => setMode("choose")}>Pupil chooses</button>
              </div>
            </div>
          </div>
        </div>
        <div className="assign-foot">
          <div className="assign-picked">{first.trim() ? <span>Enrolling <strong>{display.trim() || first.trim()}</strong></span> : "Fill in a first name to continue."}</div>
          <button className="btn btn-ghost-dark btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-forest btn-sm" onClick={submit} disabled={busy || !first.trim()}>{busy ? "Enrolling…" : "Enrol pupil"}</button>
          {msg && <div className="assign-msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- link an existing teacher ---------- */
/* A teacher must already have a Haaraya account: only they can set their own
   password. The lookup goes through find_teacher_by_email() because RLS hides
   users the admin isn't linked to yet. */
function LinkTeacherModal({ schoolId, onClose, onDone }) {
  const [email, setEmail] = useStateEnrol("");
  const [found, setFound] = useStateEnrol(null);
  const [busy, setBusy] = useStateEnrol(false);
  const [msg, setMsg] = useStateEnrol("");

  const look = async () => {
    const addr = email.trim();
    if (!addr) { setMsg("Enter their email address."); return; }
    setBusy(true); setMsg(""); setFound(null);
    try {
      const res = await window.HaarayaSupabase.rpc("find_teacher_by_email", { p_email: addr });
      setBusy(false);
      const row = res.data && res.data[0];
      if (res.error) { setMsg(res.error.message); return; }
      if (!row) {
        setMsg("No Haaraya account with that email. Ask them to register as a teacher first, then add them here.");
        return;
      }
      setFound(row);
    } catch (e) {
      setBusy(false);
      setMsg(String(e));
    }
  };

  const link = async () => {
    setBusy(true); setMsg("");
    const res = await window.HaarayaEnrol.linkTeacher({
      teacherUserId: found.id, schoolId: schoolId,
    });
    setBusy(false);
    if (res && res.ok) { onDone && onDone(); onClose && onClose(); return; }
    setMsg((res && (res.detail || res.reason)) || "Could not add this teacher.");
  };

  return (
    <div className="assign-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div className="assign-modal addkid-modal" role="dialog" aria-modal="true" aria-label="Add a teacher">
        <div className="assign-head">
          <div>
            <h4>Add a teacher</h4>
            <div className="sub">They register their own account; you link it to the school.</div>
          </div>
          <button className="assign-x" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="assign-body addkid-body">
          <div className="assign-col">
            <div className="assign-lbl">Their email address</div>
            <input
              className="assign-search" value={email} type="email" autoFocus
              onChange={(e) => { setEmail(e.target.value); setFound(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") look(); }}
              placeholder="teacher@school.org"
            />
            <div className="assign-note">
              {found
                ? <span>Found <strong>{found.full_name || found.email}</strong> — add them to the school?</span>
                : "Press Enter to look them up."}
            </div>
          </div>
        </div>
        <div className="assign-foot">
          <div className="assign-picked" />
          <button className="btn btn-ghost-dark btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          {found
            ? <button className="btn btn-forest btn-sm" onClick={link} disabled={busy}>{busy ? "Adding…" : "Add to school"}</button>
            : <button className="btn btn-forest btn-sm" onClick={look} disabled={busy || !email.trim()}>{busy ? "Looking…" : "Find teacher"}</button>}
          {msg && <div className="assign-msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- mint sponsored access codes ---------- */
/* mint_access_codes() is SECURITY DEFINER and checks the caller is an admin,
   so the codes are generated server-side and returned once. */
function MintCodesModal({ schoolId, onClose }) {
  const [programme, setProgramme] = useStateEnrol("");
  const [count, setCount] = useStateEnrol(10);
  const [codes, setCodes] = useStateEnrol(null);
  const [busy, setBusy] = useStateEnrol(false);
  const [msg, setMsg] = useStateEnrol("");

  const mint = async () => {
    if (!programme.trim()) { setMsg("Name the programme these codes belong to."); return; }
    const n = Math.max(1, Math.min(500, Number(count) || 0));
    setBusy(true); setMsg("");
    try {
      const res = await window.HaarayaSupabase.rpc("mint_access_codes", {
        p_programme: programme.trim(), p_count: n, p_school_id: schoolId || null, p_expires: null,
      });
      setBusy(false);
      if (res.error) { setMsg(res.error.message); return; }
      setCodes(res.data || []);
    } catch (e) { setBusy(false); setMsg(String(e)); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText((codes || []).join("\n")); setMsg("Copied."); }
    catch (e) { setMsg("Select and copy them manually."); }
  };

  return (
    <div className="assign-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div className="assign-modal addkid-modal" role="dialog" aria-modal="true" aria-label="Mint access codes">
        <div className="assign-head">
          <div>
            <h4>Sponsored access codes</h4>
            <div className="sub">One code per child. Each works once, then it's spent.</div>
          </div>
          <button className="assign-x" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="assign-body addkid-body">
          {codes ? (
            <div className="assign-col">
              <div className="assign-lbl">{codes.length} {codes.length === 1 ? "code" : "codes"} for {programme.trim()}</div>
              <textarea className="assign-search mint-out" readOnly rows={Math.min(12, codes.length + 1)} value={codes.join("\n")} />
              <div className="assign-note">Save these now — they aren't shown again in full.</div>
            </div>
          ) : (
            <div className="addkid-row">
              <div className="assign-col">
                <div className="assign-lbl">Programme name</div>
                <input className="assign-search" value={programme} onChange={(e) => setProgramme(e.target.value)} placeholder="Lagos Reading Fund 2026" autoFocus />
              </div>
              <div className="assign-col">
                <div className="assign-lbl">How many</div>
                <input className="assign-search" value={count} onChange={(e) => setCount(e.target.value)} inputMode="numeric" />
              </div>
            </div>
          )}
        </div>
        <div className="assign-foot">
          <div className="assign-picked" />
          {codes ? (
            <>
              <button className="btn btn-ghost-dark btn-sm" onClick={onClose}>Done</button>
              <button className="btn btn-forest btn-sm" onClick={copy}>Copy all</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost-dark btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="btn btn-forest btn-sm" onClick={mint} disabled={busy || !programme.trim()}>{busy ? "Minting…" : "Generate codes"}</button>
            </>
          )}
          {msg && <div className="assign-msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CreateClassroomModal, AddPupilModal, LinkTeacherModal, MintCodesModal,
});
