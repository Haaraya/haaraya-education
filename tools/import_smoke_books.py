from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from datetime import datetime, timezone
import csv
import json
import re
from collections import defaultdict

BASE = Path("import_sources")
MAIN_CSV = BASE / "HAARAYA_ALL_LEVELS_CONSOLIDATED_v6_1_coverfix.csv"

BACK_COVER_FILES = [
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


def load_env(path=".env"):
    values = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def is_cover(row):
    return str(row.get("is_cover", "")).strip().lower() in {"true", "1", "yes", "y"}


def prefix(book_code):
    return book_code.strip().split("-", 1)[0]


def clean(value):
    value = "" if value is None else str(value).strip()
    return value if value else None


def word_count(text):
    return len(
        re.findall(
            r"[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[-’'][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)?",
            text or "",
        )
    )


def text_band(count):
    if count <= 10:
        return "short"
    if count <= 30:
        return "medium"
    return "long"


def compact(*parts):
    return " | ".join(str(p).strip() for p in parts if str(p or "").strip())


def map_skills(back):
    cols = set(back.keys())

    if "eb_comprehension_skill" in cols:
        return {
            "reading_strategy": clean(back.get("eb_reading_strategy")),
            "comprehension_skill": clean(back.get("eb_comprehension_skill")),
            "phonological_awareness": clean(back.get("eb_phonological_awareness")),
            "grammar_mechanics": clean(back.get("eb_grammar_mechanics")),
            "word_work": clean(back.get("eb_word_work")),
            "text_structure": clean(back.get("eb_text_structure")),
            "topic": None,
            "key_vocabulary": None,
        }

    if "eb_new_hfws" in cols:
        return {
            "reading_strategy": None,
            "comprehension_skill": None,
            "phonological_awareness": None,
            "grammar_mechanics": None,
            "word_work": clean(
                compact(
                    "New HFWs: " + (back.get("eb_new_hfws") or ""),
                    "Reviewed HFW: " + (back.get("eb_reviewed_hfw") or ""),
                    "Summary: " + (back.get("back_hfw_summary_words") or ""),
                )
            ),
            "text_structure": "High-frequency word reader",
            "topic": None,
            "key_vocabulary": clean("Story words: " + (back.get("eb_story_words") or "")),
        }

    return {
        "reading_strategy": clean(back.get("eb_reading_strategy")),
        "comprehension_skill": None,
        "phonological_awareness": clean(back.get("eb_phonological_awareness")),
        "grammar_mechanics": clean(back.get("eb_grammar_mechanics")),
        "word_work": clean(
            compact(
                "New phonic element: " + (back.get("eb_new_phonic_element") or ""),
                "Reviewed phonics: " + (back.get("eb_reviewed_phonic_elements") or ""),
                "New sight HFWs: " + (back.get("eb_new_hfws_sight") or ""),
                "Reviewed HFWs: " + (back.get("eb_reviewed_hfws") or ""),
                "Special consideration: " + (back.get("eb_special_consideration") or ""),
            )
        ),
        "text_structure": "Decodable phonics reader",
        "topic": None,
        "key_vocabulary": clean("Story words: " + (back.get("eb_story_words") or "")),
    }


class SupabaseClient:
    def __init__(self, url, key):
        self.url = url.rstrip("/")
        self.key = key

    def request(self, method, path, body=None, prefer=None):
        endpoint = f"{self.url}/rest/v1/{path.lstrip('/')}"
        data = None

        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Accept": "application/json",
        }

        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"

        if prefer:
            headers["Prefer"] = prefer

        req = Request(endpoint, data=data, headers=headers, method=method)

        try:
            with urlopen(req, timeout=60) as response:
                raw = response.read().decode("utf-8")
                if not raw:
                    return None
                return json.loads(raw)

        except HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            print(f"\nSUPABASE ERROR {e.code} on {method} {path}")
            print(error_body)
            raise

        except URLError as e:
            print(f"\nCONNECTION ERROR on {method} {path}")
            print(e.reason)
            raise


