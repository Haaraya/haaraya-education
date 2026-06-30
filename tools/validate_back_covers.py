from pathlib import Path
import csv
from collections import Counter

base = Path("import_sources")

main_file = base / "HAARAYA_ALL_LEVELS_CONSOLIDATED_v6_1_coverfix.csv"

back_cover_files = [
    base / "MERGE_BackCover_Tafiya_v1_0.csv",
    base / "MERGE_BackCover_Hafwas_v1_0.csv",
    base / "MERGE_BackCover_Soundables_v1_0.csv",
    base / "MERGE_BackCover_Poetry_v1_0.csv",
]

def read_rows(path):
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

main_rows = read_rows(main_file)
main_codes = sorted({r["book_code"].strip() for r in main_rows if r.get("book_code")})

back_codes = []
file_counts = {}

for path in back_cover_files:
    rows = read_rows(path)
    codes = [r["book_code"].strip() for r in rows if r.get("book_code")]
    file_counts[path.name] = len(codes)
    back_codes.extend(codes)

back_counter = Counter(back_codes)

missing = sorted(set(main_codes) - set(back_codes))
extra = sorted(set(back_codes) - set(main_codes))
duplicates = sorted([code for code, count in back_counter.items() if count > 1])

print("Checking back-cover metadata coverage...\n")

print(f"Main unique books:       {len(main_codes)}")
print(f"Back-cover records:      {len(back_codes)}")
print()

for name, count in file_counts.items():
    print(f"{name}: {count}")

print()
print(f"Missing back covers:     {len(missing)}")
print(f"Extra back covers:       {len(extra)}")
print(f"Duplicate back covers:   {len(duplicates)}")

if missing:
    print("\nMissing:")
    for code in missing[:50]:
        print(f"  {code}")

if extra:
    print("\nExtra:")
    for code in extra[:50]:
        print(f"  {code}")

if duplicates:
    print("\nDuplicates:")
    for code in duplicates[:50]:
        print(f"  {code}")

if missing or extra or duplicates:
    print("\nRESULT: FAILED OR NEEDS REVIEW")
else:
    print("\nRESULT: PASSED")
