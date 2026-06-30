from pathlib import Path
import csv

base = Path("import_sources")

files = [
    "MERGE_BackCover_Tafiya_v1_0.csv",
    "MERGE_BackCover_Hafwas_v1_0.csv",
    "MERGE_BackCover_Soundables_v1_0.csv",
    "MERGE_BackCover_Poetry_v1_0.csv",
]

for name in files:
    path = base / name
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        print(f"\n{name}")
        for h in reader.fieldnames:
            print(f"  {h}")
