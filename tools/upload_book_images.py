from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import argparse
import mimetypes
import re
import sys


BUCKET = "book-assets"
DEST_ROOT = "books"

FILENAME_RE = re.compile(r"^(?P<book_code>[A-Z]+-[0-9]{2}-[0-9]{2,3})_(?P<part>FC|P[0-9]+)\.png$", re.I)


def load_env(path=".env"):
    values = {}
    env_path = Path(path)
    if not env_path.exists():
        raise SystemExit("FAILED: .env file not found")

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def upload_file(url, key, local_path, storage_path, execute=False):
    if not execute:
        return "DRY_RUN"

    endpoint = f"{url}/storage/v1/object/{BUCKET}/{storage_path}"
    content_type = mimetypes.guess_type(local_path.name)[0] or "application/octet-stream"

    data = local_path.read_bytes()

    req = Request(
        endpoint,
        data=data,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        method="POST",
    )

    with urlopen(req, timeout=60) as response:
        return f"UPLOADED_HTTP_{response.status}"


def main():
    parser = argparse.ArgumentParser(description="Upload Haaraya book images to Supabase Storage.")
    parser.add_argument("image_folder", help="Folder containing PNG files, flat or nested")
    parser.add_argument("--execute", action="store_true", help="Actually upload. Omit for dry run.")
    parser.add_argument("--limit", type=int, default=0, help="Optional max number of files to process")
    args = parser.parse_args()

    env = load_env()
    url = env.get("SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        raise SystemExit("FAILED: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

    image_root = Path(args.image_folder)
    if not image_root.exists():
        raise SystemExit(f"FAILED: Image folder not found: {image_root}")

    pngs = sorted(image_root.rglob("*.png"))

    valid = []
    invalid = []

    for path in pngs:
        match = FILENAME_RE.match(path.name)
        if not match:
            invalid.append(path)
            continue

        book_code = match.group("book_code").upper()
        storage_path = f"{DEST_ROOT}/{book_code}/{path.name}"
        valid.append((path, storage_path, book_code))

    if args.limit and args.limit > 0:
        valid = valid[:args.limit]

    book_count = len(set(book_code for _, _, book_code in valid))

    print("\n=== HAARAYA IMAGE UPLOAD ===")
    print(f"Image folder: {image_root}")
    print(f"Valid PNG files found: {len(valid)}")
    print(f"Books represented: {book_count}")
    print(f"Invalid PNG filenames skipped: {len(invalid)}")
    print(f"Mode: {'EXECUTE / UPLOAD' if args.execute else 'DRY RUN ONLY'}\n")

    if invalid:
        print("Invalid filenames skipped:")
        for path in invalid[:30]:
            print(f"  {path.name}")
        if len(invalid) > 30:
            print(f"  ... plus {len(invalid) - 30} more")
        print()

    print("First 20 planned uploads:")
    for local_path, storage_path, _ in valid[:20]:
        print(f"  {local_path.name} -> {BUCKET}/{storage_path}")
    print()

    uploaded = 0
    failed = 0

    for local_path, storage_path, _ in valid:
        try:
            result = upload_file(url, key, local_path, storage_path, execute=args.execute)
            uploaded += 1
            print(f"{result}: {local_path.name} -> {storage_path}")
        except (HTTPError, URLError, TimeoutError) as e:
            failed += 1
            print(f"FAILED: {local_path.name} -> {storage_path}")
            print(e, file=sys.stderr)

    print("\n=== DONE ===")
    print(f"Processed: {uploaded}")
    print(f"Failed: {failed}")
    print(f"Skipped invalid: {len(invalid)}")

    if not args.execute:
        print("\nDry run only. Nothing was uploaded.")
        print("To upload for real, rerun with --execute")


if __name__ == "__main__":
    main()