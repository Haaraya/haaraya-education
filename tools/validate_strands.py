from pathlib import Path
import csv
from collections import Counter

main_file = Path("import_sources") / "HAARAYA_ALL_LEVELS_CONSOLIDATED_v6_1_coverfix.csv"

STRAND_BY_PREFIX = {
    "S": "Soundables",
    "H": "Hafwas",
    "SP": "Soundables+",
    "TF": "Tafiya Fiction",
    "TN": "Tafiya Non-Fiction",
    "TFT": "Tafiya Folktale",
    "TP": "Tafiya Poetry",
    "SF": "Stamina Fiction",
    "SN": "Stamina Non-Fiction",
    "TD": "Tafiya Duniya",
}

def prefix(book_code):
    return book_code.strip().split("-", 1)[0]

with main_file.open("r", encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

book_codes = sorted({r["book_code"].strip() for r in rows if r.get("book_code")})

unknown = []
counts = Counter()

for code in book_codes:
    p = prefix(code)
    if p not in STRAND_BY_PREFIX:
        unknown.append(code)
    else:
        counts[p] += 1

print("Checking strand normalization...\n")
print(f"Unique books: {len(book_codes)}")
print()

for p, strand in STRAND_BY_PREFIX.items():
    print(f"{p:4} {strand:22} {counts[p]}")

print()
print(f"Unknown prefixes: {len(unknown)}")

if unknown:
    for code in unknown:
        print(f"  {code}")
    print("\nRESULT: FAILED")
else:
    print("\nRESULT: PASSED")
