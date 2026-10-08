"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project. Not affiliated with the Government of Canada or the City of Toronto.",
    badge: "Open source",
  },
  nav: {
    explorer: "Explorer",
    showcase: "Showcase",
    methodology: "Methodology",
    developers: "Developers",
    data: "Data",
    back: "All projects",
  },
  hero: {
    kicker: "Nshipyard Canada · Project 05",
    title: "Every 311 request, classified.",
    sub: "Toronto's 311 line takes millions of service requests a year, logged as 952 free-text request types across 9 city divisions. This is the versioned taxonomy: division, section, request type, with counts, plus a ward-by-ward backlog analysis built from 2,225,151 requests filed between 2022 and 2026.",
    cta1: "Explore the taxonomy",
    cta2: "Read the methodology",
    statsLabels: [
      "service requests analyzed, filed 2022 through 2026",
      "distinct request types normalized into one hierarchy",
      "city divisions, from Solid Waste to Toronto Water",
      "requests from 2022-2024 still open: the measurable backlog",
    ],
  },
  explorer: {
    kicker: "Explorer",
    title: "Search 952 request types.",
    search: "Search by type, code, or section…",
    division: "Division",
    allDivisions: "All divisions",
    results: "request types",
    detail: {
      code: "Taxonomy code",
      division: "Division",
      section: "Section",
      count: "Requests 2022-2026",
      share: "Share of all requests",
    },
    wardTitle: "Ward backlog",
    wardPick: "Pick a ward to see its backlog rate, income, and request mix.",
    wardStats: {
      requests: "Requests 2022-2026",
      backlogRate: "Backlog rate (2022-2024 cohort)",
      income: "Median household income, 2020",
      topDivision: "Largest division by requests",
    },
    noResult: "No request type matches.",
    empty: "Search above, or pick a division, to browse the taxonomy. Pick a ward below for its backlog profile.",
  },
  showcase: {
    kicker: "Showcase",
    title: "Does 311 fix rich neighbourhoods faster?",
    body: "The open data has no completion dates, so nobody can compute true time-to-close from it. What can be measured is the backlog: requests filed in 2022-2024 that were still open in the October 2026 extract. Correlated against 2021 Census median household income by ward, the relationship is essentially flat: r = 0.18. What predicts backlog is the kind of work, not the neighbourhood's income. Parks tree work sits open for years; solid waste closes almost everything.",
    wardTitle: "Backlog rate by ward",
    wardSub: "Share of 2022-2024 requests still open (New or In Progress), with 2020 median household income. 25 wards.",
    divTitle: "Backlog rate by division",
    divSub: "The division matters more than the ward. Parks requests are mostly tree work.",
    scatterTitle: "Income vs backlog, by ward",
    scatterSub: "Each dot is a ward. The cloud is flat: income does not predict backlog.",
    incomeAxis: "Median household income, 2020 ($)",
    backlogAxis: "Backlog rate",
    hedgeTitle: "What this cannot say",
    hedgeBody:
      "Backlog is a proxy, not a measurement of speed. A request can sit open for legitimate reasons: seasonal tree work, multi-year capital projects, or duplicate reports. The correlation of 0.18 is descriptive, not causal, and it is weak enough to treat as no relationship. Ward income is a 2021 Census median; it says nothing about who filed each request.",
    worstLabel: "Highest backlog",
    bestLabel: "Lowest backlog",
    worstBestLine: "{pct}% backlog · ${income} median income",
  },
  methodology: {
    kicker: "Methodology",
    title: "How the taxonomy was built.",
    sliceTitle: "The slice",
    sliceBody:
      "The City of Toronto open data file '311 Service Requests - Customer Initiated', yearly extracts for 2022, 2023, 2024, 2025, and 2026, retrieved 2026-10-08. 2,225,151 rows. Request types were normalized for case and whitespace only; the wording is the City's own. Each type got a stable code: T311-D for divisions, T311-S for sections, T311-R for request types.",
    backlogTitle: "The backlog definition",
    backlogBody:
      "A request counts as backlog if it was created between 2022 and 2024 and was still in 'New' or 'In Progress' status in the October 2026 extract. 2025 and 2026 are excluded as too recent to judge. 'Completed' and 'Closed' both count as resolved; 'Cancelled' is excluded as not actionable.",
    notesTitle: "Notes and limits",
    builtLine: "Built October 2026 from City of Toronto open data.",
  },
  developers: {
    kicker: "For developers",
    title: "Query it from code, or from an agent.",
    body: "Three consumption paths, same canonical data. REST for applications, OpenAPI for integration, MCP tools over streamable HTTP for AI agents.",
    endpoints: "Endpoints",
    tryIt: "Try it",
    openapi: "OpenAPI spec",
  },
  downloads: {
    kicker: "Data",
    title: "Take the files.",
    body: "Versioned releases, MIT licensed. CSV for spreadsheets, JSON for applications.",
    files: [
      { name: "taxonomy.csv", desc: "952 request types: division, section, code, count, share" },
      { name: "resolution_by_ward.csv", desc: "25 wards: backlog rate, median income, division mix" },
      { name: "summary.json", desc: "Totals, findings, and methodology notes" },
    ],
    download: "Download",
  },
  footer: {
    line: "An open-source civic project. Not affiliated with the Government of Canada or the City of Toronto.",
    built: "Built October 2026 by Richardson Dackam.",
    sources:
      "Sources: City of Toronto Open Data (311 Service Requests - Customer Initiated, 2022-2026; Ward Profiles 25-Ward Model, 2021 Census).",
  },
  mcp: {
    kicker: "Connect your agent",
    title: "Put this data to work inside your AI tools.",
    body: "Pick your harness, copy the prompt, send it to your agent. Your agent runs the setup itself.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Other" },
    cardTitle: "Copy and send this to {tab}",
    copy: "Copy",
    copied: "Copied",
    chatgptNote: "ChatGPT connects through the documented REST API rather than MCP directly.",
    pChatgpt:
      "I want to use the {displayName} through its API.\n- OpenAPI spec: {origin}/api/openapi.json\n- REST base: {origin}/api/v1\nFirst tell me in two sentences what this API offers, then {exampleLower}, and show me the result.",
    pClaude:
      "In Claude (claude.ai), open Settings, then Connectors, and add a custom connector:\n- Name: {displayName}\n- URL: {origin}/mcp\nThen list the available tools, {exampleLower}, and show me the result.",
    pClaudeCode:
      "Set up the {displayName} MCP server so I can query it from here.\n1. Run: claude mcp add --transport http {slug} {origin}/mcp\n2. Run `claude mcp list` to confirm it connected.\n3. {example}, and show me the result.",
    pCli:
      "# MCP endpoint (streamable HTTP)\n{origin}/mcp\n\n# List the available tools\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Everything else",
    otherBody: "Any harness that speaks MCP over streamable HTTP, or plain REST.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
  },
};

