"use client";

import { useState, useEffect } from "react";

export default function CenterClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center select-none pointer-events-none flex flex-col items-center">
      <h2 
        className="text-[140px] md:text-[220px] leading-[0.7] text-[#3d3b33] dark:text-[#f0f0f0] font-light tracking-tighter drop-shadow-[0_10px_30px_rgba(61,59,51,0.08)] dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors"
        style={{ fontFamily: 'var(--font-cormorant), serif' }}
      >
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
        <span className="text-3xl md:text-5xl ml-3 font-sans font-light text-[#b0ad9a] dark:text-[#7a7a7a] tracking-widest uppercase drop-shadow-none">
          {time.getHours() >= 12 ? "pm" : "am"}
        </span>
      </h2>

      <p className="text-[13px] md:text-[15px] text-[#888] dark:text-[#a0a0a0] tracking-[0.6em] uppercase font-medium mt-8 opacity-80 drop-shadow-sm transition-colors">
        {time.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}