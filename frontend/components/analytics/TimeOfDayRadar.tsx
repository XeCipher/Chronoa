// frontend/components/analytics/TimeOfDayRadar.tsx
"use client";

import { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip as RechartsTooltip } from 'recharts';
import { useUiStore } from "@/store/uiStore";
import { DailyRecord } from '@/app/(dashboard)/analytics/page';

export default function TimeOfDayRadar({ dailyMap, isSandbox = false }: { dailyMap: Record<string, DailyRecord>, isSandbox?: boolean }) {
  const { theme } = useUiStore();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  },[]);

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
       
       d.sessions.forEach((s: any) => {
           const h = s.created_at ? new Date(s.created_at).getHours() : 14;
           if (h >= 5 && h < 12) tod.Morning++; 
           else if (h >= 12 && h < 17) tod.Afternoon++; 
           else if (h >= 17 && h < 21) tod.Evening++; 
           else tod.Night++;
       });
    });

    const totalProductivity = Object.values(tod).reduce((a,b) => a+b, 0);
    const max = Math.max(...Object.values(tod), 1);
    
    return {
      data:[
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
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-8 shadow-sm h-[320px] md:h-[400px] flex flex-col transition-colors relative overflow-hidden">
        <div className="mb-2 text-center opacity-40">
          <h3 className="text-2xl font-medium text-[#3d3b33] dark:text-[#f0f0f0] font-serif tracking-tight">Chronotype</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a] mt-1">Peak Performance Zones</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10 backdrop-blur-[2px]">
           <div className="bg-white/90 dark:bg-black/80 px-6 py-3 rounded-2xl border border-[#e0ddd5] dark:border-[#333] shadow-sm text-center">
              <p className="text-sm text-[#b0ad9a] dark:text-[#7a7a7a] font-medium tracking-wide">Track activity to see rhythm</p>
           </div>
        </div>
        <div className="flex-1 w-full min-h-0 relative opacity-40 pointer-events-none grayscale">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart margin={{ top: 10, right: 35, bottom: 10, left: 35 }} cx="50%" cy="50%" outerRadius={isMobile ? "50%" : "60%"} data={[
                { subject: 'MORNING', A: 60, fullMark: 100 },
                { subject: 'AFTERNOON', A: 90, fullMark: 100 },
                { subject: 'EVENING', A: 50, fullMark: 100 },
                { subject: 'NIGHT', A: 30, fullMark: 100 },
            ]}>
              <PolarGrid stroke={isDark ? '#333' : '#ebe8e2'} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#a0a0a0' : '#888', fontSize: 10, fontWeight: 'bold' }} />
              <Radar name="Productivity" dataKey="A" stroke={isDark ? '#8aaae0' : '#6e90c2'} strokeWidth={2} fill={isDark ? '#8aaae0' : '#6e90c2'} fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const pct = Math.round((val / totalProductivity) * 100);
      return (
        <div className="bg-[#3d3b33] text-white px-4 py-2 rounded-xl shadow-xl text-center border border-white/10 z-[100] relative">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#c2956e]">{payload[0].payload.subject}</p>
          <p className="text-sm font-medium">{pct}% of Output</p>
          <p className="text-[10px] text-[#888] mt-1">{val} Actions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-8 shadow-sm h-[320px] md:h-[400px] flex flex-col transition-colors">
      <div className="mb-2 text-center">
        <h3 className="text-2xl font-medium text-[#3d3b33] dark:text-[#f0f0f0] font-serif tracking-tight">Chronotype</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a] mt-1">Peak Performance Zones</p>
      </div>
      
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart margin={{ top: 10, right: 35, bottom: 10, left: 35 }} cx="50%" cy="50%" outerRadius={isMobile ? "50%" : "60%"} data={data}>
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