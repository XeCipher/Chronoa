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
      if (!session) router.push("/login");
      else setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // GLOBAL HOTKEYS ENGINE (MNEMONIC BASED)
  useEffect(() => {
    if (!hotkeysEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isTyping = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;

      if (isAlt) {
        const key = e.key.toLowerCase();

        // Alt + H -> Home
        if (key === 'h') { e.preventDefault(); router.push('/'); }
        // Alt + T -> Tasks
        if (key === 't') { e.preventDefault(); router.push('/tasks'); }
        // Alt + N -> Notes
        if (key === 'n') { 
          e.preventDefault(); 
          setNotesTab('notes'); 
          router.push('/notes'); 
        }
        // Alt + J -> Journal
        if (key === 'j') { 
          e.preventDefault(); 
          setNotesTab('journal'); 
          router.push('/notes'); 
        }
        // Alt + L -> Log (Time Sessions)
        if (key === 'l') { e.preventDefault(); router.push('/sessions'); }
        // Alt + A -> Analytics
        if (key === 'a') { e.preventDefault(); router.push('/analytics'); }
        // Alt + S -> Settings
        if (key === 's') { e.preventDefault(); router.push('/settings'); }
      }

      // Space -> Toggle Focus (Only on Home, not typing)
      if (e.code === 'Space' && pathname === '/' && !isTyping) {
        e.preventDefault();
        toggleFirstActive();
      }

      // Esc -> Collapse Sidebar
      if (e.key === 'Escape') {
        if (isSidebarPinned) toggleSidebarPin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router, setNotesTab, isSidebarPinned, toggleSidebarPin, toggleFirstActive, hotkeysEnabled]);

  // Navigation Persistence
  useEffect(() => {
    if (!isLoading && !initialRestoreDone.current) {
      if (pathname === '/' && lastVisitedPage && lastVisitedPage !== '/') {
        router.replace(lastVisitedPage);
      }
      initialRestoreDone.current = true;
    }
    if (!isLoading) setLastVisitedPage(pathname);
  }, [pathname, isLoading, lastVisitedPage, router, setLastVisitedPage]);

  // Theme Sync
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
      {/* ADDED ID: "main-scroll-container" AND "scroll-smooth" HERE FOR SCROLL CONTROLS */}
      <main id="main-scroll-container" className="flex-1 h-full overflow-y-auto relative min-w-0 pb-[72px] md:pb-0 pt-[max(1rem,env(safe-area-inset-top))] md:pt-0 scroll-smooth">
        {children}
      </main>
    </div>
  );
}