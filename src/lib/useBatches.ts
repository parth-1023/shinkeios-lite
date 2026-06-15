"use client";

import { useEffect, useState } from "react";
import { Batch } from "./types";

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchBatches() {
      try {
        const res = await fetch("/batches");
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setBatches(data);
      } catch (err) {
        console.error("Error loading batches:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchBatches();
    return () => { cancelled = true; };
  }, []);

  return { batches, loading };
}
