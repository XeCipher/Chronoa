"use client";

import { useState } from "react";
import CenterClock from "@/components/home/CenterClock";
import SceneryBackground from "@/components/home/SceneryBackground";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";
import WeatherWidget from "@/components/home/WeatherWidget";
import { useTimerStore } from "@/store/timerStore";

export default function HomePage() {
  const [isHovered, setIsHovered] = useState(false);
  const isPinned = useTimerStore((state: any) => state.isPinned);
  const showWidget = isHovered || isPinned;

  return (
    // FIX: Removed bg-[#f7f5f0] which was hiding the scenery
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <SceneryBackground />
      
      <div className="absolute top-10 right-12 z-20">
        <WeatherWidget />
      </div>

      <div 
        className="relative z-10 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ 
          transform: showWidget ? 'translateY(-16vh) scale(0.9)' : 'translateY(-4vh) scale(1)',
          opacity: showWidget ? 0.9 : 1
        }}
      >
        <CenterClock />
      </div>

      <div 
        className="absolute bottom-0 left-0 w-full h-[25vh] z-30 flex items-end justify-center pb-10 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ProductivityWidgets isVisible={showWidget} />
      </div>
    </div>
  );
}