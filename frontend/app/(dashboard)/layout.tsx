// frontend/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SidebarNav from "@/components/ui/SidebarNav";
import { useUiStore } from "@/store/uiStore";
import { useTimerStore } from "@/store/timerStore";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import GlobalTimeWidget from "@/components/ui/GlobalTimeWidget";
import { Tooltip } from "react-tooltip";

const generateSyncId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const[userId, setUserId] = useState<string | null>(null);

  const { 
    theme, 
    lastVisitedPage, 
    setLastVisitedPage, 
    setNotesTab, 
    isSidebarPinned, 
    toggleSidebarPin,
    hotkeysEnabled,
    disabledHotkeys
  } = useUiStore();
  
  const toggleFirstActive = useTimerStore((state) => state.toggleFirstActive);
  
  const initialRestoreDone = useRef(false);
  const isRedirecting = useRef(false);

  const localSyncId = useRef<string>("");
  const isApplyingRemote = useRef(false);
  const lastLocalStateStr = useRef<string>("");
  const previousStateForDiff = useRef<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Only redirect if we aren't already on the landing page to prevent reload loops
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    });
    return () => subscription.unsubscribe();
  },[]);

  useEffect(() => {
    let channel: any;

    const checkAuthAndSubscribe = async () => {
      // Use getUser() to ping the server and verify the account actually exists
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!user || error) {
        // If user is deleted but local session persists, clear it forcefully
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           await supabase.auth.signOut();
        }
        
        if (pathname !== "/") {
          window.location.href = "/";
        } else {
          setIsLoading(false);
        }
        return;
      }
      
      const currentUserId = user.id;
      setUserId(currentUserId);
      setIsLoading(false);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUserId).single();
      if (profile) {
        // Automatically sync system timezone for proper serverless cron execution
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if ((profile as any).timezone !== userTimezone) {
          await supabase.from('profiles').update({ timezone: userTimezone }).eq('id', currentUserId);
        }

        const state = useUiStore.getState();
        if (profile.theme) state.setTheme(profile.theme);
        if (profile.task_archive_delay !== null) state.setTaskArchiveDelay(profile.task_archive_delay);
        if (profile.routine_reset_hour !== null) state.setRoutineResetHour(profile.routine_reset_hour);
        if (profile.journal_zoom !== null) state.setJournalZoom(profile.journal_zoom);
        if (profile.hotkeys_enabled !== null) state.setHotkeysEnabled(profile.hotkeys_enabled);
        if (profile.disabled_hotkeys) state.setDisabledHotkeys(profile.disabled_hotkeys);
        if (profile.move_completed_to_bottom !== null) state.setMoveCompletedToBottom(profile.move_completed_to_bottom);
        if (profile.keep_parent_task_alive !== null) state.setKeepParentTaskAlive(profile.keep_parent_task_alive);
        if (profile.add_task_at_top !== null) state.setAddTaskAtTop(profile.add_task_at_top);
        if (profile.show_home_task_progress !== null) state.setShowHomeTaskProgress(profile.show_home_task_progress);
        
        if (profile.timer_state) {
          localSyncId.current = profile.timer_state.sync_id || generateSyncId();
          
          const newState = {
            timers: profile.timer_state.timers ||[],
            stopwatches: profile.timer_state.stopwatches ||[],
            activeTab: profile.timer_state.activeTab || 'stopwatch'
          };
          
          previousStateForDiff.current = newState;
          lastLocalStateStr.current = JSON.stringify(newState);
          useTimerStore.setState(newState);
        }
      }

      channel = supabase.channel(`profile_${currentUserId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUserId}` }, (payload) => {
           const rec = payload.new;
           const state = useUiStore.getState();
           
           if (rec.theme && rec.theme !== state.theme) state.setTheme(rec.theme);
           if (rec.task_archive_delay !== null && rec.task_archive_delay !== state.taskArchiveDelay) state.setTaskArchiveDelay(rec.task_archive_delay);
           if (rec.routine_reset_hour !== null && rec.routine_reset_hour !== state.routineResetHour) state.setRoutineResetHour(rec.routine_reset_hour);
           if (rec.journal_zoom !== null && rec.journal_zoom !== state.journalZoom) state.setJournalZoom(rec.journal_zoom);
           if (rec.hotkeys_enabled !== null && rec.hotkeys_enabled !== state.hotkeysEnabled) state.setHotkeysEnabled(rec.hotkeys_enabled);
           if (rec.disabled_hotkeys && JSON.stringify(rec.disabled_hotkeys) !== JSON.stringify(state.disabledHotkeys)) state.setDisabledHotkeys(rec.disabled_hotkeys);
           if (rec.move_completed_to_bottom !== null && rec.move_completed_to_bottom !== state.moveCompletedToBottom) state.setMoveCompletedToBottom(rec.move_completed_to_bottom);
           if (rec.keep_parent_task_alive !== null && rec.keep_parent_task_alive !== state.keepParentTaskAlive) state.setKeepParentTaskAlive(rec.keep_parent_task_alive);
           if (rec.add_task_at_top !== null && rec.add_task_at_top !== state.addTaskAtTop) state.setAddTaskAtTop(rec.add_task_at_top);
           if (rec.show_home_task_progress !== null && rec.show_home_task_progress !== state.showHomeTaskProgress) state.setShowHomeTaskProgress(rec.show_home_task_progress);
           
           if (rec.timer_state) {
              const remoteSyncId = rec.timer_state.sync_id;
              
              if (remoteSyncId && remoteSyncId !== localSyncId.current) {
                 localSyncId.current = remoteSyncId;
                 isApplyingRemote.current = true;
                 
                 const parsedState = {
                    timers: rec.timer_state.timers ||[],
                    stopwatches: rec.timer_state.stopwatches ||[],
                    activeTab: rec.timer_state.activeTab || 'stopwatch'
                 };
                 
                 useTimerStore.setState(parsedState);

                 previousStateForDiff.current = parsedState;
                 lastLocalStateStr.current = JSON.stringify(parsedState);
                 
                 setTimeout(() => { isApplyingRemote.current = false; }, 100);
              }
           }
        })
        .subscribe();
    };

    checkAuthAndSubscribe();
    
    return () => { 
      if (channel) {
        supabase.removeChannel(channel); 
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(() => {
    if (isLoading || !userId) return;
    let timeoutId: NodeJS.Timeout;

    if (!previousStateForDiff.current) {
      previousStateForDiff.current = {
        timers: useTimerStore.getState().timers,
        stopwatches: useTimerStore.getState().stopwatches,
        activeTab: useTimerStore.getState().activeTab
      };
    }

    const unsub = useTimerStore.subscribe((state) => {
      if (isApplyingRemote.current) return;

      const currentState = {
        timers: state.timers,
        stopwatches: state.stopwatches,
        activeTab: state.activeTab
      };
      
      const currentStr = JSON.stringify(currentState);

      if (currentStr !== lastLocalStateStr.current) {
        lastLocalStateStr.current = currentStr;

        let isCritical = false;
        const prev = previousStateForDiff.current || currentState;

        if (
          prev.activeTab !== currentState.activeTab || 
          prev.timers.length !== currentState.timers.length || 
          prev.stopwatches.length !== currentState.stopwatches.length
        ) {
          isCritical = true;
        } else {
          for (let i = 0; i < currentState.timers.length; i++) {
            if (currentState.timers[i]?.isRunning !== prev.timers[i]?.isRunning || 
                currentState.timers[i]?.accumulatedSeconds !== prev.timers[i]?.accumulatedSeconds) {
              isCritical = true;
              break;
            }
          }
          if (!isCritical) {
            for (let i = 0; i < currentState.stopwatches.length; i++) {
              if (currentState.stopwatches[i]?.isRunning !== prev.stopwatches[i]?.isRunning || 
                  currentState.stopwatches[i]?.accumulatedSeconds !== prev.stopwatches[i]?.accumulatedSeconds) {
                isCritical = true;
                break;
              }
            }
          }
        }

        previousStateForDiff.current = JSON.parse(currentStr);

        const newSyncId = generateSyncId();
        localSyncId.current = newSyncId;
        const payload = { ...currentState, sync_id: newSyncId };

        const executeSave = async () => {
          const { error } = await supabase.from('profiles').update({ timer_state: payload }).eq('id', userId);
          if (error) console.error("Sync Error:", error);
        };

        clearTimeout(timeoutId);
        if (isCritical) {
          executeSave(); 
        } else {
          timeoutId = setTimeout(executeSave, 1000); 
        }
      }
    });

    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  }, [isLoading, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isTyping =['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
      if (isAlt) {
        const key = e.key.toLowerCase();
        if (key === 'h' && !disabledHotkeys?.includes('home')) { e.preventDefault(); router.push('/home'); }
        if (key === 't' && !disabledHotkeys?.includes('tasks')) { e.preventDefault(); router.push('/tasks'); }
        if (key === 'n' && !disabledHotkeys?.includes('notes')) { e.preventDefault(); setNotesTab('notes'); router.push('/notes'); }
        if (key === 'j' && !disabledHotkeys?.includes('journal')) { e.preventDefault(); setNotesTab('journal'); router.push('/notes'); }
        if (key === 'c' && !disabledHotkeys?.includes('calendar')) { e.preventDefault(); router.push('/calendar'); }
        if (key === 'a' && !disabledHotkeys?.includes('analytics')) { e.preventDefault(); router.push('/analytics'); }
        if (key === 'p' && !disabledHotkeys?.includes('settings')) { e.preventDefault(); router.push('/settings'); }
      }
      if (e.code === 'Space' && pathname === '/home' && !isTyping && !disabledHotkeys?.includes('space')) { e.preventDefault(); toggleFirstActive(); }
      if (e.key === 'Escape' && isSidebarPinned && !disabledHotkeys?.includes('escape')) toggleSidebarPin();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  },[pathname, router, setNotesTab, isSidebarPinned, toggleSidebarPin, toggleFirstActive, hotkeysEnabled, disabledHotkeys]);

  useEffect(() => {
    if (!isLoading) {
      if (!initialRestoreDone.current) {
        initialRestoreDone.current = true;
        const isEntryPage = pathname === '/' || pathname === '/home';
        if (isEntryPage && lastVisitedPage && lastVisitedPage !== '/' && lastVisitedPage !== '/home') {
           isRedirecting.current = true;
           router.replace(lastVisitedPage);
           return;
        }
      }
      
      if (isRedirecting.current && (pathname === '/' || pathname === '/home')) {
         // Wait for the redirect to settle
         return; 
      } else {
         isRedirecting.current = false;
         setLastVisitedPage(pathname);
      }
    }
  },[pathname, isLoading, lastVisitedPage, router, setLastVisitedPage]);

  useEffect(() => {
    const isCurrentlyDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isCurrentlyDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  
  const isHomePage = pathname === '/home';
  const isLandingPage = pathname === '/';

  if (isLoading) return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;

  if (isLandingPage) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#f7f5f0] dark:bg-[#121212]">
        <main id="landing-scroll-container" className="flex-1 h-full overflow-y-auto no-scrollbar relative min-w-0 scroll-smooth">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isHomePage ? 'bg-transparent' : 'bg-[#f7f5f0] dark:bg-[#121212]'}`}>
      <SidebarNav />
      <main id="main-scroll-container" className="flex-1 h-full overflow-hidden relative min-w-0 pb-[calc(82px+env(safe-area-inset-bottom))] md:pb-0 pt-[max(1rem,env(safe-area-inset-top))] md:pt-0 scroll-smooth">
        {children}
      </main>

      <Tooltip 
        id="global-tooltip" 
        className="max-md:!hidden z-[600] !bg-[#3d3b33] dark:!bg-[#2a2a2a] !text-white !rounded-xl !shadow-xl !font-semibold !text-[11px] !px-3 !py-1.5 !border-none" 
      />
      
      <ConfirmDialog />
      <GlobalTimeWidget />
    </div>
  );
}