// frontend/components/landing/Downloads.tsx
"use client";

import { Download, Smartphone, AppWindow, ShieldAlert, Layers } from "lucide-react";

export function DownloadsSection() {
  return (
    <div className="w-full py-24 border-t border-[#e0ddd5] dark:border-[#333] mt-24 relative isolate">
      <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center,rgba(194,149,110,0.05)_0%,transparent_70%)]" />
      
      <div className="text-center mb-16 px-4">
        <h3 className="text-4xl md:text-5xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-4 tracking-tight">Take It Anywhere</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          Chronoa is designed to live natively on your home screen. Install it for a completely immersive, full-screen sanctuary.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6">
        {/* Android APK */}
        <div className="group relative bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:shadow-xl dark:hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition-all duration-500 overflow-hidden flex flex-col justify-between h-full min-h-[420px]">
          <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <Smartphone size={250} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-[#7ca982]/10 text-[#7ca982] rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm border border-[#7ca982]/20">
              <Smartphone size={24} strokeWidth={2.5} />
            </div>
            <h4 className="text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Android App</h4>
            <p className="text-sm text-[#888] dark:text-[#a0a0a0] leading-relaxed mb-8">
              Download the standalone, ultra-lightweight APK. Unlocked performance, buttery smooth animations, and a flawless native feel.
            </p>
            
            <div className="mt-auto">
              <div className="bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-900/30 p-4 rounded-2xl flex gap-3 mb-8 backdrop-blur-sm">
                <ShieldAlert size={18} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-400/90 font-medium leading-relaxed">
                  Your browser may flag this as "harmful" since it's not on the Play Store. Chronoa is fully open-source and completely safe.
                </p>
              </div>
              <a href="/chronoa.apk" download className="w-full flex items-center justify-center gap-2 py-4 bg-[#7ca982] text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#6a9a70] hover:-translate-y-1 transition-all shadow-[0_8px_20px_rgba(124,169,130,0.3)]">
                <Download size={16} /> Download APK (1.4 MB)
              </a>
            </div>
          </div>
        </div>

        {/* PWA iOS / Web */}
        <div className="group relative bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:shadow-xl dark:hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition-all duration-500 overflow-hidden flex flex-col justify-between h-full min-h-[420px]">
          <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
            <AppWindow size={250} />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-[#6e90c2]/10 text-[#6e90c2] rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm border border-[#6e90c2]/20">
              <Layers size={24} strokeWidth={2.5} />
            </div>
            <h4 className="text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">iOS & Web App</h4>
            <p className="text-sm text-[#888] dark:text-[#a0a0a0] leading-relaxed mb-8">
              Install Chronoa seamlessly via your browser to get a native app icon on your home screen, without touching an App Store.
            </p>

            <div className="mt-auto space-y-4">
              <div className="flex gap-4 items-start bg-[#fdfbf7]/60 dark:bg-[#222]/40 border border-[#e0ddd5]/60 dark:border-[#333]/60 p-4 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-[#6e90c2]/10 text-[#6e90c2] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">1</div>
                <p className="text-[13px] text-[#888] dark:text-[#a0a0a0] leading-snug pt-0.5">
                  Open <span className="text-[#3d3b33] dark:text-[#e0e0e0] font-semibold">Safari</span> (iOS) or <span className="text-[#3d3b33] dark:text-[#e0e0e0] font-semibold">Chrome</span> (Android)
                </p>
              </div>
              <div className="flex gap-4 items-start bg-[#fdfbf7]/60 dark:bg-[#222]/40 border border-[#e0ddd5]/60 dark:border-[#333]/60 p-4 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-[#6e90c2]/10 text-[#6e90c2] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">2</div>
                <p className="text-[13px] text-[#888] dark:text-[#a0a0a0] leading-snug pt-0.5">
                  Tap the <span className="text-[#3d3b33] dark:text-[#e0e0e0] font-semibold">Share icon</span> or <span className="text-[#3d3b33] dark:text-[#e0e0e0] font-semibold">Menu (⋮)</span>
                </p>
              </div>
              <div className="flex gap-4 items-start bg-[#fdfbf7]/60 dark:bg-[#222]/40 border border-[#e0ddd5]/60 dark:border-[#333]/60 p-4 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-[#6e90c2]/10 text-[#6e90c2] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">3</div>
                <p className="text-[13px] text-[#888] dark:text-[#a0a0a0] leading-snug pt-0.5">
                  Select <span className="text-[#3d3b33] dark:text-[#e0e0e0] font-semibold">"Add to Home Screen"</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}