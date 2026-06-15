"use client";

import { useId } from "react";

/**
 * Halftone fish silhouette in the visual language of shinkei.systems —
 * a fish path filled with a dot grid that fades along a brand gradient.
 * Pure SVG, no images; renders crisply at any size.
 */

interface HalftoneFishProps {
  /** Pixel width. Height auto-scales. */
  width?: number;
  /** Color stops along the body (left to right). */
  colors?: [string, string, string];
  /** Dot grid pitch in user units. Smaller = denser. */
  pitch?: number;
  /** Mirror horizontally so the fish faces left. */
  flip?: boolean;
  className?: string;
  /** Optional rotation in degrees. */
  rotate?: number;
}

const FISH_PATH =
  // Stylised fish: full body + tail + dorsal fin + pectoral fin + eye omitted (filled separately)
  "M 50 110 " +
  "C 110 50, 230 50, 320 110 " +
  "L 360 80 L 360 140 L 320 110 " +
  "C 320 110, 340 130, 360 110 " +     // tail-top guide (overpainted by L commands below)
  "M 50 110 " +
  "C 110 170, 230 170, 320 110 " +
  "Z " +
  // Dorsal hump
  "M 150 70 C 170 50, 210 50, 230 70 L 220 78 L 160 78 Z " +
  // Pectoral fin
  "M 170 130 C 190 150, 210 150, 220 130 L 200 130 Z";

export default function HalftoneFish({
  width = 420,
  colors = ["#ff6b1a", "#e8421a", "#3a89bf"],
  pitch = 6,
  flip = false,
  className = "",
  rotate = 0,
}: HalftoneFishProps) {
  const w = 400;
  const h = 180;
  const id = useId().replace(/:/g, "");
  const height = (width * h) / w;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: `${flip ? "scaleX(-1)" : ""} rotate(${rotate}deg)` }}
      aria-hidden
    >
      <defs>
        {/* Dot grid pattern */}
        <pattern id={`dots-${id}`} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
          <circle cx={pitch / 2} cy={pitch / 2} r={pitch / 2 - 1.4} fill="currentColor" />
        </pattern>

        {/* Brand body gradient */}
        <linearGradient id={`fill-${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="55%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>

        {/* Fade so the halftone "dissolves" near the tail */}
        <linearGradient id={`fade-${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>

        {/* Mask = fish silhouette × fade */}
        <mask id={`mask-${id}`} maskUnits="userSpaceOnUse">
          <g>
            <path d={FISH_PATH} fill={`url(#fade-${id})`} />
          </g>
        </mask>
      </defs>

      {/* Color wash inside the fish */}
      <path d={FISH_PATH} fill={`url(#fill-${id})`} opacity="0.95" />

      {/* Dot grid clipped to the fish, with fade */}
      <g mask={`url(#mask-${id})`} color="#14110f">
        <rect x="0" y="0" width={w} height={h} fill={`url(#dots-${id})`} />
      </g>

      {/* Eye */}
      <circle cx="285" cy="100" r="4" fill="#14110f" />
      <circle cx="286" cy="99" r="1.2" fill="#f3eee5" />
    </svg>
  );
}
