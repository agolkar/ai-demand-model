# The AI Energy Wall — interactive model

An interactive, web-based model that estimates future demand for AI services,
the electricity that demand requires, the point at which it outruns the
electricity Earth can spare for it, and the economic case for **space-based
data centers** to close the gap.

Every assumption is a knob. Move it and the charts recompute in real time.

## What it models

The model follows a transparent pipeline, segment by segment:

1. **Who (and what) uses AI** — three demand segments, each an adoption S-curve:
   - **Consumer** — people using chatbots/assistants directly (~1B today).
     Bounded by human headcount.
   - **Corporate** — knowledge workers augmented by AI in their jobs. Also
     bounded by headcount.
   - **Autonomous agents** — a compute/capital-driven fleet, *decoupled from
     human headcount* (software that spawns software), running 24/7 with
     order-of-magnitude heavier inference. This is the term that can outrun a
     saturating human base, and it dominates the long run.
2. **Energy demand** — units × queries/day × Wh/query × PUE × training overhead.
   Per-query energy evolves under two opposing forces: hardware **efficiency**
   (cheaper per query) and a **Jevons rebound** (savings re-spent on more and
   heavier work). At 100% rebound the two cancel and demand follows pure volume.
3. **Earth's supply** — global electricity generation growing at a chosen rate,
   and the share society is willing to allocate to AI.
4. **Breakeven** — the first year AI demand exceeds the AI-allocatable budget
   (and, separately, total global generation).
5. **Unserved gap** — demand beyond what Earth supplies: the addressable market.
6. **Earth vs space** — cost to close the peak gap by building on the ground
   versus launching to orbit, solving for the launch $/kg at which space wins.

All math lives in [`src/model/`](src/model/) and is a pure function of the
parameters — no hidden state. Default values are seeded from public mid-2026
data; see the "Where the defaults come from" section in the app for citations.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm run typecheck  # tsc --noEmit
```

## Tech

Vite + React + TypeScript + Recharts. The model logic is deliberately decoupled
from the UI (`src/model/`), so it can be unit-tested, reused, or swapped for a
more detailed engine without touching the interface.

## Deploy to Cloudflare Pages

See [DEPLOY.md](DEPLOY.md) for step-by-step instructions to create the GitHub
repo, deploy to `pages.dev`, and attach the `golkar.ai` custom domain.

Quick version — Cloudflare Pages auto-detects Vite. Build settings:

| Setting           | Value           |
| ----------------- | --------------- |
| Build command     | `npm run build` |
| Build output dir  | `dist`          |
| Node version      | `20` or newer   |
