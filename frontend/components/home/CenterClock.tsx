// frontend/components/home/CenterClock.tsx
"use client";

import { useState, useEffect } from "react";
import { useUiStore } from "@/store/uiStore";

export default function CenterClock() {
  const [time, setTime] = useState<Date | null>(null);
  const { showHomeSeconds } = useUiStore();

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-[200px]" />; // Prevents Hydration Shift

  const hours12 = time.getHours() % 12 || 12;
  const hoursStr = hours12.toString().padStart(2, "0");
  const minutesStr = time.getMinutes().toString().padStart(2, "0");
  const secondsStr = time.getSeconds().toString().padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";

  return (
    <div className="flex flex-col items-center select-none pointer-events-none transition-colors drop-shadow-md dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      <div className="flex items-baseline justify-center">
        <h1
          className={`${
            showHomeSeconds
              ? "text-[88px] sm:text-[110px] md:text-[180px]"
              : "text-[110px] md:text-[180px]"
          } text-[#3d3b33] dark:text-[#f0f0f0] tracking-tight leading-none`}
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          {hoursStr}:{minutesStr}
        </h1>
        {showHomeSeconds && (
          <span
            className="text-[38px] sm:text-[48px] md:text-[72px] ml-1.5 md:ml-2.5 text-[#3d3b33]/70 dark:text-[#f0f0f0]/70 tracking-tight leading-none tabular-nums inline-block min-w-[2.4ch]"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            :{secondsStr}
          </span>
        )}
        <span
          className={`${
            showHomeSeconds
              ? "text-xl sm:text-2xl md:text-3xl ml-2 sm:ml-3 md:ml-4"
              : "text-2xl md:text-3xl ml-4"
          } font-sans font-medium text-[#c2956e] dark:text-[#b0855f] tracking-[0.2em] uppercase`}
        >
          {ampm}
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-6 mt-4 md:mt-8 opacity-85 transition-colors">
        <div className="w-10 md:w-24 h-px bg-[#c2956e]/40 dark:bg-[#b0855f]/40" />
        <p className="text-[11px] md:text-[14px] text-[#3d3b33] dark:text-[#e0e0e0] tracking-[0.45em] md:tracking-[0.6em] uppercase font-bold whitespace-nowrap">
          {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </p>
        <div className="w-10 md:w-24 h-px bg-[#c2956e]/40 dark:bg-[#b0855f]/40" />
      </div>
    </div>
  );
}