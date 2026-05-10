// frontend/app/(auth)/login/page.tsx
"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        router.push('/home');
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await supabase.auth.signOut();
        setIsChecking(false);
      }
    };
    checkSession();
  },[router, supabase.auth]);

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
  },[]);

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
    <div className="relative min-h-screen bg-[#f7f5f0] dark:bg-[#121212] flex flex-col items-center justify-center overflow-hidden transition-colors duration-300">
      
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] -translate-y-48 translate-x-32" style={{ background: 'radial-gradient(circle, rgba(168,130,194,0.15) 0%, transparent 60%)' }}></div>
        <div className="absolute w-[800px] h-[800px] translate-y-48 -translate-x-32" style={{ background: 'radial-gradient(circle, rgba(124,169,130,0.15) 0%, transparent 60%)' }}></div>
        <div className="absolute w-[1000px] h-[1000px] translate-y-12" style={{ background: 'radial-gradient(circle, rgba(194,149,110,0.1) 0%, transparent 60%)' }}></div>
      </div>

      <div className="z-10 flex flex-col items-center px-4 w-full">
        <h1 className="text-6xl md:text-7xl text-[#3d3b33] dark:text-[#f0f0f0] mb-4 tracking-tight font-serif">
          Chronoa
        </h1>
        <p className="text-[#888888] dark:text-[#7a7a7a] tracking-[0.25em] text-[11px] font-semibold uppercase mb-16">
          Your aesthetic workspace. Completely synced.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 w-[280px] h-[52px] bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-2xl text-[#3d3b33] dark:text-[#f0f0f0] text-sm font-medium transition-all duration-300 hover:border-[#c2956e] dark:hover:border-[#b0855f] hover:shadow-lg hover:shadow-[#c2956e]/10 dark:hover:shadow-[#b0855f]/10 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-[#c2956e] dark:border-[#b0855f] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}