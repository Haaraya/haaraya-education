from pathlib import Path
import csv
from collections import defaultdict

main_file = Path("import_sources") / "HAARAYA_ALL_LEVELS_CONSOLIDATED_v6_1_coverfix.csv"

def is_cover(row):
    return str(row.get("is_cover", "")).strip().lower() in {"true", "1", "yes", "y"}

with main_file.open("r", encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

books = defaultdict(list)

for row in rows:
    books[row["book_code"].strip()].append(row)

cover_rows = 0
page_rows = 0
missing_covers = []
duplicate_pages = []
broken_sequences = []
empty_text_rows = []
books_with_no_pages = []

for book_code, book_rows in books.items():
    covers = [r for r in book_rows if is_cover(r)]
    pages = [r for r in book_rows if not is_cover(r)]

    cover_rows += len(covers)
    page_rows += len(pages)

    if not covers:
        missing_covers.append(book_code)

    page_nums = []

    for row in pages:
        text = (row.get("page_text") or "").strip()
        if not text:
            empty_text_rows.append((book_code, row.get("page_num")))

        try:
            page_nums.append(int(str(row.get("page_num")).strip()))
        except ValueError:
            broken_sequences.append(book_code)

    if not page_nums:
        books_with_no_pages.append(book_code)
        continue

    if len(page_nums) != len(set(page_nums)):
        duplicate_pages.append(book_code)

    sorted_pages = sorted(page_nums)
    expected = list(range(sorted_pages[0], sorted_pages[-1] + 1))

    if sorted_pages != expected:
        broken_sequences.append(book_code)

print("Checking book/page structure...\n")

print(f"Total rows:              {len(rows)}")
print(f"Unique books:            {len(books)}")
print(f"Cover rows:              {cover_rows}")
print(f"Non-cover page rows:     {page_rows}")
print(f"Missing covers:          {len(set(missing_covers))}")
print(f"Duplicate page books:    {len(set(duplicate_pages))}")
print(f"Broken sequence books:   {len(set(broken_sequences))}")
print(f"Empty page_text rows:    {len(empty_text_rows)}")
print(f"Books with no pages:     {len(books_with_no_pages)}")

if missing_covers or duplicate_pages or broken_sequences or empty_text_rows or books_with_no_pages:
    print("\nRESULT: FAILED OR NEEDS REVIEW")
else:
    print("\nRESULT: PASSED")
