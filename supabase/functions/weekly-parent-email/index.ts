// ============================================================
// Haaraya - weekly-parent-email Edge Function
//
// POST (from pg_cron, header x-cron-secret)
//   -> sends every weekly parent digest
//
// POST ?dry=you@x.org
//   -> sends ONE sample to that address
//
// GET ?unsubscribe=<token>
//   -> turns weekly emails off
//
// Uses the same SMTP account configured for Supabase Auth.
// Port 465 only.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.15";

const env = (key: string) => Deno.env.get(key) ?? "";

const SITE =
  env("SITE_URL") ||
  "https://haaraya.github.io/haaraya-education";

const FN_URL =
  `${env("SUPABASE_URL")}/functions/v1/weekly-parent-email`;

const db = createClient(
  env("SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

type Kid = {
  name: string;
  books: string[];
  quiz_taken: number;
  quiz_passed: number;
  quiz_pct: number | null;
  days: number;
  stamps: number;
  stamps_total: number;
  odyssey: number;
  next: { code: string; title: string; about?: string | null; cover?: string | null } | null;
  // Current passport page (weekly_digest_passport.sql). Optional: older digests omit it.
  level?: number | null;
  cover_color?: string | null;
  page?: string[] | null; // one entry per book at this level, in order: "c" complete, "r" reading, "n" not started
};

type Row = {
  email: string;
  full_name: string;
  email_token: string;
  children: Kid[];
};

const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      }[char]!)
  );

const plural = (number: number, word: string) =>
  `${number} ${word}${number === 1 ? "" : "s"}`;

const BOOK_ASSET_BASE =
  `${env("SUPABASE_URL")}/storage/v1/object/public/book-assets/`;

