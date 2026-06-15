// ShinkeiOS Lite — biometric quality engine
//
// Translates MQ-135 ammonia telemetry from the DaFiF dataset into:
//   1. A current freshness score (0–100)
//   2. A linear projection of remaining sellable shelf-life
//   3. A routing recommendation (Premium / Standard / Process Now / Reject)
//   4. A revenue-at-risk estimate
//
// This mirrors the "NERA" capability described on shinkei.systems and gives
// dispatchers an at-a-glance answer to the only question that matters at the
// dock: where should this batch go, and how soon?

interface SpeciesThresholds {
    baseline: number;       // ppm at day 1 (fresh)
    maximum: number;        // ppm at day 11 (spoiled)
    // Approx. wholesale value per kg (USD), used for revenue-at-risk math.
    // Premium ike jime pricing references; Shinkei's pitch is the 3x lift.
    pricePerKg: number;
    // Typical batch weight per harvest event (kg).
    batchKg: number;
}

const thresholds: Record<string, SpeciesThresholds> = {
    mackerel: { baseline: 70.65, maximum: 186.24, pricePerKg: 18, batchKg: 220 },
    tilapia:  { baseline: 69.97, maximum: 183.36, pricePerKg: 9,  batchKg: 300 },
    tuna:     { baseline: 70.13, maximum: 190.42, pricePerKg: 42, batchKg: 180 },
};

const SELLABLE_FRESHNESS_THRESHOLD = 40; // below this = Process Now / Reject
const PREMIUM_FRESHNESS_THRESHOLD = 80;  // above this = direct-to-consumer grade

export interface SpeciesProfile {
    baseline: number;
    maximum: number;
    pricePerKg: number;
    batchKg: number;
}

export function getSpeciesProfile(species: string): SpeciesProfile {
    const spec = species.trim().toLowerCase();
    return thresholds[spec] || { baseline: 70.0, maximum: 186.0, pricePerKg: 15, batchKg: 220 };
}

/**
 * Translate one MQ135 reading into a 0–100 freshness percentage.
 */
export function calculateFreshness(mq135Value: number, species: string): number {
    const { baseline, maximum } = getSpeciesProfile(species);
    if (mq135Value <= baseline) return 100;
    if (mq135Value >= maximum) return 0;
    const freshness = 100 - ((mq135Value - baseline) / (maximum - baseline)) * 100;
    return Math.round(Math.max(0, Math.min(100, freshness)));
}

export interface TrendReading {
    recordedAt: Date | string;
    mq135Value: number;
}

export interface ForecastResult {
    /** Current freshness % from the most recent reading. */
    currentFreshness: number;
    /** ppm/hour slope from linear regression over the trailing window. */
    slopePpmPerHour: number;
    /** Estimated hours from "now" until freshness hits the sellable threshold. */
    hoursToUnsellable: number | null;
    /** Estimated hours until freshness hits 0% (fully spoiled). */
    hoursToSpoil: number | null;
    /** Wall-clock timestamp at which the batch crosses the sellable threshold. */
    predictedUnsellableAt: string | null;
    /** Quality-class routing recommendation. */
    recommendation: Routing;
    /** Confidence in the projection (0–1) based on R² of the regression. */
    confidence: number;
}

export type Routing =
    | { class: "premium"; label: string; lane: "Seremoni Direct-to-Consumer"; rationale: string }
    | { class: "standard"; label: string; lane: "Wholesale Market"; rationale: string }
    | { class: "process"; label: string; lane: "Immediate Processing / Freeze"; rationale: string }
    | { class: "reject"; label: string; lane: "Reject — Unfit for Sale"; rationale: string };

/**
 * Linear regression of ppm vs. hours-since-catch over the trailing window.
 * Returns slope (ppm/hr), intercept (ppm at first reading), and R².
 */
function linearFit(readings: TrendReading[]): { slope: number; intercept: number; r2: number } {
    if (readings.length < 2) return { slope: 0, intercept: readings[0]?.mq135Value ?? 70, r2: 0 };

    const t0 = new Date(readings[0].recordedAt).getTime();
    const points = readings.map(r => ({
        x: (new Date(r.recordedAt).getTime() - t0) / 3_600_000, // hours since first
        y: r.mq135Value,
    }));

    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
    const meanY = sumY / n;

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return { slope: 0, intercept: meanY, r2: 0 };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const ssRes = points.reduce((s, p) => {
        const pred = slope * p.x + intercept;
        return s + (p.y - pred) ** 2;
    }, 0);
    const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { slope, intercept, r2 };
}

