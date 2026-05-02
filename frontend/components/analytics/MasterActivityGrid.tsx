"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { useUiStore } from "@/store/uiStore";

const ActivityCalendar: any = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.ActivityCalendar),
  { ssr: false }
);

interface Props {
  data: any[];
  title: string;
  themeColors: string[];
  darkThemeColors?: string[];
  unit: string;
}

export default function AnalyticsGrid({ data, title, themeColors, darkThemeColors, unit }: Props) {
  const { theme } = useUiStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, [theme]);
  
  const fullYearData = useMemo(() => {
    const calendarData: Record<string, any> = {};
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      calendarData[dateStr] = { date: dateStr, count: 0, level: 0 };
    }
    if (data && data.length > 0) {
      data.forEach(item => { if (calendarData[item.date]) calendarData[item.date] = item; });
    }
    return Object.values(calendarData).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const getTooltipContent = (activity: any) => {
    if (unit === 'minutes' && activity.count > 0) {
      const h = Math.floor(activity.count / 60);
      const m = activity.count % 60;
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return `${timeStr} focused on ${activity.date}`;
    }
    return `${activity.count} ${unit} on ${activity.date}`;
  };

  const activeColors = isDark ? (darkThemeColors || themeColors) : themeColors;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-10 shadow-sm w-full overflow-hidden transition-colors">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0] font-serif tracking-tight">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
             {activeColors.map(color => (
               <div key={color} className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: color }} />
             ))}
          </div>
        </div>
      </div>
      
      <div className="w-full flex justify-center py-4 overflow-x-auto no-scrollbar">
        <div className="min-w-fit px-2">
          <ActivityCalendar 
            data={fullYearData} 
            colorScheme={isDark ? "dark" : "light"}
            theme={{ light: themeColors, dark: darkThemeColors || themeColors }}
            labels={{ totalCount: `{{count}} ${unit} in the last year` }}
            showWeekdayLabels
            fontSize={10}
            blockSize={10} 
            blockGutter={3}
            blockRadius={2}
            renderBlock={(block: any, activity: any) => 
              React.cloneElement(block, {
                'data-tooltip-id': 'heatmap-tooltip',
                'data-tooltip-content': getTooltipContent(activity),
              })
            }
          />
        </div>
      </div>

      <ReactTooltip 
        id="heatmap-tooltip" 
        style={{ 
          backgroundColor: isDark ? '#2a2a2a' : '#3d3b33', 
          color: '#fff', 
          borderRadius: '12px',
          fontSize: '11px',
          padding: '8px 12px',
          fontWeight: '500',
          zIndex: 100
        }} 
      />
    </div>
  );
}