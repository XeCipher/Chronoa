"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useUiStore } from "@/store/uiStore";

const ActivityCalendar: any = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.ActivityCalendar),
  { ssr: false }
);

export default function TimeHeatmapDock({ data }: { data: any[] }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const { theme } = useUiStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, [theme]);

  const isExpanded = isHovered || isTouched;

  return (
    <div 
      className="fixed bottom-[72px] md:bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 md:px-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Touch dismiss overlay */}
      {isTouched && (
        <button
          className="md:hidden fixed inset-0 w-full h-full z-0 cursor-default outline-none"
          onClick={() => setIsTouched(false)}
          tabIndex={-1}
        />
      )}

      <div className="relative z-10 w-full">
        {/* Mobile Pull-up Handle */}
        <div
          className="md:hidden absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center p-2 z-50 transition-opacity"
          style={{ opacity: isExpanded ? 0 : 1, pointerEvents: isExpanded ? 'none' : 'auto' }}
          onClick={() => setIsTouched(true)}
        >
          <div className="w-12 h-1.5 bg-[#3d3b33]/20 dark:bg-white/20 rounded-full mb-1" />
          <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#888] dark:text-[#a0a0a0]">Activity</span>
        </div>

        <div className={`
          bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] md:rounded-b-none p-4 md:p-8 shadow-2xl transition-all duration-700 ease-in-out
          ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-[85%] opacity-40'}
        `}>
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] text-[#888] dark:text-[#aaa] tracking-widest font-bold uppercase">Time Tracking</p>
            <p className="text-[10px] text-[#5B9EA0] dark:text-[#6baea0] font-bold uppercase">Brighter = More Focus</p>
          </div>
          <div className="flex justify-center min-h-[100px] items-center">
            {data && data.length > 0 ? (
              <ActivityCalendar 
                data={data} 
                hideMonthLabels
                hideTotalCount
                colorScheme={isDark ? "dark" : "light"}
                theme={{ 
                  light: ['#f7f5f0', '#e0f0f0', '#91bebe', '#5b9ea0', '#3a6668'],
                  dark: ['#1e1e1e', '#1a3333', '#2a5a5a', '#3d8282', '#5b9ea0']
                }}
              />
            ) : (
              <p className="text-xs text-gray-400 dark:text-[#7a7a7a] italic">No time sessions recorded yet. Start a timer to see your progress here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}