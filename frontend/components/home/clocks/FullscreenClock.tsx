// frontend/components/home/clocks/FullscreenClock.tsx
"use client";

import { useId } from "react";
import { ClockFaceProps } from "./ClassicAndEditorialClocks";

export type ClockTimeOfDay = "dawn" | "day" | "dusk" | "night";

interface FullscreenClockProps extends ClockFaceProps {
  timeOfDay?: ClockTimeOfDay;
}

// Bespoke condensed geometric paths built on a 100x200 unit coordinate grid
export const FULLSCREEN_DIGIT_PATHS: Record<string, { kind: "rect" | "path"; d?: string }> = {
  "0": { kind: "rect" },
  "1": { kind: "path", d: "M 28 38 L 57 13 L 57 187" },
  "2": { kind: "path", d: "M 15 49 C 15 24, 29 13, 50 13 C 71 13, 86 26, 86 51 C 86 84, 48 122, 14 187 L 86 187" },
  "3": { kind: "path", d: "M 16 44 C 16 23, 30 13, 50 13 C 71 13, 85 26, 85 51 C 85 77, 70 95, 42 96 C 72 98, 86 117, 86 144 C 86 172, 71 187, 50 187 C 30 187, 15 175, 15 153" },
  "4": { kind: "path", d: "M 69 187 L 69 13 L 14 135 L 88 135" },
  "5": { kind: "path", d: "M 82 13 L 22 13 L 17 95 C 28 82, 40 77, 53 77 C 74 77, 86 96, 86 132 C 86 168, 72 187, 50 187 C 31 187, 17 175, 14 156" },
  "6": { kind: "path", d: "M 78 34 C 71 19, 60 13, 48 13 C 26 13, 14 38, 14 102 C 14 166, 28 187, 50 187 C 73 187, 86 167, 86 134 C 86 100, 73 82, 50 82 C 32 82, 18 96, 14 120" },
  "7": { kind: "path", d: "M 14 13 L 86 13 C 68 68, 46 126, 36 187" },
  "8": { kind: "path", d: "M 50 93 C 25 93, 17 76, 17 51 C 17 26, 30 13, 50 13 C 70 13, 83 26, 83 51 C 83 76, 75 93, 50 93 C 23 93, 14 114, 14 142 C 14 171, 28 187, 50 187 C 72 187, 86 171, 86 142 C 86 114, 77 93, 50 93 Z" },
  "9": { kind: "path", d: "M 22 166 C 29 181, 40 187, 52 187 C 74 187, 86 162, 86 98 C 86 34, 72 13, 50 13 C 27 13, 14 33, 14 66 C 14 100, 27 118, 50 118 C 68 118, 82 104, 86 80" },
};

function VectorDigit({ digit, x, y, strokeId }: { digit: string; x: number; y: number; strokeId: string }) {
  const glyph = FULLSCREEN_DIGIT_PATHS[digit] || FULLSCREEN_DIGIT_PATHS["0"];

  return (
    <g
      transform={`translate(${x}, ${y})`}
      fill="none"
      stroke={`url(#${strokeId})`}
      strokeWidth={20}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph.kind === "rect" ? (
        <rect x={14} y={13} width={72} height={174} rx={36} />
      ) : (
        <path d={glyph.d} />
      )}
    </g>
  );
}

const resolveTimeOfDay = (hour: number, override?: ClockTimeOfDay): ClockTimeOfDay => {
  if (override) return override;
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
};

