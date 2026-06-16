import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import type { Params } from "./model/types";
import { DEFAULTS, ASSUMPTIONS } from "./model/defaults";
import { runModel, findBreakeven, compareSpace, fmtEnergy, fmtNum } from "./model/model";
import { CONTROL_GROUPS } from "./components/controlsConfig";
import { Slider } from "./components/Slider";

const COLORS = {
  consumer: "#38bdf8",
  corp: "#a78bfa",
  agent: "#f472b6",
  supply: "#facc15",
  allocatable: "#34d399",
  earth: "#60a5fa",
  space: "#fb923c",
};

export default function App() {
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [logScale, setLogScale] = useState(false);
  const [showGen, setShowGen] = useState(true);

  const update = (key: keyof Params, value: number) =>
    setParams((p) => ({ ...p, [key]: value }));
  const reset = () => setParams(DEFAULTS);

  const rows = useMemo(() => runModel(params), [params]);
  const breakeven = useMemo(() => findBreakeven(rows), [rows]);
  const space = useMemo(() => compareSpace(rows, params), [rows, params]);

  const last = rows[rows.length - 1];
  const beYear = breakeven.allocatableBreakevenYear;

  return (
    <div className="app">
      <header className="hero">
        <h1>The AI Energy Wall</h1>
        <p className="subtitle">
          When does AI demand outrun the electricity Earth can spare for it, and
          could space data centers close the gap? Every assumption below is a
          knob. Move it and watch the curves respond.
        </p>
      </header>

      {/* ---- Headline result cards ---- */}
      <section className="cards">
        <div className="card">
          <div className="card-label">AI users today</div>
          <div className="card-value">{fmtNum(rows[0].consumerUsersB, 2)}B</div>
          <div className="card-sub">
            of {fmtNum(params.worldPopulationB, 1)}B people (
            {fmtNum((rows[0].consumerUsersB / params.worldPopulationB) * 100, 0)}%)
          </div>
        </div>
        <div className="card">
          <div className="card-label">AI demand at {last.year}</div>
          <div className="card-value">{fmtEnergy(last.totalDemandTWh)}</div>
          <div className="card-sub">
            {fmtNum(last.demandShareOfGlobalPct, 0)}% of all global electricity
          </div>
        </div>
        <div className={`card ${beYear ? "card-alert" : "card-ok"}`}>
          <div className="card-label">Breakeven (AI budget)</div>
          <div className="card-value">{beYear ?? "—"}</div>
          <div className="card-sub">
            {beYear
              ? `demand exceeds the ${params.allocatableSharePct}% slice of grid`
              : "within budget through horizon"}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Peak unserved gap</div>
          <div className="card-value">{fmtEnergy(space.gapTWhAtEnd)}</div>
          <div className="card-sub">
            {space.gapTWhAtEnd > 0
              ? `~${fmtNum(space.gapAvgGW, 0)} GW continuous, peaking ${space.gapYear}`
              : "no gap through horizon"}
          </div>
        </div>
      </section>

      <div className="layout">
        {/* ---- Charts column ---- */}
        <main className="charts">
          <ChartCard
            title="Step 1 — Who (and what) is using AI?"
            desc="Adoption as an S-curve for each segment. Consumers and workers are bounded by human headcount (billions of people). Agents are a compute-driven fleet (billions of running instances) decoupled from headcount, so they overtake and dwarf the human segments. Log scale, so every segment stays visible across orders of magnitude."
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  scale="log"
                  domain={[0.01, "auto"]}
                  allowDataOverflow
                  tickFormatter={(v) => `${v}B`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => `${fmtNum(v, 2)}B`}
                />
                <Legend />
                <Line type="monotone" dataKey="consumerUsersB" name="Consumers" stroke={COLORS.consumer} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="corpUsersB" name="Corporate users" stroke={COLORS.corp} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="agentsB" name="AI agents" stroke={COLORS.agent} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Steps 2–4 — Energy demand vs Earth's supply"
            desc="Stacked AI energy demand by segment (TWh/yr). The dashed green line is the slice of global electricity society allocates to AI; the yellow line is total global generation, growing every year. Where the demand stack crosses green is the breakeven — the start of the gap that space could serve."
          >
            <div className="chart-toolbar">
              <label className="toggle">
                <input type="checkbox" checked={logScale} onChange={(e) => setLogScale(e.target.checked)} />
                Log scale
              </label>
              <label className="toggle">
                <input type="checkbox" checked={showGen} onChange={(e) => setShowGen(e.target.checked)} />
                Show total global generation
              </label>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  scale={logScale ? "log" : "auto"}
                  domain={logScale ? [1, "auto"] : [0, "auto"]}
                  allowDataOverflow
                  tickFormatter={(v) => (v >= 1000 ? `${fmtNum(v / 1000, 0)}k` : `${fmtNum(v, 0)}`)}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtEnergy(v)} />
                <Legend />
                <Area type="monotone" dataKey="consumerTWh" name="Consumer" stackId="1" stroke={COLORS.consumer} fill={COLORS.consumer} fillOpacity={0.55} />
                <Area type="monotone" dataKey="corpTWh" name="Corporate" stackId="1" stroke={COLORS.corp} fill={COLORS.corp} fillOpacity={0.55} />
                <Area type="monotone" dataKey="agentTWh" name="Agents" stackId="1" stroke={COLORS.agent} fill={COLORS.agent} fillOpacity={0.55} />
                <Line type="monotone" dataKey="aiAllocatableTWh" name="AI-allocatable supply" stroke={COLORS.allocatable} strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
                {showGen && (
                  <Line type="monotone" dataKey="globalSupplyTWh" name="Total global generation" stroke={COLORS.supply} strokeWidth={2.5} dot={false} />
                )}
                {beYear && <ReferenceLine x={beYear} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `breakeven ${beYear}`, fill: "#ef4444", position: "top", fontSize: 12 }} />}
              </ComposedChart>
            </ResponsiveContainer>
            <p className="chart-foot">
              Two breakevens matter. First the demand stack crosses the green
              line: AI outruns the share society will spare it (the market signal
              for new capacity, including space). Later it can cross the yellow
              line: desired AI compute outruns <em>all</em> of Earth's
              generation. Whether and when that second crossing happens is set
              mainly by the agent fleet ceiling and the Jevons rebound, not by
              anything fixed — they are yours to set.
            </p>
          </ChartCard>

          <ChartCard
            title="Step 5 — The unserved gap"
            desc="Demand beyond the AI-allocatable budget. This is the market that faster Earth buildout or space data centers would have to serve."
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${fmtNum(v / 1000, 0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtEnergy(v)} />
                <Area type="monotone" dataKey="unservedTWh" name="Unserved demand" stroke="#ef4444" fill="#ef4444" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Step 6 — Close the gap: Earth vs space"
            desc={`Cost to supply the peak gap (≈${fmtNum(space.gapAvgGW, 0)} GW continuous, around ${space.gapYear}). Space cost is dominated by launch price; the model solves for the launch $/kg at which orbit beats the ground.`}
          >
            <SpacePanel space={space} params={params} />
          </ChartCard>
        </main>

        {/* ---- Controls column ---- */}
        <aside className="controls">
          <div className="controls-head">
            <h2>Assumptions</h2>
            <button onClick={reset} className="reset-btn">Reset</button>
          </div>
          {CONTROL_GROUPS.map((g) => (
            <details key={g.title} className="group" open>
              <summary>
                <span className="group-title">{g.title}</span>
                <span className="group-blurb">{g.blurb}</span>
              </summary>
              {g.sliders.map((s) => (
                <Slider
                  key={s.param}
                  label={s.label}
                  param={s.param}
                  value={params[s.param]}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  unit={s.unit}
                  help={s.help}
                  onChange={update}
                />
              ))}
            </details>
          ))}
        </aside>
      </div>

      {/* ---- Sources / provenance ---- */}
      <section className="sources">
        <h2>Where the defaults come from</h2>
        <p className="sources-intro">
          Seeded from public data (mid-2026). Estimates are reasoned where no
          hard figure exists. Change any knob to test your own scenario.
        </p>
        <div className="source-grid">
          {ASSUMPTIONS.map((a) => (
            <div key={a.key} className="source-item">
              <div className="source-name">{a.label} <span className="source-unit">({a.unit})</span></div>
              <div className="source-note">{a.note}</div>
              {a.source && (
                <div className="source-cite">
                  {a.sourceUrl ? (
                    <a href={a.sourceUrl} target="_blank" rel="noreferrer">{a.source}</a>
                  ) : (
                    a.source
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="foot">
        <p>
          A transparent, adjustable model. Built to be argued with. All math is
          open in <code>src/model/</code>.
        </p>
      </footer>
    </div>
  );
}

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#e2e8f0",
};

function ChartCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <p className="chart-desc">{desc}</p>
      {children}
    </div>
  );
}

function SpacePanel({ space, params }: { space: ReturnType<typeof compareSpace>; params: Params }) {
  if (space.gapTWhAtEnd <= 0) {
    return (
      <div className="space-empty">
        No unserved gap in the final year under these assumptions. Earth's
        allocatable supply keeps up, so there is no demand for space capacity yet.
        Raise adoption, agent intensity, or lower the allocatable share to create one.
      </div>
    );
  }
  return (
    <div>
      <div className="space-bars">
        <Bar label="Build on Earth" value={space.earthCostT} max={Math.max(space.earthCostT, space.spaceCostT)} color={COLORS.earth} />
        <Bar label="Launch to orbit" value={space.spaceCostT} max={Math.max(space.earthCostT, space.spaceCostT)} color={COLORS.space} />
      </div>
      <div className="space-verdict">
        <div>
          Cheaper option:{" "}
          <strong style={{ color: space.cheaper === "space" ? COLORS.space : COLORS.earth }}>
            {space.cheaper === "space" ? "Space" : "Earth"}
          </strong>
        </div>
        <div className="verdict-detail">
          Space costs <strong>${fmtNum(space.spaceCostPerW, 2)}/W</strong> delivered at
          today's <strong>${fmtNum(params.launchCostPerKg, 0)}/kg</strong> launch price.
          Space beats Earth once launch falls below{" "}
          <strong>${fmtNum(space.breakevenLaunchCostPerKg, 0)}/kg</strong>.
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-value">${fmtNum(value, 1)}T</div>
    </div>
  );
}
