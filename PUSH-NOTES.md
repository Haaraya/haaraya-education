# Push — 31 Aug 2026

## Changed file (1)
- `avatar-config.js` → repo root (overwrite)

Girl hair set updated to match your re-exported artwork:
Bun, Plaited, Hijab, Short Natural. The girl afro is removed, default girl
hair is now `bun`, and legacy avatars migrate afro → Short Natural,
puffs/bantu → Bun. Boys unchanged.

## Asset requirement
`assets/avatar-builder/girls/hair/` must contain:
`bun.webp  braids.webp  hijab.webp  short.webp`

**`bun.webp` replaces `afro.webp`** — same canvas size and figure position as
the other layers, no ears. Delete `girls/hair/afro.webp` (nothing loads it now).

## Verify after the Actions run goes green
https://haaraya.github.io/haaraya-education/assets/avatar-builder/girls/hair/bun.webp

---

# Level progress fix (same push)

## Changed files (3)
- `platform-supabase.js`
- `progress-sync.js`
- `screens.jsx`

The write path was fine — reads and refresh were not.

1. **Bar never refreshed after the save landed.** Finishing a book emits
   `haaraya:reading` immediately from the local store, but the Supabase row is
   written later by the queue flush. Every dashboard figure refetched against
   the pre-write data, so the bar only moved on a manual reload. The flush now
   re-emits `haaraya:reading` once it has actually written something.
2. **Level totals could be zero.** The per-level book count swallowed its own
   error and was capped at PostgREST's 1000-row default. A zero total renders
   "0 of 0 · 0%" regardless of how much the child read. Now raises the range,
   logs the error, and falls back to the local catalogue count.
3. **"My reading path" never refetched** — its effect was missing `readTick`,
   so that figure was frozen for the whole session.

## If it is still stuck after this
Run `HaarayaProgressSync.diagnose()` in the console on the child dashboard and
send me the `verdict` line — it distinguishes an unreadable child row, a
book-code mismatch, and a blocked write.
