from pathlib import Path

files = [
    "HAARAYA_ALL_LEVELS_CONSOLIDATED_v6_1_coverfix.csv",
    "MERGE_BackCover_Tafiya_v1_0.csv",
    "MERGE_BackCover_Hafwas_v1_0.csv",
    "MERGE_BackCover_Soundables_v1_0.csv",
    "MERGE_BackCover_Poetry_v1_0.csv",
]

base = Path("import_sources")

print("Checking import_sources files...\n")

missing = []

for name in files:
    path = base / name
    if path.exists():
        print(f"FOUND   {name}")
    else:
        print(f"MISSING {name}")
        missing.append(name)

if missing:
    print("\nRESULT: FAILED")
else:
    print("\nRESULT: PASSED")
