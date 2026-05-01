"use client";

import { ElementType } from "react";
import { Info } from "lucide-react";
import { Tooltip } from "react-tooltip";

interface Props {
  title: string;
  value: string | number;
  subValue?: string | number;
  infoText: string;
  icon: ElementType;
  color: 'sage' | 'amber' | 'purple' | 'blue';
}

const colorMaps = {
  sage: 'bg-[#7ca982]/10 text-[#7ca982] dark:bg-[#7ca982]/20 dark:text-[#8cbd92]',
  amber: 'bg-[#c2956e]/10 text-[#c2956e] dark:bg-[#c2956e]/20 dark:text-[#d1a784]',
  purple: 'bg-[#a882c2]/10 text-[#a882c2] dark:bg-[#a882c2]/20 dark:text-[#b895d1]',
  blue: 'bg-[#6e90c2]/10 text-[#6e90c2] dark:bg-[#6e90c2]/20 dark:text-[#8aaae0]',
};

export default function StatCard({ title, value, subValue, infoText, icon: Icon, color }: Props) {
  const tooltipId = `tooltip-${title.replace(/\s+/g, '-')}`;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-5 md:p-6 flex flex-col justify-center gap-4 hover:border-[#c2956e]/40 dark:hover:border-[#b0855f]/50 transition-colors shadow-sm group relative">
      
      {/* Info Icon & Tooltip */}
      <div className="absolute top-5 right-5">
        <Info 
          size={16} 
          data-tooltip-id={tooltipId}
          data-tooltip-content={infoText}
          className="text-[#b0ad9a] dark:text-[#555] hover:text-[#c2956e] dark:hover:text-[#b0855f] cursor-help transition-colors outline-none" 
        />
        <Tooltip 
          id={tooltipId} 
          className="z-50 max-w-xs text-center font-medium tracking-wide"
          style={{ backgroundColor: '#3d3b33', color: '#fff', borderRadius: '12px', fontSize: '11px', padding: '8px 12px' }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className={`p-3.5 rounded-2xl transition-transform group-hover:scale-110 ${colorMaps[color]}`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-serif italic text-[#3d3b33] dark:text-[#f0f0f0] mb-1">
          {value}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
            {title}
          </p>
          {subValue && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#c2956e] dark:text-[#b0855f]">
              Best: {subValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}