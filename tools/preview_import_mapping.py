from pathlib import Path
import csv
import re
from collections import defaultdict

BASE = Path("import_sources")
MAIN = BASE / "HAARAYA_ALL_LEVELS_CONSOLIDATED_v6_1_coverfix.csv"

BACK_FILES = [
    BASE / "MERGE_BackCover_Tafiya_v1_0.csv",
    BASE / "MERGE_BackCover_Hafwas_v1_0.csv",
    BASE / "MERGE_BackCover_Soundables_v1_0.csv",
    BASE / "MERGE_BackCover_Poetry_v1_0.csv",
]

PREFIX_ORDER = ["S", "H", "SP", "TF", "TN", "TFT", "TP", "SF", "SN", "TD"]

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

BOOK_TYPE_BY_PREFIX = {
    "S": "Soundable",
    "H": "Hafwas",
    "SP": "Soundables+",
    "TF": "Fiction",
    "TN": "Non-Fiction",
    "TFT": "Folktale",
    "TP": "Poetry",
    "SF": "Stamina Fiction",
    "SN": "Stamina Non-Fiction",
    "TD": "Tafiya Duniya",
}

def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def is_cover(row):
    return str(row.get("is_cover", "")).strip().lower() in {"true", "1", "yes", "y"}

def prefix(book_code):
    return book_code.strip().split("-", 1)[0]

def word_count(text):
    return len(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[-’'][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)?", text or ""))

def compact(*parts):
    return " | ".join(str(p).strip() for p in parts if str(p or "").strip())

def map_skills(back):
    cols = set(back.keys())

    # Tafiya / Poetry style
    if "eb_comprehension_skill" in cols:
        return {
            "reading_strategy": back.get("eb_reading_strategy", ""),
            "comprehension_skill": back.get("eb_comprehension_skill", ""),
            "phonological_awareness": back.get("eb_phonological_awareness", ""),
            "grammar_mechanics": back.get("eb_grammar_mechanics", ""),
            "word_work": back.get("eb_word_work", ""),
            "text_structure": back.get("eb_text_structure", ""),
            "key_vocabulary": "",
        }

    # Hafwas style
    if "eb_new_hfws" in cols:
        return {
            "reading_strategy": "",
            "comprehension_skill": "",
            "phonological_awareness": "",
            "grammar_mechanics": "",
            "word_work": compact(
                "New HFWs: " + back.get("eb_new_hfws", ""),
                "Reviewed HFW: " + back.get("eb_reviewed_hfw", ""),
                "Summary: " + back.get("back_hfw_summary_words", ""),
            ),
            "text_structure": "High-frequency word reader",
            "key_vocabulary": compact("Story words: " + back.get("eb_story_words", "")),
        }

    # Soundables style
    return {
        "reading_strategy": back.get("eb_reading_strategy", ""),
        "comprehension_skill": "",
        "phonological_awareness": back.get("eb_phonological_awareness", ""),
        "grammar_mechanics": back.get("eb_grammar_mechanics", ""),
        "word_work": compact(
            "New phonic element: " + back.get("eb_new_phonic_element", ""),
            "Reviewed phonics: " + back.get("eb_reviewed_phonic_elements", ""),
            "New sight HFWs: " + back.get("eb_new_hfws_sight", ""),
            "Reviewed HFWs: " + back.get("eb_reviewed_hfws", ""),
            "Special consideration: " + back.get("eb_special_consideration", ""),
        ),
        "text_structure": "Decodable phonics reader",
        "key_vocabulary": compact("Story words: " + back.get("eb_story_words", "")),
    }

main_rows = read_csv(MAIN)

books = defaultdict(list)
for row in main_rows:
    books[row["book_code"].strip()].append(row)

back_by_code = {}
for path in BACK_FILES:
    for row in read_csv(path):
        back_by_code[row["book_code"].strip()] = row

print("Previewing final import mapping for 10 smoke books...\n")

for p in PREFIX_ORDER:
    code = sorted(c for c in books if prefix(c) == p)[0]
    rows = books[code]
    first = rows[0]
    pages = sorted([r for r in rows if not is_cover(r)], key=lambda r: int(r["page_num"]))
    total_words = sum(word_count(r.get("page_text", "")) for r in pages)

    back = back_by_code[code]
    skills = map_skills(back)

    print("=" * 72)
    print(f"{code} | {first['book_title']}")
    print(f"  strand:       {STRAND_BY_PREFIX[p]}")
    print(f"  book_type:    {BOOK_TYPE_BY_PREFIX[p]}")
    print(f"  level:        {first['level']}")
    print(f"  tafiya_name:  {back.get('tafiya_name', '')}")
    print(f"  pages:        {len(pages)}")
    print(f"  total_words:  {total_words}")
    print(f"  about_text:   {back.get('back_about_text', '')[:120]}")
    print(f"  fp_level:     {back.get('back_fp_level', '')}")
    print(f"  uk_band:      {back.get('back_uk_book_band', '')}")
    print(f"  word_work:    {skills['word_work'][:160]}")
    print(f"  key_vocab:    {skills['key_vocabulary'][:160]}")

print("\nRESULT: DONE")
