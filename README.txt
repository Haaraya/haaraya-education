HAARAYA ODYSSEY — FREE SHIPMATE SCRIBE REBUILD v2
===================================================

WHAT CHANGED
------------
The runtime AI writer is removed.

Captain's Notes remain the child's exact words.
The Yarn no longer restates every answer. Instead it:
  1. reads the SHAPE of the book's authored Captain's Log questions;
  2. uses the book's existing Spin-the-Yarn creative brief to choose a writing frame
     (field report, diary, mission, travel log, interview, etc.);
  3. writes a short 2-paragraph reflection on how the questions connect;
  4. keeps at most ONE short phrase from the child's notes as a quoted anchor;
  5. varies deterministically by reader + book + spin version.

There are no Anthropic/OpenAI/Edge-Function calls in the new spin() path.
Supabase is still used only to save/load the Captain's log, with localStorage fallback.

FILES TO REPLACE
----------------
1. scribe-writer.js
2. scribe-data.js
3. shipmate-scribe.jsx

NO CHANGE NEEDED
----------------
- odyssey-captains-log.jsx
- odyssey-captains-log.css
- odyssey-books.js

The existing log page already trims at 70 words. The new writer targets roughly
50-70 words, so the Yarn fits the illustrated page without the old 110-170 word bloat.

The existing Supabase table public.odyssey_captains_log_prompts already contains
100 active book-specific prompt rows (Books 1-100). Keep using HaarayaLogPrompts to
load those authored questions and spin_the_yarn_prompt values.

The old Supabase spin-log Edge Function is no longer required by the frontend.
You can leave it deployed during testing; the new scribe-data.js never calls it.
After the new writer is confirmed live, it can be undeployed/deleted separately.

SCRIPT LOAD ORDER
-----------------
Make sure these are available before the Scribe UI is used:
  scribe-writer.js
  scribe-data.js
  shipmate-scribe.jsx

NSUDE TEST
----------
Using the three answers shown in the current Book 1 screenshot, one deterministic
output from the new engine is:

Title: A Clue Worth Keeping

Field report: the map changed before this voyage was over. In “The Nsude Pyramids,”
I followed the questions past the first answer. The trail began with a difference,
moved to why it mattered, and ended with what to carry forward.

I carried one scrap forward: “They renewed the pyramids for each generation.”
Knowledge gets interesting when the facts begin to connect.

Shipmate Note: Your notes are the evidence. This yarn keeps the thread between them.

"Spin again" now really does vary the Yarn because spin_version is included in the
seed. Reopening a saved Yarn does not re-spin it, so saved entries remain stable.