def main():
    env = load_env()
    supabase_url = env.get("SUPABASE_URL")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

    sb = SupabaseClient(supabase_url, service_key)

    main_rows = read_csv(MAIN_CSV)

    books_by_code = defaultdict(list)
    for row in main_rows:
        code = row["book_code"].strip()
        books_by_code[code].append(row)

    back_by_code = {}
    for path in BACK_COVER_FILES:
        for row in read_csv(path):
            back_by_code[row["book_code"].strip()] = row

    smoke_codes = []
    for p in PREFIX_ORDER:
        matching = sorted(code for code in books_by_code if prefix(code) == p)
        if not matching:
            raise RuntimeError(f"No smoke-test book found for prefix {p}")
        smoke_codes.append(matching[0])

    now = datetime.now(timezone.utc).isoformat()

    print("Importing 10 smoke-test books into Supabase...\n")

    for code in smoke_codes:
        rows = books_by_code[code]
        first = rows[0]
        p = prefix(code)
        back = back_by_code.get(code)

        if not back:
            raise RuntimeError(f"Missing back-cover metadata for {code}")

        pages = sorted(
            [row for row in rows if not is_cover(row)],
            key=lambda row: int(row["page_num"]),
        )

        total_words = sum(word_count(row.get("page_text", "")) for row in pages)

        book_payload = {
            "book_code": code,
            "title": clean(back.get("book_title")) or clean(first.get("book_title")),
            "strand": STRAND_BY_PREFIX[p],
            "level": clean(first.get("level")),
            "tafiya_name": clean(back.get("tafiya_name")),
            "book_type": BOOK_TYPE_BY_PREFIX[p],
            "theme": None,
            "topic": None,
            "cover_image_path": None,
            "status": "text_review",
            "updated_at": now,
        }

        result = sb.request(
            "POST",
            "books?on_conflict=book_code",
            [book_payload],
            prefer="resolution=merge-duplicates,return=representation",
        )

        book_id = result[0]["id"]

        sb.request(
            "DELETE",
            f"book_pages?book_id=eq.{quote(book_id)}",
            prefer="return=minimal",
        )

        sb.request(
            "DELETE",
            f"book_skills?book_id=eq.{quote(book_id)}",
            prefer="return=minimal",
        )

        page_payloads = []
        for row in pages:
            count = word_count(row.get("page_text", ""))
            page_payloads.append(
                {
                    "book_id": book_id,
                    "page_number": int(row["page_num"]),
                    "page_text": clean(row.get("page_text")),
                    "image_path": None,
                    "layout": "image_top_text_bottom",
                    "text_band": text_band(count),
                    "word_count": count,
                    "updated_at": now,
                }
            )

        sb.request(
            "POST",
            "book_pages",
            page_payloads,
            prefer="return=minimal",
        )

        mapped = map_skills(back)

        skills_payload = {
            "book_id": book_id,
            "reading_strategy": mapped["reading_strategy"],
            "comprehension_skill": mapped["comprehension_skill"],
            "phonological_awareness": mapped["phonological_awareness"],
            "grammar_mechanics": mapped["grammar_mechanics"],
            "word_work": mapped["word_work"],
            "text_structure": mapped["text_structure"],
            "topic": mapped["topic"],
            "key_vocabulary": mapped["key_vocabulary"],
            "total_word_count": total_words,
            "about_text": clean(back.get("back_about_text")),
            "fp_level": clean(back.get("back_fp_level")),
            "uk_book_band": clean(back.get("back_uk_book_band")),
            "website": "haarayaeducation.org",
            "updated_at": now,
        }

        sb.request(
            "POST",
            "book_skills",
            [skills_payload],
            prefer="return=minimal",
        )

        print(f"IMPORTED {code:12} pages={len(pages):2} words={total_words:4} title={book_payload['title']}")

    print("\nRESULT: PASSED — 10 smoke-test books imported.")


if __name__ == "__main__":
    main()