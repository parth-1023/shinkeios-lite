import type { Routing } from "./freshness";

export interface Batch {
  id: string;
  species: string;
  originLat: number;
  originLng: number;
  catchTime: string;
  latestPpm: number | null;
  latestReadingAt: string | null;
  freshnessScore: number;
  hoursToUnsellable: number | null;
  hoursToSpoil: number | null;
  slopePpmPerHour: number;
  confidence: number;
  recommendation: Routing;
  revenueAtRisk: number;
  sparkline: number[];
  currentLocation: string | null;
  currentBizStep: string | null;
}
