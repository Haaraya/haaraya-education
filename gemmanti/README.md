# Gemmanti

Gemmanti is the Haaraya LMS (learning management system), sold to schools and community groups as a paid add-on. It covers worksheets with teacher ratings, teacher guides, assignments, lessons and learning journeys, reading recordings, the class register, report cards and reports.

**Status: demo only. Do not merge to `main` yet.** Everything on `main` is published on the live website.

## Open the demo

Serve the repository and open `gemmanti/Gemmanti.html`:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/gemmanti/Gemmanti.html
```

Book covers and pages load from the Haaraya Supabase library, so an internet connection is needed.

## Edit and build

The screens live in `learn/*.jsx`. The page loads the compiled copies in `learn/dist/`, so the browser does not compile anything. After editing a `.jsx` file, rebuild the compiled copies:

```bash
cd gemmanti
npm install
npm run build
```

Commit both the `.jsx` source files and the rebuilt `learn/dist/` files.

## What is real and what is demo

- **Real:** the 12 showcase books, one per level for L1–L12, with their worksheets. The book codes match `HAARAYA_ALL_LEVELS_MASTER_v1_3`.
- **Demo:** all people, schools, classes and scores. They are invented.
- **Saving:** progress, answers, ratings and notes are saved in the browser on that device only. Nothing is written to Supabase.
- **Sign-in:** there is none yet. A menu in the top bar switches between roles.

## Before going live

1. **Book sign-off.** Swap or finish the two showcase books that are not signed off in the master:
   - TF-03-02 *Chinasa at the Market* (`reaudit_fixed; scene_redo_pending`)
   - SN-07-01 *Queen Amina of Zazzau* (`draft`)
2. **Worksheet pictures.** Add the worksheet line art. Picture tasks currently show placeholder boxes.
3. **Sign-in and roles.** Use the website's sign-in, and show each person their real school, classes and children.
4. **Saving to the database.** Add Supabase tables and access rules for worksheet records, then save to them.
5. **Add-on check.** Show Gemmanti only to schools whose subscription includes it, and link it from the teacher and school dashboards.
6. **Base-plan changes on the website.** In the base plan, teachers see progress only, and assigning books moves into Gemmanti. Update the School plan wording on the home page to match.