function publicBookAssetUrl(path: string | null | undefined) {
  const value = (path || "").trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return BOOK_ASSET_BASE + value
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

// Mirrors PASSPORT_LEVELS / PASSPORT_COVERS in the web app (screens.jsx, shared.jsx).
const PASSPORT_LEVELS: [string, string][] = [
  ["Tashi", "#E84B9C"], ["Mataki", "#E53935"], ["Hanya", "#E0A400"], ["Tafiya", "#1E88E5"],
  ["Kwararo", "#2E9D4F"], ["Gada", "#FB8C00"], ["Kwari", "#16B5AF"], ["Tudun", "#8E24AA"],
  ["Kololuwa", "#C9A227"], ["Fage", "#AEB4AC"], ["Sarari", "#9CCC2E"], ["Isa", "#8E1616"],
];
const PASSPORT_COVERS: Record<string, string> = {
  green: "#2C5A32", blue: "#213D82", red: "#8A1E23", beige: "#E4B466",
};
// Small email-sized copies of the real stamp art (assets/email/, pushed with the site).
const EMAIL_ASSETS = `${SITE}/assets/email/`;
const STAMP_IMG: Record<string, string> = {
  c: "book-complete.png", r: "book-reading.png", n: "book-notstarted.png",
};

// A thumbnail of the child's real passport page for their current level:
// cover-coloured binding, cream page, one seal per book, the Level stamp below.
function passportPage(k: Kid) {
  const page = Array.isArray(k.page) ? k.page : [];
  const level = Math.min(Math.max(Number(k.level) || 1, 1), 12);
  const [levelName, levelColor] = PASSPORT_LEVELS[level - 1];
  const binding = PASSPORT_COVERS[(k.cover_color || "green").toLowerCase()] || PASSPORT_COVERS.green;
  const done = page.filter((x) => x === "c").length;
  const total = page.length;
  const toGo = Math.max(total - done, 0);
  const full = total > 0 && toGo === 0;

  const MAX = 36, PER_ROW = 6;
  const shown = page.slice(0, MAX);
  const more = Math.max(page.length - MAX, 0);
  const cells = shown.map((st) => `
    <td align="center" valign="middle" width="16.66%" style="padding:3px 2px">
      <img src="${EMAIL_ASSETS}${STAMP_IMG[st] || STAMP_IMG.n}" width="30" height="30" alt=""
        style="display:block;margin:0 auto;width:30px;height:30px;border:0;${st === "c" ? "" : "opacity:.45;"}">
    </td>`);
  if (more > 0) {
    cells.push(`<td align="center" valign="middle" width="16.66%" style="padding:3px 2px;font-size:11px;font-weight:800;color:#8B8060">+${more}</td>`);
  }
  while (cells.length % PER_ROW) cells.push('<td width="16.66%" style="padding:3px 2px"></td>');
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += PER_ROW) rows.push(`<tr>${cells.slice(i, i + PER_ROW).join("")}</tr>`);

  const grid = total
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows.join("")}</table>`
    : `<div style="font-size:12px;color:#8B8060;padding:10px 0">Stamps appear here as books are finished.</div>`;

  const status = full
    ? "Page complete!"
    : `${toGo} more ${toGo === 1 ? "book" : "books"} to unlock`;

  return `
    <a href="${SITE}/Haaraya%20Home.html#child" style="text-decoration:none;color:inherit;display:block">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
      style="background:${binding};border-radius:14px">
      <tr><td style="padding:6px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="background:#FBF7EA;border-radius:9px">
          <tr><td style="padding:12px 12px 6px">
            <div style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#4F6B3A;font-weight:800">Reading Passport</div>
            <div style="font-size:15px;line-height:1.2;color:#173d2b;font-weight:800;margin-top:3px">${esc(k.name)}</div>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:6px"><tr>
              <td style="border:1.5px solid ${levelColor};border-radius:999px;padding:3px 9px 3px 7px;background:#ffffff;white-space:nowrap">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${levelColor};vertical-align:middle"></span>
                <span style="font-size:11px;font-weight:800;color:#2b3a24;vertical-align:middle">&nbsp;Level ${level} · ${levelName}</span>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:4px 8px 6px">${grid}</td></tr>
          <tr><td style="padding:0 12px 12px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1.5px dashed #DCCFA6">
              <tr>
                <td width="52" valign="middle" style="padding-top:9px">
                  <img src="${EMAIL_ASSETS}stamp-l${level}.png" width="44" height="44" alt="Level ${level} stamp"
                    style="display:block;width:44px;height:44px;border:0;${full ? "" : "opacity:.4;"}">
                </td>
                <td valign="middle" style="padding:9px 0 0 6px">
                  <div style="font-size:12px;font-weight:800;color:#2b3a24">${done} of ${total} stamps</div>
                  <div style="font-size:11px;color:#6f775f;margin-top:2px">Level ${level} stamp · ${status}</div>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>
    </a>`;
}

function currentWeekIndex() {
  const now = new Date();

  const utcDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );

  const day = utcDate.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  utcDate.setUTCDate(
    utcDate.getUTCDate() - daysSinceMonday
  );

  return Math.floor(
    utcDate.getTime() /
      (7 * 24 * 60 * 60 * 1000)
  );
}

function formatChildNames(children: Kid[], ampersand = false) {
  const names = children
    .slice(0, 4)
    .map((child) => child.name.trim())
    .filter(Boolean);

  if (names.length === 0) return "Your child";
  if (names.length === 1) return names[0];

  const joiner = ampersand ? " & " : " and ";

  if (names.length === 2) {
    return `${names[0]}${joiner}${names[1]}`;
  }

  return `${names.slice(0, -1).join(", ")}${ampersand ? " & " : " and "}${names[names.length - 1]}`;
}

function readingWeekHeading(children: Kid[]) {
  const names = formatChildNames(children);
  return `Here’s ${names}’s reading week.`;
}

function readingWeekSubject(children: Kid[]) {
  const names = children
    .slice(0, 4)
    .map((child) => child.name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return "Your Haaraya reading week";
  }

  if (names.length === 1) {
    return `${names[0]}’s Haaraya reading week`;
  }

  return `${formatChildNames(children, true)} · Haaraya reading week`;
}

function parentPrompt(k: Kid) {
  const readingQuestions = [
    "What was your favourite thing you read this week?",
    "Which character did you like best? Why?",
    "Was anything in your reading funny?",
    "Tell me one new thing you learned.",
    "Which picture did you like most?",
    "What part did you enjoy most?",
    "Can you tell me about something that happened in your reading?",
    "Was there a word you had not seen before?",
    "Which character would you like to meet?",
    "What do you think might happen next?",
    "Can you tell me about one thing that surprised you?",
    "Which part was easiest to remember?",
    "Did anything in your reading remind you of something in real life?",
    "If you could draw one scene from your reading, what would you draw?",
    "What would you like to read more about?",
    "Can you tell me one thing you remember from this week's reading?",
  ];

  const finishedBookQuestions = [
    "Which book did you enjoy most this week, and why?",
    "Can you tell me what happened in one of the books you finished?",
    "Which character from this week's reading will you remember most?",
    "Was there an ending that surprised you?",
    "Would you recommend one of this week's books to a friend? Why?",
    "If you could change one part of a book you finished, what would you change?",
    "What was your favourite moment from a book you finished?",
    "Which finished book would you most like to read again?",
  ];

  const restartQuestions = [
    "Which Haaraya book would you like us to read together this week?",
    "Can we choose one Haaraya book to read together today?",
    "Which book cover looks most interesting to you?",
    "Would you like to choose a funny story or an adventure next?",
    "Which book would you like someone to read aloud with you?",
    "Can you choose one book for us to explore together this week?",
  ];

  let questions: string[];

  if (k.books.length > 0) {
    questions = finishedBookQuestions;
  } else if (k.days > 0) {
    questions = readingQuestions;
  } else {
    questions = restartQuestions;
  }

  const childSeed = [...k.name].reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );

  const index =
    (currentWeekIndex() + childSeed) %
    questions.length;

  return questions[index];
}

function kidBlock(k: Kid) {
  const quiet =
    k.books.length === 0 &&
    k.quiz_taken === 0 &&
    k.days === 0 &&
    k.stamps === 0 &&
    k.odyssey === 0;

  const readingDays =
    k.days > 0
      ? String(k.days)
      : "0";

  const totalStamps =
    Math.max(k.stamps_total || 0, 0);

  const finished =
    k.books.length > 0
      ? `
        <div
          style="
            margin-top:12px;
            padding:10px 12px;
            background:#eef7ef;
            border-radius:10px;
            font-size:13px;
            line-height:1.45;
            color:#26452d;
          "
        >
          <strong>${plural(k.books.length, "book")} finished:</strong>
          ${k.books.map(esc).join(", ")}
        </div>
      `
      : "";

  const quiz =
    k.quiz_taken > 0
      ? `
        <div
          style="
            margin-top:8px;
            font-size:13px;
            line-height:1.45;
            color:#425146;
          "
        >
          Reading checks:
          <strong>${k.quiz_passed} of ${k.quiz_taken} passed</strong>${
            k.quiz_pct != null
              ? ` · ${k.quiz_pct}% correct`
              : ""
          }
        </div>
      `
      : "";

  const odyssey =
    k.odyssey > 0
      ? `
        <div
          style="
            margin-top:8px;
            font-size:13px;
            line-height:1.45;
            color:#425146;
          "
        >
          Odyssey:
          <strong>${plural(k.odyssey, "stamp")}</strong> earned
        </div>
      `
      : "";

  const quietMessage =
    quiet
      ? `
        <div
          style="
            margin:14px 0 0;
            padding:12px 14px;
            background:#fff5df;
            border-radius:10px;
            font-size:14px;
            line-height:1.5;
            color:#5a4720;
          "
        >
          No reading was recorded this week. A few minutes together is a gentle way to start again.
        </div>
      `
      : "";

  const passport = passportPage(k);

  const cover = k.next?.cover
    ? `
      <img
        src="${esc(k.next.cover)}"
        alt="${esc(k.next.title)} book cover"
        width="105"
        style="
          display:block;
          width:105px;
          max-width:105px;
          height:auto;
          border:0;
          border-radius:10px;
          box-shadow:0 2px 8px rgba(27,60,40,.13);
        "
      >
    `
    : `
      <div
        style="
          width:105px;
          height:130px;
          border-radius:10px;
          background:#e8f2e8;
          border:1px solid #d3e1d4;
          text-align:center;
          line-height:130px;
          font-size:28px;
        "
      >
        📖
      </div>
    `;

  const about =
    k.next?.about?.trim()
      ? `
        <div
          style="
            font-size:14px;
            line-height:1.5;
            color:#465049;
            margin:6px 0 12px;
          "
        >
          ${esc(k.next.about)}
        </div>
      `
      : "";

  const next =
    k.next
      ? `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            margin-top:18px;
            background:#f6f8ec;
            border:1px solid #e2e5c8;
            border-radius:14px;
          "
        >
          <tr>
            <td
              valign="top"
              width="125"
              style="padding:16px 10px 16px 16px"
            >
              ${cover}
            </td>

            <td
              valign="top"
              style="padding:16px 16px 16px 6px"
            >
              <div
                style="
                  font-size:10px;
                  letter-spacing:.12em;
                  text-transform:uppercase;
                  color:#71815e;
                  font-weight:800;
                "
              >
                Coming up next
              </div>

              <div
                style="
                  font-size:20px;
                  line-height:1.25;
                  font-weight:800;
                  color:#143b29;
                  margin-top:5px;
                "
              >
                ${esc(k.next.title)}
              </div>

              ${about}

              <a
                href="${SITE}/Haaraya%20Home.html#library"
                style="
                  display:inline-block;
                  background:#1f7a34;
                  color:#ffffff;
                  text-decoration:none;
                  font-weight:800;
                  font-size:13px;
                  padding:10px 16px;
                  border-radius:9px;
                "
              >
                Start reading →
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

  const prompt = parentPrompt(k);

  return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="
        margin:0 0 20px;
        background:#ffffff;
        border:1px solid #e1ddd0;
        border-radius:18px;
      "
    >
      <tr>
        <td style="padding:22px;font-family:Arial,sans-serif;color:#173d2b">

          <div
            style="
              font-size:22px;
              line-height:1.2;
              font-weight:800;
              margin-bottom:16px;
            "
          >
            ${esc(k.name)}
          </div>

          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
          >
            <tr>
              <td
                valign="top"
                width="48%"
                style="padding:0 12px 0 0"
              >
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                >
                  <tr>
                    <td
                      align="center"
                      style="
                        background:#eaf5ec;
                        border-radius:14px;
                        padding:15px 8px;
                      "
                    >
                      <div
                        style="
                          font-size:30px;
                          line-height:1;
                          font-weight:900;
                          color:#1f7a34;
                        "
                      >
                        ${readingDays}
                      </div>

                      <div
                        style="
                          font-size:11px;
                          line-height:1.35;
                          color:#42614a;
                          font-weight:700;
                          margin-top:5px;
                          text-transform:uppercase;
                          letter-spacing:.04em;
                        "
                      >
                        reading ${k.days === 1 ? "day" : "days"} this week
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      align="center"
                      style="
                        padding-top:10px;
                      "
                    >
                      <div
                        style="
                          background:#fff1c7;
                          border-radius:12px;
                          padding:11px 8px;
                        "
                      >
                        <span
                          style="
                            font-size:20px;
                            font-weight:900;
                            color:#9a6d00;
                          "
                        >
                          ${totalStamps}
                        </span>
                        <span
                          style="
                            font-size:12px;
                            color:#70591e;
                            font-weight:700;
                          "
                        >
                          passport stamps
                        </span>
                      </div>
                    </td>
                  </tr>
                </table>

                ${finished}
                ${quiz}
                ${odyssey}
                ${quietMessage}
              </td>

              <td
                valign="top"
                width="52%"
                style="padding:0 0 0 12px"
              >
                ${passport}
              </td>
            </tr>
          </table>

          ${next}

          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="
              margin-top:16px;
              background:#edf7f0;
              border-left:4px solid #1f7a34;
              border-radius:12px;
            "
          >
            <tr>
              <td style="padding:15px 16px">
                <div
                  style="
                    font-size:15px;
                    font-weight:800;
                    color:#153d29;
                    margin-bottom:6px;
                  "
                >
                  💬 Try this at home
                </div>

                <div
                  style="
                    font-size:15px;
                    line-height:1.5;
                    color:#223b2b;
                  "
                >
                  Ask ${esc(k.name)}:
                  <strong>“${esc(prompt)}”</strong>
                </div>

                <div
                  style="
                    font-size:12px;
                    line-height:1.45;
                    color:#667168;
                    margin-top:7px;
                  "
                >
                  A short chat about reading helps children remember,
                  explain and enjoy what they have read.
                </div>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  `;
}

function kidTextBlock(k: Kid) {
  const lines: string[] = [];
  lines.push(k.name);

  const quiet =
    k.books.length === 0 &&
    k.quiz_taken === 0 &&
    k.days === 0 &&
    k.stamps === 0 &&
    k.odyssey === 0;

  if (quiet) {
    lines.push(
      "No reading recorded this week. A few minutes reading together can be a gentle way to begin again."
    );
  } else {
    if (k.days > 0) {
      lines.push(
        `${plural(
          k.days,
          "reading day"
        )} this week`
      );
    }

    if (k.books.length > 0) {
      lines.push(
        `${plural(
          k.books.length,
          "book"
        )} finished: ${k.books.join(", ")}`
      );
    }

    if (k.quiz_taken > 0) {
      lines.push(
        `Reading checks: ${k.quiz_passed} of ${k.quiz_taken} passed${
          k.quiz_pct != null
            ? ` (${k.quiz_pct}% correct)`
            : ""
        }`
      );
    }

    if (k.stamps > 0) {
      lines.push(
        `Reading Passport: +${k.stamps} this week, ${k.stamps_total} total`
      );
    } else if (k.stamps_total > 0) {
      lines.push(
        `Reading Passport: ${k.stamps_total} stamps collected`
      );
    }

    if (Array.isArray(k.page) && k.page.length) {
      const done = k.page.filter((x) => x === "c").length;
      lines.push(
        `Level ${k.level ?? 1} passport page: ${done} of ${k.page.length} stamps`
      );
    }

    if (k.odyssey > 0) {
      lines.push(
        `Odyssey: ${plural(
          k.odyssey,
          "stamp"
        )} earned`
      );
    }
  }

  if (k.next) {
    lines.push(
      `Coming up next: ${k.next.title}`
    );

    if (k.next.about?.trim()) {
      lines.push(
        `About this book: ${k.next.about.trim()}`
      );
    }
  }

  lines.push("");
  lines.push("Try this at home:");
  lines.push(
    `Ask ${k.name}: "${parentPrompt(k)}"`
  );

  return lines.join("\n");
}

function render(r: Row) {
  const raw =
    (r.full_name || "").trim();

  const local =
    (r.email || "")
      .split("@")[0]
      .toLowerCase();

  const first =
    raw &&
    raw.toLowerCase() !== local &&
    !raw.includes("@")
      ? raw.split(/\s+/)[0]
      : "there";

  const unsub =
    `${FN_URL}?unsubscribe=${r.email_token}`;

  const heading = readingWeekHeading(r.children);
  const subject = readingWeekSubject(r.children);

  const html = `
