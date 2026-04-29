"use client";

import { Flame } from "lucide-react";

export default function StreakCounter({ streak }: { streak: number }) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-8 shadow-sm flex items-center gap-6 transition-colors">
      <div className={`p-4 rounded-2xl ${streak > 0 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400' : 'bg-gray-50 dark:bg-[#222] text-gray-300 dark:text-[#555]'}`}>
        <Flame size={32} fill={streak > 0 ? "currentColor" : "none"} />
      </div>
      <div>
        <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] font-bold uppercase tracking-[0.2em]">Current Streak</p>
        <h4 className="text-4xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif italic">
          {streak} {streak === 1 ? 'Day' : 'Days'}
        </h4>
      </div>
    </div>
  );
}