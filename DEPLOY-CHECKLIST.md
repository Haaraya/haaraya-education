# Haaraya Education — Deploy Checklist

The live site is **GitHub Pages + Jekyll**, built from the `main` branch (repo root) and
served at **https://haaraya.github.io/haaraya-education/**. `index.html` redirects to
`Haaraya Home.html`. All quiz / "About this book" / auth content is read **live from
Supabase** at page load — there is no cached copy in the site, so stale content is always
either a database issue or a file that failed to deploy.

---

## Every push — 3 checks

1. **Green build.** After `git push`, open the repo's **Actions** tab and wait for the
   **"pages build and deployment"** run to finish green. *Your changes are NOT live until
   this succeeds* — the repo can be correct while the site still shows the old build.
2. **Hard-refresh** the site (Ctrl/Cmd + Shift + R) before judging whether a change worked.
3. **New root file? Verify it's live.** After adding any new root-level `.js` / `.css`,
   open its URL directly and confirm it is NOT a 404, e.g.
   `https://haaraya.github.io/haaraya-education/supabase-client.js`

---

## The `_config.yml` trap (this broke the quiz once)

Jekyll's `exclude:` list decides what does **not** get published. A folder entry written
**without a trailing slash also matches any root file whose name starts with it.**

- ❌ `- supabase`  → also drops the root file **`supabase-client.js`** → no
  `window.HaarayaSupabase` → every book shows placeholder questions.
- ✅ `- supabase/` → excludes only the `supabase/` folder. Correct.

**Rule: every folder in `exclude:` ends with a trailing slash.** Never add a bare folder name.

---

## Files the site must be able to load (root level)

| File | Purpose | If it 404s |
|---|---|---|
| `supabase-client.js` | creates `window.HaarayaSupabase` | quiz + About + auth all fall back to placeholders |
| `odyssey-quiz-supabase.js` | reading-check data layer | quizzes show placeholder questions |
| `about-supabase.js` | "About this book" data layer | About pages blank/placeholder |

---

## Fast diagnosis when a book shows the wrong / placeholder questions

Open the deployed site, then browser **DevTools → Console**:

```js
(async () => {
  console.log('client present?', typeof window.HaarayaSupabase);       // want "object"
  const r = await window.HaarayaSupabase
    .from('reading_checks')
    .select('book_title,q1_text,q1_a,q1_b,q1_c')
    .eq('book_code','H-04-01').maybeSingle();                          // swap in your book
  console.log(r.error ? ('DB ERROR: ' + r.error.message) : r.data);
})();
```

- `client present? undefined` → a `*-supabase.js` file 404'd → check `_config.yml` + Pages build.
- `DB ERROR: permission denied` → the public read grants were lost (see below).
- Correct row printed, but screen still wrong → stale on-screen view: hard-refresh and reopen
  the book (don't resume a screen that was already sitting on the quiz).

---

## Supabase read permissions

The app reads as the `anon` role, so these must have public SELECT granted to
`anon, authenticated`:

```sql
grant usage  on schema public to anon, authenticated;
grant select on reading_checks      to anon, authenticated;
grant select on reading_check_codes to anon, authenticated;
grant select on about_pages         to anon, authenticated;
grant select on about_page_codes    to anon, authenticated;
```

A `permission denied` error in the console means one of these was dropped — re-run the grants.

---

## Deploy timeouts

The `exclude:` list also keeps the published build small; large folders (e.g. `uploads/`)
once made the Pages deploy time out and fail. Exclude big new working folders (with a
trailing slash) rather than letting them publish.
