from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json

def load_env(path=".env"):
    values = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values

env = load_env()

url = env.get("SUPABASE_URL", "").rstrip("/")
key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not url or not key:
    print("RESULT: FAILED - Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    raise SystemExit(1)

endpoint = f"{url}/rest/v1/books?select=id&limit=1"

req = Request(
    endpoint,
    headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    },
    method="GET",
)

print("Checking Supabase connection safely...\n")

try:
    with urlopen(req, timeout=20) as response:
        status = response.status
        body = response.read().decode("utf-8")
        data = json.loads(body)

    print(f"HTTP status: {status}")
    print(f"Rows returned: {len(data)}")
    print("\nRESULT: PASSED")

except HTTPError as e:
    print(f"HTTP status: {e.code}")
    print("RESULT: FAILED - Supabase rejected the request")
    raise SystemExit(1)

except URLError as e:
    print("RESULT: FAILED - Could not reach Supabase")
    print(e.reason)
    raise SystemExit(1)
