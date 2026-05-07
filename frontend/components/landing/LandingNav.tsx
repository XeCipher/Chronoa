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
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  },[]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-white/70 dark:bg-[#121212]/70 backdrop-blur-xl border-b border-[#e0ddd5] dark:border-[#333]' : 'bg-transparent border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <h1 className="text-3xl text-[#3d3b33] dark:text-[#e0e0e0] font-serif font-medium tracking-tight cursor-default">
          Chronoa
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <a href="https://github.com/XeCipher/Chronoa" target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full text-[#888] hover:text-[#3d3b33] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <GithubIcon size={20} />
        </a>
          <button onClick={handleLogin} disabled={isLoggingIn} className="px-6 py-2.5 bg-[#c2956e] dark:bg-[#b0855f] text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg disabled:opacity-50">
            {isLoggingIn ? 'Redirecting...' : 'Sign In'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export function LandingScenery({ timeOfDay }: { timeOfDay: 'dawn' | 'day' | 'dusk' | 'night' }) {
  const palettes = {
    dawn: { bg: "bg-[#fdfbf7] dark:bg-[#1a1210]", orb1: "bg-[#ffcba6] dark:bg-[#8a4e40]", orb2: "bg-[#ffa68f] dark:bg-[#8a5a44]", orb3: "bg-[#d6aef2] dark:bg-[#6c4f7a]" },
    day: { bg: "bg-[#f7f5f0] dark:bg-[#0f1115]", orb1: "bg-[#d4b3ff] dark:bg-[#2d3b5c]", orb2: "bg-[#9bc7f5] dark:bg-[#1e2e42]", orb3: "bg-[#a1e3b3] dark:bg-[#253828]" },
    dusk: { bg: "bg-[#f8f5f2] dark:bg-[#1a1012]", orb1: "bg-[#ff8a90] dark:bg-[#7a3b4c]", orb2: "bg-[#f5b0db] dark:bg-[#7a4b6c]", orb3: "bg-[#de9c64] dark:bg-[#7d4628]" },
    night: { bg: "bg-[#f2f4f8] dark:bg-[#050810]", orb1: "bg-[#9eb4db] dark:bg-[#1f2b45]", orb2: "bg-[#b9c6e3] dark:bg-[#111926]", orb3: "bg-[#8da8cf] dark:bg-[#172033]" },
  };
  const current = palettes[timeOfDay];

  return (
    <div className={`absolute inset-0 -z-50 overflow-hidden transition-colors duration-[2000ms] ${current.bg} rounded-[2.5rem]`}>
      <div className="absolute inset-0 w-full h-full opacity-80 dark:opacity-100 mix-blend-overlay">
        <div className={`absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full filter blur-[100px] transition-colors duration-[2000ms] ${current.orb1}`} />
        <div className={`absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full filter blur-[100px] transition-colors duration-[2000ms] ${current.orb2}`} />
        <div className={`absolute top-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full filter blur-[100px] transition-colors duration-[2000ms] ${current.orb3}`} />
      </div>
    </div>
  );
}