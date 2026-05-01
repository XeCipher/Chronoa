// frontend/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SidebarNav from "@/components/ui/SidebarNav";
import { useUiStore } from "@/store/uiStore";
import { useTimerStore } from "@/store/timerStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const { 
    theme, 
    lastVisitedPage, 
    setLastVisitedPage, 
    setNotesTab, 
    isSidebarPinned, 
    toggleSidebarPin,
    hotkeysEnabled 
  } = useUiStore();
  
  const toggleFirstActive = useTimerStore((state) => state.toggleFirstActive);
  const initialRestoreDone = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setIsLoading(false);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        const state = useUiStore.getState();
        if (profile.theme) state.setTheme(profile.theme);
        if (profile.task_archive_delay !== null) state.setTaskArchiveDelay(profile.task_archive_delay);
        if (profile.routine_reset_hour !== null) state.setRoutineResetHour(profile.routine_reset_hour);
        if (profile.journal_zoom !== null) state.setJournalZoom(profile.journal_zoom);
        if (profile.hotkeys_enabled !== null) state.setHotkeysEnabled(profile.hotkeys_enabled);
        if (profile.move_completed_to_bottom !== null) state.setMoveCompletedToBottom(profile.move_completed_to_bottom);
        if (profile.keep_parent_task_alive !== null) state.setKeepParentTaskAlive(profile.keep_parent_task_alive);
        if (profile.add_task_at_top !== null) state.setAddTaskAtTop(profile.add_task_at_top);
        if (profile.show_home_task_progress !== null) state.setShowHomeTaskProgress(profile.show_home_task_progress);
      }

      const channel = supabase.channel(`profile_${session.user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` }, (payload) => {
           const rec = payload.new;
           const state = useUiStore.getState();
           if (rec.theme && rec.theme !== state.theme) state.setTheme(rec.theme);
           if (rec.task_archive_delay !== null && rec.task_archive_delay !== state.taskArchiveDelay) state.setTaskArchiveDelay(rec.task_archive_delay);
           if (rec.routine_reset_hour !== null && rec.routine_reset_hour !== state.routineResetHour) state.setRoutineResetHour(rec.routine_reset_hour);
           if (rec.journal_zoom !== null && rec.journal_zoom !== state.journalZoom) state.setJournalZoom(rec.journal_zoom);
           if (rec.hotkeys_enabled !== null && rec.hotkeys_enabled !== state.hotkeysEnabled) state.setHotkeysEnabled(rec.hotkeys_enabled);
           if (rec.move_completed_to_bottom !== null && rec.move_completed_to_bottom !== state.moveCompletedToBottom) state.setMoveCompletedToBottom(rec.move_completed_to_bottom);
           if (rec.keep_parent_task_alive !== null && rec.keep_parent_task_alive !== state.keepParentTaskAlive) state.setKeepParentTaskAlive(rec.keep_parent_task_alive);
           if (rec.add_task_at_top !== null && rec.add_task_at_top !== state.addTaskAtTop) state.setAddTaskAtTop(rec.add_task_at_top);
           if (rec.show_home_task_progress !== null && rec.show_home_task_progress !== state.showHomeTaskProgress) state.setShowHomeTaskProgress(rec.show_home_task_progress);
        }).subscribe();
        
      return () => { supabase.removeChannel(channel); };
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!hotkeysEnabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isTyping = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
      if (isAlt) {
        const key = e.key.toLowerCase();
        if (key === 'h') { e.preventDefault(); router.push('/'); }
        if (key === 't') { e.preventDefault(); router.push('/tasks'); }
        if (key === 'n') { e.preventDefault(); setNotesTab('notes'); router.push('/notes'); }
        if (key === 'j') { e.preventDefault(); setNotesTab('journal'); router.push('/notes'); }
        if (key === 'l') { e.preventDefault(); router.push('/sessions'); }
        if (key === 'a') { e.preventDefault(); router.push('/analytics'); }
        if (key === 's') { e.preventDefault(); router.push('/settings'); }
      }
      if (e.code === 'Space' && pathname === '/' && !isTyping) { e.preventDefault(); toggleFirstActive(); }
      if (e.key === 'Escape' && isSidebarPinned) toggleSidebarPin();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  },[pathname, router, setNotesTab, isSidebarPinned, toggleSidebarPin, toggleFirstActive, hotkeysEnabled]);

  useEffect(() => {
    if (!isLoading && !initialRestoreDone.current) {
      if (pathname === '/' && lastVisitedPage && lastVisitedPage !== '/') { router.replace(lastVisitedPage); }
      initialRestoreDone.current = true;
    }
    if (!isLoading) setLastVisitedPage(pathname);
  }, [pathname, isLoading, lastVisitedPage, router, setLastVisitedPage]);

  useEffect(() => {
    const isCurrentlyDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isCurrentlyDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  
  const isHomePage = pathname === '/';
  if (isLoading) return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isHomePage ? 'bg-transparent' : 'bg-[#f7f5f0] dark:bg-[#121212]'}`}>
      <SidebarNav />
      <main id="main-scroll-container" className="flex-1 h-full overflow-y-auto overflow-x-hidden relative min-w-0 pb-[72px] md:pb-0 pt-[max(1rem,env(safe-area-inset-top))] md:pt-0 scroll-smooth">
        {children}
      </main>
    </div>
  );
}