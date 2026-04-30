"use client";

import { useState, useEffect } from "react";

export default function CenterClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-[200px]" />; // Prevents Hydration Shift

  return (
    <div className="flex flex-col items-center select-none pointer-events-none transition-colors drop-shadow-md dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      <div className="flex items-baseline justify-center">
        <h1 
          className="text-[110px] md:text-[180px] text-[#3d3b33] dark:text-[#f0f0f0] tracking-tight leading-none"
          style={{ fontFamily: 'var(--font-cormorant), serif' }}
        >
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
        </h1>
        <span className="text-2xl md:text-3xl ml-4 font-sans font-medium text-[#c2956e] dark:text-[#b0855f] tracking-[0.2em] uppercase">
          {time.getHours() >= 12 ? "PM" : "AM"}
        </span>
      </div>
      
      <div className="flex items-center gap-6 mt-4 md:mt-8 opacity-85 transition-colors">
        <div className="w-12 md:w-24 h-px bg-[#c2956e]/40 dark:bg-[#b0855f]/40" />
        <p className="text-[11px] md:text-[14px] text-[#3d3b33] dark:text-[#e0e0e0] tracking-[0.6em] uppercase font-bold">
          {time.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="w-12 md:w-24 h-px bg-[#c2956e]/40 dark:bg-[#b0855f]/40" />
      </div>
    </div>
  );
}