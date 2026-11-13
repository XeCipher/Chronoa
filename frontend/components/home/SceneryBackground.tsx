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

  const bgClasses = {
    dawn: "bg-[#fdfbf7] dark:bg-[#1a1210]",
    day: "bg-[#f7f5f0] dark:bg-[#0f1115]",
    dusk: "bg-[#f8f5f2] dark:bg-[#1a1012]",
    night: "bg-[#f2f4f8] dark:bg-[#050810]",
  };

  return (
    <div className={`fixed inset-0 -z-50 overflow-hidden transition-colors duration-[2000ms] ${bgClasses[time]}`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float1 {
              0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
              33% { transform: translate3d(50px, -50px, 0) scale(1.08); }
              66% { transform: translate3d(-30px, 20px, 0) scale(0.94); }
            }
            @keyframes float2 {
              0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
              33% { transform: translate3d(-50px, 50px, 0) scale(1.12); }
              66% { transform: translate3d(40px, -30px, 0) scale(0.9); }
            }
            @keyframes float3 {
              0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
              33% { transform: translate3d(30px, 40px, 0) scale(0.92); }
              66% { transform: translate3d(-40px, -40px, 0) scale(1.1); }
            }
            .orb-1 { animation: float1 18s ease-in-out infinite; will-change: transform; backface-visibility: hidden; }
            .orb-2 { animation: float2 22s ease-in-out infinite; will-change: transform; backface-visibility: hidden; }
            .orb-3 { animation: float3 25s ease-in-out infinite; will-change: transform; backface-visibility: hidden; }

            .scenery-orb-dawn-1 { background: radial-gradient(circle, rgba(255,203,166,0.58) 0%, rgba(255,203,166,0.22) 45%, transparent 72%); }
            .scenery-orb-dawn-2 { background: radial-gradient(circle, rgba(255,166,143,0.55) 0%, rgba(255,166,143,0.2) 45%, transparent 72%); }
            .scenery-orb-dawn-3 { background: radial-gradient(circle, rgba(214,174,242,0.5) 0%, rgba(214,174,242,0.18) 45%, transparent 72%); }
            .dark .scenery-orb-dawn-1 { background: radial-gradient(circle, rgba(138,78,64,0.58) 0%, rgba(138,78,64,0.22) 45%, transparent 72%); }
            .dark .scenery-orb-dawn-2 { background: radial-gradient(circle, rgba(138,90,68,0.55) 0%, rgba(138,90,68,0.2) 45%, transparent 72%); }
            .dark .scenery-orb-dawn-3 { background: radial-gradient(circle, rgba(108,79,122,0.5) 0%, rgba(108,79,122,0.18) 45%, transparent 72%); }

            .scenery-orb-day-1 { background: radial-gradient(circle, rgba(212,179,255,0.52) 0%, rgba(212,179,255,0.2) 45%, transparent 72%); }
            .scenery-orb-day-2 { background: radial-gradient(circle, rgba(155,199,245,0.55) 0%, rgba(155,199,245,0.2) 45%, transparent 72%); }
            .scenery-orb-day-3 { background: radial-gradient(circle, rgba(161,227,179,0.5) 0%, rgba(161,227,179,0.18) 45%, transparent 72%); }
            .dark .scenery-orb-day-1 { background: radial-gradient(circle, rgba(45,59,92,0.62) 0%, rgba(45,59,92,0.24) 45%, transparent 72%); }
            .dark .scenery-orb-day-2 { background: radial-gradient(circle, rgba(30,46,66,0.62) 0%, rgba(30,46,66,0.24) 45%, transparent 72%); }
            .dark .scenery-orb-day-3 { background: radial-gradient(circle, rgba(37,56,40,0.58) 0%, rgba(37,56,40,0.22) 45%, transparent 72%); }

            .scenery-orb-dusk-1 { background: radial-gradient(circle, rgba(255,138,144,0.52) 0%, rgba(255,138,144,0.2) 45%, transparent 72%); }
            .scenery-orb-dusk-2 { background: radial-gradient(circle, rgba(245,176,219,0.5) 0%, rgba(245,176,219,0.18) 45%, transparent 72%); }
            .scenery-orb-dusk-3 { background: radial-gradient(circle, rgba(222,156,100,0.5) 0%, rgba(222,156,100,0.18) 45%, transparent 72%); }
            .dark .scenery-orb-dusk-1 { background: radial-gradient(circle, rgba(122,59,76,0.6) 0%, rgba(122,59,76,0.24) 45%, transparent 72%); }
            .dark .scenery-orb-dusk-2 { background: radial-gradient(circle, rgba(122,75,108,0.58) 0%, rgba(122,75,108,0.22) 45%, transparent 72%); }
            .dark .scenery-orb-dusk-3 { background: radial-gradient(circle, rgba(125,70,40,0.55) 0%, rgba(125,70,40,0.2) 45%, transparent 72%); }

            .scenery-orb-night-1 { background: radial-gradient(circle, rgba(158,180,219,0.55) 0%, rgba(158,180,219,0.2) 45%, transparent 72%); }
            .scenery-orb-night-2 { background: radial-gradient(circle, rgba(185,198,227,0.5) 0%, rgba(185,198,227,0.18) 45%, transparent 72%); }
            .scenery-orb-night-3 { background: radial-gradient(circle, rgba(141,168,207,0.48) 0%, rgba(141,168,207,0.16) 45%, transparent 72%); }
            .dark .scenery-orb-night-1 { background: radial-gradient(circle, rgba(31,43,69,0.65) 0%, rgba(31,43,69,0.25) 45%, transparent 72%); }
            .dark .scenery-orb-night-2 { background: radial-gradient(circle, rgba(17,25,38,0.65) 0%, rgba(17,25,38,0.25) 45%, transparent 72%); }
            .dark .scenery-orb-night-3 { background: radial-gradient(circle, rgba(23,32,51,0.6) 0%, rgba(23,32,51,0.22) 45%, transparent 72%); }
          `,
        }}
      />

      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div
          className={`orb-1 absolute top-[-20%] right-[-15%] w-[95vw] h-[95vw] md:w-[65vw] md:h-[65vw] rounded-full transition-colors duration-[2000ms] scenery-orb-${time}-1`}
        />
        <div
          className={`orb-2 absolute bottom-[-30%] left-[-15%] w-[105vw] h-[105vw] md:w-[75vw] md:h-[75vw] rounded-full transition-colors duration-[2000ms] scenery-orb-${time}-2`}
        />
        <div
          className={`orb-3 absolute top-[10%] left-[10%] w-[90vw] h-[90vw] md:w-[60vw] md:h-[60vw] rounded-full transition-colors duration-[2000ms] scenery-orb-${time}-3`}
        />
      </div>
    </div>
  );
}