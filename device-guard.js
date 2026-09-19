/* ============================================================
   Haaraya — Device guard (client)
   ------------------------------------------------------------
   Companion to supabase/device_guard.sql. Stops one account being
   shared with a whole group: each browser gets a random device id,
   and an account may keep 3 active devices (staff can raise it).

   Requires supabase-client.js. Load AFTER auth.js.

     await HaarayaDeviceGuard.register()      // after a sign-in
     await HaarayaDeviceGuard.listDevices()
     await HaarayaDeviceGuard.revoke(deviceId)
     await HaarayaDeviceGuard.enforce()       // register + show the
                                              // "too many devices" panel
     HaarayaDeviceGuard.deviceId()

   auth.js calls enforce() itself after signIn(), so most pages need
   nothing beyond the script tag.
   ============================================================ */
(function () {
  "use strict";

  var sb = window.HaarayaSupabase;
  if (!sb) { console.error("[Haaraya] device-guard: HaarayaSupabase not ready"); return; }

  var KEY = "haaraya.device.id";

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "dev-" + Date.now().toString(36) + "-" +
      Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
  }

  function deviceId() {
    var id = null;
    try { id = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (!id || id.length < 8) {
      id = uuid();
      try { localStorage.setItem(KEY, id); } catch (e) { /* ignore */ }
    }
    return id;
  }

  // A coarse, human-readable label — never a fingerprint.
  function label() {
    var ua = navigator.userAgent || "";
    var browser =
      /Edg\//.test(ua) ? "Edge" :
      /OPR\//.test(ua) ? "Opera" :
      /Chrome\//.test(ua) && !/Chromium/.test(ua) ? "Chrome" :
      /Firefox\//.test(ua) ? "Firefox" :
      /Safari\//.test(ua) ? "Safari" : "Browser";
    var os =
      /iPhone|iPod/.test(ua) ? "iPhone" :
      /iPad/.test(ua) ? "iPad" :
      /Android/.test(ua) ? "Android" :
      /Mac OS X/.test(ua) ? "Mac" :
      /Windows/.test(ua) ? "Windows" :
      /Linux/.test(ua) ? "Linux" : "device";
    return browser + " on " + os;
  }

  async function register() {
    var res = await sb.rpc("register_device", {
      p_device_id: deviceId(),
      p_label: label(),
    });
    if (res.error) {
      // Never lock anyone out because the guard itself failed.
      console.warn("[Haaraya] device-guard unavailable:", res.error.message);
      return { ok: true, reason: "guard_unavailable" };
    }
    return res.data || { ok: true, reason: "no_data" };
  }

  async function listDevices() {
    var res = await sb.rpc("list_my_devices");
    if (res.error) throw res.error;
    return res.data || { limit: 3, devices: [] };
  }

  async function revoke(id) {
    var res = await sb.rpc("revoke_my_device", { p_device_id: id });
    if (res.error) throw res.error;
    return res.data;
  }

  /* ---- "Too many devices" panel ---------------------------------- */

  function injectStyles() {
    if (document.getElementById("hdg-styles")) return;
    var css = [
      ".hdg-overlay{position:fixed;inset:0;z-index:2000;background:rgba(26,38,30,.6);display:grid;place-items:center;padding:20px;font-family:var(--font-body,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif)}",
      ".hdg-card{width:min(460px,100%);max-height:88vh;overflow-y:auto;background:#fff;border-radius:18px;padding:26px 24px;box-shadow:0 24px 60px rgba(0,0,0,.28)}",
      ".hdg-kicker{font-weight:800;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--forest,#2F5233);margin-bottom:8px}",
      ".hdg-card h3{font-family:var(--font-display,Georgia,serif);font-size:25px;line-height:1.2;color:var(--ink,#1A2A1A);margin:0 0 10px}",
      ".hdg-card p{font-size:14.5px;line-height:1.55;color:var(--ink-mid,#4A5A4A);margin:0 0 16px}",
      ".hdg-list{display:flex;flex-direction:column;gap:10px;margin-bottom:18px}",
      ".hdg-row{display:flex;align-items:center;gap:12px;border:1.5px solid var(--sand,#E3DED2);border-radius:12px;padding:12px 14px}",
      ".hdg-row .m{flex:1;min-width:0}",
      ".hdg-name{font-weight:800;font-size:15px;color:var(--ink,#1A2A1A)}",
      ".hdg-sub{font-size:12.5px;color:var(--ink-soft,#6B7A6B);font-weight:600;margin-top:2px}",
      ".hdg-row button{flex-shrink:0;min-height:40px;padding:0 14px;border:0;border-radius:999px;font-weight:800;font-size:13px;cursor:pointer;background:var(--sand,#E3DED2);color:var(--ink,#1A2A1A)}",
      ".hdg-row button:hover{background:#C9C2B2}",
      ".hdg-row button[disabled]{opacity:.5;cursor:default}",
      ".hdg-foot{display:flex;flex-direction:column;gap:10px}",
      ".hdg-foot button{min-height:46px;border:0;border-radius:999px;font-weight:800;font-size:15px;cursor:pointer}",
      ".hdg-cancel{background:transparent;color:var(--ink-soft,#6B7A6B);text-decoration:underline}",
      ".hdg-note{font-size:12.5px;color:var(--ink-soft,#6B7A6B);font-weight:600;text-align:center;margin:0}",
      ".hdg-err{font-size:13px;font-weight:700;color:#C62828;background:#FDECEC;border:1px solid #F6C9C9;border-radius:10px;padding:9px 12px;margin-bottom:12px}",
    ].join("");
    var el = document.createElement("style");
    el.id = "hdg-styles"; el.textContent = css;
    document.head.appendChild(el);
  }

  function when(ts) {
    if (!ts) return "";
    var d = new Date(ts), days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return "used today";
    if (days === 1) return "used yesterday";
    if (days < 30) return "last used " + days + " days ago";
    return "last used " + d.toLocaleDateString();
  }

  // Shows the list and resolves true once a slot is free, false if they quit.
  function showLimitPanel(data) {
    injectStyles();
    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      overlay.className = "hdg-overlay";
      var card = document.createElement("div");
      card.className = "hdg-card";
      overlay.appendChild(card);

      function close(result) { overlay.remove(); resolve(result); }

      function render(devices, limit, error) {
        card.innerHTML = "";
        var head = document.createElement("div");
        head.innerHTML =
          '<div class="hdg-kicker">Too many devices</div>' +
          "<h3>This account is already on " + limit + " devices</h3>" +
          "<p>Your account allows one device for you plus one for each reader. " +
          "To read on this device, remove one you no longer use — you can always add it back later.</p>";
        card.appendChild(head);
        if (error) {
          var e = document.createElement("div");
          e.className = "hdg-err"; e.textContent = error;
          card.appendChild(e);
        }
        var list = document.createElement("div");
        list.className = "hdg-list";
        devices.forEach(function (d) {
          var row = document.createElement("div");
          row.className = "hdg-row";
          var meta = document.createElement("div");
          meta.className = "m";
          meta.innerHTML = '<div class="hdg-name"></div><div class="hdg-sub"></div>';
          meta.querySelector(".hdg-name").textContent = d.label || "Unknown device";
          meta.querySelector(".hdg-sub").textContent = when(d.last_seen);
          var btn = document.createElement("button");
          btn.type = "button"; btn.textContent = "Remove";
          btn.onclick = async function () {
            btn.disabled = true; btn.textContent = "Removing…";
            try {
              await revoke(d.device_id);
              var again = await register();
              if (again && again.ok) return close(true);
              var fresh = await listDevices();
              render(fresh.devices || [], fresh.limit || limit, null);
            } catch (err) {
              render(devices, limit, (err && err.message) || "Could not remove that device.");
            }
          };
          row.appendChild(meta); row.appendChild(btn);
          list.appendChild(row);
        });
        card.appendChild(list);

        var foot = document.createElement("div");
        foot.className = "hdg-foot";
        var cancel = document.createElement("button");
        cancel.type = "button"; cancel.className = "hdg-cancel";
        cancel.textContent = "Not now — sign out";
        cancel.onclick = function () { close(false); };
        var note = document.createElement("p");
        note.className = "hdg-note";
        note.textContent = "Need more devices for a school or a large family? Email hello@haarayaeducation.org.";
        foot.appendChild(cancel); foot.appendChild(note);
        card.appendChild(foot);
      }

      render((data && data.devices) || [], (data && data.limit) || 3, null);
      document.body.appendChild(overlay);
    });
  }

  /* ---- The one call pages need ----------------------------------- */
  //  Returns true when this device may proceed. On refusal it shows the
  //  panel; if the person declines, it signs them out and returns false.
  async function enforce() {
    var res = await register();
    if (res && res.ok) return true;
    if (res && res.reason === "device_limit") {
      var freed = await showLimitPanel(res);
      if (freed) return true;
      try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
      return false;
    }
    return true; // not_signed_in / bad id — never block on a guard fault
  }

  window.HaarayaDeviceGuard = {
    deviceId: deviceId,
    label: label,
    register: register,
    listDevices: listDevices,
    revoke: revoke,
    enforce: enforce,
    showLimitPanel: showLimitPanel,
  };
})();