export function FullscreenClock({ parts, showSeconds, use24Hour, timeOfDay }: FullscreenClockProps) {
  const rawId = useId();
  const baseGradId = `chronoa-fs-grad-${rawId.replace(/:/g, "")}`;
  const gradPortraitId = `${baseGradId}-p`;
  const gradLandscapeId = `${baseGradId}-l`;

  const activeTod = resolveTimeOfDay(parts.rawHours, timeOfDay);
  const colonLit = !showSeconds || parts.rawSeconds % 2 === 0;

  return (
    <div
      data-tod={activeTod}
      aria-label={`${parts.hours}:${parts.minutes}${showSeconds ? `:${parts.seconds}` : ""}${
        use24Hour ? "" : ` ${parts.ampm}`
      }`}
      className="chronoa-fs-container w-full h-full flex flex-col items-center justify-center select-none pointer-events-none"
    >
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
        <svg
          viewBox="-4 -4 224 434"
          preserveAspectRatio="xMidYMid meet"
          className="chronoa-fs-portrait w-full h-full overflow-visible"
          style={{ filter: "drop-shadow(0 12px 30px var(--clk-fs-glow))" }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradPortraitId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="216" y2="426">
              <stop offset="0%" style={{ stopColor: "var(--clk-fs-g1)" }} />
              <stop offset="50%" style={{ stopColor: "var(--clk-fs-g2)" }} />
              <stop offset="100%" style={{ stopColor: "var(--clk-fs-g3)" }} />
            </linearGradient>
          </defs>

          <VectorDigit digit={parts.hours[0]} x={0} y={0} strokeId={gradPortraitId} />
          <VectorDigit digit={parts.hours[1]} x={116} y={0} strokeId={gradPortraitId} />

          <VectorDigit digit={parts.minutes[0]} x={0} y={226} strokeId={gradPortraitId} />
          <VectorDigit digit={parts.minutes[1]} x={116} y={226} strokeId={gradPortraitId} />
        </svg>

        <svg
          viewBox="-4 -4 484 208"
          preserveAspectRatio="xMidYMid meet"
          className="chronoa-fs-landscape w-full h-full overflow-visible"
          style={{ filter: "drop-shadow(0 12px 30px var(--clk-fs-glow))" }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradLandscapeId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="476" y2="200">
              <stop offset="0%" style={{ stopColor: "var(--clk-fs-g1)" }} />
              <stop offset="52%" style={{ stopColor: "var(--clk-fs-g2)" }} />
              <stop offset="100%" style={{ stopColor: "var(--clk-fs-g3)" }} />
            </linearGradient>
          </defs>

          <VectorDigit digit={parts.hours[0]} x={0} y={0} strokeId={gradLandscapeId} />
          <VectorDigit digit={parts.hours[1]} x={114} y={0} strokeId={gradLandscapeId} />

          <g
            className="transition-opacity duration-500"
            style={{ opacity: colonLit ? 0.92 : 0.36 }}
          >
            <circle cx={238} cy={66} r={11} fill={`url(#${gradLandscapeId})`} />
            <circle cx={238} cy={134} r={11} fill={`url(#${gradLandscapeId})`} />
          </g>

          <VectorDigit digit={parts.minutes[0]} x={262} y={0} strokeId={gradLandscapeId} />
          <VectorDigit digit={parts.minutes[1]} x={376} y={0} strokeId={gradLandscapeId} />
        </svg>
      </div>

      {/* Minimal date and optional seconds strip */}
      <div className="chronoa-fs-meta shrink-0 flex items-center justify-center gap-2.5 sm:gap-3 pt-2 md:pt-3 font-sans font-bold uppercase whitespace-nowrap opacity-85">
        <span style={{ color: "var(--clk-ink-soft)" }}>
          <span className="sm:hidden">{parts.weekdayShort}</span>
          <span className="hidden sm:inline">{parts.weekdayLong}</span>
          {" · "}
          {parts.monthShort} {parts.dayNum}
        </span>

        {showSeconds && (
          <>
            <span className="opacity-40" style={{ color: "var(--clk-muted)" }}>
              •
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                color: "var(--clk-accent)",
              }}
            >
              :{parts.seconds}
            </span>
          </>
        )}

        {!use24Hour && (
          <>
            <span className="opacity-40" style={{ color: "var(--clk-muted)" }}>
              •
            </span>
            <span style={{ color: "var(--clk-accent)" }}>{parts.ampm}</span>
          </>
        )}
      </div>
    </div>
  );
}