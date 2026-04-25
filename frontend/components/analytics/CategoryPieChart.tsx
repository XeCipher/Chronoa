"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#7ca982', '#c2956e', '#6e90c2', '#a882c2', '#5b9ea0', '#b0ad9a'];

export default function CategoryPieChart({ data }: { data: any[] }) {
  const [isMounted, setIsMounted] = useState(false);

  // LOGIC: Wait for client-side mount to prevent width/height -1 errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalMinutes = data?.reduce((sum, item) => sum + item.value, 0) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-[#e0ddd5] rounded-[2rem] p-10 shadow-sm h-[400px] flex flex-col items-center justify-center text-gray-400 italic">
        No time tracked yet. Start a timer to see distribution.
      </div>
    );
  }

  // Show a placeholder while mounting to avoid the Recharts error
  if (!isMounted) return <div className="h-[400px] bg-white border border-[#e0ddd5] rounded-[2rem] animate-pulse" />;

  return (
    <div className="bg-white border border-[#e0ddd5] rounded-[2rem] p-8 shadow-sm h-[400px] flex flex-col overflow-hidden">
      <h3 className="text-xl font-medium text-[#3d3b33] mb-2 italic" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
        Focus Distribution
      </h3>
      
      <div className="flex-1 w-full relative min-h-0"> {/* min-h-0 is key for flex children */}
        
        {/* Total Time Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
          <span className="text-[10px] text-[#b0ad9a] font-bold uppercase tracking-widest">Total</span>
          <span className="text-2xl font-serif italic text-[#3d3b33] leading-none">
            {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
          </span>
        </div>

        {/* 
           FIX: We set a specific height for the container wrapper 
           to ensure ResponsiveContainer has a definite value to read.
        */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={70}
                outerRadius={95}
                paddingAngle={8}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px' 
                }}
                // Use 'any' or 'string | number' to satisfy the library's internal types
                formatter={(value: any) => [`${value}m`, 'Focus Time']}
                />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                iconType="circle" 
                wrapperStyle={{ 
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    paddingTop: '20px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}