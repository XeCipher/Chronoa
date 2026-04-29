"use client";

import { useState } from "react";
import CenterClock from "@/components/home/CenterClock";
import SceneryBackground from "@/components/home/SceneryBackground";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";
import WeatherWidget from "@/components/home/WeatherWidget";
import { useTimerStore } from "@/store/timerStore";

export default function HomePage() {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  const isPinned = useTimerStore((state: any) => state.isPinned);
  const showWidget = isHovered || isPinned || isTouched;

  return (
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
        className="absolute bottom-[72px] md:bottom-0 left-0 w-full h-[15vh] md:h-[25vh] z-30 flex items-end justify-center pb-6 md:pb-10 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Mobile Pull-up Handle */}
        <div
          className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center p-4 z-40 transition-opacity"
          style={{ opacity: showWidget ? 0 : 1, pointerEvents: showWidget ? 'none' : 'auto' }}
          onClick={() => setIsTouched(true)}
        >
          <div className="w-12 h-1.5 bg-[#3d3b33]/20 dark:bg-[#e0e0e0]/20 rounded-full mb-1.5" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#888] dark:text-[#a0a0a0]">Focus</span>
        </div>

        {/* Touch dismiss overlay */}
        {isTouched && !isPinned && (
          <button
            className="md:hidden fixed inset-0 w-full h-full z-0 cursor-default outline-none"
            onClick={() => setIsTouched(false)}
            tabIndex={-1}
          />
        )}

        <div className="relative z-10 w-full flex justify-center">
          <ProductivityWidgets isVisible={showWidget} />
        </div>
      </div>
    </div>
  );
}