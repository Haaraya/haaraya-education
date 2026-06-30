/* ============================================================
   Haaraya Registration — flows (Parent / School / Sponsored)
   + Success. Uses window atoms from reg-shared.jsx.
   ============================================================ */
const { useState: useStateF } = React;

const KID_COLORS = ["#E65100", "#8E24AA", "#1565C0", "#00838F"];
const emptyKid = () => ({ firstName: "", lastName: "", passportName: "", year: "", confidence: "", avatar: randomAvatar() });

/* ---------- Passport Avatar step (handles 1–4 children) ---------- */
function AvatarStepBody({ kids, setKid }) {
  const [active, setActive] = useStateF(0);
  const multi = kids.length > 1;
  const kid = kids[active] || kids[0];
  const name = (kid.passportName || kid.firstName || "").trim();

  return (
    <React.Fragment>
      {multi && (
        <div className="av-kidtabs">
          {kids.map((k, i) => (
            <button key={i} type="button" className={"av-kidtab" + (i === active ? " on" : "")} onClick={() => setActive(i)}>
              <span className="mini"><PassportAvatar config={k.avatar} size={30} shape="circle" /></span>
              {k.passportName || k.firstName || `Child ${i + 1}`}
            </button>
          ))}
        </div>
      )}
      <AvatarBuilder
        value={kid.avatar}
        name={name}
        onChange={(cfg) => setKid(active, "avatar", cfg)}
      />
      <div className="av-note">
        <span className="seal"><Ic d={ICONS.shield} size={13} sw={2.4} /></span>
        <span>No photos, ever. Each reader gets a friendly illustrated passport picture you can edit any time from their profile.</span>
      </div>
    </React.Fragment>
  );
}

/* ------------------------------------------------------------
   Reading-start record builder.
   Encodes the manual-level rule: skipping the readiness check lets
   the child START at the chosen level but does NOT validate, complete
   or fail any skipped Soundables / Hafwas teaching skills. Those stay
   "unchecked" until a real assessment is completed.
   ------------------------------------------------------------ */
function buildReadingRecord(method, chosenLevel) {
  const levelId =
    method === "start_level_1" ? 1 :
    method === "manual_level" ? (Number(chosenLevel) || null) :
    null;

  const readinessCheckStatus =
    method === "readiness_check" ? "pending" :
    method === "manual_level" ? "skipped" :
    "not_required";                      // Level 1 starts at the beginning — nothing skipped

  // Only a manual choice above Level 1 leaves earlier teaching skills jumped-over.
  const hasSkippedSkills = method === "manual_level" && levelId > 1;

  return {
    currentLevelId: levelId,
    readingStartMethod: method,
    readinessCheckStatus,
    pendingReadinessCheck: method === "readiness_check",
    // Skipped earlier skills are NOT mastered, completed or failed, and no
    // assessment result is created. They wait for a real check to resolve them.
    skippedSkills: hasSkippedSkills
      ? {
          status: "unchecked",          // never "mastered" / "completed" / "failed"
          assessmentSource: null,        // none until a real check happens
          assessedAt: null,
          appliesToLevelsBelow: levelId, // every Soundable/Hafwas skill below this level
          resolvesVia: ["readiness_check", "skill_check", "teacher_check", "approved_assessment"],
        }
      : null,
  };
}

/* ============================================================
   PARENT / FAMILY
   ============================================================ */
