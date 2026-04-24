"use client";

import { useState, useEffect } from "react";

export default function CenterClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="text-center select-none animate-fade-up">
      <h2 
        className="text-[120px] md:text-[180px] leading-none text-[#3d3b33] font-serif font-light tracking-tighter"
        style={{ fontFamily: 'var(--font-cormorant), serif' }}
      >
        {formatTime(time).replace(/\s[AP]M/, "")}
        <span className="text-3xl md:text-4xl ml-2 font-sans font-light text-[#c2956e] tracking-widest uppercase">
          {time.getHours() >= 12 ? "pm" : "am"}
        </span>
      </h2>
      <p className="text-[14px] md:text-[16px] text-[#888] tracking-[0.4em] uppercase font-medium mt-4">
        {formatDate(time)}
      </p>
    </div>
  );
}