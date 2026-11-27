// frontend/components/home/clocks/MechanicalClocks.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ClockFaceProps } from "./ClassicAndEditorialClocks";

const MONO_FONT = { fontFamily: "var(--font-jetbrains-mono), monospace" };

/* ─── 5. Chronograph (Precision Swiss Watchmaker Dial) ───────────────────── */
const DIAL_SIZE = 320;
const DIAL_CENTER = 160;
const DIAL_ARC_R = 142;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_ARC_R;

const DIAL_TICKS = Array.from({ length: 60 }, (_, i) => {
  const rad = ((i * 6 - 90) * Math.PI) / 180;
  const isCardinal = i % 15 === 0;
  const isMajor = i % 5 === 0;
  const rInner = isCardinal ? 131 : isMajor ? 135 : 139;
  const rOuter = 147;
  return {
    i,
    isCardinal,
    isMajor,
    x1: (DIAL_CENTER + rInner * Math.cos(rad)).toFixed(2),
    y1: (DIAL_CENTER + rInner * Math.sin(rad)).toFixed(2),
    x2: (DIAL_CENTER + rOuter * Math.cos(rad)).toFixed(2),
    y2: (DIAL_CENTER + rOuter * Math.sin(rad)).toFixed(2),
  };
});

export function ChronoDialClock({ time, parts, showSeconds, use24Hour }: ClockFaceProps) {
  const handRef = useRef<SVGGElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);

  const minuteFraction = (time.getMinutes() + time.getSeconds() / 60) / 60;
  const secondFraction = (time.getSeconds() + time.getMilliseconds() / 1000) / 60;
  const initialFraction = showSeconds ? secondFraction : minuteFraction;
  const initialDeg = (initialFraction * 360).toFixed(2);
  const initialOffset = (DIAL_CIRCUMFERENCE * (1 - initialFraction)).toFixed(2);

  useEffect(() => {
    if (!showSeconds) {
      // Clear any leftover inline offset from sweeping and snap back to minutes
      const now = new Date();
      const minFrac = (now.getMinutes() + now.getSeconds() / 60) / 60;
      const deg = (minFrac * 360).toFixed(2);
      const offset = (DIAL_CIRCUMFERENCE * (1 - minFrac)).toFixed(2);

      if (handRef.current) {
        handRef.current.setAttribute("transform", `rotate(${deg} ${DIAL_CENTER} ${DIAL_CENTER})`);
      }
      if (arcRef.current) {
        arcRef.current.style.strokeDashoffset = "";
        arcRef.current.setAttribute("stroke-dashoffset", offset);
      }
      return;
    }

    let rafId = 0;

    const sweep = () => {
      const now = new Date();
      const frac = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
      if (handRef.current) {
        handRef.current.setAttribute(
          "transform",
          `rotate(${(frac * 360).toFixed(2)} ${DIAL_CENTER} ${DIAL_CENTER})`
        );
      }
      if (arcRef.current) {
        arcRef.current.setAttribute(
          "stroke-dashoffset",
          (DIAL_CIRCUMFERENCE * (1 - frac)).toFixed(2)
        );
      }
      rafId = requestAnimationFrame(sweep);
    };

    rafId = requestAnimationFrame(sweep);
    return () => cancelAnimationFrame(rafId);
  }, [showSeconds]);

  return (
    <div className="relative w-[248px] h-[248px] sm:w-[280px] sm:h-[280px] md:w-[318px] md:h-[318px] flex items-center justify-center select-none pointer-events-none">
      {/* Frosted Watch Crystal Backdrop */}
      <div
        className="absolute inset-2 rounded-full backdrop-blur-xl border"
        style={{
          backgroundColor: "var(--clk-surface)",
          borderColor: "var(--clk-border)",
          boxShadow: "var(--clk-shadow)",
        }}
      />

      {/* Precision SVG Bezel & Sweeping Ring */}
      <svg viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`} className="relative z-10 w-full h-full">
        <circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={130}
          fill="none"
          stroke="var(--clk-border-hair)"
          strokeWidth="0.75"
        />

        {/* Subtle Progress Track */}
        <circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={DIAL_ARC_R}
          fill="none"
          stroke="var(--clk-dot-off)"
          strokeWidth="1.5"
        />

        {/* Active Progress Arc */}
        <circle
          ref={arcRef}
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={DIAL_ARC_R}
          fill="none"
          stroke="var(--clk-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={DIAL_CIRCUMFERENCE}
          strokeDashoffset={initialOffset}
          transform={`rotate(-90 ${DIAL_CENTER} ${DIAL_CENTER})`}
          opacity="0.72"
        />

        {/* 60 Calibrated Bezel Ticks */}
        {DIAL_TICKS.map((t) => (
          <line
            key={t.i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.isCardinal ? "var(--clk-accent)" : "var(--clk-border-hair)"}
            strokeWidth={t.isCardinal ? 2.2 : t.isMajor ? 1.5 : 0.9}
            strokeLinecap="round"
          />
        ))}

        {/* Peripheral Orbital Marker / Hand */}
        <g ref={handRef} transform={`rotate(${initialDeg} ${DIAL_CENTER} ${DIAL_CENTER})`}>
          <line
            x1={DIAL_CENTER}
            y1={28}
            x2={DIAL_CENTER}
            y2={13}
            stroke="var(--clk-accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx={DIAL_CENTER} cy={18} r="6.5" fill="var(--clk-accent-soft)" />
          <circle cx={DIAL_CENTER} cy={18} r="3.4" fill="var(--clk-accent)" />
        </g>
      </svg>

      {/* Center Watch Face Readout */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
        <span
          className="text-[9px] md:text-[10px] font-bold tracking-[0.36em] uppercase mb-1.5"
          style={{ color: "var(--clk-accent)" }}
        >
          {use24Hour ? "CHRONOA" : parts.ampm}
        </span>

        <div className="flex flex-col items-center">
          <span
            className="text-[42px] sm:text-[50px] md:text-[58px] font-light leading-none tracking-tight tabular-nums"
            style={{ ...MONO_FONT, color: "var(--clk-ink)" }}
          >
            {parts.hours}:{parts.minutes}
          </span>
          {showSeconds && (
            <span
              className="text-[11px] sm:text-xs md:text-sm font-medium tracking-[0.22em] tabular-nums mt-1"
              style={{ ...MONO_FONT, color: "var(--clk-accent)" }}
            >
              {parts.seconds}S
            </span>
          )}
        </div>

        {/* Watchmaker Day-Date Aperture Window */}
        <div
          className="mt-2.5 sm:mt-3 flex items-center gap-2 px-3 py-1 rounded-lg border"
          style={{
            backgroundColor: "var(--clk-surface-strong)",
            borderColor: "var(--clk-border-hair)",
          }}
        >
          <span
            className="text-[9px] md:text-[10px] font-bold tracking-[0.18em] uppercase"
            style={{ color: "var(--clk-accent)" }}
          >
            {parts.weekdayShort}
          </span>
          <span
            className="w-px h-2.5"
            style={{ backgroundColor: "var(--clk-border-hair)" }}
          />
          <span
            className="text-[9px] md:text-[10px] font-bold tracking-[0.16em] uppercase tabular-nums"
            style={{ ...MONO_FONT, color: "var(--clk-ink)" }}
          >
            {parts.monthShort} {parts.dayNum}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── 6. Kinetic 3D Split-Flap (Solari / Braun Mechanical Board) ─────────── */
function SplitFlapTile({
  value,
  badge,
  sizeClass,
  textSizeClass,
  accentText = false,
}: {
  value: string;
  badge?: string;
  sizeClass: string;
  textSizeClass: string;
  accentText?: boolean;
}) {
  const prevRef = useRef(value);
  const [flip, setFlip] = useState({
    curr: value,
    prev: value,
    active: false,
    key: 0,
  });

  useEffect(() => {
    if (prevRef.current === value) return;
    const previousValue = prevRef.current;
    prevRef.current = value;

    setFlip((state) => ({
      curr: value,
      prev: previousValue,
      active: true,
      key: state.key + 1,
    }));

    const timer = setTimeout(() => {
      setFlip((state) => ({ ...state, prev: value, active: false }));
    }, 390);

    return () => clearTimeout(timer);
  }, [value]);

  const digitColor = accentText ? "var(--clk-accent)" : "var(--clk-ink)";

  return (
    <div
      className={`relative rounded-[1.25rem] md:rounded-[1.6rem] border backdrop-blur-xl ${sizeClass}`}
      style={{
        perspective: "750px",
        borderColor: "var(--clk-border)",
        boxShadow: "var(--clk-shadow)",
      }}
    >
      {/* Static Upper Half (Incoming Value) */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-[1.25rem] md:rounded-t-[1.6rem]"
        style={{ backgroundColor: "var(--clk-surface-strong)" }}
      >
        <div
          className={`absolute inset-x-0 top-0 h-[200%] flex items-center justify-center font-sans font-semibold tracking-tight tabular-nums ${textSizeClass}`}
          style={{ color: digitColor }}
        >
          {flip.curr}
        </div>
      </div>

      {/* Static Lower Half (Previous Value during flip, then Current) */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-[1.25rem] md:rounded-b-[1.6rem]"
        style={{ backgroundColor: "var(--clk-surface)" }}
      >
        <div
          className={`absolute inset-x-0 bottom-0 h-[200%] flex items-center justify-center font-sans font-semibold tracking-tight tabular-nums ${textSizeClass}`}
          style={{ color: digitColor }}
        >
          {flip.active ? flip.prev : flip.curr}
        </div>
      </div>

      {/* Animated Top Flap Folding Down */}
      {flip.active && (
        <div
          key={`top-${flip.key}`}
          className="chronoa-flip-top absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-[1.25rem] md:rounded-t-[1.6rem] z-10"
          style={{ backgroundColor: "var(--clk-surface-strong)" }}
        >
          <div
            className={`absolute inset-x-0 top-0 h-[200%] flex items-center justify-center font-sans font-semibold tracking-tight tabular-nums ${textSizeClass}`}
            style={{ color: digitColor }}
          >
            {flip.prev}
          </div>
        </div>
      )}

      {/* Animated Bottom Flap Unfolding */}
      {flip.active && (
        <div
          key={`bot-${flip.key}`}
          className="chronoa-flip-bottom absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-[1.25rem] md:rounded-b-[1.6rem] z-20"
          style={{ backgroundColor: "var(--clk-surface)" }}
        >
          <div
            className={`absolute inset-x-0 bottom-0 h-[200%] flex items-center justify-center font-sans font-semibold tracking-tight tabular-nums ${textSizeClass}`}
            style={{ color: digitColor }}
          >
            {flip.curr}
          </div>
        </div>
      )}

      {/* Optional Braun-style Micro AM/PM Corner Tag */}
      {badge && (
        <span
          className="absolute top-2 left-2.5 md:top-3 md:left-3.5 z-30 text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "var(--clk-accent)" }}
        >
          {badge}
        </span>
      )}

      {/* Mechanical Equator Hinge Slit & Side Pins */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] z-30 pointer-events-none"
        style={{ backgroundColor: "var(--clk-border-hair)" }}
      />
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2.5 rounded-r-sm z-30"
        style={{ backgroundColor: "var(--clk-border-hair)" }}
      />
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2.5 rounded-l-sm z-30"
        style={{ backgroundColor: "var(--clk-border-hair)" }}
      />
    </div>
  );
}

function MiniDatePlaque({
  label,
  accent = false,
}: {
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className="relative px-2.5 sm:px-3.5 py-1.5 rounded-xl border backdrop-blur-md overflow-hidden"
      style={{
        backgroundColor: "var(--clk-surface-strong)",
        borderColor: "var(--clk-border)",
      }}
    >
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px opacity-60 pointer-events-none"
        style={{ backgroundColor: "var(--clk-border-hair)" }}
      />
      <span
        className="relative z-10 text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase tabular-nums"
        style={{ ...MONO_FONT, color: accent ? "var(--clk-accent)" : "var(--clk-ink)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function FlipBoardClock({ parts, showSeconds, use24Hour }: ClockFaceProps) {
  const tileSize = showSeconds
    ? "w-[86px] h-[98px] sm:w-[112px] sm:h-[126px] md:w-[144px] md:h-[158px]"
    : "w-[116px] h-[128px] sm:w-[146px] sm:h-[160px] md:w-[180px] md:h-[196px]";

  const tileText = showSeconds
    ? "text-[48px] sm:text-[64px] md:text-[84px]"
    : "text-[66px] sm:text-[84px] md:text-[106px]";

  const colonGap = showSeconds ? "gap-1.5 sm:gap-2.5 md:gap-3" : "gap-2.5 sm:gap-4 md:gap-5";

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      <div className={`flex items-center justify-center ${colonGap}`}>
        <SplitFlapTile
          value={parts.hours}
          badge={use24Hour ? "24H" : parts.ampm}
          sizeClass={tileSize}
          textSizeClass={tileText}
        />

        <div className="flex flex-col gap-2 sm:gap-2.5">
          <span
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
            style={{ backgroundColor: "var(--clk-accent)" }}
          />
          <span
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
            style={{ backgroundColor: "var(--clk-accent)" }}
          />
        </div>

        <SplitFlapTile
          value={parts.minutes}
          sizeClass={tileSize}
          textSizeClass={tileText}
        />

        {showSeconds && (
          <>
            <div className="flex flex-col gap-2 sm:gap-2.5 opacity-60">
              <span
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                style={{ backgroundColor: "var(--clk-accent)" }}
              />
              <span
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                style={{ backgroundColor: "var(--clk-accent)" }}
              />
            </div>

            <SplitFlapTile
              value={parts.seconds}
              sizeClass={tileSize}
              textSizeClass={tileText}
              accentText
            />
          </>
        )}
      </div>

      {/* Mechanical Calendar Strip */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4 md:mt-6">
        <MiniDatePlaque label={parts.weekdayShort} accent />
        <MiniDatePlaque label={parts.monthShort} />
        <MiniDatePlaque label={parts.dayNum} />
        <MiniDatePlaque label={parts.year} />
      </div>
    </div>
  );
}

/* ─── 7. Dot Matrix (Precision Hardware Pin Grid) ────────────────────────── */
const MATRIX_GLYPHS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["01110", "10001", "00001", "00110", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
};

function MatrixDigit({
  digit,
  className,
  accent = false,
}: {
  digit: string;
  className: string;
  accent?: boolean;
}) {
  const rows = MATRIX_GLYPHS[digit] || MATRIX_GLYPHS["0"];
  const activeColor = accent ? "var(--clk-accent)" : "var(--clk-ink)";

  return (
    <svg viewBox="0 0 50 70" className={className} aria-hidden="true">
      {rows.map((rowStr, r) =>
        rowStr.split("").map((bit, c) => {
          const on = bit === "1";
          return (
            <circle
              key={`${r}-${c}`}
              cx={5 + c * 10}
              cy={5 + r * 10}
              r={on ? 3.9 : 1.75}
              fill={on ? activeColor : "var(--clk-matrix-off)"}
              className="transition-all duration-200"
            />
          );
        })
      )}
    </svg>
  );
}

function MatrixColon({ pulse, className }: { pulse: boolean; className: string }) {
  return (
    <svg viewBox="0 0 12 70" className={className} aria-hidden="true">
      <circle
        cx="6"
        cy="25"
        r="3.8"
        fill="var(--clk-accent)"
        opacity={pulse ? 1 : 0.28}
        className="transition-opacity duration-300"
      />
      <circle
        cx="6"
        cy="45"
        r="3.8"
        fill="var(--clk-accent)"
        opacity={pulse ? 1 : 0.28}
        className="transition-opacity duration-300"
      />
    </svg>
  );
}

export function DotMatrixClock({ parts, showSeconds, use24Hour }: ClockFaceProps) {
  const mainDigitSize = showSeconds
    ? "w-[33px] h-[46px] sm:w-[46px] sm:h-[64px] md:w-[62px] md:h-[87px]"
    : "w-[44px] h-[62px] sm:w-[58px] sm:h-[81px] md:w-[74px] md:h-[104px]";

  const secDigitSize = "w-[24px] h-[34px] sm:w-[32px] sm:h-[45px] md:w-[44px] md:h-[62px]";
  const colonSize = showSeconds
    ? "w-[8px] h-[46px] sm:w-[11px] sm:h-[64px] md:w-[14px] md:h-[87px]"
    : "w-[10px] h-[62px] sm:w-[13px] sm:h-[81px] md:w-[16px] md:h-[104px]";

  const secDotsLit = Math.max(1, Math.ceil(((parts.rawSeconds + 1) / 60) * 10));
  const colonLit = parts.rawSeconds % 2 === 0;

  return (
    <div
      className="flex flex-col rounded-[2rem] md:rounded-[2.5rem] border backdrop-blur-xl px-5 py-4 sm:px-8 sm:py-6 md:px-10 md:py-7 select-none pointer-events-none"
      style={{
        backgroundColor: "var(--clk-surface)",
        borderColor: "var(--clk-border)",
        boxShadow: "var(--clk-shadow)",
      }}
    >
      {/* Dot Matrix Numerals Row */}
      <div className="flex items-end justify-center gap-1.5 sm:gap-2.5 md:gap-3">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <MatrixDigit digit={parts.hours[0]} className={mainDigitSize} />
          <MatrixDigit digit={parts.hours[1]} className={mainDigitSize} />
        </div>

        <MatrixColon pulse={colonLit} className={colonSize} />

        <div className="flex items-center gap-1 sm:gap-1.5">
          <MatrixDigit digit={parts.minutes[0]} className={mainDigitSize} />
          <MatrixDigit digit={parts.minutes[1]} className={mainDigitSize} />
        </div>

        {showSeconds && (
          <>
            <MatrixColon pulse={!colonLit} className="w-[7px] h-[34px] sm:w-[9px] sm:h-[45px] md:w-[11px] md:h-[62px]" />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <MatrixDigit digit={parts.seconds[0]} className={secDigitSize} accent />
              <MatrixDigit digit={parts.seconds[1]} className={secDigitSize} accent />
            </div>
          </>
        )}
      </div>

      {/* Hardware Telemetry Footer */}
      <div
        className="mt-4 md:mt-5 pt-3 border-t flex items-center justify-between gap-4"
        style={{ borderColor: "var(--clk-border-hair)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] sm:text-[11px] font-medium tracking-[0.22em] uppercase"
            style={{ ...MONO_FONT, color: "var(--clk-ink-soft)" }}
          >
            {parts.weekdayShort} · {parts.dayNum} {parts.monthShort} {parts.year}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {showSeconds && (
            <div className="hidden sm:flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 10 }, (_, idx) => (
                <span
                  key={idx}
                  className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor:
                      idx < secDotsLit ? "var(--clk-accent)" : "var(--clk-dot-off)",
                  }}
                />
              ))}
            </div>
          )}
          <span
            className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded-md"
            style={{
              ...MONO_FONT,
              color: "var(--clk-accent)",
              backgroundColor: "var(--clk-accent-soft)",
            }}
          >
            {use24Hour ? "24H" : parts.ampm}
          </span>
        </div>
      </div>
    </div>
  );
}