"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const ActivityCalendar: any = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.ActivityCalendar),
  { ssr: false }
);

interface Props {
  data: any[];
  title: string;
  themeColors: string[];
  unit: string;
}

export default function AnalyticsGrid({ data, title, themeColors, unit }: Props) {
  
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
      data.forEach(item => {
        if (calendarData[item.date]) {
          calendarData[item.date] = item;
        }
      });
    }

    return Object.values(calendarData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data]);

  // Helper to format the tooltip text
  const getTooltipContent = (activity: any) => {
    if (unit === 'minutes' && activity.count > 0) {
      const h = Math.floor(activity.count / 60);
      const m = activity.count % 60;
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return `${timeStr} focused on ${activity.date}`;
    }
    return `${activity.count} ${unit} on ${activity.date}`;
  };

  return (
    <div className="bg-white border border-[#e0ddd5] rounded-[2rem] p-6 md:p-10 shadow-sm w-full overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-medium text-[#3d3b33] italic" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
             {themeColors.map(color => (
               <div key={color} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
             ))}
          </div>
        </div>
      </div>
      
      <div className="w-full flex justify-center scale-[0.9] lg:scale-100 origin-center">
        <ActivityCalendar 
          data={fullYearData} 
          colorScheme="light"
          theme={{ light: themeColors }}
          labels={{ totalCount: `{{count}} ${unit} in the last year` }}
          showWeekdayLabels
          fontSize={10}
          blockSize={11}
          blockGutter={3}
          blockRadius={2}
          // THIS ATTACHES THE TOOLTIP DATA TO EACH SQUARE
          renderBlock={(block: any, activity: any) => 
            React.cloneElement(block, {
              'data-tooltip-id': 'heatmap-tooltip',
              'data-tooltip-content': getTooltipContent(activity),
            })
          }
        />
      </div>

      {/* THE TOOLTIP ENGINE */}
      <ReactTooltip 
        id="heatmap-tooltip" 
        style={{ 
          backgroundColor: '#3d3b33', 
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