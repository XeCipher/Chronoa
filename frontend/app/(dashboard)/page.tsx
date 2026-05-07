// frontend/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { LandingNav, useGoogleLogin } from "@/components/landing/LandingNav";
import { MockHomeSandbox, MockTaskSandbox, MockTimeSandbox, MockCalendarSandbox, MockNotesSandbox, MockAnalyticsSandbox } from "@/components/landing/Sandboxes";
import { DownloadsSection } from "@/components/landing/Downloads";
import { ArrowRight } from "lucide-react";

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

  // Redirect to home if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/home');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212] text-[#3d3b33] dark:text-[#f0f0f0] overflow-x-hidden selection:bg-[#c2956e]/30 dark:selection:bg-[#b0855f]/40 relative">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center px-4 md:px-6 pt-16">
        {/* Abstract Background Blur Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center opacity-60">
          <motion.div animate={{ scale:[1, 1.1, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute w-[800px] h-[800px] -translate-y-48 translate-x-32" style={{ background: 'radial-gradient(circle, rgba(168,130,194,0.1) 0%, transparent 60%)' }} />
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute w-[800px] h-[800px] translate-y-48 -translate-x-32" style={{ background: 'radial-gradient(circle, rgba(124,169,130,0.1) 0%, transparent 60%)' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}
          className="z-10 flex flex-col items-center text-center max-w-3xl -translate-y-8"
        >
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-serif tracking-tight leading-none mb-6 md:mb-8">
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
                 Launch Workspace <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pb-32 flex flex-col gap-20 md:gap-32">
        <FadeIn>
          <div className="text-center mb-8 md:mb-10 mt-10">
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
          <DownloadsSection />
        </FadeIn>

        {/* Final CTA */}
        <FadeIn>
          <div className="w-full text-center py-16 md:py-20 bg-[#c2956e]/5 dark:bg-[#b0855f]/10 rounded-[2.5rem] md:rounded-[3rem] border border-[#c2956e]/20 px-4">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 md:mb-6 text-[#3d3b33] dark:text-white">Your journey starts here.</h3>
            <button onClick={handleLogin} disabled={isLoggingIn} className="px-8 md:px-10 py-3.5 md:py-4 bg-[#c2956e] text-white rounded-full text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#b0855f] hover:scale-105 transition-all shadow-xl disabled:opacity-50">
               {isLoggingIn ? 'Launching...' : 'Launch App'}
            </button>
          </div>
        </FadeIn>
      </main>

      <footer className="w-full text-center py-8 text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#555] border-t border-[#e0ddd5] dark:border-[#2a2a2a] px-4">
        Open Source • Built with Next.js & Supabase
      </footer>
    </div>
  );
}