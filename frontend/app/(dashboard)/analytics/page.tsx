"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AnalyticsGrid from "@/components/analytics/MasterActivityGrid";

export default function AnalyticsPage() {
  const [activityData, setActivityData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/activity-data?user_id=${user.id}`);
          const json = await res.json();
          setActivityData(json.master_activity);
          setTimeData(json.time_tracking);
        } catch (e) {
          console.error("Fetch error:", e);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto p-8 md:p-12 space-y-10 animate-fade-up">
      <header className="mb-4">
        <h1 className="text-6xl text-[#3d3b33] font-serif italic mb-2 leading-none">Progress</h1>
        <p className="text-[#b0ad9a] tracking-[0.3em] text-[10px] font-bold uppercase">Consistency is the bridge between goals and accomplishment</p>
      </header>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400 italic">Compiling your journey...</div>
      ) : (
        <div className="space-y-8">
          {/* Grid 1: Tasks & Journal (GitHub Green) */}
          <AnalyticsGrid 
            title="Master Activity Log" 
            data={activityData} 
            unit="activities"
            themeColors={['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']} 
          />

          {/* Grid 2: Time Tracking (Calm Blue/Teal) */}
          <AnalyticsGrid 
            title="Time Focus Log" 
            data={timeData} 
            unit="minutes"
            themeColors={['#f7f5f0', '#e0f0f0', '#91bebe', '#5b9ea0', '#3a6668']} 
          />
        </div>
      )}
    </div>
  );
}