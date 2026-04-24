"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center overflow-hidden selection:bg-[#c2956e] selection:text-white">
      
      {/* Soft Ambient Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Violet ambient glow */}
        <div className="absolute w-[500px] h-[500px] bg-[#a882c2]/20 rounded-full blur-[100px] -translate-y-48 translate-x-32"></div>
        {/* Sage ambient glow */}
        <div className="absolute w-[400px] h-[400px] bg-[#7ca982]/20 rounded-full blur-[100px] translate-y-48 -translate-x-32"></div>
        {/* Amber ambient glow */}
        <div className="absolute w-[600px] h-[600px] bg-[#c2956e]/10 rounded-full blur-[120px] translate-y-12"></div>
      </div>

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center px-4 w-full">
        {/* Title utilizing the injected Cormorant font */}
        <h1 className="text-6xl md:text-7xl text-[#3d3b33] mb-4 tracking-tight" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
          Chronoa
        </h1>
        <p className="text-[#888888] tracking-[0.25em] text-[11px] font-semibold uppercase mb-16">
          Your personal sanctuary
        </p>

        {/* Button with STRICT explicit sizing (w-[280px]) */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 w-[280px] h-[52px] bg-white border border-[#e0ddd5] rounded-2xl text-[#3d3b33] text-sm font-medium transition-all duration-300 hover:border-[#c2956e] hover:shadow-lg hover:shadow-[#c2956e]/10 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-[#c2956e] border-t-transparent rounded-full animate-spin"></div>
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