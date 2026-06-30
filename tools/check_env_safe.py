from pathlib import Path

env_path = Path(".env")

required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
]

values = {}

if not env_path.exists():
    print("RESULT: FAILED - .env file not found")
    raise SystemExit(1)

for line in env_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue

    key, value = line.split("=", 1)
    values[key.strip()] = value.strip()

print("Checking .env safely...\n")

missing = []

for key in required:
    value = values.get(key, "")
    if value:
        print(f"FOUND   {key}")
    else:
        print(f"MISSING {key}")
        missing.append(key)

if missing:
    print("\nRESULT: FAILED")
else:
    print("\nRESULT: PASSED")