<!doctype html>
<html>
<body
  style="
    margin:0;
    padding:0;
    background:#f5f0e5;
  "
>
<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  style="background:#f5f0e5"
>
<tr>
<td align="center" style="padding:24px 10px">

<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  style="
    max-width:640px;
    font-family:Arial,sans-serif;
  "
>

<tr>
<td
  style="
    background:#163d2b;
    border-radius:20px 20px 0 0;
    padding:25px 26px 23px;
    color:#ffffff;
  "
>
  <div
    style="
      font-size:11px;
      letter-spacing:.16em;
      text-transform:uppercase;
      color:#f0cf67;
      font-weight:800;
      margin-bottom:7px;
    "
  >
    Haaraya · This Week
  </div>

  <div
    style="
      font-size:16px;
      line-height:1.4;
      color:#dce9df;
      margin-bottom:4px;
    "
  >
    Hi ${esc(first)},
  </div>

  <div
    style="
      font-size:27px;
      line-height:1.2;
      font-weight:900;
      color:#ffffff;
    "
  >
    ${esc(heading)}
  </div>

  <div
    style="
      font-size:13px;
      line-height:1.5;
      color:#c7dbcd;
      margin-top:9px;
    "
  >
    Reading habits, passport progress and what comes next.
  </div>
</td>
</tr>

