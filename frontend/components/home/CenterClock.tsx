"use client";

export default function CenterClock() {
  // We'll add live ticking logic later!
  return (
    <div 
      className="text-8xl md:text-9xl text-[#3d3b33] tracking-tighter drop-shadow-sm" 
      style={{ fontFamily: 'var(--font-cormorant), serif' }}
    >
      10:42
    </div>
  );
}