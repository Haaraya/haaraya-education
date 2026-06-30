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
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="wrap" style={{ padding: "40px 32px 80px", maxWidth: 1380 }}>
        <div className="dash" style={{ minHeight: 720 }}>
          <AdultSidebar
            items={[
              { label: "Classrooms",   active: true },
              { label: "Assignments" },
              { label: "Pupil progress" },
              { label: "Support alerts" },
              { label: "Reports" },
              { label: "Library", onClick: () => onNavigate("library") },
            ]}
            footerName={ME}
            footerSub="Lead teacher"
            footerColor="#8E24AA"
          />
          <div className="dash-main">
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
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="wrap" style={{ padding: "40px 32px 80px", maxWidth: 1380 }}>
        <div className="dash" style={{ minHeight: 720 }}>
          <AdultSidebar
            items={[
              { label: "Overview", active: true },
              { label: "Teachers" },
              { label: "Classrooms" },
              { label: "Pupils" },
              { label: "Subscription" },
              { label: "Reports" },
            ]}
            footerName="Demo School Admin"
            footerSub="School admin"
            footerColor="#00838F"
          />
          <div className="dash-main">
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

function HaarayaAdminDashScreen({ onNavigate }) {
  const { data: cat }     = useApi(() => HaarayaApi.getAdminCatalogue(), []);
  const { data: subs }    = useApi(() => HaarayaApi.getAdminSubscriptions(), []);
  const { data: sponsored }= useApi(() => HaarayaApi.getAdminSponsoredAccess(), []);
  const { data: audit }   = useApi(() => HaarayaApi.getAdminAuditLog(20), []);
  const { data: strands } = useApi(() => HaarayaApi.getStrands(), []);
  const { data: levels }  = useApi(() => HaarayaApi.getLevels(), []);
  const { data: recentBooks } = useApi(() => HaarayaApi.getBooks({ limit: 10 }), []);

  if (!cat) return null;

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="wrap" style={{ padding: "40px 32px 80px", maxWidth: 1380 }}>
        <div className="dash" style={{ minHeight: 720 }}>
          <AdultSidebar
            items={[
              { label: "Catalogue", active: true },
              { label: "Levels & strands" },
              { label: "Stamps & themes" },
              { label: "Subscriptions" },
              { label: "Sponsored access" },
              { label: "Audit log" },
              { label: "Users" },
            ]}
            footerName="Demo Admin"
            footerSub="Internal"
            footerColor="#283593"
          />
          <div className="dash-main">
            <div className="dash-header">
              <div>
                <h3>Haaraya control center</h3>
                <div className="sub">Internal · Manage the library, levels, strands, and platform access</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost-dark btn-sm">Upload asset</button>
                <button className="btn btn-primary btn-sm">+ New book</button>
              </div>
            </div>

            <div className="adash-kpis">
              <div className="adash-kpi"><div className="lbl">Books</div><div className="num">{cat.booksTotal}</div><div className="delta">{cat.booksActive} active · {cat.booksHidden} hidden</div></div>
              <div className="adash-kpi"><div className="lbl">Strands</div><div className="num">{cat.strands}</div><div className="delta">Across {cat.levels} levels</div></div>
              <div className="adash-kpi"><div className="lbl">Assets</div><div className="num">{cat.assets}</div><div className="delta">Logos, covers, backgrounds</div></div>
              <div className="adash-kpi"><div className="lbl">Subscriptions</div><div className="num">{(subs || []).length}</div><div className="delta">Active accounts</div></div>
            </div>

            <div className="adash-grid-2">
              <div className="adash-card">
                <h5>Recent books</h5>
                <table className="adash-table" style={{ border: 0, borderRadius: 0 }}>
                  <thead>
                    <tr><th>Book</th><th>Strand</th><th>Level</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {(recentBooks || []).map(b => (
                      <tr key={b.id}>
                        <td><strong>{b.title}</strong></td>
                        <td><StrandPill strand={b.strandUi} size="sm" /></td>
                        <td>L{b.levelId}</td>
                        <td><span className={`adash-pill ${b.isActive ? "ok" : "warn"}`}>{b.isActive ? "Active" : "Hidden"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="adash-card">
                <h5>Strands</h5>
                <div>
                  {(strands || []).map(st => (
                    <div className="roster-row" key={st.id}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: st.color }} />
                      <div>
                        <div className="name">{st.name}</div>
                        <div className="meta">{st.primaryAppZone ? st.primaryAppZone.replace("_", " ") : "—"}</div>
                      </div>
                      <span className="adash-pill">{st.isActive ? "Live" : "Off"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h5 style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-soft)", margin: "28px 0 12px" }}>
              Subscriptions
            </h5>
            <table className="adash-table">
              <thead><tr><th>Owner</th><th>Plan</th><th>Seats</th><th>Renews</th><th>Status</th></tr></thead>
              <tbody>
                {(subs || []).map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.ownerName}</strong> <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>({s.ownerType})</span></td>
                    <td>{s.plan}</td>
                    <td>{s.seats}</td>
                    <td>{s.renewsOn}</td>
                    <td><span className="adash-pill ok">{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="adash-grid-2" style={{ marginTop: 28 }}>
              <div className="adash-card">
                <h5>Sponsored access</h5>
                {(sponsored || []).map(s => (
                  <div className="roster-row" key={s.id}>
                    <Avatar name={(s.child || {}).shortName || "?"} color={(s.child || {}).avatarColor || "#228B22"} size={36} />
                    <div>
                      <div className="name">{(s.child || {}).displayName || "—"}</div>
                      <div className="meta">{s.sponsorName} · until {s.coversUntil}</div>
                    </div>
                    <span className="adash-pill info">Sponsored</span>
                  </div>
                ))}
              </div>
              <div className="adash-card">
                <h5>Recent admin actions</h5>
                {(audit || []).map(a => (
                  <div key={a.id} style={{ padding: "10px 0", borderBottom: "1px dashed var(--sand)", fontSize: 14 }}>
                    <div style={{ fontWeight: 800 }}>{a.notes}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{a.actionType}</span>
                      {" · "}{a.tableName}{" · "}{a.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

Object.assign(window, {
  TeacherDashScreen, SchoolAdminDashScreen, HaarayaAdminDashScreen,
});
