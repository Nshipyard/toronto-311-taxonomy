import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

export interface TaxType {
  code: string;
  type: string;
  count: number;
}

export interface TaxSection {
  code: string;
  section: string;
  types: TaxType[];
}

export interface TaxDivision {
  code: string;
  division: string;
  sections: TaxSection[];
}

export interface WardStat {
  ward_code: string;
  ward_name: string;
  requests_2022_2026: number;
  backlog_base_2022_2024: number;
  backlog_open: number;
  backlog_rate: number | null;
  median_household_income_2020: number | null;
  top_division: string;
  top_division_share: number;
  division_mix: { division: string; count: number }[];
}

interface Cache {
  taxonomy: TaxDivision[];
  typeIndex: Map<string, { code: string; division: string; section: string; type: string; count: number; share: number }>;
  wards: WardStat[];
  wardByCode: Map<string, WardStat>;
  summary: unknown;
}

let cache: Cache | null = null;

function parseShare(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function getData(): Cache {
  if (cache) return cache;
  const taxonomy: TaxDivision[] = JSON.parse(
    fs.readFileSync(path.join(DATA, "taxonomy.json"), "utf8")
  );
  const typeIndex = new Map<string, { code: string; division: string; section: string; type: string; count: number; share: number }>();
  const total = taxonomy.reduce(
    (a, d) => a + d.sections.reduce((x, s) => x + s.types.reduce((y, t) => y + t.count, 0), 0),
    0
  );
  for (const d of taxonomy) {
    for (const s of d.sections) {
      for (const t of s.types) {
        typeIndex.set(t.code.toUpperCase(), {
          code: t.code,
          division: d.division,
          section: s.section,
          type: t.type,
          count: t.count,
          share: total ? t.count / total : 0,
        });
      }
    }
  }
  const wards: WardStat[] = JSON.parse(fs.readFileSync(path.join(DATA, "wards.json"), "utf8"));
  const wardByCode = new Map<string, WardStat>();
  for (const w of wards) wardByCode.set(w.ward_code, w);
  const summary = JSON.parse(fs.readFileSync(path.join(DATA, "summary.json"), "utf8"));
  cache = { taxonomy, typeIndex, wards, wardByCode, summary };
  return cache;
}

export function lookupType(code: string) {
  return getData().typeIndex.get(code.trim().toUpperCase());
}

export function searchTypes(q: string, division: string, limit = 50) {
  const { typeIndex } = getData();
  const query = q.trim().toLowerCase();
  const out: { code: string; division: string; section: string; type: string; count: number; share: number }[] = [];
  let total = 0;
  for (const t of typeIndex.values()) {
    if (division && t.division !== division) continue;
    if (query && !`${t.type} ${t.code} ${t.section}`.toLowerCase().includes(query)) continue;
    total++;
    if (out.length < limit) out.push(t);
  }
  out.sort((a, b) => b.count - a.count);
  return { total, types: out };
}

export function lookupWard(code: string) {
  return getData().wardByCode.get(code.trim());
}

export { parseShare };
