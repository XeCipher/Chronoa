"use client";

import { useState } from "react";
import TaskSection from "@/components/tasks/TaskSection";
import TaskHistory from "@/components/tasks/TaskHistory";
import { ListChecks, History } from "lucide-react";

export default function TasksPage() {
  const [view, setView] = useState<'focus' | 'archive'>('focus');

  return (
    <div className="w-full min-h-screen bg-[#f7f5f0] p-6 md:p-12 lg:p-16">
      <div className="max-w-[1600px] mx-auto w-full">
        
        {/* Header with Toggle */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] text-[#c2956e] tracking-[0.3em] uppercase font-bold mb-2">Sanctuary</p>
            <h1 className="text-5xl md:text-6xl text-[#3d3b33] font-serif italic font-medium leading-none">
              {view === 'focus' ? 'Daily Focus' : 'Archive'}
            </h1>
          </div>

          <div className="flex bg-white/50 border border-[#e0ddd5] p-1 rounded-2xl shadow-sm self-start">
            <button 
              onClick={() => setView('focus')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                view === 'focus' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#b0ad9a] hover:text-[#3d3b33]'
              }`}
            >
              <ListChecks size={14} /> Focus
            </button>
            <button 
              onClick={() => setView('archive')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                view === 'archive' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#b0ad9a] hover:text-[#3d3b33]'
              }`}
            >
              <History size={14} /> Archive
            </button>
          </div>
        </header>

        {view === 'focus' ? (
          /* ACTIVE TASKS VIEW */
          <div className="flex flex-col md:flex-row items-start gap-8 lg:gap-12 w-full animate-fade-up">
            <div className="w-full md:w-1/2 min-w-0">
              <TaskSection type="routine" title="My Routine" />
            </div>
            <div className="w-full md:w-1/2 min-w-0">
              <TaskSection type="normal" title="Tasks & Ideas" />
            </div>
          </div>
        ) : (
          /* HISTORY VIEW */
          <div className="max-w-4xl animate-fade-up">
            <TaskHistory />
          </div>
        )}
      </div>
    </div>
  );
}