// frontend/components/home/SceneryBackground.tsx
"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/store/uiStore";

export default function SceneryBackground() {
  const [hour, setHour] = useState<number | null>(() =>
    typeof window !== "undefined" && useUiStore.getState().hasDashboardMounted ? new Date().getHours() : null
  );

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

  // Soft pastel palettes calibrated so light mode stays luminous and dark mode glows cleanly under screen blending
  const palettes = {
    dawn: {
      bg: "bg-[#fdf9f4] dark:bg-[#1a1210]",
      orb1: "bg-[#ffb580] dark:bg-[#b8624b]",
      orb2: "bg-[#ff8a75] dark:bg-[#c27355]",
      orb3: "bg-[#cb9bf5] dark:bg-[#8e63a3]",
    },
    day: {
      bg: "bg-[#f6f4ef] dark:bg-[#0f1115]",
      orb1: "bg-[#c59bff] dark:bg-[#4c5fa3]",
      orb2: "bg-[#7dbaf7] dark:bg-[#2c5c8a]",
      orb3: "bg-[#7fe09d] dark:bg-[#356e4c]",
    },
    dusk: {
      bg: "bg-[#f9f3f2] dark:bg-[#1a1012]",
      orb1: "bg-[#ff7582] dark:bg-[#a6485e]",
      orb2: "bg-[#f092d0] dark:bg-[#9c578a]",
      orb3: "bg-[#eb9654] dark:bg-[#a85e32]",
    },
    night: {
      bg: "bg-[#eff2fa] dark:bg-[#050810]",
      orb1: "bg-[#82a3e8] dark:bg-[#35528a]",
      orb2: "bg-[#a698eb] dark:bg-[#2a3b6e]",
      orb3: "bg-[#6fb8d6] dark:bg-[#2d5873]",
    },
  };

  const currentPalette = palettes[time];

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-[3000ms] ${currentPalette.bg}`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float1 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.72; } 33% { transform: translate(50px, -50px) scale(1.1); opacity: 0.92; } 66% { transform: translate(-30px, 20px) scale(0.9); opacity: 0.65; } }
        @keyframes float2 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.72; } 33% { transform: translate(-50px, 50px) scale(1.2); opacity: 0.6; } 66% { transform: translate(40px, -30px) scale(0.85); opacity: 0.9; } }
        @keyframes float3 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.6; } 33% { transform: translate(30px, 40px) scale(0.92); opacity: 0.85; } 66% { transform: translate(-40px, -40px) scale(1.15); opacity: 0.52; } }
        .orb-1 { animation: float1 18s ease-in-out infinite; }
        .orb-2 { animation: float2 22s ease-in-out infinite; }
        .orb-3 { animation: float3 25s ease-in-out infinite; }
      `,
        }}
      />

      <div className="absolute inset-0 w-full h-full">
        <div
          className={`orb-1 absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] md:blur-[110px] transition-colors duration-[3000ms] ${currentPalette.orb1}`}
        />
        <div
          className={`orb-2 absolute bottom-[-20%] left-[-10%] w-[90vw] h-[90vw] md:w-[60vw] md:h-[60vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] md:blur-[110px] transition-colors duration-[3000ms] ${currentPalette.orb2}`}
        />
        <div
          className={`orb-3 absolute top-[20%] left-[20%] w-[75vw] h-[75vw] md:w-[45vw] md:h-[45vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] md:blur-[110px] transition-colors duration-[3000ms] ${currentPalette.orb3}`}
        />
      </div>

      {/* Subtle texture for realism */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none mix-blend-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
    </div>
  );
}