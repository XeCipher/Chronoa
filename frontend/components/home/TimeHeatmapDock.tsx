"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';

const ActivityCalendar: any = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.ActivityCalendar),
  { ssr: false }
);

export default function TimeHeatmapDock({ data }: { data: any[] }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-6 w-full" />

      <div className={`
        bg-white/40 backdrop-blur-xl border border-white/50 rounded-t-[2rem] p-8 shadow-2xl transition-all duration-700 ease-in-out
        ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-[85%] opacity-40'}
      `}>
        <div className="flex justify-between items-center mb-6">
          <p className="text-[10px] text-[#888] tracking-widest font-bold uppercase">Time Tracking</p>
          <p className="text-[10px] text-[#5B9EA0] font-bold uppercase">Brighter = More Focus</p>
        </div>
        
        <div className="flex justify-center min-h-[100px] items-center">
          {/* GUARD: Prevent crash if data is empty */}
          {data && data.length > 0 ? (
            <ActivityCalendar 
              data={data} 
              hideMonthLabels
              hideTotalCount
              theme={{ light: ['#f7f5f0', '#e0f0f0', '#91bebe', '#5b9ea0', '#3a6668'] }}
            />
          ) : (
            <p className="text-xs text-gray-400 italic">No time sessions recorded yet. Start a timer to see your progress here.</p>
          )}
        </div>
      </div>
    </div>
  );
}