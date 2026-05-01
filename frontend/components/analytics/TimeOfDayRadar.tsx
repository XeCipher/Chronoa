// frontend/components/analytics/TimeOfDayRadar.tsx
"use client";

import { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip as RechartsTooltip } from 'recharts';
import { useUiStore } from "@/store/uiStore";
import { DailyRecord } from '@/app/(dashboard)/analytics/page';

export default function TimeOfDayRadar({ dailyMap }: { dailyMap: Record<string, DailyRecord> }) {
  const { theme } = useUiStore();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data, totalProductivity } = useMemo(() => {
    const tod = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    
    Object.values(dailyMap).forEach(d => {
       d.tasks.forEach(t => {
           const h = new Date(t.completed_at).getHours();
           if (h >= 5 && h < 12) tod.Morning++; 
           else if (h >= 12 && h < 17) tod.Afternoon++; 
           else if (h >= 17 && h < 21) tod.Evening++; 
           else tod.Night++;
       });
       d.sessions.forEach(() => {
           tod.Afternoon++; 
       });
    });

    const totalProductivity = Object.values(tod).reduce((a,b) => a+b, 0);
    const max = Math.max(...Object.values(tod), 1);
    
    return {
      data: [
        { subject: 'MORNING', A: tod.Morning, fullMark: max },
        { subject: 'AFTERNOON', A: tod.Afternoon, fullMark: max },
        { subject: 'EVENING', A: tod.Evening, fullMark: max },
        { subject: 'NIGHT', A: tod.Night, fullMark: max },
      ],
      totalProductivity
    };
  }, [dailyMap]);

  if (totalProductivity === 0) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 shadow-sm h-[400px] flex items-center justify-center text-sm text-[#b0ad9a] italic">
        Gathering chronotype data...
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const pct = Math.round((val / totalProductivity) * 100);
      return (
        <div className="bg-[#3d3b33] text-white px-4 py-2 rounded-xl shadow-xl text-center border border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#c2956e]">{payload[0].payload.subject}</p>
          <p className="text-sm font-medium">{pct}% of Output</p>
          <p className="text-[10px] text-[#888] mt-1">{val} Actions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-8 shadow-sm h-[400px] flex flex-col transition-colors">
      <div className="mb-2 text-center">
        <h3 className="text-2xl font-medium text-[#3d3b33] dark:text-[#f0f0f0] italic font-serif">Chronotype</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a] mt-1">Peak Performance Zones</p>
      </div>
      
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "50%" : "65%"} data={data}>
            <PolarGrid stroke={isDark ? '#333' : '#ebe8e2'} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ 
                fill: isDark ? '#a0a0a0' : '#888', 
                fontSize: 10, 
                fontWeight: 'bold' 
              }} 
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={false} />
            <Radar 
              name="Productivity" 
              dataKey="A" 
              stroke={isDark ? '#8aaae0' : '#6e90c2'} 
              strokeWidth={2} 
              fill={isDark ? '#8aaae0' : '#6e90c2'} 
              fillOpacity={0.4} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}