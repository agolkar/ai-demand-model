// ---------------------------------------------------------------------------
// Type definitions for the AI demand model.
// All parameters live in a single flat `Params` object so the UI can render a
// knob for every assumption and the simulation stays a pure function of it.
// ---------------------------------------------------------------------------

export interface Params {
  // --- Time horizon -------------------------------------------------------
  baseYear: number; // first year of the simulation (data anchor)
  endYear: number; // last year to project to

  // --- Population ---------------------------------------------------------
  worldPopulationB: number; // billions, at baseYear
  populationGrowthPct: number; // annual %, compounding

  // --- Segment 1: Consumer AI ---------------------------------------------
  consumerAdoption0: number; // fraction of population using AI at baseYear (0-1)
  consumerCeiling: number; // saturation fraction of population (0-1)
  consumerGrowth: number; // logistic growth rate (per year)
  consumerQueriesPerDay: number; // average AI queries per active consumer per day

  // --- Segment 2: Corporate / enterprise AI -------------------------------
  knowledgeWorkersB: number; // billions of knowledge workers (the addressable base)
  corpAdoption0: number; // fraction of knowledge workers AI-augmented at baseYear
  corpCeiling: number; // saturation fraction (0-1)
  corpGrowth: number; // logistic growth rate (per year)
  corpQueriesPerDay: number; // AI queries per augmented worker per day (work-intensive)

  // --- Segment 3: Autonomous AI agents ------------------------------------
  // Agents are NOT tied to human headcount. They are a compute/capital-driven
  // population: software processes that spawn other processes, bounded by the
  // economics of useful work and the compute available, not by how many people
  // exist. This is the term that can outrun a saturating human base.
  agentFleet0B: number; // billions of active agents at baseYear
  agentsPerHuman: number; // active agents per person at saturation (sets the ceiling)
  agentGrowth: number; // logistic growth rate (per year)
  agentQueriesPerDay: number; // queries per agent per day (24/7 operation)
  agentIntensityMultiplier: number; // energy/query multiple vs a simple chat query
  // Recursive sub-agent spawning: each agent orchestrates sub-agents, which
  // orchestrate their own, forming a tree. Total instances = primary x
  // (Z^(D+1)-1)/(Z-1), which compounds exponentially in depth D.
  subAgentsPerAgent: number; // Z: sub-agents spawned per agent (branching factor)
  agentRecursionDepth: number; // D: generations of sub-agents below the top level (0 = none)

  // --- Shared energy intensity -------------------------------------------
  whPerQuery: number; // compute energy of a simple text query, Wh
  pue: number; // power usage effectiveness (facility overhead multiplier)
  trainingOverheadPct: number; // training energy as % of inference energy
  // Net per-query energy trend is split into two opposing forces:
  efficiencyCagrPct: number; // annual % change in energy per query from hardware/algorithms (negative = improving)
  reboundPct: number; // Jevons rebound: % of efficiency gains re-spent on more/heavier work.
  // 0 = none (efficiency lowers demand), 100 = full offset (net flat),
  // >100 = demand grows faster than efficiency (reasoning-model era).

  // --- Energy supply (Earth) ---------------------------------------------
  globalGenerationTWh: number; // total global electricity generation at baseYear
  supplyGrowthPct: number; // annual % growth of global generation
  // Baseline non-AI electricity demand: homes, industry, transport, everything
  // that is not AI. It scales with population AND a per-capita electrification
  // trend, so total non-AI growth = population growth + per-capita growth.
  baselineNonAiTWh: number; // non-AI electricity demand at baseYear
  baselinePerCapitaGrowthPct: number; // annual % growth in non-AI demand PER PERSON (electrification)

  // --- Earth vs Space economics ------------------------------------------
  earthCostPerW: number; // $/W all-in to add Earth clean generation + data center
  launchCostPerKg: number; // $/kg to low Earth orbit
  spaceKgPerKw: number; // kg of payload mass per kW of delivered compute power
  spaceSolarMultiplier: number; // orbital solar productivity vs ground (≈8x)
  spaceNonLaunchCostPerW: number; // $/W of space hardware excl. launch
}

export interface YearRow {
  year: number;
  // adoption
  consumerUsersB: number;
  corpUsersB: number;
  agentsB: number;
  // energy demand by segment, TWh/yr
  consumerTWh: number;
  corpTWh: number;
  agentTWh: number;
  totalDemandTWh: number;
  // supply, TWh/yr
  globalSupplyTWh: number;
  baselineDemandTWh: number; // non-AI demand this year
  headroomTWh: number; // generation minus non-AI demand: what is actually free for AI
  // gap
  unservedTWh: number; // AI demand beyond the headroom
  demandShareOfGlobalPct: number; // total AI demand as % of all global electricity
}

export interface BreakevenResult {
  // year total demand (non-AI + AI) crosses generation, rounded for display
  breakevenYear: number | null;
  // exact interpolated crossing year (fractional) for placing the chart marker
  crossingX: number | null;
}

export interface SpaceComparison {
  gapYear: number; // year of the largest unserved gap over the horizon
  gapTWhAtEnd: number; // peak unserved demand (TWh/yr) to size capacity against
  gapAvgGW: number; // average GW of continuous power that gap represents
  earthCostT: number; // $ trillions to close the gap by building on Earth
  spaceCostT: number; // $ trillions to close the gap from orbit
  spaceCostPerW: number; // effective $/W delivered from space
  breakevenLaunchCostPerKg: number; // launch $/kg at which space == Earth cost
  cheaper: "earth" | "space";
}
