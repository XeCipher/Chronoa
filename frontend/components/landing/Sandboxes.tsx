"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LandingScenery } from "./LandingNav";
import CenterClock from "@/components/home/CenterClock";
import RecursiveCheckbox from "@/components/ui/RecursiveCheckbox";
import WeekView from "@/components/calendar/WeekView";
import DistractionFreeEditor from "@/components/notes/DistractionFreeEditor";
import ProductivityChart from "@/components/analytics/ProductivityChart";
import TimeOfDayRadar from "@/components/analytics/TimeOfDayRadar";
import FocusDistribution from "@/components/analytics/FocusDistribution";
import { initialMockTasks, generateMockEvents, generateMockDailyMap } from "./MockData";
import { CheckCircle2, ListTodo, CloudSun, MapPin, CloudRain, Snowflake, Moon } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTimerStore } from "@/store/timerStore";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";

export function MockHomeSandbox() {
  const [timeOfDay, setTimeOfDay] = useState<'dawn'|'day'|'dusk'|'night'>('day');
  
  const weatherIcons = {
    dawn: { icon: CloudRain, temp: "18°", text: "Morning Rain", color: "text-blue-500" },
    day: { icon: CloudSun, temp: "24°", text: "Partly Cloudy", color: "text-amber-500" },
    dusk: { icon: Snowflake, temp: "-2°", text: "Snowing", color: "text-blue-200" },
    night: { icon: Moon, temp: "12°", text: "Clear Night", color: "text-indigo-300" }
  };
  const WIcon = weatherIcons[timeOfDay].icon;

  return (
    <div className="relative w-full h-[600px] rounded-[2.5rem] overflow-hidden border border-[#e0ddd5] dark:border-[#333] shadow-2xl flex flex-col items-center justify-center isolate">
      <LandingScenery timeOfDay={timeOfDay} />
      
      <div className="absolute top-8 right-8 flex flex-col items-end gap-3 z-10">
        <div className="flex items-center bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] p-2 pr-5 gap-4 shadow-lg h-[56px]">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white/20 dark:bg-black/40 ${weatherIcons[timeOfDay].color}`}>
            <WIcon size={20} strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold text-[#3d3b33] dark:text-white tabular-nums">{weatherIcons[timeOfDay].temp}</span>
          <div className="border-l border-[#3d3b33]/15 dark:border-white/15 pl-3">
            <span className="text-[11px] font-semibold text-[#3d3b33] dark:text-white block">{weatherIcons[timeOfDay].text}</span>
            <span className="text-[8px] text-[#b0ad9a] dark:text-[#a0a0a0] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5"><MapPin size={8} /> Local</span>
          </div>
        </div>
      </div>

      <CenterClock />

      <div className="absolute bottom-8 flex bg-white/40 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/50 dark:border-white/10 z-10 shadow-xl">
        {(['dawn', 'day', 'dusk', 'night'] as const).map(t => (
          <button key={t} onClick={() => setTimeOfDay(t)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${timeOfDay === t ? 'bg-white dark:bg-[#222] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] hover:text-[#3d3b33] dark:hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MockTaskSandbox() {
  const[tasks, setTasks] = useState(initialMockTasks);

  const routinePct = Math.round((tasks.filter(t => t.task_type === 'routine' && t.is_completed).length / tasks.filter(t => t.task_type === 'routine').length) * 100) || 0;
  const normalLeft = tasks.filter(t => t.task_type === 'normal' && !t.is_completed && t.parent_id).length;

  const onUpdate = (id: string, updates: any) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (updates.is_completed !== undefined) {
           const completedAt = updates.is_completed ? new Date().toISOString() : null;
           return { ...t, ...updates, completed_at: completedAt };
        }
        return { ...t, ...updates };
      }
      return t;
    }));
  };

  // Re-build tree for RecursiveCheckbox
  const map: Record<string, any> = {};
  tasks.forEach(t => map[t.id] = { ...t, children: [] });
  const roots: any[] =[];
  tasks.forEach(t => {
    if (t.parent_id && map[t.parent_id]) map[t.parent_id].children.push(map[t.id]);
    else roots.push(map[t.id]);
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">Frictionless Workflows</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          A deeply intuitive task manager featuring infinite nesting, hotkey navigation, and soothing vanishing animations. Tick off the tasks below to see the progress widget react instantly.
        </p>
        <div className="flex bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-5 shadow-lg w-max gap-4">
          <div className="flex items-center">
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0 bg-white dark:bg-black/40 rounded-full shadow-sm">
              <svg className="absolute inset-0 w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#e0ddd5] dark:stroke-white/10" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#7ca982] transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - routinePct} strokeLinecap="round" />
              </svg>
              <span className="text-[9px] font-bold text-[#3d3b33] dark:text-white">{routinePct}%</span>
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ca982] flex items-center gap-1"><CheckCircle2 size={12}/> Routine</span>
              <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Daily Progress</span>
            </div>
          </div>
          <div className="w-px bg-[#e0ddd5] dark:bg-[#333] self-stretch mx-2" />
          <div className="flex items-center">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full shrink-0 transition-colors ${normalLeft >= 1 ? 'bg-[#c2956e] text-white shadow-md' : 'bg-white dark:bg-black/20 text-[#3d3b33] dark:text-white border border-[#e0ddd5] dark:border-[#333]'}`}>
              <span className="text-[15px] font-semibold">{normalLeft}</span>
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#c2956e] flex items-center gap-1"><ListTodo size={12}/> Tasks</span>
              <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 shadow-xl">
        <DndContext collisionDetection={closestCenter}>
          <SortableContext items={roots.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {roots.map(t => (
              <RecursiveCheckbox
                key={t.id} task={t} isEditMode={true} viewMode="focus" allTasks={tasks}
                onUpdate={onUpdate} onDelete={() => {}} onRestore={() => {}} onAdd={() => {}} onIndent={() => {}} onUnindent={() => {}} onMoveUp={() => {}} onMoveDown={() => {}} newTaskId={null} setNewTaskId={() => {}}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export function MockTimeSandbox() {
  useEffect(() => {
    useTimerStore.setState({
      timers:[{ id: 'mock-1', title: 'Deep Work Block', targetMinutes: 25, accumulatedSeconds: 0, isRunning: false, startTime: null }],
      stopwatches:[{ id: 'mock-2', title: 'Reading Documentation', accumulatedSeconds: 3650, isRunning: false, startTime: null }],
      activeTab: 'timer'
    });
  },[]);

  return (
    <div className="w-full py-10 bg-gradient-to-b from-transparent via-[#c2956e]/5 dark:via-[#b0855f]/10 to-transparent rounded-[3rem] my-10 flex flex-col items-center">
      <div className="text-center max-w-xl mx-auto mb-10 px-4">
        <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Own Your Time</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          Aesthetically pleasing, millisecond-accurate timers and stopwatches that synchronize in real-time across your phone and laptop. Try starting the timer below.
        </p>
      </div>
      <ProductivityWidgets isVisible={true} />
    </div>
  );
}

export function MockCalendarSandbox() {
  const events = generateMockEvents();
  const EVENT_COLORS: Record<string, string> = {
    amber: 'bg-[#c2956e]/20 dark:bg-[#c2956e]/20 text-[#9e7653] dark:text-[#d1a784] border-[#c2956e]/30',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-8 items-center w-full my-20">
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">Your Days, Visualized</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          A gorgeous drag-and-drop calendar built right in. Sync your existing Google & Apple calendars instantly, or subscribe to public <b>.ics</b> links like Formula 1 schedules or national holidays.
        </p>
      </div>
      <div className="w-full lg:w-2/3 h-[500px] relative pointer-events-none md:pointer-events-auto">
        {/* We wrap it in a slightly faded container to imply it's a sandbox preview */}
        <WeekView 
          currentDate={new Date()} events={events} onEventClick={() => {}} onTimeRangeSelected={() => {}} onEventMove={() => {}} 
          eventColors={EVENT_COLORS} targetScrollTime={null} daysCount={3}
        />
      </div>
    </div>
  );
}

export function MockNotesSandbox() {
  const initialHtml = `<h1>A Blank Canvas</h1><p>Chronoa provides a completely distraction-free markdown environment for your thoughts, meeting notes, and daily journaling.</p><p>Go ahead, <strong>type something here</strong>. Use standard markdown shortcuts or highlight text to style it.</p>`;
  
  return (
    <div className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 md:p-12 shadow-2xl my-20 flex flex-col gap-6">
      <DistractionFreeEditor initialContent={initialHtml} onSave={() => {}} noteType="notes" />
    </div>
  );
}

export function MockAnalyticsSandbox() {
  const dailyMap = generateMockDailyMap();
  const rawSessions =[
    { title: 'Deep Work', duration_seconds: 18000 },
    { title: 'Reading', duration_seconds: 7200 },
    { title: 'Emails', duration_seconds: 3600 },
    { title: 'Planning', duration_seconds: 2400 }
  ];

  return (
    <div className="w-full flex flex-col gap-8 my-20">
      <div className="text-center max-w-2xl mx-auto mb-4 px-4">
        <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Insights That Matter</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          Chronoa passively analyzes your activity, helping you discover your peak performance hours, flow states, and focus distribution. 
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityChart dailyMap={dailyMap} />
        </div>
        <div className="lg:col-span-1">
          <TimeOfDayRadar dailyMap={dailyMap} />
        </div>
      </div>
      <div className="w-full mt-2">
        <FocusDistribution rawSessions={rawSessions} />
      </div>
    </div>
  );
}