function ParentFlow({ onBack, onComplete }) {
  const STEPS = [
    { key: "account", title: "Parent account", sub: "Who's setting up" },
    { key: "child", title: "Child profile", sub: "Your young reader" },
    { key: "avatar", title: "Passport Avatar", sub: "Their reading face" },
    { key: "reading", title: "Reading start", sub: "Where to begin" },
    { key: "plan", title: "Choose a plan", sub: "Reserve your place" },
  ];
  const [step, setStep] = useStateF(0);
  const [acc, setAcc] = useStateF({ fullName: "", email: "", password: "", country: "Nigeria", phone: "" });
  const [kids, setKids] = useStateF([emptyKid()]);
  const [readingStart, setReadingStart] = useStateF("");
  const [manualLevel, setManualLevel] = useStateF("");
  const [plan, setPlan] = useStateF("");
  const [cycle, setCycle] = useStateF("annual");

  const setAccF = (k) => (e) => setAcc({ ...acc, [k]: e.target.value });
  const setKid = (i, k, v) => setKids(kids.map((kid, j) => j === i ? { ...kid, [k]: v } : kid));
  const addKid = () => kids.length < 4 && setKids([...kids, emptyKid()]);
  const rmKid = (i) => setKids(kids.filter((_, j) => j !== i));

  const child0 = { ...kids[0], readingStart };
  const planLabel = plan === "family" ? "Family plan" : plan === "individual" ? "Individual child" : "";

  const accValid = acc.fullName.trim() && /.+@.+\..+/.test(acc.email) && acc.password.length >= 6 && acc.country;
  const kidsValid = kids.every(k => k.firstName.trim() && k.passportName.trim() && k.year && k.confidence);
  const next = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else {
      onComplete({
        role: "parent", account: acc,
        children: kids.map(k => ({
          ...k,
          ...buildReadingRecord(readingStart, manualLevel),
        })),
        subscription: { plan, cycle, status: "waitlisted" },
      });
    }
  };
  const back = () => step === 0 ? onBack() : (setStep(step - 1), window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <div className="reg-flow">
      <FlowRail
        kicker="Parent / Family"
        title="Your child's reading journey"
        blurb="Four short steps. We build the passport as you go."
        steps={STEPS} current={step}
      >
        <ChildPassportPreview child={child0} plan={planLabel} stampsFilled={step} />
      </FlowRail>

      <main className="reg-main">
        <div className="reg-card reg-fade" key={step}>
          {step === 0 && (
            <React.Fragment>
              <StepHead n={1} total={5} tag="Parent account" title="Let's set up your account"
                sub="You'll manage your children's reading, see their progress, and add more readers any time." />
              <div className="reg-fields">
                <Field label="Your full name"><Input value={acc.fullName} onChange={setAccF("fullName")} placeholder="e.g. Amaka Obi" autoFocus /></Field>
                <div className="reg-grid-2">
                  <Field label="Email"><Input type="email" value={acc.email} onChange={setAccF("email")} placeholder="you@email.com" /></Field>
                  <Field label="Password" hint="At least 6 characters."><Input type="password" value={acc.password} onChange={setAccF("password")} placeholder="Create a password" /></Field>
                </div>
                <div className="reg-grid-2">
                  <Field label="Country">
                    <Select value={acc.country} onChange={setAccF("country")}>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </Field>
                  <Field label="Phone" optional hint="For account recovery only.">
                    <div className="reg-input-group">
                      <span className="pre">+234</span>
                      <Input value={acc.phone} onChange={setAccF("phone")} placeholder="801 234 5678" />
                    </div>
                  </Field>
                </div>
              </div>
              <Actions onBack={back} backLabel="All account types" onNext={next} nextDisabled={!accValid} />
            </React.Fragment>
          )}

          {step === 1 && (
            <React.Fragment>
              <StepHead n={2} total={5} tag="Child profile" title="Tell us about your reader"
                sub="This creates the child's Haaraya passport. You can add up to four children on a family plan." />
              <div className="reg-fields">
                {kids.map((kid, i) => (
                  <div key={i} className="reg-kidblock" style={{ borderTop: i ? "1px dashed var(--sand-dk)" : "none", paddingTop: i ? 22 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div className="reg-step-tag" style={{ margin: 0 }}>
                        <span className="n" style={{ background: KID_COLORS[i] + "22", color: KID_COLORS[i] }}>{i + 1}</span>
                        {i === 0 ? "First child" : `Child ${i + 1}`}
                      </div>
                      {i > 0 && <button className="reg-kid-chip-rm reg-back" style={{ color: "#C62828" }} onClick={() => rmKid(i)}>Remove</button>}
                    </div>
                    <div style={{ display: "grid", gap: 18 }}>
                      <div className="reg-grid-2">
                        <Field label="Child's first name"><Input value={kid.firstName} onChange={e => setKid(i, "firstName", e.target.value)} placeholder="e.g. Nasa" /></Field>
                        <Field label="Last name"><Input value={kid.lastName} onChange={e => setKid(i, "lastName", e.target.value)} placeholder="e.g. Obi" /></Field>
                      </div>
                      <Field label="Display name for passport"
                        hint="The friendly name shown on the Reading Passport and on every stamp earned — often a first name or nickname.">
                        <Input value={kid.passportName} onChange={e => setKid(i, "passportName", e.target.value)} placeholder="e.g. Nasa the Brave" />
                      </Field>
                      <div className="reg-grid-2">
                        <Field label="Year of birth">
                          <Select value={kid.year} onChange={e => setKid(i, "year", e.target.value)} placeholder="Select year">
                            {YEARS.map(y => <option key={y} value={y}>{y} · age {2026 - y}</option>)}
                          </Select>
                        </Field>
                        <Field label="Reading confidence">
                          <Select value={kid.confidence} onChange={e => setKid(i, "confidence", e.target.value)} placeholder="How they read now">
                            <option value="just_starting">Just starting</option>
                            <option value="some_words">Reading some words</option>
                            <option value="simple_books">Reading simple books</option>
                            <option value="fluent">Already reading fluently</option>
                          </Select>
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
                <div>
                  <button className="reg-add-kid" onClick={addKid} disabled={kids.length >= 4}>
                    <span className="plus">+</span> Add another child
                  </button>
                  <div className="reg-kids-limit">
                    {kids.length >= 4 ? "Family plan supports up to 4 children." : `${kids.length} of 4 children · family plan supports up to four.`}
                  </div>
                </div>
              </div>
              <Actions onBack={back} onNext={next} nextDisabled={!kidsValid} />
            </React.Fragment>
          )}

          {step === 2 && (
            <React.Fragment>
              <StepHead n={3} total={5} tag="Create Your Passport Avatar" title="Create Your Passport Avatar"
                sub={"Choose a passport picture for " + (kids.length > 1 ? "each reader's" : ((kids[0].passportName || kids[0].firstName || "your reader") + "'s")) + " Haaraya Reading Journey. Pick, tap, done — no photos needed."} />
              <AvatarStepBody kids={kids} setKid={setKid} />
              <Actions onBack={back} onNext={next} nextLabel="Save Avatar" />
            </React.Fragment>
          )}

          {step === 3 && (
            <React.Fragment>
              <StepHead n={4} total={5} tag="Reading start" title="Where should they begin?"
                sub={kids.length > 1 ? "Choose a starting point for your readers — you can fine-tune each child individually in your dashboard." : "Choose where " + (kids[0].passportName || "your child") + " starts. You're never locked in — levels adjust as they read."} />
              <div className="reg-choices">
                <Choice selected={readingStart === "start_level_1"} onClick={() => setReadingStart("start_level_1")}
                  lead={<Ic d={ICONS.book} size={20} sw={2} />}
                  title="Start from Level 1" desc="Begin at Tashi — the very first level. Best for new and early readers." />
                <Choice selected={readingStart === "readiness_check"} onClick={() => setReadingStart("readiness_check")}
                  lead={<Ic d={ICONS.spark} size={20} sw={2} />} soon
                  title="Take a quick readiness check" desc="A short, playful check that finds the right level. Launching soon — we'll start at Level 1 for now and move them up." />
                <Choice selected={readingStart === "manual_level"} onClick={() => setReadingStart("manual_level")}
                  lead={<Ic d={ICONS.level} size={20} sw={2} />}
                  title="Choose a starting level myself" desc="Already know their level? Pick it directly." />
              </div>
              {readingStart === "manual_level" && (
                <div style={{ marginTop: 16, maxWidth: 280 }} className="reg-fade">
                  <Field label="Starting level">
                    <Select value={manualLevel} onChange={e => setManualLevel(e.target.value)} placeholder="Select level">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(l => <option key={l} value={l}>Level {l}</option>)}
                    </Select>
                  </Field>
                </div>
              )}
              {readingStart === "manual_level" && Number(manualLevel) > 1 && (
                <div className="reg-callout reg-callout-note reg-fade" style={{ marginTop: 14 }}>
                  <span className="seal"><Ic d={ICONS.level} size={17} sw={2} /></span>
                  <span className="body">
                    <span className="t">Earlier skills stay unchecked</span>
                    <span className="d">You can start at this level now. Earlier Soundables and Hafwas skills will stay <strong>unchecked</strong> until a readiness check or teacher assessment is completed — skipping ahead doesn't mark them as passed, completed or failed.</span>
                  </span>
                </div>
              )}
              {!(readingStart === "manual_level" && Number(manualLevel) > 1) && (
                <div className="reg-callout" style={{ marginTop: 18 }}>
                  <span className="seal"><Ic d={ICONS.shield} size={17} sw={2} /></span>
                  <span className="body">
                    <span className="t">No child is locked to Level 1</span>
                    <span className="d">Haaraya moves readers up as they grow. Whatever you pick now, you can change it any time.</span>
                  </span>
                </div>
              )}
              <Actions onBack={back} onNext={next}
                nextDisabled={!readingStart || (readingStart === "manual_level" && !manualLevel)} />
            </React.Fragment>
          )}

          {step === 4 && (
            <React.Fragment>
              <StepHead n={5} total={5} tag="Choose a plan" title="Pick the right plan"
                sub="Billing isn't live yet — reserve your place today and we'll invite you the moment plans open. No card needed now." />
              <div className="reg-review">
                <div className="row"><span className="k">Parent</span><span className="v">{acc.fullName || "—"}</span></div>
                <div className="row"><span className="k">Readers</span><span className="v">{kids.map(k => k.passportName || k.firstName).filter(Boolean).join(", ") || "—"}</span></div>
                <div className="row"><span className="k">Start</span><span className="v">{READING_START_LABEL[readingStart] || "—"}</span></div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <div className="reg-seg">
                  <button className={cycle === "monthly" ? "on" : ""} onClick={() => setCycle("monthly")}>Monthly</button>
                  <button className={cycle === "annual" ? "on" : ""} onClick={() => setCycle("annual")}>Annual <span className="save">2 months free</span></button>
                </div>
              </div>
              <div className="reg-plans">
                <button className={"reg-plan" + (plan === "individual" ? " sel" : "")} onClick={() => setPlan("individual")}>
                  <span className="tick"><Ic d={ICONS.check} size={12} sw={3.4} /></span>
                  <span className="for">One reader</span>
                  <h4>Individual Child</h4>
                  <div className="price-soon">Pricing soon</div>
                  <p className="blurb">Everything one child needs to climb all 12 levels.</p>
                  <ul>
                    <li><span className="ck">✓</span> One reading passport</li>
                    <li><span className="ck">✓</span> Full library &amp; audio</li>
                    <li><span className="ck">✓</span> Progress tracking</li>
                  </ul>
                </button>
                <button className={"reg-plan" + (plan === "family" ? " sel" : "")} onClick={() => setPlan("family")}>
                  <span className="ribbon">Most chosen</span>
                  <span className="tick"><Ic d={ICONS.check} size={12} sw={3.4} /></span>
                  <span className="for">Up to 4 readers</span>
                  <h4>Family Plan</h4>
                  <div className="price-soon">Pricing soon</div>
                  <p className="blurb">One account, up to four passports — siblings read side by side.</p>
                  <ul>
                    <li><span className="ck">✓</span> Up to 4 reading passports</li>
                    <li><span className="ck">✓</span> Shared family dashboard</li>
                    <li><span className="ck">✓</span> Best value per child</li>
                  </ul>
                </button>
              </div>
              <Actions onBack={back} onNext={next} nextLabel="Create passport &amp; reserve place" gold nextDisabled={!plan} />
            </React.Fragment>
          )}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   SCHOOL / TEACHER
   ============================================================ */
function SchoolFlow({ onBack, onComplete }) {
  const STEPS = [
    { key: "account", title: "School account", sub: "School & lead" },
    { key: "setup", title: "School setup", sub: "Pupils & groups" },
    { key: "action", title: "Next step", sub: "How to begin" },
  ];
  const [step, setStep] = useStateF(0);
  const [s, setS] = useStateF({ schoolName: "", adminName: "", email: "", password: "", country: "Nigeria", city: "", role: "" });
  const [setup, setSetup] = useStateF({ pupils: "", groups: "", intent: "" });
  const [action, setAction] = useStateF("");
  const setF = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const setUp = (k) => (e) => setSetup({ ...setup, [k]: e.target.value });

  const accValid = s.schoolName.trim() && s.adminName.trim() && /.+@.+\..+/.test(s.email) && s.password.length >= 6 && s.city.trim() && s.role;
  const setupValid = setup.pupils && setup.intent;

  const next = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else onComplete({ role: "school", school: s, setup, nextAction: action });
  };
  const back = () => step === 0 ? onBack() : (setStep(step - 1), window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <div className="reg-flow">
      <FlowRail kicker="School / Teacher" title="Bring Haaraya to your classroom"
        blurb="Set up your school account and choose how you'd like to begin."
        steps={STEPS} current={step}>
        <SchoolAccountPreview school={s} stampsFilled={step} />
      </FlowRail>

      <main className="reg-main">
        <div className="reg-card reg-fade" key={step}>
          {step === 0 && (
            <React.Fragment>
              <StepHead n={1} total={3} tag="School account" title="Set up your school account"
                sub="For teachers, school admins and reading coordinators managing classroom reading." />
              <div className="reg-fields">
                <Field label="School name"><Input value={s.schoolName} onChange={setF("schoolName")} placeholder="e.g. Greenfield Primary School" autoFocus /></Field>
                <div className="reg-grid-2">
                  <Field label="Your name"><Input value={s.adminName} onChange={setF("adminName")} placeholder="Teacher / admin name" /></Field>
                  <Field label="Your role">
                    <Select value={s.role} onChange={setF("role")} placeholder="Select role">
                      <option value="teacher">Teacher</option>
                      <option value="school_admin">School admin</option>
                      <option value="coordinator">Reading coordinator</option>
                    </Select>
                  </Field>
                </div>
                <div className="reg-grid-2">
                  <Field label="Email"><Input type="email" value={s.email} onChange={setF("email")} placeholder="you@school.edu" /></Field>
                  <Field label="Password" hint="At least 6 characters."><Input type="password" value={s.password} onChange={setF("password")} placeholder="Create a password" /></Field>
                </div>
                <div className="reg-grid-2">
                  <Field label="Country">
                    <Select value={s.country} onChange={setF("country")}>{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}</Select>
                  </Field>
                  <Field label="City"><Input value={s.city} onChange={setF("city")} placeholder="e.g. Lagos" /></Field>
                </div>
              </div>
              <Actions onBack={back} backLabel="All account types" onNext={next} nextDisabled={!accValid} />
            </React.Fragment>
          )}

          {step === 1 && (
            <React.Fragment>
              <StepHead n={2} total={3} tag="School setup" title="Tell us about your readers"
                sub="A rough picture is plenty — it helps us size the right setup for your school." />
              <div className="reg-fields">
                <div className="reg-grid-2">
                  <Field label="Number of pupils (estimate)">
                    <Select value={setup.pupils} onChange={setUp("pupils")} placeholder="Select range">
                      {["1–30", "31–100", "101–300", "301–600", "600+"].map(r => <option key={r} value={r}>{r} pupils</option>)}
                    </Select>
                  </Field>
                  <Field label="Class / year groups" optional>
                    <Input value={setup.groups} onChange={setUp("groups")} placeholder="e.g. Years 1–3, 4 classes" />
                  </Field>
                </div>
                <Field label="What would you like to do?">
                  <div className="reg-choices">
                    <Choice selected={setup.intent === "demo"} onClick={() => setSetup({ ...setup, intent: "demo" })}
                      lead={<Ic d={ICONS.demo} size={20} sw={2} />} title="See a demo" desc="A guided walkthrough with our team." />
                    <Choice selected={setup.intent === "pilot"} onClick={() => setSetup({ ...setup, intent: "pilot" })}
                      lead={<Ic d={ICONS.pilot} size={20} sw={2} />} title="Run a pilot" desc="Trial Haaraya with a class or year group." />
                    <Choice selected={setup.intent === "subscription"} onClick={() => setSetup({ ...setup, intent: "subscription" })}
                      lead={<Ic d={ICONS.school} size={20} sw={2} />} title="Set up a subscription" desc="Roll Haaraya out across the school." />
                  </div>
                </Field>
              </div>
              <Actions onBack={back} onNext={next} nextDisabled={!setupValid} />
            </React.Fragment>
          )}

          {step === 2 && (
            <React.Fragment>
              <StepHead n={3} total={3} tag="Next step" title="How would you like to begin?"
                sub="School access is approved by our team. Pick a next step and we'll be in touch quickly." />
              <div className="reg-review">
                <div className="row"><span className="k">School</span><span className="v">{s.schoolName || "—"}</span></div>
                <div className="row"><span className="k">Pupils</span><span className="v">{setup.pupils || "—"}</span></div>
                <div className="row"><span className="k">Goal</span><span className="v" style={{ textTransform: "capitalize" }}>{setup.intent || "—"}</span></div>
              </div>
              <div className="reg-choices">
                <Choice selected={action === "request_access"} onClick={() => setAction("request_access")}
                  lead={<Ic d={ICONS.school} size={20} sw={2} />} title="Request school access" desc="Submit your school for approval and account setup." />
                <Choice selected={action === "book_demo"} onClick={() => setAction("book_demo")}
                  lead={<Ic d={ICONS.demo} size={20} sw={2} />} title="Book a demo" desc="Pick a time to see Haaraya with your team." />
                <Choice selected={action === "join_pilot"} onClick={() => setAction("join_pilot")}
                  lead={<Ic d={ICONS.pilot} size={20} sw={2} />} title="Join the pilot waitlist" desc="Be first in line as new pilots open." />
              </div>
              <Actions onBack={back} onNext={next} nextLabel="Start school account" gold nextDisabled={!action} />
            </React.Fragment>
          )}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   SPONSORED / ACCESS CODE
   ============================================================ */
function SponsoredFlow({ onBack, onComplete }) {
  const STEPS = [
    { key: "code", title: "Access code", sub: "Your invitation" },
    { key: "child", title: "Child profile", sub: "Create the reader" },
    { key: "avatar", title: "Passport Avatar", sub: "Their reading face" },
  ];
  const [step, setStep] = useStateF(0);
  const [code, setCode] = useStateF("");
  const [verified, setVerified] = useStateF(false);
  const [email, setEmail] = useStateF("");
  const [kid, setKid] = useStateF({ passportName: "", firstName: "", confidence: "", avatar: randomAvatar() });

  // Demo: any 6+ char code "resolves" to a programme.
  const programme = "Lagos State Reads · Sunshine Academy";
  const verify = () => { if (code.trim().length >= 4) setVerified(true); };

  const child0 = { firstName: kid.firstName, passportName: kid.passportName, lastName: "", avatar: kid.avatar };
  const codeValid = verified;
  const kidValid = kid.passportName.trim() && kid.firstName.trim();

  const next = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else onComplete({ role: "sponsored", accessCode: code, guardianEmail: email, programme, child: { ...kid, readingStartMethod: "assigned_path" } });
  };
  const back = () => step === 0 ? onBack() : (setStep(step - 1), window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <div className="reg-flow">
      <FlowRail kicker="Sponsored / Access code" title="Join your reading programme"
        blurb="Use the code from your school, sponsor or community programme."
        steps={STEPS} current={step}>
        <ChildPassportPreview child={child0} programme={verified ? programme : ""} stampsFilled={verified ? step + 1 : 0} />
      </FlowRail>

      <main className="reg-main">
        <div className="reg-card reg-fade" key={step}>
          {step === 0 && (
            <React.Fragment>
              <StepHead n={1} total={2} tag="Access code" title="Enter your invitation code"
                sub="This came from a school, sponsor, community programme or invitation. It links the child to the right reading path — no payment needed." />
              <div className="reg-fields">
                <Field label="Access or invitation code" hint={verified ? "" : "Try any code to continue in this demo."}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setVerified(false); }}
                      placeholder="e.g. HAARAYA-2026" style={{ letterSpacing: "0.08em", fontWeight: 800 }} />
                    <button className="reg-btn-next" style={{ padding: "13px 22px", boxShadow: "0 4px 0 var(--deep-forest)" }}
                      onClick={verify} disabled={code.trim().length < 4}>Verify</button>
                  </div>
                </Field>
                {verified && (
                  <div className="reg-callout reg-fade" style={{ borderColor: "rgba(34,139,34,.4)", background: "var(--green-light)" }}>
                    <span className="seal" style={{ borderColor: "rgba(34,139,34,.5)" }}><Ic d={ICONS.check} size={18} sw={3} /></span>
                    <span className="body">
                      <span className="t">Code verified · {programme}</span>
                      <span className="d">This child will join the assigned reading path for this programme.</span>
                    </span>
                  </div>
                )}
                <Field label="Parent / guardian email" optional hint="So we can send progress and recovery — only if your programme asks for it.">
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="guardian@email.com" />
                </Field>
              </div>
              <Actions onBack={back} backLabel="All account types" onNext={next} nextDisabled={!codeValid} />
            </React.Fragment>
          )}

          {step === 1 && (
            <React.Fragment>
              <StepHead n={2} total={3} tag="Child profile" title="Create the reader's passport"
                sub="Just the essentials — the programme already sets the reading path." />
              <div className="reg-review" style={{ marginBottom: 22 }}>
                <div className="row"><span className="k">Programme</span><span className="v">{programme}</span></div>
                <div className="row"><span className="k">Path</span><span className="v">Assigned by programme</span></div>
              </div>
              <div className="reg-fields">
                <Field label="Child's first name"><Input value={kid.firstName} onChange={e => setKid({ ...kid, firstName: e.target.value })} placeholder="e.g. Tima" autoFocus /></Field>
                <Field label="Display name for passport"
                  hint="The friendly name shown on the Reading Passport and every stamp earned.">
                  <Input value={kid.passportName} onChange={e => setKid({ ...kid, passportName: e.target.value })} placeholder="e.g. Tima" />
                </Field>
                <Field label="Reading confidence" optional>
                  <Select value={kid.confidence} onChange={e => setKid({ ...kid, confidence: e.target.value })} placeholder="How they read now">
                    <option value="just_starting">Just starting</option>
                    <option value="some_words">Reading some words</option>
                    <option value="simple_books">Reading simple books</option>
                    <option value="fluent">Already reading fluently</option>
                  </Select>
                </Field>
              </div>
              <Actions onBack={back} onNext={next} nextDisabled={!kidValid} />
            </React.Fragment>
          )}

          {step === 2 && (
            <React.Fragment>
              <StepHead n={3} total={3} tag="Create Your Passport Avatar" title="Create Your Passport Avatar"
                sub={"Choose a passport picture for " + (kid.passportName || kid.firstName || "your reader") + "'s Haaraya Reading Journey. Pick, tap, done — no photos needed."} />
              <AvatarBuilder value={kid.avatar} name={kid.passportName || kid.firstName} onChange={(cfg) => setKid({ ...kid, avatar: cfg })} />
              <div className="av-note">
                <span className="seal"><Ic d={ICONS.shield} size={13} sw={2.4} /></span>
                <span>No photos, ever. Your reader gets a friendly illustrated passport picture you can edit any time from their profile.</span>
              </div>
              <Actions onBack={back} onNext={next} nextLabel="Save Avatar &amp; begin" gold nextDisabled={!kidValid} />
            </React.Fragment>
          )}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   SUCCESS
   ============================================================ */
function SuccessScreen({ payload, onDashboard, onRestart }) {
  const isSchool = payload.role === "school";
  const isSponsored = payload.role === "sponsored";

  let title, sub, btn, stamp, eyebrow, meta;
  if (isSchool) {
    eyebrow = "School account started";
    title = "Your Haaraya school account has been started.";
    sub = "We've logged your request — our team will be in touch shortly to approve access and help you set up classes and pupils.";
    btn = "Continue to School Setup";
    stamp = "assets/stamp-l8.png";
    meta = [payload.school.schoolName, { teacher: "Teacher", school_admin: "School admin", coordinator: "Reading coordinator" }[payload.school.role], payload.setup.pupils + " pupils"];
  } else if (isSponsored) {
    eyebrow = "Passport ready";
    title = (payload.child.passportName || "Your reader") + "'s Haaraya passport is ready.";
    sub = "They're linked to " + payload.programme + " and their assigned reading path is set. Time to open the first book.";
    btn = "Enter Dashboard";
    stamp = "assets/stamp-l1.png";
    meta = [payload.programme, "Assigned path", "Sponsored access"];
  } else {
    const kidNames = payload.children.map(k => k.passportName || k.firstName).filter(Boolean);
    eyebrow = "Passport ready";
    title = kidNames.length > 1 ? "Your children's Haaraya passports are ready." : (kidNames[0] || "Your child") + "'s Haaraya passport is ready.";
    sub = "We've reserved your place. Your dashboard is set up — explore the library and we'll let you know the moment plans open.";
    btn = "Enter Dashboard";
    stamp = "assets/stamp-l1.png";
    meta = [kidNames.join(", "), payload.subscription.plan === "family" ? "Family plan" : "Individual", "Place reserved"];
  }

  const previewChild = isSchool ? null
    : isSponsored ? { firstName: payload.child.firstName, passportName: payload.child.passportName, lastName: "", avatar: payload.child.avatar }
      : { ...payload.children[0] };

  return (
    <div className="reg-success">
      <div className="reg-success-stamp"><img src={stamp} alt="Stamp" /></div>
      <div className="reg-eyebrow" style={{ margin: "0 auto 18px" }}>
        <span className="bar" /> {eyebrow} <span className="flag">🇳🇬</span>
      </div>
      <h1>{title}</h1>
      <p className="sub">{sub}</p>

      <div className="reg-success-passport">
        {isSchool
          ? <SchoolAccountPreview school={payload.school} stampsFilled={2} />
          : <ChildPassportPreview child={previewChild} programme={isSponsored ? payload.programme : ""} plan={!isSponsored && payload.subscription.plan === "family" ? "Family plan" : ""} stampsFilled={3} />}
      </div>

      <div className="reg-success-actions">
        <button className="reg-btn-next reg-btn-gold" onClick={onDashboard} style={{ fontSize: 17, padding: "16px 30px" }}>
          {btn} <Ic d={ICONS.arrowR} size={18} sw={2.4} />
        </button>
      </div>

      <div className="reg-success-meta">
        {meta.filter(Boolean).map((m, i) => (
          <span key={i} className="pill"><span className="dot" /> {m}</span>
        ))}
      </div>
      <div style={{ marginTop: 22 }}>
        <button className="reg-back" onClick={onRestart} style={{ margin: "0 auto" }}>Start another registration</button>
      </div>
    </div>
  );
}

Object.assign(window, { ParentFlow, SchoolFlow, SponsoredFlow, SuccessScreen });
