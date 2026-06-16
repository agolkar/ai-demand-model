import type { Params } from "./types";

// ---------------------------------------------------------------------------
// Default parameter values, seeded from public data (mid-2026).
// Every number that comes from a source is documented in ASSUMPTIONS below so
// the model stays transparent. Where no hard figure exists, a reasoned
// estimate is used and flagged as such.
// ---------------------------------------------------------------------------

export const DEFAULTS: Params = {
  baseYear: 2026,
  endYear: 2050,

  worldPopulationB: 8.3,
  populationGrowthPct: 0.8,

  // Consumer: ~1B monthly AI users / 8.3B people ≈ 0.12 at baseYear.
  consumerAdoption0: 0.12,
  consumerCeiling: 0.9,
  consumerGrowth: 0.35,
  consumerQueriesPerDay: 12,

  // Corporate: ~1.25B knowledge workers worldwide; ~10% deeply AI-augmented now.
  knowledgeWorkersB: 1.25,
  corpAdoption0: 0.1,
  corpCeiling: 0.85,
  corpGrowth: 0.4,
  corpQueriesPerDay: 60,

  // Agents: a compute-driven fleet, decoupled from human headcount. Small today,
  // compounding toward an economic ceiling far larger than the workforce.
  agentFleet0B: 0.05,
  // ~7.5 agents per person at maturity (≈50 per knowledge worker). Chosen as a
  // moderate figure BEFORE looking at what crossing year it produces. This is
  // the swing variable: the outcome is highly sensitive to it and deeply
  // uncertain (see note). 7.5 x 8.3B people ≈ 62B agents at saturation.
  agentsPerHuman: 7.5,
  agentGrowth: 0.45,
  agentQueriesPerDay: 400,
  agentIntensityMultiplier: 10,
  // Recursive sub-agents OFF by default (depth 0 = multiplier 1) so the central
  // case is not inflated. Raise depth to explore the compounding eventuality.
  subAgentsPerAgent: 3,
  agentRecursionDepth: 0,

  whPerQuery: 0.3,
  pue: 1.25,
  trainingOverheadPct: 25,
  efficiencyCagrPct: -20, // energy per query falls ~20%/yr from hardware + algorithms
  reboundPct: 100, // Jevons: savings fully re-spent on more/heavier work (net flat per query)

  globalGenerationTWh: 30664,
  supplyGrowthPct: 3.0,
  // Non-AI demand today ≈ all of current generation (AI is ~0.1% in 2026), so
  // there is almost no spare headroom at the start. Headroom for AI only opens
  // as generation is built faster than non-AI demand grows.
  baselineNonAiTWh: 30600,
  // Per-capita electrification growth. Combined with ~0.8%/yr population growth
  // this gives ~2%/yr total non-AI demand growth, matching the historical trend.
  baselinePerCapitaGrowthPct: 1.2,

  earthCostPerW: 3.0,
  launchCostPerKg: 1000,
  spaceKgPerKw: 6,
  spaceSolarMultiplier: 8,
  spaceNonLaunchCostPerW: 2.0,
};

export interface AssumptionNote {
  key: keyof Params;
  label: string;
  unit: string;
  note: string;
  source?: string;
  sourceUrl?: string;
}

