// frontend/components/landing/LandingNav.tsx
"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { Moon, Sun } from "lucide-react";
import { useUiStore } from "@/store/uiStore";

export const useGoogleLogin = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return { handleLogin, isLoggingIn };
};

const GithubIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export function LandingNav() {
  const { theme, setTheme } = useUiStore();
  const { handleLogin, isLoggingIn } = useGoogleLogin();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const container = document.getElementById("landing-scroll-container");
    if (!container) return;
    const onScroll = () => setScrolled(container.scrollTop > 20);
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-white/30 dark:bg-[#121212]/40 backdrop-blur-xl border-none shadow-none' : 'bg-transparent border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <h1 className="text-3xl text-[#3d3b33] dark:text-[#e0e0e0] font-serif font-medium tracking-tight cursor-default">
          Chronoa
        </h1>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <a href="https://github.com/XeCipher/Chronoa" target="_blank" rel="noreferrer" className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-[#888] hover:text-[#3d3b33] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <GithubIcon size={20} />
          </a>
          <button onClick={handleLogin} disabled={isLoggingIn} className="ml-2 sm:ml-0 px-5 md:px-6 py-2.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg disabled:opacity-50">
            {isLoggingIn ? 'Loading...' : 'Launch App'}
          </button>
        </div>
      </div>
    </nav>
  );
}