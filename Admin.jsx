import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  FileText,
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  Download,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Lock,
  Briefcase,
  Target,
  AlertCircle,
  LogOut,
  Link2,
  Copy,
  Check,
  ShieldCheck,
  Archive,
  Upload,
  ExternalLink,
  FolderOpen,
  Menu,
  History,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from "recharts";

// ---------------- DESIGN TOKENS ----------------
const COL = {
  ink: "#0E1A2B",
  inkSoft: "#2A3850",
  paper: "#F6F1E7",
  paperWarm: "#EFE7D6",
  card: "#FBF7EC",
  border: "#D9CFB9",
  borderSoft: "#E6DCC4",
  gold: "#A8843E",
  goldSoft: "#C9A961",
  sage: "#3F6B57",
  burgundy: "#8B2E3A",
  muted: "#6B6452",
};

// ---------------- SEED DATA ----------------
const SEED = {
  meta: {
    companyName: "Bolig Norge AS",
    reportPeriod: "Januar – Mars",
    reportYear: 2026,
    reportDate: "2026-03-25",
  },
  market: {
    outlook:
      "Det er høy aktivitet ved inngangen til året, med overlevering av 126 leiligheter på Steinan. De siste leilighetene overleveres neste uke. Samtidig er det byggestart på 130 nye leiligheter, hvor 70 % allerede er solgt. I tillegg er det byggestart på Linåskollen i Ski, med 50 leiligheter, hvor 26 allerede er solgt. Veidekke, som totalentreprenør, garanterer dessuten for salg opp til 60 %.\n\nPlanprosessene går ellers i tråd med planene for både Hamang og Sølfast. Det forberedes også for salg i prosjekter som Sjøkanten i Steinkjer og Sundsøya på Inderøy.\n\nVi vurderer fortløpende nye case, men det meste er foreløpig ikke regningssvarende. Vi deltar nå i én konkret prosess knyttet til kjøp av en større boligtomt i Trondheim, NRK Tyholt, som regnes som en av de mest attraktive tomtene i markedet.",
    imageUrl: "",
    imageCaption: "",
  },
  projects: [
    {
      id: "steinan",
      name: "Steinan",
      location: "Trondheim",
      units: 577,
      kvm: 32000,
      byggestart: 2023,
      byggeslutt: 2030,
      tomtekost: 225,
      merverdiTomt: 36.5,
      statusShort: "130 boliger i produksjon",
      statusCategory: "Produksjon",
      omsetning: 2470,
      db: 425,
      partner: "Fredensborg",
      partnerShare: 50,
      bank: "DNB",
      website: "https://sterinanpark.no",
      statusLong:
        "126 leiligheter er nå overlevert til kjøpere. Det gjenstår noen få som tas over påske. Etter dette vil også utdelingen skje fra selskapet, ca. 100m etter skatt i første omgang. Vi har mye EK liggende igjen knyttet til neste trinn — 130 leiligheter med 70 % salgsgrad. Det forberedes også salg av rekkehusene i prosjektet nokså snarlig.",
    },
    {
      id: "linaaskollen",
      name: "Linåskollen",
      location: "Ski / Stor-Oslo",
      units: 183,
      kvm: 16645,
      byggestart: 2025,
      byggeslutt: 2028,
      tomtekost: 141,
      merverdiTomt: 21,
      statusShort: "50 boliger i produksjon",
      statusCategory: "Produksjon",
      omsetning: 1200,
      db: 154,
      partner: "Backe",
      partnerShare: 50,
      bank: "Nordea",
      website: "https://linaaskollen.no",
      statusLong:
        "27 av 50 leiligheter er solgt, og bygging er igangsatt med Veidekke som totalentreprenør. I og med at vi ikke er på 60 % av verdi solgt, har Veidekke garantert for differansen. Det planlegges også nytt trinn med rekkehus med mål om byggestart på dette i løpet av året.",
    },
    {
      id: "sandvika",
      name: "Sandvika (Hamang)",
      location: "Bærum",
      units: 700,
      kvm: 50000,
      byggestart: 2027,
      byggeslutt: 2034,
      tomtekost: 480,
      merverdiTomt: 90,
      statusShort: "Detaljregulering i arbeid",
      statusCategory: "Regulering",
      omsetning: 3875,
      db: 576,
      partner: "Balder/BN, 50 % FB",
      partnerShare: 50,
      bank: "Nordea",
      website: "",
      statusLong:
        "Detaljreguleringen går i tråd med plan og vi begynner å se konturene av et godt produkt som både kan framstå som attraktivt og prisgunstig i markedet, samtidig som det skal være rasjonelt å bygge. Målet er at detaljreguleringen kan være ferdig i løpet av året og at vi kan begynne salg parallelt med søknad om rammetillatelse, hvor byggestart kan skje i 2027 for første trinn.",
    },
    {
      id: "sundsoya",
      name: "Sundsøya",
      location: "Inderøy",
      units: 70,
      kvm: 5000,
      byggestart: 2026,
      byggeslutt: 2028,
      tomtekost: 14,
      merverdiTomt: 9.6,
      statusShort: "Rammesøknad – prosjektering",
      statusCategory: "Prosjektering",
      omsetning: 300,
      db: 49,
      partner: "PLG Holding",
      partnerShare: 50,
      bank: "SMN",
      website: "https://nyesundsøya.no",
      statusLong:
        "Rammesøknad er sendt inn, og vi forbereder nå salg og prisgrunnlag. Europris har på oppløpet meldt interesse for etablering på eiendommen gjennom et nybygg. Vi vurderer derfor å plassere bygget nærmest veien og i stedet legge opp til syv eneboligtomter. Et enkelt Europris-bygg med 12-årskontrakt og yield on cost på rundt 9 % vil kunne gi høyere merverdi enn salg av eneboliger på denne beliggenheten.",
    },
    {
      id: "solfast",
      name: "Sølfast Park",
      location: "Drammen",
      units: 156,
      kvm: 12500,
      byggestart: 2027,
      byggeslutt: 2030,
      tomtekost: 95,
      merverdiTomt: 18,
      statusShort: "Detaljregulering i arbeid",
      statusCategory: "Regulering",
      omsetning: 741,
      db: 88,
      partner: "Balder Fastigheter Norge",
      partnerShare: null,
      bank: "",
      website: "",
      statusLong:
        "Etter forrige arbeidsmøte med kommunen ble det behov for noe bearbeiding som bl.a. stilte krav til ny støyanalyse. Dette med flere endringer er gjennomført og nytt grunnlag er sendt kommunen. Ferdig plan forventes i løpet av 2026, med realistisk byggestart i løpet av 2027.",
    },
    {
      id: "sjokanten",
      name: "Sjøkanten",
      location: "Steinkjer",
      units: 300,
      kvm: 20000,
      byggestart: 2025,
      byggeslutt: 2032,
      tomtekost: 75,
      merverdiTomt: 32,
      statusShort: "Rammesøknad – prosjektering",
      statusCategory: "Prosjektering",
      omsetning: 1200,
      db: 205,
      partner: "Ligna/PLG",
      partnerShare: 50,
      bank: "DNB",
      website: "https://sjokantensteinkjer.no",
      statusLong:
        "Det jobbes fortsatt med omsorgsboliger der kommunen er aktuelle for å inngå leieavtale på 30 boliger i 30 år. Samtidig er vi i gang med forprosjekt på et salgstrinn som ligger på delen av tomta som er ferdig forbelastet og byggeklar.",
    },
    {
      id: "kongens",
      name: "Kongens gate 44",
      location: "Steinkjer",
      units: 30,
      kvm: 2200,
      byggestart: 2027,
      byggeslutt: 2029,
      tomtekost: 14,
      merverdiTomt: 4,
      statusShort: "Under regulering",
      statusCategory: "Regulering",
      omsetning: 126,
      db: 18,
      partner: "PLG Holding",
      partnerShare: 50,
      bank: "SMN",
      website: "",
      statusLong:
        "Eiendommen overtatt og 100 % bankfinansiert. Ny detaljregulering igangsatt. Det er lite nytt i reguleringsarbeidet, vi har vært litt frem og tilbake i forhold til planstrategi.",
    },
    {
      id: "aagards",
      name: "Aagards Plass",
      location: "Sandefjord",
      units: 0,
      kvm: 0,
      byggestart: null,
      byggeslutt: null,
      tomtekost: 0,
      merverdiTomt: 0,
      statusShort: "Oppfølgingsarbeider",
      statusCategory: "Drift",
      omsetning: 0,
      db: 0,
      partner: "Balder Fastigheter Norge",
      partnerShare: null,
      bank: "",
      website: "",
      statusLong:
        "Det er noe oppfølging av reklamasjoner fra beboere, som HENT/Sentia i hovedsak håndterer. Ellers noe småtteri med leietakerne på næring med fornyelser av leieforhold og diverse avklaringer.",
    },
    {
      id: "donski",
      name: "Dønskiveien",
      location: "Oslo",
      units: 0,
      kvm: 0,
      byggestart: null,
      byggeslutt: null,
      tomtekost: 0,
      merverdiTomt: 0,
      statusShort: "Salg igangsatt",
      statusCategory: "Salg",
      omsetning: 0,
      db: 0,
      partner: "Balder Fastigheter Norge",
      partnerShare: null,
      bank: "",
      website: "",
      statusLong:
        "Salget løsnet ganske plutselig uten at vi endret strategi. Tre enheter ble solgt i rask rekkefølge, samtlige over listepris. Vi fortsetter salget i tråd med ledighet. Markedet for mindre leiligheter som dette kan svinge merkbart fra uke til uke uten noen tydelig rasjonell forklaring.",
    },
    {
      id: "origo",
      name: "Holan / Origo Industrieiendom",
      location: "Steinkjer",
      units: 0,
      kvm: 163000,
      byggestart: null,
      byggeslutt: null,
      tomtekost: 12,
      merverdiTomt: 14,
      statusShort: "Avsatt til næring i ny KPA",
      statusCategory: "Næring",
      omsetning: 0,
      db: 0,
      partner: "PLG Holding",
      partnerShare: 50,
      bank: "",
      website: "",
      statusLong:
        "Kommuneplanen ble vedtatt 17.12, og området er avsatt til næring og industri i tråd med våre innspill. Arealet utgjør totalt ca. 163 000 kvm. En lokal aktør har meldt interesse for kjøp basert på verdsettelse på 39 mill. kroner, kombinert med forpliktelse til å oppføre bygg og inngå leieavtale. Tomten er også spilt inn til ABP for vurdering av kjøp av hele eiendommen mot rabatt på 10 mill. kroner.",
    },
  ],
  pipeline: [
    {
      id: "tyholt",
      priority: 1,
      name: "NRK Tyholt",
      location: "Trondheim",
      info: "Regulert til bolig. Konsortium med NorgesGruppen, Heimdal, Fredensborg og Frøy Kapital — fem aktører deler eiendommen etter regulering for å unngå budkrig.",
      size: "30 000 BRAs / 650 boliger",
      contact: "Konsortium",
      status: "Pågående",
      comment: "Prosess starter like over påske. En av de mest attraktive tomtene i markedet.",
    },
    {
      id: "blusuvold",
      priority: 1,
      name: "Blusuvold Allé",
      location: "Trondheim",
      info: "Utvidelse av borettslag, pågått siden tidligere år.",
      size: "6 000 BRAs / 120 boliger",
      contact: "Styreleder",
      status: "Pågående",
      comment: "Styre er positive til avtale.",
    },
    {
      id: "teknobyen",
      priority: 2,
      name: "Teknobyen",
      location: "Trondheim",
      info: "Detaljregulert boligprosjekt.",
      size: "35 000 BRAs / 750 boliger",
      contact: "",
      status: "Avventende",
      comment: "",
    },
    {
      id: "teleplanbyen",
      priority: 2,
      name: "Teleplanbyen Vest",
      location: "Bærum / Stor-Oslo",
      info: "Detaljregulert boligprosjekt.",
      size: "25 000 BRAs / 550 boliger",
      contact: "",
      status: "Avventende",
      comment: "",
    },
    {
      id: "sorgenfri",
      priority: 2,
      name: "Sorgenfriveien 14",
      location: "Trondheim",
      info: "Utviklingseiendom med næringsbebyggelse, transformasjon til bolig.",
      size: "3 000 BRAs / 60 boliger",
      contact: "",
      status: "Pågående",
      comment: "",
    },
    {
      id: "haugenstua",
      priority: 1,
      name: "Haugenstua",
      location: "Oslo",
      info: "Pågående prosess om utvidelse.",
      size: "6 000 BRAs",
      contact: "Styret",
      status: "Pågående",
      comment: "Styret må avvente behandling.",
    },
    {
      id: "brosset",
      priority: 1,
      name: "Brøset",
      location: "Trondheim",
      info: "Områderegulert eiendom sentralt.",
      size: "90 000 BRAs",
      contact: "Norion",
      status: "Avventende",
      comment: "Avventer budoppstart og nivå.",
    },
    {
      id: "ladehammer",
      priority: 1,
      name: "Ladehammerveien",
      location: "Trondheim",
      info: "Eksisterende og nedlagt skole — transformasjon.",
      size: "15 000 BRAs",
      contact: "Fylkeskommunen",
      status: "Avventende",
      comment: "Avventer budoppstart og nivå.",
    },
  ],
  financials: [
    { year: 2020, result: -1.9, dividend: 0, ek: 99.3 },
    { year: 2021, result: 29.6, dividend: 0, ek: 156.6 },
    { year: 2022, result: 13.5, dividend: 0, ek: 170.1 },
    { year: 2023, result: 59.1, dividend: 40, ek: 189.2 },
    { year: 2024, result: 62.8, dividend: 50, ek: 191.6 },
    { year: 2025, result: 28.3, dividend: 75, ek: 144.8 },
    { year: 2026, result: null, dividend: 25, ek: null, projected: true },
  ],
};

const STORAGE_KEY = "bn_dashboard_v1";
const storage = {
  get: async () => {
    try {
      // Refresh sesjonen for å unngå at gammel token henger
      await supabase.auth.getSession();
      const queryPromise = supabase
        .from("dashboard_state")
        .select("data")
        .eq("id", "main")
        .maybeSingle();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout (10s)")), 10000)
      );
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result;
      if (error) {
        console.error("[dashboard] load error:", error.message);
        return null;
      }
      if (!data) return null;
      return { value: JSON.stringify(data.data) };
    } catch (e) {
      console.error("[dashboard] load failed:", e.message);
      return null;
    }
  },
  set: async (_key, value) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        return { ok: false, error: "Ikke logget inn (sesjon utløpt)" };
      }
      const { error } = await supabase
        .from("dashboard_state")
        .upsert({
          id: "main",
          data: JSON.parse(value),
          updated_by: userData.user.id,
        });
      if (error) {
        console.error("[dashboard] save error:", error.message);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (e) {
      console.error("[dashboard] save failed:", e.message);
      return { ok: false, error: e.message };
    }
  },
};
const STATUS_CATEGORIES = [
  "Produksjon",
  "Salg",
  "Regulering",
  "Prosjektering",
  "Næring",
  "Drift",
];

// ---------------- HELPERS ----------------
const fmtNOK = (n, opts = {}) => {
  if (n === null || n === undefined || n === "" || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (opts.compact && abs >= 1000) {
    return (n / 1000).toLocaleString("nb-NO", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
  }
  return Math.round(n).toLocaleString("nb-NO");
};

const fmtMrd = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (n >= 1000) {
    return (
      (n / 1000).toLocaleString("nb-NO", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }) + " mrd"
    );
  }
  return Math.round(n).toLocaleString("nb-NO") + " m";
};

const fmtPct = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("nb-NO", { maximumFractionDigits: 1 }) + " %";
};

