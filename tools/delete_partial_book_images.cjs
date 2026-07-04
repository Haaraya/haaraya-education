const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv(envPath = ".env") {
  const out = {};
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    out[key.trim()] = rest.join("=").trim();
  }
  return out;
}

const env = loadEnv();
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("FAILED: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const execute = process.argv.includes("--execute");
const supabase = createClient(url, key);

const bucket = "book-assets";

const partialBooks = [
  "H-04-01",
  "H-04-10",
  "H-10-19",
  "TD-06-42",
];

async function main() {
  let paths = [];

  for (const bookCode of partialBooks) {
    const folder = `books/${bookCode}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, { limit: 1000 });

    if (error) {
      console.error(`FAILED listing ${folder}:`, error.message);
      process.exit(1);
    }

    for (const item of data || []) {
      if (item.name && !item.name.startsWith(".")) {
        paths.push(`${folder}/${item.name}`);
      }
    }
  }

  console.log("\n=== PARTIAL BOOK STORAGE DELETE ===");
  console.log(`Mode: ${execute ? "EXECUTE / DELETE" : "DRY RUN ONLY"}`);
  console.log(`Files found to delete: ${paths.length}\n`);

  for (const p of paths) console.log(p);

  if (!execute) {
    console.log("\nDry run only. Nothing was deleted.");
    console.log("To delete for real, rerun with --execute");
    return;
  }

  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error } = await supabase.storage.from(bucket).remove(batch);

    if (error) {
      console.error("FAILED deleting batch:", error.message);
      process.exit(1);
    }

    console.log(`Deleted ${batch.length} files`);
  }

  console.log("\nDONE.");
}

main();