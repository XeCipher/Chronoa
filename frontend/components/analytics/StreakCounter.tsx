"use client";

import { Flame } from "lucide-react";

export default function StreakCounter({ streak }: { streak: number }) {
  return (
    <div className="bg-white border border-[#e0ddd5] rounded-[2rem] p-8 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-2xl ${streak > 0 ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-300'}`}>
        <Flame size={32} fill={streak > 0 ? "currentColor" : "none"} />
      </div>
      <div>
        <p className="text-[10px] text-[#b0ad9a] font-bold uppercase tracking-[0.2em]">Current Streak</p>
        <h4 className="text-4xl text-[#3d3b33] font-serif italic">
          {streak} {streak === 1 ? 'Day' : 'Days'}
        </h4>
      </div>
    </div>
  );
}