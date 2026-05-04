// frontend/app/(dashboard)/page.tsx
"use client";

import { useState } from "react";
import CenterClock from "@/components/home/CenterClock";
import SceneryBackground from "@/components/home/SceneryBackground";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";
import WeatherWidget from "@/components/home/WeatherWidget";
import HomeTaskProgress from "@/components/home/HomeTaskProgress";
import { useTimerStore } from "@/store/timerStore";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  const isPinned = useTimerStore((state: any) => state.isPinned);
  const forceShow = useTimerStore((state: any) => state.forceShowWidgets);
  const setForceShow = useTimerStore((state: any) => state.setForceShowWidgets);
  
  const timers = useTimerStore((state: any) => state.timers);
  const stopwatches = useTimerStore((state: any) => state.stopwatches);
  const isAnyRunning = timers?.some((t: any) => t.isRunning) || stopwatches?.some((s: any) => s.isRunning);
  
  const showWidget = isHovered || isPinned || isTouched || forceShow;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center touch-none overscroll-none">
      <SceneryBackground />
      <HomeTaskProgress />
      
      {/* Elegant Mobile Settings Link Button positioned gracefully at the top right */}
      <div className="fixed top-[calc(1.5rem+env(safe-area-inset-top))] right-[calc(1.5rem+env(safe-area-inset-right))] md:hidden z-40">
        <button 
          onClick={() => router.push('/settings')} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm text-[#3d3b33] dark:text-white transition-all active:scale-95"
        >
          <Settings size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="hidden md:block absolute md:top-10 md:right-12 z-20">
        <WeatherWidget />
      </div>

      <div 
        className={`relative z-10 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] ${showWidget ? '-translate-y-[16vh] scale-90 opacity-80' : 'max-md:-translate-y-[8vh] md:-translate-y-[4vh] scale-100 opacity-100'}`}
      >
        <CenterClock />
      </div>

      <div 
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 pointer-events-none transition-all duration-700 z-20" 
        style={{ opacity: showWidget ? 0 : 0.5, transform: showWidget ? 'translateY(10px)' : 'translateY(0)' }}
      >
        <div className={`transition-all duration-500 rounded-full animate-pulse ${isAnyRunning ? 'w-16 h-1.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'w-8 h-[2px] bg-[#888]/80 dark:bg-[#a0a0a0]/80'}`} />
      </div>

      <div 
        className="absolute bottom-0 left-0 w-full h-[15vh] md:h-[25vh] z-30 flex items-end justify-center pb-6 md:pb-10 group pointer-events-none md:pointer-events-auto"
        onMouseEnter={() => {
          if (window.matchMedia('(hover: hover)').matches) {
            setIsHovered(true);
            if (forceShow) setForceShow(false);
          }
        }}
        onMouseLeave={() => {
          if (window.matchMedia('(hover: hover)').matches) {
            setIsHovered(false);
          }
        }}
      >
        <div
          className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center p-4 z-40 transition-opacity pointer-events-auto"
          style={{ opacity: showWidget ? 0 : 1 }}
          onClick={() => {
            setIsTouched(true);
            if (forceShow) setForceShow(false);
          }}
        >
          <div className={`transition-all duration-500 rounded-full ${isAnyRunning ? 'w-16 h-1.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse' : 'w-12 h-1.5 bg-[#3d3b33]/20 dark:bg-[#e0e0e0]/20'}`} />
        </div>

        {isTouched && !isPinned && (
          <button
            className="md:hidden fixed inset-0 w-full h-full z-0 cursor-default outline-none pointer-events-auto"
            onClick={(e) => { e.stopPropagation(); setIsTouched(false); }}
            tabIndex={-1}
          />
        )}

        <div className="relative z-10 w-full pointer-events-auto">
          <ProductivityWidgets isVisible={showWidget} />
        </div>
      </div>
    </div>
  );
}