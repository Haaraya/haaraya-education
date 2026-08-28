/* ============================================================
   Haaraya — enrolment write path
   Everything that CREATES accounts, children, schools and classes.
   Reads live in platform-supabase.js; this file only writes.

     window.HaarayaEnrol.registerParent(payload)
     window.HaarayaEnrol.registerSchool(payload)
     window.HaarayaEnrol.registerSponsored(payload)
     window.HaarayaEnrol.addChild({...})
     window.HaarayaEnrol.createClassroom({...})
     window.HaarayaEnrol.enrolPupil({...})
     window.HaarayaEnrol.linkTeacher({...})
     window.HaarayaEnrol.checkAccessCode(code)

   Every function resolves { ok, ... } and never throws, so a UI can
   show a message instead of dying. Requires supabase-client.js.

   Depends on: supabase/enrolment_migration.sql
               supabase/enrolment_policies.sql
   ============================================================ */
(function () {
  "use strict";

  // This Supabase project has mailer_autoconfirm OFF, so signUp() returns no
  // session and nothing can be written under RLS until the user confirms and
  // signs in. The signup payload therefore rides along in auth user metadata
  // (server-side, so confirming on a different device still works), and
  // ensureProfile() materialises the profile/children/subscription on the
  // first successful sign-in.
  //
  // Set this to false ONLY if you turn autoconfirm ON in the Supabase project.
  var REQUIRE_EMAIL_CONFIRMATION = true;

  var TRIAL_DAYS = 14;

  function sb() { return window.HaarayaSupabase || null; }
  function clean(v) { return v == null ? "" : String(v).trim(); }
  function fail(reason, detail) { return { ok: false, reason: reason, detail: detail || null }; }

  // Where the confirmation link should land. Same directory as whatever page
  // the user registered from, so this works on GitHub Pages (served from a
  // subpath) and on a local file/dev server alike. The app's boot then routes
  // the restored session to the right dashboard.
  function confirmRedirect() {
    try {
      var dir = window.location.pathname.replace(/[^/]*$/, "");
      return window.location.origin + dir + "Haaraya%20Home.html";
    } catch (e) { return undefined; }
  }

  function trialEnd() {
    var d = new Date();
    d.setDate(d.getDate() + TRIAL_DAYS);
    return d.toISOString();
  }

  // Map a flow's plan key onto the subscriptions.plan_type check constraint.
  function planType(plan) {
    if (plan === "family") return "family";
    if (plan === "individual") return "individual";
    if (plan === "school" || plan === "community") return "school";
    if (plan === "sponsored") return "sponsored";
    return "trial";
  }

  // The flows carry a level NUMBER (1-12); the DB wants the levels.id uuid.
  async function levelIdFor(levelNumber) {
    var client = sb();
    if (!client) return null;
    var n = Number(levelNumber) || 1;
    try {
      var res = await client.from("levels").select("id").eq("level_number", n).maybeSingle();
      return res.data ? res.data.id : null;
    } catch (e) { return null; }
  }

  /* ---------- shared: create the auth user (+ profile when we can) ----------
     `pending` is the whole signup payload. It goes into auth metadata so that
     ensureProfile() can finish the job after the user confirms their email.
  */
  async function createAccount(opts, pending) {
    var client = sb();
    if (!client) return fail("no-client");

    var email = clean(opts.email).toLowerCase();
    var password = opts.password || "";
    if (!email || !password) return fail("missing-credentials");
    if (password.length < 8) return fail("weak-password");

    var role = opts.role || "parent";
    var fullName = clean(opts.fullName) || email.split("@")[0];

    var meta = {
      full_name: fullName,
      role: role,
      phone: clean(opts.phone) || null,
      haaraya_pending: pending || null,
    };

    var signUp;
    try {
      signUp = await client.auth.signUp({
        email: email, password: password,
        options: { data: meta, emailRedirectTo: confirmRedirect() },
      });
    } catch (e) { return fail("signup-threw", String(e)); }

    if (signUp.error) {
      var m = String(signUp.error.message || "");
      if (/already/i.test(m)) return fail("email-taken", m);
      if (/password/i.test(m)) return fail("weak-password", m);
      return fail("signup-failed", m);
    }

    var authUser = signUp.data && signUp.data.user;
    if (!authUser) return fail("no-auth-user");

    // No session means the email must be confirmed first. Nothing more can be
    // written now; ensureProfile() picks it up at first sign-in.
    if (!signUp.data.session) {
      return { ok: true, authUser: authUser, profile: null, needsConfirmation: true, deferred: true };
    }

    // Autoconfirm is on: we have a session, so write the profile immediately.
    var prof = await insertProfile(authUser.id, email, fullName, role, opts.phone);
    if (!prof.ok) return prof;
    return { ok: true, authUser: authUser, profile: prof.profile, needsConfirmation: false };
  }

  //  Insert the public.users row. Requires a live session (users_self_insert
  //  checks auth_uid = auth.uid()).
  async function insertProfile(authUid, email, fullName, role, phone) {
    var client = sb();
    try {
      var res = await client.from("users").insert({
        auth_uid: authUid, email: clean(email).toLowerCase(), full_name: clean(fullName),
        role: role, phone: clean(phone) || null,
      }).select("id, role, full_name, email").maybeSingle();
      if (!res.error) return { ok: true, profile: res.data };

      // Already there (e.g. a second sign-in racing this) — read it back.
      var ex = await client.from("users").select("id, role, full_name, email")
        .eq("auth_uid", authUid).maybeSingle();
      if (ex.data) return { ok: true, profile: ex.data, existed: true };
      return fail("profile-failed", res.error.message);
    } catch (e) { return fail("profile-threw", String(e)); }
  }

  /* ============================================================
     PUBLIC: ensureProfile()
     Call after EVERY successful sign-in. If the signed-in user has no
     public.users row, build it — and everything their signup promised —
     from the metadata stashed at signUp. Idempotent and cheap: one select
     when the profile already exists.
     ============================================================ */
  async function ensureProfile() {
    var client = sb();
    if (!client) return fail("no-client");

    var user;
    try {
      var u = await client.auth.getUser();
      user = u.data ? u.data.user : null;
    } catch (e) { return fail("no-session"); }
    if (!user) return fail("no-session");

    try {
      var have = await client.from("users").select("id, role, full_name, email")
        .eq("auth_uid", user.id).maybeSingle();
      if (have.data) {
        // The profile exists, but an earlier run may have failed partway and
        // left children unwritten. Finish those before returning.
        var stillPending = (user.user_metadata || {}).haaraya_pending;
        if (!stillPending) return { ok: true, profile: have.data, created: false };
        return await finishPending(client, have.data, stillPending, false);
      }
    } catch (e) { /* fall through and try to create */ }

    var meta = user.user_metadata || {};
    var role = meta.role || "parent";
    var fullName = meta.full_name || (user.email || "").split("@")[0];

    var prof = await insertProfile(user.id, user.email, fullName, role, meta.phone);
    if (!prof.ok) return prof;

    if (!meta.haaraya_pending) {
      return { ok: true, profile: prof.profile, created: true, children: [], warnings: [] };
    }
    return await finishPending(client, prof.profile, meta.haaraya_pending, true);
  }

  /* ---------- finish what registration started -------------------------------
     Writes the school / children / subscription a signup promised, then clears
     the stashed payload ONLY if it all landed. Runs whether the profile was
     just created or already existed, so a part-finished signup self-repairs on
     the next sign-in.
  */
  async function finishPending(client, profile, pending, created) {
    var out = { ok: true, profile: profile, created: !!created, children: [], warnings: [] };

    try {
      if (pending.kind === "school" && pending.school) {
        var sres = await client.from("schools").insert({
          name: clean(pending.school.name) || "Unnamed school",
          type: pending.school.type || "school",
          country: clean(pending.school.country) || null,
          city: clean(pending.school.city) || null,
          admin_user_id: profile.id,
        }).select("id, name").maybeSingle();
        if (sres.data) {
          out.school = sres.data;
          try {
            await client.from("teacher_school_links").insert({
              teacher_user_id: profile.id, school_id: sres.data.id, status: "active",
            });
          } catch (e) { /* non-fatal */ }
          var ssub = await insertSubscription({ schoolId: sres.data.id, plan: "school", cycle: "annual" });
          if (ssub.ok) out.subscription = ssub.subscription;
        } else if (sres.error) {
          out.warnings.push(fail("school-failed", sres.error.message));
        }
      } else {
        var kids = Array.isArray(pending.children) ? pending.children : [];
        for (var i = 0; i < kids.length; i++) {
          var r = await insertChild(kids[i], { parentUserId: profile.id });
          if (r.ok) out.children.push(r.child); else out.warnings.push(r);
        }
        // Only create a subscription if this user hasn't got one already (this
        // may be a repair run over a signup that got partway through).
        var existingSub = null;
        try {
          var q = await client.from("subscriptions").select("id")
            .eq("owner_user_id", profile.id).maybeSingle();
          existingSub = q.data || null;
        } catch (e) { /* treat as none */ }
        if (!existingSub) {
          var plan = pending.plan || "individual";
          var sub = await insertSubscription({
            ownerUserId: profile.id, plan: plan, cycle: pending.cycle,
            maxChildren: plan === "family" ? 4 : 1,
          });
          if (sub.ok) out.subscription = sub.subscription;
          else out.warnings.push(sub);
        }

        // A sponsored signup consumes its code now that the child exists.
        if (pending.accessCode && out.children.length) {
          try {
            await client.rpc("consume_access_code", {
              p_code: pending.accessCode, p_child_id: out.children[0].id,
            });
          } catch (e) { /* non-fatal */ }
        }
      }
    } catch (e) {
      out.warnings.push(fail("pending-threw", String(e)));
    }

    // Clear the payload ONLY when everything it promised actually landed.
    // Clearing regardless is how a refused child insert became permanent:
    // the warning was discarded and the payload was gone on the next sign-in.
    var kidsWanted = (pending.kind === "school") ? 0
      : (Array.isArray(pending.children) ? pending.children.length : 0);
    var settled = out.warnings.length === 0 && out.children.length >= kidsWanted;
    if (settled) {
      try { await client.auth.updateUser({ data: { haaraya_pending: null } }); }
      catch (e) { /* non-fatal */ }
    } else {
      // Keep the payload for a retry, but never let it duplicate what DID land.
      try {
        var left = (Array.isArray(pending.children) ? pending.children : []).slice(out.children.length);
        var keep = Object.assign({}, pending, { children: left });
        await client.auth.updateUser({ data: { haaraya_pending: keep } });
      } catch (e) { /* non-fatal */ }
      try {
        console.warn("[Haaraya] signup did not fully complete:", out.warnings);
      } catch (e) { /* ignore */ }
    }

    return out;
  }

  /* ---------- children ---------- */
  //  Insert one child row. `owner` is either { parentUserId } or { schoolId }.
  async function insertChild(kid, owner) {
    var client = sb();
    if (!client) return fail("no-client");

    var first = clean(kid.firstName) || clean(kid.passportName) || "Reader";
    var last = clean(kid.lastName);
    var display = clean(kid.passportName) || clean(kid.displayName) || first;

    var row = {
      first_name: first,
      last_name: last || first,
      display_name: display,
      reading_mode: kid.readingMode === "choose" ? "choose" : "automatic",
      parent_user_id: owner.parentUserId || null,
      school_id: owner.schoolId || null,
      enrolled_by_user_id: owner.enrolledBy || null,
    };

    var lvl = await levelIdFor(kid.currentLevelId || 1);
    if (lvl) row.current_level_id = lvl;

    if (kid.year) {
      // The flow collects a birth year, the column wants a date.
      var y = Number(kid.year);
      if (y > 1900 && y < 2100) row.date_of_birth = y + "-01-01";
    }

    try {
      var res = await client.from("children").insert(row).select("id, display_name").maybeSingle();
      if (res.error) return fail("child-failed", res.error.message);
      return { ok: true, child: res.data };
    } catch (e) { return fail("child-threw", String(e)); }
  }

  /* ---------- subscription ---------- */
  async function insertSubscription(opts) {
    var client = sb();
    if (!client) return fail("no-client");
    var row = {
      owner_user_id: opts.ownerUserId || null,
      school_id: opts.schoolId || null,
      plan_type: planType(opts.plan),
      billing_cycle: opts.cycle === "yearly" ? "annual" : (opts.cycle === "monthly" ? "monthly" : "none"),
      status: "trial",
      trial_ends_at: trialEnd(),
    };
    if (opts.maxChildren) row.max_children = opts.maxChildren;
    try {
      var res = await client.from("subscriptions").insert(row).select("id, status, trial_ends_at").maybeSingle();
      if (res.error) return fail("subscription-failed", res.error.message);
      return { ok: true, subscription: res.data };
    } catch (e) { return fail("subscription-threw", String(e)); }
  }

  /* ============================================================
     PUBLIC: parent / family registration
     payload = { account:{firstName,lastName,email,password,phone,fullName},
                 children:[{firstName,lastName,passportName,year,currentLevelId}],
                 subscription:{plan,cycle} }
     ============================================================ */
  async function registerParent(payload) {
    var acc = payload.account || {};
    var kids = Array.isArray(payload.children) ? payload.children : [];
    var plan = (payload.subscription && payload.subscription.plan) || "individual";

    var created = await createAccount({
      email: acc.email, password: acc.password, phone: acc.phone,
      fullName: acc.fullName || [acc.firstName, acc.lastName].filter(Boolean).join(" "),
      role: "parent",
    }, {
      kind: "parent",
      children: kids,
      plan: plan,
      cycle: payload.subscription && payload.subscription.cycle,
    });
    if (!created.ok) return created;

    // Confirmation pending: nothing is written yet, and that is fine —
    // ensureProfile() builds it all on their first sign-in.
    if (created.deferred) {
      return { ok: true, role: "parent", profile: null, children: [], needsConfirmation: true };
    }

    var parentId = created.profile.id;
    var madeKids = [], kidErrors = [];
    for (var i = 0; i < kids.length; i++) {
      var r = await insertChild(kids[i], { parentUserId: parentId });
      if (r.ok) madeKids.push(r.child); else kidErrors.push(r);
    }

    var sub = await insertSubscription({
      ownerUserId: parentId, plan: plan,
      cycle: payload.subscription && payload.subscription.cycle,
      maxChildren: plan === "family" ? 4 : 1,
    });

    return {
      ok: true, role: "parent", profile: created.profile,
      children: madeKids, subscription: sub.ok ? sub.subscription : null,
      needsConfirmation: false,
      warnings: kidErrors.concat(sub.ok ? [] : [sub]),
    };
  }

  /* ============================================================
     PUBLIC: school / organisation registration
     payload = { school:{schoolName,adminName,email,password,country,city,role},
                 setup:{pupils,groups,intent} }
     ============================================================ */
  async function registerSchool(payload) {
    var client = sb();
    var s = payload.school || {};

    var created = await createAccount({
      email: s.email, password: s.password,
      fullName: s.adminName, role: "school_admin",
    }, {
      kind: "school",
      school: {
        name: s.schoolName, type: s.orgType || "school",
        country: s.country, city: s.city,
      },
    });
    if (!created.ok) return created;

    if (created.deferred) {
      return { ok: true, role: "school_admin", profile: null, needsConfirmation: true };
    }

    var adminId = created.profile.id;
    var schoolRow = {
      name: clean(s.schoolName) || "Unnamed school",
      type: s.orgType || "school",
      country: clean(s.country) || null,
      city: clean(s.city) || null,
      admin_user_id: adminId,
    };

    var school;
    try {
      var res = await client.from("schools").insert(schoolRow).select("id, name").maybeSingle();
      if (res.error) return fail("school-failed", res.error.message);
      school = res.data;
    } catch (e) { return fail("school-threw", String(e)); }

    // The admin is also a teacher of their own school, so their dashboard and
    // any class they take shows up without a second step.
    try {
      await client.from("teacher_school_links")
        .insert({ teacher_user_id: adminId, school_id: school.id, status: "active" });
    } catch (e) { /* non-fatal */ }

    var sub = await insertSubscription({ schoolId: school.id, plan: "school", cycle: "annual" });

    return {
      ok: true, role: "school_admin", profile: created.profile, school: school,
      subscription: sub.ok ? sub.subscription : null,
      needsConfirmation: false,
      warnings: sub.ok ? [] : [sub],
    };
  }

  /* ============================================================
     PUBLIC: sponsored / access-code registration
     payload = { accessCode, guardianEmail, password, programme,
                 child:{firstName,passportName,...} }
     The code is validated first, then consumed once the child exists.
     ============================================================ */
  async function registerSponsored(payload) {
    var client = sb();
    if (!client) return fail("no-client");

    var code = clean(payload.accessCode);
    var check = await checkAccessCode(code);
    if (!check.ok) return fail("code-check-unavailable", check.reason);
    if (!check.valid) return fail("bad-code", check.reason || "invalid");

    var created = await createAccount({
      email: payload.guardianEmail, password: payload.password,
      fullName: payload.guardianName || clean(payload.guardianEmail).split("@")[0],
      role: "parent",
    }, {
      kind: "parent",
      children: [payload.child || {}],
      plan: "sponsored",
      cycle: "none",
      accessCode: code,
    });
    if (!created.ok) return created;

    if (created.deferred) {
      return {
        ok: true, role: "parent", profile: null, children: [],
        programme: check.programmeName, needsConfirmation: true,
      };
    }

    var guardianId = created.profile.id;
    var kidRes = await insertChild(payload.child || {}, { parentUserId: guardianId });
    if (!kidRes.ok) return kidRes;

    var consumed = false;
    try {
      var c = await client.rpc("consume_access_code", { p_code: code, p_child_id: kidRes.child.id });
      consumed = !!(c && c.data);
    } catch (e) { /* the child exists; surface it as a warning */ }

    var sub = await insertSubscription({ ownerUserId: guardianId, plan: "sponsored", cycle: "none" });

    return {
      ok: true, role: "parent", profile: created.profile,
      children: [kidRes.child], programme: check.programmeName,
      codeConsumed: consumed,
      subscription: sub.ok ? sub.subscription : null,
      needsConfirmation: false,
      warnings: consumed ? [] : [fail("code-not-consumed")],
    };
  }

  /* ---------- access codes ---------- */
  async function checkAccessCode(code) {
    var client = sb();
    if (!client) return fail("no-client");
    if (!clean(code)) return fail("empty");
    try {
      var res = await client.rpc("check_access_code", { p_code: clean(code) });
      if (res.error) return fail("rpc-failed", res.error.message);
      var row = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!row) return fail("not-found");
      return {
        ok: true, valid: !!row.valid,
        programmeName: row.programme_name || null,
        reason: row.reason || null,
      };
    } catch (e) { return fail("rpc-threw", String(e)); }
  }

  /* ============================================================
     PUBLIC: a parent adds a child to their existing account.
     Soft limit: over the plan's allowance we still create the child and
     return promptUpgrade:true, per the product decision.
     ============================================================ */
  async function addChild(kid) {
    var client = sb();
    if (!client) return fail("no-client");

    var prof = window.HaarayaAuth ? await window.HaarayaAuth.getProfile() : null;
    if (!prof || !prof.id) return fail("not-signed-in");
    if (prof.role !== "parent") return fail("wrong-role");

    var allowance = 1, used = 0;
    try {
      var sub = await client.from("subscriptions")
        .select("plan_type, max_children")
        .eq("owner_user_id", prof.id).maybeSingle();
      if (sub.data) {
        allowance = Number(sub.data.max_children) ||
          (sub.data.plan_type === "family" ? 4 : 1);
      }
      var cnt = await client.from("children")
        .select("id", { count: "exact", head: true })
        .eq("parent_user_id", prof.id);
      used = cnt.count || 0;
    } catch (e) { /* fall through with defaults */ }

    var res = await insertChild(kid, { parentUserId: prof.id });
    if (!res.ok) return res;

    return {
      ok: true, child: res.child,
      promptUpgrade: used + 1 > allowance,
      allowance: allowance, childCount: used + 1,
    };
  }

  /* ============================================================
     PUBLIC: school enrolment
     ============================================================ */
  async function createClassroom(opts) {
    var client = sb();
    if (!client) return fail("no-client");
    if (!opts.schoolId || !clean(opts.name)) return fail("args");
    try {
      var res = await client.from("classrooms").insert({
        school_id: opts.schoolId,
        teacher_user_id: opts.teacherUserId || null,
        name: clean(opts.name),
      }).select("id, name, teacher_user_id").maybeSingle();
      if (res.error) return fail("classroom-failed", res.error.message);
      return { ok: true, classroom: res.data };
    } catch (e) { return fail("classroom-threw", String(e)); }
  }

  //  Enrol a school pupil (no guardian login) and optionally seat them in a class.
  async function enrolPupil(opts) {
    var client = sb();
    if (!client) return fail("no-client");
    if (!opts.schoolId) return fail("no-school");

    var prof = window.HaarayaAuth ? await window.HaarayaAuth.getProfile() : null;
    if (!prof || !prof.id) return fail("not-signed-in");

    var res = await insertChild(opts.child || opts, {
      schoolId: opts.schoolId, enrolledBy: prof.id,
    });
    if (!res.ok) return res;

    if (opts.classroomId) {
      try {
        var seat = await client.from("classroom_children")
          .insert({ classroom_id: opts.classroomId, child_id: res.child.id });
        if (seat.error) {
          return { ok: true, child: res.child, warnings: [fail("seat-failed", seat.error.message)] };
        }
      } catch (e) {
        return { ok: true, child: res.child, warnings: [fail("seat-threw", String(e))] };
      }
    }
    return { ok: true, child: res.child };
  }

  async function linkTeacher(opts) {
    var client = sb();
    if (!client) return fail("no-client");
    if (!opts.teacherUserId || !opts.schoolId) return fail("args");
    try {
      var res = await client.from("teacher_school_links").insert({
        teacher_user_id: opts.teacherUserId,
        school_id: opts.schoolId,
        status: "active",
      });
      if (res.error) return fail("link-failed", res.error.message);
      return { ok: true };
    } catch (e) { return fail("link-threw", String(e)); }
  }

  window.HaarayaEnrol = {
    registerParent: registerParent,
    registerSchool: registerSchool,
    registerSponsored: registerSponsored,
    ensureProfile: ensureProfile,
    addChild: addChild,
    createClassroom: createClassroom,
    enrolPupil: enrolPupil,
    linkTeacher: linkTeacher,
    checkAccessCode: checkAccessCode,
    requiresEmailConfirmation: function () { return REQUIRE_EMAIL_CONFIRMATION; },
    trialDays: TRIAL_DAYS,
  };
})();
