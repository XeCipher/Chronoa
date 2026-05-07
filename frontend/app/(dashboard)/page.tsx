"use client";

import { motion } from "framer-motion";
import { LandingNav, useGoogleLogin } from "@/components/landing/LandingNav";
import { MockHomeSandbox, MockTaskSandbox, MockTimeSandbox, MockCalendarSandbox, MockNotesSandbox, MockAnalyticsSandbox } from "@/components/landing/Sandboxes";
import { DownloadsSection } from "@/components/landing/Downloads";

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
  const { handleLogin, isLoggingIn } = useGoogleLogin();

  return (
    <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212] text-[#3d3b33] dark:text-[#f0f0f0] overflow-x-hidden selection:bg-[#c2956e]/30 dark:selection:bg-[#b0855f]/40 relative">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative w-full h-[95vh] flex flex-col items-center justify-center px-6">
        {/* Abstract Background Blur Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center opacity-60">
          <motion.div animate={{ scale:[1, 1.1, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute w-[800px] h-[800px] -translate-y-48 translate-x-32" style={{ background: 'radial-gradient(circle, rgba(168,130,194,0.1) 0%, transparent 60%)' }} />
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute w-[800px] h-[800px] translate-y-48 -translate-x-32" style={{ background: 'radial-gradient(circle, rgba(124,169,130,0.1) 0%, transparent 60%)' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}
          className="z-10 flex flex-col items-center text-center max-w-3xl"
        >
          <h1 className="text-6xl md:text-8xl font-serif tracking-tight leading-none mb-6">
            Master your time. <br/>
            <span className="text-[#c2956e] dark:text-[#b0855f]">Reclaim your focus.</span>
          </h1>
          <p className="text-sm md:text-base text-[#888] dark:text-[#a0a0a0] mb-12 max-w-xl mx-auto leading-relaxed">
            Chronoa is a breathtakingly fast, minimalist workspace designed exclusively for deep work. Timers, calendars, tasks, and notes—unified in one gorgeous interface.
          </p>
          <button
            onClick={handleLogin} disabled={isLoggingIn}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:border-[#c2956e] hover:shadow-[0_8px_30px_rgba(194,149,110,0.2)] hover:-translate-y-1 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-[#c2956e] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Enter Workspace
              </>
            )}
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#b0ad9a] dark:text-[#555] flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest">Scroll to explore</span>
          <div className="w-px h-10 bg-gradient-to-b from-current to-transparent" />
        </motion.div>
      </section>

      <main className="max-w-7xl mx-auto px-6 md:px-10 pb-32 flex flex-col gap-32">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-4xl font-serif mb-4">A Living Environment</h2>
            <p className="text-sm text-[#888] max-w-lg mx-auto">The homepage changes its scenery based on the actual time of day. Try the buttons below to shift the mood.</p>
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
          <div className="w-full text-center py-20 bg-[#c2956e]/5 dark:bg-[#b0855f]/10 rounded-[3rem] border border-[#c2956e]/20">
            <h3 className="text-4xl md:text-5xl font-serif mb-6 text-[#3d3b33] dark:text-white">Your journey starts here.</h3>
            <button onClick={handleLogin} disabled={isLoggingIn} className="px-10 py-4 bg-[#c2956e] text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#b0855f] hover:scale-105 transition-all shadow-xl disabled:opacity-50">
               {isLoggingIn ? 'Entering...' : 'Sign in with Google'}
            </button>
          </div>
        </FadeIn>
      </main>

      <footer className="w-full text-center py-8 text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#555] border-t border-[#e0ddd5] dark:border-[#2a2a2a]">
        Open Source • Built with Next.js & Supabase
      </footer>
    </div>
  );
}