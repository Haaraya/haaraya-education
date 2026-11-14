# Gemmanti

Gemmanti is the Haaraya LMS (learning management system), sold to schools and community groups as a paid add-on. It covers worksheets with teacher ratings, teacher guides, assignments, lessons and learning journeys, reading recordings, the class register, report cards and reports.

**Status: first live version, on the `gemmanti` branch only. Do not merge to `main` yet.** Everything on `main` is published on the live website.

## Open it

Serve the repository and open `gemmanti/Gemmanti.html`:

```bash
python3 -m http.server 8000      # Windows: py -m http.server 8000
# then visit http://localhost:8000/gemmanti/Gemmanti.html
```

- **Live (default):** uses the Haaraya website's sign-in and database. A person signed in on the Haaraya site is signed in here too. Signed out, it shows a Sign in button that goes to `Haaraya Login.html` and comes back.
- **Invented demo:** add `?demo` to the address (`Gemmanti.html?demo`) to see the original design with made-up schools and people, saved in the browser only.

An internet connection is needed: books, pictures and data come from Supabase.

## Edit and build

The screens live in `learn/*.jsx`. The page loads the compiled copies in `learn/dist/`, so the browser does not compile anything. After editing a `.jsx` file, rebuild the compiled copies:

```bash
cd gemmanti
npm install
npm run build
```

Commit both the `.jsx` source files and the rebuilt `learn/dist/` files.

## What the live version does

Needs `supabase/gemmanti_worksheets.sql` run in Supabase. Data loading and saving is in `learn/live.js`; the live screens are in `learn/live.jsx`.

- **Teacher:** their classes and pupils; worksheet review with ratings, help level and a staff-only note; "Open as pupil" so a child can do a worksheet on the teacher's device.
- **School admin:** the same, for every class in the school.
- **Parent:** their children's worksheets and ratings (never the teacher's notes); "Do a worksheet" for a child at home.
- **Haaraya admin:** every school, with a switch that turns Gemmanti on or off on its subscription.
- **Who sees Gemmanti:** only schools whose subscription lists the `gemmanti` add-on. Parents see only children at those schools.
- **Saved:** answers and read-aloud ticks (`worksheet_responses`), ratings and help (`worksheet_reviews`), teacher notes (`worksheet_teacher_notes`). Voice recordings are not stored.
- **Not in the live version yet:** lessons, journeys, assignments, reports and content requests. They need database tables first; they still appear in the `?demo` version.

The 12 showcase books, one per level for L1–L12, have worksheets. The book codes match `HAARAYA_ALL_LEVELS_MASTER_v1_3`.

## Before going live

1. **Book sign-off.** Swap or finish the two showcase books that are not signed off in the master:
   - TF-03-02 *Chinasa at the Market* (`reaudit_fixed; scene_redo_pending`)
   - SN-07-01 *Queen Amina of Zazzau* (`draft`)
2. **Worksheet pictures.** The line art for L1–L6 is wired in. It needs uploading to Supabase Storage at `book-assets/worksheets/<book code>/<image ID>.webp`; until then the striped placeholders show. Image IDs come from `HAARAYA_WORKSHEET_LINEART_SHOWCASE_v1.csv`, and `learn/ws-pics.js` says which picture label uses which image. Screen copies are 600 px greyscale WebP; the full-size originals are kept for print.
3. **Sign-in, real data and saving.** Done in the first live version; test it with the demo logins.
4. **Link it in.** Add a Gemmanti link to the website's teacher, school and parent dashboards for schools with the add-on.
5. **Lessons, assignments and reports.** Need their own tables before they can be live.
6. **Base-plan changes on the website.** In the base plan, teachers see progress only, and assigning books moves into Gemmanti. Update the School plan wording on the home page to match.
