// frontend/app/(dashboard)/home/page.tsx
"use client";

import { useState, useEffect } from "react";
import CenterClock from "@/components/home/CenterClock";
import SceneryBackground from "@/components/home/SceneryBackground";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";
import WeatherWidget from "@/components/home/WeatherWidget";
import HomeTaskProgress from "@/components/home/HomeTaskProgress";
import TodayCalendarWidget from "@/components/calendar/TodayCalendarWidget";
import { AiButton } from "@/components/ai/AiChatWidget";
import { useTimerStore } from "@/store/timerStore";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  const [userAvatar, setUserAvatar] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('chronoa_avatar');
    return null;
  });

  const [timeSessionsCount, setTimeSessionsCount] = useState<number | null>(null);
  
  const isPinned = useTimerStore((state: any) => state.isPinned);
  const forceShow = useTimerStore((state: any) => state.forceShowWidgets);
  const setForceShow = useTimerStore((state: any) => state.setForceShowWidgets);
  
  const timers = useTimerStore((state: any) => state.timers);
  const stopwatches = useTimerStore((state: any) => state.stopwatches);
  const isAnyRunning = timers?.some((t: any) => t.isRunning) || stopwatches?.some((s: any) => s.isRunning);
  
  const showWidget = isHovered || isPinned || isTouched || forceShow;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
      if (avatarUrl) {
        setUserAvatar(avatarUrl);
        localStorage.setItem('chronoa_avatar', avatarUrl);
      }
      if (user) {
        supabase.from('time_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .then(({ count }) => {
            setTimeSessionsCount(count);
          });
      }
    });
  },[]);

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center touch-none overscroll-none">
      <SceneryBackground />
      
      {/* Mobile Top Profile Avatar */}
      <div className="fixed top-[calc(1.5rem+env(safe-area-inset-top))] left-[calc(1.5rem+env(safe-area-inset-left))] md:hidden z-40">
        <button 
          onClick={() => router.push('/settings')} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 dark:bg-black/40 backdrop-blur-md shadow-sm border border-white/40 dark:border-white/10 text-[#3d3b33] dark:text-white transition-all active:scale-95 p-0"
        >
          {userAvatar ? (
            <img src={userAvatar} referrerPolicy="no-referrer" alt="Profile" className="w-full h-full object-cover rounded-full border-[1.5px] border-white/80 dark:border-[#444]" />
          ) : (
            <User size={18} strokeWidth={2.5} className="text-[#555] dark:text-[#b0ad9a]" />
          )}
        </button>
      </div>
      
      {/* Mobile AI Button directly below the Profile avatar */}
      <div className="fixed top-[calc(1.5rem+env(safe-area-inset-top)+3.5rem)] left-[calc(1.5rem+env(safe-area-inset-left))] z-40 md:hidden pointer-events-none [&>*]:pointer-events-auto">
        <AiButton variant="mobile" />
      </div>

      <div className="fixed top-[calc(1.5rem+env(safe-area-inset-top))] right-[calc(1.5rem+env(safe-area-inset-right))] md:top-10 md:right-12 z-40 md:z-20 flex flex-col items-end gap-3 pointer-events-none [&>*]:pointer-events-auto">
        <WeatherWidget />
        <HomeTaskProgress />
      </div>

      <div className={`fixed z-20 flex flex-col items-end gap-4 md:bottom-10 md:right-10 bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 pointer-events-none [&>*]:pointer-events-auto transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showWidget ? 'opacity-0 translate-x-24 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        <div className="hidden md:flex flex-col items-end gap-4">
          <AiButton variant="desktop" />
          <TodayCalendarWidget variant="home" />
        </div>
      </div>

      <div 
        className={`relative z-10 transition-all duration-[800ms] md:duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity,filter] ${showWidget ? '-translate-y-[16vh] scale-90 opacity-80' : 'max-md:-translate-y-[8vh] md:-translate-y-[4vh] scale-100 opacity-100'}`}
      >
        <CenterClock />
      </div>

      <div 
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 pointer-events-none transition-all duration-700 z-20" 
        style={{ opacity: showWidget ? 0 : 0.5, transform: showWidget ? 'translateY(10px)' : 'translateY(0)' }}
      >
        {timeSessionsCount !== null && timeSessionsCount < 1 && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#888] dark:text-[#a0a0a0] mb-1 animate-pulse">Hover here for timers</span>
        )}
        <div className={`transition-colors duration-500 rounded-full animate-pulse ${isAnyRunning ? 'w-16 h-1.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'w-8 h-[2px] bg-[#888]/80 dark:bg-[#a0a0a0]/80'}`} />
      </div>

      <div 
        className="absolute bottom-0 left-0 w-full h-[15vh] md:h-[25vh] z-30 pointer-events-none"
        onMouseEnter={() => {
          if (window.matchMedia('(hover: hover)').matches) {
            setIsHovered(true);
            if (forceShow) setForceShow(false);
          }
        }}
        onMouseLeave={() => {
          if (window.matchMedia('(hover: hover)').matches) {
            setIsHovered(false);
          }
        }}
      >
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full md:w-[600px] h-full pointer-events-auto cursor-pointer md:cursor-default"
          onClick={() => {
            if (window.matchMedia('(hover: none)').matches || ('ontouchstart' in window)) {
              setIsTouched(true);
              if (forceShow) setForceShow(false);
            }
          }}
        >
          <div
            className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center p-4 z-40 transition-opacity pointer-events-none"
            style={{ opacity: showWidget ? 0 : 1 }}
          >
            {timeSessionsCount !== null && timeSessionsCount < 1 && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#888] dark:text-[#a0a0a0] mb-3 animate-pulse text-center">Tap here for timers</span>
            )}
            <div className={`transition-colors duration-500 rounded-full ${isAnyRunning ? 'w-16 h-1.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse' : 'w-12 h-1.5 bg-[#3d3b33]/20 dark:bg-[#e0e0e0]/20'}`} />
          </div>
        </div>

        {(isTouched || forceShow) && !isPinned && (
          <button
            className="fixed inset-0 z-0 cursor-default outline-none pointer-events-auto"
            onClick={(e) => { e.stopPropagation(); setIsTouched(false); if (forceShow) setForceShow(false); }}
            tabIndex={-1}
          />
        )}

        <div className={`absolute bottom-6 md:bottom-10 left-0 w-full flex justify-center z-10 ${showWidget ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <ProductivityWidgets isVisible={showWidget} />
        </div>

      </div>
    </div>
  );
}