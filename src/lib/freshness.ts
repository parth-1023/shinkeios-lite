interface SpeciesThresholds {
    baseline: number;
    maximum: number;
}

// Calibrated thresholds based on real DaFiF dataset averages
const thresholds: Record<string, SpeciesThresholds> = {
    mackerel: { baseline: 70.65, maximum: 186.24 },
    tilapia: { baseline: 69.97, maximum: 183.36 },
    tuna: { baseline: 70.13, maximum: 190.42 },
};

/**
 * Translates raw MQ135 sensor telemetry into a percentage freshness score (0-100%).
 * 
 * @param mq135Value Raw ammonia gas reading
 * @param species Fish species
 * @returns Freshness percentage (0 to 100)
 */
export function calculateFreshness(mq135Value: number, species: string): number {
    const spec = species.trim().toLowerCase();

    // Fallback to average thresholds if species is not mapped
    const { baseline, maximum } = thresholds[spec] || { baseline: 70.0, maximum: 186.0 };

    if (mq135Value <= baseline) {
        return 100;
    }
    if (mq135Value >= maximum) {
        return 0;
    }

    // Linear calculation of degradation score
    const freshness = 100 - ((mq135Value - baseline) / (maximum - baseline)) * 100;

    // Clamp between 0 and 100 and round to nearest whole number
    return Math.round(Math.max(0, Math.min(100, freshness)));
}
