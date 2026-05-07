// frontend/components/home/SceneryBackground.tsx
"use client";

import { useEffect, useState } from "react";

export default function SceneryBackground() {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(new Date().getHours());
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTimeOfDay = () => {
    if (hour === null) return "day"; 
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "dusk";
    return "night";
  };

  const time = getTimeOfDay();

  // Refined palettes: Beautiful, soft, elegant pastels for light mode that aren't overwhelmingly bright
  const palettes = {
    dawn: {
      bg: "bg-[#fdfbf7] dark:bg-[#1a1210]",
      orb1: "bg-[#ffcba6] dark:bg-[#8a4e40]", 
      orb2: "bg-[#ffa68f] dark:bg-[#8a5a44]", 
      orb3: "bg-[#d6aef2] dark:bg-[#6c4f7a]", 
    },
    day: {
      bg: "bg-[#f7f5f0] dark:bg-[#0f1115]",
      orb1: "bg-[#d4b3ff] dark:bg-[#2d3b5c]", 
      orb2: "bg-[#9bc7f5] dark:bg-[#1e2e42]", 
      orb3: "bg-[#a1e3b3] dark:bg-[#253828]", 
    },
    dusk: {
      bg: "bg-[#f8f5f2] dark:bg-[#1a1012]",
      orb1: "bg-[#ff8a90] dark:bg-[#7a3b4c]", 
      orb2: "bg-[#f5b0db] dark:bg-[#7a4b6c]", 
      orb3: "bg-[#de9c64] dark:bg-[#7d4628]", 
    },
    night: {
      bg: "bg-[#f2f4f8] dark:bg-[#050810]",
      orb1: "bg-[#9eb4db] dark:bg-[#1f2b45]", 
      orb2: "bg-[#b9c6e3] dark:bg-[#111926]", 
      orb3: "bg-[#8da8cf] dark:bg-[#172033]", 
    },
  };

  const currentPalette = palettes[time];

  return (
    <div className={`fixed inset-0 -z-50 overflow-hidden transition-colors duration-[3000ms] ${currentPalette.bg}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float1 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.7; } 33% { transform: translate(50px, -50px) scale(1.1); opacity: 0.9; } 66% { transform: translate(-30px, 20px) scale(0.9); opacity: 0.6; } }
        @keyframes float2 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.7; } 33% { transform: translate(-50px, 50px) scale(1.2); opacity: 0.5; } 66% { transform: translate(40px, -30px) scale(0.8); opacity: 0.9; } }
        @keyframes float3 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.5; } 33% { transform: translate(30px, 40px) scale(0.9); opacity: 0.8; } 66% { transform: translate(-40px, -40px) scale(1.15); opacity: 0.4; } }
        .orb-1 { animation: float1 18s ease-in-out infinite; }
        .orb-2 { animation: float2 22s ease-in-out infinite; }
        .orb-3 { animation: float3 25s ease-in-out infinite; }
      `}} />

      <div className="absolute inset-0 w-full h-full opacity-80 dark:opacity-100">
        <div className={`orb-1 absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${currentPalette.orb1}`} />
        <div className={`orb-2 absolute bottom-[-20%] left-[-10%] w-[90vw] h-[90vw] md:w-[60vw] md:h-[60vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${currentPalette.orb2}`} />
        <div className={`orb-3 absolute top-[20%] left-[20%] w-[75vw] h-[75vw] md:w-[45vw] md:h-[45vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${currentPalette.orb3}`} />
      </div>

      {/* Subtle texture for realism */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none mix-blend-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
        </svg>
      </div>
    </div>
  );
}