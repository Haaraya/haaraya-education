from pathlib import Path
import shutil

path = Path("tafiya-reader.jsx")
backup = Path("tafiya-reader.backup-before-mojibake-fix.jsx")

if not path.exists():
    raise SystemExit("FAILED: tafiya-reader.jsx not found")

if not backup.exists():
    shutil.copy2(path, backup)

text = path.read_text(encoding="utf-8")

replacements = {
    "\u00e2\u20ac\u201d": "\u2014",
    "\u00e2\u20ac\u201c": "\u2013",
    "\u00e2\u2020\u2019": "\u2192",
    "\u00c2\u00b7": "\u00b7",
    "\u00e2\u20ac\u00a2": "\u2022",
    "\u00e2\u20ac\u00a6": "\u2026",
    "\u00c2\u00a9": "\u00a9",
    "\u00e2\u20ac\u00b9": "\u2039",
    "\u00e2\u20ac\u00ba": "\u203a",
    "\u00e2\u0153\u00a6": "\u2726",
    "\u00e2\u0153\u201c": "\u2713",
    "\u00f0\u0178\u201d\u0160": "\U0001F50A",
    "\u00f0\u0178\u201d\u2019": "\U0001F512",
    "\u00e2\u20ac\u2122": "\u2019",
    "\u00e2\u20ac\u0153": "\u201c",
    "\u00e2\u20ac\u009d": "\u201d",
}

for bad, good in replacements.items():
    text = text.replace(bad, good)

path.write_text(text, encoding="utf-8")

print("Cleaned tafiya-reader.jsx")
print("Backup:", backup)
