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
  const { theme } = useUiStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, [theme]);

  return (
    <div 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 md:px-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-6 w-full" />
      <div className={`
        bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-t-[2rem] p-4 md:p-8 shadow-2xl transition-all duration-700 ease-in-out
        ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-[85%] opacity-40'}
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
  );
}
