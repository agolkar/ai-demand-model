import type {
  Params,
  YearRow,
  BreakevenResult,
  SpaceComparison,
} from "./types";

// ---------------------------------------------------------------------------
// Pure simulation. No React, no side effects: given Params, return the full
// year-by-year trajectory plus derived breakeven and space-economics results.
// This separation keeps the model auditable and easy to unit-test or reuse.
// ---------------------------------------------------------------------------

const WH_PER_TWH = 1e12; // 1 TWh = 1e12 Wh
const HOURS_PER_YEAR = 8760;

/**
 * Logistic (S-curve) adoption between a starting level and a ceiling.
 * Returns the value `t` years after the base year.
 */
export function logistic(
  start: number,
  ceiling: number,
  rate: number,
  t: number,
): number {
  if (ceiling <= 0) return 0;
  const s = Math.min(Math.max(start, 1e-9), ceiling * 0.999999);
  // Invert the logistic to find the implied offset so the curve passes
  // through `start` at t = 0.
  const x0 = Math.log((ceiling - s) / s) / rate;
  return ceiling / (1 + Math.exp(-rate * (t - x0)));
}

/**
 * Tree multiplier for recursive sub-agent spawning. Each agent spawns Z
 * sub-agents over D generations, so the total instance count is the geometric
 * series 1 + Z + Z^2 + ... + Z^D = (Z^(D+1) - 1)/(Z - 1). Grows exponentially
 * in depth D. Depth 0 returns 1 (no recursion).
 */
export function recursionMultiplier(z: number, depth: number): number {
  if (depth <= 0) return 1;
  if (Math.abs(z - 1) < 1e-9) return depth + 1;
  return (Math.pow(z, depth + 1) - 1) / (z - 1);
}

/** Energy (TWh/yr) for a population of "units" each issuing queries/day. */
function segmentEnergyTWh(
  units: number, // absolute count of users/agents
  queriesPerDay: number,
  whPerQuery: number,
  pue: number,
  trainingOverheadPct: number,
  intensityMultiplier: number,
): number {
  const queriesPerYear = units * queriesPerDay * 365;
  const computeWh = queriesPerYear * whPerQuery * intensityMultiplier;
  const facilityWh = computeWh * pue * (1 + trainingOverheadPct / 100);
  return facilityWh / WH_PER_TWH;
}

export function runModel(p: Params): YearRow[] {
  const rows: YearRow[] = [];
  for (let year = p.baseYear; year <= p.endYear; year++) {
    const t = year - p.baseYear;

    // Population this year.
    const population = p.worldPopulationB * Math.pow(1 + p.populationGrowthPct / 100, t);
    const knowledgeWorkers = p.knowledgeWorkersB * Math.pow(1 + p.populationGrowthPct / 100, t);

    // Effective per-query energy. Hardware/algorithms make each query cheaper
    // (efficiencyCagr, usually negative), but Jevons rebound re-spends those
    // savings on more and heavier work. Net trend = efficiency x (1 - rebound).
    const netIntensityTrend = (p.efficiencyCagrPct / 100) * (1 - p.reboundPct / 100);
    const wh = p.whPerQuery * Math.pow(1 + netIntensityTrend, t);

    // --- Adoption curves (all in billions of units) ---------------------
    // Consumers and corporate users are genuinely bounded by human headcount.
    const consumerUsersB = population * logistic(p.consumerAdoption0, p.consumerCeiling, p.consumerGrowth, t);
    const corpUsersB = knowledgeWorkers * logistic(p.corpAdoption0, p.corpCeiling, p.corpGrowth, t);
    // Agents are a compute-driven fleet whose saturation level is expressed as
    // agents-per-human against the base population (a transparent sizing of the
    // ceiling; the fleet can far exceed the number of people).
    const agentCeilingB = p.agentsPerHuman * p.worldPopulationB;
    const primaryAgentsB = logistic(p.agentFleet0B, agentCeilingB, p.agentGrowth, t);
    // Recursive sub-agents multiply the live fleet as a branching tree.
    const treeMultiplier = recursionMultiplier(p.subAgentsPerAgent, p.agentRecursionDepth);
    const agentsB = primaryAgentsB * treeMultiplier;

    // --- Energy by segment (convert billions -> absolute via 1e9) -------
    const consumerTWh = segmentEnergyTWh(consumerUsersB * 1e9, p.consumerQueriesPerDay, wh, p.pue, p.trainingOverheadPct, 1);
    const corpTWh = segmentEnergyTWh(corpUsersB * 1e9, p.corpQueriesPerDay, wh, p.pue, p.trainingOverheadPct, 1);
    const agentTWh = segmentEnergyTWh(agentsB * 1e9, p.agentQueriesPerDay, wh, p.pue, p.trainingOverheadPct, p.agentIntensityMultiplier);
    const totalDemandTWh = consumerTWh + corpTWh + agentTWh;

    // --- Supply ---------------------------------------------------------
    // Generation, the non-AI demand it must serve first, and the headroom that
    // is genuinely free for AI (what is left after the rest of the economy).
    const globalSupplyTWh = p.globalGenerationTWh * Math.pow(1 + p.supplyGrowthPct / 100, t);
    // Non-AI demand scales with population AND per-capita electrification.
    const baselineDemandTWh =
      p.baselineNonAiTWh *
      Math.pow(1 + p.populationGrowthPct / 100, t) *
      Math.pow(1 + p.baselinePerCapitaGrowthPct / 100, t);
    const headroomTWh = Math.max(0, globalSupplyTWh - baselineDemandTWh);

    const unservedTWh = Math.max(0, totalDemandTWh - headroomTWh);
    const demandShareOfGlobalPct = (totalDemandTWh / globalSupplyTWh) * 100;

    rows.push({
      year,
      consumerUsersB,
      corpUsersB,
      agentsB,
      consumerTWh,
      corpTWh,
      agentTWh,
      totalDemandTWh,
      globalSupplyTWh,
      baselineDemandTWh,
      headroomTWh,
      unservedTWh,
      demandShareOfGlobalPct,
    });
  }
  return rows;
}

