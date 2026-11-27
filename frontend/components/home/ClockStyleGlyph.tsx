// frontend/components/home/ClockStyleGlyph.tsx
"use client";

import { HomeClockStyle } from "@/lib/clockStyles";

export function ClockStyleGlyph({
  styleId,
  isActive,
}: {
  styleId: HomeClockStyle;
  isActive: boolean;
}) {
  const accent = isActive ? "#c2956e" : "currentColor";

  switch (styleId) {
    case "editorial":
      return (
        <div className="flex flex-col items-center justify-center h-12 select-none">
          <span
            className="text-[26px] leading-none tracking-tight text-[#3d3b33] dark:text-[#f0f0f0]"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            12:15
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-3 h-px bg-[#c2956e]/60" />
            <span className="text-[6px] font-bold tracking-[0.25em] uppercase text-[#888] dark:text-[#999]">
              FRI 27
            </span>
            <span className="w-3 h-px bg-[#c2956e]/60" />
          </div>
        </div>
      );

    case "split":
      return (
        <div className="flex flex-col items-center justify-center h-12 select-none">
          <div className="flex items-center gap-2">
            <span
              className="text-[24px] leading-none font-light text-[#3d3b33] dark:text-[#f0f0f0]"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              12
            </span>
            <span className="w-px h-5 bg-[#c2956e]/60 relative flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-[#c2956e]" />
            </span>
            <span
              className="text-[24px] leading-none italic translate-y-0.5 text-[#3d3b33] dark:text-[#f0f0f0]"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              15
            </span>
          </div>
        </div>
      );

    case "chrono":
      return (
        <div className="flex items-center justify-center h-12 select-none">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeWidth="1.2"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#c2956e"
                strokeWidth="1.8"
                strokeDasharray="125.6"
                strokeDashoffset="38"
                transform="rotate(-90 24 24)"
                strokeLinecap="round"
              />
              <circle cx="39" cy="11" r="2.2" fill="#c2956e" />
            </svg>
            <span
              className="absolute text-[9px] font-medium tracking-tight text-[#3d3b33] dark:text-[#f0f0f0]"
              style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
            >
              12:15
            </span>
          </div>
        </div>
      );

    case "flip":
      return (
        <div className="flex items-center justify-center gap-1 h-12 select-none">
          {["12", "15"].map((num, idx) => (
            <div
              key={idx}
              className="relative w-8 h-9 rounded-lg border border-[#e0ddd5] dark:border-[#444] bg-white dark:bg-[#252525] flex items-center justify-center shadow-sm overflow-hidden"
            >
              <span className="text-[14px] font-semibold text-[#3d3b33] dark:text-[#f0f0f0] tabular-nums">
                {num}
              </span>
              <div className="absolute inset-x-0 top-1/2 h-px bg-[#e0ddd5] dark:bg-[#444]" />
            </div>
          ))}
        </div>
      );

    case "orbit":
      return (
        <div className="flex items-center justify-center h-12 select-none">
          <div className="relative w-16 h-11 flex items-center justify-center">
            <svg viewBox="0 0 72 44" className="w-full h-full">
              <ellipse
                cx="36"
                cy="22"
                rx="30"
                ry="14"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="1.1"
                transform="rotate(-8 36 22)"
              />
              <circle cx="57" cy="11" r="3.2" fill="#c2956e" />
            </svg>
            <span
              className="absolute text-[12px] font-light text-[#3d3b33] dark:text-[#f0f0f0]"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              12:15
            </span>
          </div>
        </div>
      );

    case "stacked":
      return (
        <div className="flex items-center justify-center gap-2 h-12 select-none">
          <div className="flex flex-col items-end leading-[0.82] font-sans font-bold text-[19px] tracking-tighter">
            <span className="text-[#3d3b33] dark:text-[#f0f0f0]">12</span>
            <span className="text-[#c2956e]">15</span>
          </div>
          <div className="h-7 w-px bg-[#e0ddd5] dark:bg-[#444]" />
          <div className="flex flex-col items-start text-[7px] font-bold tracking-widest uppercase text-[#888]">
            <span>FRI</span>
            <span className="text-[#3d3b33] dark:text-[#f0f0f0] mt-0.5">27</span>
          </div>
        </div>
      );

    case "dotmatrix":
      return (
        <div className="flex items-center justify-center h-12 select-none">
          <div className="px-2.5 py-1.5 rounded-lg border border-[#e0ddd5] dark:border-[#444] bg-white/80 dark:bg-[#252525]">
            <svg viewBox="0 0 46 20" className="w-11 h-5">
              {[0, 1, 2, 3, 4].map((row) =>
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => {
                  const isColon = col === 5 && (row === 1 || row === 3);
                  const isDigit =
                    (col === 1 || col === 3 || col === 7 || col === 9) &&
                    row >= 0 &&
                    row <= 4;
                  const on = isColon || isDigit;
                  return (
                    <circle
                      key={`${row}-${col}`}
                      cx={3 + col * 4}
                      cy={2 + row * 4}
                      r={on ? 1.4 : 0.7}
                      fill={
                        isColon
                          ? "#c2956e"
                          : on
                          ? accent
                          : "currentColor"
                      }
                      opacity={isColon ? 1 : on ? 0.85 : 0.06}
                    />
                  );
                })
              )}
            </svg>
          </div>
        </div>
      );

    case "fullscreen":
      return (
        <div className="flex items-center justify-center h-12 select-none">
          <div className="relative w-16 h-10 rounded-lg border border-[#e0ddd5] dark:border-[#444] bg-white/80 dark:bg-[#252525] flex flex-col items-center justify-center px-1 overflow-hidden">
            <span
              className="text-[20px] font-light leading-[0.8] tracking-tight text-[#3d3b33] dark:text-[#f0f0f0]"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              12
              <span style={{ color: "#c2956e" }}>:</span>
              15
            </span>
            <div className="w-10 h-px bg-[#c2956e]/50 mt-1" />
          </div>
        </div>
      );
  }
}