export type Dict = typeof en;

const fr: Dict = {
  banner: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    badge: "Code source ouvert",
  },
  nav: {
    explorer: "Explorateur",
    showcase: "Vitrine",
    methodology: "Méthodologie",
    developers: "Développeurs",
    data: "Données",
    back: "Tous les projets",
  },
  hero: {
    kicker: "Nshipyard Canada · Projet 05",
    title: "Chaque demande au 311, classée.",
    sub: "La ligne 311 de Toronto reçoit des millions de demandes de service par année, saisies sous 952 types de demande en texte libre dans 9 divisions municipales. Voici la taxonomie versionnée : division, section, type de demande, avec les comptes, plus une analyse des demandes en souffrance par arrondissement à partir de 2 225 151 demandes déposées entre 2022 et 2026.",
    cta1: "Explorer la taxonomie",
    cta2: "Lire la méthodologie",
    statsLabels: [
      "demandes de service analysées, déposées de 2022 à 2026",
      "types de demande distincts normalisés en une hiérarchie",
      "divisions municipales, des déchets solides à Toronto Water",
      "demandes de 2022-2024 encore ouvertes : l'arriéré mesurable",
    ],
  },
  explorer: {
    kicker: "Explorateur",
    title: "Recherchez parmi 952 types de demande.",
    search: "Rechercher par type, code ou section…",
    division: "Division",
    allDivisions: "Toutes les divisions",
    results: "types de demande",
    detail: {
      code: "Code de taxonomie",
      division: "Division",
      section: "Section",
      count: "Demandes 2022-2026",
      share: "Part de toutes les demandes",
    },
    wardTitle: "Arriéré par arrondissement",
    wardPick: "Choisissez un arrondissement pour voir son taux d'arriéré, son revenu et sa répartition.",
    wardStats: {
      requests: "Demandes 2022-2026",
      backlogRate: "Taux d'arriéré (cohorte 2022-2024)",
      income: "Revenu médian des ménages, 2020",
      topDivision: "Division dominante en demandes",
    },
    noResult: "Aucun type de demande ne correspond.",
    empty: "Recherchez ci-dessus, ou choisissez une division, pour parcourir la taxonomie. Choisissez un arrondissement ci-dessous pour son profil d'arriéré.",
  },
  showcase: {
    kicker: "Vitrine",
    title: "Le 311 répare-t-il plus vite les quartiers riches ?",
    body: "Les données ouvertes ne contiennent aucune date de clôture, alors personne ne peut en calculer le vrai délai de traitement. Ce qui se mesure, c'est l'arriéré : les demandes déposées en 2022-2024 encore ouvertes dans l'extrait d'octobre 2026. Corrélé au revenu médian des ménages par arrondissement (recensement de 2021), le lien est essentiellement nul : r = 0,18. Ce qui prédit l'arriéré, c'est la nature du travail, pas le revenu du quartier. L'élagage des Parcs reste ouvert des années; les déchets solides clôturent presque tout.",
    wardTitle: "Taux d'arriéré par arrondissement",
    wardSub: "Part des demandes de 2022-2024 encore ouvertes (Nouvelles ou En cours), avec le revenu médian des ménages de 2020. 25 arrondissements.",
    divTitle: "Taux d'arriéré par division",
    divSub: "La division compte plus que l'arrondissement. Les demandes des Parcs sont surtout de l'arboriculture.",
    scatterTitle: "Revenu contre arriéré, par arrondissement",
    scatterSub: "Chaque point est un arrondissement. Le nuage est plat : le revenu ne prédit pas l'arriéré.",
    incomeAxis: "Revenu médian des ménages, 2020 ($)",
    backlogAxis: "Taux d'arriéré",
    hedgeTitle: "Ce que ceci ne peut pas dire",
    hedgeBody:
      "L'arriéré est un indicateur, pas une mesure de vitesse. Une demande peut rester ouverte pour des raisons légitimes : travaux arboricoles saisonniers, projets d'immobilisations pluriannuels ou signalements en double. La corrélation de 0,18 est descriptive, pas causale, et assez faible pour être traitée comme une absence de lien. Le revenu par arrondissement est une médiane du recensement de 2021; il ne dit rien de qui a déposé chaque demande.",
    worstLabel: "Arriéré le plus élevé",
    bestLabel: "Arriéré le plus faible",
    worstBestLine: "{pct} % d'arriéré · revenu médian {income} $",
  },
  methodology: {
    kicker: "Méthodologie",
    title: "Comment la taxonomie a été construite.",
    sliceTitle: "La tranche",
    sliceBody:
      "Le fichier de données ouvertes de la Ville de Toronto « 311 Service Requests - Customer Initiated », extraits annuels 2022, 2023, 2024, 2025 et 2026, récupéré le 2026-10-08. 2 225 151 lignes. Les types de demande ont été normalisés pour la casse et les espaces seulement; le libellé est celui de la Ville. Chaque type a reçu un code stable : T311-D pour les divisions, T311-S pour les sections, T311-R pour les types.",
    backlogTitle: "La définition de l'arriéré",
    backlogBody:
      "Une demande compte comme arriéré si elle a été créée entre 2022 et 2024 et était encore au statut « New » ou « In Progress » dans l'extrait d'octobre 2026. 2025 et 2026 sont exclus car trop récents pour juger. « Completed » et « Closed » comptent tous deux comme résolus; « Cancelled » est exclu car non exploitable.",
    notesTitle: "Notes et limites",
    builtLine: "Construit en octobre 2026 à partir des données ouvertes de la Ville de Toronto.",
  },
  developers: {
    kicker: "Pour les développeurs",
    title: "Interrogez-la depuis du code, ou depuis un agent.",
    body: "Trois façons de consommer les mêmes données canoniques. REST pour les applications, OpenAPI pour l'intégration, outils MCP en HTTP continu pour les agents IA.",
    endpoints: "Points de terminaison",
    tryIt: "Essayer",
    openapi: "Spécification OpenAPI",
  },
  downloads: {
    kicker: "Données",
    title: "Prenez les fichiers.",
    body: "Versions numérotées, licence MIT. CSV pour les tableurs, JSON pour les applications.",
    files: [
      { name: "taxonomy.csv", desc: "952 types de demande : division, section, code, compte, part" },
      { name: "resolution_by_ward.csv", desc: "25 arrondissements : taux d'arriéré, revenu médian, répartition" },
      { name: "summary.json", desc: "Totaux, constats et notes de méthodologie" },
    ],
    download: "Télécharger",
  },
  footer: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    built: "Construit en octobre 2026 par Richardson Dackam.",
    sources:
      "Sources : Données ouvertes de la Ville de Toronto (311 Service Requests - Customer Initiated, 2022-2026; Ward Profiles 25-Ward Model, recensement de 2021).",
  },
  mcp: {
    kicker: "Connectez votre agent",
    title: "Exploitez ces données dans vos outils d'IA.",
    body: "Choisissez votre plateforme, copiez l'invite, envoyez-la à votre agent. Votre agent exécute la configuration lui-même.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Autre" },
    cardTitle: "Copiez et envoyez ceci à {tab}",
    copy: "Copier",
    copied: "Copié",
    chatgptNote: "ChatGPT se connecte via l'API REST documentée plutôt que directement en MCP.",
    pChatgpt:
      "Je veux utiliser {displayName} via son API.\n- Spécification OpenAPI : {origin}/api/openapi.json\n- Base REST : {origin}/api/v1\nD'abord, dis-moi en deux phrases ce que cette API offre, puis {exampleLower}, et montre-moi le résultat.",
    pClaude:
      "Dans Claude (claude.ai), ouvre les paramètres, puis Connecteurs, et ajoute un connecteur personnalisé :\n- Nom : {displayName}\n- URL : {origin}/mcp\nEnsuite, liste les outils disponibles, {exampleLower}, et montre-moi le résultat.",
    pClaudeCode:
      "Configure le serveur MCP {displayName} pour que je puisse l'interroger d'ici.\n1. Exécute : claude mcp add --transport http {slug} {origin}/mcp\n2. Exécute `claude mcp list` pour confirmer la connexion.\n3. {example}, et montre-moi le résultat.",
    pCli:
      "# Point de terminaison MCP (HTTP continu)\n{origin}/mcp\n\n# Lister les outils disponibles\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Tout le reste",
    otherBody: "Toute plateforme qui parle MCP en HTTP continu, ou REST tout court.",
    mcpEndpoint: "Point de terminaison MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
  },
};

const dicts: Record<Lang, Dict> = { en, fr };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
