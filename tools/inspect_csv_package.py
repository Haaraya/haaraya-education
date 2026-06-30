from pathlib import Path
import csv

base = Path("import_sources")

main_file = base / "HAARAYA_ALL_LEVELS_CONSOLIDATED_v6_1_coverfix.csv"

expected_main_headers = [
    "image_id",
    "file_name",
    "book_code",
    "book_title",
    "strand",
    "level",
    "programme_seq",
    "page_num",
    "is_cover",
    "page_text",
    "story_words",
    "scene_description",
    "character_lock_ids",
    "status",
]

files = [
    main_file,
    base / "MERGE_BackCover_Tafiya_v1_0.csv",
    base / "MERGE_BackCover_Hafwas_v1_0.csv",
    base / "MERGE_BackCover_Soundables_v1_0.csv",
    base / "MERGE_BackCover_Poetry_v1_0.csv",
]

print("Checking CSV headers and row counts...\n")

for path in files:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        rows = list(reader)

    print(f"{path.name}")
    print(f"  Rows: {len(rows)}")
    print(f"  Columns: {len(headers) if headers else 0}")

    if path == main_file:
        if headers == expected_main_headers:
            print("  Main schema: PASSED")
        else:
            print("  Main schema: FAILED")
            print("  Found headers:")
            print(headers)

    print()

print("RESULT: DONE")
