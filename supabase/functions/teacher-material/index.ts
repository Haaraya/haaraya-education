// ============================================================
// Haaraya - teacher-material Edge Function
//
// POST { book: "S-01-06", kind: "worksheet" | "guide" }, signed in as a
// teacher, school admin or Haaraya admin. Returns the PDF from the private
// teacher-materials bucket with the school, school code and a download code
// stamped down the right edge of every page. Each download is logged in
// print_log by issue_material_code() (paper = ws-pdf / tg-pdf).
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { PDFDocument, StandardFonts, rgb, degrees } from "npm:pdf-lib@1.17.1";

const env = (k: string) => Deno.env.get(k) ?? "";
const PUB = "sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY";
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const ALLOWED = ["https://haaraya.github.io", "http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:8765"];
const cors = (req: Request) => {
  const o = req.headers.get("origin") ?? "";
  return { "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0], "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Expose-Headers": "Content-Disposition", "Vary": "Origin" };
};
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "POST only" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const book = String(body.book || "").trim();
    const kind = body.kind === "guide" ? "guide" : body.kind === "worksheet" ? "worksheet" : "";
    if (!/^[A-Z]{1,4}-\d\d-\d\d$/.test(book) || !kind) return json(req, { error: "Unknown worksheet." }, 400);
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json(req, { error: "Please sign in to download." }, 401);

    // The file first, so a missing one never uses up a download code.
    const dl = await admin.storage.from("teacher-materials").download(`${book}/${kind}.pdf`);
    if (dl.error || !dl.data) return json(req, { error: "This book has no " + (kind === "guide" ? "teacher guide" : "worksheet") + " to download yet." }, 404);

    // Who is asking, and the download code: checked and logged in the database as that person.
    const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY") || PUB, { auth: { persistSession: false }, global: { headers: { Authorization: "Bearer " + token } } });
    const ic = await asUser.rpc("issue_material_code", { p_book: book, p_kind: kind });
    if (ic.error || !ic.data) return json(req, { error: (ic.error && ic.error.message) || "Couldn't download just now." }, 403);
    const { code, school_code, school_name } = ic.data as { code: string; school_code: string; school_name: string };

    const pdf = await PDFDocument.load(new Uint8Array(await dl.data.arrayBuffer()));
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const mark = `${school_name}  ·  School ${school_code}  ·  ${code}  ·  ${date}  ·  For use at this school only`;
    const size = 6.5;
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      const w = font.widthOfTextAtSize(mark, size);
      page.drawText(mark, { x: width - 14, y: (height - w) / 2, size, font, color: rgb(0.55, 0.55, 0.55), rotate: degrees(90) });
    }
    pdf.setSubject(`Haaraya ${kind === "guide" ? "teacher guide" : "worksheet"} ${book}, downloaded by ${school_name} (${school_code}), ${code}`);
    pdf.setKeywords(["Haaraya", book, school_code, code]);
    const out = await pdf.save();
    const name = `Haaraya_${kind === "guide" ? "Teacher_Guide" : "Worksheet"}_${book}_${code}.pdf`;
    return new Response(out, { headers: { ...cors(req), "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${name}"` } });
  } catch (e) {
    return json(req, { error: "Couldn't download just now. Please try again." }, 500);
  }
});
