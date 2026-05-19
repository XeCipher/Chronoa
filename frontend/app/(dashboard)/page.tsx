// frontend/app/(dashboard)/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { LandingNav, ChronoaLogo, GithubIcon, useGoogleLogin } from "@/components/landing/LandingNav";
import { MockHomeSandbox, MockTaskSandbox, MockTimeSandbox, MockCalendarSandbox, MockNotesSandbox, MockAnalyticsSandbox, MockAiSandbox } from "@/components/landing/Sandboxes";
import { DownloadsSection } from "@/components/landing/Downloads";
import DeveloperMessageModal from "@/components/landing/DeveloperMessageModal";
import { ArrowRight, MessageSquareHeart } from "lucide-react";
import { useUiStore } from "@/store/uiStore";

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease:[0.16, 1, 0.3, 1], delay }}
    className="w-full"
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const router = useRouter();
  const { handleLogin, isLoggingIn } = useGoogleLogin();
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const lastVisitedPage = useUiStore((state) => state.lastVisitedPage);

  // Redirect to last visited page or home if user is already logged in
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (user && !error) {
        const target = lastVisitedPage && lastVisitedPage !== '/' && lastVisitedPage !== '/home' ? lastVisitedPage : '/home';
        router.replace(target);
      } else {
        // If a dead session exists locally, clear it out.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await supabase.auth.signOut();
        setIsCheckingSession(false);
      }
    });
  }, [router, lastVisitedPage]);

  if (isCheckingSession) {
    return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212] text-[#3d3b33] dark:text-[#f0f0f0] overflow-x-hidden selection:bg-[#c2956e]/30 dark:selection:bg-[#b0855f]/40 relative flex flex-col w-full max-w-[100vw]">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center px-4 md:px-6 pt-16 shrink-0 overflow-hidden">
        {/* Abstract Background Blur Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center opacity-60">
          <motion.div animate={{ scale:[1, 1.1, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute w-[800px] h-[800px] -translate-y-48 translate-x-32" style={{ background: 'radial-gradient(circle, rgba(168,130,194,0.1) 0%, transparent 60%)' }} />
          <motion.div animate={{ scale:[1, 1.2, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute w-[800px] h-[800px] translate-y-48 -translate-x-32" style={{ background: 'radial-gradient(circle, rgba(124,169,130,0.1) 0%, transparent 60%)' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}
          className="z-10 flex flex-col items-center text-center max-w-3xl -translate-y-8"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif tracking-tight leading-none mb-6 md:mb-8">
            Your aesthetic workspace. <br/>
            <span className="text-[#c2956e] dark:text-[#b0855f]">Completely synced.</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[#888] dark:text-[#a0a0a0] mb-8 md:mb-10 max-w-xl mx-auto leading-relaxed px-2">
            Your tasks, notes, calendar, and timers, unified in one gorgeous workspace. Track your deep work, analyze your focus patterns, and stay seamlessly in sync across all your devices.
          </p>
          <button
            onClick={handleLogin} disabled={isLoggingIn}
            className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-[#c2956e] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#b0855f] hover:shadow-[0_8px_30px_rgba(194,149,110,0.4)] hover:-translate-y-1 disabled:opacity-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
            ) : (
              <span className="relative z-10 flex items-center gap-2">
                 Enter Workspace <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 text-[#b0ad9a] dark:text-[#555] flex flex-col items-center gap-2"
        >
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Scroll to explore</span>
          <div className="w-px h-8 md:h-10 bg-gradient-to-b from-current to-transparent" />
        </motion.div>
      </section>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-10 pb-16 flex flex-col gap-16 md:gap-32 flex-1">
        <FadeIn>
          <div className="text-center mb-8 md:mb-10 mt-10 w-full">
            <h2 className="text-3xl md:text-4xl font-serif mb-3 md:mb-4">A Living Environment</h2>
            <p className="text-xs md:text-sm text-[#888] max-w-lg mx-auto">The homepage changes its scenery based on the actual time of day. Try the buttons below to shift the mood natively.</p>
          </div>
          <MockHomeSandbox />
        </FadeIn>

        <FadeIn>
          <MockTaskSandbox />
        </FadeIn>

        <FadeIn>
          <MockTimeSandbox />
        </FadeIn>

        <FadeIn>
          <MockCalendarSandbox />
        </FadeIn>

        <FadeIn>
          <MockNotesSandbox />
        </FadeIn>

        <FadeIn>
          <MockAnalyticsSandbox />
        </FadeIn>
        
        <FadeIn>
          <MockAiSandbox />
        </FadeIn>

        <FadeIn>
          <DownloadsSection />
        </FadeIn>

        {/* Final CTA Redesign */}
        <FadeIn>
          <div className="relative w-full text-center py-20 md:py-28 bg-[#fdfbf7] dark:bg-[#161616] rounded-[2.5rem] md:rounded-[4rem] border border-[#e0ddd5] dark:border-[#333] px-4 shadow-xl overflow-hidden isolate">
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply dark:mix-blend-screen pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(194,149,110,0.15)_0%,transparent_60%)]" />
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(168,130,194,0.1)_0%,transparent_60%)]" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-[#c2956e]/10 dark:bg-[#b0855f]/20 rounded-full flex items-center justify-center mb-8 shadow-sm text-[#c2956e] dark:text-[#b0855f]">
                <ChronoaLogo className="w-12 h-12" />
              </div>
              <h3 className="text-4xl md:text-6xl font-serif mb-6 text-[#3d3b33] dark:text-white leading-tight">Your journey<br/> starts here.</h3>
              <p className="text-[#888] dark:text-[#a0a0a0] max-w-md mx-auto mb-10 text-sm md:text-base leading-relaxed">
                 Eliminate distractions. Bring your focus, planning, and reflection into one beautifully synced ecosystem.
              </p>
              <button 
                onClick={handleLogin} 
                disabled={isLoggingIn} 
                className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-[#c2956e] text-white rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#b0855f] hover:shadow-[0_10px_40px_rgba(194,149,110,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                ) : (
                  <span className="relative z-10 flex items-center gap-3">
                     Enter App <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      <footer className="w-full border-t border-[#e0ddd5] dark:border-[#2a2a2a] bg-[#fdfbf7] dark:bg-[#161616] pt-16 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-8 px-6 md:px-12 mt-auto shrink-0 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-10 md:gap-0">
           <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3 text-[#3d3b33] dark:text-[#e0e0e0]">
                 <ChronoaLogo className="w-8 h-8 text-[#c2956e] dark:text-[#b0855f]" />
                 <span className="text-2xl font-serif font-medium tracking-tight">Chronoa</span>
              </div>
              <p className="text-sm text-[#888] dark:text-[#a0a0a0] max-w-xs text-center md:text-left">
                Your aesthetic workspace. Completely synced and designed for deep focus.
              </p>
           </div>
           <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex gap-4">
                 <a href="https://github.com/XeCipher/Chronoa" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] text-[#888] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-colors shadow-sm text-xs font-bold uppercase tracking-widest">
                   <GithubIcon size={16} /> GitHub
                 </a>
                 <button onClick={() => setIsDeveloperModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c2956e] text-white hover:bg-[#b0855f] transition-colors shadow-sm text-xs font-bold uppercase tracking-widest">
                   <MessageSquareHeart size={16} /> Contact Dev
                 </button>
              </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#e0ddd5] dark:border-[#2a2a2a] text-center flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#555]">
           <span>© {new Date().getFullYear()} Chronoa. Open Source.</span>
           <span>Built with Next.js & Supabase</span>
        </div>
      </footer>

      <DeveloperMessageModal 
        isOpen={isDeveloperModalOpen} 
        onClose={() => setIsDeveloperModalOpen(false)} 
      />
    </div>
  );
}