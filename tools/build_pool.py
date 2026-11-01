#!/usr/bin/env python3
"""Build data/pool-v1.json from the Project Gutenberg catalog: English-language books that volunteers placed on a curated
"notable" shelf (Classics of Literature, Best Books Ever Listings, Harvard Classics, American bestsellers 1895-1923,
Banned Books from Anne Haight's list, Nobel Prizes in Literature).

Source: pg_catalog.csv, the machine-readable catalog Gutenberg offers for download. Gutenberg states that its catalog data are
granted to the public domain, and asks that robots not crawl the website, so this script reads ONE file: pass its path, or let it
download that single file. The catalog gives the date a book was added to Gutenberg, not when it was written, so "issued" below
means "added to Project Gutenberg". A rerun on a newer catalog gives a newer snapshot.

Usage: python tools/build_pool.py [path/to/pg_catalog.csv]
"""
import csv
import datetime as dt
import io
import json
import pathlib
import re
import sys
import urllib.request

URL = "https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv"
UA = "BookRNG-fan-prototype/0.1 (https://github.com/sharkjujg/bookrng)"
NOTABLE = {"Category: Classics of Literature", "Best Books Ever Listings", "Harvard Classics", "Bestsellers, American, 1895-1923",
           "Banned Books from Anne Haight's list", "Nobel Prizes in Literature"}

if len(sys.argv) > 1:
    text = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
else:
    with urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": UA}), timeout=300) as r:
        text = r.read().decode("utf-8")
rows = list(csv.DictReader(io.StringIO(text, newline="")))
print(len(rows), "catalog rows", flush=True)


def author(raw):
    """'Austen, Jane, 1775-1817' -> ('Jane Austen', 1775, 1817, None); 'Doré, Gustave, 1832-1883 [Illustrator]' carries role 'Illustrator'.
    Dates stay None unless both years are plainly given."""
    raw = raw.strip()
    role = re.search(r"\[([^\]]*)\]", raw)
    raw = re.sub(r"\s*\[[^\]]*\]\s*", " ", raw).strip()
    m = re.search(r",?\s*(\d{3,4})\s*-\s*(\d{3,4})\s*$", raw)
    born, died = (int(m.group(1)), int(m.group(2))) if m else (None, None)
    name = raw[: m.start()] if m else raw
    name = re.sub(r"\s*\(.*?\)\s*", " ", name).strip(" ,")
    parts = [p.strip() for p in name.split(",") if p.strip()]
    return (f"{parts[1]} {parts[0]}" if len(parts) == 2 else ", ".join(parts)) or "Unknown", born, died, role.group(1) if role else None


books = []
for r in rows:
    shelves = [s.strip() for s in r["Bookshelves"].split(";") if s.strip()]
    if r["Type"] != "Text" or r["Language"] != "en" or not (NOTABLE & set(shelves)):
        continue
    title = re.sub(r"\s+", " ", r["Title"]).strip()
    people = [author(a) for a in r["Authors"].split(";") if a.strip()]
    writers = [p for p in people if not p[3]]  # editors, illustrators and translators are contributors, not authors
    issued = r["Issued"][:4]
    if not (title and writers and issued.isdigit() and r["Text#"].isdigit()):
        continue
    first = writers[0]
    books.append({"id": r["Text#"], "title": title, "authors": [p[0] for p in writers], "born": first[1], "died": first[2], "issued": int(issued),
                  "subjects": [s.strip() for s in r["Subjects"].split(";") if s.strip()][:12], "shelves": shelves,
                  "loc": (r["LoCC"].split(";")[0].strip()[:1] or None), "contributors": len(people) - len(writers)})
books.sort(key=lambda b: int(b["id"]))
seen, unique = set(), []
for b in books:  # several Gutenberg editions of one book must not multiply its chances: keep the earliest ebook per title and first author
    key = (re.sub(r"\W+", " ", b["title"].lower()).strip(), b["authors"][0].lower())
    if key not in seen:
        seen.add(key)
        unique.append(b)
print(len(books) - len(unique), "duplicate editions dropped", flush=True)
books = unique
n = len(books)
today = dt.datetime.now(dt.timezone.utc).date().isoformat()
cov = lambda f: f"known for {sum(bool(b[f]) for b in books):,} of {n:,}; unknown never satisfies a badge"
meta = {"version": "v1", "publishedAt": today, "capturedAt": today, "source": "Project Gutenberg catalog, pg_catalog.csv (public domain)",
        "provenance": f"Snapshot of the catalog taken {today} by tools/build_pool.py. Catalog facts only: no book text or covers.",
        "selection": "English-language texts on at least one curated shelf: Classics of Literature, Best Books Ever Listings, Harvard Classics, American bestsellers 1895-1923, Banned Books, Nobel Prizes in Literature.",
        "fieldStatus": {"id": "known", "title": "known", "authors": "known", "issued": "known (year the book was added to Gutenberg, not published)",
                        "born": cov("born"), "died": cov("died"), "subjects": cov("subjects"), "loc": cov("loc"), "shelves": "known"}}
lines = ",\n".join("  " + json.dumps(b, ensure_ascii=False, separators=(",", ":")) for b in books)
out = '{"meta":' + json.dumps(meta, ensure_ascii=False) + ',\n"members":[\n' + lines + "\n]}\n"
path = pathlib.Path(__file__).resolve().parent.parent / "data" / "pool-v1.json"
path.parent.mkdir(exist_ok=True)
path.write_bytes(out.encode("utf-8"))
print(f"wrote {path}: {n} books", flush=True)
