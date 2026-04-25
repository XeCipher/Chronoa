"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#7ca982', '#c2956e', '#6e90c2', '#a882c2', '#5b9ea0', '#3d3b33', '#d4d0c8'];

export default function CategoryPieChart({ data }: { data: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);

  useEffect(() => setIsMounted(true), []);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-[#e0ddd5] rounded-[2rem] p-10 shadow-sm h-[450px] flex flex-col items-center justify-center text-gray-400 italic">
        No time tracked yet.
      </div>
    );
  }

  // Filter data based on user toggles
  const activeData = data.filter(d => !disabledCategories.includes(d.name));
  const totalMinutes = activeData.reduce((sum, item) => sum + item.value, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const toggleCategory = (name: string) => {
    setDisabledCategories(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  if (!isMounted) return <div className="h-[450px] bg-white border border-[#e0ddd5] rounded-[2rem] animate-pulse" />;

  return (
    <div className="bg-white border border-[#e0ddd5] rounded-[2.5rem] p-8 md:p-10 shadow-sm h-[450px] flex flex-col overflow-hidden">
      <h3 className="text-2xl font-medium text-[#3d3b33] mb-4 italic" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
        Focus Distribution
      </h3>
      
      <div className="flex-1 w-full relative min-h-0 flex flex-col">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-16">
          <span className="text-[10px] text-[#b0ad9a] font-bold uppercase tracking-widest">Total</span>
          <span className="text-3xl font-serif italic text-[#3d3b33] leading-none mt-1">
            {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
          </span>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeData}
                innerRadius={75}
                outerRadius={105}
                paddingAngle={6}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                stroke="none"
              >
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                formatter={(value: any) => [`${value}m`, 'Focus Time']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Interactive Legend */}
        <div className="mt-auto pt-4 flex flex-wrap justify-center gap-2">
          {data.map((cat, i) => {
            const isDisabled = disabledCategories.includes(cat.name);
            return (
              <button
                key={cat.name}
                onClick={() => toggleCategory(cat.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-200
                  ${isDisabled ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-white border-[#e0ddd5] text-[#3d3b33] hover:border-[#c2956e]'}`}
              >
                <div className={`w-2 h-2 rounded-full ${isDisabled ? 'bg-gray-300' : ''}`} style={{ backgroundColor: isDisabled ? undefined : COLORS[i % COLORS.length] }} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}