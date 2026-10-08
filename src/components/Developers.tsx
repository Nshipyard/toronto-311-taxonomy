"use client";

import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/requests/taxonomy?q=pothole",
    desc: "Search the 952-type taxonomy by text, filtered by division",
    response: `{
  "total": 2,
  "types": [
    { "code": "T311-R0007",
      "division": "Transportation Services",
      "type": "Road Pothole / Road Damage",
      "count": 35691, … }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/requests/wards?code=10",
    desc: "One ward: backlog rate, income, division mix",
    response: `{
  "ward_code": "10",
  "ward_name": "Spadina-Fort York",
  "backlog_rate": 0.1185,
  "median_household_income_2020": 89000,
  "top_division": "Municipal Licensing & Standards", … }`,
  },
  {
    method: "GET",
    path: "/api/v1/requests/lookup?code=T311-R0007",
    desc: "One taxonomy code: division, section, count, share",
    response: `{
  "code": "T311-R0007",
  "division": "Transportation Services",
  "section": "Road Operations",
  "count": 35691, "share": 0.016 }`,
  },
];

export default function Developers() {
  const { t } = useLang();
  return (
    <section id="developers" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.developers.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-white/70">{t.developers.body}</p>

        <h3 className="mt-14 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.endpoints}</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {endpoints.map((e) => (
            <article key={e.path} className="overflow-hidden rounded-[24px] bg-white/[0.06]">
              <div className="border-b border-white/10 px-6 py-4">
                <span className="mr-3 rounded-full bg-canada px-2.5 py-1 font-mono text-[12px] font-semibold">{e.method}</span>
                <code className="font-mono text-[13px] text-white/85 break-all">{e.path}</code>
                <p className="mt-2 text-[14px] text-white/60">{e.desc}</p>
                <a
                  href={e.path}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-full border border-white/25 px-4 py-1.5 text-[13px] font-semibold text-white/85 hover:border-white/60"
                >
                  {t.developers.tryIt} →
                </a>
              </div>
              <pre className="overflow-x-auto px-6 py-4 font-mono text-[12.5px] leading-relaxed text-white/75">{e.response}</pre>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/openapi.json" className="block rounded-[24px] bg-white/[0.06] p-6 hover:bg-white/[0.09]">
            <h4 className="text-[19px] font-semibold">{t.developers.openapi}</h4>
            <code className="mt-2 block font-mono text-[13px] text-white/60">GET /api/openapi.json</code>
          </a>
        </div>

        <McpConnect
          config={{
            slug: "toronto-311",
            displayName: "Toronto 311 Taxonomy",
            exampleEn: "Look up taxonomy code T311-R0007 and tell me its division and count",
            exampleFr: "Cherche le code de taxonomie T311-R0007 et donne-moi sa division et son compte",
          }}
        />
      </div>
    </section>
  );
}
