"use client";

import TaskSection from "@/components/tasks/TaskSection";

export default function TasksPage() {
  return (
    <div className="w-full min-h-screen bg-[#f7f5f0] p-6 md:p-12 lg:p-16">
      <div className="max-w-[1600px] mx-auto w-full">
        
        {/* Header */}
        <header className="mb-12">
          <p className="text-[10px] text-[#c2956e] tracking-[0.3em] uppercase font-bold mb-2">Sanctuary</p>
          <h1 className="text-5xl md:text-6xl text-[#3d3b33] font-serif italic font-medium leading-none">
            Daily Focus
          </h1>
        </header>

        {/* 
            FORCED SIDE-BY-SIDE 
            flex-col: stack on mobile
            md:flex-row: side-by-side on tablet/laptop
            gap-8: space between
        */}
        <div className="flex flex-col md:flex-row items-start gap-8 lg:gap-12 w-full">
          
          <div className="w-full md:w-1/2 min-w-0">
            <TaskSection type="routine" title="My Routine" />
          </div>

          <div className="w-full md:w-1/2 min-w-0">
            <TaskSection type="normal" title="Tasks & Ideas" />
          </div>

        </div>
      </div>
    </div>
  );
}