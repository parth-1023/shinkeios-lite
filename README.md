# ShinkeiOS Lite: Traceability & Biometric Quality Engine

ShinkeiOS Lite is a high-performance logistics and biometric telemetry dashboard simulating the core capabilities of Shinkei Systems' internal software. The application is divided into two primary engines:

*   **CHRN (Chronos):** A real-time logistics dashboard mapping and tracking seafood batches from the point of harvest (at sea) to intermediate ports and central distribution hubs.
*   **NERA:** A biometric quality tracking system that processes telemetry from raw gas sensors, translates biological markers into objective shelf-life projections, and displays real-time degradation diagnostics.

---

## 📊 Real-World Data Integration

Rather than using randomized fake data, this project is built on real scientific and spatial datasets:

1.  **Biometric Sensor Telemetry (DaFiF Dataset):**
    *   **Source:** *DaFiF: A Complete Dataset for Fish's Freshness Problems* (Prasetyo et al., Mendeley Data, DOI: 10.17632/vx4ptwk3pb.1).
    *   **Data:** Raw readings from **MQ-135** gas sensors tracking ammonia gas emissions of mackerel, tilapia, and tuna decaying on ice over an 11-day period.
    *   **NERA Freshness Algorithm:** The application takes the rising ammonia ppm levels (varying from a fresh baseline of ~70 ppm to a spoiled threshold of ~190 ppm) and mathematically converts them into a declining freshness score (100% to 0%).
2.  **Origin Map Coordinates:**
    *   **Source:** Simulated based on real vessel AIS tracking logs in the Western Pacific Ocean near Japan from the **Global Fishing Watch** database.

---

## 🛠️ Technical Stack & Architecture

*   **Frontend Framework:** Next.js (App Router) & TypeScript
*   **Styling:** Tailwind CSS & Shadcn UI
*   **Database & ORM:** PostgreSQL (Supabase) with Prisma ORM
*   **Mapping:** Leaflet & React-Leaflet (loaded dynamically with client-side SSR disabled)
*   **Data Visualization:** Recharts (optimized for high-density rendering by disabling active SVG node markers to prevent rendering lag)
*   **Data Pipe:** Node.js merge script to parse, extract, and clean 14,000+ raw records from multi-day Excel sheets.
*   **High Performance Seeding:** Utilizing Prisma `createMany` for bulk database ingestion.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:[your-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?workaround=supabase-pooler.node"
```

### 4. Database Setup & Seeding
```bash
# Push database schema to Supabase
npx prisma db push

# Run the raw dataset seed script
npx tsx prisma/seed.ts
```

### 5. Start the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📈 Engineering Achievements & Optimizations

*   **Data Pipeline:** Standardized raw Excel sheets containing 14,000+ entries across 11 days.
*   **API-Level Downsampling:** The `/batches/[id]` endpoint automatically downsamples telemetry from 4,800+ entries per batch to ~120 points for chart rendering, loading charts instantly while keeping the database audit trail completely intact. Developers can bypass downsampling by adding `?raw=true`.
*   **Prisma Client Singleton:** Prevents database connection exhaustion during local Next.js hot-reloads.
