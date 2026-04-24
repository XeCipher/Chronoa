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

  // Color palettes tailored to be extremely soft and aesthetic
  const palettes = {
    dawn: {
      bg: "bg-[#fdfbf7]",
      orb1: "bg-[#ffecd2]", // Soft peach
      orb2: "bg-[#fcb69f]", // Warm rose
      orb3: "bg-[#e2c2f0]", // Morning lavender
    },
    day: {
      bg: "bg-[#f7f5f0]",
      orb1: "bg-[#e0c3fc]", // Pale violet
      orb2: "bg-[#8ec5fc]", // Sky blue
      orb3: "bg-[#d4eed8]", // Mint sage
    },
    dusk: {
      bg: "bg-[#f8f5f2]",
      orb1: "bg-[#ff9a9e]", // Sunset pink
      orb2: "bg-[#fecfef]", // Soft magenta
      orb3: "bg-[#c2956e]", // Warm amber
    },
    night: {
      bg: "bg-[#f0f2f5]",
      orb1: "bg-[#a1c4fd]", // Moonlit blue
      orb2: "bg-[#c2e9fb]", // Frost white
      orb3: "bg-[#dcd9f8]", // Deep silver-lavender
    },
  };

  const currentPalette = palettes[time];

  return (
    <div className={`fixed inset-0 -z-50 overflow-hidden transition-colors duration-[3000ms] ${currentPalette.bg}`}>
      
      {/* Custom Keyframes for smooth, organic orb movement */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.1); }
          66% { transform: translate(-30px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float2 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-50px, 50px) scale(1.2); }
          66% { transform: translate(40px, -30px) scale(0.8); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float3 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, 40px) scale(0.9); }
          66% { transform: translate(-40px, -40px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .orb-1 { animation: float1 18s ease-in-out infinite; }
        .orb-2 { animation: float2 22s ease-in-out infinite; }
        .orb-3 { animation: float3 25s ease-in-out infinite; }
      `}} />

      {/* Ambient Light Orbs */}
      <div className="absolute inset-0 w-full h-full opacity-60">
        {/* Top Right Orb */}
        <div 
          className={`orb-1 absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[100px] md:blur-[140px] opacity-70 transition-colors duration-[3000ms] ${currentPalette.orb1}`} 
        />
        {/* Bottom Left Orb */}
        <div 
          className={`orb-2 absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[100px] md:blur-[140px] opacity-70 transition-colors duration-[3000ms] ${currentPalette.orb2}`} 
        />
        {/* Center/Accent Orb */}
        <div 
          className={`orb-3 absolute top-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full mix-blend-multiply filter blur-[100px] md:blur-[140px] opacity-50 transition-colors duration-[3000ms] ${currentPalette.orb3}`} 
        />
      </div>

      {/* Premium Grain/Noise Overlay (The secret sauce for aesthetic UI) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
        </svg>
      </div>

    </div>
  );
}