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
        // This will redirect to a route we'll create in the next step
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-4">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#e8d5f5] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute top-48 -right-24 w-96 h-96 bg-[#d4edd6] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 flex flex-col items-center max-w-md w-full text-center space-y-12">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl text-[#3d3b33] font-light tracking-tight" style={{ fontFamily: 'serif' }}>
            Chronoa
          </h1>
          <p className="text-[#888] tracking-[0.2em] text-xs uppercase font-medium">
            Your personal sanctuary
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="group relative flex items-center justify-center gap-4 w-full sm:w-80 bg-white border border-[#e0ddd5] rounded-full px-6 py-4 text-[#3d3b33] text-sm font-medium transition-all duration-500 hover:border-[#c2956e] hover:shadow-xl hover:-translate-y-1 disabled:opacity-70"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-[#c2956e] border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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