import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  X,
  Loader2,
  Target,
  ExternalLink,
  Eye,
  RefreshCw,
  ShieldCheck,
  LogOut,
  Download,
  FileText,
  Archive,
  AlertCircle,
  FolderOpen,
  Menu,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

// Storage key — same as admin dashboard so board portal mirrors live data
// In production this would be a shared backend (e.g. Supabase) with role-based access:
// admin writes, board reads via "published" snapshot
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
      const { error } = await supabase
        .from("dashboard_state")
        .upsert({
          id: "main",
          data: JSON.parse(value),
          updated_by: userData?.user?.id ?? null,
        });
      if (error) {
        console.error("[dashboard] save error:", error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error("[dashboard] save failed:", e.message);
      return false;
    }
  },
};

// ---------------- FALLBACK SEED ----------------
// Used only if storage is empty (e.g. first-time load by board member)
const FALLBACK_SEED = {
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
        "Kommuneplanen ble vedtatt 17.12, og området er avsatt til næring og industri i tråd med våre innspill. Arealet utgjør totalt ca. 163 000 kvm.",
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

// ---------------- HELPERS ----------------
const fmtNOK = (n) => {
  if (n === null || n === undefined || n === "" || isNaN(n)) return "—";
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
// Recharts ResponsiveContainer relies on JS-measured parent
// dimensions and frequently renders as a 0px SVG in browser
// print, leaving only the legend visible. These pure-SVG
// components always render at their declared viewBox size and
// scale via CSS, so they survive print reliably. They're shown
// alongside Recharts: Recharts on screen, SVG on print.
// ============================================================

// Horizontal grouped bar chart — used for "Omsetning & DB per prosjekt"
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

  // Tick marks (nice round numbers)
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
      {/* Tick labels (above chart) */}
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

      {/* Rows */}
      {data.map((row, i) => {
        const y0 = headerH + i * rowH;
        // bars: stacked vertically within row
        const barsTotalH = series.length * barH + (series.length - 1) * gap;
        const barsY0 = y0 + (rowH - barsTotalH) / 2;
        return (
          <g key={row.name}>
            {/* Row label */}
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
                <g key={s}>
                  <rect
                    x={padX + labelW}
                    y={by}
                    width={Math.max(0.5, w)}
                    height={barH}
                    fill={colors[s]}
                  />
                </g>
              );
            })}
            {/* Right-side total */}
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

      {/* Legend (bottom) */}
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

// Vertical grouped bar chart — used for "Årlig flyt — resultat og utbytte"
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

  // Y-axis ticks (4 ticks)
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
      {/* Y grid + labels */}
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

      {/* Bars */}
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

      {/* Legend */}
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

// Line chart — used for "Akkumulert — bokført EK og kumulative tall"
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
        const x = padL + i * xStep;
        const y = yScale(v);
        return { x, y };
      })
      .filter(Boolean);
    if (pts.length === 0) return "";
    return (
      "M" +
      pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")
    );
  };

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH + 32}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Y grid */}
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

      {/* X labels */}
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

      {/* Lines */}
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

      {/* Dots for first series only (the main EK line) */}
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

      {/* Legend */}
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

