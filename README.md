# ShinkeiOS Lite — Traceability & Quality Engine

> *Artisanal quality at industrial scale.*

ShinkeiOS Lite is a dispatch-grade operations dashboard simulating the internal software of [Shinkei Systems](https://shinkei.systems/). It tracks seafood batches from harvest to plate, projects their remaining shelf life from biometric sensor telemetry, and recommends the right sales lane for each batch before the quality curve catches up.

The app combines two engines:

- **CHRN (Chronos)** — chain-of-custody traceability and origin tracking on an interactive ocean map.
- **NERA** — a biometric quality engine that converts raw MQ-135 ammonia readings into a freshness score, forecasts hours-to-unsellable, and assigns a routing recommendation with revenue-at-risk attached.

---

## ✨ What it does

| Capability | What the user gets |
|---|---|
| **Chain-of-custody traceability** | Every batch carries a GDST-compatible timeline (harvesting → transporting → receiving → processing) with location and timestamp. |
| **Freshness scoring** | Each MQ-135 ppm reading is mapped to a 0–100% freshness score using species-calibrated baselines. |
| **Shelf-life forecast** | A trailing-window linear regression on the ammonia trend projects exact hours until the batch crosses the "unsellable" and "spoiled" thresholds, with R² confidence. |
| **Routing recommendation** | Every batch is auto-assigned to one of four sales lanes (Premium Direct / Standard Wholesale / Process Now / Reject) with a plain-English rationale. |
| **Revenue at risk** | Dollar exposure per batch is derived from per-species market price × batch weight × lane-dependent loss factor — so the fleet's $-at-risk is a tracked number, not a guess. |
| **Operations triage** | A dedicated routing view groups batches into actionable lanes so a dispatcher can act on the most urgent first. |
| **Per-species profiling** | Side-by-side comparison of decay signatures so adding a new species (the company's stated scaling problem) is one calibration row. |

---

## 🖥️ The five views

| Route | Purpose | Star feature |
|---|---|---|
| `/` | Overview dashboard | KPI strip + map + triage panel + inventory table on one fluid screen |
| `/fleet` | CHRN fleet map | Full-page Leaflet map with rich on-hover tooltips and a clickable batch list |
| `/quality` | NERA quality telemetry | The inventory table sorted by hours-to-unsellable — most urgent at the top |
| `/routing` | Routing & triage | Four lane cards giving the dispatcher an actionable to-do list per shift |
| `/species` | Species profiles | Per-species cards comparing decay rate, freshness, and revenue exposure |

Every batch row, marker, or lane entry opens a **NERA diagnostic modal** with the full ammonia degradation chart (with the sellable threshold and lost-zone shading), the routing rationale, R² confidence, batch market value, and the full CHRN traceability log.

---

## 📊 Real-world data integration

This project deliberately runs on real scientific and spatial datasets rather than randomized fake data.

1. **Biometric sensor telemetry — DaFiF dataset**
   - Source: *DaFiF: A Complete Dataset for Fish's Freshness Problems* (Prasetyo et al., Mendeley Data, DOI: [10.17632/vx4ptwk3pb.1](https://data.mendeley.com/datasets/vx4ptwk3pb/1)).
   - Content: ~14,500 MQ-135 gas sensor readings for **Mackerel**, **Tilapia**, and **Tuna** decaying on ice over 11 days.
   - Use: Calibrates per-species baseline (≈70 ppm fresh) and spoiled-threshold (≈190 ppm) values; drives the freshness score and the shelf-life forecast.

2. **Vessel origin coordinates — Global Fishing Watch**
   - Source: AIS vessel-tracking logs for the Western Pacific Ocean near Japan.
   - Use: Real-world lat/lng for 5 simulated harvest vessels so the CHRN map shows authentic ocean positions.

---

## 🧪 The NERA forecast engine

`src/lib/freshness.ts` is the brain of the app. It exports five primitives, all pure functions.

### 1. `calculateFreshness(mq135Value, species) → 0..100`
Linear interpolation between the species' fresh baseline and spoiled maximum, inverted to give a freshness score:

```
freshness = 100 − ((mq135 − baseline) / (maximum − baseline)) × 100
```

**Example — Tuna at 130 ppm:** `(130 − 70.13) / (190.42 − 70.13) = 0.4975` → `100 − 49.75 ≈ 50%` freshness.

### 2. `forecastBatch(species, readings) → ForecastResult`
The headline algorithm.

1. Score the latest reading with `calculateFreshness`.
2. Take the trailing **30%** of the reading history (so the slope reflects recent steepening, not the 11-day average).
3. Run **OLS linear regression** on `(hours_since_first, ppm)`.
4. Project the slope forward to find the hours until the batch crosses two thresholds:
   - **Sellable threshold** at 40% freshness (`baseline + 0.6 × (maximum − baseline)` ppm)
   - **Spoiled threshold** at 0% freshness (the species `maximum`)
5. Compute **R²** of the regression — surfaced in the UI so the forecast is honest about its confidence.
6. Call `recommend()` to pick a sales lane.

Returns: `currentFreshness`, `slopePpmPerHour`, `hoursToUnsellable`, `hoursToSpoil`, `predictedUnsellableAt` (ISO timestamp), `recommendation`, and `confidence` (R²).

### 3. `recommend(freshness, hoursToUnsellable) → Routing`
The decision tree behind every batch's lane assignment:

| Condition | Class | Lane |
|---|---|---|
| freshness < 10% | `reject` | Reject — Unfit for Sale |
| freshness < 40% | `process` | Immediate Processing / Freeze |
| freshness ≥ 80% AND > 96h headroom | `premium` | Seremoni Direct-to-Consumer |
| hoursToUnsellable < 36 | `process` | Pull from premium lane now |
| otherwise | `standard` | Wholesale Market |

Each return includes a `rationale` string the UI prints verbatim.

### 4. `revenueAtRisk(species, recommendation) → USD`
`base = pricePerKg × batchKg`, then lane-dependent loss:

| Class | Loss % | Reasoning |
|---|---|---|
| premium | 0% | Full price retained |
| standard | 10% | Wholesale discount |
| process | 55% | Freezing/canning ≈ half fresh price |
| reject | 100% | Total write-off |

**Example — Tuna ($42/kg × 180kg = $7,560) in Process Now:** `$7,560 × 0.55 = $4,158` at risk.

### 5. `getSpeciesProfile(species)`
Returns the calibrated thresholds and pricing for a species. **Adding a new species is one row of data** — the explicit scaling story for the role.

---

## 🌐 API endpoints

### `GET /batches`
Master list — one round trip pulls everything the dashboard needs.

For every batch the response includes the species, origin coordinates, current freshness, the **24-point sparkline** (downsampled server-side), forecast slope, hours-to-thresholds, R² confidence, routing recommendation, revenue at risk, and the most recent traceability stop.

### `GET /batches/[id]`
Detail view for the NERA modal. Returns the full traceability log + chart-grade telemetry + forecast + species profile + a `_metadata` block stating total vs. returned reading counts.

**Performance notes:**
- Telemetry is **downsampled to ~120 points** (`step = ceil(n / 120)`) so the modal opens instantly.
- The **forecast still runs on the raw readings**, so accuracy is unaffected by the chart downsample.
- Pass `?raw=true` to bypass downsampling for debugging.

---

## 🛠️ Technical stack

- **Framework:** Next.js 16 (App Router) · TypeScript · React 19
- **Styling:** Tailwind v4 + custom design tokens, shadcn/ui primitives
- **Fonts:** Inter (body), Fraunces (display, italic), JetBrains Mono (data)
- **Database:** PostgreSQL (Supabase) via Prisma ORM
- **Mapping:** React-Leaflet + CartoDB dark tiles, custom CircleMarker styling
- **Charts:** Recharts (dotless line, downsampled data, reference-line/area for thresholds)
- **Visualizations:** Bespoke SVG sparklines, halftone fish silhouettes, animated KPIs

---

## 🎨 Design

The visual identity mirrors [shinkei.systems](https://shinkei.systems/) directly:

- **Cream/paper surfaces** (`#f3eee5` / `#faf6ec`) with warm-ink type (`#1c1612`)
- **Signature Shinkei orange** (`#ff6b1a`) as the primary accent
- **Halftone dot pattern** as paper texture on every cream card
- **Italic Fraunces display headings** for editorial feel
- **JetBrains Mono eyebrows** in uppercase, wide letter-spacing
- **Dark surfaces** reserved for data-density contexts (map, modal chart)
- **Motion** — entrance fades, count-up KPIs, pulsing live dots, hover lift, animated triage bar widths

---

## 🚀 Getting started

### 1. Prerequisites
Node.js v18+ and npm.

### 2. Install
```bash
npm install
```

### 3. Configure
Create `.env`:
```env
DATABASE_URL="postgresql://postgres:[your-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?workaround=supabase-pooler.node"
```

### 4. Seed
```bash
npx prisma db push          # apply schema to Supabase
npx tsx prisma/seed.ts      # ingest DaFiF + GFW data (~14,500 rows)
```

### 5. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 📈 Engineering notes

- **Real-data pipeline.** A Node script normalizes 11 days of raw Excel sheets (3 species each) into a single canonical CSV, then the seed script bulk-loads it with Prisma `createMany`.
- **API-level downsampling.** `/batches/[id]` ships ~120 chart points instead of ~3,000; `/batches` ships a 24-point sparkline per row. The database keeps the full audit trail intact.
- **Forecast accuracy preserved.** The detail endpoint downsamples only the *chart payload* — the forecast itself runs against the raw reading set.
- **Trailing-window regression.** The forecast reads only the last 30% of the curve so it reacts to recent steepening rather than the 11-day average.
- **Confidence surfaced.** R² is shown on every batch row and in the modal so the UI is honest about projection quality.
- **Prisma client singleton.** Prevents Supabase pooler exhaustion during Next.js hot-reload cycles.
- **Stable SVG ids via `useId`.** Halftone gradient/mask ids stay consistent across SSR and CSR, eliminating hydration warnings.
- **Type safety end-to-end.** A single shared `Batch` type powers the API, the hook, and every consumer component.

---

## 🗂️ Project structure

```
shinkeios-lite/
├── prisma/
│   ├── schema.prisma          # Batch / TraceabilityEvent / SensorReading
│   └── seed.ts                # DaFiF + GFW ingestion
├── public/data/
│   ├── dafif.csv              # 14,500 MQ-135 readings (Mackerel/Tuna/Tilapia)
│   └── vessels.json           # 5 Western Pacific vessel coordinates
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Fonts, metadata, body shell
│   │   ├── globals.css        # Brand tokens, halftone patterns, animations
│   │   ├── page.tsx           # / — Overview dashboard
│   │   ├── fleet/page.tsx     # /fleet — CHRN map view
│   │   ├── quality/page.tsx   # /quality — NERA urgency-sorted table
│   │   ├── routing/page.tsx   # /routing — Triage & lane breakdown
│   │   ├── species/page.tsx   # /species — Per-species comparison
│   │   └── batches/
│   │       ├── route.ts       # GET /batches (master list + forecasts)
│   │       └── [id]/route.ts  # GET /batches/:id (detail + chart payload)
│   ├── components/
│   │   ├── AppShell.tsx       # Sidebar + topbar frame
│   │   ├── MetricsRow.tsx     # KPI strip with count-up animation
│   │   ├── DashboardMap.tsx   # Leaflet map, tooltips, legend
│   │   ├── InventoryTable.tsx # Inline sparklines + freshness + routing
│   │   ├── TriagePanel.tsx    # Stacked routing breakdown
│   │   ├── SpeciesBreakdown.tsx
│   │   ├── QualityModal.tsx   # NERA diagnostic dialog
│   │   ├── Sparkline.tsx
│   │   ├── HalftoneFish.tsx   # Decorative SVG (per-species)
│   │   └── ui/                # shadcn primitives
│   └── lib/
│       ├── freshness.ts       # NERA forecast engine
│       ├── useBatches.ts      # React hook for /batches
│       ├── types.ts           # Shared Batch interface
│       ├── prisma.ts          # Singleton client
│       └── utils.ts
```

---

## 📚 Data sources & credits

- DaFiF dataset — Prasetyo et al., Mendeley Data, DOI [10.17632/vx4ptwk3pb.1](https://data.mendeley.com/datasets/vx4ptwk3pb/1).
- Vessel coordinates — modeled on [Global Fishing Watch](https://globalfishingwatch.org/) AIS observations of the Western Pacific.
- Visual language — inspired by [shinkei.systems](https://shinkei.systems/).

---

*Built as a portfolio piece for the Fullstack Engineer role at Shinkei Systems.*
