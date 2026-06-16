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
  baseline: "#64748b",
  consumer: "#38bdf8",
  corp: "#a78bfa",
  agent: "#f472b6",
  supply: "#facc15",
  earth: "#60a5fa",
  space: "#fb923c",
};

export default function App() {
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [logScale, setLogScale] = useState(false);

  const update = (key: keyof Params, value: number) =>
    setParams((p) => ({ ...p, [key]: value }));
  const reset = () => setParams(DEFAULTS);

  const rows = useMemo(() => runModel(params), [params]);
  const breakeven = useMemo(() => findBreakeven(rows), [rows]);
  const space = useMemo(() => compareSpace(rows, params), [rows, params]);

  const last = rows[rows.length - 1];
  const beYear = breakeven.breakevenYear;
  const crossingX = breakeven.crossingX;
  const agentVsConsumer = last.consumerTWh > 0 ? Math.round(last.agentTWh / last.consumerTWh) : 0;
  const agentVsCorp = last.corpTWh > 0 ? Math.round(last.agentTWh / last.corpTWh) : 0;

  // Live validation against published benchmarks (at current settings).
  const chatgptTWh = (2.5e9 * params.whPerQuery * 365) / 1e12; // ChatGPT scale: 2.5B queries/day
  const validations = [
    { q: `Global electricity generation (${params.baseYear} base)`, model: `${fmtNum(params.globalGenerationTWh, 0)} TWh`, bench: "30,664 TWh (2024)", src: "Ember 2025" },
    { q: "World population (base year)", model: `${fmtNum(params.worldPopulationB, 1)} B`, bench: "8.3 B (2026)", src: "UN / Worldometer" },
    { q: "Energy per AI query", model: `${fmtNum(params.whPerQuery, 2)} Wh`, bench: "0.24–0.34 Wh", src: "Epoch AI; OpenAI" },
    { q: "ChatGPT inference (2.5B queries/day)", model: `${fmtNum(chatgptTWh, 2)} TWh/yr`, bench: "~0.3 TWh/yr", src: "OpenAI disclosures" },
    { q: `AI electricity, ${params.baseYear} (AI only)`, model: `~${fmtNum(rows[0].totalDemandTWh, 0)} TWh`, bench: "~40–85 TWh (AI ≈10–20% of 415 TWh all data centers)", src: "IEA 2024" },
  ];

  return (
    <div className="app">
      <div className="ai-banner" role="alert">
        <div className="ai-banner-row">
          <span className="ai-banner-icon">⚠</span>
          <span>
            This model has been AI-generated (Claude Opus 4.8, Anthropic, under
            the supervision of A. Golkar) and is currently undergoing
            verification. Do not trust the model results unless manually
            verified.
          </span>
        </div>
        <nav className="ai-banner-links">
          <a href="https://github.com/agolkar/ai-demand-model" target="_blank" rel="noreferrer">
            GitHub repository
          </a>
          <a href="/explainer.html" target="_blank" rel="noreferrer">
            Plain-language explainer
          </a>
          <a href="/technical-report.pdf" target="_blank" rel="noreferrer">
            Technical report (PDF)
          </a>
          <a href="mailto:golkar@tum.de">Feedback: golkar@tum.de</a>
        </nav>
      </div>

      <header className="hero">
        <div className="byline">
          © 2026 Alessandro Golkar, Technical University of Munich
        </div>
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
          <div className="card-label">Breakeven year</div>
          <div className="card-value">{beYear ?? "—"}</div>
          <div className="card-sub">
            {beYear
              ? "total demand exceeds generation"
              : "demand within generation through horizon"}
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
            <ResponsiveContainer width="100%" height={330}>
              <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
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
            title="Steps 2–4 — Total electricity demand vs generation"
            desc="Actual consumption, stacked (TWh/yr): non-AI demand (homes, industry, transport) at the base, then AI by category — consumer, corporate, and agents — on top. The yellow line is total global generation. Where the whole stack rises above the line, the world cannot generate enough to serve everything: that crossing is the breakeven, and the overshoot is the unserved gap."
          >
            <div className="chart-toolbar">
              <label className="toggle">
                <input type="checkbox" checked={logScale} onChange={(e) => setLogScale(e.target.checked)} />
                Log scale
              </label>
            </div>
            <ResponsiveContainer width="100%" height={440}>
              <ComposedChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[params.baseYear, params.endYear]}
                  allowDecimals={false}
                  stroke="#94a3b8"
                />
                <YAxis
                  stroke="#94a3b8"
                  scale={logScale ? "log" : "auto"}
                  domain={logScale ? [1, "auto"] : [0, "auto"]}
                  allowDataOverflow
                  tickFormatter={(v) => (v >= 1000 ? `${fmtNum(v / 1000, 0)}k` : `${fmtNum(v, 0)}`)}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtEnergy(v)} />
                <Legend />
                <Area type="monotone" dataKey="baselineDemandTWh" name="Non-AI demand" stackId="1" stroke={COLORS.baseline} fill={COLORS.baseline} fillOpacity={0.45} />
                <Area type="monotone" dataKey="consumerTWh" name="AI · consumer" stackId="1" stroke={COLORS.consumer} fill={COLORS.consumer} fillOpacity={0.7} />
                <Area type="monotone" dataKey="corpTWh" name="AI · corporate" stackId="1" stroke={COLORS.corp} fill={COLORS.corp} fillOpacity={0.7} />
                <Area type="monotone" dataKey="agentTWh" name="AI · agents" stackId="1" stroke={COLORS.agent} fill={COLORS.agent} fillOpacity={0.7} />
                <Line type="monotone" dataKey="globalSupplyTWh" name="Total electricity generation" stroke={COLORS.supply} strokeWidth={2.5} dot={false} />
                {crossingX && <ReferenceLine x={crossingX} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `breakeven ${beYear}`, fill: "#ef4444", position: "top", fontSize: 12 }} />}
              </ComposedChart>
            </ResponsiveContainer>
            <p className="chart-foot">
              Non-AI demand already fills almost the entire grid today, so the AI
              categories are a thin band on top at first (see the category
              breakdown below for a legible view). As AI grows, agents dominate
              and the stack climbs toward the generation line. Where it crosses,
              total demand exceeds what the planet generates; the part of the
              stack above the yellow line is the unserved gap that faster Earth
              buildout or space data centers would have to serve.
            </p>
            <p className="chart-foot" style={{ borderTop: "none", paddingTop: 0 }}>
              Note on units: every figure here is <strong>electricity</strong>
              (~30,664 TWh generated globally in 2024, Ember). That is far below
              total <em>primary</em> energy (~180,000 TWh, the Our World in Data
              figure), which also counts oil, gas, and coal burned for transport,
              heat, and industry. AI data centers run on electricity, so
              electricity generation is the correct and binding supply here.
            </p>
          </ChartCard>

          <ChartCard
            title="AI energy by category — agents dwarf the rest"
            desc="The AI portion on its own, on a linear scale so the dominance is honest: agents tower while consumer and corporate appear pinned to the floor. They are not zero, though. The magnifier inset zooms the bottom 0–60 TWh to show they are very much there."
          >
            <div className="chart-relative">
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="year" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => (v >= 1000 ? `${fmtNum(v / 1000, 0)}k` : `${fmtNum(v, 0)}`)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtEnergy(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="consumerTWh" name="Consumer" stroke={COLORS.consumer} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="corpTWh" name="Corporate" stroke={COLORS.corp} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="agentTWh" name="Agents" stroke={COLORS.agent} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              <div className="inset">
                <div className="inset-title">🔍 Magnifier · bottom 0–60 TWh</div>
                <div className="inset-note">The slice the main chart flattens to nothing.</div>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
                    <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis stroke="#94a3b8" domain={[0, 60]} allowDataOverflow tick={{ fontSize: 10 }} width={26} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtEnergy(v)} />
                    <Line type="monotone" dataKey="consumerTWh" name="Consumer" stroke={COLORS.consumer} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="corpTWh" name="Corporate" stroke={COLORS.corp} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="agentTWh" name="Agents" stroke={COLORS.agent} strokeWidth={2} dot={false} strokeDasharray="3 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="chart-foot">
              By {last.year}, agents consume about {fmtNum(agentVsConsumer, 0)}× the
              electricity of all consumer AI and {fmtNum(agentVsCorp, 0)}× all
              corporate AI. Consumer and corporate are bounded by human headcount;
              agents are not, which is why the gap explodes. In the magnifier the
              agent line (dashed) shoots off the top almost immediately, while
              consumer and corporate stay legible below.
            </p>
          </ChartCard>

          <ChartCard
            title="Step 5 — The unserved gap"
            desc="The part of total demand that exceeds generation: AI demand the planet cannot power once non-AI needs are met. This is the market that faster Earth buildout or space data centers would have to serve."
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
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

      {/* ---- Validation against benchmarks ---- */}
      <section className="validation">
        <h2>Validation against known benchmarks</h2>
        <p className="sources-intro">
          A model is only as trustworthy as its anchors. At the default settings,
          the model reproduces independently published figures for the present
          day. The near-term AI numbers are order-of-magnitude consistent with the
          IEA; the long-run trajectory beyond ~2030 is a scenario you steer, not a
          benchmark.
        </p>
        <table className="val-table">
          <thead>
            <tr><th>Benchmark</th><th>This model</th><th>Published</th><th>Source</th></tr>
          </thead>
          <tbody>
            {validations.map((v) => (
              <tr key={v.q}>
                <td>{v.q}</td>
                <td className="val-model">{v.model}</td>
                <td>{v.bench}</td>
                <td className="val-src">{v.src}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="val-note">
          The first four rows are exact anchors or direct cross-checks. The AI
          row compares like for like: the model's ~38 TWh is AI-only, against the
          AI share (~10–20%) of the IEA's ~415 TWh for all data centers, not the
          whole 415 TWh (which also includes cloud, storage, and crypto). The
          model sits at the conservative end, partly because it folds training
          into a 25% overhead. Generation here is electricity, not primary energy
          (see the units note above).
        </p>
      </section>

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
        No unserved gap over the horizon under these assumptions. Generation keeps
        up with total demand, so there is no demand for space capacity yet. Raise
        agents per human, agent intensity, or non-AI demand growth to create one.
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
