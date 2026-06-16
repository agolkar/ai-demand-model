import type { Params } from "../model/types";

export interface SliderSpec {
  param: keyof Params;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  help: string; // shown in the hover "?" tooltip
}

export interface ControlGroup {
  title: string;
  blurb: string;
  sliders: SliderSpec[];
}

// Grouped knobs. Ranges are chosen to span plausible-to-aggressive scenarios.
export const CONTROL_GROUPS: ControlGroup[] = [
  {
    title: "Time & population",
    blurb: "The horizon, the human base, and how many agents each person runs.",
    sliders: [
      { param: "endYear", label: "Project to year", min: 2030, max: 2070, step: 1, help: "Last year the projection runs to." },
      { param: "worldPopulationB", label: "World population", min: 7, max: 10, step: 0.1, unit: "B", help: "Total human population at the start year. The base that consumer demand and the agent ceiling scale from." },
      { param: "populationGrowthPct", label: "Population growth", min: -0.5, max: 2, step: 0.1, unit: "%/yr", help: "Annual growth of population and workforce, compounding over time." },
      { param: "agentsPerHuman", label: "Agents per human", min: 0.5, max: 100, step: 0.5, unit: "/person", help: "Active AI agents per person at saturation — this sets the agent fleet ceiling. Agents are software that spawns software, so it can far exceed 1. THE swing variable: ~1/person keeps AI a small slice of the grid; ~12/person can push AI past all of Earth's generation by the 2040s. Deeply uncertain." },
    ],
  },
  {
    title: "1 · Consumer AI",
    blurb: "People using chatbots and assistants directly.",
    sliders: [
      { param: "consumerAdoption0", label: "Adoption today", min: 0.02, max: 0.5, step: 0.01, unit: "of pop.", help: "Share of people using AI directly today (~1B of 8.3B ≈ 0.12)." },
      { param: "consumerCeiling", label: "Adoption ceiling", min: 0.2, max: 1, step: 0.01, unit: "of pop.", help: "Maximum share of people who ever use AI directly." },
      { param: "consumerGrowth", label: "Adoption speed", min: 0.1, max: 1, step: 0.05, unit: "/yr", help: "How fast consumer adoption climbs its S-curve toward the ceiling." },
      { param: "consumerQueriesPerDay", label: "Queries / user / day", min: 1, max: 60, step: 1, help: "Average AI queries an active person sends per day." },
    ],
  },
  {
    title: "2 · Corporate AI",
    blurb: "Knowledge workers augmented by AI in their jobs.",
    sliders: [
      { param: "knowledgeWorkersB", label: "Knowledge workers", min: 0.5, max: 2.5, step: 0.05, unit: "B", help: "Global desk/knowledge workers, the base for corporate AI use (~1.25B of ~3.5B total workers)." },
      { param: "corpAdoption0", label: "Adoption today", min: 0.02, max: 0.5, step: 0.01, unit: "of workers", help: "Share of knowledge workers deeply AI-augmented today (~10%)." },
      { param: "corpCeiling", label: "Adoption ceiling", min: 0.2, max: 1, step: 0.01, unit: "of workers", help: "Maximum share of knowledge workers ever AI-augmented." },
      { param: "corpGrowth", label: "Adoption speed", min: 0.1, max: 1, step: 0.05, unit: "/yr", help: "How fast corporate adoption climbs its S-curve toward the ceiling." },
      { param: "corpQueriesPerDay", label: "Queries / worker / day", min: 5, max: 300, step: 5, help: "AI queries an augmented worker generates per day. Higher than a casual consumer." },
    ],
  },
  {
    title: "3 · Autonomous agents",
    blurb: "A compute-driven fleet (ceiling set by 'agents per human' above). The dominant long-run driver.",
    sliders: [
      { param: "agentFleet0B", label: "Agent fleet today", min: 0, max: 2, step: 0.05, unit: "B", help: "Active autonomous agents running worldwide today, in billions. Small and nascent in 2026." },
      { param: "agentGrowth", label: "Fleet growth speed", min: 0.1, max: 1, step: 0.05, unit: "/yr", help: "How fast the agent fleet compounds toward its ceiling (set by agents-per-human)." },
      { param: "agentQueriesPerDay", label: "Queries / agent / day", min: 50, max: 2000, step: 50, help: "Queries each agent issues per day. Agents run 24/7 and chain many calls per task." },
      { param: "agentIntensityMultiplier", label: "Agent energy multiple", min: 1, max: 40, step: 1, unit: "x", help: "Energy per agent query versus a simple chat query. Reasoning and multi-step work cost an order of magnitude more." },
      { param: "subAgentsPerAgent", label: "Sub-agents per agent", min: 1, max: 8, step: 0.5, unit: "Z", help: "Branching factor: how many sub-agents each agent spawns. Combined with recursion depth, the live fleet multiplies as a tree. Only bites when recursion depth is above 0." },
      { param: "agentRecursionDepth", label: "Recursion depth", min: 0, max: 5, step: 1, unit: "levels", help: "Generations of sub-agents below the top level. 0 = none (default). Each added level multiplies the whole fleet by the branching factor, so demand compounds EXPONENTIALLY: depth 4 at branching 3 ≈ 40x, depth 5 at branching 5 ≈ 780x. The wild-card that can dwarf every other knob." },
    ],
  },
  {
    title: "Energy intensity",
    blurb: "How much electricity each query costs, and where the efficiency/usage tug-of-war nets out.",
    sliders: [
      { param: "whPerQuery", label: "Energy per query", min: 0.05, max: 2, step: 0.05, unit: "Wh", help: "Electricity a simple text query uses today (~0.3 Wh median)." },
      { param: "pue", label: "Facility PUE", min: 1.0, max: 1.8, step: 0.05, unit: "x", help: "Power usage effectiveness: total facility power divided by IT power (~1.1–1.3 for modern data centers)." },
      { param: "trainingOverheadPct", label: "Training overhead", min: 0, max: 100, step: 5, unit: "%", help: "Training energy added on top of inference, as a percentage." },
      { param: "efficiencyCagrPct", label: "Hardware efficiency", min: -40, max: 0, step: 1, unit: "%/yr", help: "Annual fall in energy per query from better chips and algorithms. Negative means improving." },
      { param: "reboundPct", label: "Jevons rebound", min: 0, max: 200, step: 5, unit: "%", help: "Share of efficiency savings re-spent on more and heavier use. 0% = efficiency lowers demand; 100% = net flat; above 100% = demand outpaces efficiency (reasoning-model era)." },
    ],
  },
  {
    title: "Earth energy supply",
    blurb: "Generation, and the non-AI demand that already consumes most of it.",
    sliders: [
      { param: "globalGenerationTWh", label: "Generation today", min: 25000, max: 40000, step: 500, unit: "TWh", help: "Total world electricity generation at the start year (30,664 TWh in 2024)." },
      { param: "supplyGrowthPct", label: "Supply growth", min: 1, max: 8, step: 0.25, unit: "%/yr", help: "Annual growth of global electricity generation (4% in 2024; ~2.6% 2010–2023 average)." },
      { param: "baselineNonAiTWh", label: "Non-AI demand today", min: 20000, max: 32000, step: 200, unit: "TWh", help: "Electricity everything except AI uses today: homes, industry, transport. Near total generation, because AI is only ~0.1% of it now. It is the base layer of the demand chart; AI stacks on top." },
      { param: "baselineGrowthPct", label: "Non-AI demand growth", min: 0, max: 6, step: 0.25, unit: "%/yr", help: "How fast non-AI demand grows (electrification of heat, transport, industry). The faster it grows, the sooner total demand outruns generation." },
    ],
  },
  {
    title: "Earth vs space economics",
    blurb: "Cost of closing the gap on the ground vs from orbit.",
    sliders: [
      { param: "earthCostPerW", label: "Earth build cost", min: 0.5, max: 8, step: 0.25, unit: "$/W", help: "All-in cost to add a watt of clean generation plus data center on the ground." },
      { param: "launchCostPerKg", label: "Launch cost", min: 50, max: 3000, step: 50, unit: "$/kg", help: "Cost to put a kilogram into orbit. ~$1,500–2,900/kg today; targets of $200–500/kg would change the economics." },
      { param: "spaceKgPerKw", label: "Mass per kW (space)", min: 1, max: 20, step: 0.5, unit: "kg/kW", help: "Payload mass per kW of delivered compute power in orbit: panels, radiators, bus, and chips." },
      { param: "spaceSolarMultiplier", label: "Orbital solar gain", min: 1, max: 10, step: 0.5, unit: "x", help: "How much more productive a solar panel is in orbit versus the ground (near-continuous sun), up to ~8x." },
      { param: "spaceNonLaunchCostPerW", label: "Space hardware cost", min: 0.5, max: 6, step: 0.25, unit: "$/W", help: "Cost per delivered watt of space hardware, excluding launch." },
    ],
  },
];