/**
 * Convert a batch's full reading history into a current state + forecast.
 *
 * Mathematically: project the recent ammonia slope forward to find when ppm
 * crosses the species' "sellable" and "spoiled" thresholds. This is a simple
 * linear extrapolation — real Shinkei NERA almost certainly uses richer
 * biophysical modeling, but for a dispatch screen the linear approximation
 * captures the urgency correctly and is honest about its confidence (R²).
 */
export function forecastBatch(
    species: string,
    readings: TrendReading[],
): ForecastResult {
    const profile = getSpeciesProfile(species);
    const latest = readings[readings.length - 1];
    const currentFreshness = latest
        ? calculateFreshness(latest.mq135Value, species)
        : 100;

    // Use the trailing 30% of the window for the slope so we react to *recent*
    // degradation rather than averaging over the whole 11-day curve.
    const tailStart = Math.max(0, Math.floor(readings.length * 0.7));
    const tail = readings.slice(tailStart);
    const { slope, r2 } = linearFit(tail.length >= 2 ? tail : readings);

    const sellablePpm =
        profile.baseline +
        ((100 - SELLABLE_FRESHNESS_THRESHOLD) / 100) * (profile.maximum - profile.baseline);
    const spoiledPpm = profile.maximum;

    const latestPpm = latest?.mq135Value ?? profile.baseline;
    const hoursToUnsellable =
        slope > 0 && latestPpm < sellablePpm
            ? (sellablePpm - latestPpm) / slope
            : slope > 0
                ? 0
                : null;
    const hoursToSpoil =
        slope > 0 && latestPpm < spoiledPpm
            ? (spoiledPpm - latestPpm) / slope
            : slope > 0
                ? 0
                : null;

    const predictedUnsellableAt =
        hoursToUnsellable !== null && latest
            ? new Date(
                  new Date(latest.recordedAt).getTime() + hoursToUnsellable * 3_600_000,
              ).toISOString()
            : null;

    return {
        currentFreshness,
        slopePpmPerHour: Number(slope.toFixed(3)),
        hoursToUnsellable:
            hoursToUnsellable === null ? null : Math.max(0, Math.round(hoursToUnsellable)),
        hoursToSpoil:
            hoursToSpoil === null ? null : Math.max(0, Math.round(hoursToSpoil)),
        predictedUnsellableAt,
        recommendation: recommend(currentFreshness, hoursToUnsellable),
        confidence: Math.max(0, Math.min(1, Number(r2.toFixed(2)))),
    };
}

function recommend(currentFreshness: number, hoursToUnsellable: number | null): Routing {
    if (currentFreshness < SELLABLE_FRESHNESS_THRESHOLD) {
        return currentFreshness < 10
            ? {
                  class: "reject",
                  label: "Reject",
                  lane: "Reject — Unfit for Sale",
                  rationale: "Past spoilage threshold — divert to waste / rendering.",
              }
            : {
                  class: "process",
                  label: "Process Now",
                  lane: "Immediate Processing / Freeze",
                  rationale: "Below sellable freshness — flash freeze or process within hours.",
              };
    }
    if (
        currentFreshness >= PREMIUM_FRESHNESS_THRESHOLD &&
        (hoursToUnsellable === null || hoursToUnsellable >= 96)
    ) {
        return {
            class: "premium",
            label: "Premium Direct",
            lane: "Seremoni Direct-to-Consumer",
            rationale: "Premium grade with >4 days remaining shelf life. Highest margin lane.",
        };
    }
    if (hoursToUnsellable !== null && hoursToUnsellable < 36) {
        return {
            class: "process",
            label: "Process Now",
            lane: "Immediate Processing / Freeze",
            rationale: "Will drop below sellable in under 36h — pull from premium lane.",
        };
    }
    return {
        class: "standard",
        label: "Standard",
        lane: "Wholesale Market",
        rationale: "Healthy curve, route through standard wholesale channels.",
    };
}

/** Revenue at risk in USD if this batch isn't moved before it spoils. */
export function revenueAtRisk(species: string, recommendation: Routing): number {
    const profile = getSpeciesProfile(species);
    const base = profile.pricePerKg * profile.batchKg;
    switch (recommendation.class) {
        case "premium":
            return 0;
        case "standard":
            return Math.round(base * 0.1);
        case "process":
            return Math.round(base * 0.55);
        case "reject":
            return Math.round(base);
    }
}

export const FRESHNESS_THRESHOLDS = {
    sellable: SELLABLE_FRESHNESS_THRESHOLD,
    premium: PREMIUM_FRESHNESS_THRESHOLD,
};