<tr>
<td
  style="
    background:#fbfaf6;
    padding:22px 20px 24px;
    border-left:1px solid #e1ddd0;
    border-right:1px solid #e1ddd0;
  "
>
  ${r.children.map(kidBlock).join("")}

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
  >
    <tr>
      <td align="center" style="padding:2px 0 4px">
        <a
          href="${SITE}/Haaraya%20Home.html"
          style="
            display:inline-block;
            border:2px solid #1f7a34;
            color:#1f7a34;
            text-decoration:none;
            font-size:14px;
            font-weight:800;
            padding:11px 18px;
            border-radius:10px;
          "
        >
          Open the Parent Dashboard →
        </a>
      </td>
    </tr>
  </table>
</td>
</tr>

<tr>
<td
  style="
    background:#eee8d9;
    border-radius:0 0 20px 20px;
    padding:17px 22px;
    font-family:Arial,sans-serif;
    font-size:11px;
    line-height:1.6;
    color:#697068;
    text-align:center;
  "
>
  You’re receiving this weekly update because you have a Haaraya parent account.
  <br>

  <a
    href="${unsub}"
    style="color:#58665b"
  >
    Stop weekly emails
  </a>

  &nbsp;·&nbsp;

  <a
    href="${SITE}/Haaraya%20Privacy.html"
    style="color:#58665b"
  >
    Privacy
  </a>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`;

  const text =
    `Hi ${first},\n\n${heading}\n\n` +
    r.children
      .map(kidTextBlock)
      .join("\n\n") +
    `\n\nParent Dashboard:\n${SITE}/Haaraya%20Home.html` +
    `\n\nStop weekly emails:\n${unsub}`;

  return {
    html,
    text,
    unsub,
    subject,
  };
}

Deno.serve(async (req) => {
  const url =
    new URL(req.url);

  const token =
    url.searchParams.get(
      "unsubscribe"
    );

  if (token) {
    await db.rpc(
      "weekly_email_unsubscribe",
      {
        p_token: token,
      }
    );

    return new Response(
      `
        <!doctype html>

        <meta
          name="viewport"
          content="width=device-width"
        >

        <body
          style="
            font-family:Arial,sans-serif;
            padding:40px;
            color:#142a14;
          "
        >
          <h2>
            You’re unsubscribed.
          </h2>

          <p>
            You won’t get weekly progress emails anymore.
            Account emails such as password resets will still arrive.
          </p>

          <p>
            <a
              href="${SITE}/Haaraya%20Home.html"
              style="
                color:#1f7a34;
              "
            >
              Back to Haaraya
            </a>
          </p>
        </body>
      `,
      {
        headers: {
          "content-type":
            "text/html; charset=utf-8",
        },
      }
    );
  }

  if (
    req.method !== "POST" ||
    req.headers.get(
      "x-cron-secret"
    ) !== env("CRON_SECRET")
  ) {
    return new Response(
      "forbidden",
      {
        status: 403,
      }
    );
  }

  const {
    data,
    error,
  } =
    await db.rpc(
      "weekly_parent_digest"
    );

  if (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "content-type":
            "application/json",
        },
      }
    );
  }

  const mail =
    nodemailer.createTransport({
      host:
        env("SMTP_HOST"),

      port:
        Number(
          env("SMTP_PORT") ||
          465
        ),

      secure: true,

      auth: {
        user:
          env("SMTP_USER"),

        pass:
          env("SMTP_PASS"),
      },
    });

  const dry =
    url.searchParams.get(
      "dry"
    );

  const all =
    (data as Row[]).map((row) => ({
      ...row,
      children: row.children.map((child) => ({
        ...child,
        next: child.next
          ? { ...child.next }
          : null,
      })),
    }));

  // Add the real next-book cover and use About text from the digest when
  // available. The about_pages query remains as a fallback so this file is
  // backward-compatible with an older weekly_parent_digest() definition.
  const nextCodes = Array.from(
    new Set(
      all.flatMap((row) =>
        row.children
          .map((child) => child.next?.code)
          .filter((code): code is string => Boolean(code))
      )
    )
  );

  if (nextCodes.length > 0) {
    const [
      { data: bookRows, error: bookError },
      { data: aboutRows, error: aboutError },
    ] = await Promise.all([
      db
        .from("books")
        .select("book_code, cover_image_path")
        .in("book_code", nextCodes),

      db
        .from("about_pages")
        .select("book_code, about_text")
        .in("book_code", nextCodes),
    ]);

    const coverByCode = new Map<string, string | null>();
    const aboutByCode = new Map<string, string | null>();

    if (!bookError && bookRows) {
      for (const row of bookRows) {
        coverByCode.set(
          row.book_code,
          publicBookAssetUrl(row.cover_image_path)
        );
      }
    }

    if (!aboutError && aboutRows) {
      for (const row of aboutRows) {
        aboutByCode.set(
          row.book_code,
          row.about_text
        );
      }
    }

    for (const row of all) {
      for (const child of row.children) {
        if (!child.next) continue;

        child.next.cover =
          coverByCode.get(child.next.code) ?? null;

        if (!child.next.about?.trim()) {
          child.next.about =
            aboutByCode.get(child.next.code) ?? null;
        }
      }
    }
  }

  const rows =
    dry
      ? [
          all.find(
            (r) =>
              r.email.toLowerCase() ===
              dry.toLowerCase()
          ) ??
            all[0],
        ].filter(Boolean)
      : all;

  let sent = 0;
  const failed: string[] = [];

  for (const r of rows) {
    const message =
      render(r);

    try {
      await mail.sendMail({
        from:
          env("SMTP_FROM"),

        to:
          dry || r.email,

        subject:
          message.subject,

        html:
          message.html,

        text:
          message.text,

        headers: {
          "List-Unsubscribe":
            `<${message.unsub}>`,

          "List-Unsubscribe-Post":
            "List-Unsubscribe=One-Click",
        },
      });

      sent++;
    } catch (error) {
      failed.push(
        `${r.email}: ${
          (error as Error).message
        }`
      );
    }

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          250
        )
    );
  }

  return new Response(
    JSON.stringify({
      parents:
        rows.length,

      sent,

      failed,
    }),
    {
      headers: {
        "content-type":
          "application/json",
      },
    }
  );
});