function niceStep(raw) {
  if (raw <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / exp;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * exp;
}

// ---------------- ROOT APP ----------------
function StyreportalCore({ data, mode = "auth", profile, signOut, expiresAt, lastSync, onReload }) {
  const [page, setPage] = useState("dashboard");
  const [viewingProject, setViewingProject] = useState(null);
  const [viewingCase, setViewingCase] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totals = computeTotals(data);

  const NAV = [
    { id: "dashboard", label: "Oversikt", icon: LayoutDashboard },
    { id: "portfolio", label: "Portefølje", icon: Building2 },
    { id: "pipeline", label: "Pipeline", icon: Target },
    { id: "financials", label: "Selskapstall", icon: TrendingUp },
    // Arkiv krever autentisert lesetilgang — skjules i share-modus
    ...(mode === "share"
      ? []
      : [{ id: "archive", label: "Arkiv", icon: Archive }]),
  ];

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
          body header:not([data-report="keep"]),
          body nav:not([data-report="keep"]),
          body footer:not([data-report="keep"]),
          aside,
          .print\\:hidden { display: none !important; }

          /* Reset main padding so cover can fill */
          main { padding: 0 !important; margin: 0 !important; background: #F6F1E7 !important; }

          /* Show / hide print-only elements */
          .screen-only { display: none !important; }
          .print-only { display: block !important; }

          /* ---------- COVER & CLOSING ---------- */
          .cover-hero,
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
          .cover-hero {
            break-after: page !important;
            page-break-after: always !important;
          }
          .report-closing {
            break-before: page !important;
            page-break-before: always !important;
          }
          .cover-hero h1 { font-size: 4.4rem !important; line-height: 1.02 !important; }
          .cover-hero .cover-meta { font-size: 1.65rem !important; }

          /* ---------- CONTENT FLOW ---------- */
          .report-flow { padding: 0 !important; margin: 0 !important; }
          .report-flow > * + * { margin-top: 9mm !important; }
          .report-flow > section { break-inside: auto; }

          /* Section headers: keep with their first content */
          h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
          p { orphans: 3; widows: 3; }

          /* Tables don't split */
          table, .no-break, [data-no-break] {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Project block: header+facts together, narrative can flow */
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
          /* Spacing between consecutive projects: tighter */
          .project-block + .project-block { margin-top: 8mm !important; }

          /* IRR section — always new page, never split */
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

          /* Chapter breaks (§03 Prosjekt for prosjekt, §05 Selskapstall) */
          .chapter-break {
            break-before: page !important;
            page-break-before: always !important;
          }

          /* Recharts: constrain in print to avoid overflow; we also render
             print-safe SVG fallbacks for the most fragile charts */
          .recharts-responsive-container,
          .recharts-wrapper,
          svg.recharts-surface {
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
          }

          /* Image rules */
          img { max-width: 100% !important; }

          /* Old back-cover band — hide */
          .report-back-cover { display: none !important; }
        }
      `}</style>
      <div className="hidden md:flex print:hidden items-center" style={{ position: "fixed", top: 0, right: 0, zIndex: 100, padding: "12px 20px", background: COL.paper, borderBottom: `1px solid ${COL.border}`, borderLeft: `1px solid ${COL.border}`, borderBottomLeftRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, gap: 16 }}>
        {mode === "share" ? (
          <span style={{ color: COL.gold }}>
            FROSSET KOPI{expiresAt ? ` · GYLDIG TIL ${new Date(expiresAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}` : ""}
          </span>
        ) : (
          <span style={{ color: COL.muted }}>{profile?.full_name || profile?.email}</span>
        )}
        <button onClick={() => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `bolig-norge-styreportal-${new Date().toISOString().split("T")[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }} style={{ display: "flex", alignItems: "center", gap: 6, color: COL.ink, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <Download size={12} /> JSON
        </button>
        <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, color: COL.ink, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <FileText size={12} /> PDF
        </button>
        {mode === "share" ? (
          <a href="/logg-inn" style={{ display: "flex", alignItems: "center", gap: 6, color: COL.ink, textDecoration: "none" }}>
            <ShieldCheck size={12} /> LOGG INN
          </a>
        ) : (
          <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: 6, color: COL.ink, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
            <LogOut size={12} /> LOGG UT
          </button>
        )}
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
        <div className="px-6 py-7 border-b flex items-center justify-between" style={{ borderColor: COL.border }}>
          <div
            className="flex items-center gap-1.5 text-[11px] tracking-[0.25em] uppercase"
            style={{ color: COL.gold }}
          >
            <ShieldCheck size={12} strokeWidth={2} />
            <span style={{ fontWeight: 600 }}>Styreportal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded"
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

        {/* Mobile-only actions (replaces hidden floating chip on mobile) */}
        <div className="md:hidden mx-3 mb-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `bolig-norge-styreportal-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[11px] border"
            style={{ borderColor: COL.border, color: COL.ink, fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Download size={12} /> JSON
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[11px] border"
            style={{ borderColor: COL.border, color: COL.ink, fontFamily: "'JetBrains Mono', monospace" }}
          >
            <FileText size={12} /> PDF
          </button>
          {mode === "share" ? (
            <a
              href="/logg-inn"
              className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[11px]"
              style={{ background: COL.ink, color: COL.paper, fontFamily: "'JetBrains Mono', monospace", textDecoration: "none" }}
            >
              <ShieldCheck size={12} /> LOGG INN
            </a>
          ) : (
            <button
              onClick={signOut}
              className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[11px]"
              style={{ background: COL.ink, color: COL.paper, fontFamily: "'JetBrains Mono', monospace" }}
            >
              <LogOut size={12} /> LOGG UT
            </button>
          )}
        </div>

        {/* Read-only banner */}
        <div
          className="mx-3 mb-3 px-3 py-3 border"
          style={{ borderColor: COL.border, background: COL.card }}
        >
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase mb-1.5" style={{ color: COL.muted }}>
            <Eye size={11} />
            <span>Kun lesetilgang</span>
          </div>
          <div className="text-[11px] leading-[1.5]" style={{ color: COL.inkSoft }}>
            Du leser konfidensielt styremateriale. Innhold og tall vedlikeholdes av daglig leder.
          </div>
        </div>

        <div
          className="px-6 py-4 border-t text-[11px]"
          style={{ borderColor: COL.border, color: COL.muted }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span>{data.meta.companyName}</span>
          </div>
          {mode === "share" ? (
            <div
              className="flex items-center gap-1.5 text-[10px]"
              style={{ color: COL.gold }}
            >
              <ShieldCheck size={9} />
              <span>
                Frosset kopi{lastSync ? ` · ${new Date(lastSync).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}` : ""}
              </span>
            </div>
          ) : (
            <button
              onClick={onReload}
              className="flex items-center gap-1.5 text-[10px] hover:opacity-100 opacity-70 transition-opacity"
              style={{ color: COL.muted }}
            >
              <RefreshCw size={9} />
              <span>
                Sist synkronisert{" "}
                {lastSync
                  ? lastSync.toLocaleTimeString("nb-NO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </button>
          )}
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
          {mode === "share" ? (
            <span
              className="text-[9px] tracking-[0.15em] uppercase"
              style={{ color: COL.gold, fontFamily: "'JetBrains Mono', monospace" }}
            >
              Frosset
            </span>
          ) : (
            <span className="w-6" />
          )}
        </div>

        {page !== "dashboard" && (
          <header
            data-report="keep"
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
              <span
                className="text-xs"
                style={{
                  color: COL.muted,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {new Date(data.meta.reportDate).toLocaleDateString("nb-NO", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </header>
        )}
        <div className="px-4 py-6 md:px-10 md:py-8">
          {page === "dashboard" && (
            <DashboardPage data={data} totals={totals} />
          )}
          {page === "portfolio" && (
            <PortfolioPage data={data} onView={setViewingProject} />
          )}
          {page === "pipeline" && (
            <PipelinePage data={data} onView={setViewingCase} />
          )}
          {page === "financials" && (
            <FinancialsPage data={data} totals={totals} />
          )}
          {page === "archive" && mode !== "share" && (
            <ArkivPage data={data} canEdit={false} />
          )}
        </div>

        {/* Closing — print-only proper signoff */}
        {page === "dashboard" && (
          <div
            data-report="keep"
            className="report-closing"
            style={{
              display: "none",
              background: COL.ink,
              color: COL.paper,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  opacity: 0.5,
                }}
              >
                Rapport slutt
              </div>
              <BNLogo light height={32} />
            </div>

            <div style={{ margin: "3rem 0" }}>
              <div
                style={{
                  width: 56,
                  height: 1.5,
                  background: COL.goldSoft,
                  opacity: 0.85,
                  marginBottom: "1.25rem",
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  opacity: 0.72,
                  color: COL.goldSoft,
                  marginBottom: "1rem",
                }}
              >
                Månedsrapport · {data.meta?.reportPeriod} {data.meta?.reportYear}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "2.5rem",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  marginBottom: "1rem",
                }}
              >
                {data.meta?.companyName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.75,
                  opacity: 0.72,
                  maxWidth: "28rem",
                }}
              >
                Dette dokumentet er konfidensielt styremateriale og skal ikke
                videreformidles uten skriftlig samtykke. Tall og prognoser er
                basert på interne registreringer på rapport-tidspunkt og kan
                endre seg.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                opacity: 0.45,
                fontFamily: "'JetBrains Mono', monospace",
              }}
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
        )}
      </main>

      {viewingProject && (
        <ProjectViewer
          project={viewingProject}
          onClose={() => setViewingProject(null)}
        />
      )}
      {viewingCase && (
        <CaseViewer
          caseData={viewingCase}
          onClose={() => setViewingCase(null)}
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
    omsetning,
    omsetningJustert,
    db,
    dbJustert,
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
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${COL.border}; border-radius: 4px; }
    `}</style>
  );
}

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

// ---------------- DASHBOARD ----------------
function DashboardPage({ data, totals }) {
  const chartData = data.projects
    .filter((p) => p.omsetning > 0)
    .map((p) => ({ name: p.name, Omsetning: p.omsetning, DB: p.db }))
    .sort((a, b) => b.Omsetning - a.Omsetning);

  return (
    <div className="report-flow space-y-10">
      {/* Cover hero — full A4 page in print, hero band on screen */}
      <div
        data-report="keep"
        className="cover-hero -mx-4 -mt-6 px-6 py-10 md:-mx-10 md:-mt-8 md:px-16 md:py-16 flex flex-col justify-between"
        style={{ background: COL.ink, color: COL.paper, minHeight: 360 }}
      >
        {/* Top: confidentiality + logo */}
        <div className="flex justify-between items-start gap-4">
          <div
            className="text-[10px] tracking-[0.28em] uppercase"
            style={{ opacity: 0.5 }}
          >
            Konfidensielt — kun for interne formål
          </div>
          <div className="flex-shrink-0">
            <BNLogo light height={28} className="md:h-9" />
          </div>
        </div>

        {/* Middle: title block */}
        <div className="mt-10 md:mt-20">
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
            className="text-5xl md:text-7xl mb-3"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              lineHeight: 1.02,
            }}
          >
            {data.meta?.reportPeriod}
          </h1>
          <div
            className="cover-meta text-xl md:text-3xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 300,
              opacity: 0.82,
              letterSpacing: "-0.01em",
            }}
          >
            {data.meta?.companyName} · {data.meta?.reportYear}
          </div>
        </div>

        {/* Bottom: metadata stamp — print only */}
        <div
          className="hidden print:flex justify-between items-end gap-3 text-[10px] tracking-[0.22em] uppercase"
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

      {/* §01 — Nøkkeltall */}
      <section>
        <SectionHeader num="01" title="Nøkkeltall" />
        <div
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px"
          style={{ background: COL.border }}
        >
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
            value={
              totals.margin > 0
                ? totals.margin.toFixed(1).replace(".", ",") + " %"
                : "—"
            }
          />
          <KPICard
            label="Boliger u. utvikling"
            value={(totals.units || 0) + "+"}
          />
        </div>
        <div
          className="mt-3 text-center text-[10px] tracking-[0.2em] uppercase"
          style={{ color: COL.muted }}
        >
          Tall justert for eierandeler
        </div>
      </section>

      {/* §02 — Marked & outlook + Eiendom Norge prisstatistikk */}
      <section
        className="border p-8"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <div className="mb-5">
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            §02
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
        <div className="overflow-hidden">
          {data.market?.imageUrl && (
            <div className="float-right ml-8 mb-4 w-full lg:w-1/2 max-w-[600px]">
              <ShareImageDisplay
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
      </section>

      {/* §03 — Prosjekt for prosjekt */}
      <div className="chapter-break">
        <ProjectByProjectSection data={data} num="03" />
      </div>

      {/* §04 — Prosjektstatus: KPI-kort + omsetning/DB chart */}
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
            Prosjektstatus
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: COL.border }}>
          <KPICard
            label="Total porteføljeverdi"
            value={fmtMrd(totals.omsetning)}
            sub={`Justert for eierandeler: ${fmtMrd(totals.omsetningJustert)}`}
            accent
          />
          <KPICard
            label="Dekningsbidrag"
            value={fmtMrd(totals.db)}
            sub={`Justert for eierandeler: ${fmtMrd(totals.dbJustert)}`}
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
      </section>

      {/* Chart — del av §02 Prosjektstatus */}
      <section
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
        {/* Screen: interactive Recharts. Print: static SVG fallback. */}
        <div className="screen-only">
          <ResponsiveContainer
            width="100%"
            height={Math.max(280, chartData.length * 42)}
          >
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
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="square" />
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
      </section>

      {/* §05 — Selskapstall: NAV + EK-binding chart */}
      <section className="space-y-6 chapter-break">
        <div>
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-1"
            style={{ color: COL.muted }}
          >
            §05
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

// ---------------- IMAGE DISPLAY (klikk-for-å-forstørre) ----------------
function ShareImageDisplay({ imageUrl, imageCaption }) {
  const [enlarged, setEnlarged] = useState(false);
  if (!imageUrl) return null;
  return (
    <>
      <div className="w-full">
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
              maxHeight: 500,
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
    <div
      className="px-4 py-5 md:px-7 md:py-7 print:py-6 print:px-6"
      style={{ background: COL.card }}
    >
      <div
        className="text-[9.5px] tracking-[0.22em] uppercase mb-3"
        style={{ color: COL.muted, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </div>
      <div
        className="text-2xl md:text-[34px] print:text-[28px] leading-none"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          letterSpacing: "-0.022em",
          color: accent ? COL.gold : COL.ink,
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
                {/* Header: name + location */}
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
        className="text-[26px] print:text-[24px]"
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

function FactRow({ label, value }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4"
      style={{
        borderBottom: `1px dotted ${COL.borderSoft}`,
        padding: "5px 0",
      }}
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
          width={totals.nav > 0 ? (totals.bokfortEK / totals.nav) * 100 : 0}
          color={COL.ink}
        />
        <NAVRow
          label="Merverdier eiendom"
          value={totals.merverdier}
          width={totals.nav > 0 ? (totals.merverdier / totals.nav) * 100 : 0}
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

// ---------------- CAPITAL SUMMARY ----------------
// ---------------- IRR-BEREGNING ----------------
function computeIRR(cashflows, guess = 0.15) {
  if (!cashflows || cashflows.length < 2) return null;
  const hasNeg = cashflows.some((c) => c < 0);
  const hasPos = cashflows.some((c) => c > 0);
  if (!hasNeg || !hasPos) return null;
  const npv = (rate) =>
    cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
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
    if (next < -0.99) r = -0.99;
    else if (next > 10) r = 10;
    else r = next;
  }
  return isFinite(r) ? r : null;
}

function buildIRRModel(financials, navTerminal) {
  if (!financials || financials.length === 0) return null;
  const sorted = [...financials].sort((a, b) => a.year - b.year);
  const startYear = sorted[0].year;
  const startEK = Number(sorted[0].ek) || 0;
  if (startEK <= 0) return null;
  const endYear = sorted[sorted.length - 1].year;
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
      note = `Utbytte ${
        dividend ? fmtNOK(dividend) + " m" : "0"
      } + terminalverdi (NAV)`;
    } else {
      cf = dividend;
      note = dividend > 0 ? "Utbytte" : "—";
    }
    cashflows[t] = cf;
    rows.push({ year: f.year, t, cf, dividend, note, projected: f.projected });
  }
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
                    fontWeight:
                      r.t === 0 || r.t === model.years ? 600 : 400,
                  }}
                >
                  {r.cf >= 0 ? "+" : ""}
                  {fmtNOK(r.cf)}
                </td>
                <td
                  className="px-3 py-2 text-xs"
                  style={{ color: COL.inkSoft }}
                >
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

  // IRR-beregning (Newton-Raphson)
  const cashflows = (() => {
    const cfs = [-startEK];
    for (let y = first.year + 1; y <= last.year; y++) {
      const row = financials.find((f) => f.year === y);
      const div = Number(row?.dividend) || 0;
      cfs.push(div);
    }
    cfs[cfs.length - 1] += sluttEK;
    return cfs;
  })();

  const computeIRR = (cfs, guess = 0.15) => {
    if (cfs.length < 2) return null;
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
      if (r <= -0.99) r = -0.99;
    }
    return r;
  };

  const irr = computeIRR(cashflows);

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

      <div
        className="border-t"
        style={{ borderColor: COL.borderSoft }}
      >
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
        Total avkastning = (slutt-EK + akk. utbytte) / start-EK. IRR beregnes med start-EK som negativ kontantstrøm, årlige utbytter som positive kontantstrømmer, og slutt-EK som terminalverdi.
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

// ---------------- PORTFOLIO (read-only) ----------------
const STATUS_CATEGORIES = [
  "Produksjon",
  "Salg",
  "Regulering",
  "Prosjektering",
  "Næring",
  "Drift",
];

function PortfolioPage({ data, onView }) {
  const [filter, setFilter] = useState("Alle");

  const filtered = useMemo(() => {
    let arr = [...data.projects];
    if (filter !== "Alle") arr = arr.filter((p) => p.statusCategory === filter);
    arr.sort((a, b) => (b.omsetning || 0) - (a.omsetning || 0));
    return arr;
  }, [data.projects, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
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
        <div
          className="ml-auto text-[11px] tracking-[0.15em] uppercase flex items-center gap-1.5"
          style={{ color: COL.muted }}
        >
          <Eye size={11} /> Klikk på prosjekt for detaljer
        </div>
      </div>

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
                { label: "Prosjekt", w: "22%" },
                { label: "Boliger", w: "8%", num: true },
                { label: "Status", w: "20%" },
                { label: "Omsetning", w: "12%", num: true },
                { label: "DB", w: "10%", num: true },
                { label: "Partner", w: "18%" },
                { label: "Bank", w: "10%" },
              ].map((c) => (
                <th
                  key={c.label}
                  className={`px-4 py-3 text-[10px] tracking-[0.15em] uppercase ${
                    c.num ? "text-right" : "text-left"
                  }`}
                  style={{ color: COL.muted, width: c.w }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-b transition-colors hover:bg-black/[0.02] cursor-pointer"
                style={{ borderColor: COL.borderSoft }}
                onClick={() => onView(p)}
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
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                  }}
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
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                  }}
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
                  {p.partnerShare && (
                    <span style={{ color: COL.muted }}>{p.partnerShare}% </span>
                  )}
                  {p.partner || "—"}
                </td>
                <td className="px-4 py-3.5 text-xs" style={{ color: COL.inkSoft }}>
                  {p.bank || "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr
              style={{
                background: COL.paperWarm,
                borderTop: `1px solid ${COL.border}`,
              }}
            >
              <td
                className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase"
                style={{ color: COL.muted }}
              >
                Sum ({filtered.length})
              </td>
              <td
                className="px-4 py-3 text-right"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                }}
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
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

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

// ---------------- PROJECT VIEWER (read-only dossier) ----------------
function ProjectViewer({ project, onClose }) {
  const p = project;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto py-10"
      style={{
        background: "rgba(14, 26, 43, 0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl shadow-2xl"
        style={{ background: COL.paper, color: COL.ink }}
      >
        {/* Header */}
        <div
          className="px-10 py-8 border-b relative"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1"
            style={{ color: COL.inkSoft }}
          >
            <X size={20} />
          </button>
          <div
            className="text-[10px] tracking-[0.25em] uppercase mb-2"
            style={{ color: COL.gold }}
          >
            Prosjektdossier
          </div>
          <h2
            className="text-4xl mb-1"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.015em",
            }}
          >
            {p.name}
          </h2>
          <div className="flex items-center gap-3 text-sm" style={{ color: COL.muted }}>
            <span>{p.location}</span>
            <span>·</span>
            <StatusPill cat={p.statusCategory} text={p.statusShort} />
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-3 gap-px" style={{ background: COL.border }}>
          {/* Left column — facts */}
          <div className="col-span-1 p-8 space-y-6" style={{ background: COL.card }}>
            <FactGroup title="Omfang">
              <Fact
                label="Boliger"
                value={p.units > 0 ? fmtNOK(p.units) : "—"}
              />
              <Fact
                label="BRA-S"
                value={p.kvm > 0 ? fmtNOK(p.kvm) + " kvm" : "—"}
              />
              {p.byggestart && (
                <Fact
                  label="Byggeperiode"
                  value={`${p.byggestart}–${p.byggeslutt || "?"}`}
                />
              )}
            </FactGroup>

            <FactGroup title="Økonomi">
              <Fact
                label="Omsetning"
                value={p.omsetning > 0 ? fmtMrd(p.omsetning) : "—"}
              />
              <Fact
                label="Dekningsbidrag"
                value={p.db > 0 ? fmtMrd(p.db) : "—"}
                accent
              />
              <Fact
                label="DB-margin"
                value={
                  p.omsetning > 0
                    ? fmtPct((p.db / p.omsetning) * 100)
                    : "—"
                }
              />
              <Fact
                label="Tomtekost"
                value={p.tomtekost > 0 ? fmtNOK(p.tomtekost) + " m" : "—"}
              />
              <Fact
                label="Merverdi tomt"
                value={p.merverdiTomt > 0 ? fmtNOK(p.merverdiTomt) + " m" : "—"}
              />
            </FactGroup>

            <FactGroup title="Partnerskap">
              <Fact
                label="Eierandel BN"
                value={p.partnerShare ? p.partnerShare + " %" : "—"}
              />
              <Fact label="Partner" value={p.partner || "—"} />
              <Fact label="Bank" value={p.bank || "—"} />
            </FactGroup>

            {p.website && (
              <a
                href={p.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm pt-2"
                style={{ color: COL.gold }}
              >
                <ExternalLink size={13} />
                <span>{p.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>

          {/* Right column — narrative */}
          <div className="col-span-2 p-10" style={{ background: COL.card }}>
            <div
              className="text-[10px] tracking-[0.25em] uppercase mb-4"
              style={{ color: COL.gold }}
            >
              Status & fremdrift
            </div>
            {p.statusLong ? (
              <p
                className="text-[15px] leading-[1.75]"
                style={{
                  color: COL.inkSoft,
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 400,
                }}
              >
                {p.statusLong}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: COL.muted }}>
                Ingen statustekst registrert for denne perioden.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FactGroup({ title, children }) {
  return (
    <div>
      <div
        className="text-[10px] tracking-[0.2em] uppercase mb-3 pb-2 border-b"
        style={{ color: COL.muted, borderColor: COL.borderSoft }}
      >
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Fact({ label, value, accent }) {
  return (
    <div className="flex justify-between items-baseline text-[12px]">
      <span style={{ color: COL.muted }}>{label}</span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: accent ? COL.gold : COL.ink,
          fontWeight: accent ? 500 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------- PIPELINE (read-only) ----------------
const PIPELINE_STATUSES = ["Pågående", "Avventende", "Avsluttet", "Vunnet", "Tapt"];

function PipelinePage({ data, onView }) {
  const [filter, setFilter] = useState("Aktive");
  const filtered = useMemo(() => {
    let arr = [...(data.pipeline || [])];
    if (filter === "Aktive") {
      arr = arr.filter(
        (c) => c.status === "Pågående" || c.status === "Avventende"
      );
    } else if (filter !== "Alle") {
      arr = arr.filter((c) => c.status === filter);
    }
    arr.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    return arr;
  }, [data.pipeline, filter]);

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
      <div className="grid grid-cols-5 gap-px" style={{ background: COL.border }}>
        <PipelineStat label="Pågående" value={counts.pågående} accent={COL.sage} />
        <PipelineStat
          label="Avventende"
          value={counts.avventende}
          accent={COL.gold}
        />
        <PipelineStat label="Vunnet" value={counts.vunnet} accent={COL.ink} />
        <PipelineStat label="Tapt" value={counts.tapt} accent={COL.burgundy} />
        <PipelineStat
          label="Avsluttet"
          value={counts.avsluttet}
          accent={COL.muted}
        />
      </div>

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
        <div
          className="ml-auto text-[11px] tracking-[0.15em] uppercase flex items-center gap-1.5"
          style={{ color: COL.muted }}
        >
          <Eye size={11} /> Klikk for detaljer
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((c) => (
          <CaseCard key={c.id} caseData={c} onClick={() => onView(c)} />
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
  const statusColor =
    {
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

function CaseViewer({ caseData, onClose }) {
  const c = caseData;
  const statusColor =
    {
      Pågående: COL.sage,
      Avventende: COL.gold,
      Vunnet: COL.ink,
      Tapt: COL.burgundy,
      Avsluttet: COL.muted,
    }[c.status] || COL.muted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto py-10"
      style={{
        background: "rgba(14, 26, 43, 0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl shadow-2xl"
        style={{ background: COL.paper, color: COL.ink }}
      >
        <div
          className="px-10 py-8 border-b relative"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1"
            style={{ color: COL.inkSoft }}
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <PriorityBadge priority={c.priority} />
            <span
              className="text-[10px] tracking-[0.25em] uppercase"
              style={{ color: COL.muted }}
            >
              {c.location}
            </span>
            <span
              className="text-[10px] tracking-[0.1em] uppercase px-2 py-0.5"
              style={{
                background: statusColor + "1A",
                color: statusColor,
                border: `1px solid ${statusColor}33`,
              }}
            >
              {c.status}
            </span>
          </div>
          <h2
            className="text-3xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.015em",
            }}
          >
            {c.name}
          </h2>
          {c.size && (
            <div
              className="mt-2 text-sm"
              style={{
                color: COL.gold,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {c.size}
            </div>
          )}
        </div>

        <div className="px-10 py-8 space-y-6">
          {c.info && (
            <div>
              <div
                className="text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: COL.muted }}
              >
                Informasjon
              </div>
              <p
                className="text-[15px] leading-[1.7]"
                style={{ color: COL.inkSoft }}
              >
                {c.info}
              </p>
            </div>
          )}
          {c.comment && (
            <div>
              <div
                className="text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: COL.muted }}
              >
                Kommentar / fremdrift
              </div>
              <p
                className="text-[14px] leading-[1.7] italic"
                style={{ color: COL.inkSoft }}
              >
                {c.comment}
              </p>
            </div>
          )}
          {c.contact && (
            <div
              className="pt-4 border-t flex justify-between text-[12px]"
              style={{ borderColor: COL.borderSoft }}
            >
              <span style={{ color: COL.muted }}>Kontakt</span>
              <span style={{ color: COL.ink }}>{c.contact}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- ARKIV (read-only) ----------------
const ARCHIVE_CATEGORIES = [
  { id: "manedsrapport", label: "Månedsrapporter", singular: "Månedsrapport" },
  { id: "styregrunnlag", label: "Styregrunnlag", singular: "Styregrunnlag" },
  { id: "protokoll", label: "Protokoller", singular: "Protokoll" },
  { id: "arsregnskap", label: "Årsregnskap", singular: "Årsregnskap" },
];

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

  const currentLabel = ARCHIVE_CATEGORIES.find((c) => c.id === activeCat)?.label;

  return (
    <div>
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

        <div className="flex gap-1 p-1 rounded inline-flex" style={{ background: COL.paperWarm }}>
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
      </div>

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
                className="px-5 py-4 flex items-center gap-4 hover:bg-black/[0.02] transition-colors cursor-pointer"
                onClick={() => handleDownload(doc)}
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
                      {new Date(doc.uploaded_at).toLocaleDateString("nb-NO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>{formatBytes(doc.file_size)}</span>
                  </div>
                </div>
                <ExternalLink size={16} strokeWidth={1.75} style={{ color: COL.inkSoft }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- FINANCIALS (read-only) ----------------
function FinancialsPage({ data, totals }) {
  const financials = data.financials || [];
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
    Årsresultat: r.result,
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
        <div className="mt-3 text-xs">
          Selskapstall vil bli synlig så snart admin har lagt inn tall.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* KPI-kort */}
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
          <ComposedChart
            data={chartRows}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
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

      <section
        className="border"
        style={{ borderColor: COL.border, background: COL.card }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: COL.border, background: COL.paperWarm }}
        >
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
                  className="px-4 py-3"
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
                <ReadCell value={r.result} />
                <ReadCell value={r.dividend} />
                <ReadCell value={r.dividendFromYear} muted />
                <ReadCell value={r.ek} />
                <ReadCell value={r.gjeld ?? 0} muted />
                <ReadCell value={r.accResult} muted />
                <ReadCell value={r.accDividend} muted />
                <td
                  className="px-4 py-3 text-right"
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

function ReadCell({ value, muted }) {
  return (
    <td
      className="px-4 py-3 text-right"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        color: muted ? COL.muted : COL.ink,
      }}
    >
      {fmtNOK(value)}
    </td>
  );
}

// ---------------- AUTH WRAPPER (default export) ----------------
export default function Styreportal() {
  const { profile, signOut, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const r = await storage.get(STORAGE_KEY);
      if (r && r.value) {
        const loaded = JSON.parse(r.value);
        setData({
          ...FALLBACK_SEED,
          ...loaded,
          pipeline: loaded.pipeline ?? FALLBACK_SEED.pipeline,
          projects: (loaded.projects || FALLBACK_SEED.projects || []).map((p) => ({
            unitsSold: 0,
            ...p,
          })),
          financials: (loaded.financials || FALLBACK_SEED.financials || []).map((f) => ({
            gjeld: 0,
            ...f,
          })),
        });
      } else {
        setData(FALLBACK_SEED);
      }
      setLastSync(new Date());
    } catch {
      setData(FALLBACK_SEED);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (authLoading) return null;

  if (profile?.role !== "board" && profile?.role !== "admin") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'JetBrains Mono', monospace", color: "#0E1A2B" }}>
        Krever styre- eller admin-tilgang.
      </div>
    );
  }

  if (dataLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COL.paper, color: COL.ink }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <StyreportalCore
      data={data}
      mode="auth"
      profile={profile}
      signOut={signOut}
      lastSync={lastSync}
      onReload={loadData}
    />
  );
}

// ---------------- SHARE WRAPPER (named export, public route) ----------------
// Brukes av /styreportal/share/:token. Henter snapshot fra share_tokens-tabell,
// renderer samme UI som auth-mode men uten signOut/refresh.
export function StyreportalShare({ token }) {
  const [snapshot, setSnapshot] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | expired | error

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) {
        if (alive) setStatus("expired");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("share_tokens")
          .select("snapshot, expires_at, created_at")
          .eq("token", token)
          .maybeSingle();
        if (!alive) return;
        if (error) {
          console.error("[share] fetch error:", error.message);
          setStatus("error");
          return;
        }
        if (!data) {
          // Ingen rad funnet — enten ugyldig token eller utløpt (RLS filtrerer ut utløpte)
          setStatus("expired");
          return;
        }
        setSnapshot(data.snapshot);
        setExpiresAt(data.expires_at);
        setCreatedAt(data.created_at);
        setStatus("ok");
      } catch (e) {
        console.error("[share] failed:", e.message);
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COL.paper, color: COL.ink }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (status === "expired" || status === "error" || !snapshot) {
    return <ExpiredSharePage status={status} />;
  }

  return (
    <StyreportalCore
      data={snapshot}
      mode="share"
      expiresAt={expiresAt}
      lastSync={createdAt ? new Date(createdAt) : null}
    />
  );
}

function ExpiredSharePage({ status }) {
  const isError = status === "error";
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: COL.paper, color: COL.ink, fontFamily: "'Manrope', system-ui, sans-serif" }}
    >
      <FontImports />
      <div className="max-w-md text-center">
        <div
          className="text-[10px] tracking-[0.25em] uppercase mb-3"
          style={{ color: COL.gold, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {isError ? "Noe gikk galt" : "Lenken er utløpt"}
        </div>
        <h1
          className="mb-4"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: "clamp(24px, 3vw, 32px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {isError
            ? "Klarte ikke laste rapporten"
            : "Delingslenken er ikke lenger aktiv"}
        </h1>
        <p
          className="text-[14px] leading-[1.7] mb-8"
          style={{ color: COL.inkSoft }}
        >
          {isError
            ? "Prøv igjen om litt, eller logg inn for å se den nyeste rapporten."
            : "Logg inn for å se siste rapport, eller be om en ny lenke fra administrator."}
        </p>
        <a
          href="/logg-inn"
          className="inline-flex items-center gap-2 px-6 py-3 text-xs"
          style={{
            background: COL.ink,
            color: COL.paper,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <ShieldCheck size={13} />
          <span>Logg inn</span>
        </a>
      </div>
    </div>
  );
}
