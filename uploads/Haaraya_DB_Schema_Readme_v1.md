# Haaraya Sample Database Package v1

This package converts `HAARAYA_MASTER_ALL_BOOKS_v1_0_PG4.csv` into a working sample database for the Haaraya reading platform.

## What is included

- `Haaraya_Platform_Sample_DB_v1.sqlite`  
  A working local SQLite database with all 396 master book records, all 12 levels, strands, placeholder book pages, sample children, sample progress, sample passport stamps, subscriptions, and reusable assets.

- `Haaraya_Platform_Postgres_Schema_v1.sql`  
  A PostgreSQL/Supabase-style schema for the real production direction.

- `Haaraya_Platform_Postgres_Seed_v1.sql`  
  Seed data for users, school, levels, strands, and all 396 books. This is enough for a developer to populate the app library quickly.

- `levels.csv`, `strands.csv`, `books_normalized.csv`  
  Normalized export files for review or import.

## Database type

Production recommendation: **PostgreSQL**, preferably through Supabase for the first production build.

Prototype database provided: **SQLite**, because it is easy to download, inspect, and use locally while the interface is being built.

## Why this helps the website/app build

The interface can now be connected to realistic Haaraya data before the books are rewritten or illustrated.

The app can test:

- book library screens
- filters by level and strand
- child dashboard
- passport cover and passport stamps
- progress bars
- continue reading
- completed books
- locked/unlocked books
- parent and teacher views

## Important production rule

The database does **not** store large files directly.

Book pages, covers, audio narration, logos, passport backgrounds, and stamp images should live in cloud storage/CDN. The database stores URLs such as:

```text
/assets/placeholders/covers/s-1-01.webp
/assets/placeholders/pages/s-1-01/page-01.webp
/assets/placeholders/audio/s-1-01.mp3
```

These placeholder URLs can be replaced with real asset URLs later.

## Main tables

| Table | Purpose |
|---|---|
| `users` | Parent, teacher, school admin, and Haaraya admin accounts |
| `schools` | Schools, churches, communities, and groups |
| `children` | Child reading profiles |
| `levels` | The 12 Haaraya levels |
| `strands` | Tafiya, Hafwas, Soundables, Soundables+, Poetry, Folktales, etc. |
| `books` | The full Haaraya book library from the master CSV |
| `book_pages` | Placeholder page records for page-turning and future audio sync |
| `reading_progress` | Child reading status by book |
| `passport_stamps` | Earned book/level/strand stamps |
| `assignments` | Teacher, parent, or automatic book assignments |
| `subscriptions` | Individual, family, school, sponsored, or trial access |
| `passport_themes` | Passport cover and background themes |
| `assets` | Logos, backgrounds, stamps, covers, audio, and reusable asset links |

## Demo child records

The SQLite database includes:

| Child | Level | Mode | Purpose |
|---|---|---|---|
| Kahamefule Obi | L7 | automatic | Demonstrates a child with many completed books and passport stamps |
| Amaka Obi | L3 | choose | Demonstrates a child who can choose books |
| Nasa Demo | L1 | automatic | Demonstrates a school/classroom child |

## Useful test queries

```sql
-- Full book library with level and strand names
SELECT * FROM v_book_library ORDER BY level_code, sequence_position;

-- Show Level 7 books
SELECT * FROM v_book_library WHERE level_code = 'L7' ORDER BY sequence_position;

-- Show Kahamefule Obi's dashboard
SELECT * FROM v_child_dashboard WHERE display_name = 'Kahamefule Obi';

-- Show passport stamps
SELECT * FROM v_passport_stamps WHERE display_name = 'Kahamefule Obi' ORDER BY earned_at;

-- Show Hafwas books
SELECT * FROM v_book_library WHERE strand = 'Hafwas';
```

## Counts

- Books imported: 396
- Levels: 12
- Strands: 9
- Placeholder book pages: 6401

## Next recommended step

Use this sample database to connect a prototype Haaraya interface. The first screens to build should be:

1. Book Library
2. Child Dashboard
3. Passport View
4. Continue Reading
5. Parent View
6. Teacher/Class View
