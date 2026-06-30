from pathlib import Path
import csv
from collections import defaultdict

MAIN = Path("import_sources") / "HAARAYA_ALL_LEVELS_CONSOLIDATED_v6_1_coverfix.csv"

PREFIX_ORDER = ["S", "H", "SP", "TF", "TN", "TFT", "TP", "SF", "SN", "TD"]

def is_cover(row):
    return str(row.get("is_cover", "")).strip().lower() in {"true", "1", "yes", "y"}

def prefix(book_code):
    return book_code.strip().split("-", 1)[0]

with MAIN.open("r", encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

books = defaultdict(list)

for row in rows:
    books[row["book_code"].strip()].append(row)

print("Previewing 10 smoke-test books...\n")

for p in PREFIX_ORDER:
    codes = sorted(code for code in books if prefix(code) == p)
    code = codes[0]
    book_rows = books[code]

    first = book_rows[0]
    pages = [r for r in book_rows if not is_cover(r)]
    covers = [r for r in book_rows if is_cover(r)]

    print(f"{p:4} {code:12} | Level {first['level']} | pages={len(pages):2} | covers={len(covers)} | {first['book_title']}")

print("\nRESULT: DONE")
