/* ============================================================
   Haaraya — Reading Scholarship
   ------------------------------------------------------------
   A family that shows the product WORKED earns the Haaraya Reading
   Rate: 50% off, for as long as they stay subscribed. Nothing is
   given away free — they convert to a paid plan at the earned rate.

   The server also honours a "clearly reading" fallback below the
   headline bar (5 books / 4 days), so a family that plainly read
   is not refused on a technicality.

   The milestone deliberately measures evidence, not volume:

     · 10 books finished WITH the reading check passed
       (raw "books opened" invites page-flipping; a passed check
        is the only comprehension evidence we hold)
     · spread over 8 separate days inside the 14-day window
       (consistency predicts whether a child sticks). A "day" means a day a
       book was finished and its check passed — the same rows as above, not
       merely a day the app was opened.

   Both must be met before the trial ends. Progress is visible
   from day one — a milestone nobody can see is no incentive.

   Reads public.reading_check_results (see supabase/scholarship.sql).

   Exposes window.HaarayaScholarship:
     RULE                          -> { books, days, windowDays, reward }
     await progressFor(childIds)   -> { books, days, met, soft, qualified, basis, booksLeft, daysLeft, deadline }
     await award(ownerUserId)      -> records the earned rate (server re-verifies)
     summarise(progress)           -> one parent-facing sentence
   ============================================================ */
(function () {
  "use strict";

  var RULE = {
    books: 10,          // finished AND reading check passed
    days: 8,            // distinct days on which a check was passed
    windowDays: 14,     // the trial length
    reward: "half price for as long as you stay",
    discountPct: 50,
    softBooks: 5,       // mirrors the server's "clearly reading" fallback
    softDays: 4,
  };

  function sb() { return window.HaarayaSupabase || null; }

  /* Progress across every child on the account — a family earns it together,
     so one keen reader can carry a younger sibling. */
  async function progressFor(childIds, trialStartedAt) {
    var out = { books: 0, days: 0, met: false, soft: false, qualified: false, basis: null, booksLeft: RULE.books, daysLeft: RULE.days, deadline: null, ready: false };
    var client = sb();
    var ids = (childIds || []).filter(Boolean);
    if (!client || !ids.length) return out;

    var start = trialStartedAt ? new Date(trialStartedAt) : null;
    var end = null;
    if (start && !isNaN(start)) {
      end = new Date(start.getTime() + RULE.windowDays * 86400000);
      out.deadline = end.toISOString();
    }

    try {
      var q = client.from("reading_check_results")
        .select("book_code, child_id, passed, created_at")
        .in("child_id", ids)
        .eq("passed", true);
      // BOTH ends, matching grant_reading_scholarship exactly — an unbounded
      // client window would promise a scholarship the server then refuses.
      if (start && !isNaN(start)) {
        q = q.gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
      }
      var res = await q;
      if (res.error) return out;

      var rows = res.data || [];
      // One credit per BOOK per child — re-reading the same book doesn't count twice.
      var seen = {}, days = {};
      rows.forEach(function (r) {
        var key = r.child_id + "|" + r.book_code;
        if (!seen[key]) { seen[key] = true; out.books++; }
        days[String(r.created_at).slice(0, 10)] = true;
      });
      out.days = Object.keys(days).length;
      out.booksLeft = Math.max(0, RULE.books - out.books);
      out.daysLeft = Math.max(0, RULE.days - out.days);
      out.met = out.books >= RULE.books && out.days >= RULE.days;
      // The server also grants on the "clearly reading" bar, so the client must
      // recognise it — otherwise a family who has already earned the rate is
      // told they still have books to go.
      out.soft = out.books >= RULE.softBooks && out.days >= RULE.softDays;
      out.qualified = out.met || out.soft;
      out.basis = out.met ? "milestone" : (out.soft ? "clearly_reading" : null);
      out.ready = true;
      return out;
    } catch (e) { return out; }
  }

  /* Record the award. The DB refuses a second one per owner, so this is safe
     to call whenever the milestone reads as met. */
  async function award(ownerUserId) {
    var client = sb();
    if (!client || !ownerUserId) return false;
    try {
      var res = await client.rpc("grant_reading_scholarship", { p_owner: ownerUserId });
      return !res.error;
    } catch (e) { return false; }
  }

  /* One honest sentence for the parent dashboard. Leads with the reward, so the
     sentence sells the incentive and the verb always agrees. */
  function summarise(p) {
    if (!p || !p.ready) return "";
    var earned = "Scholarship earned \u2014 " + RULE.reward + ".";
    if (p.qualified) return earned;

    var books = p.booksLeft
      ? p.booksLeft + " more " + (p.booksLeft === 1 ? "book" : "books") + " with the reading check passed"
      : "";
    var days = p.daysLeft
      ? "across " + p.daysLeft + " more " + (p.daysLeft === 1 ? "day" : "days")
      : "";

    if (books && days) return "Half price for as long as you stay when you finish " + books + ", " + days + ".";
    if (books)         return "Half price for as long as you stay when you finish " + books + ".";
    if (days)          return "Half price for as long as you stay when you read " + days + ".";
    return earned;
  }


  window.HaarayaScholarship = {
    RULE: RULE,
    progressFor: progressFor,
    award: award,
    summarise: summarise,
  };
})();
