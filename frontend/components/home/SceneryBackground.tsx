"use client";

import { useEffect, useState } from "react";

export default function SceneryBackground() {
  const [hour, setHour] = useState(new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTimeOfDay = () => {
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "dusk";
    return "night";
  };

  const time = getTimeOfDay();

  // Dark mode responsive palettes + fixed night colors
  const palettes = {
    dawn: {
      bg: "bg-[#fdfbf7] dark:bg-[#151515]",
      orb1: "bg-[#ffecd2] dark:bg-[#4a362a]", 
      orb2: "bg-[#fcb69f] dark:bg-[#4a2e28]", 
      orb3: "bg-[#e2c2f0] dark:bg-[#3d2f47]", 
    },
    day: {
      bg: "bg-[#f7f5f0] dark:bg-[#121212]",
      orb1: "bg-[#e0c3fc] dark:bg-[#2d223d]", 
      orb2: "bg-[#8ec5fc] dark:bg-[#1e2e42]", 
      orb3: "bg-[#d4eed8] dark:bg-[#253828]", 
    },
    dusk: {
      bg: "bg-[#f8f5f2] dark:bg-[#151515]",
      orb1: "bg-[#ff9a9e] dark:bg-[#4d2629]", 
      orb2: "bg-[#fecfef] dark:bg-[#4a3243]", 
      orb3: "bg-[#c2956e] dark:bg-[#4d3827]", 
    },
    night: {
      bg: "bg-[#0d1321] dark:bg-[#070a12]",
      orb1: "bg-[#1d2a40] dark:bg-[#111926]", 
      orb2: "bg-[#182336] dark:bg-[#0d141f]", 
      orb3: "bg-[#293652] dark:bg-[#171f30]", 
    },
  };

  const currentPalette = palettes[time];

  return (
    <div className={`fixed inset-0 -z-50 overflow-hidden transition-colors duration-[3000ms] ${currentPalette.bg}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float1 { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(50px, -50px) scale(1.1); } 66% { transform: translate(-30px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes float2 { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(-50px, 50px) scale(1.2); } 66% { transform: translate(40px, -30px) scale(0.8); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes float3 { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, 40px) scale(0.9); } 66% { transform: translate(-40px, -40px) scale(1.15); } 100% { transform: translate(0px, 0px) scale(1); } }
        .orb-1 { animation: float1 18s ease-in-out infinite; }
        .orb-2 { animation: float2 22s ease-in-out infinite; }
        .orb-3 { animation: float3 25s ease-in-out infinite; }
      `}} />

      <div className="absolute inset-0 w-full h-full opacity-60">
        <div className={`orb-1 absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[100px] md:blur-[140px] opacity-70 transition-colors duration-[3000ms] ${currentPalette.orb1}`} />
        <div className={`orb-2 absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[100px] md:blur-[140px] opacity-70 transition-colors duration-[3000ms] ${currentPalette.orb2}`} />
        <div className={`orb-3 absolute top-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full mix-blend-multiply filter blur-[100px] md:blur-[140px] opacity-50 transition-colors duration-[3000ms] ${currentPalette.orb3}`} />
      </div>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
        </svg>
      </div>

    </div>
  );
}