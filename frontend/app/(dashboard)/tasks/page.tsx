"use client";

import { useState } from "react";
import TaskSection from "@/components/tasks/TaskSection";
import TaskHistory from "@/components/tasks/TaskHistory";
import ICloudTodayFeed from "@/components/tasks/ICloudTodayFeed";
import { ListChecks, History } from "lucide-react";

export default function TasksPage() {
  const [view, setView] = useState<'focus' | 'archive'>('focus');

  return (
    <div className="w-full min-h-screen bg-[#f7f5f0] dark:bg-[#121212] p-4 md:p-12 lg:p-16">
      <div className="max-w-[1600px] mx-auto w-full">
        
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] text-[#c2956e] dark:text-[#d1a784] tracking-[0.3em] uppercase font-bold mb-2">Sanctuary</p>
            <h1 className="text-5xl md:text-6xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif italic font-medium leading-none">
              {view === 'focus' ? 'Daily Focus' : 'Archive'}
            </h1>
          </div>

          <div className="flex bg-white/50 dark:bg-[#1e1e1e]/50 border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl shadow-sm self-start">
            <button 
              onClick={() => setView('focus')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                view === 'focus' ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'text-[#b0ad9a] dark:text-[#7a7a7a] hover:text-[#3d3b33] dark:hover:text-white'
              }`}
            >
              <ListChecks size={14} /> Focus
            </button>
            <button 
              onClick={() => setView('archive')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                view === 'archive' ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'text-[#b0ad9a] dark:text-[#7a7a7a] hover:text-[#3d3b33] dark:hover:text-white'
              }`}
            >
              <History size={14} /> Archive
            </button>
          </div>
        </header>

        {view === 'focus' ? (
          <div className="space-y-10 animate-fade-up">
            <ICloudTodayFeed />
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 w-full">
              <div className="w-full lg:w-1/2 min-w-0">
                <TaskSection type="routine" title="My Routine" />
              </div>
              <div className="w-full lg:w-1/2 min-w-0">
                <TaskSection type="normal" title="Tasks & Ideas" />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl animate-fade-up">
            <TaskHistory />
          </div>
        )}
      </div>
    </div>
  );
}