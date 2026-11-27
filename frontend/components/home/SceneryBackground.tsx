// frontend/components/home/SceneryBackground.tsx
"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/store/uiStore";

export default function SceneryBackground({
  contained = false,
}: {
  contained?: boolean;
}) {
  const [hour, setHour] = useState<number | null>(() =>
    typeof window !== "undefined" && useUiStore.getState().hasDashboardMounted
      ? new Date().getHours()
      : null
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

  // Balanced pastel palettes: vibrant enough to feel alive without overpowering the workspace
  const palettes = {
    dawn: {
      bg: "bg-[#fdfaf5] dark:bg-[#1a1210]",
      orb1: "bg-[#ffc093] dark:bg-[#a15846]",
      orb2: "bg-[#ff9882] dark:bg-[#a6674d]",
      orb3: "bg-[#d1a5f4] dark:bg-[#7d598f]",
    },
    day: {
      bg: "bg-[#f7f5f0] dark:bg-[#0f1115]",
      orb1: "bg-[#cca7ff] dark:bg-[#3d4d80]",
      orb2: "bg-[#8cc0f6] dark:bg-[#254566]",
      orb3: "bg-[#90e2a8] dark:bg-[#2d533a]",
    },
    dusk: {
      bg: "bg-[#f8f4f2] dark:bg-[#1a1012]",
      orb1: "bg-[#ff8089] dark:bg-[#904255]",
      orb2: "bg-[#f3a1d6] dark:bg-[#8b517b]",
      orb3: "bg-[#e5995c] dark:bg-[#93522d]",
    },
    night: {
      bg: "bg-[#f0f3f9] dark:bg-[#050810]",
      orb1: "bg-[#90ace2] dark:bg-[#2a3f68]",
      orb2: "bg-[#b0afe7] dark:bg-[#1e2a4a]",
      orb3: "bg-[#7eb0d3] dark:bg-[#223c53]",
    },
  };

  const currentPalette = palettes[time];

  return (
    <div
      className={`${
        contained ? "absolute" : "fixed"
      } inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-[3000ms] ${currentPalette.bg}`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float1 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.7; } 33% { transform: translate(50px, -50px) scale(1.1); opacity: 0.9; } 66% { transform: translate(-30px, 20px) scale(0.9); opacity: 0.62; } }
        @keyframes float2 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.7; } 33% { transform: translate(-50px, 50px) scale(1.2); opacity: 0.55; } 66% { transform: translate(40px, -30px) scale(0.8); opacity: 0.9; } }
        @keyframes float3 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.55; } 33% { transform: translate(30px, 40px) scale(0.9); opacity: 0.82; } 66% { transform: translate(-40px, -40px) scale(1.15); opacity: 0.45; } }
        .orb-1 { animation: float1 18s ease-in-out infinite; }
        .orb-2 { animation: float2 22s ease-in-out infinite; }
        .orb-3 { animation: float3 25s ease-in-out infinite; }
      `,
        }}
      />

      <div className="absolute inset-0 w-full h-full opacity-90 dark:opacity-100">
        <div
          className={`orb-1 absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] md:blur-[125px] transition-colors duration-[3000ms] ${currentPalette.orb1}`}
        />
        <div
          className={`orb-2 absolute bottom-[-20%] left-[-10%] w-[90vw] h-[90vw] md:w-[60vw] md:h-[60vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] md:blur-[125px] transition-colors duration-[3000ms] ${currentPalette.orb2}`}
        />
        <div
          className={`orb-3 absolute top-[20%] left-[20%] w-[75vw] h-[75vw] md:w-[45vw] md:h-[45vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] md:blur-[125px] transition-colors duration-[3000ms] ${currentPalette.orb3}`}
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