// frontend/components/home/clocks/ClassicAndEditorialClocks.tsx
"use client";

import { useEffect, useRef } from "react";
import { ClockTimeParts } from "@/lib/clockStyles";

export interface ClockFaceProps {
  time: Date;
  parts: ClockTimeParts;
  showSeconds: boolean;
  use24Hour: boolean;
}

const SERIF_FONT = { fontFamily: "var(--font-cormorant), serif" };
const MONO_FONT = { fontFamily: "var(--font-jetbrains-mono), monospace" };

/* ─── 1. Classic Editorial (Signature Chronoa) ───────────────────────────── */
export function EditorialClock({ parts, showSeconds, use24Hour }: ClockFaceProps) {
  return (
    <div
      className="flex flex-col items-center select-none pointer-events-none transition-colors"
      style={{ filter: "drop-shadow(0 6px 20px rgba(0, 0, 0, 0.08))" }}
    >
      <div className="flex items-baseline justify-center">
        <h1
          className={`${
            showSeconds
              ? "text-[88px] sm:text-[110px] md:text-[180px]"
              : "text-[110px] md:text-[180px]"
          } tracking-tight leading-none tabular-nums`}
          style={{ ...SERIF_FONT, color: "var(--clk-ink)" }}
        >
          {parts.hours}:{parts.minutes}
        </h1>
        {showSeconds && (
          <span
            className="text-[38px] sm:text-[48px] md:text-[72px] ml-1.5 md:ml-2.5 tracking-tight leading-none tabular-nums inline-block min-w-[2.4ch]"
            style={{ ...SERIF_FONT, color: "var(--clk-ink-soft)" }}
          >
            :{parts.seconds}
          </span>
        )}
        {!use24Hour && (
          <span
            className={`${
              showSeconds
                ? "text-xl sm:text-2xl md:text-3xl ml-2 sm:ml-3 md:ml-4"
                : "text-2xl md:text-3xl ml-4"
            } font-sans font-medium tracking-[0.2em] uppercase`}
            style={{ color: "var(--clk-accent)" }}
          >
            {parts.ampm}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-6 mt-4 md:mt-8 opacity-85 transition-colors">
        <div
          className="w-10 md:w-24 h-px"
          style={{ backgroundColor: "var(--clk-accent-soft)" }}
        />
        <p
          className="text-[11px] md:text-[14px] tracking-[0.45em] md:tracking-[0.6em] uppercase font-bold whitespace-nowrap"
          style={{ color: "var(--clk-ink)" }}
        >
          {parts.compactDate}
        </p>
        <div
          className="w-10 md:w-24 h-px"
          style={{ backgroundColor: "var(--clk-accent-soft)" }}
        />
      </div>
    </div>
  );
}

/* ─── 2. Editorial Split (Magazine Typography Spread) ────────────────────── */
export function SplitEditorialClock({ parts, showSeconds, use24Hour }: ClockFaceProps) {
  const minuteRatio = parts.rawMinutes / 59;
  const secRatio = (parts.rawSeconds / 59) * 100;

  return (
    <div className="w-[300px] sm:w-[400px] md:w-[520px] flex flex-col items-center select-none pointer-events-none">
      {/* Top Magazine Header Rule */}
      <div
        className="w-full flex items-center justify-between px-1 pb-2.5 md:pb-3 border-b"
        style={{ borderColor: "var(--clk-border-hair)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--clk-accent)" }}
          />
          <span
            className="text-[10px] md:text-[11px] font-bold tracking-[0.35em] uppercase"
            style={{ color: "var(--clk-accent)" }}
          >
            {parts.weekdayLong}
          </span>
        </div>
        <span
          className="text-[11px] md:text-[13px] italic tracking-[0.18em]"
          style={{ ...SERIF_FONT, color: "var(--clk-ink-soft)" }}
        >
          {parts.monthLong} {parts.dayNum}, {parts.year}
        </span>
      </div>

      {/* Asymmetric Upright + Italic Spread */}
      <div className="relative w-full flex items-center justify-center py-4 sm:py-5 md:py-7 gap-3.5 sm:gap-6 md:gap-8">
        <span
          className="text-[84px] sm:text-[116px] md:text-[160px] font-light leading-[0.80] tracking-[-0.03em] tabular-nums"
          style={{ ...SERIF_FONT, color: "var(--clk-ink)" }}
        >
          {parts.hours}
        </span>

        {/* Breathing Spine Rule */}
        <div className="relative h-16 sm:h-24 md:h-32 w-px flex items-center justify-center">
          <div
            className="w-px h-full"
            style={{ backgroundColor: "var(--clk-border-hair)" }}
          />
          <div
            className="absolute w-2 h-2 rounded-full transition-all duration-700"
            style={{
              backgroundColor: "var(--clk-accent)",
              top: `${Math.round(minuteRatio * 84 + 8)}%`,
              boxShadow: "0 0 10px var(--clk-accent-soft)",
            }}
          />
        </div>

        <span
          className="text-[84px] sm:text-[116px] md:text-[160px] italic font-normal leading-[0.80] tracking-[-0.02em] tabular-nums translate-y-2 md:translate-y-3"
          style={{ ...SERIF_FONT, color: "var(--clk-ink)" }}
        >
          {parts.minutes}
        </span>

        {/* Side Folio Annotation */}
        <div className="flex flex-col items-start justify-center pl-1 md:pl-2 self-center gap-1.5">
          <span
            className="text-[10px] sm:text-[11px] md:text-xs font-bold tracking-[0.28em] uppercase px-2 py-0.5 rounded-md border"
            style={{
              color: "var(--clk-accent)",
              borderColor: "var(--clk-accent-soft)",
              backgroundColor: "var(--clk-surface)",
            }}
          >
            {use24Hour ? "24H" : parts.ampm}
          </span>
          {showSeconds && (
            <span
              className="text-lg sm:text-2xl md:text-[28px] font-light tabular-nums leading-none pl-0.5"
              style={{ ...MONO_FONT, color: "var(--clk-ink-soft)" }}
            >
              :{parts.seconds}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Colophon */}
      <div
        className="w-full flex items-center justify-between px-1 pt-2.5 md:pt-3 border-t relative"
        style={{ borderColor: "var(--clk-border-hair)" }}
      >
        {showSeconds && (
          <div
            className={`absolute top-0 left-0 h-[1.5px] ease-out ${
              parts.rawSeconds === 0 ? "transition-none" : "transition-all duration-500"
            }`}
            style={{
              width: `${secRatio}%`,
              backgroundColor: "var(--clk-accent)",
            }}
          />
        )}
        <span
          className="text-[9px] md:text-[10px] font-bold tracking-[0.28em] uppercase"
          style={{ color: "var(--clk-muted)" }}
        >
          WK {parts.weekNumber} · DAY {parts.dayOfYear}
        </span>

        <span
          className="text-[9px] md:text-[10px] font-bold tracking-[0.26em] uppercase"
          style={{ color: "var(--clk-muted)" }}
        >
          {parts.celestialPhase}
        </span>
      </div>
    </div>
  );
}

/* ─── 3. Celestial Orbit (Astronomical Solar / Lunar Arc) ────────────────── */
const computeOrbitPoint = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tiltDeg: number,
  thetaRad: number
) => {
  const lx = rx * Math.cos(thetaRad);
  const ly = ry * Math.sin(thetaRad);
  const alpha = (tiltDeg * Math.PI) / 180;
  return {
    x: cx + lx * Math.cos(alpha) - ly * Math.sin(alpha),
    y: cy + lx * Math.sin(alpha) + ly * Math.cos(alpha),
  };
};

export function OrbitCelestialClock({ time, parts, showSeconds, use24Hour }: ClockFaceProps) {
  const satRef = useRef<SVGCircleElement>(null);

  // Midnight at bottom -> 6AM left -> 12PM top zenith -> 6PM right
  const solarTheta = parts.solarFraction * Math.PI * 2 + Math.PI / 2;
  const bodyPos = computeOrbitPoint(190, 105, 166, 80, -6, solarTheta);

  const initialSecTheta =
    ((time.getSeconds() + time.getMilliseconds() / 1000) / 60) * Math.PI * 2 - Math.PI / 2;
  const initialSat = computeOrbitPoint(190, 105, 134, 62, 5, initialSecTheta);

  useEffect(() => {
    if (!showSeconds) return;
    let rafId = 0;

    const tick = () => {
      const now = new Date();
      const frac = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
      const theta = frac * Math.PI * 2 - Math.PI / 2;
      const pt = computeOrbitPoint(190, 105, 134, 62, 5, theta);
      if (satRef.current) {
        satRef.current.setAttribute("cx", pt.x.toFixed(2));
        satRef.current.setAttribute("cy", pt.y.toFixed(2));
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showSeconds]);

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      <div className="relative w-[290px] h-[162px] sm:w-[356px] sm:h-[198px] md:w-[420px] md:h-[234px] flex items-center justify-center">
        <svg
          viewBox="0 0 380 210"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          {/* Horizon Axis */}
          <line
            x1="28"
            y1="105"
            x2="352"
            y2="105"
            stroke="var(--clk-border-hair)"
            strokeWidth="0.75"
            strokeDasharray="3 5"
          />

          {/* Primary Solar/Lunar Orbit */}
          <ellipse
            cx="190"
            cy="105"
            rx="166"
            ry="80"
            fill="none"
            stroke="var(--clk-border-hair)"
            strokeWidth="1"
            transform="rotate(-6 190 105)"
          />

          {/* Secondary Ephemeris Ring */}
          <ellipse
            cx="190"
            cy="105"
            rx="134"
            ry="62"
            fill="none"
            stroke="var(--clk-accent-soft)"
            strokeWidth="0.85"
            strokeDasharray="2 4"
            transform="rotate(5 190 105)"
          />

          {/* Celestial Sun / Moon Body */}
          <g transform={`translate(${bodyPos.x.toFixed(2)}, ${bodyPos.y.toFixed(2)})`}>
            <circle r="13" fill="var(--clk-accent-soft)" />
            {parts.isDaytime ? (
              <>
                <circle r="8.5" fill="none" stroke="var(--clk-accent)" strokeWidth="0.9" opacity="0.65" />
                <circle r="5.2" fill="var(--clk-accent)" />
              </>
            ) : (
              <path
                d="M -1.5 -5.8 A 6 6 0 1 0 5.8 2.2 A 4.6 4.6 0 1 1 -1.5 -5.8 Z"
                fill="var(--clk-ink)"
              />
            )}
          </g>

          {/* Sweeping Seconds Satellite */}
          {showSeconds && (
            <circle
              ref={satRef}
              cx={initialSat.x.toFixed(2)}
              cy={initialSat.y.toFixed(2)}
              r="3.2"
              fill="var(--clk-accent)"
            />
          )}
        </svg>

        {/* Center Luminance Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline justify-center">
            <span
              className="text-[52px] sm:text-[66px] md:text-[84px] font-light leading-none tracking-tight tabular-nums"
              style={{ ...SERIF_FONT, color: "var(--clk-ink)" }}
            >
              {parts.hours}:{parts.minutes}
            </span>
            {showSeconds && (
              <span
                className="text-xl sm:text-2xl md:text-3xl font-light ml-1 tabular-nums"
                style={{ ...SERIF_FONT, color: "var(--clk-accent)" }}
              >
                :{parts.seconds}
              </span>
            )}
          </div>
          {!use24Hour && (
            <span
              className="text-[10px] md:text-[11px] font-bold tracking-[0.35em] uppercase mt-1"
              style={{ color: "var(--clk-accent)" }}
            >
              {parts.ampm}
            </span>
          )}
        </div>
      </div>

      {/* Ephemeris Footer */}
      <div className="flex flex-col items-center mt-2 md:mt-3">
        <p
          className="text-[10px] sm:text-[11px] md:text-[12px] font-bold tracking-[0.36em] uppercase"
          style={{ color: "var(--clk-ink)" }}
        >
          {parts.weekdayLong} · {parts.monthLong} {parts.dayNum}
        </p>
        <div className="flex items-center gap-2.5 mt-1.5">
          <span
            className="text-[9px] md:text-[10px] font-bold tracking-[0.28em] uppercase"
            style={{ color: "var(--clk-accent)" }}
          >
            {parts.celestialPhase}
          </span>
          <span style={{ color: "var(--clk-border-hair)" }}>•</span>
          <span
            className="text-[9px] md:text-[10px] font-bold tracking-[0.26em] uppercase"
            style={{ color: "var(--clk-muted)" }}
          >
            Day {parts.dayOfYear}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── 4. Monumental Stacked (Swiss Poster Architecture) ───────────────────── */
export function StackedMonumentClock({ parts, showSeconds, use24Hour }: ClockFaceProps) {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-7 md:gap-9 select-none pointer-events-none">
      {/* Stacked Two-Tier Colossal Numerals */}
      <div className="flex flex-col items-end">
        <span
          className="text-[84px] sm:text-[114px] md:text-[148px] font-sans font-bold leading-[0.82] tracking-[-0.06em] tabular-nums"
          style={{ color: "var(--clk-ink)" }}
        >
          {parts.hours}
        </span>
        <span
          className="text-[84px] sm:text-[114px] md:text-[148px] font-sans font-bold leading-[0.82] tracking-[-0.06em] tabular-nums -mt-1 md:-mt-2"
          style={{ color: "var(--clk-accent)" }}
        >
          {parts.minutes}
        </span>
      </div>

      {/* Architectural Telemetry Side Rail */}
      <div
        className="flex flex-col justify-between self-stretch py-1.5 sm:py-2 pl-4 sm:pl-6 md:pl-7 border-l min-w-[118px] sm:min-w-[144px] md:min-w-[172px]"
        style={{ borderColor: "var(--clk-border-hair)" }}
      >
        <div className="flex flex-col items-start gap-2">
          <span
            className="px-2.5 py-0.5 rounded-md text-[10px] md:text-[11px] font-bold tracking-[0.24em] uppercase"
            style={{
              backgroundColor: "var(--clk-accent-soft)",
              color: "var(--clk-accent)",
            }}
          >
            {use24Hour ? "24H" : parts.ampm}
          </span>

          {showSeconds && (
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className="text-[9px] font-bold tracking-[0.2em] uppercase"
                style={{ color: "var(--clk-muted)" }}
              >
                SEC
              </span>
              <span
                className="text-2xl sm:text-3xl md:text-[38px] font-light leading-none tabular-nums"
                style={{ ...MONO_FONT, color: "var(--clk-ink)" }}
              >
                {parts.seconds}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start">
          <span
            className="text-[10px] md:text-[11px] font-bold tracking-[0.28em] uppercase"
            style={{ color: "var(--clk-muted)" }}
          >
            {parts.weekdayLong}
          </span>
          <span
            className="text-[26px] sm:text-[32px] md:text-[40px] font-medium leading-tight mt-0.5 whitespace-nowrap"
            style={{ ...SERIF_FONT, color: "var(--clk-ink)" }}
          >
            {parts.monthShort} {parts.dayNum}
          </span>

          {/* Month Progress Track */}
          <div className="w-full flex items-center gap-2 mt-2">
            <div
              className="flex-1 h-[2.5px] rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--clk-dot-off)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${parts.monthProgressPct}%`,
                  backgroundColor: "var(--clk-accent)",
                }}
              />
            </div>
            <span
              className="text-[9px] font-bold tracking-[0.18em] uppercase tabular-nums"
              style={{ color: "var(--clk-muted)" }}
            >
              {parts.year}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 5. Fullscreen (Edge-to-Edge Architectural Timepiece) ───────────────── */
export function FullscreenClock({ parts, showSeconds, use24Hour }: ClockFaceProps) {
  const showSideTelemetry = showSeconds || !use24Hour;
  const progressPct = showSeconds
    ? (parts.rawSeconds / 59) * 100
    : parts.solarFraction * 100;
  const colonLit = !showSeconds || parts.rawSeconds % 2 === 0;

  return (
    <div
      className="chronoa-fs-container w-full h-full flex flex-col items-center justify-center select-none pointer-events-none"
      data-has-seconds={showSeconds ? "true" : "false"}
      style={{ filter: "drop-shadow(0 8px 28px rgba(0, 0, 0, 0.06))" }}
    >
      <div className="chronoa-fs-stage">
        <span
          className="font-light leading-[0.80] tracking-[-0.04em] tabular-nums"
          style={{
            ...SERIF_FONT,
            fontSize: "var(--fs-digit)",
            color: "var(--clk-ink)",
          }}
        >
          {parts.hours}
        </span>

        <div className="chronoa-fs-sep" aria-hidden="true">
          <span
            className="chronoa-fs-sep-dot"
            style={{ opacity: colonLit ? 0.85 : 0.25 }}
          />
          <span
            className="chronoa-fs-sep-dot"
            style={{ opacity: colonLit ? 0.85 : 0.25 }}
          />
          <span className="chronoa-fs-sep-rule" />
        </div>

        <span
          className="font-light leading-[0.80] tracking-[-0.04em] tabular-nums"
          style={{
            ...SERIF_FONT,
            fontSize: "var(--fs-digit)",
            color: "var(--clk-ink)",
          }}
        >
          {parts.minutes}
        </span>

        {showSideTelemetry && (
          <div className="chronoa-fs-side">
            {!use24Hour && (
              <span
                className="font-sans font-bold tracking-[0.26em] uppercase leading-none"
                style={{
                  fontSize: "var(--fs-badge)",
                  color: "var(--clk-accent)",
                }}
              >
                {parts.ampm}
              </span>
            )}
            {showSeconds && (
              <span
                className="font-light leading-none tabular-nums"
                style={{
                  ...MONO_FONT,
                  fontSize: "var(--fs-sec)",
                  color: "var(--clk-ink-soft)",
                }}
              >
                :{parts.seconds}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Minimal Ambient Horizon Line & Date Marginalia */}
      <div className="chronoa-fs-footer flex flex-col items-center">
        <div
          className="w-full h-[1.5px] rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--clk-border-hair)" }}
        >
          <div
            className={`h-full ease-out ${
              showSeconds && parts.rawSeconds === 0
                ? "transition-none"
                : "transition-all duration-700"
            }`}
            style={{
              width: `${progressPct.toFixed(1)}%`,
              backgroundColor: "var(--clk-accent)",
            }}
          />
        </div>

        <div className="w-full flex items-center justify-between mt-2.5 gap-3">
          <span
            className="font-bold uppercase truncate"
            style={{
              fontSize: "var(--fs-meta)",
              letterSpacing: "var(--fs-meta-track)",
              color: "var(--clk-ink-soft)",
            }}
          >
            {parts.weekdayLong} · {parts.monthShort} {parts.dayNum}
          </span>
          <span
            className="font-bold uppercase shrink-0"
            style={{
              fontSize: "var(--fs-meta)",
              letterSpacing: "var(--fs-meta-track)",
              color: "var(--clk-muted)",
            }}
          >
            {parts.year}
          </span>
        </div>
      </div>
    </div>
  );
}