// Human-readable provenance for each assumption, shown in the Assumptions tab.
export const ASSUMPTIONS: AssumptionNote[] = [
  {
    key: "worldPopulationB",
    label: "World population",
    unit: "billion",
    note: "~8.3B mid-2026.",
    source: "Worldometer / UN",
    sourceUrl: "https://www.worldometers.info/world-population/",
  },
  {
    key: "populationGrowthPct",
    label: "Population growth",
    unit: "%/yr",
    note: "~0.8%/yr and slowly declining; held constant here.",
    source: "UN World Population Prospects",
    sourceUrl: "https://population.un.org/wpp/",
  },
  {
    key: "consumerAdoption0",
    label: "Consumer adoption (start)",
    unit: "fraction",
    note: "ChatGPT alone ≈900M weekly / ~1B monthly users; ~0.12 of world population use a chatbot.",
    source: "OpenAI / TechCrunch (Feb 2026)",
    sourceUrl: "https://techcrunch.com/2026/02/27/chatgpt-reaches-900m-weekly-active-users",
  },
  {
    key: "consumerQueriesPerDay",
    label: "Consumer queries/day",
    unit: "queries",
    note: "ChatGPT serves >2.5B queries/day; per active user this is low single-to-double digits. Estimate.",
    source: "OpenAI usage disclosures",
  },
  {
    key: "knowledgeWorkersB",
    label: "Knowledge workers",
    unit: "billion",
    note: "Gartner: over 1 billion knowledge workers worldwide; ~1.25B of the ~3.5B global workforce.",
    source: "Gartner",
    sourceUrl: "https://www.gartner.com/en/newsroom/press-releases/2023-03-01-gartner-forecasts-39-percent-of-global-knowledge-workers-will-work-hybrid-by-the-end-of-2023",
  },
  {
    key: "corpAdoption0",
    label: "Corporate adoption (start)",
    unit: "fraction",
    note: "McKinsey State of AI: 65% of orgs used gen AI in ≥1 function (2024), 72% (2025), but only ~1/3 have scaled it. Deep per-worker augmentation, what this models, is ~10% today.",
    source: "McKinsey State of AI 2024/2025",
    sourceUrl: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2024",
  },
  {
    key: "corpQueriesPerDay",
    label: "Corporate queries/day",
    unit: "queries",
    note: "An AI-augmented worker generates far more inference than a casual consumer. Estimate.",
  },
  {
    key: "agentsPerHuman",
    label: "Agents per human",
    unit: "agents/person",
    note: "Active AI agents per person at saturation (sets the fleet ceiling). Agents are software that spawns software, so this can exceed 1. The swing variable, deeply uncertain: at ~1/person AI stays a small slice of the grid; at ~12/person it can exceed total global generation by the 2040s. No data pins it down, so treat the default (~7.5, i.e. ≈50 per knowledge worker) as one point in a wide range, not a forecast.",
    source: "First-principles anchor; Gartner agentic-AI direction only",
  },
  {
    key: "agentGrowth",
    label: "Agent fleet growth",
    unit: "/yr",
    note: "Logistic rate of the agent population. Enterprise agent adoption is forecast to roughly double year-on-year near term. Estimate.",
    source: "Gartner / IDC agentic AI forecasts",
  },
  {
    key: "agentQueriesPerDay",
    label: "Agent queries/day",
    unit: "queries",
    note: "Agents run continuously and chain many calls; hundreds of queries/day each. Estimate.",
  },
  {
    key: "subAgentsPerAgent",
    label: "Sub-agents per agent",
    unit: "branching",
    note: "Each agent can spawn sub-agents that spawn their own, recursively. With recursion depth D and branching Z, the live fleet multiplies by (Z^(D+1)-1)/(Z-1). Highly speculative.",
  },
  {
    key: "agentRecursionDepth",
    label: "Agent recursion depth",
    unit: "levels",
    note: "Generations of sub-agents below the top level. 0 = none (default, to avoid inflating the central case). Each level multiplies the fleet by the branching factor, so energy demand compounds EXPONENTIALLY: depth 4 at branching 3 is ~40x; depth 5 at branching 5 is ~780x. This is the wild-card that could dwarf every other assumption.",
  },
  {
    key: "agentIntensityMultiplier",
    label: "Agent energy multiple",
    unit: "x",
    note: "Long reasoning + agentic chains raise energy/query by an order of magnitude or more.",
    source: "Epoch AI / arXiv inference studies",
    sourceUrl: "https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use",
  },
  {
    key: "whPerQuery",
    label: "Energy per query",
    unit: "Wh",
    note: "Median optimized text query ≈0.3 Wh (Altman cited ~0.34 Wh; Gemini ~0.24 Wh).",
    source: "Epoch AI / IEEE Spectrum",
    sourceUrl: "https://spectrum.ieee.org/ai-energy-use",
  },
  {
    key: "pue",
    label: "Power usage effectiveness",
    unit: "x",
    note: "Uptime Institute 2024: global average PUE 1.56; hyperscale/AI-optimized facilities ≤1.4, best ~1.1. Default 1.25 reflects a modern AI data center.",
    source: "Uptime Institute Global Survey 2024",
    sourceUrl: "https://uptimeinstitute.com/resources/research-and-reports/uptime-institute-global-data-center-survey-results-2024",
  },
  {
    key: "trainingOverheadPct",
    label: "Training overhead",
    unit: "%",
    note: "Training adds on the order of 10–40% on top of inference energy. Estimate.",
  },
  {
    key: "efficiencyCagrPct",
    label: "Hardware efficiency trend",
    unit: "%/yr",
    note: "Epoch AI: leading ML hardware becomes ~40%/yr more energy-efficient (FLOP/s per watt doubling ~2 yrs; top AI supercomputers +1.34×/yr 2019–2025). Default −20%/yr is a conservative blend of hardware and algorithmic gains. Negative = improving.",
    source: "Epoch AI, ML hardware energy efficiency",
    sourceUrl: "https://epoch.ai/data-insights/ml-hardware-energy-efficiency",
  },
  {
    key: "reboundPct",
    label: "Jevons rebound",
    unit: "%",
    note: "Share of efficiency savings re-spent on more and heavier work. 100% = net-flat energy per query (cheaper tokens fully offset by more tokens, as observed). >100% = the reasoning-model era, where demand outpaces efficiency.",
    source: "Jevons paradox; observed AI token-volume growth",
  },
  {
    key: "globalGenerationTWh",
    label: "Global electricity generation",
    unit: "TWh/yr",
    note: "30,664 TWh in 2024 (crossed 30,000 TWh for the first time). This is ELECTRICITY, not total primary energy (~180,000 TWh, which includes oil/gas/coal for transport, heat, and industry). AI runs on electricity, so electricity is the right and binding denominator.",
    source: "Ember Global Electricity Review 2025",
    sourceUrl: "https://ember-energy.org/latest-insights/global-electricity-review-2025/2024-in-review/",
  },
  {
    key: "supplyGrowthPct",
    label: "Supply growth",
    unit: "%/yr",
    note: "Generation grew 4% in 2024 vs a 2.6% 2010–2023 average; ~3% as a forward blend.",
    source: "IEA Global Energy Review 2025",
    sourceUrl: "https://www.iea.org/reports/global-energy-review-2025/electricity",
  },
  {
    key: "baselineNonAiTWh",
    label: "Baseline non-AI demand",
    unit: "TWh/yr",
    note: "Electricity everything except AI uses: homes, industry, transport. Set near today's total generation because AI is only ~0.1% of it in 2026, so the world has almost no spare power today. Grows with population and per-capita electrification. Shown as the base layer of the demand chart.",
    source: "Ember/IEA generation ≈ consumption",
    sourceUrl: "https://ember-energy.org/latest-insights/global-electricity-review-2025/2024-in-review/",
  },
  {
    key: "baselinePerCapitaGrowthPct",
    label: "Non-AI per-capita growth",
    unit: "%/yr",
    note: "Growth in non-AI electricity use PER PERSON (electrification of heat, transport, industry). Total non-AI demand also rises with population, so total non-AI growth = population growth + this. ~1.2%/yr per-capita plus ~0.8%/yr population gives the ~2%/yr historical total.",
    source: "IEA electricity demand trends",
    sourceUrl: "https://www.iea.org/reports/global-energy-review-2025/electricity",
  },
  {
    key: "earthCostPerW",
    label: "Earth build cost",
    unit: "$/W",
    note: "Power side only: clean generation + grid + power/cooling per watt. Excludes GPU compute, which Earth and space data centers need equally. For reference, AI-ready facilities run $20–40M/MW including compute (Epoch: ~$38/W for a 1 GW site); this models just the power differential.",
    source: "Lazard LCOE; Epoch AI datacenter cost",
    sourceUrl: "https://epoch.ai/data-insights/ai-datacenter-cost-breakdown",
  },
  {
    key: "launchCostPerKg",
    label: "Launch cost",
    unit: "$/kg",
    note: "Falcon 9 sells at ~$2,720/kg to LEO (SpaceX internal cost ~$630/kg); Starship targets <$100/kg. Space data centers need ~$200–500/kg to pencil out (Suncatcher, Starcloud). Default 1000 sits mid-range.",
    source: "SpaceX / Falcon 9; Scientific American",
    sourceUrl: "https://en.wikipedia.org/wiki/Falcon_9",
  },
  {
    key: "spaceSolarMultiplier",
    label: "Orbital solar gain",
    unit: "x",
    note: "A panel in the right orbit is up to ~8x more productive than on the ground (near-continuous sun).",
    source: "Google Project Suncatcher",
    sourceUrl: "https://www.datacenterdynamics.com/en/news/project-suncatcher-google-to-launch-tpus-into-orbit-with-planet-labs-envisions-1km-arrays-of-81-satellite-compute-clusters/",
  },
  {
    key: "spaceKgPerKw",
    label: "Mass per kW (space)",
    unit: "kg/kW",
    note: "Payload mass (compute + panels + radiators + bus) per kW of delivered power. Estimate.",
  },
];
