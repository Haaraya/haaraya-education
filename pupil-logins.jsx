/* ============================================================
   Haaraya — Pupil logins (teacher and school admin pages)
   ------------------------------------------------------------
   Every school can see and print its pupils' logins here, with
   or without Gemmanti: username + 4-number PIN per pupil, Make
   logins for anyone without one, Reset PIN, and printable login
   cards (8 per A4 sheet, QR code opens the pupil sign-in with the
   username filled in). Uses the pupil-accounts Edge Function and
   the pupil_logins table (staff can read their own pupils only).
   ============================================================ */
const { useState: useStatePL, useEffect: useEffectPL } = React;

function plLink(username) {
  try { return new URL("Haaraya%20Home.html?pupil=" + encodeURIComponent(username), location.href).href; } catch (e) { return ""; }
}
function plQr(username) {
  try { const q = qrcode(0, "M"); q.addData(plLink(username)); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); } catch (e) { return ""; }
}
async function plCall(body) {
  const r = await window.HaarayaSupabase.functions.invoke("pupil-accounts", { body });
  if (r.error) {
    let m = r.error.message;
    try { const j = r.error.context && await r.error.context.json(); if (j && j.error) m = j.error; } catch (e) { /* keep */ }
    throw new Error(m);
  }
  return (r.data && r.data.logins) || [];
}

/* pupils: [{ id, name }]; place: class or school name printed on the cards */
function PupilLogins({ pupils, place, anchorId }) {
  const [logins, setLogins] = useStatePL({});
  const [busy, setBusy] = useStatePL("");
  const [msg, setMsg] = useStatePL("");
  const [cards, setCards] = useStatePL(false);
  const [open, setOpen] = useStatePL(false);
  const ids = (pupils || []).map(p => p.id).filter(Boolean);
  const key = ids.join(",");

  useEffectPL(() => {
    if (!ids.length || !window.HaarayaSupabase) return;
    let alive = true;
    window.HaarayaSupabase.from("pupil_logins").select("child_id,username,pin,locked_until").in("child_id", ids).then(r => {
      if (!alive || r.error) return;
      const m = {}; (r.data || []).forEach(x => { m[x.child_id] = { username: x.username, pin: x.pin, locked: !!(x.locked_until && Date.parse(x.locked_until) > Date.now()) }; });
      setLogins(m);
    });
    return () => { alive = false; };
  }, [key]);

  const missing = (pupils || []).filter(p => !logins[p.id]);
  const merge = list => setLogins(m => { const n = { ...m }; list.forEach(l => { if (l.username) n[l.child_id] = { username: l.username, pin: l.pin, locked: false }; }); return n; });
  const make = async () => {
    setBusy("make"); setMsg("");
    try { const l = await plCall({ action: "ensure", child_ids: missing.map(p => p.id) }); merge(l); const bad = l.filter(x => x.error).length; setMsg(bad ? `${bad} login${bad === 1 ? "" : "s"} couldn’t be made. Try again.` : ""); }
    catch (e) { setMsg(e.message || "Couldn’t make logins just now."); }
    setBusy("");
  };
  const reset = async p => {
    setBusy(p.id); setMsg("");
    try { merge(await plCall({ action: "reset", child_id: p.id })); setMsg(`New PIN made for ${p.name.split(" ")[0]}. Print them a new card.`); }
    catch (e) { setMsg(e.message || "Couldn’t reset the PIN just now."); }
    setBusy("");
  };
  const ready = (pupils || []).filter(p => logins[p.id]);
  const shown = open ? pupils || [] : (pupils || []).slice(0, 8);

  return (
    <div className="adash-card pl-card" id={anchorId} style={{ scrollMarginTop: 24 }}>
      <div className="pl-head">
        <div>
          <h5>Pupil logins</h5>
          <p className="pl-sub">Pupils sign in on Haaraya with a username and a 4-number PIN. A grown-up can help the youngest.</p>
        </div>
        <div className="pl-acts">
          {missing.length > 0 && <button className="pl-btn" disabled={!!busy} onClick={make}>{busy === "make" ? "Making logins…" : `Make ${missing.length} login${missing.length === 1 ? "" : "s"}`}</button>}
          {ready.length > 0 && <button className="pl-btn ghost" onClick={() => setCards(true)}>Print login cards</button>}
        </div>
      </div>
      {msg && <div className="pl-msg" role="status">{msg}</div>}
      {!ids.length ? <div className="pl-empty">No pupils yet.</div> : (
        <table className="adash-table pl-table">
          <thead><tr><th>Pupil</th><th>Username</th><th>PIN</th><th></th></tr></thead>
          <tbody>{shown.map(p => { const l = logins[p.id]; return (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td className="pl-mono">{l ? l.username : <span className="pl-none">No login yet</span>}</td>
              <td className="pl-mono">{l ? l.pin : ""}{l && l.locked && <span className="pl-lock"> locked</span>}</td>
              <td style={{ textAlign: "right" }}>{l && <button className="pl-link" disabled={!!busy} onClick={() => reset(p)}>{busy === p.id ? "Working…" : "Reset PIN"}</button>}</td>
            </tr>); })}</tbody>
        </table>
      )}
      {(pupils || []).length > 8 && <button className="pl-link pl-more" onClick={() => setOpen(o => !o)}>{open ? "Show fewer" : `Show all ${(pupils || []).length} pupils`}</button>}
      <p className="pl-note">Keep logins safe: anyone with a card can read as that pupil. If a card is lost, choose Reset PIN.</p>
      {cards && <PupilCardSheet list={ready.map(p => ({ ...p, ...logins[p.id] }))} place={place} onClose={() => setCards(false)} />}
    </div>
  );
}

function PupilCardSheet({ list, place, onClose }) {
  useEffectPL(() => {
    document.body.classList.add("pl-printing");
    const esc = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.classList.remove("pl-printing"); window.removeEventListener("keydown", esc); };
  }, []);
  return ReactDOM.createPortal(
    <div className="pl-sheet" role="dialog" aria-modal="true" aria-label="Pupil login cards">
      <div className="pl-sheet-bar">
        <b>Login cards · {list.length} pupil{list.length === 1 ? "" : "s"}</b>
        <span>8 cards to an A4 sheet. Cut along the dashed lines.</span>
        <button className="pl-btn" onClick={() => window.print()}>Print</button>
        <button className="pl-btn ghost" onClick={onClose}>Close</button>
      </div>
      <div className="pl-grid">{list.map(p => (
        <div key={p.id} className="pl-lc">
          <div className="pl-lc-top"><img src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" /><span>Pupil login</span></div>
          <div className="pl-lc-body">
            <div className="pl-lc-who"><b>{p.name}</b><span>{place}</span>
              <dl><dt>Username</dt><dd>{p.username}</dd><dt>PIN</dt><dd className="pl-lc-pin">{p.pin}</dd></dl></div>
            <div className="pl-lc-qr" dangerouslySetInnerHTML={{ __html: plQr(p.username) }} />
          </div>
          <p className="pl-lc-how">Scan the code, or go to Haaraya and tap <b>Sign in</b>, then <b>I’m a pupil</b>. Type your username and PIN.</p>
        </div>))}</div>
    </div>, document.body);
}

window.PupilLogins = PupilLogins;
