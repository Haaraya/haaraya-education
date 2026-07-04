// ============================================================
//  Haaraya Odyssey — Shipmate Scribe  ·  spin-log Edge Function
//  Turns a child's Captain's Notes into a short Odyssey Log entry.
//  "The Captain speaks. The Shipmate writes."
//
//  Deploy (Supabase CLI):
//    supabase functions deploy spin-log --no-verify-jwt
//    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
//  The client posts { notes, book_title, voice_level, person } and
//  gets back { title, text, shipmate_note, need_more_clue }.
//
//  GUARDRAIL: the model is instructed to use ONLY the facts in the
//  child's notes — it may polish language but must not invent plot,
//  characters, settings or lessons. Comprehension evidence stays the
//  child's own (that's what we store in raw_captain_notes).
// ============================================================

const MODEL = "claude-haiku-4-5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are Shipmate Scribe, the loyal log-writer for a child reading the 100 Book Odyssey.

Your job is to turn the child's Captain's Notes into a short, magical Odyssey Log Entry.

Rules:
- Do not invent major plot events, characters, settings, or lessons.
- Use only the facts provided in the Captain's Notes.
- You may make the language more vivid, adventurous, and polished.
- Keep the entry age-appropriate.
- Keep it short: 80-130 words.
- Make the child feel like the Captain of a reading adventure.
- Do not sound like a quiz, school report, or worksheet.
- Do not correct the child harshly.
- If the notes are too thin, ask for one more clue instead of writing the log.

Output EXACTLY in this shape, each label on its own line:
Title: <a short title>
Odyssey Log Entry: <the log entry, or empty if you need more>
Shipmate Note: <one warm sentence to the Captain; if the notes are too thin, put your single request for one more clue here and leave the Log Entry empty>`;

function buildUserPrompt(body: any): string {
  const n = body.notes || {};
  const voice = body.voice_level === "older_reader"
    ? "Older reader: a slightly richer vocabulary is fine."
    : "Younger reader: simple, warm, short sentences.";
  const person = body.person === "third"
    ? "Write in the third person, calling the child 'the Captain'."
    : "Write in the first person, as the Captain ('I ...').";
  const lines = [
    `Book: ${body.book_title || "(untitled)"}`,
    voice,
    person,
    "",
    "Captain's Notes:",
    `- What happened: ${n.what_happened || "(blank)"}`,
    `- Who mattered most: ${n.who_mattered_most || "(blank)"}`,
    `- The trouble / surprise / lesson / big idea: ${n.big_idea || "(blank)"}`,
    `- What I noticed: ${n.what_i_noticed || "(blank)"}`,
    `- One word I found: ${n.new_word || "(blank)"}`,
    `- How the book made me feel: ${n.feeling || "(blank)"}`,
  ];
  return lines.join("\n");
}

function parseOutput(raw: string) {
  const grab = (label: string) => {
    const re = new RegExp(label + "\\s*:\\s*([\\s\\S]*?)(?=\\n(?:Title|Odyssey Log Entry|Shipmate Note)\\s*:|$)", "i");
    const m = raw.match(re);
    return m ? m[1].trim() : "";
  };
  const title = grab("Title");
  const text = grab("Odyssey Log Entry");
  const shipmate_note = grab("Shipmate Note");
  const need_more_clue = text.length < 15; // Scribe withheld the log and asked for a clue
  return { title, text, shipmate_note, need_more_clue };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || MODEL,
        max_tokens: 600,
        system: SYSTEM,
        messages: [{ role: "user", content: buildUserPrompt(body) }],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return new Response(JSON.stringify({ error: "anthropic_error", detail }), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const raw = (data.content || []).map((b: any) => b.text || "").join("").trim();
    return new Response(JSON.stringify(parseOutput(raw)), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "exception", detail: String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
