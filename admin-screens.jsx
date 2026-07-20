/* ============================================================
   Haaraya — Adult dashboards: Teacher / School Admin / Haaraya Admin
   Reuses the same .dash shell as the parent/child dashboards.
   ============================================================ */

const { useState: useStateAdult, useEffect: useEffectAdult } = React;

/* ------------ Shared sidebar ------------ */

function AdultSidebar({ items, footerName, footerSub, footerColor }) {
  return (
    <aside className="dash-sidebar">
      <div className="dash-brand">
        <img src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" />
      </div>
      <nav className="dash-nav">
        {items.map(it => (
          <a key={it.label} className={it.active ? "active" : ""} onClick={it.onClick}>
            <span className="nav-icon" /> {it.label}
          </a>
        ))}
      </nav>
      {footerName && (
        <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,.06)",
            padding: 10, borderRadius: 10,
          }}>
            <Avatar name={footerName} color={footerColor || "#228B22"} size={36} border={false} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{footerName}</div>
              {footerSub && <div style={{ fontSize: 11, opacity: 0.7 }}>{footerSub}</div>}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ============================================================
   TEACHER DASHBOARD
   ============================================================ */

function TeacherDashScreen({ onNavigate }) {
  const TEACHER_ID = (window.HaarayaSession && HaarayaSession.userId()) || 2;
  const ME = (window.HaarayaSession && HaarayaSession.get().displayName) || "Demo Teacher";
  const { data: teacher }    = useApi(() => HaarayaApi.getCurrentTeacher(), [TEACHER_ID]);
  const { data: classrooms } = useApi(() => HaarayaApi.getClassroomsForTeacher(TEACHER_ID), [TEACHER_ID]);
  const [classIdx, setClassIdx] = useStateAdult(0);
  const classroom = (classrooms || [])[classIdx];

  const { data: pupils }       = useApi(async () => classroom ? HaarayaApi.getClassReadingProgress(classroom.id) : [], [classroom && classroom.id]);
  const { data: pathProgress } = useApi(async () => classroom ? HaarayaApi.getClassReadingPathProgress(classroom.id) : null, [classroom && classroom.id]);
  const { data: alerts }       = useApi(async () => classroom ? HaarayaApi.getSupportAlerts(classroom.id) : [], [classroom && classroom.id]);
  const { data: assignments }  = useApi(async () => classroom ? HaarayaApi.getAssignmentsForClassroom(classroom.id) : [], [classroom && classroom.id]);

  if (!classrooms || !teacher) return null;

  return (
    <main className="nd-page role-adult" data-screen-label="Teacher Dashboard">
      <div className="nd">
        <div className="nd-top">
          <div className="nd-word"><img src="assets/odyssey-seal.png" alt="Haaraya" /> Haaraya</div>
          <nav className="nd-nav">
            <a className="on">Classrooms</a>
            <a>Assignments</a>
            <a>Pupil progress</a>
            <a>Reports</a>
            <a onClick={() => onNavigate("library")}>Library</a>
          </nav>
          <div className="nd-chip">
            <Avatar name={ME} color="#8E24AA" size={40} />
            <div className="who">
              <div className="n">{ME}</div>
              <div className="l">Lead teacher</div>
            </div>
          </div>
        </div>
        <div className="dash role-adult" style={{ display: "block", background: "transparent", border: "none", boxShadow: "none", padding: 0, minHeight: 0 }}>
          <div className="dash-main" style={{ padding: 0 }}>
            <div className="dash-header">
              <div>
                <h3><span style={{ fontFamily: '"Andika", system-ui, sans-serif' }}>{ME}</span>&rsquo;s classrooms</h3>
                <div className="sub">{classrooms.length} {classrooms.length === 1 ? "class" : "classes"} · Term 2 · Week 6</div>
              </div>
              <button className="btn btn-primary btn-sm">+ New assignment</button>
            </div>

            <div className="adash-tabs">
              {classrooms.map((c, i) => (
                <button key={c.id} className={`adash-tab ${i === classIdx ? "active" : ""}`} onClick={() => setClassIdx(i)}>
                  {c.name}
                  <span style={{ marginLeft: 8, opacity: .7, fontSize: 12 }}>· {c.pupilCount}</span>
                </button>
              ))}
            </div>

            {classroom && (
              <>
                <div className="adash-kpis">
                  <div className="adash-kpi"><div className="lbl">Pupils</div><div className="num">{classroom.pupilCount}</div><div className="delta">In {classroom.name}</div></div>
                  <div className="adash-kpi"><div className="lbl">Path progress</div><div className="num">{pathProgress ? `${pathProgress.pct}%` : "—"}</div><div className="delta">{pathProgress ? `${pathProgress.completed} of ${pathProgress.total} books` : ""}</div></div>
                  <div className="adash-kpi"><div className="lbl">Assignments</div><div className="num">{(assignments || []).length}</div><div className="delta">{(assignments || []).filter(a => a.status === "completed").length} complete</div></div>
                  <div className="adash-kpi"><div className="lbl">Need support</div><div className="num">{(alerts || []).length}</div><div className="delta">Pupils flagged</div></div>
                </div>

                <div className="adash-grid-2">
                  <div className="adash-card">
                    <h5>Pupil progress</h5>
                    <div>
                      {(pupils || []).map(s => (
                        <div className="roster-row" key={s.child.id}>
                          <Avatar name={s.child.shortName} color={s.child.avatarColor} size={36} />
                          <div>
                            <div className="name">{s.child.displayName}</div>
                            <div className="meta">{s.booksCompleted} books · {s.stampsEarned} stamps</div>
                          </div>
                          <div className="prog">
                            <div className="bar"><span style={{ width: `${s.currentLevelPct}%` }} /></div>
                          </div>
                          <div className="lvl">L{s.child.currentLevelId}</div>
                        </div>
                      ))}
                      {(pupils || []).length === 0 && <div style={{ padding: 20, color: "var(--ink-soft)" }}>No pupils in this class yet.</div>}
                    </div>
                  </div>

                  <div className="adash-card">
                    <h5>Children needing support</h5>
                    {(alerts || []).length === 0 && (
                      <div style={{ padding: 14, fontSize: 14, color: "var(--ink-mid)" }}>
                        Everyone's on pace. 🌳
                      </div>
                    )}
                    {(alerts || []).map((a, i) => (
                      <div key={i} className="roster-row">
                        <Avatar name={a.child.shortName} color={a.child.avatarColor} size={36} />
                        <div>
                          <div className="name">{a.child.shortName}</div>
                          <div className="meta">{a.detail}</div>
                        </div>
                        <span className={`adash-pill ${a.severity === "warn" ? "warn" : "info"}`}>{a.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <h5 style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-soft)", margin: "28px 0 12px" }}>
                  Current assignments
                </h5>
                <table className="adash-table">
                  <thead>
                    <tr>
                      <th style={{ width: "38%" }}>Book</th>
                      <th>Strand</th>
                      <th>Level</th>
                      <th>Completion</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assignments || []).map(a => {
                      const b = a.book || {};
                      const s = STRANDS[b.strandUi] || STRANDS.tafiya;
                      return (
                        <tr key={a.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 32, height: 42, borderRadius: "3px 6px 6px 3px", background: s.bg, boxShadow: "inset 3px 0 0 rgba(0,0,0,.15)" }} />
                              <strong>{b.title || "—"}</strong>
                            </div>
                          </td>
                          <td><StrandPill strand={b.strandUi} size="sm" /></td>
                          <td>{a.completedPct}%</td>
                          <td style={{ color: "var(--ink-soft)" }}>{a.dueOn || "—"}</td>
                          <td>
                            <span className={`adash-pill ${a.status === "completed" ? "ok" : a.status === "started" ? "warn" : ""}`}>
                              {a.status === "completed" ? "Complete" : a.status === "started" ? "In progress" : "Not started"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   SCHOOL ADMIN DASHBOARD
   ============================================================ */

function SchoolAdminDashScreen({ onNavigate }) {
  const SCHOOL_ID = (window.HaarayaSession && HaarayaSession.schoolId()) || 1;
  const { data }      = useApi(() => HaarayaApi.getSchoolDashboard(SCHOOL_ID), [SCHOOL_ID]);
  const { data: kpi } = useApi(() => HaarayaApi.getSchoolUsageOverview(SCHOOL_ID), [SCHOOL_ID]);

  if (!data || !kpi) return null;

  const { school, teachers, classrooms, pupils, subscription, sponsored } = data;

  return (
    <main className="nd-page role-adult" data-screen-label="School Admin Dashboard">
      <div className="nd">
        <div className="nd-top">
          <div className="nd-word"><img src="assets/odyssey-seal.png" alt="Haaraya" /> Haaraya</div>
          <nav className="nd-nav">
            <a className="on">Overview</a>
            <a>Teachers</a>
            <a>Classrooms</a>
            <a>Subscription</a>
            <a>Reports</a>
          </nav>
          <div className="nd-chip">
            <Avatar name="Demo School Admin" color="#00838F" size={40} />
            <div className="who">
              <div className="n">Demo School Admin</div>
              <div className="l">School admin</div>
            </div>
          </div>
        </div>
        <div className="dash role-adult" style={{ display: "block", background: "transparent", border: "none", boxShadow: "none", padding: 0, minHeight: 0 }}>
          <div className="dash-main" style={{ padding: 0 }}>
            <div className="dash-header">
              <div>
                <h3>{school.name}</h3>
                <div className="sub">{school.type} · {school.city}, {school.country} · {subscription ? `${subscription.plan} plan` : "No subscription"}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost-dark btn-sm">+ Invite teacher</button>
                <button className="btn btn-primary btn-sm">+ Add pupil</button>
              </div>
            </div>

            <div className="adash-kpis">
              <div className="adash-kpi"><div className="lbl">Pupils</div><div className="num">{kpi.pupilCount}</div><div className="delta">Across {kpi.classroomCount} classes</div></div>
              <div className="adash-kpi"><div className="lbl">Teachers</div><div className="num">{kpi.teacherCount}</div><div className="delta">Active</div></div>
              <div className="adash-kpi"><div className="lbl">Books read</div><div className="num">{kpi.totalBooks}</div><div className="delta">School-wide</div></div>
              <div className="adash-kpi"><div className="lbl">Average level</div><div className="num">L{kpi.avgLevel}</div><div className="delta">Across the school</div></div>
            </div>

            <div className="adash-grid-2">
              <div className="adash-card">
                <h5>Teachers</h5>
                {teachers.map(t => (
                  <div className="roster-row" key={t.id}>
                    <Avatar name={t.teacher.displayName} color="#8E24AA" size={36} />
                    <div>
                      <div className="name">{t.teacher.displayName}</div>
                      <div className="meta">{t.role.replace("_", " ")} · {t.teacher.email}</div>
                    </div>
                    <span className="adash-pill ok">Active</span>
                  </div>
                ))}
              </div>
              <div className="adash-card">
                <h5>Sponsored access</h5>
                {sponsored.length === 0 && <div style={{ padding: 14, color: "var(--ink-soft)", fontSize: 14 }}>No sponsored pupils.</div>}
                {sponsored.map(s => {
                  const c = pupils.find(p => p.id === s.childId);
                  return (
                    <div className="roster-row" key={s.id}>
                      <Avatar name={c ? c.shortName : "?"} color={c ? c.avatarColor : "#228B22"} size={36} />
                      <div>
                        <div className="name">{c ? c.displayName : "—"}</div>
                        <div className="meta">{s.sponsorName} · covers until {s.coversUntil}</div>
                      </div>
                      <span className="adash-pill info">Sponsored</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <h5 style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-soft)", margin: "28px 0 12px" }}>
              Classrooms
            </h5>
            <table className="adash-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Grade</th>
                  <th>Primary teacher</th>
                  <th>Pupils</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.grade}</td>
                    <td>{c.primaryTeacher ? c.primaryTeacher.displayName : "—"}</td>
                    <td>{c.pupilCount}</td>
                    <td style={{ color: "var(--ink-soft)" }}>{c.term} · {c.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   HAARAYA ADMIN DASHBOARD
   ============================================================ */

const ADMIN_STRAND_ORDER = [
  "soundables", "soundables-plus", "hafwas", "tafiya", "tafiya-nonfiction",
  "folktale", "poetry", "duniya", "stamina", "stamina-nonfiction",
];

function AdminBreakdownBar({ label, count, max, color }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 40px", alignItems: "center", gap: 10, padding: "5px 0" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ height: 10, borderRadius: 6, background: "rgba(0,0,0,.06)", overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${pct}%`, background: color || "#228B22", borderRadius: 6, transition: "width .4s" }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, textAlign: "right", color: "var(--ink)" }}>{count}</div>
    </div>
  );
}

function AdminInspectDrawer({ code, onClose }) {
  const { data, loading } = useApi(() => code ? HaarayaAdminDB.get(code) : null, [code]);
  useEffectAdult(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const about = data && data.about;
  const check = data && data.check;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,30,20,.45)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(560px, 94vw)", background: "var(--paper, #fff)", height: "100%", overflowY: "auto", boxShadow: "-12px 0 40px rgba(0,0,0,.2)", padding: "24px 28px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--ink-soft)", letterSpacing: ".04em" }}>{code}</span>
          <button className="btn btn-ghost-dark btn-sm" onClick={onClose}>Close ✕</button>
        </div>
        {loading && <div style={{ padding: 40, color: "var(--ink-soft)" }}>Loading live content…</div>}
        {!loading && !about && !check && <div style={{ padding: 40, color: "var(--ink-soft)" }}>No content found for this book.</div>}
        {about && (
          <>
            <h3 style={{ margin: "6px 0 6px", fontSize: 26 }}>{about.title}</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
              {HaarayaAdminDB.strandUi(about.strand) && <StrandPill strand={HaarayaAdminDB.strandUi(about.strand)} size="sm" />}
              <span className="adash-pill">Level {about.level}</span>
              {check && <span className="adash-pill info">{check.kind}</span>}
            </div>
            <div className="adash-card" style={{ marginBottom: 16 }}>
              <h5>About this book</h5>
              {about.about && <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>{about.about}</p>}
              {about.read && <p style={{ fontSize: 14, margin: "0 0 10px" }}><strong>Read to find out:</strong> {about.read}</p>}
              {about.focusVisible && <p style={{ fontSize: 13, color: "var(--ink-mid)", margin: "0 0 4px" }}><strong>Focus (visible):</strong> {about.focusVisible}</p>}
              {about.focusSound && <p style={{ fontSize: 13, color: "var(--ink-mid)", margin: "0 0 4px" }}><strong>Focus (sound):</strong> {about.focusSound}</p>}
              {about.soundbite && <p style={{ fontSize: 13, color: "var(--ink-mid)", margin: "0 0 4px" }}><strong>Soundbite:</strong> {about.soundbite}</p>}
              {about.updatedAt && <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 10 }}>Updated {String(about.updatedAt).slice(0, 10)}</div>}
            </div>
          </>
        )}
        {check && (
          <div className="adash-card">
            <h5>Reading check · {check.kind}</h5>
            {check.questions.map((q, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: "1px dashed var(--sand)" }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{i + 1}. {q.q}</div>
                <div style={{ display: "grid", gap: 4 }}>
                  {q.options.map((o, oi) => (
                    <div key={oi} style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, background: oi === q.answer ? "rgba(34,139,34,.12)" : "transparent", fontWeight: oi === q.answer ? 800 : 500, color: oi === q.answer ? "#1A6E1A" : "var(--ink-mid)" }}>
                      {String.fromCharCode(65 + oi)}. {o}{oi === q.answer ? "  ✓" : ""}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {check.write && (
              <div style={{ padding: "10px 0" }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>✍️ Write: {check.write.prompt}</div>
                {check.write.answer && <div style={{ fontSize: 13, color: "var(--ink-mid)" }}>Model answer: {check.write.answer}</div>}
              </div>
            )}
            {check.retryNote && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>Retry note: {check.retryNote}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminSignInForm({ onSignedIn }) {
  const [mode, setMode] = useStateAdult("signin"); // signin | create
  const [name, setName] = useStateAdult("");
  const [email, setEmail] = useStateAdult("");
  const [pw, setPw] = useStateAdult("");
  const [busy, setBusy] = useStateAdult(false);
  const [err, setErr] = useStateAdult("");
  const [msg, setMsg] = useStateAdult("");
  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (mode === "create") {
        const data = await window.HaarayaAuth.signUp({ email: email.trim(), password: pw, fullName: name.trim(), role: "haaraya_admin" });
        if (data && data.session) { onSignedIn(); }
        else { setMsg("Account created. If email confirmation is on, confirm via the emailed link, then sign in."); setMode("signin"); }
      } else {
        await window.HaarayaAuth.signIn({ email: email.trim(), password: pw });
        onSignedIn();
      }
    } catch (ex) {
      setErr(ex.message || String(ex));
    } finally { setBusy(false); }
  };
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button type="button" className={`btn btn-sm ${mode === "signin" ? "btn-primary" : "btn-ghost-dark"}`} onClick={() => { setMode("signin"); setErr(""); setMsg(""); }}>Sign in</button>
        <button type="button" className={`btn btn-sm ${mode === "create" ? "btn-primary" : "btn-ghost-dark"}`} onClick={() => { setMode("create"); setErr(""); setMsg(""); }}>Create admin account</button>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 340 }}>
        {mode === "create" && <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full name" autoComplete="name" style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--sand, #ddd)", fontSize: 14 }} />}
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" autoComplete="username" style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--sand, #ddd)", fontSize: 14 }} />
        <input type="password" required value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoComplete={mode === "create" ? "new-password" : "current-password"} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--sand, #ddd)", fontSize: 14 }} />
        {err && <div style={{ fontSize: 13, color: "#B71C1C" }}>{err}</div>}
        {msg && <div style={{ fontSize: 13, color: "#1A6E1A" }}>{msg}</div>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Working…" : (mode === "create" ? "Create admin account" : "Sign in")}</button>
      </form>
    </div>
  );
}

function OpsStat({ label, value, note, denied, missing }) {
  return (
    <div className="adash-kpi">
      <div className="lbl">{label}</div>
      <div className="num" style={{ color: (denied || missing) ? "var(--ink-soft)" : "var(--ink)" }}>
        {denied ? "🔒" : missing ? "—" : (value == null ? "…" : value)}
      </div>
      <div className="delta">{denied ? "Grant pending" : missing ? "Not in DB" : (note || "")}</div>
    </div>
  );
}

function OpsSection({ title, res, children, emptyNote }) {
  const denied = res && res.denied;
  const missing = res && res.missing;
  const err = res && res.error && !denied && !missing;
  return (
    <div className="adash-card" style={{ marginBottom: 16 }}>
      <h5>{title}</h5>
      {denied && <div style={{ fontSize: 13, color: "var(--ink-mid)", padding: "6px 0" }}>🔒 Locked — sign in as a Haaraya admin and run <code>supabase/admin_read_grants.sql</code> to unlock.</div>}
      {missing && <div style={{ fontSize: 13, color: "var(--ink-soft)", padding: "6px 0" }}>This table isn’t in the database yet.</div>}
      {err && <div style={{ fontSize: 13, color: "#B71C1C", padding: "6px 0" }}>{String(res.error)}</div>}
      {!denied && !missing && !err && (res ? children : <div style={{ padding: 10, color: "var(--ink-soft)" }}>Loading…</div>)}
      {!denied && !missing && !err && res && res.rows && res.rows.length === 0 && (
        <div style={{ padding: 10, color: "var(--ink-soft)" }}>{emptyNote || "No rows."}</div>
      )}
    </div>
  );
}

function countBy(rows, key) {
  const m = {};
  (rows || []).forEach(r => { const k = r[key] || "—"; m[k] = (m[k] || 0) + 1; });
  return m;
}

function AdminOps({ live }) {
  const [nonce, setNonce] = useStateAdult(0);
  const dep = [live, nonce];
  const { data: me } = useApi(() => live ? HaarayaAdminDB.currentUser() : null, dep);

  const { data: users }    = useApi(() => live ? HaarayaAdminDB.ops.users() : null, dep);
  const { data: children } = useApi(() => live ? HaarayaAdminDB.ops.children() : null, dep);
  const { data: schools }  = useApi(() => live ? HaarayaAdminDB.ops.schools() : null, dep);
  const { data: classrooms } = useApi(() => live ? HaarayaAdminDB.ops.classrooms() : null, dep);
  const { data: subs }     = useApi(() => live ? HaarayaAdminDB.ops.subscriptions() : null, dep);
  const { data: assigns }  = useApi(() => live ? HaarayaAdminDB.ops.assignments() : null, dep);
  const { data: prog }     = useApi(() => live ? HaarayaAdminDB.ops.progress() : null, dep);
  const { data: strands }  = useApi(() => live ? HaarayaAdminDB.ops.strands() : null, dep);
  const { data: levels }   = useApi(() => live ? HaarayaAdminDB.ops.levels() : null, dep);
  const { data: odyssey }  = useApi(() => live ? HaarayaAdminDB.ops.odyssey() : null, dep);

  const g = (r, f) => (r ? (r.count != null ? r.count : (r.rows ? r.rows.length : null)) : null);
  const usersByRole = users && users.rows ? countBy(users.rows, "role") : {};
  const subsByStatus = subs && subs.rows ? countBy(subs.rows, "status") : {};
  const progByStatus = prog && prog.rows ? countBy(prog.rows, "status") : {};
  const isStaff = !!(me && (me.role === "haaraya_admin" || me.role === "admin" || me.role === "staff"));
  const signedIn = !!me;

  return (
    <div className="dash-main" style={{ padding: 0 }}>
      <div className="dash-header">
        <div>
          <h3>Platform operations</h3>
          <div className="sub">People · organisations · access · progress — live from Supabase</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 13, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
          {signedIn
            ? <span style={{ color: isStaff ? "#1A6E1A" : "#B71C1C", fontWeight: 800 }}>
                {isStaff ? "✓ " : "⚠ "}{me.name}{me.role ? ` · ${me.role}` : ""}
              </span>
            : <span style={{ color: "var(--ink-soft)" }}>Not signed in</span>}
          {signedIn && (
            <button className="btn btn-ghost-dark btn-sm" onClick={async () => { await window.HaarayaAuth.signOut(); setNonce(n => n + 1); }}>Sign out</button>
          )}
        </div>
      </div>

      {!signedIn && (
        <div className="adash-card" style={{ marginBottom: 16 }}>
          <h5>Sign in to view operational data</h5>
          <p style={{ fontSize: 14, color: "var(--ink-mid)", margin: "0 0 6px", lineHeight: 1.5 }}>
            People, schools, subscriptions and progress hold personal data, so they’re readable only by a signed-in Haaraya admin. Sign in — or create an admin account (name, email, password only) — below.
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
            Reference data below (strands, levels, Odyssey) becomes public once <code>supabase/admin_read_grants.sql</code> is applied.
          </p>
          <AdminSignInForm onSignedIn={() => setNonce(n => n + 1)} />
        </div>
      )}

      {signedIn && !isStaff && (
        <div className="adash-card" style={{ marginBottom: 16 }}>
          <h5>Signed in — but not a Haaraya admin</h5>
          <p style={{ fontSize: 14, color: "var(--ink-mid)", margin: "0 0 8px", lineHeight: 1.5 }}>
            You’re signed in as <strong>{me.name}</strong>, but this account doesn’t have Haaraya admin access. If you believe this is a mistake, contact your Haaraya administrator.
          </p>
          <button className="btn btn-ghost-dark btn-sm" onClick={async () => { await window.HaarayaAuth.signOut(); setNonce(n => n + 1); }}>Sign out</button>
        </div>
      )}

      <div className="adash-kpis">
        <OpsStat label="Users" value={g(users)} note={Object.entries(usersByRole).map(([k, v]) => `${v} ${k}`).join(" · ")} denied={users && users.denied} missing={users && users.missing} />
        <OpsStat label="Children" value={g(children)} note="Reader profiles" denied={children && children.denied} missing={children && children.missing} />
        <OpsStat label="Schools" value={g(schools)} denied={schools && schools.denied} missing={schools && schools.missing} />
        <OpsStat label="Subscriptions" value={g(subs)} note={Object.entries(subsByStatus).map(([k, v]) => `${v} ${k}`).join(" · ")} denied={subs && subs.denied} missing={subs && subs.missing} />
      </div>

      <div className="adash-grid-2">
        <OpsSection title="People by role" res={users}>
          {users && users.rows && Object.entries(usersByRole).map(([role, n]) => (
            <div className="roster-row" key={role}>
              <div className="name" style={{ textTransform: "capitalize" }}>{role.replace(/_/g, " ")}</div>
              <span className="adash-pill">{n}</span>
            </div>
          ))}
        </OpsSection>
        <OpsSection title="Recent accounts" res={users}>
          {users && users.rows && users.rows.slice(0, 8).map(u => (
            <div className="roster-row" key={u.id}>
              <Avatar name={u.full_name || u.email} color="#283593" size={34} />
              <div>
                <div className="name">{u.full_name || "—"}</div>
                <div className="meta">{u.email} · {u.role}</div>
              </div>
            </div>
          ))}
        </OpsSection>
      </div>

      <div className="adash-grid-2">
        <OpsSection title="Schools" res={schools} emptyNote="No schools yet.">
          {schools && schools.rows && schools.rows.slice(0, 8).map(s => (
            <div className="roster-row" key={s.id}>
              <div>
                <div className="name">{s.name}</div>
                <div className="meta">{[s.type, s.city, s.country].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
          ))}
        </OpsSection>
        <OpsSection title="Classrooms" res={classrooms} emptyNote="No classrooms yet.">
          {classrooms && classrooms.rows && classrooms.rows.slice(0, 8).map(c => (
            <div className="roster-row" key={c.id}>
              <div className="name">{c.name}</div>
              <span className="adash-pill">School #{c.school_id}</span>
            </div>
          ))}
        </OpsSection>
      </div>

      <div className="adash-grid-2">
        <OpsSection title="Subscriptions" res={subs} emptyNote="No subscriptions yet.">
          <table className="adash-table" style={{ border: 0, borderRadius: 0 }}>
            <thead><tr><th>Plan</th><th>Cycle</th><th>Status</th><th>Expires</th></tr></thead>
            <tbody>
              {subs && subs.rows && subs.rows.slice(0, 8).map(s => (
                <tr key={s.id}>
                  <td style={{ textTransform: "capitalize" }}>{s.plan_type}</td>
                  <td>{s.billing_cycle || "—"}</td>
                  <td><span className={`adash-pill ${s.status === "active" ? "ok" : "warn"}`}>{s.status}</span></td>
                  <td>{s.expires_at || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpsSection>
        <OpsSection title="Reading progress" res={prog} emptyNote="No progress records yet.">
          {prog && prog.rows && (
            <>
              <OpsStat label="Total records" value={g(prog)} note="" />
              <div style={{ marginTop: 8 }}>
                {Object.entries(progByStatus).map(([st, n]) => (
                  <AdminBreakdownBar key={st} label={st.replace(/_/g, " ")} count={n} max={Math.max(1, ...Object.values(progByStatus))} color="#228B22" />
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>
                {(assigns && assigns.rows) ? `${assigns.rows.length} assignments` : ""}
              </div>
            </>
          )}
        </OpsSection>
      </div>

      <h5 style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-soft)", margin: "28px 0 12px" }}>
        Reference data
      </h5>
      <div className="adash-grid-2">
        <OpsSection title="Strands" res={strands} emptyNote="No strands.">
          {strands && strands.rows && strands.rows.map(s => (
            <div className="roster-row" key={s.id}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: s.color || "#ccc" }} />
              <div className="name">{s.name}</div>
              <span className={`adash-pill ${s.is_active ? "ok" : "warn"}`}>{s.is_active ? "Live" : "Off"}</span>
            </div>
          ))}
        </OpsSection>
        <OpsSection title="Levels" res={levels} emptyNote="No levels.">
          {levels && levels.rows && levels.rows.map(l => (
            <div className="roster-row" key={l.id}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: l.badge_color || "#283593" }} />
              <div>
                <div className="name">{l.level_name}</div>
                <div className="meta">{l.level_code}{l.band ? ` · ${l.band}` : ""}</div>
              </div>
            </div>
          ))}
        </OpsSection>
      </div>

      <OpsSection title={`The Odyssey${odyssey && odyssey.rows && !odyssey.denied && !odyssey.missing && !odyssey.error ? ` · ${odyssey.rows.length} books` : ""}`} res={odyssey} emptyNote="No Odyssey books in the database.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {odyssey && odyssey.rows && odyssey.rows.slice(0, 24).map((b, i) => {
            const title = b.title || b.name || b.book_title || b.slug || (`Book ${b.book_number || b.number || b.id || i + 1}`);
            return (
              <div key={b.id || i} style={{ padding: "8px 10px", border: "1px solid var(--sand, #eee)", borderRadius: 8, fontSize: 13 }}>
                <strong>{title}</strong>
                {(b.stream || b.world || b.stage) && <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{[b.stream, b.world, b.stage].filter(Boolean).join(" · ")}</div>}
              </div>
            );
          })}
        </div>
      </OpsSection>

      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 16, lineHeight: 1.5 }}>
        Live read of the operational tables. Personal data (people, subscriptions, progress) is gated behind a Haaraya-admin sign-in and row-level security — see <code>supabase/admin_read_grants.sql</code>.
      </div>
    </div>
  );
}

function HaarayaAdminDashScreen({ onNavigate }) {
  const live = !!(window.HaarayaAdminDB && HaarayaAdminDB.ready());
  const { data: ov, loading: ovLoading, error: ovError } = useApi(() => live ? HaarayaAdminDB.overview() : null, [live]);
  const [search, setSearch] = useStateAdult("");
  const [strandF, setStrandF] = useStateAdult("");
  const [levelF, setLevelF] = useStateAdult("");
  const [kindF, setKindF] = useStateAdult("");
  const [inspect, setInspect] = useStateAdult(null);
  const [tab, setTab] = useStateAdult("content");
  const { data: rows } = useApi(
    () => live ? HaarayaAdminDB.catalogue({ search, strandUi: strandF, level: levelF, kind: kindF }) : [],
    [live, search, strandF, levelF, kindF]
  );

  const list = rows || [];
  const shown = list.slice(0, 150);
  const strandMax = ov ? Math.max(1, ...Object.values(ov.byStrand)) : 1;
  const levelMax = ov ? Math.max(1, ...Object.values(ov.byLevel)) : 1;
  const strandKeys = ov ? ADMIN_STRAND_ORDER.filter(k => ov.byStrand[k]) : [];

  return (
    <main className="nd-page role-adult" data-screen-label="Haaraya Admin Dashboard">
      <div className="nd">
        <div className="nd-top">
          <div className="nd-word"><img src="assets/odyssey-seal.png" alt="Haaraya" /> Haaraya</div>
          <nav className="nd-nav">
            <a className={tab === "content" ? "on" : ""} onClick={() => setTab("content")}>Content</a>
            <a className={tab === "ops" ? "on" : ""} onClick={() => setTab("ops")}>Operations</a>
            <a onClick={() => onNavigate("odyssey-library")}>Odyssey library</a>
            <a onClick={() => onNavigate("library")}>Tafiya library</a>
          </nav>
          <div className="nd-chip">
            <Avatar name="Haaraya Admin" color="#283593" size={40} />
            <div className="who">
              <div className="n">Haaraya Admin</div>
              <div className="l">Owner back end</div>
            </div>
          </div>
        </div>
        <div className="dash role-adult" style={{ display: "block", background: "transparent", border: "none", boxShadow: "none", padding: 0, minHeight: 0 }}>
          {tab === "ops" && <AdminOps live={live} />}
          {tab === "content" && <div className="dash-main" style={{ padding: 0 }}>
            <div className="dash-header">
              <div>
                <h3>Haaraya content library</h3>
                <div className="sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, color: live ? "#1A6E1A" : "#B71C1C" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: live ? "#2E9E2E" : "#B71C1C", boxShadow: live ? "0 0 0 3px rgba(46,158,46,.2)" : "none" }} />
                    {live ? "Live · Supabase" : "Supabase unavailable"}
                  </span>
                  {ov && <span>· {ov.total} books · About + Reading Checks served live</span>}
                </div>
              </div>
            </div>

            {ovError && <div className="adash-card" style={{ color: "#B71C1C" }}>Could not reach Supabase: {String(ovError.message || ovError)}</div>}
            {!live && <div className="adash-card" style={{ color: "#B71C1C" }}>The Supabase client isn’t loaded, so live content can’t be read. Check <code>supabase-client.js</code>.</div>}

            <div className="adash-kpis">
              <div className="adash-kpi"><div className="lbl">Books</div><div className="num">{ov ? ov.total : "…"}</div><div className="delta">Catalogue (live)</div></div>
              <div className="adash-kpi"><div className="lbl">About pages</div><div className="num">{ov ? ov.aboutPages : "…"}</div><div className="delta">{ov ? `${ov.total - ov.aboutPages} missing` : ""}</div></div>
              <div className="adash-kpi"><div className="lbl">Reading checks</div><div className="num">{ov ? ov.readingChecks : "…"}</div><div className="delta">{ov ? Object.entries(ov.kinds).map(([k, v]) => `${v} ${k}`).join(" · ") : ""}</div></div>
              <div className="adash-kpi"><div className="lbl">Coverage</div><div className="num">{ov && ov.total ? `${Math.round((Math.min(ov.aboutPages, ov.readingChecks) / ov.total) * 100)}%` : "…"}</div><div className="delta">Books with both</div></div>
            </div>

            <div className="adash-grid-2">
              <div className="adash-card">
                <h5>By strand</h5>
                {!ov && <div style={{ padding: 14, color: "var(--ink-soft)" }}>Loading…</div>}
                {ov && strandKeys.map(k => (
                  <AdminBreakdownBar key={k} label={(STRANDS[k] && STRANDS[k].name) || k} count={ov.byStrand[k]} max={strandMax} color={(STRANDS[k] && STRANDS[k].color) || "#228B22"} />
                ))}
              </div>
              <div className="adash-card">
                <h5>By level</h5>
                {!ov && <div style={{ padding: 14, color: "var(--ink-soft)" }}>Loading…</div>}
                {ov && Object.keys(ov.byLevel).map(Number).sort((a, b) => a - b).map(l => (
                  <AdminBreakdownBar key={l} label={`Level ${l}`} count={ov.byLevel[l]} max={levelMax} color="#283593" />
                ))}
              </div>
            </div>

            <h5 style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-soft)", margin: "28px 0 12px" }}>
              Catalogue · {list.length} shown{list.length > 150 ? " (first 150)" : ""}
            </h5>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or code…" style={{ flex: "1 1 220px", minWidth: 180, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--sand, #ddd)", fontSize: 14 }} />
              <select value={strandF} onChange={e => setStrandF(e.target.value)} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--sand, #ddd)", fontSize: 14 }}>
                <option value="">All strands</option>
                {ADMIN_STRAND_ORDER.map(k => <option key={k} value={k}>{(STRANDS[k] && STRANDS[k].name) || k}</option>)}
              </select>
              <select value={levelF} onChange={e => setLevelF(e.target.value)} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--sand, #ddd)", fontSize: 14 }}>
                <option value="">All levels</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(l => <option key={l} value={l}>Level {l}</option>)}
              </select>
              <select value={kindF} onChange={e => setKindF(e.target.value)} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--sand, #ddd)", fontSize: 14 }}>
                <option value="">All checks</option>
                <option value="phonics">Phonics</option>
                <option value="comprehension">Comprehension</option>
              </select>
            </div>
            <table className="adash-table">
              <thead>
                <tr><th style={{ width: 110 }}>Code</th><th>Title</th><th>Strand</th><th>Level</th><th>Check</th><th>Content</th></tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.code} onClick={() => setInspect(r.code)} style={{ cursor: "pointer" }}>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--ink-soft)" }}>{r.code}</td>
                    <td><strong>{r.title || "—"}</strong></td>
                    <td>{r.strandUi ? <StrandPill strand={r.strandUi} size="sm" /> : (r.strand || "—")}</td>
                    <td>L{r.level}</td>
                    <td><span className={`adash-pill ${r.kind === "phonics" ? "info" : ""}`}>{r.kind || "—"}</span></td>
                    <td>
                      <span className={`adash-pill ${r.hasAbout ? "ok" : "warn"}`} style={{ marginRight: 4 }}>About {r.hasAbout ? "✓" : "✗"}</span>
                      <span className={`adash-pill ${r.hasQuiz ? "ok" : "warn"}`}>Quiz {r.hasQuiz ? "✓" : "✗"}</span>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && !ovLoading && (
                  <tr><td colSpan={6} style={{ padding: 24, color: "var(--ink-soft)", textAlign: "center" }}>No books match these filters.</td></tr>
                )}
              </tbody>
            </table>

            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 16, lineHeight: 1.5 }}>
              This is a live read of the Supabase content that drives the site. Editing About text and reading-check questions is done through the reviewer sign-in / database — the reader picks up changes on next load, with nothing baked into the client.
            </div>
          </div>}
        </div>
      </div>
      {inspect && <AdminInspectDrawer code={inspect} onClose={() => setInspect(null)} />}
    </main>
  );
}

Object.assign(window, {
  TeacherDashScreen, SchoolAdminDashScreen, HaarayaAdminDashScreen,
});
