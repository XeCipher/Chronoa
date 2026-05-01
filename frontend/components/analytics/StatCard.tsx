// frontend/components/analytics/StatCard.tsx
"use client";

import { ElementType } from "react";

interface Props {
  title: string;
  value: string | number;
  subValue?: string | number;
  icon: ElementType;
  color: 'sage' | 'amber' | 'purple' | 'blue';
}

const colorMaps = {
  sage: 'bg-[#7ca982]/10 text-[#7ca982] dark:bg-[#7ca982]/20 dark:text-[#8cbd92]',
  amber: 'bg-[#c2956e]/10 text-[#c2956e] dark:bg-[#c2956e]/20 dark:text-[#d1a784]',
  purple: 'bg-[#a882c2]/10 text-[#a882c2] dark:bg-[#a882c2]/20 dark:text-[#b895d1]',
  blue: 'bg-[#6e90c2]/10 text-[#6e90c2] dark:bg-[#6e90c2]/20 dark:text-[#8aaae0]',
};

const bgGradients = {
  sage: 'bg-[#7ca982]',
  amber: 'bg-[#c2956e]',
  purple: 'bg-[#a882c2]',
  blue: 'bg-[#6e90c2]',
};

const textColorMaps = {
  sage: 'text-[#7ca982] dark:text-[#8cbd92]',
  amber: 'text-[#c2956e] dark:text-[#d1a784]',
  purple: 'text-[#a882c2] dark:text-[#b895d1]',
  blue: 'text-[#6e90c2] dark:text-[#8aaae0]',
};

export default function StatCard({ title, value, subValue, icon: Icon, color }: Props) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[1.5rem] p-4 md:p-5 flex flex-col justify-between hover:border-[#c2956e]/40 dark:hover:border-[#b0855f]/50 transition-all duration-300 shadow-sm hover:shadow-md group relative overflow-hidden h-full min-h-[110px] md:min-h-[120px]">
      
      {/* Subtle background ambient glow for elegance */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-[40px] opacity-10 dark:opacity-20 transition-opacity duration-500 group-hover:opacity-30 dark:group-hover:opacity-40 ${bgGradients[color]} pointer-events-none`} />

      <div className="flex justify-between items-start mb-2 md:mb-4 relative z-10">
        <div className={`p-2 md:p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 shrink-0 ${colorMaps[color]}`}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex flex-col relative z-10 mt-auto">
        <h4 className="text-xl md:text-3xl font-serif italic text-[#3d3b33] dark:text-[#f0f0f0] mb-0.5 md:mb-1.5 whitespace-normal break-words leading-tight">
          {value}
        </h4>
        
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider md:tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a] leading-relaxed whitespace-normal break-words">
            {title}
          </p>
          {subValue !== undefined && (
            <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-relaxed whitespace-normal break-words ${textColorMaps[color]}`}>
              Best: {subValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}