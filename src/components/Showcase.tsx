"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";

interface WardStat {
  ward_code: string;
  ward_name: string;
  backlog_rate: number | null;
  median_household_income_2020: number | null;
}

interface DivBacklog {
  division: string;
  backlog_rate: number | null;
  backlog_open: number;
  backlog_base: number;
}

const num = (n: number) => n.toLocaleString("en-CA");

function Bar({ label, value, max, money, highlight }: { label: string; value: number; max: number; money?: string; highlight?: boolean }) {
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-4 text-[14px]">
        <span className={`min-w-0 font-medium ${highlight ? "text-ink" : "text-ink/75"}`}>{label}</span>
        <span className="shrink-0 tabular-nums text-ink/60">
          {(value * 100).toFixed(1)}%{money ? ` · ${money}` : ""}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${highlight ? "bg-canada" : "bg-ink/70"}`}
          style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Scatter({ wards, incomeLabel, backlogLabel }: { wards: WardStat[]; incomeLabel: string; backlogLabel: string }) {
  const W = 640;
  const H = 360;
  const padL = 56;
  const padB = 44;
  const padT = 16;
  const padR = 16;
  const pts = wards.filter((w) => w.backlog_rate !== null && w.median_household_income_2020 !== null);
  if (!pts.length) return null;
  const incomes = pts.map((w) => w.median_household_income_2020 as number);
  const rates = pts.map((w) => w.backlog_rate as number);
  const x0 = Math.min(...incomes) - 3000;
  const x1 = Math.max(...incomes) + 3000;
  const y1 = Math.max(...rates) * 1.15;
  const x = (v: number) => padL + ((v - x0) / (x1 - x0)) * (W - padL - padR);
  const y = (v: number) => H - padB - (v / y1) * (H - padB - padT);
  // regression line
  const n = pts.length;
  const mx = incomes.reduce((a, b) => a + b, 0) / n;
  const my = rates.reduce((a, b) => a + b, 0) / n;
  const b = incomes.reduce((a, v, i) => a + (v - mx) * (rates[i] - my), 0) / incomes.reduce((a, v) => a + (v - mx) ** 2, 0);
  const a = my - b * mx;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={incomeLabel}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={padL} x2={W - padR} y1={y(y1 * f)} y2={y(y1 * f)} stroke="rgba(10,15,30,0.08)" />
          <text x={padL - 8} y={y(y1 * f) + 4} textAnchor="end" fontSize="11" fill="rgba(10,15,30,0.55)">
            {((y1 * f) * 100).toFixed(0)}%
          </text>
        </g>
      ))}
      {[x0, (x0 + x1) / 2, x1].map((v) => (
        <text key={v} x={x(v)} y={H - 16} textAnchor="middle" fontSize="11" fill="rgba(10,15,30,0.55)">
          ${num(Math.round(v))}
        </text>
      ))}
      <line x1={x(x0)} x2={x(x1)} y1={y(a + b * x0)} y2={y(a + b * x1)} stroke="#d80621" strokeWidth="2" strokeDasharray="6 4" />
      {pts.map((w) => (
        <g key={w.ward_code}>
          <circle cx={x(w.median_household_income_2020 as number)} cy={y(w.backlog_rate as number)} r="7" fill="#0a0f1e" opacity="0.75" />
          <text
            x={x(w.median_household_income_2020 as number)}
            y={y(w.backlog_rate as number) - 11}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(10,15,30,0.6)"
          >
            {w.ward_code}
          </text>
        </g>
      ))}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="12" fill="rgba(10,15,30,0.7)">
        {incomeLabel}
      </text>
      <text x={14} y={H / 2} textAnchor="middle" fontSize="12" fill="rgba(10,15,30,0.7)" transform={`rotate(-90 14 ${H / 2})`}>
        {backlogLabel}
      </text>
    </svg>
  );
}

export default function Showcase() {
  const { t, lang } = useLang();
  const [wards, setWards] = useState<WardStat[]>([]);
  const [divs, setDivs] = useState<DivBacklog[]>([]);

  useEffect(() => {
    fetch("/api/v1/requests/wards")
      .then((r) => r.json())
      .then((d) => setWards((d.wards ?? []).filter((w: WardStat) => w.ward_code !== "UNK")))
      .catch(() => {});
    fetch("/api/v1/requests/summary")
      .then((r) => r.json())
      .then((d) => setDivs((d.backlog_by_division ?? []).filter((x: DivBacklog) => x.backlog_rate !== null)))
      .catch(() => {});
  }, []);

  const byRate = [...wards].sort((a, b) => (b.backlog_rate ?? 0) - (a.backlog_rate ?? 0));
  const byDiv = [...divs].sort((a, b) => (b.backlog_rate ?? 0) - (a.backlog_rate ?? 0));
  const maxWard = Math.max(...byRate.map((w) => w.backlog_rate ?? 0), 0.01);
  const maxDiv = Math.max(...byDiv.map((d) => d.backlog_rate ?? 0), 0.01);
  const worst = byRate[0];
  const best = byRate[byRate.length - 1];

  const worstBestLine = (w: WardStat) => {
    const pct = ((w.backlog_rate ?? 0) * 100).toFixed(1).replace(".", lang === "fr" ? "," : ".");
    const income = w.median_household_income_2020 ? num(w.median_household_income_2020) : "–";
    return t.showcase.worstBestLine.replace("{pct}", pct).replace("{income}", income);
  };

  return (
    <section id="showcase" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.showcase.kicker}</p>
        <h2 className="display mt-4 max-w-[760px] text-[40px] md:text-[52px]">{t.showcase.title}</h2>
        <p className="mt-5 max-w-[760px] text-[18px] leading-relaxed text-ink/70">{t.showcase.body}</p>

        {(worst || best) && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {worst && (
              <div className="rounded-[24px] border border-line bg-paper-warm p-6">
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.showcase.worstLabel}</p>
                <p className="display mt-2 text-[28px]">
                  {worst.ward_code} · {worst.ward_name}
                </p>
                <p className="mt-1 text-[15px] text-ink/65">{worstBestLine(worst)}</p>
              </div>
            )}
            {best && (
              <div className="rounded-[24px] border border-line bg-paper-warm p-6">
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.showcase.bestLabel}</p>
                <p className="display mt-2 text-[28px]">
                  {best.ward_code} · {best.ward_name}
                </p>
                <p className="mt-1 text-[15px] text-ink/65">{worstBestLine(best)}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[24px] border border-line bg-paper-warm p-6 md:p-8">
            <h3 className="display text-[26px] leading-tight">{t.showcase.wardTitle}</h3>
            <p className="mt-2 text-[14px] text-ink/60">{t.showcase.wardSub}</p>
            <div className="mt-4">
              {byRate.map((w) => (
                <Bar
                  key={w.ward_code}
                  label={`${w.ward_code} · ${w.ward_name}`}
                  value={w.backlog_rate ?? 0}
                  max={maxWard}
                  money={w.median_household_income_2020 ? `$${num(w.median_household_income_2020)}` : undefined}
                  highlight={w === worst}
                />
              ))}
            </div>
          </article>
          <article className="rounded-[24px] border border-line bg-paper-warm p-6 md:p-8">
            <h3 className="display text-[26px] leading-tight">{t.showcase.divTitle}</h3>
            <p className="mt-2 text-[14px] text-ink/60">{t.showcase.divSub}</p>
            <div className="mt-4">
              {byDiv.map((d) => (
                <Bar
                  key={d.division}
                  label={`${d.division} (${num(d.backlog_open)})`}
                  value={d.backlog_rate ?? 0}
                  max={maxDiv}
                />
              ))}
            </div>
          </article>
        </div>

        <article className="mt-5 rounded-[24px] border border-line bg-paper-warm p-6 md:p-8">
          <h3 className="display text-[26px] leading-tight">{t.showcase.scatterTitle}</h3>
          <p className="mt-2 text-[14px] text-ink/60">{t.showcase.scatterSub}</p>
          <div className="mt-4">
            <Scatter wards={wards} incomeLabel={t.showcase.incomeAxis} backlogLabel={t.showcase.backlogAxis} />
          </div>
        </article>

        <article className="mt-5 rounded-[24px] bg-ink p-6 text-white md:p-8">
          <h3 className="display text-[26px] leading-tight">{t.showcase.hedgeTitle}</h3>
          <p className="mt-4 max-w-[860px] text-[16px] leading-relaxed text-white/75">{t.showcase.hedgeBody}</p>
        </article>
      </div>
    </section>
  );
}
