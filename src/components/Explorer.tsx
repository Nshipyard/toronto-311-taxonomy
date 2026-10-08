"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";

interface TypeRow {
  code: string;
  division: string;
  section: string;
  type: string;
  count: number;
  share: number;
}

interface WardStat {
  ward_code: string;
  ward_name: string;
  requests_2022_2026: number;
  backlog_base_2022_2024: number;
  backlog_open: number;
  backlog_rate: number | null;
  median_household_income_2020: number | null;
  top_division: string;
  top_division_share: number;
}

const num = (n: number) => n.toLocaleString("en-CA");
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function Explorer() {
  const { t } = useLang();
  const [divisions, setDivisions] = useState<string[]>([]);
  const [wards, setWards] = useState<WardStat[]>([]);
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("");
  const [results, setResults] = useState<TypeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<TypeRow | null>(null);
  const [wardCode, setWardCode] = useState("");
  const [ward, setWard] = useState<WardStat | null>(null);

  useEffect(() => {
    fetch("/api/v1/requests/taxonomy")
      .then((r) => r.json())
      .then((d) => setDivisions((d.divisions ?? []).map((x: { division: string }) => x.division)))
      .catch(() => {});
    fetch("/api/v1/requests/wards")
      .then((r) => r.json())
      .then((d) => setWards(d.wards ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!wardCode) {
      setWard(null);
      return;
    }
    fetch(`/api/v1/requests/wards?code=${encodeURIComponent(wardCode)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setWard);
  }, [wardCode]);

  const runSearch = () => {
    setLoading(true);
    setSearched(true);
    setSelected(null);
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (division) p.set("division", division);
    fetch(`/api/v1/requests/taxonomy?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.types ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  return (
    <section id="explorer" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.explorer.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.explorer.title}</h2>

        <div className="mt-10 flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder={t.explorer.search}
            className="flex-1 rounded-full border border-line bg-paper px-6 py-3.5 text-[16px] outline-none focus:border-ink"
          />
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-full border border-line bg-paper px-6 py-3.5 text-[16px] outline-none"
          >
            <option value="">{t.explorer.allDivisions}</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            onClick={runSearch}
            aria-label="Search"
            className="rounded-full bg-ink px-8 py-3.5 text-[16px] font-semibold text-white hover:opacity-90"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="mt-8">
          {!searched && !selected && <p className="text-[15px] text-ink/55">{t.explorer.empty}</p>}
          {loading && <p className="text-[15px] text-ink/55">…</p>}
          {searched && !loading && (
            <p className="text-[15px] text-ink/55">
              {num(total)} {t.explorer.results}
            </p>
          )}
          {selected ? (
            <article className="mt-4 rounded-[24px] border border-line bg-paper p-6 md:p-8">
              <button onClick={() => setSelected(null)} className="text-[14px] font-medium text-ink/55 hover:text-ink">
                ← {t.explorer.results}
              </button>
              <h3 className="display mt-3 text-[30px]">{selected.type}</h3>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  [t.explorer.detail.code, selected.code],
                  [t.explorer.detail.division, selected.division],
                  [t.explorer.detail.section, selected.section],
                  [t.explorer.detail.count, num(selected.count)],
                  [t.explorer.detail.share, pct(selected.share)],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-[16px] bg-paper-warm p-4">
                    <dt className="text-[13px] font-medium uppercase tracking-wide text-ink/55">{k}</dt>
                    <dd className="mt-1 text-[17px] font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ) : (
            searched &&
            !loading && (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-paper">
                {results.map((r) => (
                  <li key={r.code}>
                    <button
                      onClick={() => setSelected(r)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-paper-warm"
                    >
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold">{r.type}</p>
                        <p className="mt-0.5 font-mono text-[13px] text-ink/55">
                          {r.code} · {r.division}
                        </p>
                      </div>
                      <p className="display shrink-0 text-[22px] text-canada">{num(r.count)}</p>
                    </button>
                  </li>
                ))}
                {results.length === 0 && <li className="px-6 py-8 text-[15px] text-ink/55">{t.explorer.noResult}</li>}
              </ul>
            )
          )}
        </div>

        <div className="mt-16">
          <h3 className="display text-[30px] md:text-[36px]">{t.explorer.wardTitle}</h3>
          <p className="mt-3 max-w-[640px] text-[16px] text-ink/65">{t.explorer.wardPick}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {wards
              .filter((w) => w.ward_code !== "UNK")
              .map((w) => (
                <button
                  key={w.ward_code}
                  onClick={() => setWardCode(w.ward_code)}
                  className={`rounded-full border px-4 py-2 text-[14px] font-medium ${
                    wardCode === w.ward_code
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-paper text-ink/70 hover:border-ink"
                  }`}
                >
                  {w.ward_code} · {w.ward_name}
                </button>
              ))}
          </div>
          {ward && (
            <div className="mt-6 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {[
                [t.explorer.wardStats.requests, num(ward.requests_2022_2026)],
                [t.explorer.wardStats.backlogRate, ward.backlog_rate !== null ? pct(ward.backlog_rate) : "–"],
                [
                  t.explorer.wardStats.income,
                  ward.median_household_income_2020 !== null
                    ? `$${num(ward.median_household_income_2020)}`
                    : "–",
                ],
                [t.explorer.wardStats.topDivision, `${ward.top_division} (${pct(ward.top_division_share)})`],
              ].map(([k, v]) => (
                <div key={k as string} className="bg-paper p-6">
                  <p className="display text-[30px] text-canada">{v}</p>
                  <p className="mt-2 text-[14px] leading-snug text-ink/65">{k}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
