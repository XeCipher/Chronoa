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
    <div className="relative w-full h-[100dvh] overflow-hidden flex items-center justify-center touch-none overscroll-none">
      <SceneryBackground />
      
      <div className="absolute top-10 right-12 z-20">
        <WeatherWidget />
      </div>

      <div 
        className="relative z-10 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ 
          transform: showWidget ? 'translateY(-16vh) scale(0.9)' : 'translateY(-4vh) scale(1)',
          opacity: showWidget ? 0.8 : 1
        }}
      >
        <CenterClock />
      </div>

      {/* Desktop hint to hover */}
      <div 
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 pointer-events-none transition-all duration-700 z-20" 
        style={{ opacity: showWidget ? 0 : 0.5, transform: showWidget ? 'translateY(10px)' : 'translateY(0)' }}
      >
        <div className="w-8 h-[2px] bg-[#888]/80 dark:bg-[#a0a0a0]/80 rounded-full animate-pulse" />
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
          <div className="w-12 h-1.5 bg-[#3d3b33]/20 dark:bg-[#e0e0e0]/20 rounded-full" />
        </div>

        {/* Touch dismiss overlay */}
        {isTouched && !isPinned && (
          <button
            className="md:hidden fixed inset-0 w-full h-full z-0 cursor-default outline-none"
            onClick={() => setIsTouched(false)}
            tabIndex={-1}
          />
        )}

        <div className="relative z-10 w-full">
          <ProductivityWidgets isVisible={showWidget} />
        </div>
      </div>
    </div>
  );
}