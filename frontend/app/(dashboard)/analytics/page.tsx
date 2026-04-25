"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AnalyticsGrid from "@/components/analytics/MasterActivityGrid";
import StreakCounter from "@/components/analytics/StreakCounter";
import CategoryPieChart from "@/components/analytics/CategoryPieChart";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/activity-data?user_id=${user.id}`);
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-12 italic text-gray-400">Loading your sanctuary stats...</div>;

  return (
    <div className="max-w-[1400px] mx-auto p-8 md:p-12 space-y-8 animate-fade-up">
      <header className="mb-4">
        <h1 className="text-6xl text-[#3d3b33] font-serif italic mb-2">Analytics</h1>
        <p className="text-[#b0ad9a] tracking-[0.3em] text-[10px] font-bold uppercase">Consistency is the bridge to mastery</p>
      </header>

      {/* Top Row: Streaks & Pies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="flex-1">
             <StreakCounter streak={data?.streak || 0} />
          </div>
          {/* Subtle motivation text below streak */}
          <div className="mt-4 p-6 bg-[#f7f5f0]/50 rounded-[1.5rem] border border-[#e0ddd5] flex-1 flex items-center justify-center italic text-[#b0ad9a] text-sm text-center">
            "Every day is a new opportunity to improve yourself."
          </div>
        </div>
        <div className="lg:col-span-2">
          <CategoryPieChart data={data?.categories || []} />
        </div>
      </div>

      {/* Bottom Row: Heatmaps */}
      <div className="space-y-8">
        <AnalyticsGrid 
          title="Master Activity Log" 
          data={data?.master_activity || []} 
          unit="activities"
          themeColors={['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']} 
        />
        <AnalyticsGrid 
          title="Time Focus Log" 
          data={data?.time_tracking || []} 
          unit="minutes"
          themeColors={['#f7f5f0', '#e0f0f0', '#91bebe', '#5b9ea0', '#3a6668']} 
        />
      </div>
    </div>
  );
}