export function findBreakeven(rows: YearRow[]): BreakevenResult {
  // Crossing of total demand (non-AI + AI) and generation, interpolated between
  // years so the marker sits exactly where the stack meets the supply line.
  const total = (r: YearRow) => r.baselineDemandTWh + r.totalDemandTWh;
  if (rows.length && total(rows[0]) > rows[0].globalSupplyTWh) {
    return { breakevenYear: rows[0].year, crossingX: rows[0].year };
  }
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1];
    const b = rows[i];
    const da = total(a) - a.globalSupplyTWh;
    const db = total(b) - b.globalSupplyTWh;
    if (da <= 0 && db > 0) {
      const crossingX = a.year + (0 - da) / (db - da);
      return { breakevenYear: Math.round(crossingX), crossingX };
    }
  }
  return { breakevenYear: null, crossingX: null };
}

/**
 * Compare closing the final-year demand gap on Earth vs from orbit.
 *
 * Earth: cost = gap power (W) x $/W.
 * Space: per delivered watt you pay (a) launch for the mass needed and
 *        (b) the non-launch hardware. Orbital solar productivity reduces the
 *        mass of generation needed per delivered watt by `spaceSolarMultiplier`.
 */
export function compareSpace(rows: YearRow[], p: Params): SpaceComparison {
  // Size the comparison against the LARGEST unserved gap over the horizon.
  // Efficiency trends can make demand peak then ease, so the final year is not
  // necessarily the year you need the most extra capacity.
  let peak = rows[0];
  for (const r of rows) if (r.unservedTWh > peak.unservedTWh) peak = r;
  const gapTWh = peak.unservedTWh;

  // Average continuous power the gap represents: TWh/yr -> W.
  const gapAvgW = (gapTWh * WH_PER_TWH) / HOURS_PER_YEAR;
  const gapAvgGW = gapAvgW / 1e9;

  // Earth: simple $/W of new clean generation + data center.
  const earthCost = gapAvgW * p.earthCostPerW;

  // Space: launch cost per delivered watt. Mass per kW is reduced by the
  // orbital solar advantage (fewer panels per usable watt), then converted to
  // $/W via the launch price. Add fixed non-launch hardware $/W.
  const effectiveKgPerKw = p.spaceKgPerKw / p.spaceSolarMultiplier + p.spaceKgPerKw * 0.5;
  // ^ generation mass scales with solar gain; compute/bus mass (~half) does not.
  const kgPerW = effectiveKgPerKw / 1000;
  const launchPerW = kgPerW * p.launchCostPerKg;
  const spaceCostPerW = launchPerW + p.spaceNonLaunchCostPerW;
  const spaceCost = gapAvgW * spaceCostPerW;

  // Launch $/kg at which space total == earth total.
  const breakevenLaunchCostPerKg =
    kgPerW > 0 ? (p.earthCostPerW - p.spaceNonLaunchCostPerW) / kgPerW : 0;

  return {
    gapYear: peak.year,
    gapTWhAtEnd: gapTWh,
    gapAvgGW,
    earthCostT: earthCost / 1e12,
    spaceCostT: spaceCost / 1e12,
    spaceCostPerW,
    breakevenLaunchCostPerKg,
    cheaper: spaceCost < earthCost ? "space" : "earth",
  };
}

// Convenience: format a TWh number with sensible units.
export function fmtEnergy(twh: number): string {
  if (twh >= 1000) return `${(twh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} PWh`;
  if (twh >= 1) return `${twh.toLocaleString(undefined, { maximumFractionDigits: 0 })} TWh`;
  return `${(twh * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} GWh`;
}

export function fmtNum(n: number, digits = 1): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
