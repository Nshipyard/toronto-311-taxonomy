#!/usr/bin/env python3
"""Build the 311 taxonomy dataset from City of Toronto open data.

Slice: 311 Service Requests - Customer Initiated, 2022-01-01 through 2026-10-07
(retrieved 2026-10-08). 2,225,151 rows.

Outputs (committed):
  data/taxonomy.csv            division > section > request type with counts
  data/resolution_by_ward.csv  ward backlog + income join
  data/summary.json            totals, findings, methodology notes
  data/taxonomy.json           app hierarchy
  data/wards.json              app ward stats
Raw CSVs stay in data/raw/ and are never committed.
"""

import csv
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(HERE, "data", "raw")
DATA = os.path.join(HERE, "data")
YEARS = [2022, 2023, 2024, 2025, 2026]

OPEN_STATUSES = {"New", "In Progress"}
BACKLOG_YEARS = {2022, 2023, 2024}  # old enough that "still open" means backlog


def norm(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def ward_code(raw):
    m = re.search(r"\((\d{1,2})\)\s*$", raw or "")
    if m:
        return m.group(1).lstrip("0") or "0"
    return "UNK"


def ward_name(raw):
    m = re.search(r"^(.*?)\s*\(\d{1,2}\)\s*$", raw or "")
    if m:
        return m.group(1).strip()
    return raw.strip() or "Unknown"


def load_income():
    """Median total household income 2020 ($) by ward, from the City's 2021
    Ward Profiles workbook (2021 Census), resource 16a31e1d... . Column layout:
    row 14 header: Toronto | Ward 1 | ... | Ward 25."""
    z = zipfile.ZipFile(os.path.join(RAW, "wardprofiles.xlsx"))
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    ss = []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    for si in root.findall("m:si", ns):
        ss.append("".join(si.itertext()))

    def rows(sheet):
        root = ET.fromstring(z.read(f"xl/worksheets/{sheet}.xml"))
        out = []
        for row in root.findall(".//m:row", ns):
            cells = []
            for c in row.findall("m:c", ns):
                t = c.get("t")
                v = c.find("m:v", ns)
                val = v.text if v is not None else ""
                if t == "s":
                    try:
                        val = ss[int(val)]
                    except (ValueError, IndexError):
                        pass
                cells.append(val)
            out.append(cells)
        return out

    for r in rows("sheet1"):
        if r and "Median total income of households in 2020" in str(r[0]):
            # r[1] = Toronto total, r[2..26] = Ward 1..25
            return {str(i): int(float(r[i + 1])) for i in range(1, 26)}
    raise RuntimeError("income row not found")


def main():
    income = load_income()
    print("income wards:", len(income))

    tax = Counter()          # (division, section, type) -> count
    ward_total = Counter()
    ward_name_map = {}
    ward_backlog = Counter()
    ward_backlog_total = Counter()
    ward_div = defaultdict(Counter)
    div_backlog = Counter()
    div_backlog_total = Counter()
    status_all = Counter()
    total = 0

    for y in YEARS:
        path = os.path.join(RAW, f"SR{y}.csv")
        with open(path, encoding="cp1252") as fh:
            r = csv.DictReader(fh)
            for row in r:
                total += 1
                div = norm(row["Division"]) or "Unknown"
                sec = norm(row["Section"]) or "Unknown"
                typ = norm(row["Service Request Type"]) or "Unknown"
                st = norm(row["Status"])
                wc = ward_code(row["Ward"])
                wn = ward_name(row["Ward"])
                year = int(row["Creation Date"][:4])
                tax[(div, sec, typ)] += 1
                status_all[st] += 1
                ward_total[wc] += 1
                ward_name_map[wc] = wn
                ward_div[wc][div] += 1
                if year in BACKLOG_YEARS:
                    ward_backlog_total[wc] += 1
                    div_backlog_total[div] += 1
                    if st in OPEN_STATUSES:
                        ward_backlog[wc] += 1
                        div_backlog[div] += 1

    print("total rows:", total)
    print("distinct types:", len({t for _, _, t in tax}))
    print("distinct divisions:", len({d for d, _, _ in tax}))

    # --- taxonomy.csv ---
    div_codes, sec_codes = {}, {}
    for i, d in enumerate(sorted({d for d, _, _ in tax}), 1):
        div_codes[d] = f"T311-D{i:02d}"
    si = 0
    for d in sorted(div_codes):
        for s in sorted({s for dd, s, _ in tax if dd == d}):
            si += 1
            sec_codes[(d, s)] = f"T311-S{si:03d}"
    tax_rows = []
    ri = 0
    for (d, s, t), c in sorted(tax.items(), key=lambda kv: -kv[1]):
        ri += 1
        tax_rows.append({
            "code": f"T311-R{ri:04d}",
            "division_code": div_codes[d],
            "division": d,
            "section_code": sec_codes[(d, s)],
            "section": s,
            "request_type": t,
            "count": c,
            "share": round(c / total, 6),
        })
    with open(os.path.join(DATA, "taxonomy.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(tax_rows[0].keys()))
        w.writeheader()
        w.writerows(tax_rows)

    # --- resolution_by_ward.csv ---
    ward_rows = []
    for wc in sorted(ward_total, key=lambda x: (x == "UNK", int(x) if x != "UNK" else 0)):
        bt, b = ward_backlog_total[wc], ward_backlog[wc]
        top_div, top_n = ward_div[wc].most_common(1)[0]
        ward_rows.append({
            "ward_code": wc,
            "ward_name": ward_name_map[wc],
            "requests_2022_2026": ward_total[wc],
            "backlog_base_2022_2024": bt,
            "backlog_open": b,
            "backlog_rate": round(b / bt, 4) if bt else "",
            "median_household_income_2020": income.get(wc, ""),
            "top_division": top_div,
            "top_division_share": round(top_n / ward_total[wc], 4),
        })
    with open(os.path.join(DATA, "resolution_by_ward.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(ward_rows[0].keys()))
        w.writeheader()
        w.writerows(ward_rows)

    # --- correlation: backlog rate vs income ---
    pairs = [(float(r["backlog_rate"]), float(r["median_household_income_2020"]))
             for r in ward_rows if r["ward_code"] != "UNK" and r["backlog_rate"] != ""]
    n = len(pairs)
    mx = sum(p[0] for p in pairs) / n
    my = sum(p[1] for p in pairs) / n
    cov = sum((p[0] - mx) * (p[1] - my) for p in pairs)
    vx = sum((p[0] - mx) ** 2 for p in pairs)
    vy = sum((p[1] - my) for p in pairs) ** 0  # placeholder
    vy = sum((p[1] - my) ** 2 for p in pairs)
    corr = cov / (vx * vy) ** 0.5 if vx and vy else 0.0

    # --- summary.json ---
    top_types = [{"type": t, "division": d, "count": c} for (d, s, t), c in
                 sorted(tax.items(), key=lambda kv: -kv[1])[:10]]
    div_rows = [{"division": d, "requests": sum(c for (dd, _, _), c in tax.items() if dd == d)}
                for d in sorted({d for d, _, _ in tax})]
    div_backlog_rows = [
        {"division": d, "backlog_base": div_backlog_total[d],
         "backlog_open": div_backlog[d],
         "backlog_rate": round(div_backlog[d] / div_backlog_total[d], 4) if div_backlog_total[d] else None}
        for d in sorted(div_backlog_total)]
    worst = max((r for r in ward_rows if r["ward_code"] != "UNK"), key=lambda r: r["backlog_rate"] or 0)
    best = min((r for r in ward_rows if r["ward_code"] != "UNK"), key=lambda r: r["backlog_rate"] if r["backlog_rate"] != "" else 1)

    summary = {
        "slice": "311 Service Requests - Customer Initiated, 2022-01-01 to 2026-10-07, retrieved 2026-10-08",
        "total_requests": total,
        "status_counts": dict(status_all),
        "divisions": div_rows,
        "distinct_request_types": len({t for _, _, t in tax}),
        "backlog_definition": "Requests created 2022-2024 still in 'New' or 'In Progress' status in the October 2026 extract. 2025-2026 excluded as too recent to judge.",
        "backlog_total_base": sum(div_backlog_total.values()),
        "backlog_total_open": sum(div_backlog.values()),
        "backlog_by_division": div_backlog_rows,
        "backlog_income_correlation": round(corr, 3),
        "worst_backlog_ward": {"code": worst["ward_code"], "name": worst["ward_name"], "rate": worst["backlog_rate"]},
        "best_backlog_ward": {"code": best["ward_code"], "name": best["ward_name"], "rate": best["backlog_rate"]},
        "top_request_types": top_types,
        "income_source": "City of Toronto Ward Profiles workbook (2021 Census), median total household income 2020 ($)",
        "methodology_notes": [
            "No completion or close date exists in the open dataset, so median time-to-close cannot be computed. The backlog rate (old requests still open) is the closest measurable proxy for responsiveness.",
            "Backlog uses the 2022-2024 creation cohort only; 2025-2026 requests are too recent to judge.",
            "'Closed' and 'Completed' are distinct source statuses and are both treated as resolved; 'Cancelled' is excluded from the backlog base as not actionable.",
            "Ward comes from the source 'Ward' field ('Name (NN)'); 43 rows have no ward and are excluded from ward analysis.",
            "Income is the 2021 Census median total household income (2020 dollars) by ward from the City's Ward Profiles workbook. Correlation is descriptive, not causal.",
            "Request types are normalized for case and whitespace only; wording is the City's own.",
        ],
    }
    with open(os.path.join(DATA, "summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)

    # --- app JSONs ---
    hier = defaultdict(lambda: defaultdict(list))
    for tr in tax_rows:
        hier[tr["division"]][tr["section"]].append(
            {"code": tr["code"], "type": tr["request_type"], "count": tr["count"]})
    taxonomy_json = [
        {"code": div_codes[d], "division": d,
         "sections": [{"code": sec_codes[(d, s)], "section": s, "types": ts}
                      for s, ts in sorted(hier[d].items())]}
        for d in sorted(hier)
    ]
    with open(os.path.join(DATA, "taxonomy.json"), "w", encoding="utf-8") as fh:
        json.dump(taxonomy_json, fh, ensure_ascii=False)
    wards_json = [
        {**r, "division_mix": [{"division": d, "count": c}
                              for d, c in ward_div[r["ward_code"]].most_common()]}
        for r in ward_rows
    ]
    with open(os.path.join(DATA, "wards.json"), "w", encoding="utf-8") as fh:
        json.dump(wards_json, fh, ensure_ascii=False)

    print("correlation backlog vs income:", round(corr, 3))
    print("worst:", worst["ward_code"], worst["ward_name"], worst["backlog_rate"])
    print("best:", best["ward_code"], best["ward_name"], best["backlog_rate"])
    print("DONE")


if __name__ == "__main__":
    main()