// ============================================================
// PRINT-SAFE SVG CHARTS
// ------------------------------------------------------------
// Recharts ResponsiveContainer often renders as 0px during
// browser print (only the legend survives). These pure-SVG
// components always render at their declared viewBox size and
// scale via CSS, so they survive print. Rendered alongside
// Recharts: Recharts on screen, SVG on print.
// ============================================================
function niceStep(raw) {
  if (raw <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / exp;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * exp;
}

function PrintHBarChart({ data, series, colors, formatValue }) {
  if (!data || data.length === 0) return null;
  const fmt = formatValue || ((v) => v.toLocaleString("nb-NO"));
  const max = Math.max(
    1,
    ...data.flatMap((row) => series.map((s) => Number(row[s]) || 0))
  );
  const padX = 14;
  const labelW = 168;
  const valueW = 78;
  const chartW = 760;
  const innerW = chartW - labelW - valueW - padX * 2;
  const rowH = 44;
  const barH = 13;
  const gap = 4;
  const headerH = 18;
  const legendH = 28;
  const totalH = headerH + data.length * rowH + legendH;

  const niceMax = (() => {
    const exp = Math.pow(10, Math.floor(Math.log10(max)));
    const m = max / exp;
    const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return nice * exp;
  })();
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * niceMax);

  return (
    <svg
      viewBox={`0 0 ${chartW} ${totalH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {ticks.map((t, i) => {
        const x = padX + labelW + (t / niceMax) * innerW;
        return (
          <g key={i}>
            <text
              x={x}
              y={12}
              textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9"
              fill="#8A8270"
            >
              {fmt(t)}
            </text>
            <line
              x1={x}
              y1={headerH}
              x2={x}
              y2={headerH + data.length * rowH - 4}
              stroke="#E6DCC4"
              strokeWidth={0.6}
              strokeDasharray={i === 0 ? "none" : "1 3"}
            />
          </g>
        );
      })}
      {data.map((row, i) => {
        const y0 = headerH + i * rowH;
        const barsTotalH = series.length * barH + (series.length - 1) * gap;
        const barsY0 = y0 + (rowH - barsTotalH) / 2;
        return (
          <g key={row.name}>
            <text
              x={padX + labelW - 8}
              y={y0 + rowH / 2 + 4}
              textAnchor="end"
              fontFamily="'Manrope', sans-serif"
              fontSize="11.5"
              fill="#2A3850"
            >
              {row.name}
            </text>
            {series.map((s, sIdx) => {
              const v = Number(row[s]) || 0;
              const w = (v / niceMax) * innerW;
              const by = barsY0 + sIdx * (barH + gap);
              return (
                <rect
                  key={s}
                  x={padX + labelW}
                  y={by}
                  width={Math.max(0.5, w)}
                  height={barH}
                  fill={colors[s]}
                />
              );
            })}
            <text
              x={chartW - padX}
              y={y0 + rowH / 2 + 4}
              textAnchor="end"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10"
              fill="#6B6452"
            >
              {fmt(Number(row[series[0]]) || 0)}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${padX + labelW}, ${headerH + data.length * rowH + 14})`}>
        {series.map((s, i) => (
          <g key={s} transform={`translate(${i * 110}, 0)`}>
            <rect width={11} height={11} fill={colors[s]} />
            <text
              x={17}
              y={9.5}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9.5"
              fill="#6B6452"
              letterSpacing="0.08em"
            >
              {s.toUpperCase()}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function PrintVBarChart({ data, xKey, series, colors, formatValue }) {
  if (!data || data.length === 0) return null;
  const fmt = formatValue || ((v) => v.toLocaleString("nb-NO"));
  const values = data.flatMap((row) => series.map((s) => Number(row[s]) || 0));
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min;
  const chartW = 760;
  const chartH = 240;
  const padL = 44;
  const padR = 18;
  const padT = 14;
  const padB = 44;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const groupW = innerW / data.length;
  const barW = Math.min(22, (groupW - 8) / series.length);
  const yScale = (v) => padT + innerH - ((v - min) / range) * innerH;
  const zeroY = yScale(0);

  const ticks = [];
  const step = niceStep(range / 4);
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    ticks.push(v);
  }

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH + 32}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {ticks.map((t, i) => {
        const y = yScale(t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#E6DCC4" strokeWidth={0.6} strokeDasharray={t === 0 ? "none" : "1 3"} />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9"
              fill="#8A8270"
            >
              {fmt(t)}
            </text>
          </g>
        );
      })}
      {data.map((row, i) => {
        const gx = padL + i * groupW + groupW / 2;
        return (
          <g key={i}>
            {series.map((s, sIdx) => {
              const v = Number(row[s]) || 0;
              const y = yScale(Math.max(v, 0));
              const h = Math.abs(yScale(v) - zeroY);
              const x = gx - (series.length * barW) / 2 + sIdx * barW + 1;
              return (
                <rect
                  key={s}
                  x={x}
                  y={v >= 0 ? y : zeroY}
                  width={barW - 2}
                  height={Math.max(1, h)}
                  fill={colors[s]}
                />
              );
            })}
            <text
              x={gx}
              y={chartH - padB + 16}
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9.5"
              fill="#6B6452"
            >
              {row[xKey]}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${padL}, ${chartH + 12})`}>
        {series.map((s, i) => (
          <g key={s} transform={`translate(${i * 120}, 0)`}>
            <rect width={11} height={11} fill={colors[s]} />
            <text
              x={17}
              y={9.5}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9.5"
              fill="#6B6452"
              letterSpacing="0.08em"
            >
              {s.toUpperCase()}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function PrintLineChart({ data, xKey, series, colors, dashes, formatValue }) {
  if (!data || data.length === 0) return null;
  const fmt = formatValue || ((v) => v.toLocaleString("nb-NO"));
  const values = data.flatMap((row) => series.map((s) => Number(row[s]) || 0));
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min;
  const chartW = 760;
  const chartH = 240;
  const padL = 50;
  const padR = 18;
  const padT = 14;
  const padB = 44;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const yScale = (v) => padT + innerH - ((v - min) / range) * innerH;

  const ticks = [];
  const step = niceStep(range / 4);
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    ticks.push(v);
  }

  const buildPath = (key) => {
    const pts = data
      .map((row, i) => {
        const v = Number(row[key]);
        if (v === null || v === undefined || isNaN(v)) return null;
        return { x: padL + i * xStep, y: yScale(v) };
      })
      .filter(Boolean);
    if (pts.length === 0) return "";
    return "M" + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L");
  };

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH + 32}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {ticks.map((t, i) => {
        const y = yScale(t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#E6DCC4" strokeWidth={0.6} strokeDasharray={t === 0 ? "none" : "1 3"} />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9"
              fill="#8A8270"
            >
              {fmt(t)}
            </text>
          </g>
        );
      })}
      {data.map((row, i) => (
        <text
          key={i}
          x={padL + i * xStep}
          y={chartH - padB + 16}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9.5"
          fill="#6B6452"
        >
          {row[xKey]}
        </text>
      ))}
      {series.map((s) => (
        <path
          key={s}
          d={buildPath(s)}
          fill="none"
          stroke={colors[s]}
          strokeWidth={s === series[0] ? 2.4 : 1.8}
          strokeDasharray={(dashes && dashes[s]) || "none"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {data.map((row, i) => {
        const v = Number(row[series[0]]);
        if (v === null || v === undefined || isNaN(v)) return null;
        return (
          <circle
            key={i}
            cx={padL + i * xStep}
            cy={yScale(v)}
            r={2.5}
            fill={colors[series[0]]}
          />
        );
      })}
      <g transform={`translate(${padL}, ${chartH + 12})`}>
        {series.map((s, i) => (
          <g key={s} transform={`translate(${i * 140}, 0)`}>
            <line
              x1={0}
              y1={6}
              x2={18}
              y2={6}
              stroke={colors[s]}
              strokeWidth={2}
              strokeDasharray={(dashes && dashes[s]) || "none"}
            />
            <text
              x={24}
              y={9.5}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9.5"
              fill="#6B6452"
              letterSpacing="0.08em"
            >
              {s.toUpperCase()}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ---------------- ROOT APP ----------------
function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [editingProject, setEditingProject] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(STORAGE_KEY);
        if (r && r.value) {
          const loaded = JSON.parse(r.value);
          // Migrate: ensure new fields exist on legacy data
          const migrated = {
            ...SEED,
            ...loaded,
            pipeline: loaded.pipeline ?? SEED.pipeline,
            projects: (loaded.projects || []).map((p) => ({
              kvm: 0,
              byggestart: null,
              byggeslutt: null,
              tomtekost: 0,
              merverdiTomt: 0,
              unitsSold: 0,
              ...p,
            })),
            financials: (loaded.financials || SEED.financials || []).map((f) => ({
              gjeld: 0,
              ...f,
            })),
          };
          setData(migrated);
        } else {
          setData(SEED);
        }
      } catch {
        setData(SEED);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    if (!data || loading) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      const result = await storage.set(STORAGE_KEY, JSON.stringify(data));
      if (result?.ok) {
        setSaveStatus("saved");
        setSaveError(null);
        setTimeout(() => setSaveStatus("idle"), 1500);
      } else {
        setSaveStatus("error");
        setSaveError(result?.error || "Ukjent feil");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [data, loading]);

  if (loading || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: COL.paper, color: COL.ink }}
      >
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const totals = computeTotals(data);

  const NAV = [
    { id: "dashboard", label: "Oversikt", icon: LayoutDashboard },
    { id: "portfolio", label: "Portefølje", icon: Building2 },
    { id: "completed", label: "Tidligere", icon: History },
    { id: "pipeline", label: "Pipeline", icon: Target },
    { id: "financials", label: "Selskapstall", icon: TrendingUp },
    { id: "archive", label: "Arkiv", icon: Archive },
    { id: "report", label: "Rapport", icon: FileText },
  ];

  const updateProject = (id, patch) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };
  const addProject = () => {
    const id = "p_" + Math.random().toString(36).slice(2, 8);
    const np = {
      id,
      name: "Nytt prosjekt",
      location: "",
      units: 0,
      kvm: 0,
      byggestart: null,
      byggeslutt: null,
      tomtekost: 0,
      merverdiTomt: 0,
      statusShort: "Under vurdering",
      statusCategory: "Regulering",
      omsetning: 0,
      db: 0,
      partner: "",
      partnerShare: 100,
      bank: "",
      website: "",
      statusLong: "",
    };
    setData((d) => ({ ...d, projects: [...d.projects, np] }));
    setEditingProject(np);
  };
  const deleteProject = (id) => {
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
    setEditingProject(null);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: COL.paper,
        color: COL.ink,
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}
    >
      <FontImports />
      <div className="hidden md:flex items-center" style={{ position: "fixed", top: 0, right: 0, zIndex: 100, padding: "12px 20px", background: COL.paper, borderBottom: `1px solid ${COL.border}`, borderLeft: `1px solid ${COL.border}`, borderBottomLeftRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, gap: 16 }}>
        <span style={{ color: COL.muted }}>{profile?.full_name || profile?.email}</span>
        <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: 6, color: COL.ink, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <LogOut size={12} /> LOGG UT
        </button>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-30 print:hidden"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`w-64 flex-shrink-0 border-r flex flex-col print:hidden fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ borderColor: COL.border, background: COL.paperWarm }}
      >
        <div
          className="px-6 py-7 border-b flex items-start justify-between"
          style={{ borderColor: COL.border }}
        >
          <div>
            <div
              className="flex items-center gap-1.5 text-[11px] tracking-[0.25em] uppercase"
              style={{ color: COL.gold }}
            >
              <ShieldCheck size={12} strokeWidth={2} />
              <span style={{ fontWeight: 600 }}>Admin</span>
            </div>
            <div
              className="text-[10px] tracking-[0.2em] uppercase mt-2"
              style={{ color: COL.muted }}
            >
              Konfidensielt
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded -mt-1 -mr-2"
            aria-label="Lukk meny"
            style={{ color: COL.muted }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = page === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setPage(n.id);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all"
                style={{
                  background: active ? COL.ink : "transparent",
                  color: active ? COL.paper : COL.inkSoft,
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile-only sign-out */}
        <div className="md:hidden mx-3 mb-3">
          <div className="text-[10px] tracking-[0.18em] uppercase mb-2 px-1" style={{ color: COL.muted }}>
            {profile?.full_name || profile?.email}
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[11px]"
            style={{ background: COL.ink, color: COL.paper, fontFamily: "'JetBrains Mono', monospace" }}
          >
            <LogOut size={12} /> LOGG UT
          </button>
        </div>

        <div
          className="px-6 py-4 border-t text-[11px] flex items-center gap-2"
          style={{ borderColor: COL.border, color: COL.muted }}
        >
          <Lock size={11} />
          <span>{data.meta.companyName}</span>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0">
        {/* Mobile-only top bar with hamburger */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b print:hidden sticky top-0 z-20"
          style={{ borderColor: COL.border, background: COL.paper }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded"
            aria-label="Åpne meny"
            style={{ color: COL.ink }}
          >
            <Menu size={22} />
          </button>
          <div
            className="text-base"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            {NAV.find((n) => n.id === page)?.label}
          </div>
          <SaveIndicator status={saveStatus} error={saveError} />
        </div>

        {/* Desktop top bar */}
        <header
          className="hidden md:flex items-center justify-between px-10 py-5 border-b print:hidden"
          style={{ borderColor: COL.border }}
        >
          <div>
            <div
              className="text-[11px] tracking-[0.18em] uppercase"
              style={{ color: COL.muted }}
            >
              Månedsrapport · {data.meta.reportPeriod} {data.meta.reportYear}
            </div>
            <h1
              className="text-2xl mt-0.5"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              {NAV.find((n) => n.id === page)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator status={saveStatus} error={saveError} />
            <span
              className="text-xs"
              style={{ color: COL.muted, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {new Date(data.meta.reportDate).toLocaleDateString("nb-NO", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        <div className="px-4 py-6 md:px-10 md:py-8">
          {page === "dashboard" && (
            <DashboardPage data={data} setData={setData} totals={totals} />
          )}
          {page === "portfolio" && (
            <PortfolioPage
              data={data}
              onEdit={setEditingProject}
              onAdd={addProject}
            />
          )}
          {page === "completed" && (
            <CompletedProjectsPage />
          )}
          {page === "pipeline" && (
            <PipelinePage data={data} setData={setData} />
          )}
          {page === "financials" && (
            <FinancialsPage data={data} setData={setData} totals={totals} />
          )}
          {page === "archive" && (
            <ArkivPage data={data} canEdit={true} />
          )}
          {page === "report" && (
            <ReportPage data={data} setData={setData} totals={totals} />
          )}
        </div>
      </main>

      {/* EDIT MODAL */}
      {editingProject && (
        <ProjectEditModal
          project={editingProject}
          onSave={(patch) => {
            updateProject(editingProject.id, patch);
            setEditingProject(null);
          }}
          onDelete={() => deleteProject(editingProject.id)}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
}

// ---------------- COMPUTED ----------------
function computeTotals(data) {
  const proj = data.projects || [];
  const bnShare = (p) => {
    const ps = Number(p.partnerShare);
    return isNaN(ps) ? 1 : (100 - ps) / 100;
  };
  // Total = hele prosjektets scope (per PDF rapport-tabell)
  // Justert = BN sin andel etter eierfordeling
  const omsetning = proj.reduce(
    (s, p) => s + (Number(p.omsetning) || 0),
    0
  );
  const omsetningJustert = proj.reduce(
    (s, p) => s + (Number(p.omsetning) || 0) * bnShare(p),
    0
  );
  const db = proj.reduce((s, p) => s + (Number(p.db) || 0), 0);
  const dbJustert = proj.reduce(
    (s, p) => s + (Number(p.db) || 0) * bnShare(p),
    0
  );
  const units = proj.reduce((s, p) => s + (Number(p.units) || 0), 0);
  // Margin er den samme uavhengig av basis hvis alle prosjekter har samme eierandel,
  // men vi beregner justert/justert eksplisitt for å være tydelig
  const margin =
    omsetningJustert > 0 ? (dbJustert / omsetningJustert) * 100 : 0;
  const merverdier = proj.reduce(
    (s, p) => s + (Number(p.merverdiTomt) || 0),
    0
  );
  const fin = data.financials || [];
  const lastFin = [...fin]
    .reverse()
    .find((f) => f.ek !== null && f.ek !== undefined);
  const bokfortEK = lastFin?.ek ?? 0;
  const nav = bokfortEK + merverdier;
  return {
    omsetning,         // total prosjektscope
    omsetningJustert,  // BN-andel
    db,                // total prosjekt-DB
    dbJustert,         // BN-andel
    units,
    margin,
    merverdier,
    bokfortEK,
    nav,
  };
}

// ---------------- FONTS ----------------
function FontImports() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

      input, textarea, select { font-family: 'Manrope', sans-serif; }
      input:focus, textarea:focus, select:focus { outline: none; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${COL.border}; border-radius: 4px; }

      @media print {
        aside, header { display: none !important; }
        main { padding: 0 !important; }
      }
    `}</style>
  );
}

// ---------------- LOGO ----------------
const BN_LOGO_DATA_URI = "data:image/png;base64,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";

function BNLogo({ light = false, height = 32 }) {
  const color = light ? "#F5EFE2" : "#0E1A2B";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 304 128"
      height={height}
      width="auto"
      style={{ display: "block", color }}
      aria-label="Bolig Norge"
    >
      <g fill="currentColor">
        <path d="M139.2,82c2.5-.6,4.5-2.9,4.5-5.8,0-4.3-2.9-6.6-8.8-6.6h-7.6v25.8h8.5c6.4,0,8.7-3.7,8.7-7.2s-2-5.6-5.3-6.3ZM129.4,71.7h5.5c5.3,0,6.6,1.9,6.6,4.5s-1.8,4.9-6,4.9h-6.1v-9.4ZM135.7,93.5h-6.4v-10.4h5.7c4.9,0,7.3,1.7,7.3,5.2s-2.1,5.2-6.5,5.2Z" />
        <path d="M155.4,76.6c-4.8,0-7.6,2.9-7.6,8.2v2.7c0,5.2,2.8,8.2,7.6,8.2s7.6-3.1,7.6-8.2v-2.7c0-5.3-2.8-8.2-7.6-8.2ZM160.9,87.5c0,3.9-1.9,6.3-5.5,6.3s-5.5-2.4-5.5-6.3v-2.7c0-4.1,1.9-6.3,5.5-6.3s5.5,2.2,5.5,6.3v2.7Z" />
        <path d="M169.4,89.3v-19.6h-2.1v20.1c0,3.9,1.3,5.8,5.6,5.8v-1.9c-3.3,0-3.6-1.7-3.6-4.3Z" />
        <rect x="177.9" y="76.8" width="2.1" height="18.7" />
        <rect x="177.7" y="69.7" width="2.5" height="2.5" />
        <path d="M197.8,79.2c-1-1.8-2.8-2.7-5.7-2.7-4.6,0-7.3,2.9-7.3,8.2v2.7c0,5.1,2.4,8.3,7.3,8.3s4.6-.8,5.7-2.5v1.5c0,3.7-1.7,6.2-5.5,6.2s-3.7-.7-4.7-2.3l-1.6,1.2c1.2,2.1,3.2,3,6.2,3,4.8,0,7.6-2.9,7.6-8.1v-18h-2.1v2.4ZM197.8,87.5c0,3.7-1.3,6.3-5.5,6.3s-5.4-2.4-5.4-6.4v-2.7c0-4.1,1.8-6.3,5.4-6.3s5.5,2.4,5.5,6.1v3Z" />
        <polygon points="230.1 91.4 217.2 69.7 215.2 69.7 215.2 95.5 217.3 95.5 217.3 74 230.2 95.5 232.3 95.5 232.3 69.7 230.1 69.7 230.1 91.4" />
        <path d="M244.9,76.6c-4.8,0-7.6,2.9-7.6,8.2v2.7c0,5.2,2.8,8.2,7.6,8.2s7.6-3.1,7.6-8.2v-2.7c0-5.3-2.8-8.2-7.6-8.2ZM250.5,87.5c0,3.9-1.9,6.3-5.5,6.3s-5.5-2.4-5.5-6.3v-2.7c0-4.1,1.9-6.3,5.5-6.3s5.5,2.2,5.5,6.3v2.7Z" />
        <path d="M263.6,76.6c-2.4,0-3.9,1-4.7,2.8v-2.5h-2.1v18.7h2.1v-11.3c0-3.4,1.6-5.7,4.5-5.7s2.8.6,3.7,1.9l1.7-1.3c-1.2-1.6-2.8-2.6-5.3-2.6Z" />
        <path d="M283.2,79.2c-1-1.8-2.8-2.7-5.7-2.7-4.6,0-7.3,2.9-7.3,8.2v2.7c0,5.1,2.4,8.3,7.3,8.3s4.6-.8,5.7-2.5v1.5c0,3.7-1.7,6.2-5.5,6.2s-3.7-.7-4.7-2.3l-1.6,1.2c1.2,2.1,3.2,3,6.2,3,4.8,0,7.6-2.9,7.6-8.1v-18h-2.1v2.4ZM283.2,87.5c0,3.7-1.3,6.3-5.5,6.3s-5.4-2.4-5.4-6.4v-2.7c0-4.1,1.8-6.3,5.4-6.3s5.5,2.4,5.5,6.1v3Z" />
        <path d="M304,86.7v-1.9c0-5.3-2.5-8.2-7.2-8.2s-7.2,2.9-7.2,8.2v2.7c0,5.2,2.9,8.3,7.9,8.3s5.1-1,6.4-3l-1.6-1.2c-1,1.6-2.6,2.3-4.9,2.3-4,0-5.7-2.7-5.7-6.4v-.8h12.4ZM291.6,84.8c0-4,1.8-6.3,5.2-6.3s5.2,2.2,5.2,6.3h0s-10.3,0-10.3,0h0Z" />
        <polygon points="0 86.6 0 118.7 3.3 118.7 3.3 86.6 3.3 50.2 0 50.2 0 86.6" />
        <polygon points="12.4 79.1 12.4 111.2 15.7 111.2 15.7 79.1 15.7 42.7 12.4 42.7 12.4 79.1" />
        <polygon points="23.3 73.6 23.3 105.7 26.6 105.7 26.6 73.6 26.6 37.1 23.3 37.1 23.3 73.6" />
        <polygon points="46.6 35.5 46.6 67.6 49.9 67.6 49.9 35.5 49.9 0 46.6 0 46.6 35.5" />
        <polygon points="58.2 79.1 58.2 79.1 58.2 111.3 61.5 111.3 61.5 79.2 61.7 43.7 58.4 43.7 58.2 79.1" />
        <polygon points="69.9 57.5 69.9 89.6 73.2 89.6 73.2 57.5 73.2 22 69.9 22 69.9 57.5" />
        <polygon points="104.8 90.8 104.8 122.9 108.1 122.9 108.1 90.8 108.1 55.3 104.8 55.3 104.8 90.8" />
        <polygon points="93.2 85.1 93.2 117.3 96.5 117.3 96.5 85.1 96.5 49.6 93.2 49.6 93.2 85.1" />
        <polygon points="81.5 66.7 81.5 98.9 84.8 98.9 84.8 66.7 84.8 31.2 81.5 31.2 81.5 66.7" />
        <polygon points="35.2 60.3 35 95.7 35 95.7 35 127.9 38.3 127.9 38.3 95.8 38.5 60.3 35.2 60.3" />
      </g>
    </svg>
  );
}

// ---------------- SAVE INDICATOR ----------------
function SaveIndicator({ status, error }) {
  if (status === "idle") return null;
  if (status === "error") {
    return (
      <div
        className="flex items-center gap-1.5 text-[11px]"
        style={{ color: COL.burgundy }}
        title={error || "Klarte ikke lagre — sjekk browser-konsoll for detaljer"}
      >
        <AlertCircle size={11} />
        <span style={{ fontWeight: 600 }}>Ikke lagret</span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-1.5 text-[11px]"
      style={{ color: COL.muted }}
    >
      {status === "saving" ? (
        <>
          <Loader2 size={11} className="animate-spin" />
          <span>Lagrer…</span>
        </>
      ) : (
        <>
          <Save size={11} style={{ color: COL.sage }} />
          <span style={{ color: COL.sage }}>Lagret</span>
        </>
      )}
    </div>
  );
}

// ---------------- DASHBOARD PAGE ----------------
function DashboardPage({ data, setData, totals }) {
  const [editingMarket, setEditingMarket] = useState(false);
  const [marketDraft, setMarketDraft] = useState(data.market.outlook);
  const [imageUrlDraft, setImageUrlDraft] = useState(data.market.imageUrl || "");
  const [imageCaptionDraft, setImageCaptionDraft] = useState(
    data.market.imageCaption || ""
  );

  const chartData = data.projects
    .filter((p) => p.omsetning > 0)
    .map((p) => ({
      name: p.name,
      Omsetning: p.omsetning,
      DB: p.db,
    }))
    .sort((a, b) => b.Omsetning - a.Omsetning);

  const startEdit = () => {
    setMarketDraft(data.market.outlook);
    setImageUrlDraft(data.market.imageUrl || "");
    setImageCaptionDraft(data.market.imageCaption || "");
    setEditingMarket(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Filen må være et bilde (PNG, JPG, etc).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      const ok = confirm(
        `Filen er ${(file.size / 1024).toFixed(0)} KB. Anbefalt maks ~500 KB for rask innlasting. Legg den inn likevel?`
      );
      if (!ok) {
        e.target.value = "";
        return;
      }
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrlDraft(ev.target?.result || "");
    reader.onerror = () => alert("Klarte ikke å lese filen.");
    reader.readAsDataURL(file);
    e.target.value = ""; // reset så samme fil kan velges igjen
  };

  const [saveError, setSaveError] = useState(null);
  const [savingMarket, setSavingMarket] = useState(false);

  const saveMarket = async () => {
    setSavingMarket(true);
    setSaveError(null);
    const newData = {
      ...data,
      market: {
        ...data.market,
        outlook: marketDraft,
        imageUrl: imageUrlDraft,
        imageCaption: imageCaptionDraft,
      },
    };
    // Skriv direkte til Supabase nå (ikke vent på den debounced auto-saven)
    const result = await storage.set(STORAGE_KEY, JSON.stringify(newData));
    setSavingMarket(false);
    if (!result?.ok) {
      setSaveError(
        `Klarte ikke lagre: ${result?.error || "ukjent feil"}. Sjekk konsollen (F12) for detaljer.`
      );
      return;
    }
    setData(newData);
    setEditingMarket(false);
  };

  return (
    <div className="space-y-10">
      {/* §01 — Marked & outlook + Eiendom Norge prisstatistikk */}
      <section
        className="border p-8"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div
              className="text-[10px] tracking-[0.2em] uppercase mb-1"
              style={{ color: COL.muted }}
            >
              §01
            </div>
            <h2
              className="text-2xl"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              Marked & outlook
            </h2>
          </div>
          {!editingMarket ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border"
              style={{ borderColor: COL.border, color: COL.inkSoft }}
            >
              <Pencil size={12} />
              Rediger
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              {saveError && (
                <span className="text-[11px] mr-2" style={{ color: COL.burgundy || "#8B2E3A" }}>
                  {saveError}
                </span>
              )}
              <button
                onClick={() => {
                  setSaveError(null);
                  setEditingMarket(false);
                }}
                disabled={savingMarket}
                className="px-3 py-1.5 text-xs border"
                style={{
                  borderColor: COL.border,
                  color: COL.inkSoft,
                  opacity: savingMarket ? 0.5 : 1,
                }}
              >
                Avbryt
              </button>
              <button
                onClick={saveMarket}
                disabled={savingMarket}
                className="px-3 py-1.5 text-xs flex items-center gap-1.5"
                style={{
                  background: COL.ink,
                  color: COL.paper,
                  opacity: savingMarket ? 0.6 : 1,
                  cursor: savingMarket ? "wait" : "pointer",
                }}
              >
                {savingMarket && <Loader2 size={11} className="animate-spin" />}
                {savingMarket ? "Lagrer …" : "Lagre"}
              </button>
            </div>
          )}
        </div>

          {!editingMarket ? (
            <div className="overflow-hidden">
              {data.market.imageUrl && (
                <div className="float-right ml-8 mb-4 w-full lg:w-1/2 max-w-[600px]">
                  <MarketImageDisplay
                    imageUrl={data.market.imageUrl}
                    imageCaption={data.market.imageCaption}
                  />
                </div>
              )}
              <div
                className="text-[15px] leading-[1.7] whitespace-pre-line"
                style={{ color: COL.inkSoft }}
              >
                {data.market.outlook}
              </div>
              <div className="clear-both" />
            </div>
          ) : (
          <div className="space-y-4">
            <div>
              <label
                className="block text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: COL.muted }}
              >
                Outlook-tekst
              </label>
              <textarea
                value={marketDraft}
                onChange={(e) => setMarketDraft(e.target.value)}
                rows={12}
                className="w-full p-4 text-[15px] leading-[1.7] border resize-y"
                style={{
                  background: COL.paper,
                  borderColor: COL.border,
                  color: COL.inkSoft,
                }}
              />
            </div>
            <div>
              <label
                className="block text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: COL.muted }}
              >
                Bilde (Eiendom Norge prisstatistikk)
              </label>

              {imageUrlDraft ? (
                <div className="space-y-2">
                  <div
                    className="border p-3"
                    style={{ borderColor: COL.border, background: COL.paper }}
                  >
                    <img
                      src={imageUrlDraft}
                      alt="Forhåndsvisning"
                      className="max-h-40 w-auto"
                      style={{ display: "block" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <label
                      htmlFor="market-image-upload"
                      className="cursor-pointer px-3 py-1.5 text-xs border"
                      style={{ borderColor: COL.border, color: COL.inkSoft }}
                    >
                      Bytt bilde
                    </label>
                    <button
                      type="button"
                      onClick={() => setImageUrlDraft("")}
                      className="px-3 py-1.5 text-xs border"
                      style={{ borderColor: COL.border, color: COL.inkSoft }}
                    >
                      Fjern bilde
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="market-image-upload"
                  className="block cursor-pointer border-2 border-dashed p-6 text-center text-sm"
                  style={{
                    borderColor: COL.border,
                    color: COL.muted,
                    background: COL.paper,
                  }}
                >
                  Klikk for å velge bilde fra Mac
                  <div
                    className="text-[11px] mt-1"
                    style={{ color: COL.muted }}
                  >
                    PNG eller JPG. Anbefalt maks ~500 KB.
                  </div>
                </label>
              )}

              <input
                id="market-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <details className="mt-3 text-xs" style={{ color: COL.muted }}>
                <summary className="cursor-pointer">
                  Eller lim inn URL / data-URI manuelt
                </summary>
                <input
                  type="text"
                  value={imageUrlDraft}
                  onChange={(e) => setImageUrlDraft(e.target.value)}
                  placeholder="https://… eller data:image/png;base64,…"
                  className="w-full p-3 text-[12px] border mt-2"
                  style={{
                    background: COL.paper,
                    borderColor: COL.border,
                    color: COL.inkSoft,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              </details>
            </div>
            <div>
              <label
                className="block text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: COL.muted }}
              >
                Bildetekst (valgfritt)
              </label>
              <input
                type="text"
                value={imageCaptionDraft}
                onChange={(e) => setImageCaptionDraft(e.target.value)}
                placeholder="Kilde: Eiendom Norge, mars 2026"
                className="w-full p-3 text-[14px] border"
                style={{
                  background: COL.paper,
                  borderColor: COL.border,
                  color: COL.inkSoft,
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* §02 — Prosjekt for prosjekt */}
      <ProjectByProjectSection data={data} num="02" />

      {/* §03 — Prosjektstatus: KPI-kort + omsetning/DB chart */}
      <section className="space-y-6">
        <div>
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            §03
          </div>
          <h2
            className="text-2xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            Prosjektstatus
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: COL.border }}>
          <KPICard
            label="Total porteføljeverdi"
            value={fmtMrd(totals.omsetningJustert)}
            sub={`Brutto: ${fmtMrd(totals.omsetning)}`}
            accent
          />
          <KPICard
            label="Dekningsbidrag"
            value={fmtMrd(totals.dbJustert)}
            sub={`Brutto: ${fmtMrd(totals.db)}`}
          />
          <KPICard
            label="DB-margin"
            value={fmtPct(totals.margin)}
            sub="Justert for eierandeler"
          />
          <KPICard
            label="Boliger under utvikling"
            value={fmtNOK(totals.units) + "+"}
            sub="Total prosjektscope"
          />
        </div>
        <div
          className="border p-8"
          style={{ borderColor: COL.border, background: COL.card }}
        >
          <div className="mb-6">
            <h3
              className="text-lg"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              Omsetning & dekningsbidrag per prosjekt
            </h3>
            <div className="text-xs mt-1" style={{ color: COL.muted }}>
              Beløp i mNOK
            </div>
          </div>
          <div className="screen-only">
            <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 42)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 110, bottom: 10 }}
              >
                <CartesianGrid stroke={COL.borderSoft} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={COL.muted}
                  fontSize={11}
                  tickFormatter={(v) => v.toLocaleString("nb-NO")}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={COL.inkSoft}
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: COL.paper,
                    border: `1px solid ${COL.border}`,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  formatter={(v) => v.toLocaleString("nb-NO") + " mNOK"}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  iconType="square"
                />
                <Bar dataKey="Omsetning" fill={COL.ink} radius={[0, 2, 2, 0]} />
                <Bar dataKey="DB" fill={COL.gold} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="print-only">
            <PrintHBarChart
              data={chartData}
              series={["Omsetning", "DB"]}
              colors={{ Omsetning: COL.ink, DB: COL.gold }}
            />
          </div>
        </div>
      </section>

      {/* §04 — Selskapstall: NAV + EK-binding chart */}
      <section className="space-y-6">
        <div>
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            §04
          </div>
          <h2
            className="text-2xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            Selskapstall
          </h2>
        </div>
        <NAVCard totals={totals} />
        <CapitalSummary financials={data.financials || []} />
        <IRRSection financials={data.financials} totals={totals} />
      </section>
    </div>
  );
}

// ---------------- NAV CARD (Verdijustert egenkapital) ----------------
function NAVCard({ totals }) {
  return (
    <div className="px-7 py-7" style={{ background: COL.card }}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ color: COL.muted }}
          >
            Verdijustert egenkapital · NAV
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: COL.muted }}>
            Bokført EK + merverdier (eierandeler)
          </div>
        </div>
        <div
          className="text-[34px] leading-none"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: COL.gold,
          }}
        >
          {fmtNOK(totals.nav)} m
        </div>
      </div>
      <div className="space-y-2">
        <NAVRow
          label="Bokført egenkapital"
          value={totals.bokfortEK}
          width={
            totals.nav > 0 ? (totals.bokfortEK / totals.nav) * 100 : 0
          }
          color={COL.ink}
        />
        <NAVRow
          label="Merverdier eiendom"
          value={totals.merverdier}
          width={
            totals.nav > 0 ? (totals.merverdier / totals.nav) * 100 : 0
          }
          color={COL.goldSoft}
        />
      </div>
    </div>
  );
}

function NAVRow({ label, value, width, color }) {
  return (
    <div>
      <div className="flex justify-between items-baseline text-[11px] mb-1">
        <span style={{ color: COL.muted }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: COL.ink }}>
          {fmtNOK(value)} m
        </span>
      </div>
      <div className="h-1" style={{ background: COL.borderSoft }}>
        <div
          className="h-1 transition-all"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ---------------- IRR-BEREGNING ----------------
// Newton-Raphson IRR. cashflows[i] er kontantstrømmen i år i (år 0 = første post).
function computeIRR(cashflows, guess = 0.15) {
  if (!cashflows || cashflows.length < 2) return null;
  // Sjekk at det finnes både positive og negative tall, ellers er IRR udefinert
  const hasNeg = cashflows.some((c) => c < 0);
  const hasPos = cashflows.some((c) => c > 0);
  if (!hasNeg || !hasPos) return null;

  const npv = (rate) =>
    cashflows.reduce(
      (sum, cf, t) => sum + cf / Math.pow(1 + rate, t),
      0
    );
  const dnpv = (rate) =>
    cashflows.reduce(
      (sum, cf, t) => sum - (t * cf) / Math.pow(1 + rate, t + 1),
      0
    );

  let r = guess;
  for (let i = 0; i < 200; i++) {
    const v = npv(r);
    if (Math.abs(v) < 1e-7) return r;
    const d = dnpv(r);
    if (!isFinite(d) || Math.abs(d) < 1e-12) break;
    const next = r - v / d;
    // Hold IRR i et fornuftig intervall
    if (next < -0.99) {
      r = -0.99;
    } else if (next > 10) {
      r = 10;
    } else {
      r = next;
    }
  }
  return isFinite(r) ? r : null;
}

// Bygger IRR-kontantstrøm-tabell og verdier for visning
function buildIRRModel(financials, navTerminal) {
  if (!financials || financials.length === 0) return null;
  const sorted = [...financials].sort((a, b) => a.year - b.year);
  const startYear = sorted[0].year;
  const startEK = Number(sorted[0].ek) || 0;
  if (startEK <= 0) return null;

  // Siste år med faktisk data (ikke projected) gir terminal-anker.
  // Vi inkluderer ALLE år (også projected) i kontantstrøm slik at planlagt utbytte teller med.
  const endYear = sorted[sorted.length - 1].year;

  // Kontantstrøm:
  //   t=0 (startYear): -startEK  (innsats)
  //   t=1..N-1:         +utbytte (per år)
  //   t=N (endYear):    +utbytte_endYear + terminalverdi (NAV nå)
  const cashflows = [];
  const rows = [];

  for (let i = 0; i < sorted.length; i++) {
    const f = sorted[i];
    const t = f.year - startYear;
    const dividend = Number(f.dividend) || 0;
    let cf;
    let note;
    if (i === 0) {
      cf = -startEK;
      note = "Innsats — bokført EK ved start";
    } else if (i === sorted.length - 1) {
      cf = dividend + (Number(navTerminal) || 0);
      note = `Utbytte ${dividend ? fmtNOK(dividend) + " m" : "0"} + terminalverdi (NAV)`;
    } else {
      cf = dividend;
      note = dividend > 0 ? "Utbytte" : "—";
    }
    cashflows[t] = cf;
    rows.push({ year: f.year, t, cf, dividend, note, projected: f.projected });
  }
  // Fyll evt. tomme år (hvis det er hull) med 0
  for (let t = 0; t <= endYear - startYear; t++) {
    if (cashflows[t] === undefined) cashflows[t] = 0;
  }

  const irr = computeIRR(cashflows);
  const totalDividend = sorted.reduce(
    (s, f) => s + (Number(f.dividend) || 0),
    0
  );
  const years = endYear - startYear;

  return {
    irr,
    startYear,
    endYear,
    startEK,
    totalDividend,
    navTerminal: Number(navTerminal) || 0,
    rows,
    years,
    cashflows,
  };
}

// IRR-presentasjon (chart + faktablokk + kontantstrøm-tabell)
function IRRSection({ financials, totals }) {
  const navTerminal = Number(totals?.nav) || 0;
  const model = buildIRRModel(financials, navTerminal);
  if (!model || model.irr === null) return null;

  const irrPct = (model.irr * 100).toFixed(1).replace(".", ",") + " %";
  const totalCF = model.cashflows.reduce((s, c) => s + c, 0);
  const moic =
    model.startEK > 0
      ? (model.totalDividend + model.navTerminal) / model.startEK
      : null;

  return (
    <div
      className="mt-8 border irr-section"
      data-no-break
      style={{ borderColor: COL.border, background: COL.card }}
    >
      <div
        className="px-6 py-4 border-b flex items-baseline justify-between"
        style={{ borderColor: COL.border, background: COL.paperWarm }}
      >
        <div>
          <div
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ color: COL.muted }}
          >
            Egenkapitalavkastning · IRR
          </div>
          <h3
            className="text-lg"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            IRR fra {model.startYear}
          </h3>
        </div>
        <div
          className="text-[11px]"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: COL.muted,
          }}
        >
          {model.startYear} → {model.endYear} ({model.years} år)
        </div>
      </div>

      {/* KPI-linje */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-px px-6 py-5"
        style={{ background: COL.borderSoft }}
      >
        <div className="px-4 py-3" style={{ background: COL.card }}>
          <div
            className="text-[10px] tracking-[0.18em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            IRR p.a.
          </div>
          <div
            className="text-3xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              color: COL.gold,
            }}
          >
            {irrPct}
          </div>
        </div>
        <div className="px-4 py-3" style={{ background: COL.card }}>
          <div
            className="text-[10px] tracking-[0.18em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            Innsats {model.startYear}
          </div>
          <div
            className="text-2xl"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            {fmtNOK(model.startEK)} m
          </div>
        </div>
        <div className="px-4 py-3" style={{ background: COL.card }}>
          <div
            className="text-[10px] tracking-[0.18em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            Akk. utbytte
          </div>
          <div
            className="text-2xl"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            {fmtNOK(model.totalDividend)} m
          </div>
        </div>
        <div className="px-4 py-3" style={{ background: COL.card }}>
          <div
            className="text-[10px] tracking-[0.18em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            Terminalverdi · NAV
          </div>
          <div
            className="text-2xl"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            {fmtNOK(model.navTerminal)} m
          </div>
          {moic !== null && (
            <div
              className="text-[11px] mt-0.5"
              style={{
                color: COL.muted,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              MOIC: {moic.toFixed(2).replace(".", ",")}×
            </div>
          )}
        </div>
      </div>

      {/* Kontantstrøm-tabell */}
      <div className="px-6 pb-6 no-break" data-no-break>
        <div
          className="text-[10px] tracking-[0.2em] uppercase mb-2"
          style={{ color: COL.muted }}
        >
          Kontantstrøm (mNOK)
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${COL.border}` }}>
              {["År", "T", "Kontantstrøm", "Beskrivelse"].map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-2 text-[10px] tracking-[0.15em] uppercase ${
                    i === 2 ? "text-right" : "text-left"
                  }`}
                  style={{ color: COL.muted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr
                key={r.year}
                style={{ borderBottom: `1px solid ${COL.borderSoft}` }}
              >
                <td
                  className="px-3 py-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {r.year}
                  {r.projected && (
                    <span
                      className="ml-1 text-[10px]"
                      style={{ color: COL.gold }}
                    >
                      *
                    </span>
                  )}
                </td>
                <td
                  className="px-3 py-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: COL.muted,
                    fontSize: 12,
                  }}
                >
                  t={r.t}
                </td>
                <td
                  className="px-3 py-2 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: r.cf < 0 ? COL.burgundy : COL.ink,
                    fontWeight: r.t === 0 || r.t === model.years ? 600 : 400,
                  }}
                >
                  {r.cf >= 0 ? "+" : ""}
                  {fmtNOK(r.cf)}
                </td>
                <td className="px-3 py-2 text-xs" style={{ color: COL.inkSoft }}>
                  {r.note}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${COL.ink}` }}>
              <td
                className="px-3 py-2 text-[10px] tracking-[0.15em] uppercase"
                style={{ color: COL.muted }}
                colSpan={2}
              >
                Sum (udiskontert)
              </td>
              <td
                className="px-3 py-2 text-right"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {totalCF >= 0 ? "+" : ""}
                {fmtNOK(totalCF)}
              </td>
              <td
                className="px-3 py-2 text-[11px]"
                style={{ color: COL.muted }}
              >
                Totalt overskudd over innsats
              </td>
            </tr>
          </tbody>
        </table>
        <div
          className="mt-3 text-[11px] leading-[1.55]"
          style={{ color: COL.muted, maxWidth: "75ch" }}
        >
          IRR (intern rente) er den årlige avkastningen som gjør netto nåverdi
          av kontantstrømmen lik null. Modellen bruker bokført EK ved {model.startYear} som
          innsats, faktiske og planlagte utbytter som kontantstrøm, og dagens
          NAV (verdijustert egenkapital, inkl. merverdier i tomter) som
          terminalverdi i siste år. * = foreløpig år / projeksjon.
        </div>
      </div>
    </div>
  );
}

// ---------------- CAPITAL SUMMARY ----------------
function CapitalSummary({ financials }) {
  if (!financials || financials.length === 0) return null;

  const confirmed = financials.filter(
    (f) => !f.projected && f.ek !== null && f.ek !== undefined
  );
  if (confirmed.length === 0) return null;

  const first = confirmed[0];
  const last = confirmed[confirmed.length - 1];
  const akkResultat = financials.reduce(
    (s, f) => s + (Number(f.result) || 0),
    0
  );
  const akkUtbytte = financials.reduce(
    (s, f) => s + (Number(f.dividend) || 0),
    0
  );
  const startEK = first.ek;
  const sluttEK = last.ek;
  const totalReturn = startEK > 0 ? (sluttEK + akkUtbytte) / startEK : 0;
  const aar = last.year - first.year;
  const cagr = aar > 0 && startEK > 0 ? Math.pow(totalReturn, 1 / aar) - 1 : 0;
  const utdGrad = akkResultat > 0 ? (akkUtbytte / akkResultat) * 100 : 0;

  // IRR: bygge cash flow-serie fra startår til siste bekreftet år.
  // t=0: -startEK (kapital innskutt). t=k: +utbytte. Siste år: +utbytte + sluttEK (terminalverdi).
  const cashflows = (() => {
    const cfs = [-startEK];
    for (let y = first.year + 1; y <= last.year; y++) {
      const row = financials.find((f) => f.year === y);
      const div = Number(row?.dividend) || 0;
      cfs.push(div);
    }
    cfs[cfs.length - 1] += sluttEK; // terminalverdi i siste år
    return cfs;
  })();

  const computeIRR = (cfs, guess = 0.15) => {
    if (cfs.length < 2) return null;
    // Newton-Raphson
    let r = guess;
    for (let i = 0; i < 200; i++) {
      let npv = 0;
      let dnpv = 0;
      for (let t = 0; t < cfs.length; t++) {
        const denom = Math.pow(1 + r, t);
        npv += cfs[t] / denom;
        dnpv += -t * cfs[t] / (denom * (1 + r));
      }
      if (Math.abs(dnpv) < 1e-12) break;
      const newR = r - npv / dnpv;
      if (Math.abs(newR - r) < 1e-8) return newR;
      r = newR;
      if (r <= -0.99) r = -0.99; // unngå divergens
    }
    return r;
  };

  const irr = computeIRR(cashflows);

  // Build chart data: cumulative dividends + EK + cumulative result for each year
  let accRes = 0;
  let accDiv = 0;
  const chartData = financials.map((f) => {
    if (f.result !== null && f.result !== undefined && !isNaN(f.result))
      accRes += Number(f.result);
    if (f.dividend !== null && f.dividend !== undefined && !isNaN(f.dividend))
      accDiv += Number(f.dividend);
    return {
      year: f.year,
      "Bokført EK": f.ek,
      "Akk. resultat": accRes,
      "Akk. utbytte": accDiv,
      Årsresultat: f.result,
      Utbytte: f.dividend,
    };
  });

  return (
    <div
      className="border capital-summary"
      style={{ borderColor: COL.border, background: COL.card }}
    >
      <div
        className="px-7 py-5 border-b flex items-baseline justify-between"
        style={{ borderColor: COL.border, background: COL.paperWarm }}
      >
        <div>
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            Selskapets kapital
          </div>
          <h3
            className="text-xl"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            EK-binding mot utbytter — siden {first.year}
          </h3>
        </div>
        <div
          className="text-[10px]"
          style={{
            color: COL.muted,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {first.year} → {last.year} ({aar} år)
        </div>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-2 md:grid-cols-5 gap-px"
        style={{ background: COL.border }}
      >
        <CapStat
          label="Bokført EK"
          value={fmtNOK(sluttEK) + " m"}
          sub={`Start ${first.year}: ${fmtNOK(startEK)} m`}
        />
        <CapStat
          label="Akk. utbytte"
          value={fmtNOK(akkUtbytte) + " m"}
          sub={`Utdelingsgrad: ${fmtPct(utdGrad)}`}
        />
        <CapStat
          label="Akk. resultat"
          value={fmtNOK(akkResultat) + " m"}
          sub={`Snitt: ${fmtNOK(akkResultat / Math.max(aar, 1))} m/år`}
        />
        <CapStat
          label="Total avkastning"
          value={`${totalReturn.toFixed(2)}×`}
          sub={`CAGR: ${fmtPct(cagr * 100)}`}
        />
        <CapStat
          label="IRR"
          value={irr !== null ? fmtPct(irr * 100) : "—"}
          sub={`${first.year}→${last.year}, EK + utbytter`}
          accent
        />
      </div>

      {/* Year-by-year chart — split into two panels for cleaner reading */}
      <div
        className="border-t"
        style={{ borderColor: COL.borderSoft }}
      >
        {/* Panel 1: Bars — annual flow */}
        <div className="px-7 py-6">
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-3"
            style={{ color: COL.muted }}
          >
            Årlig flyt — resultat og utbytte (mNOK)
          </div>
          <div className="screen-only">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                barCategoryGap="20%"
              >
                <CartesianGrid stroke={COL.borderSoft} vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke={COL.muted}
                  fontSize={11}
                  tick={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <YAxis
                  stroke={COL.muted}
                  fontSize={11}
                  tick={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    background: COL.paper,
                    border: `1px solid ${COL.border}`,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" />
                <Bar dataKey="Årsresultat" fill={COL.ink} maxBarSize={28} />
                <Bar dataKey="Utbytte" fill={COL.goldSoft} maxBarSize={28} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="print-only">
            <PrintVBarChart
              data={chartData}
              xKey="year"
              series={["Årsresultat", "Utbytte"]}
              colors={{ Årsresultat: COL.ink, Utbytte: COL.goldSoft }}
            />
          </div>
        </div>

        {/* Panel 2: Lines — cumulative stock */}
        <div
          className="px-7 py-6 border-t"
          style={{ borderColor: COL.borderSoft }}
        >
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-3"
            style={{ color: COL.muted }}
          >
            Akkumulert — bokført EK og kumulative tall (mNOK)
          </div>
          <div className="screen-only">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid stroke={COL.borderSoft} vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke={COL.muted}
                  fontSize={11}
                  tick={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <YAxis
                  stroke={COL.muted}
                  fontSize={11}
                  tick={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    background: COL.paper,
                    border: `1px solid ${COL.border}`,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="Bokført EK"
                  stroke={COL.sage}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COL.sage }}
                />
                <Line
                  type="monotone"
                  dataKey="Akk. utbytte"
                  stroke={COL.gold}
                  strokeWidth={1.75}
                  strokeDasharray="3 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Akk. resultat"
                  stroke={COL.burgundy}
                  strokeWidth={1.75}
                  strokeDasharray="5 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="print-only">
            <PrintLineChart
              data={chartData}
              xKey="year"
              series={["Bokført EK", "Akk. utbytte", "Akk. resultat"]}
              colors={{
                "Bokført EK": COL.sage,
                "Akk. utbytte": COL.gold,
                "Akk. resultat": COL.burgundy,
              }}
              dashes={{
                "Bokført EK": "none",
                "Akk. utbytte": "3 4",
                "Akk. resultat": "5 4",
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="px-7 py-3 text-[11px] border-t"
        style={{ color: COL.muted, borderColor: COL.borderSoft }}
      >
        IRR beregnes med start-EK som negativ kontantstrøm i {first.year}, årlige utbytter som positive kontantstrømmer, og slutt-EK i {last.year} som terminalverdi. Total avkastning = (slutt-EK + akk. utbytte) / start-EK. EK reflekterer kapital som er bundet i selskapet; akk. utbytte den som er delt ut til eier(e).
      </div>
    </div>
  );
}

function CapStat({ label, value, sub, accent }) {
  return (
    <div className="px-6 py-5" style={{ background: COL.card }}>
      <div
        className="text-[10px] tracking-[0.2em] uppercase mb-2"
        style={{ color: COL.muted }}
      >
        {label}
      </div>
      <div
        className="text-[24px] leading-none"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: accent ? COL.gold : COL.ink,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-2 text-[10px]"
          style={{ color: COL.muted, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ---------------- PIPELINE PAGE ----------------
const PIPELINE_STATUSES = ["Pågående", "Avventende", "Avsluttet", "Vunnet", "Tapt"];

function PipelinePage({ data, setData }) {
  const [editingCase, setEditingCase] = useState(null);
  const [filter, setFilter] = useState("Aktive");

  const filtered = useMemo(() => {
    let arr = [...(data.pipeline || [])];
    if (filter === "Aktive") {
      arr = arr.filter((c) => c.status === "Pågående" || c.status === "Avventende");
    } else if (filter !== "Alle") {
      arr = arr.filter((c) => c.status === filter);
    }
    arr.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    return arr;
  }, [data.pipeline, filter]);

  const updateCase = (id, patch) => {
    setData((d) => ({
      ...d,
      pipeline: (d.pipeline || []).map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));
  };
  const addCase = () => {
    const id = "c_" + Math.random().toString(36).slice(2, 8);
    const nc = {
      id,
      priority: 2,
      name: "Nytt case",
      location: "",
      info: "",
      size: "",
      contact: "",
      status: "Pågående",
      comment: "",
    };
    setData((d) => ({ ...d, pipeline: [...(d.pipeline || []), nc] }));
    setEditingCase(nc);
  };
  const deleteCase = (id) => {
    setData((d) => ({
      ...d,
      pipeline: (d.pipeline || []).filter((c) => c.id !== id),
    }));
    setEditingCase(null);
  };

  // Stats
  const all = data.pipeline || [];
  const counts = {
    pågående: all.filter((c) => c.status === "Pågående").length,
    avventende: all.filter((c) => c.status === "Avventende").length,
    vunnet: all.filter((c) => c.status === "Vunnet").length,
    tapt: all.filter((c) => c.status === "Tapt").length,
    avsluttet: all.filter((c) => c.status === "Avsluttet").length,
  };

  return (
    <div className="space-y-8">
      {/* Stat strip */}
      <div className="grid grid-cols-5 gap-px" style={{ background: COL.border }}>
        <PipelineStat label="Pågående" value={counts.pågående} accent={COL.sage} />
        <PipelineStat label="Avventende" value={counts.avventende} accent={COL.gold} />
        <PipelineStat label="Vunnet" value={counts.vunnet} accent={COL.ink} />
        <PipelineStat label="Tapt" value={counts.tapt} accent={COL.burgundy} />
        <PipelineStat label="Avsluttet" value={counts.avsluttet} accent={COL.muted} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {["Aktive", "Alle", ...PIPELINE_STATUSES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="px-3 py-1.5 text-xs border transition-all"
              style={{
                borderColor: filter === c ? COL.ink : COL.border,
                background: filter === c ? COL.ink : "transparent",
                color: filter === c ? COL.paper : COL.inkSoft,
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={addCase}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 text-xs"
          style={{ background: COL.ink, color: COL.paper }}
        >
          <Plus size={13} /> Nytt case
        </button>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((c) => (
          <CaseCard
            key={c.id}
            caseData={c}
            onClick={() => setEditingCase(c)}
          />
        ))}
        {filtered.length === 0 && (
          <div
            className="col-span-2 py-12 text-center text-sm border"
            style={{
              color: COL.muted,
              borderColor: COL.border,
              background: COL.card,
            }}
          >
            Ingen case i dette filteret.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingCase && (
        <CaseEditModal
          caseData={editingCase}
          onSave={(patch) => {
            updateCase(editingCase.id, patch);
            setEditingCase(null);
          }}
          onDelete={() => deleteCase(editingCase.id)}
          onClose={() => setEditingCase(null)}
        />
      )}
    </div>
  );
}

function PipelineStat({ label, value, accent }) {
  return (
    <div className="px-6 py-5" style={{ background: COL.card }}>
      <div
        className="text-[10px] tracking-[0.2em] uppercase mb-2"
        style={{ color: COL.muted }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div
          className="text-3xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            color: accent,
          }}
        >
          {value}
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.15em]"
          style={{ color: COL.muted }}
        >
          case
        </div>
      </div>
    </div>
  );
}

function CaseCard({ caseData, onClick }) {
  const c = caseData;
  const statusColor = {
    Pågående: COL.sage,
    Avventende: COL.gold,
    Vunnet: COL.ink,
    Tapt: COL.burgundy,
    Avsluttet: COL.muted,
  }[c.status] || COL.muted;

  return (
    <div
      onClick={onClick}
      className="border p-5 cursor-pointer transition-all hover:shadow-md"
      style={{ borderColor: COL.border, background: COL.card }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={c.priority} />
            <span
              className="text-[10px] tracking-[0.15em] uppercase"
              style={{ color: COL.muted }}
            >
              {c.location}
            </span>
          </div>
          <h3
            className="text-xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.005em",
            }}
          >
            {c.name}
          </h3>
        </div>
        <span
          className="text-[10px] tracking-[0.1em] uppercase px-2 py-1"
          style={{
            background: statusColor + "1A",
            color: statusColor,
            border: `1px solid ${statusColor}33`,
          }}
        >
          {c.status}
        </span>
      </div>
      {c.size && (
        <div
          className="text-[11px] mb-2"
          style={{
            color: COL.gold,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {c.size}
        </div>
      )}
      {c.info && (
        <p
          className="text-[13px] leading-[1.55] mb-3"
          style={{ color: COL.inkSoft }}
        >
          {c.info}
        </p>
      )}
      <div
        className="pt-3 mt-3 border-t flex items-baseline justify-between text-[11px]"
        style={{ borderColor: COL.borderSoft, color: COL.muted }}
      >
        <span>{c.contact || "Ingen kontakt registrert"}</span>
        {c.comment && (
          <span className="italic" style={{ color: COL.inkSoft }}>
            {c.comment.length > 50 ? c.comment.slice(0, 50) + "…" : c.comment}
          </span>
        )}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const cfg = {
    1: { label: "P1", bg: COL.ink, fg: COL.paper },
    2: { label: "P2", bg: COL.gold, fg: COL.paper },
    3: { label: "P3", bg: COL.borderSoft, fg: COL.muted },
  };
  const c = cfg[priority] || cfg[3];
  return (
    <span
      className="text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5"
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {c.label}
    </span>
  );
}

function CaseEditModal({ caseData, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(caseData);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto py-10"
      style={{ background: "rgba(14, 26, 43, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl shadow-2xl"
        style={{ background: COL.paper, color: COL.ink }}
      >
        <div
          className="flex items-center justify-between px-8 py-5 border-b"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <div>
            <div
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ color: COL.muted }}
            >
              Rediger pipeline-case
            </div>
            <h3
              className="text-xl mt-0.5"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
            >
              {draft.name || "Uten navn"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1">
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Prioritet">
              <Select
                value={draft.priority}
                onChange={(v) => update("priority", Number(v))}
                options={["1", "2", "3"]}
              />
            </Field>
            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(v) => update("status", v)}
                options={PIPELINE_STATUSES}
              />
            </Field>
            <Field label="Lokasjon">
              <Input value={draft.location} onChange={(v) => update("location", v)} />
            </Field>
          </div>

          <Field label="Adresse / prosjekt">
            <Input value={draft.name} onChange={(v) => update("name", v)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Antatt størrelse">
              <Input
                value={draft.size}
                onChange={(v) => update("size", v)}
                placeholder="f.eks. 6 000 BRAs / 120 boliger"
              />
            </Field>
            <Field label="Kontakt">
              <Input value={draft.contact} onChange={(v) => update("contact", v)} />
            </Field>
          </div>

          <Field label="Informasjon">
            <textarea
              value={draft.info}
              onChange={(e) => update("info", e.target.value)}
              rows={3}
              className="w-full p-3 text-sm border resize-y"
              style={{
                background: COL.card,
                borderColor: COL.border,
                color: COL.inkSoft,
                lineHeight: 1.6,
              }}
            />
          </Field>

          <Field label="Kommentar / fremdrift">
            <textarea
              value={draft.comment}
              onChange={(e) => update("comment", e.target.value)}
              rows={3}
              className="w-full p-3 text-sm border resize-y"
              style={{
                background: COL.card,
                borderColor: COL.border,
                color: COL.inkSoft,
                lineHeight: 1.6,
              }}
            />
          </Field>
        </div>

        <div
          className="flex items-center justify-between px-8 py-4 border-t"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
                style={{ color: COL.burgundy }}
              >
                <Trash2 size={12} /> Slett case
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: COL.burgundy }}>
                  Sikker?
                </span>
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 text-xs"
                  style={{ background: COL.burgundy, color: COL.paper }}
                >
                  Ja, slett
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs border"
                  style={{ borderColor: COL.border }}
                >
                  Avbryt
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs border"
              style={{ borderColor: COL.border, color: COL.inkSoft }}
            >
              Avbryt
            </button>
            <button
              onClick={() => onSave(draft)}
              className="px-4 py-2 text-xs flex items-center gap-1.5"
              style={{ background: COL.ink, color: COL.paper }}
            >
              <Save size={12} /> Lagre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- MARKET IMAGE DISPLAY (klikk-for-å-forstørre) ----------------
function MarketImageDisplay({ imageUrl, imageCaption, compact = false }) {
  const [enlarged, setEnlarged] = useState(false);
  if (!imageUrl) return null;
  return (
    <>
      <div className={compact ? "" : "w-full"}>
        <button
          type="button"
          onClick={() => setEnlarged(true)}
          className="block w-full p-0 cursor-zoom-in"
          style={{ background: "none", border: "none" }}
          aria-label="Forstørr bilde"
        >
          <img
            src={imageUrl}
            alt={imageCaption || "Markedsstatistikk"}
            className="w-full h-auto block"
            style={{
              border: `1px solid ${COL.border}`,
              maxHeight: compact ? 300 : 500,
              objectFit: "contain",
            }}
          />
        </button>
        {imageCaption && (
          <div
            className="mt-2 text-[11px]"
            style={{
              color: COL.muted,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {imageCaption}
          </div>
        )}
      </div>

      {enlarged && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 cursor-zoom-out"
          style={{ background: "rgba(14, 26, 43, 0.92)" }}
          onClick={() => setEnlarged(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEnlarged(false);
            }}
            className="absolute top-6 right-6 p-2"
            style={{
              background: "none",
              border: `1px solid rgba(246, 241, 231, 0.3)`,
              color: COL.paper,
              cursor: "pointer",
            }}
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
          <img
            src={imageUrl}
            alt={imageCaption || "Markedsstatistikk"}
            className="max-w-full max-h-full"
            style={{ objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />
          {imageCaption && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-[12px]"
              style={{
                color: COL.paper,
                background: "rgba(0,0,0,0.5)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {imageCaption}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ---------------- KPI CARD ----------------
function KPICard({ label, value, accent, sub }) {
  return (
    <div className="px-4 py-5 md:px-7 md:py-7" style={{ background: COL.card }}>
      <div
        className="text-[10px] tracking-[0.18em] uppercase mb-3"
        style={{ color: COL.muted }}
      >
        {label}
      </div>
      <div
        className="text-2xl md:text-[34px] leading-none"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: accent ? COL.gold : COL.ink,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-2 text-[10px] tracking-[0.15em] uppercase"
          style={{ color: COL.muted }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ---------------- PORTFOLIO PAGE ----------------
function PortfolioPage({ data, onEdit, onAdd }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Alle");
  const [sortBy, setSortBy] = useState("omsetning");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    let arr = [...data.projects];
    if (filter !== "Alle") arr = arr.filter((p) => p.statusCategory === filter);
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.location.toLowerCase().includes(s) ||
          (p.partner || "").toLowerCase().includes(s)
      );
    }
    arr.sort((a, b) => {
      let av = a[sortBy];
      let bv = b[sortBy];
      if (typeof av === "string") {
        av = av.toLowerCase();
        bv = (bv || "").toLowerCase();
      }
      if (av === null || av === undefined) av = -Infinity;
      if (bv === null || bv === undefined) bv = -Infinity;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data.projects, search, filter, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2 border flex-1 max-w-sm"
          style={{ borderColor: COL.border, background: COL.card }}
        >
          <Search size={14} style={{ color: COL.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk prosjekt, lokasjon, partner…"
            className="flex-1 bg-transparent text-sm placeholder:opacity-50"
            style={{ color: COL.ink }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["Alle", ...STATUS_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="px-3 py-1.5 text-xs border transition-all"
              style={{
                borderColor: filter === c ? COL.ink : COL.border,
                background: filter === c ? COL.ink : "transparent",
                color: filter === c ? COL.paper : COL.inkSoft,
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={onAdd}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 text-xs"
          style={{ background: COL.ink, color: COL.paper }}
        >
          <Plus size={13} /> Nytt prosjekt
        </button>
      </div>

      {/* Table */}
      <div
        className="border overflow-x-auto"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <table className="w-full text-sm" style={{ minWidth: 720 }}>
          <thead>
            <tr
              className="border-b"
              style={{ borderColor: COL.border, background: COL.paperWarm }}
            >
              {[
                { id: "name", label: "Prosjekt", w: "20%" },
                { id: "units", label: "Boliger", w: "8%", num: true },
                { id: "statusShort", label: "Status", w: "20%" },
                { id: "omsetning", label: "Omsetning", w: "12%", num: true },
                { id: "db", label: "DB", w: "10%", num: true },
                { id: "partner", label: "Partner", w: "16%" },
                { id: "bank", label: "Bank", w: "8%" },
                { id: "actions", label: "", w: "6%" },
              ].map((c) => (
                <th
                  key={c.id}
                  onClick={() => c.id !== "actions" && toggleSort(c.id)}
                  className={`px-4 py-3 text-[10px] tracking-[0.15em] uppercase ${
                    c.num ? "text-right" : "text-left"
                  } ${c.id !== "actions" ? "cursor-pointer hover:opacity-70" : ""}`}
                  style={{ color: COL.muted, width: c.w }}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sortBy === c.id && (
                      <span style={{ color: COL.gold }}>
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.id}
                className="border-b transition-colors hover:bg-black/[0.02] cursor-pointer"
                style={{ borderColor: COL.borderSoft }}
                onClick={() => onEdit(p)}
              >
                <td className="px-4 py-3.5">
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  >
                    {p.name}
                  </div>
                  <div className="text-[11px]" style={{ color: COL.muted }}>
                    {p.location}
                  </div>
                </td>
                <td
                  className="px-4 py-3.5 text-right"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
                >
                  {p.units > 0 ? (
                    <>
                      <div>{p.units}</div>
                      {(p.unitsSold ?? 0) > 0 && (
                        <div
                          className="text-[10px] mt-0.5"
                          style={{ color: COL.gold }}
                        >
                          Solgt {p.unitsSold} ({Math.round((p.unitsSold / p.units) * 100)} %)
                        </div>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <StatusPill cat={p.statusCategory} text={p.statusShort} />
                </td>
                <td
                  className="px-4 py-3.5 text-right"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
                >
                  {p.omsetning > 0 ? fmtMrd(p.omsetning) : "—"}
                </td>
                <td
                  className="px-4 py-3.5 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: COL.gold,
                  }}
                >
                  {p.db > 0 ? fmtMrd(p.db) : "—"}
                </td>
                <td className="px-4 py-3.5 text-xs" style={{ color: COL.inkSoft }}>
                  {p.partnerShare ? (
                    <span style={{ color: COL.muted }}>{p.partnerShare}% </span>
                  ) : null}
                  {p.partner || "—"}
                </td>
                <td className="px-4 py-3.5 text-xs" style={{ color: COL.inkSoft }}>
                  {p.bank || "—"}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Pencil
                    size={13}
                    style={{ color: COL.muted }}
                    className="inline"
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: COL.muted }}
                >
                  Ingen prosjekter funnet.
                </td>
              </tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr
                style={{ background: COL.paperWarm, borderTop: `1px solid ${COL.border}` }}
              >
                <td
                  className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase"
                  style={{ color: COL.muted }}
                >
                  Sum ({filtered.length})
                </td>
                <td
                  className="px-4 py-3 text-right"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
                >
                  {fmtNOK(filtered.reduce((s, p) => s + (p.units || 0), 0))}
                </td>
                <td />
                <td
                  className="px-4 py-3 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {fmtMrd(filtered.reduce((s, p) => s + (p.omsetning || 0), 0))}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: COL.gold,
                  }}
                >
                  {fmtMrd(filtered.reduce((s, p) => s + (p.db || 0), 0))}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ---------------- STATUS PILL ----------------
function StatusPill({ cat, text }) {
  const colors = {
    Produksjon: { bg: "#E5EFE9", fg: COL.sage },
    Salg: { bg: "#EAE0D0", fg: COL.gold },
    Regulering: { bg: "#E1E5EE", fg: COL.inkSoft },
    Prosjektering: { bg: "#EDE7DA", fg: COL.muted },
    Næring: { bg: "#F1E2E5", fg: COL.burgundy },
    Drift: { bg: "#E8E4DA", fg: COL.muted },
  };
  const c = colors[cat] || colors.Drift;
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[10px] tracking-[0.1em] uppercase px-2 py-0.5"
        style={{ background: c.bg, color: c.fg }}
      >
        {cat}
      </span>
      <span className="text-xs" style={{ color: COL.inkSoft }}>
        {text}
      </span>
    </div>
  );
}

// ---------------- PROJECT EDIT MODAL ----------------
function ProjectEditModal({ project, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(project);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto py-10"
      style={{ background: "rgba(14, 26, 43, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl shadow-2xl"
        style={{ background: COL.paper, color: COL.ink }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-5 border-b"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <div>
            <div
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ color: COL.muted }}
            >
              Rediger prosjekt
            </div>
            <h3
              className="text-xl mt-0.5"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
            >
              {draft.name || "Uten navn"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prosjektnavn">
              <Input value={draft.name} onChange={(v) => update("name", v)} />
            </Field>
            <Field label="Lokasjon">
              <Input
                value={draft.location}
                onChange={(v) => update("location", v)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Antall boliger (totalt)">
              <Input
                type="number"
                value={draft.units}
                onChange={(v) => update("units", Number(v))}
              />
            </Field>
            <Field label="Omsetning (mNOK)">
              <Input
                type="number"
                value={draft.omsetning}
                onChange={(v) => update("omsetning", Number(v))}
              />
            </Field>
            <Field label="DB (mNOK)">
              <Input
                type="number"
                value={draft.db}
                onChange={(v) => update("db", Number(v))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Solgt (antall)">
              <Input
                type="number"
                value={draft.unitsSold ?? 0}
                onChange={(v) => update("unitsSold", Number(v))}
              />
            </Field>
            <Field label="Ledig (beregnet)">
              <Input
                type="number"
                value={Math.max(0, (Number(draft.units) || 0) - (Number(draft.unitsSold) || 0))}
                disabled
                onChange={() => {}}
              />
            </Field>
            <Field label="Salgsgrad">
              <Input
                value={
                  (Number(draft.units) || 0) > 0
                    ? `${Math.round(((Number(draft.unitsSold) || 0) / Number(draft.units)) * 100)} %`
                    : "—"
                }
                disabled
                onChange={() => {}}
              />
            </Field>
          </div>

          <div
            className="pt-4 mt-2 border-t"
            style={{ borderColor: COL.borderSoft }}
          >
            <div
              className="text-[10px] tracking-[0.2em] uppercase mb-3"
              style={{ color: COL.muted }}
            >
              Prosjektøkonomi
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="BRA-S (kvm)">
                <Input
                  type="number"
                  value={draft.kvm ?? ""}
                  onChange={(v) =>
                    update("kvm", v === "" ? null : Number(v))
                  }
                />
              </Field>
              <Field label="Byggestart (år)">
                <Input
                  type="number"
                  value={draft.byggestart ?? ""}
                  onChange={(v) =>
                    update("byggestart", v === "" ? null : Number(v))
                  }
                />
              </Field>
              <Field label="Byggeslutt (år)">
                <Input
                  type="number"
                  value={draft.byggeslutt ?? ""}
                  onChange={(v) =>
                    update("byggeslutt", v === "" ? null : Number(v))
                  }
                />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tomtekost (mNOK)">
              <Input
                type="number"
                value={draft.tomtekost ?? ""}
                onChange={(v) =>
                  update("tomtekost", v === "" ? null : Number(v))
                }
              />
            </Field>
            <Field label="Merverdi tomt — eierandel (mNOK)">
              <Input
                type="number"
                value={draft.merverdiTomt ?? ""}
                onChange={(v) =>
                  update("merverdiTomt", v === "" ? null : Number(v))
                }
              />
            </Field>
          </div>

          <div
            className="pt-4 mt-2 border-t"
            style={{ borderColor: COL.borderSoft }}
          >
            <div
              className="text-[10px] tracking-[0.2em] uppercase mb-3"
              style={{ color: COL.muted }}
            >
              Status
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Statuspill — kort (portefølje-tabell)">
              <Input
                value={draft.statusShort}
                onChange={(v) => update("statusShort", v)}
              />
            </Field>
            <Field label="Statuskategori">
              <Select
                value={draft.statusCategory}
                onChange={(v) => update("statusCategory", v)}
                options={STATUS_CATEGORIES}
              />
            </Field>
          </div>

          <Field label="Statustekst — narrativ (månedsrapport → prosjekt for prosjekt)">
            <textarea
              value={draft.statusLong || ""}
              onChange={(e) => update("statusLong", e.target.value)}
              rows={6}
              className="w-full p-3 text-sm border resize-y"
              style={{
                background: COL.card,
                borderColor: COL.border,
                color: COL.inkSoft,
                lineHeight: 1.6,
              }}
              placeholder="Fortellende statustekst som vises i månedsrapportens 'Prosjekt for prosjekt'-seksjon."
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Partner">
              <Input
                value={draft.partner}
                onChange={(v) => update("partner", v)}
              />
            </Field>
            <Field label="Eierandel (%)">
              <Input
                type="number"
                value={draft.partnerShare ?? ""}
                onChange={(v) =>
                  update("partnerShare", v === "" ? null : Number(v))
                }
              />
            </Field>
            <Field label="Bank">
              <Input value={draft.bank} onChange={(v) => update("bank", v)} />
            </Field>
          </div>

          <Field label="Prosjektbilde">
            {draft.imageUrl ? (
              <div className="space-y-2">
                <div
                  className="border p-2 inline-block"
                  style={{ borderColor: COL.border, background: COL.card }}
                >
                  <img
                    src={draft.imageUrl}
                    alt={draft.name}
                    className="max-h-40 w-auto"
                    style={{ display: "block" }}
                  />
                </div>
                <div className="flex gap-2">
                  <label
                    htmlFor={`proj-img-${draft.id}`}
                    className="cursor-pointer px-3 py-1.5 text-xs border"
                    style={{ borderColor: COL.border, color: COL.inkSoft }}
                  >
                    Bytt bilde
                  </label>
                  <button
                    type="button"
                    onClick={() => update("imageUrl", "")}
                    className="px-3 py-1.5 text-xs border"
                    style={{ borderColor: COL.border, color: COL.inkSoft }}
                  >
                    Fjern bilde
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor={`proj-img-${draft.id}`}
                className="inline-block cursor-pointer px-3 py-2 text-xs border"
                style={{
                  borderColor: COL.border,
                  color: COL.inkSoft,
                  background: COL.card,
                }}
              >
                Last opp bilde (JPG / PNG)
              </label>
            )}
            <input
              id={`proj-img-${draft.id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  alert("Bildet må være under 2 MB");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => update("imageUrl", reader.result);
                reader.readAsDataURL(file);
              }}
            />
          </Field>

          <Field label="Nettside">
            <Input
              value={draft.website}
              onChange={(v) => update("website", v)}
              placeholder="https://"
            />
          </Field>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-8 py-4 border-t"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
                style={{ color: COL.burgundy }}
              >
                <Trash2 size={12} /> Slett prosjekt
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: COL.burgundy }}>
                  Sikker?
                </span>
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 text-xs"
                  style={{ background: COL.burgundy, color: COL.paper }}
                >
                  Ja, slett
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs border"
                  style={{ borderColor: COL.border }}
                >
                  Avbryt
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs border"
              style={{ borderColor: COL.border, color: COL.inkSoft }}
            >
              Avbryt
            </button>
            <button
              onClick={() => onSave(draft)}
              className="px-4 py-2 text-xs flex items-center gap-1.5"
              style={{ background: COL.ink, color: COL.paper }}
            >
              <Save size={12} /> Lagre endringer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div
        className="text-[10px] tracking-[0.15em] uppercase mb-1.5"
        style={{ color: COL.muted }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
function Input({ value, onChange, type = "text", placeholder }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border"
      style={{
        background: COL.card,
        borderColor: COL.border,
        color: COL.ink,
      }}
    />
  );
}
function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border"
      style={{
        background: COL.card,
        borderColor: COL.border,
        color: COL.ink,
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ---------------- FINANCIALS PAGE ----------------
function FinancialsPage({ data, setData, totals }) {
  const financials = data.financials || [];

  const updateRow = (year, patch) => {
    setData((d) => ({
      ...d,
      financials: (d.financials || []).map((r) =>
        r.year === year ? { ...r, ...patch } : r
      ),
    }));
  };

  const addYear = () => {
    const fin = data.financials || [];
    const max = fin.length > 0 ? Math.max(...fin.map((f) => f.year)) : 2024;
    setData((d) => ({
      ...d,
      financials: [
        ...(d.financials || []),
        { year: max + 1, result: null, dividend: 0, ek: null, gjeld: 0, projected: true },
      ],
    }));
  };

  // Compute accumulated
  const rows = useMemo(() => {
    let accRes = 0;
    let accDiv = 0;
    return financials.map((r) => {
      if (r.result !== null && !isNaN(r.result)) accRes += r.result;
      if (r.dividend !== null && !isNaN(r.dividend)) accDiv += r.dividend;
      return {
        ...r,
        accResult: accRes,
        accDividend: accDiv,
        utdGrad: accRes > 0 ? (accDiv / accRes) * 100 : null,
      };
    });
  }, [financials]);

  const chartRows = rows.map((r) => ({
    year: r.year,
    "Årsresultat": r.result,
    Utbytte: r.dividend,
    "Bokført EK": r.ek,
    "Akk. resultat": r.accResult,
    "Akk. utbytte": r.accDividend,
  }));

  const lastConfirmed = [...rows].reverse().find((r) => !r.projected);
  // Latest row that has any meaningful data — used for the top KPIs so
  // edits to projected years (e.g. 2026) propagate visibly
  const latest = [...rows]
    .reverse()
    .find(
      (r) =>
        (r.result !== null && r.result !== undefined) ||
        (r.ek !== null && r.ek !== undefined) ||
        (r.dividend !== null && r.dividend !== undefined && r.dividend !== 0)
    ) || rows[rows.length - 1];
  const isProj = !!latest?.projected;
  const projTag = isProj ? " *" : "";

  if (rows.length === 0) {
    return (
      <div
        className="border p-12 text-center"
        style={{ borderColor: COL.border, background: COL.card, color: COL.muted }}
      >
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: COL.ink }}>
          Ingen finansielle data
        </div>
        <button
          onClick={addYear}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          style={{ background: COL.ink, color: COL.paper }}
        >
          <Plus size={12} /> Legg til første år
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: COL.border }}>
        <KPICard
          label={`Årsresultat ${latest?.year}${projTag}`}
          value={
            latest?.result !== null && latest?.result !== undefined
              ? fmtNOK(latest.result) + " m"
              : "—"
          }
          sub={isProj ? "Foreløpig år" : null}
          accent
        />
        <KPICard
          label={`EK ${latest?.year}${projTag}`}
          value={
            latest?.ek !== null && latest?.ek !== undefined
              ? fmtNOK(latest.ek) + " m"
              : "—"
          }
          sub={isProj ? "Foreløpig år" : null}
        />
        <KPICard
          label={`Akk. resultat${projTag}`}
          value={fmtNOK(latest?.accResult) + " m"}
          sub={isProj ? "Inkl. foreløpig" : null}
        />
        <KPICard
          label={`Utdelingsgrad akk.${projTag}`}
          value={fmtPct(latest?.utdGrad)}
          sub={isProj ? "Inkl. foreløpig" : null}
        />
      </div>
      {isProj && (
        <div
          className="text-[10px] tracking-[0.2em] uppercase -mt-6 text-right"
          style={{ color: COL.muted }}
        >
          * Foreløpig — basert på prognose for {latest?.year}
        </div>
      )}

      {/* NAV — Verdijustert egenkapital */}
      {totals && <NAVCard totals={totals} />}

      {/* Combined chart */}
      <section
        className="border p-8"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <div className="mb-6">
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            §03
          </div>
          <h2
            className="text-2xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            Selskapets utvikling
          </h2>
          <div className="text-xs mt-1" style={{ color: COL.muted }}>
            Resultater, utbytte og egenkapital — beløp i mNOK
          </div>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartRows} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid stroke={COL.borderSoft} vertical={false} />
            <XAxis dataKey="year" stroke={COL.muted} fontSize={11} />
            <YAxis stroke={COL.muted} fontSize={11} />
            <Tooltip
              contentStyle={{
                background: COL.paper,
                border: `1px solid ${COL.border}`,
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" />
            <Bar dataKey="Årsresultat" fill={COL.ink} barSize={18} />
            <Bar dataKey="Utbytte" fill={COL.goldSoft} barSize={18} />
            <Line
              type="monotone"
              dataKey="Bokført EK"
              stroke={COL.sage}
              strokeWidth={2}
              dot={{ r: 3, fill: COL.sage }}
            />
            <Line
              type="monotone"
              dataKey="Akk. resultat"
              stroke={COL.burgundy}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Akk. utbytte"
              stroke={COL.gold}
              strokeWidth={1.5}
              strokeDasharray="2 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* Editable table */}
      <section
        className="border"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <div>
            <div
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ color: COL.muted }}
            >
              §04
            </div>
            <h3
              className="text-lg"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
            >
              Selskapstall — år for år
            </h3>
          </div>
          <button
            onClick={addYear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            style={{ background: COL.ink, color: COL.paper }}
          >
            <Plus size={12} /> Legg til år
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: COL.paperWarm }}>
              {[
                "År",
                "Årsresultat",
                "Utbytte",
                "Fra år",
                "Bokført EK",
                "Gjeld",
                "Akk. resultat",
                "Akk. utbytte",
                "Utd.grad",
              ].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] tracking-[0.15em] uppercase ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                  style={{ color: COL.muted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.year}
                className="border-t"
                style={{ borderColor: COL.borderSoft }}
              >
                <td
                  className="px-4 py-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {r.year}
                  {r.projected && (
                    <span
                      className="ml-1 text-[10px]"
                      style={{ color: COL.gold }}
                    >
                      *
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <NumCell
                    value={r.result}
                    onChange={(v) => updateRow(r.year, { result: v })}
                  />
                </td>
                <td className="px-4 py-2">
                  <NumCell
                    value={r.dividend}
                    onChange={(v) => updateRow(r.year, { dividend: v })}
                  />
                </td>
                <td className="px-4 py-2">
                  <NumCell
                    value={r.dividendFromYear}
                    onChange={(v) => updateRow(r.year, { dividendFromYear: v })}
                  />
                </td>
                <td className="px-4 py-2">
                  <NumCell
                    value={r.ek}
                    onChange={(v) => updateRow(r.year, { ek: v })}
                  />
                </td>
                <td className="px-4 py-2">
                  <NumCell
                    value={r.gjeld ?? 0}
                    onChange={(v) => updateRow(r.year, { gjeld: v })}
                  />
                </td>
                <td
                  className="px-4 py-2 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: COL.muted,
                  }}
                >
                  {fmtNOK(r.accResult)}
                </td>
                <td
                  className="px-4 py-2 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: COL.muted,
                  }}
                >
                  {fmtNOK(r.accDividend)}
                </td>
                <td
                  className="px-4 py-2 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                  }}
                >
                  {fmtPct(r.utdGrad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className="px-4 py-3 text-[11px] border-t"
          style={{ color: COL.muted, borderColor: COL.borderSoft }}
        >
          * Foreløpig år. Utbytte føres i året det er utbetalt — kolonnen «Fra år» angir hvilket regnskapsår utbyttet stammer fra (utbetales typisk året etter regnskapsåret). Utdelingsgrad akk. = akk. utbytte / akk. resultat t.o.m. rapportert år.
        </div>
      </section>

      <IRRSection financials={data.financials} totals={totals} />
    </div>
  );
}

function NumCell({ value, onChange }) {
  return (
    <input
      type="number"
      step="0.1"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className="w-full px-2 py-1 text-right border"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        background: COL.paper,
        borderColor: COL.borderSoft,
        color: COL.ink,
      }}
    />
  );
}

// ---------------- FERDIGSTILTE PROSJEKTER ----------------
// Egen Supabase-tabell `completed_projects` med offentlig lese-tilgang
// så nettsiden (bolignorge.no/prosjekter) leser fra samme kilde.
function CompletedProjectsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({
    year: new Date().getFullYear(),
    name: "",
    location: "",
    units: 0,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("completed_projects")
      .select()
      .order("year", { ascending: false })
      .order("display_order", { ascending: true });
    if (err) setError(err.message);
    else setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (id, field, value) => {
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const persistRow = async (id) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setSavingId(id);
    const { error: err } = await supabase
      .from("completed_projects")
      .update({
        year: row.year,
        name: row.name,
        location: row.location,
        units: row.units,
        display_order: row.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSavingId(null);
    if (err) {
      alert("Klarte ikke å lagre: " + err.message);
      load();
    }
  };

  const deleteRow = async (id, name) => {
    if (!confirm(`Slette "${name}"?`)) return;
    const { error: err } = await supabase
      .from("completed_projects")
      .delete()
      .eq("id", id);
    if (err) {
      alert("Klarte ikke å slette: " + err.message);
      return;
    }
    load();
  };

  const addNewRow = async () => {
    if (!newRow.name.trim() || !newRow.location.trim()) {
      alert("Prosjektnavn og lokasjon må fylles ut.");
      return;
    }
    const maxOrder =
      rows.length > 0
        ? Math.max(...rows.map((r) => r.display_order || 0))
        : 0;
    const { error: err } = await supabase
      .from("completed_projects")
      .insert({
        year: newRow.year,
        name: newRow.name.trim(),
        location: newRow.location.trim(),
        units: newRow.units,
        display_order: maxOrder + 1,
      });
    if (err) {
      alert("Klarte ikke å legge til: " + err.message);
      return;
    }
    setNewRow({
      year: new Date().getFullYear(),
      name: "",
      location: "",
      units: 0,
    });
    setShowAdd(false);
    load();
  };

  const inputCls =
    "w-full px-2 py-1.5 text-sm bg-transparent border-b focus:outline-none focus:border-current";

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div
            className="text-[11px] tracking-[0.2em] uppercase mb-2"
            style={{ color: COL.muted }}
          >
            Historikk · vises på bolignorge.no
          </div>
          <h2
            className="text-3xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            Tidligere prosjekter og eiendommer
          </h2>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded text-sm transition-all"
          style={{
            background: showAdd ? COL.paperWarm : COL.ink,
            color: showAdd ? COL.inkSoft : COL.paper,
            fontWeight: 600,
            border: showAdd ? `1px solid ${COL.border}` : "none",
          }}
        >
          {showAdd ? (
            <>
              <X size={14} /> Lukk
            </>
          ) : (
            <>
              <Plus size={14} /> Legg til prosjekt
            </>
          )}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          className="mb-4 p-5 border rounded grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <div className="md:col-span-2">
            <label
              className="block text-[10px] tracking-[0.15em] uppercase mb-1"
              style={{ color: COL.muted }}
            >
              År
            </label>
            <input
              type="number"
              value={newRow.year}
              onChange={(e) =>
                setNewRow({ ...newRow, year: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: COL.border }}
            />
          </div>
          <div className="md:col-span-4">
            <label
              className="block text-[10px] tracking-[0.15em] uppercase mb-1"
              style={{ color: COL.muted }}
            >
              Prosjekt
            </label>
            <input
              type="text"
              value={newRow.name}
              onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
              placeholder="f.eks. Steinan Park"
              className="w-full px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: COL.border }}
            />
          </div>
          <div className="md:col-span-3">
            <label
              className="block text-[10px] tracking-[0.15em] uppercase mb-1"
              style={{ color: COL.muted }}
            >
              Lokasjon
            </label>
            <input
              type="text"
              value={newRow.location}
              onChange={(e) =>
                setNewRow({ ...newRow, location: e.target.value })
              }
              placeholder="f.eks. Trondheim"
              className="w-full px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: COL.border }}
            />
          </div>
          <div className="md:col-span-2">
            <label
              className="block text-[10px] tracking-[0.15em] uppercase mb-1"
              style={{ color: COL.muted }}
            >
              Boliger
            </label>
            <input
              type="number"
              value={newRow.units}
              onChange={(e) =>
                setNewRow({ ...newRow, units: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: COL.border }}
            />
          </div>
          <div className="md:col-span-1">
            <button
              onClick={addNewRow}
              className="w-full px-3 py-2 rounded text-sm"
              style={{
                background: COL.ink,
                color: COL.paper,
                fontWeight: 600,
              }}
            >
              Lagre
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="border rounded overflow-hidden"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <div
          className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b text-[10px] tracking-[0.15em] uppercase"
          style={{
            borderColor: COL.border,
            background: COL.paperWarm,
            color: COL.muted,
          }}
        >
          <div className="col-span-2">År</div>
          <div className="col-span-4">Prosjekt</div>
          <div className="col-span-3">Lokasjon</div>
          <div className="col-span-2 text-right">Boliger</div>
          <div className="col-span-1"></div>
        </div>

        {loading ? (
          <div className="p-12 text-center" style={{ color: COL.muted }}>
            <Loader2 size={20} className="animate-spin mx-auto mb-2" />
            <div className="text-sm">Laster…</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm" style={{ color: COL.burgundy }}>
            <AlertCircle size={20} className="mx-auto mb-2" />
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center" style={{ color: COL.muted }}>
            <History size={28} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
            <div className="text-sm">Ingen tidligere prosjekter eller eiendommer ennå.</div>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-12 gap-3 px-5 py-3 border-b items-center hover:bg-black/[0.015] transition-colors"
              style={{ borderColor: COL.borderSoft }}
            >
              <div className="col-span-12 md:col-span-2">
                <input
                  type="number"
                  value={row.year}
                  onChange={(e) =>
                    updateField(row.id, "year", parseInt(e.target.value) || 0)
                  }
                  onBlur={() => persistRow(row.id)}
                  className={inputCls}
                  style={{
                    borderColor: COL.borderSoft,
                    color: COL.gold,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) =>
                    updateField(row.id, "name", e.target.value)
                  }
                  onBlur={() => persistRow(row.id)}
                  className={inputCls}
                  style={{
                    borderColor: COL.borderSoft,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1rem",
                    color: COL.ink,
                  }}
                />
              </div>
              <div className="col-span-8 md:col-span-3">
                <input
                  type="text"
                  value={row.location}
                  onChange={(e) =>
                    updateField(row.id, "location", e.target.value)
                  }
                  onBlur={() => persistRow(row.id)}
                  className={inputCls}
                  style={{ borderColor: COL.borderSoft, color: COL.inkSoft }}
                />
              </div>
              <div className="col-span-3 md:col-span-2 md:text-right">
                <input
                  type="number"
                  value={row.units}
                  onChange={(e) =>
                    updateField(row.id, "units", parseInt(e.target.value) || 0)
                  }
                  onBlur={() => persistRow(row.id)}
                  className={inputCls + " md:text-right"}
                  style={{
                    borderColor: COL.borderSoft,
                    color: COL.gold,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              </div>
              <div className="col-span-1 flex justify-end items-center gap-1">
                {savingId === row.id && (
                  <Loader2 size={14} className="animate-spin" style={{ color: COL.muted }} />
                )}
                <button
                  onClick={() => deleteRow(row.id, row.name)}
                  className="p-2 rounded"
                  style={{ color: COL.burgundy }}
                  title="Slett"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div
        className="mt-4 text-[11px]"
        style={{ color: COL.muted, fontFamily: "'JetBrains Mono', monospace" }}
      >
        Endringer lagres automatisk når du forlater feltet. Listen sorteres etter år
        (nyeste først).
      </div>
    </div>
  );
}

// ---------------- ARKIV PAGE ----------------
const ARCHIVE_CATEGORIES = [
  { id: "manedsrapport", label: "Månedsrapporter", singular: "Månedsrapport" },
  { id: "styregrunnlag", label: "Styregrunnlag", singular: "Styregrunnlag" },
  { id: "protokoll", label: "Protokoller", singular: "Protokoll" },
  { id: "arsregnskap", label: "Årsregnskap", singular: "Årsregnskap" },
];

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "doc";
}

function formatBytes(b) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function ArkivPage({ data, canEdit }) {
  const [activeCat, setActiveCat] = useState("manedsrapport");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [error, setError] = useState(null);

  const loadDocs = async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from("archive_documents")
      .select("*")
      .eq("category", activeCat)
      .order("document_date", { ascending: false, nullsFirst: false })
      .order("uploaded_at", { ascending: false });
    if (err) {
      setError(err.message);
      setDocs([]);
    } else {
      setDocs(rows || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDocs();
  }, [activeCat]);

  const handleDownload = async (doc) => {
    const { data: signed, error: err } = await supabase.storage
      .from("arkiv")
      .createSignedUrl(doc.file_path, 60);
    if (err || !signed?.signedUrl) {
      alert("Kunne ikke åpne fil: " + (err?.message || "ukjent feil"));
      return;
    }
    window.open(signed.signedUrl, "_blank");
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Slette "${doc.title}"? Denne handlingen kan ikke angres.`)) return;
    const { error: storageErr } = await supabase.storage
      .from("arkiv")
      .remove([doc.file_path]);
    if (storageErr) {
      alert("Klarte ikke slette fil: " + storageErr.message);
      return;
    }
    const { error: dbErr } = await supabase
      .from("archive_documents")
      .delete()
      .eq("id", doc.id);
    if (dbErr) {
      alert("Klarte ikke slette metadata: " + dbErr.message);
      return;
    }
    loadDocs();
  };

  const currentLabel = ARCHIVE_CATEGORIES.find((c) => c.id === activeCat)?.label;

  return (
    <div>
      {/* Header with tabs */}
      <div className="mb-6">
        <div
          className="text-[11px] tracking-[0.2em] uppercase mb-2"
          style={{ color: COL.muted }}
        >
          Dokumentarkiv
        </div>
        <h2
          className="text-3xl mb-6"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          {currentLabel}
        </h2>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded" style={{ background: COL.paperWarm }}>
            {ARCHIVE_CATEGORIES.map((c) => {
              const active = c.id === activeCat;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className="px-4 py-2 text-sm rounded transition-all"
                  style={{
                    background: active ? COL.ink : "transparent",
                    color: active ? COL.paper : COL.inkSoft,
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulk(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-sm transition-all border"
                style={{
                  borderColor: COL.border,
                  color: COL.inkSoft,
                  fontWeight: 500,
                }}
                title="Last opp flere PDF-er på én gang med auto-parsing av filnavn"
              >
                <FolderOpen size={14} strokeWidth={2} />
                Bulk-import
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-sm transition-all"
                style={{
                  background: COL.ink,
                  color: COL.paper,
                  fontWeight: 600,
                }}
              >
                <Upload size={14} strokeWidth={2} />
                Last opp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Document list */}
      <div
        className="border rounded"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        {loading ? (
          <div className="p-12 text-center" style={{ color: COL.muted }}>
            <Loader2 size={20} className="animate-spin mx-auto mb-2" />
            <div className="text-sm">Laster dokumenter…</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-sm" style={{ color: COL.burgundy }}>
            <AlertCircle size={20} className="mx-auto mb-2" />
            {error}
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center" style={{ color: COL.muted }}>
            <FolderOpen size={28} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
            <div className="text-sm">
              Ingen {currentLabel?.toLowerCase()} lastet opp ennå.
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: COL.borderSoft }}>
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="px-5 py-4 flex items-center gap-4 hover:bg-black/[0.02] transition-colors"
              >
                <FileText size={18} strokeWidth={1.5} style={{ color: COL.gold }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div
                      className="text-sm"
                      style={{ fontWeight: 600, color: COL.ink }}
                    >
                      {doc.title}
                    </div>
                    {doc.period && (
                      <div className="text-xs" style={{ color: COL.muted }}>
                        · {doc.period}
                      </div>
                    )}
                    {doc.project_ref && (
                      <div className="text-xs" style={{ color: COL.gold }}>
                        · {doc.project_ref}
                      </div>
                    )}
                  </div>
                  <div
                    className="text-[11px] mt-1 flex items-center gap-3"
                    style={{
                      color: COL.muted,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <span>
                      Lastet opp{" "}
                      {new Date(doc.uploaded_at).toLocaleDateString("nb-NO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>{formatBytes(doc.file_size)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 rounded transition-all"
                  style={{ color: COL.inkSoft }}
                  title="Åpne dokument"
                >
                  <ExternalLink size={16} strokeWidth={1.75} />
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 rounded transition-all"
                    style={{ color: COL.burgundy }}
                    title="Slett dokument"
                  >
                    <Trash2 size={16} strokeWidth={1.75} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <ArkivUploadModal
          defaultCategory={activeCat}
          projects={data.projects || []}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            loadDocs();
          }}
        />
      )}
      {showBulk && (
        <ArkivBulkUploadModal
          defaultCategory={activeCat}
          projects={data.projects || []}
          onClose={() => setShowBulk(false)}
          onUploaded={() => {
            setShowBulk(false);
            loadDocs();
          }}
        />
      )}
    </div>
  );
}

function ArkivUploadModal({ defaultCategory, projects, onClose, onUploaded }) {
  const [category, setCategory] = useState(defaultCategory);
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [docDate, setDocDate] = useState("");
  const [projectRef, setProjectRef] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Filen må være en PDF.");
      e.target.value = "";
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError(`Filen er ${(f.size / 1024 / 1024).toFixed(1)} MB. Maks 50 MB.`);
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Velg en PDF-fil først.");
      return;
    }
    if (!title.trim()) {
      setError("Tittel er påkrevd.");
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const id = crypto.randomUUID();
      const slug = slugify(title);
      const path = `${category}/${id}-${slug}.pdf`;

      const { error: uploadErr } = await supabase.storage
        .from("arkiv")
        .upload(path, file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (uploadErr) throw uploadErr;

      const { data: userData } = await supabase.auth.getUser();
      const { error: insertErr } = await supabase
        .from("archive_documents")
        .insert({
          id,
          category,
          title: title.trim(),
          period: period.trim() || null,
          document_date: docDate || null,
          project_ref: projectRef || null,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          uploaded_by: userData?.user?.id || null,
        });
      if (insertErr) {
        // try to clean up storage if metadata insert failed
        await supabase.storage.from("arkiv").remove([path]);
        throw insertErr;
      }
      onUploaded();
    } catch (err) {
      setError(err?.message || String(err));
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(14,26,43,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg border rounded shadow-xl"
        style={{ background: COL.paper, borderColor: COL.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <h3
            className="text-lg"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            Last opp dokument
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10"
            disabled={uploading}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label
              className="block text-[11px] tracking-[0.15em] uppercase mb-1.5"
              style={{ color: COL.muted }}
            >
              Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: COL.border }}
              disabled={uploading}
            >
              {ARCHIVE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.singular}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-[11px] tracking-[0.15em] uppercase mb-1.5"
              style={{ color: COL.muted }}
            >
              Tittel <span style={{ color: COL.burgundy }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="f.eks. Hamang – kjøp av utviklingseiendom"
              className="w-full px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: COL.border }}
              disabled={uploading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-[11px] tracking-[0.15em] uppercase mb-1.5"
                style={{ color: COL.muted }}
              >
                Periode
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="f.eks. Juli – August 2024"
                className="w-full px-3 py-2 border rounded text-sm bg-white"
                style={{ borderColor: COL.border }}
                disabled={uploading}
              />
            </div>
            <div>
              <label
                className="block text-[11px] tracking-[0.15em] uppercase mb-1.5"
                style={{ color: COL.muted }}
              >
                Dato
              </label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm bg-white"
                style={{ borderColor: COL.border }}
                disabled={uploading}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-[11px] tracking-[0.15em] uppercase mb-1.5"
              style={{ color: COL.muted }}
            >
              Knytt til prosjekt (valgfritt)
            </label>
            <select
              value={projectRef}
              onChange={(e) => setProjectRef(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: COL.border }}
              disabled={uploading}
            >
              <option value="">— Ingen —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-[11px] tracking-[0.15em] uppercase mb-1.5"
              style={{ color: COL.muted }}
            >
              PDF-fil <span style={{ color: COL.burgundy }}>*</span>
            </label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="w-full text-sm"
              disabled={uploading}
            />
            {file && (
              <div
                className="text-xs mt-1.5"
                style={{
                  color: COL.muted,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {file.name} · {formatBytes(file.size)}
              </div>
            )}
          </div>

          {error && (
            <div
              className="text-xs p-3 rounded"
              style={{ background: "rgba(139,46,58,0.1)", color: COL.burgundy }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          className="px-6 py-4 border-t flex justify-end gap-2"
          style={{ borderColor: COL.border }}
        >
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm rounded border"
            style={{
              borderColor: COL.border,
              color: COL.inkSoft,
            }}
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !file || !title.trim()}
            className="px-4 py-2 text-sm rounded flex items-center gap-2"
            style={{
              background: uploading ? COL.muted : COL.ink,
              color: COL.paper,
              fontWeight: 600,
              opacity: !file || !title.trim() ? 0.5 : 1,
            }}
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Laster opp…
              </>
            ) : (
              <>
                <Upload size={14} />
                Last opp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Auto-parse archive filename → title, period, document_date
// Examples:
//   "Månedsrapport April 4.5.2020.pdf"  → "Månedsrapport April 2020", "April 2020", 2020-05-04
//   "Månedsrapport Mars 2.4.2020.pdf"   → "Månedsrapport Mars 2020", "Mars 2020", 2020-04-02
//   "Månedsrapport Oktober Bolig Norge 9.11.21.pdf" → "Månedsrapport Oktober 2021", "Oktober 2021", 2021-11-09
function parseArchiveFilename(filename) {
  const cleaned = filename.replace(/\.pdf$/i, "");
  const monthRe = /\b(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\b/i;
  const monthMatch = cleaned.match(monthRe);
  const month = monthMatch ? monthMatch[1].toLowerCase() : "";
  const monthCap = month ? month.charAt(0).toUpperCase() + month.slice(1) : "";

  const yearMatch = cleaned.match(/\b(20\d{2})\b/);
  const explicitYear = yearMatch ? parseInt(yearMatch[1]) : null;

  const dateMatch = cleaned.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  let pubYear = null;
  let pubDate = "";
  if (dateMatch) {
    const dd = parseInt(dateMatch[1]);
    const mm = parseInt(dateMatch[2]);
    if (dateMatch[3]) {
      const yy = dateMatch[3];
      pubYear = yy.length === 2 ? 2000 + parseInt(yy) : parseInt(yy);
      pubDate = `${pubYear}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }
  }

  const year = explicitYear || pubYear || "";
  const period = year ? `${monthCap} ${year}` : monthCap;
  const title = `Månedsrapport ${period}`.trim();
  return { title, period, document_date: pubDate };
}

function ArkivBulkUploadModal({ defaultCategory, projects, onClose, onUploaded }) {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [globalCategory, setGlobalCategory] = useState(defaultCategory);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    const parsed = files
      .filter((f) => f.type === "application/pdf" && f.size <= 50 * 1024 * 1024)
      .map((file) => {
        const meta = parseArchiveFilename(file.name);
        return {
          file,
          title: meta.title || file.name.replace(/\.pdf$/i, ""),
          period: meta.period,
          document_date: meta.document_date,
          project_ref: "",
          status: "pending", // pending | uploading | done | failed
          error: null,
        };
      });
    setItems(parsed);
    e.target.value = "";
  };

  const updateItem = (idx, patch) =>
    setItems((items) =>
      items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );

  const removeItem = (idx) =>
    setItems((items) => items.filter((_, i) => i !== idx));

  const handleUploadAll = async () => {
    setUploading(true);
    const { data: userData } = await supabase.auth.getUser();

    for (let i = 0; i < items.length; i++) {
      // re-read latest items state to get any user edits
      let it;
      setItems((curr) => {
        it = curr[i];
        return curr.map((x, idx) => (idx === i ? { ...x, status: "uploading" } : x));
      });

      // wait one tick so React commits the status update
      await new Promise((r) => setTimeout(r, 10));

      const item = it;
      if (!item) continue;

      try {
        if (!item.title.trim()) throw new Error("Tittel er tom");

        const id = crypto.randomUUID();
        const path = `${globalCategory}/${id}-${slugify(item.title)}.pdf`;

        const { error: upErr } = await supabase.storage
          .from("arkiv")
          .upload(path, item.file, {
            contentType: "application/pdf",
            upsert: false,
          });
        if (upErr) throw upErr;

        const { error: dbErr } = await supabase
          .from("archive_documents")
          .insert({
            id,
            category: globalCategory,
            title: item.title.trim(),
            period: item.period?.trim() || null,
            document_date: item.document_date || null,
            project_ref: item.project_ref || null,
            file_path: path,
            file_name: item.file.name,
            file_size: item.file.size,
            uploaded_by: userData?.user?.id || null,
          });
        if (dbErr) {
          await supabase.storage.from("arkiv").remove([path]);
          throw dbErr;
        }

        updateItem(i, { status: "done" });
      } catch (err) {
        updateItem(i, { status: "failed", error: err?.message || String(err) });
      }
    }

    setUploading(false);
  };

  const allDone = items.length > 0 && items.every((it) => it.status === "done");
  const successCount = items.filter((it) => it.status === "done").length;
  const failCount = items.filter((it) => it.status === "failed").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(14,26,43,0.55)" }}
      onClick={uploading ? undefined : onClose}
    >
      <div
        className="w-full max-w-4xl border rounded shadow-xl flex flex-col"
        style={{ background: COL.paper, borderColor: COL.border, maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <h3
            className="text-lg"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            Bulk-opplasting
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10"
            disabled={uploading}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 border-b flex items-center gap-4" style={{ borderColor: COL.border }}>
          <label
            className="text-[11px] tracking-[0.15em] uppercase"
            style={{ color: COL.muted }}
          >
            Type for alle
          </label>
          <select
            value={globalCategory}
            onChange={(e) => setGlobalCategory(e.target.value)}
            className="px-3 py-2 border rounded text-sm bg-white"
            style={{ borderColor: COL.border }}
            disabled={uploading || items.length > 0}
          >
            {ARCHIVE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.singular}
              </option>
            ))}
          </select>
          {items.length === 0 && (
            <label
              className="ml-auto px-4 py-2 rounded text-sm cursor-pointer flex items-center gap-2"
              style={{
                background: COL.ink,
                color: COL.paper,
                fontWeight: 600,
              }}
            >
              <Upload size={14} /> Velg PDF-er
              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12" style={{ color: COL.muted }}>
              <Upload size={28} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
              <div className="text-sm">
                Velg en eller flere PDF-er. Tittel og dato auto-utfylles fra filnavn der det er mulig.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="border rounded p-3 grid grid-cols-12 gap-2 items-center"
                  style={{
                    borderColor:
                      item.status === "done"
                        ? COL.gold
                        : item.status === "failed"
                          ? COL.burgundy
                          : COL.borderSoft,
                    background:
                      item.status === "done"
                        ? "rgba(166,124,82,0.05)"
                        : item.status === "failed"
                          ? "rgba(139,46,58,0.05)"
                          : COL.paperWarm,
                  }}
                >
                  <div className="col-span-12 md:col-span-1 flex items-center justify-center">
                    {item.status === "done" ? (
                      <Check size={18} style={{ color: COL.gold }} />
                    ) : item.status === "failed" ? (
                      <AlertCircle size={18} style={{ color: COL.burgundy }} />
                    ) : item.status === "uploading" ? (
                      <Loader2 size={18} className="animate-spin" style={{ color: COL.muted }} />
                    ) : (
                      <FileText size={18} style={{ color: COL.muted }} />
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(idx, { title: e.target.value })}
                      placeholder="Tittel"
                      className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                      style={{ borderColor: COL.borderSoft, fontWeight: 600 }}
                      disabled={uploading || item.status === "done"}
                    />
                    <div
                      className="text-[10px] mt-1 truncate"
                      style={{
                        color: COL.muted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      title={item.file.name}
                    >
                      {item.file.name} · {formatBytes(item.file.size)}
                    </div>
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <input
                      type="text"
                      value={item.period}
                      onChange={(e) => updateItem(idx, { period: e.target.value })}
                      placeholder="Periode"
                      className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                      style={{ borderColor: COL.borderSoft }}
                      disabled={uploading || item.status === "done"}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <input
                      type="date"
                      value={item.document_date}
                      onChange={(e) => updateItem(idx, { document_date: e.target.value })}
                      className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                      style={{ borderColor: COL.borderSoft }}
                      disabled={uploading || item.status === "done"}
                    />
                  </div>
                  <div className="col-span-10 md:col-span-1">
                    {item.status === "failed" && (
                      <div
                        className="text-[10px] truncate"
                        style={{ color: COL.burgundy }}
                        title={item.error}
                      >
                        {item.error}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 md:col-span-1 flex justify-end">
                    {item.status === "pending" && !uploading && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 rounded"
                        style={{ color: COL.muted }}
                        title="Fjern fra liste"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <div className="text-xs" style={{ color: COL.muted }}>
            {items.length === 0
              ? ""
              : allDone
                ? `${successCount} av ${items.length} lastet opp`
                : uploading
                  ? `Laster opp… ${successCount} ferdig${failCount > 0 ? `, ${failCount} feilet` : ""}`
                  : `${items.length} klare for opplasting`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm rounded border"
              style={{ borderColor: COL.border, color: COL.inkSoft }}
            >
              {allDone ? "Lukk" : "Avbryt"}
            </button>
            {!allDone && items.length > 0 && (
              <button
                onClick={handleUploadAll}
                disabled={uploading || items.some((it) => !it.title.trim())}
                className="px-4 py-2 text-sm rounded flex items-center gap-2"
                style={{
                  background: COL.ink,
                  color: COL.paper,
                  fontWeight: 600,
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Laster opp…
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Last opp alle ({items.length})
                  </>
                )}
              </button>
            )}
            {allDone && (
              <button
                onClick={() => {
                  onUploaded();
                }}
                className="px-4 py-2 text-sm rounded flex items-center gap-2"
                style={{
                  background: COL.gold,
                  color: COL.paper,
                  fontWeight: 600,
                }}
              >
                <Check size={14} /> Ferdig
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- REPORT PAGE ----------------
function ReportPage({ data, setData, totals }) {
  const [shareGenerating, setShareGenerating] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  // Lokalt input state — vil propageres til data.meta ved onBlur
  const [reportLabel, setReportLabel] = useState(
    `${data.meta?.reportPeriod || ""} ${data.meta?.reportYear || ""}`.trim()
  );

  // Synk lokal input hvis data.meta endrer seg utenfra
  useEffect(() => {
    setReportLabel(
      `${data.meta?.reportPeriod || ""} ${data.meta?.reportYear || ""}`.trim()
    );
  }, [data.meta?.reportPeriod, data.meta?.reportYear]);

  // Skriv tilbake til data.meta — parser "Periode År" til reportPeriod + reportYear
  const commitReportLabel = () => {
    const text = reportLabel.trim();
    if (!text) return;
    const yearMatch = text.match(/(\d{4})\s*$/);
    let newPeriod = text;
    let newYear = data.meta?.reportYear || new Date().getFullYear();
    if (yearMatch) {
      newYear = parseInt(yearMatch[1]);
      newPeriod = text.replace(/\s*\d{4}\s*$/, "").trim();
    }
    if (
      newPeriod !== data.meta?.reportPeriod ||
      newYear !== data.meta?.reportYear
    ) {
      setData((d) => ({
        ...d,
        meta: {
          ...d.meta,
          reportPeriod: newPeriod,
          reportYear: newYear,
        },
      }));
    }
  };

  const handlePrint = () => window.print();
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bolig-norge-rapport-${data.meta.reportYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateShareLink = async () => {
    setShareGenerating(true);
    setShareError(null);
    setShareCopied(false);
    try {
      // Beregn potensielt oppdatert meta basert på pending label-edit
      const text = reportLabel.trim();
      let newPeriod = data.meta?.reportPeriod;
      let newYear = data.meta?.reportYear;
      if (text) {
        const yearMatch = text.match(/(\d{4})\s*$/);
        if (yearMatch) {
          newYear = parseInt(yearMatch[1]);
          newPeriod = text.replace(/\s*\d{4}\s*$/, "").trim();
        } else {
          newPeriod = text;
        }
      }
      const metaChanged =
        newPeriod !== data.meta?.reportPeriod ||
        newYear !== data.meta?.reportYear;

      // Bygg snapshot med oppdatert meta direkte
      const snapshotData = metaChanged
        ? {
            ...data,
            meta: {
              ...data.meta,
              reportPeriod: newPeriod,
              reportYear: newYear,
            },
          }
        : data;

      // Propager meta til React state (autosave persisterer)
      if (metaChanged) {
        setData((d) => ({
          ...d,
          meta: { ...d.meta, reportPeriod: newPeriod, reportYear: newYear },
        }));
      }

      // FORCE-FLUSH: skriv snapshot-data direkte til dashboard_state FØR vi
      // setter share_token-raden, så vi vet at alle pending edits er persistert.
      // Eliminerer race-condition mellom 400ms autosave-debounce og link-generering.
      const flushResult = await storage.set(STORAGE_KEY, JSON.stringify(snapshotData));
      if (!flushResult?.ok) {
        throw new Error(`Kunne ikke lagre data før lenke: ${flushResult?.error || "ukjent feil"}`);
      }

      // 24 bytes = 192 bits entropi → ~32 base64url-tegn
      const bytes = new Uint8Array(24);
      window.crypto.getRandomValues(bytes);
      const token = btoa(String.fromCharCode(...bytes))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");

      const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // +2 dager

      const { error } = await supabase.from("share_tokens").insert({
        token,
        snapshot: snapshotData,
        expires_at: expiresAt.toISOString(),
        report_label: reportLabel || null,
      });
      if (error) throw error;

      const url = `${window.location.origin}/styreportal/share/${token}`;
      setShareLink({ url, expiresAt });
    } catch (e) {
      console.error("[share] generate failed:", e.message);
      setShareError(e.message || "Klarte ikke lage lenke");
    } finally {
      setShareGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink?.url) return;
    try {
      await navigator.clipboard.writeText(shareLink.url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      console.error("[share] copy failed:", e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Print stylesheet */}
      <style>{`
        @media screen {
          .print-only { display: none !important; }
        }
        @media print {
          /* DEFAULT PAGE — body content with footer */
          @page {
            size: A4;
            margin: 14mm 12mm 16mm 12mm;
            @bottom-left {
              content: "Bolig Norge AS — Konfidensielt";
              font-family: 'JetBrains Mono', monospace;
              font-size: 8.5px;
              letter-spacing: 0.08em;
              color: #8A8270;
              padding-bottom: 6mm;
            }
            @bottom-right {
              content: counter(page) " / " counter(pages);
              font-family: 'JetBrains Mono', monospace;
              font-size: 8.5px;
              color: #8A8270;
              padding-bottom: 6mm;
            }
          }
          /* COVERPAGE — full-bleed, no margins, no footer */
          @page coverpage {
            size: A4;
            margin: 0;
            @bottom-left  { content: ""; }
            @bottom-right { content: ""; }
          }

          html, body {
            background: #F6F1E7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide site chrome */
          .print\\:hidden,
          aside,
          body header:not([data-report="keep"]),
          body nav:not([data-report="keep"]),
          body footer:not([data-report="keep"]) {
            display: none !important;
          }

          /* Reset main padding */
          main { padding: 0 !important; margin: 0 !important; }

          /* Show / hide print-only elements */
          .screen-only { display: none !important; }
          .print-only { display: block !important; }

          /* ---------- COVER & CLOSING ---------- */
          .report-cover,
          .report-closing {
            page: coverpage !important;
            box-sizing: border-box !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 26mm 22mm 22mm 22mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #0E1A2B !important;
            color: #F6F1E7 !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .report-cover {
            break-after: page !important;
            page-break-after: always !important;
          }
          .report-closing {
            display: flex !important;
            break-before: page !important;
            page-break-before: always !important;
          }
          .report-cover h1 { font-size: 4.4rem !important; line-height: 1.02 !important; }

          /* ---------- CONTENT FLOW ---------- */
          .report-content {
            padding: 0 !important;
            margin: 0 !important;
            background: #F6F1E7 !important;
          }
          .report-content > * + * { margin-top: 9mm !important; }

          /* Section breaks */
          section { break-inside: auto; }
          h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
          p { orphans: 3; widows: 3; }

          /* Tables don't split */
          table, .no-break, [data-no-break] {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Project blocks */
          .project-block { break-inside: auto !important; page-break-inside: auto !important; }
          .project-block-header {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          .project-block img {
            max-height: 7.5cm !important;
            object-fit: cover;
          }
          .project-block + .project-block { margin-top: 8mm !important; }

          /* IRR always new page */
          .irr-section {
            break-before: page !important;
            page-break-before: always !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          /* Capital summary stays together */
          .capital-summary {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Chapter breaks */
          .chapter-break {
            break-before: page !important;
            page-break-before: always !important;
          }

          /* Recharts fit */
          .recharts-responsive-container,
          .recharts-wrapper,
          svg.recharts-surface {
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
          }

          img { max-width: 100% !important; }

          .report-screen-footer { display: none !important; }
          /* Show closing card only in print, not on screen */
          .report-closing { display: flex !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3 border print:hidden"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <div className="text-xs" style={{ color: COL.muted }}>
          Forhåndsvisning av månedsrapport — klar for utskrift / PDF.
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border"
            style={{ borderColor: COL.border, color: COL.inkSoft }}
          >
            <Download size={12} /> Eksporter data (JSON)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            style={{ background: COL.ink, color: COL.paper }}
          >
            <FileText size={12} /> Skriv ut / PDF
          </button>
        </div>
      </div>

      {/* Delingslenke */}
      <div
        className="px-5 py-5 border print:hidden"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <div
              className="text-[10px] tracking-[0.2em] uppercase mb-1"
              style={{ color: COL.muted }}
            >
              Del rapport med styret
            </div>
            <h3
              className="text-base"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              Lag delingslenke (gyldig i 2 dager)
            </h3>
            <p
              className="text-[12px] mt-1 max-w-2xl"
              style={{ color: COL.muted, lineHeight: 1.5 }}
            >
              Genererer en uknekkelig lenke som styremedlemmer kan bruke for å se
              en frosset kopi av rapporten uten å logge inn. Lenken er
              legitimasjonen — be styret om ikke å videresende. Etter 2 dager
              må de logge inn på vanlig vis.
            </p>
          </div>
          <button
            onClick={generateShareLink}
            disabled={shareGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap"
            style={{
              background: COL.ink,
              color: COL.paper,
              opacity: shareGenerating ? 0.6 : 1,
              cursor: shareGenerating ? "wait" : "pointer",
            }}
          >
            {shareGenerating ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
            {shareGenerating ? "Genererer …" : "Generer lenke"}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <label
            className="text-[10px] tracking-[0.2em] uppercase whitespace-nowrap"
            style={{ color: COL.muted }}
          >
            Rapportperiode
          </label>
          <input
            type="text"
            value={reportLabel}
            onChange={(e) => setReportLabel(e.target.value)}
            onBlur={commitReportLabel}
            placeholder="F.eks. April – Juni 2026"
            className="flex-1 p-2 text-[13px] border"
            style={{
              background: COL.paper,
              borderColor: COL.border,
              color: COL.inkSoft,
            }}
            title="Oppdaterer både rapport-overskriften og merkelappen for delingslenken"
          />
        </div>

        {shareError && (
          <div
            className="text-[12px] py-2 px-3 mt-3 border-l-2"
            style={{
              background: "rgba(139, 46, 58, 0.06)",
              borderLeftColor: COL.burgundy,
              color: COL.burgundy,
            }}
          >
            {shareError}
          </div>
        )}

        {shareLink && (
          <div
            className="mt-4 p-4 border"
            style={{ borderColor: COL.border, background: COL.paper }}
          >
            <div
              className="text-[10px] tracking-[0.2em] uppercase mb-2"
              style={{ color: COL.gold }}
            >
              Lenke generert · gyldig til{" "}
              {shareLink.expiresAt.toLocaleString("nb-NO", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink.url}
                onClick={(e) => e.target.select()}
                className="flex-1 p-2 text-[12px] border"
                style={{
                  background: COL.paperWarm || "#FBF5E8",
                  borderColor: COL.border,
                  color: COL.ink,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap"
                style={{
                  background: shareCopied ? COL.sage || "#3F6B57" : COL.ink,
                  color: COL.paper,
                }}
              >
                {shareCopied ? <Check size={12} /> : <Copy size={12} />}
                {shareCopied ? "Kopiert" : "Kopier"}
              </button>
            </div>
            <div className="text-[11px] mt-3" style={{ color: COL.muted }}>
              Lim inn i e-post til styret. Lenken viser eksakt det som ligger i
              rapporten nå — endringer i dashbordet etterpå påvirker ikke denne
              kopien.
            </div>
          </div>
        )}
      </div>

      {/* Report preview */}
      <div
        className="shadow-sm"
        style={{ background: COL.paper, border: `1px solid ${COL.border}` }}
      >
        {/* Cover */}
        <div
          className="report-cover px-16 py-20 flex flex-col justify-between"
          style={{
            background: COL.ink,
            color: COL.paper,
            minHeight: "420px",
          }}
        >
          {/* Top: confidentiality + logo */}
          <div className="flex justify-between items-start">
            <div
              className="text-[10px] tracking-[0.28em] uppercase"
              style={{ opacity: 0.5 }}
            >
              Konfidensielt — kun for interne formål
            </div>
            <BNLogo light height={36} />
          </div>

          {/* Middle: title block */}
          <div className="mt-12">
            <div
              className="mb-5"
              style={{
                width: 56,
                height: 1.5,
                background: COL.goldSoft,
                opacity: 0.85,
              }}
            />
            <div
              className="text-[11px] tracking-[0.36em] uppercase mb-4"
              style={{ opacity: 0.72, color: COL.goldSoft }}
            >
              Månedsrapport
            </div>
            <h1
              className="text-7xl mb-3"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 400,
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
              }}
            >
              {data.meta.reportPeriod}
            </h1>
            <div
              className="text-3xl"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 300,
                opacity: 0.82,
                letterSpacing: "-0.01em",
              }}
            >
              {data.meta.companyName} · {data.meta.reportYear}
            </div>
          </div>

          {/* Bottom: metadata stamp — print only */}
          <div
            className="hidden print:flex justify-between items-end text-[10px] tracking-[0.22em] uppercase"
            style={{ opacity: 0.45, fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span>
              Generert ·{" "}
              {new Date().toLocaleDateString("nb-NO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>Styremateriale</span>
          </div>
        </div>

        {/* Content */}
        <div className="report-content px-16 py-12 space-y-12">
          {/* Nøkkeltall */}
          <section>
            <SectionHeader num="01" title="Nøkkeltall" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-6" style={{ background: COL.border }}>
              <ReportKPI
                label="Total porteføljeverdi"
                value={fmtMrd(totals.omsetningJustert)}
                sub={`Brutto: ${fmtMrd(totals.omsetning)}`}
              />
              <ReportKPI
                label="Dekningsbidrag"
                value={fmtMrd(totals.dbJustert)}
                sub={`Brutto: ${fmtMrd(totals.db)}`}
              />
              <ReportKPI label="DB-margin" value={fmtPct(totals.margin)} />
              <ReportKPI label="Boliger u. utvikling" value={fmtNOK(totals.units) + "+"} />
            </div>
            <div
              className="mt-2 text-[10px] tracking-[0.15em] uppercase text-center"
              style={{ color: COL.muted }}
            >
              Tall justert for eierandeler
            </div>
          </section>

          {/* Marked & outlook */}
          <section>
            <SectionHeader num="02" title="Marked & outlook" />
            <div className="mt-4 space-y-6">
              <div
                className="text-[14px] leading-[1.7] whitespace-pre-line"
                style={{ color: COL.inkSoft }}
              >
                {data.market.outlook}
              </div>
              {data.market.imageUrl && (
                <div>
                  <img
                    src={data.market.imageUrl}
                    alt={data.market.imageCaption || "Markedsstatistikk"}
                    className="w-full h-auto"
                    style={{
                      border: `1px solid ${COL.border}`,
                      maxHeight: 500,
                      objectFit: "contain",
                    }}
                  />
                  {data.market.imageCaption && (
                    <div
                      className="mt-2 text-[11px]"
                      style={{
                        color: COL.muted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {data.market.imageCaption}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Prosjekt for prosjekt */}
          <div className="chapter-break">
            <ProjectByProjectSection data={data} num="03" />
          </div>

          {/* Portefølje */}
          <section>
            <SectionHeader num="04" title="Porteføljeoversikt" />
            <table className="w-full text-sm mt-4">
              <thead>
                <tr style={{ borderBottom: `2px solid ${COL.ink}` }}>
                  {["Prosjekt", "Boliger", "Status", "Omsetning", "DB", "Partner", "Bank"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2.5 text-[10px] tracking-[0.15em] uppercase ${
                          i >= 1 && i <= 4 && i !== 2 ? "text-right" : "text-left"
                        }`}
                        style={{ color: COL.muted }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.projects.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: `1px solid ${COL.borderSoft}` }}
                  >
                    <td className="px-3 py-2.5">
                      <div
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {p.name}
                      </div>
                      <div className="text-[10px]" style={{ color: COL.muted }}>
                        {p.location}
                      </div>
                    </td>
                    <td
                      className="px-3 py-2.5 text-right"
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                    >
                      {p.units > 0 ? p.units : "—"}
                    </td>
                    <td
                      className="px-3 py-2.5 text-xs"
                      style={{ color: COL.inkSoft }}
                    >
                      {p.statusShort}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right"
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                    >
                      {p.omsetning > 0 ? fmtMrd(p.omsetning) : "—"}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        color: COL.gold,
                      }}
                    >
                      {p.db > 0 ? fmtMrd(p.db) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {p.partnerShare && (
                        <span style={{ color: COL.muted }}>{p.partnerShare}% </span>
                      )}
                      {p.partner || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs">{p.bank || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Pipeline — flyttet før NAV */}
          {(data.pipeline?.length || 0) > 0 && (
            <section>
              <SectionHeader num="05" title="Pipeline · case i vurdering" />
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COL.ink}` }}>
                    {["Pri", "Prosjekt", "Lokasjon", "Størrelse", "Status", "Kommentar"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-[10px] tracking-[0.15em] uppercase text-left"
                          style={{ color: COL.muted }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.pipeline
                    .filter(
                      (c) =>
                        c.status === "Pågående" || c.status === "Avventende"
                    )
                    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
                    .map((c) => (
                      <tr
                        key={c.id}
                        style={{ borderBottom: `1px solid ${COL.borderSoft}` }}
                      >
                        <td className="px-3 py-2.5">
                          <PriorityBadge priority={c.priority} />
                        </td>
                        <td
                          className="px-3 py-2.5"
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {c.name}
                        </td>
                        <td
                          className="px-3 py-2.5 text-xs"
                          style={{ color: COL.inkSoft }}
                        >
                          {c.location}
                        </td>
                        <td
                          className="px-3 py-2.5 text-xs"
                          style={{
                            color: COL.gold,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {c.size || "—"}
                        </td>
                        <td
                          className="px-3 py-2.5 text-xs"
                          style={{ color: COL.inkSoft }}
                        >
                          {c.status}
                        </td>
                        <td
                          className="px-3 py-2.5 text-xs"
                          style={{ color: COL.muted, maxWidth: 250 }}
                        >
                          {c.comment || "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Verdijustert egenkapital */}
          <section>
            <SectionHeader num="06" title="Verdijustert egenkapital" />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-px" style={{ background: COL.border }}>
              <ReportKPI label="Bokført EK" value={fmtNOK(totals.bokfortEK) + " m"} />
              <ReportKPI label="Merverdier eiendom" value={fmtNOK(totals.merverdier) + " m"} />
              <ReportKPI label="NAV" value={fmtNOK(totals.nav) + " m"} />
            </div>
            <div
              className="mt-3 text-[12px] leading-[1.6]"
              style={{ color: COL.inkSoft, maxWidth: "65ch" }}
            >
              Verdijustert egenkapital er sum av bokført egenkapital og merverdier
              i tomter justert for våre eierandeler.
            </div>
          </section>

          {/* Selskapstall — EK-binding chart + tabell + IRR */}
          {(data.financials?.length || 0) > 0 && (
            <section className="chapter-break">
              <SectionHeader num="07" title="Selskapstall" />
              <div className="mt-4">
                <CapitalSummary financials={data.financials || []} />
              </div>
              <div className="mt-6">
                <div
                  className="text-[10px] tracking-[0.2em] uppercase mb-2"
                  style={{ color: COL.muted }}
                >
                  År for år (mNOK)
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COL.ink}` }}>
                      {[
                        "År",
                        "Årsresultat",
                        "Utbytte",
                        "Bokført EK",
                        "Gjeld",
                        "Akk. resultat",
                        "Akk. utbytte",
                        "Utd.grad",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={`px-3 py-2.5 text-[10px] tracking-[0.15em] uppercase ${
                            i === 0 ? "text-left" : "text-right"
                          }`}
                          style={{ color: COL.muted }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let accRes = 0;
                      let accDiv = 0;
                      return (data.financials || []).map((r) => {
                        if (r.result !== null && !isNaN(r.result))
                          accRes += r.result;
                        if (r.dividend !== null && !isNaN(r.dividend))
                          accDiv += r.dividend;
                        const utd =
                          accRes > 0 ? (accDiv / accRes) * 100 : null;
                        return (
                          <tr
                            key={r.year}
                            style={{
                              borderBottom: `1px solid ${COL.borderSoft}`,
                            }}
                          >
                            <td
                              className="px-3 py-2.5"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {r.year}
                              {r.projected && (
                                <span
                                  className="ml-1 text-[10px]"
                                  style={{ color: COL.gold }}
                                >
                                  *
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.result !== null && !isNaN(r.result) ? fmtNOK(r.result) : "—"}</td>
                            <td className="px-3 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.dividend !== null && !isNaN(r.dividend) ? fmtNOK(r.dividend) : "—"}</td>
                            <td className="px-3 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.ek !== null && !isNaN(r.ek) ? fmtNOK(r.ek) : "—"}</td>
                            <td className="px-3 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COL.muted }}>{fmtNOK(r.gjeld ?? 0)}</td>
                            <td className="px-3 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COL.muted }}>{fmtNOK(accRes)}</td>
                            <td className="px-3 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COL.muted }}>{fmtNOK(accDiv)}</td>
                            <td
                              className="px-3 py-2.5 text-right"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 13,
                              }}
                            >
                              {utd !== null
                                ? utd.toFixed(1).replace(".", ",") + " %"
                                : "—"}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
                <div
                  className="mt-2 text-[11px]"
                  style={{ color: COL.muted }}
                >
                  * Foreløpig år. Utdelingsgrad akk. = akk. utbytte / akk.
                  resultat t.o.m. rapportert år.
                </div>
              </div>
              <IRRSection financials={data.financials} totals={totals} />
            </section>
          )}
        </div>

        {/* Closing — print-only proper signoff */}
        <div
          className="report-closing px-16 py-20 flex flex-col justify-between"
          style={{
            background: COL.ink,
            color: COL.paper,
            display: "none",
          }}
        >
          <div className="flex justify-between items-start">
            <div
              className="text-[10px] tracking-[0.28em] uppercase"
              style={{ opacity: 0.5 }}
            >
              Rapport slutt
            </div>
            <BNLogo light height={32} />
          </div>

          <div className="my-12">
            <div
              className="mb-5"
              style={{
                width: 56,
                height: 1.5,
                background: COL.goldSoft,
                opacity: 0.85,
              }}
            />
            <div
              className="text-[11px] tracking-[0.36em] uppercase mb-4"
              style={{ opacity: 0.72, color: COL.goldSoft }}
            >
              Månedsrapport · {data.meta.reportPeriod} {data.meta.reportYear}
            </div>
            <div
              className="text-4xl mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 400,
                letterSpacing: "-0.02em",
              }}
            >
              {data.meta.companyName}
            </div>
            <div
              className="text-[13px] leading-[1.75] max-w-md"
              style={{ opacity: 0.72 }}
            >
              Dette dokumentet er konfidensielt styremateriale og skal ikke
              videreformidles uten skriftlig samtykke. Tall og prognoser er
              basert på interne registreringer på rapport-tidspunkt og kan
              endre seg.
            </div>
          </div>

          <div
            className="flex justify-between items-end text-[10px] tracking-[0.22em] uppercase"
            style={{ opacity: 0.45, fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span>
              Generert ·{" "}
              {new Date().toLocaleDateString("nb-NO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>Styremateriale</span>
          </div>
        </div>

        {/* Screen-only footer (hidden in print) */}
        <div
          className="report-screen-footer px-16 py-5 border-t flex justify-between items-center"
          style={{ borderColor: COL.border, color: COL.muted, fontSize: 11 }}
        >
          <span>Konfidensielt — kun for interne formål</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Månedsrapport {data.meta.reportPeriod}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- PROSJEKT FOR PROSJEKT (gjenbrukbar) ----------------
function ProjectByProjectSection({ data, num }) {
  const projects = data.projects || [];
  if (projects.length === 0) return null;
  return (
    <section>
      <SectionHeader num={num} title="Prosjekt for prosjekt" />
      <div className="mt-6 space-y-8 print:space-y-6">
        {projects.map((p) => {
          const sold = Number(p.unitsSold) || 0;
          const total = Number(p.units) || 0;
          const pct = total > 0 ? Math.round((sold / total) * 100) : 0;
          return (
            <div
              key={p.id}
              className="pb-8 print:pb-6 project-block"
              style={{ borderBottom: `1px solid ${COL.borderSoft}` }}
            >
              <div className="project-block-header">
                {/* Header: name + location with gold dot accent */}
                <div className="mb-4 flex items-baseline gap-3">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: COL.gold,
                      display: "inline-block",
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                  <div>
                    <h4
                      className="text-[26px] print:text-[22px] leading-none mb-1"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 500,
                        color: COL.ink,
                        letterSpacing: "-0.012em",
                      }}
                    >
                      {p.name}
                    </h4>
                    <div
                      className="text-[10px] tracking-[0.18em] uppercase"
                      style={{
                        color: COL.muted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {p.location}
                    </div>
                  </div>
                </div>

                {/* Image + facts in 2 columns */}
                <div
                  className={
                    p.imageUrl
                      ? "grid grid-cols-1 md:grid-cols-2 gap-6 mb-5"
                      : "mb-5"
                  }
                >
                  {p.imageUrl && (
                    <div className="overflow-hidden">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-auto"
                        style={{
                          display: "block",
                          aspectRatio: "16 / 10",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                  <div className="text-xs">
                    <FactRow
                      label="Antall boliger"
                      value={total > 0 ? total : "—"}
                    />
                    {sold > 0 && total > 0 && (
                      <FactRow label="Solgt" value={`${sold} (${pct} %)`} />
                    )}
                    {sold > 0 && total > 0 && (
                      <FactRow
                        label="Ledig"
                        value={Math.max(0, total - sold)}
                      />
                    )}
                    {p.kvm > 0 && (
                      <FactRow label="BRA-S" value={fmtNOK(p.kvm) + " kvm"} />
                    )}
                    {p.byggestart && (
                      <FactRow
                        label="Byggeperiode"
                        value={`${p.byggestart}–${p.byggeslutt || "?"}`}
                      />
                    )}
                    <FactRow label="Status" value={p.statusShort} />
                    <FactRow
                      label="Omsetning"
                      value={p.omsetning > 0 ? fmtMrd(p.omsetning) : "—"}
                    />
                    <FactRow
                      label="DB"
                      value={p.db > 0 ? fmtMrd(p.db) : "—"}
                    />
                    {p.partner && (
                      <FactRow
                        label="Partner"
                        value={
                          (p.partnerShare ? p.partnerShare + "% " : "") +
                          p.partner
                        }
                      />
                    )}
                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-3 text-[11px] tracking-[0.06em]"
                        style={{ color: COL.gold, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {p.website.replace(/^https?:\/\//, "")} ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Status — full width below */}
              <div>
                <div
                  className="text-[9.5px] tracking-[0.22em] uppercase mb-2"
                  style={{ color: COL.gold, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Status
                </div>
                <p
                  className="text-[14px] leading-[1.7] whitespace-pre-line"
                  style={{ color: COL.inkSoft, maxWidth: "85ch" }}
                >
                  {p.statusLong || (
                    <em style={{ color: COL.muted }}>Ingen statustekst.</em>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({ num, title }) {
  return (
    <div
      className="flex items-baseline gap-4 pb-3"
      style={{ borderBottom: `1px solid ${COL.border}` }}
    >
      <span
        className="text-[10px] tracking-[0.28em] uppercase"
        style={{ color: COL.gold, fontFamily: "'JetBrains Mono', monospace" }}
      >
        §{num}
      </span>
      <h2
        className="text-[26px]"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          letterSpacing: "-0.012em",
          color: COL.ink,
        }}
      >
        {title}
      </h2>
    </div>
  );
}
function ReportKPI({ label, value, sub }) {
  return (
    <div className="px-6 py-6" style={{ background: COL.paper }}>
      <div
        className="text-[9.5px] tracking-[0.22em] uppercase mb-3"
        style={{ color: COL.muted, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </div>
      <div
        className="text-[30px] leading-none"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          color: COL.ink,
          letterSpacing: "-0.022em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-2.5 text-[9.5px] tracking-[0.18em] uppercase"
          style={{ color: COL.muted, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
function FactRow({ label, value }) {
  return (
    <div
      className="flex justify-between items-baseline gap-4"
      style={{ borderBottom: `1px dotted ${COL.borderSoft}`, padding: "5px 0" }}
    >
      <span
        className="text-[9.5px] tracking-[0.14em] uppercase"
        style={{ color: COL.muted, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: COL.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function Admin() {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (profile?.role !== "admin") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'JetBrains Mono', monospace", color: "#0E1A2B" }}>
        Krever admin-tilgang.
      </div>
    );
  }
  return (
    <AdminDashboard />
  );
}
