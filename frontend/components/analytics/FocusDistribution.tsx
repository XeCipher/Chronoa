"use client";

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useUiStore } from "@/store/uiStore";
import { Filter } from 'lucide-react';

const COLORS = ['#7ca982', '#c2956e', '#6e90c2', '#a882c2', '#5b9ea0', '#b895d1', '#d1a784', '#e0b589'];

export default function FocusDistribution({ rawSessions }: { rawSessions: any[] }) {
  const { theme } = useUiStore();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [excludedCategories, setExcludedCategories] = useState<Set<string>>(new Set());

  // Process data: ensure at least 4 distinct items are shown, merge the rest < 10% into "Others"
  const { groupedData, activeData, totalActiveMinutes } = useMemo(() => {
    const map: Record<string, number> = {};
    let totalMinutes = 0;
    
    rawSessions.forEach(s => {
      const cat = s.title || "Deep Work";
      const mins = Math.floor(s.duration_seconds / 60);
      map[cat] = (map[cat] || 0) + mins;
      totalMinutes += mins;
    });

    const sortedRaw = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    
    const threshold = totalMinutes * 0.10;
    const MIN_VISIBLE_ITEMS = 4;
    const finalGroups: { name: string; value: number }[] = [];
    let othersValue = 0;

    sortedRaw.forEach((item, index) => {
      // Keep category separate if it's within the top 4 OR if it meets the 10% threshold
      if (index < MIN_VISIBLE_ITEMS || item.value >= threshold) {
        finalGroups.push(item);
      } else {
        // Otherwise, add its value to "Others"
        othersValue += item.value;
      }
    });

    if (othersValue > 0) {
      finalGroups.push({ name: "Others", value: othersValue });
    }

    // Filter out excluded categories from user clicking the legend
    const active = finalGroups.filter(c => !excludedCategories.has(c.name));
    const activeTotal = active.reduce((acc, curr) => acc + curr.value, 0);

    return { groupedData: finalGroups, activeData: active, totalActiveMinutes: activeTotal };
  }, [rawSessions, excludedCategories]);

  if (!rawSessions || rawSessions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 shadow-sm h-[350px] flex items-center justify-center text-sm text-[#b0ad9a] italic">
        No focus sessions recorded yet.
      </div>
    );
  }

  const toggleCategory = (name: string) => {
    setExcludedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pct = Math.round((payload[0].value / totalActiveMinutes) * 100);
      return (
        <div className="bg-[#3d3b33] border border-white/10 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">{payload[0].name}</span>
          <span className="text-sm font-serif italic text-[#c2956e] ml-2">
            {payload[0].value}m <span className="text-[10px] text-[#b0ad9a] ml-1">({pct}%)</span>
          </span>
        </div>
      );
    }
    return null;
  };

  const topCategoryName = activeData[0]?.name || "N/A";

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-8 shadow-sm h-[350px] flex flex-col md:flex-row items-center transition-colors">
      
      {/* Pie Chart Section */}
      <div className="w-full md:w-1/2 h-48 md:h-full relative shrink-0">
        {activeData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={activeData} innerRadius="65%" outerRadius="90%" paddingAngle={4} dataKey="value" stroke="none" animationDuration={1000}>
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Others' ? '#888888' : COLORS[groupedData.findIndex(c => c.name === entry.name) % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
           <div className="w-full h-full flex items-center justify-center text-xs italic text-[#b0ad9a]">All filters excluded.</div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0ad9a] mb-1">Top Focus</span>
          {/* Using whitespace-normal to prevent truncation with ... */}
          <span className="text-sm md:text-base font-serif italic text-[#3d3b33] dark:text-[#f0f0f0] text-center leading-tight whitespace-normal break-words max-w-[120px]">
            {topCategoryName}
          </span>
        </div>
      </div>
      
      {/* Interactive Legend Section */}
      <div className="w-full md:w-1/2 flex flex-col h-full mt-4 md:mt-0 md:pl-6">
        <div className="flex items-center gap-2 mb-3 text-[#b0ad9a] dark:text-[#7a7a7a] shrink-0">
            <Filter size={14} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Active Filters</span>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
          {groupedData.map((cat, i) => {
            const isExcluded = excludedCategories.has(cat.name);
            const color = cat.name === 'Others' ? '#888888' : COLORS[i % COLORS.length];
            const pct = totalActiveMinutes > 0 && !isExcluded ? Math.round((cat.value / totalActiveMinutes) * 100) : 0;
            return (
              <button 
                key={i} 
                onClick={() => toggleCategory(cat.name)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${isExcluded ? 'opacity-40 hover:bg-[#f0ede8] dark:hover:bg-[#222]' : 'hover:bg-[#f7f5f0] dark:hover:bg-[#2a2a2a]'}`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${isExcluded ? 'bg-transparent border border-current' : ''}`} style={{ backgroundColor: isExcluded ? undefined : color, borderColor: isExcluded ? color : undefined }} />
                  <span className={`text-xs font-medium truncate ${isExcluded ? 'text-[#888]' : 'text-[#3d3b33] dark:text-[#e0e0e0]'}`}>{cat.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  <span className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] font-bold tabular-nums">{cat.value}m</span>
                  {!isExcluded && <span className="text-[9px] font-bold text-[#c2956e] dark:text-[#b0855f] w-7 text-right">{pct}%</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}