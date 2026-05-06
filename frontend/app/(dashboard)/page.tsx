"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileText, Timer } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Redirect if already authenticated
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/home');
      } else {
        setIsChecking(false);
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  useEffect(() => {
    try {
      const localState = localStorage.getItem('chronoa-settings');
      let theme = 'system';
      if (localState) {
        const parsed = JSON.parse(localState);
        if (parsed?.state?.theme) theme = parsed.state.theme;
      }
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    } catch (e) {}
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (isChecking) return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;

  return (
    <div className="relative min-h-screen bg-[#f7f5f0] dark:bg-[#121212] flex flex-col items-center overflow-x-hidden transition-colors duration-300">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] -translate-y-48 translate-x-32" style={{ background: 'radial-gradient(circle, rgba(168,130,194,0.15) 0%, transparent 60%)' }}></div>
        <div className="absolute w-[800px] h-[800px] translate-y-48 -translate-x-32" style={{ background: 'radial-gradient(circle, rgba(124,169,130,0.15) 0%, transparent 60%)' }}></div>
        <div className="absolute w-[1000px] h-[1000px] translate-y-12" style={{ background: 'radial-gradient(circle, rgba(194,149,110,0.1) 0%, transparent 60%)' }}></div>
      </div>

      {/* Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-20">
        <h1 className="text-3xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif font-bold tracking-tight">Chronoa</h1>
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="px-6 py-2.5 bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-full text-[#3d3b33] dark:text-[#f0f0f0] text-xs font-bold uppercase tracking-widest transition-all hover:border-[#c2956e] dark:hover:border-[#b0855f] hover:shadow-md"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 flex flex-col items-center justify-center z-10 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c2956e]/10 border border-[#c2956e]/20 text-[#c2956e] text-xs font-bold uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-[#c2956e] animate-pulse" /> The open-source workspace
        </div>
        
        <h2 className="text-5xl md:text-7xl text-[#3d3b33] dark:text-[#f0f0f0] mb-6 tracking-tight font-serif max-w-4xl leading-[1.1]">
          Master your time. <br className="hidden md:block" />
          <span className="italic text-[#c2956e] dark:text-[#d1a784]">Clear your mind.</span>
        </h2>
        
        <p className="text-[#888888] dark:text-[#a0a0a0] text-base md:text-lg mb-12 max-w-2xl leading-relaxed">
          Chronoa merges task management, calendar syncing, time tracking, and daily reflection into a single, beautiful workspace designed for deep focus.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-[#c2956e] dark:bg-[#b0855f] rounded-2xl text-white text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:bg-[#b0855f] dark:hover:bg-[#9e7653] hover:shadow-xl hover:shadow-[#c2956e]/20 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 bg-white rounded-full p-0.5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left">
          <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-[#e0ddd5] dark:border-[#333] p-6 rounded-[2rem] shadow-sm">
             <div className="w-12 h-12 bg-[#7ca982]/10 text-[#7ca982] rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 size={24} />
             </div>
             <h3 className="text-xl font-serif font-medium text-[#3d3b33] dark:text-[#f0f0f0] mb-2">Intentional Tasks</h3>
             <p className="text-sm text-[#888] dark:text-[#a0a0a0] leading-relaxed">A clean, focused daily list. Completed items elegantly vanish so you only see what matters now.</p>
          </div>
          <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-[#e0ddd5] dark:border-[#333] p-6 rounded-[2rem] shadow-sm">
             <div className="w-12 h-12 bg-[#6e90c2]/10 text-[#6e90c2] rounded-xl flex items-center justify-center mb-4">
                <Timer size={24} />
             </div>
             <h3 className="text-xl font-serif font-medium text-[#3d3b33] dark:text-[#f0f0f0] mb-2">Deep Work Timers</h3>
             <p className="text-sm text-[#888] dark:text-[#a0a0a0] leading-relaxed">Integrated pomodoro timers and stopwatches that sync seamlessly to your session analytics.</p>
          </div>
          <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-[#e0ddd5] dark:border-[#333] p-6 rounded-[2rem] shadow-sm">
             <div className="w-12 h-12 bg-[#c2956e]/10 text-[#c2956e] rounded-xl flex items-center justify-center mb-4">
                <FileText size={24} />
             </div>
             <h3 className="text-xl font-serif font-medium text-[#3d3b33] dark:text-[#f0f0f0] mb-2">Distraction-Free Notes</h3>
             <p className="text-sm text-[#888] dark:text-[#a0a0a0] leading-relaxed">A zen-like space for your daily journal entries, meetings, and free-form thoughts.</p>
          </div>
        </div>
      </main>

    </div>
  );
}