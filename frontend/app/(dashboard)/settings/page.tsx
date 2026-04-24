"use client";

import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase"; // THE MISSING IMPORT

export default function SettingsPage() {
  const { taskArchiveDelay, setTaskArchiveDelay, routineResetHour, setRoutineResetHour } = useUiStore();

  const handleResetHourChange = async (hour: number) => {
    // 1. Update local Zustand state for instant UI feel
    setRoutineResetHour(hour);

    // 2. Persist to Supabase for the Python backend to read
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ routine_reset_hour: hour })
        .eq('id', user.id);
      
      if (error) console.error("Error saving reset hour:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-10 space-y-12 animate-fade-up">
      <header>
        <h1 className="text-5xl text-[#3d3b33] mb-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>Settings</h1>
        <p className="text-[#888] tracking-widest text-xs uppercase font-semibold">Sanctuary Mode</p>
      </header>

      <div className="bg-white border border-[#e0ddd5] rounded-[2rem] p-10 shadow-sm space-y-10">
        {/* Vanishing Delay Setting */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-[#3d3b33]">Vanishing Delay</h3>
            <p className="text-sm text-gray-400">Minutes before a completed task moves to history.</p>
          </div>
          <input 
            type="number" 
            value={taskArchiveDelay}
            onChange={(e) => setTaskArchiveDelay(parseInt(e.target.value))}
            className="w-24 bg-[#f7f5f0] border border-[#e0ddd5] rounded-xl px-4 py-2 outline-none focus:border-[#c2956e] transition-colors"
          />
        </section>

        {/* Routine Reset Setting */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-[#3d3b33]">Routine Reset Time</h3>
            <p className="text-sm text-gray-400">Hour of the day (0-23) when routine tasks refresh.</p>
          </div>
          <div className="flex items-center gap-2">
             <input 
              type="number" 
              min="0" 
              max="23" 
              value={routineResetHour}
              onChange={(e) => handleResetHourChange(parseInt(e.target.value))}
              className="w-24 bg-[#f7f5f0] border border-[#e0ddd5] rounded-xl px-4 py-2 outline-none focus:border-[#c2956e] transition-colors"
            />
            <span className="text-sm text-[#888] font-bold uppercase tracking-widest">
              {routineResetHour >= 12 ? 'PM' : 'AM'}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}