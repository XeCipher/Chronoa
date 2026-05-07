// frontend/components/landing/Downloads.tsx
"use client";

import { Download, Smartphone, AppWindow, ShieldAlert } from "lucide-react";

export function DownloadsSection() {
  return (
    <div className="w-full py-20 border-t border-[#e0ddd5] dark:border-[#333] mt-20">
      <div className="text-center mb-16">
        <h3 className="text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-4">Take It Anywhere</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] text-sm max-w-md mx-auto">
          Chronoa is designed to live on your home screen. Install it for a completely immersive, full-screen app experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6">
        {/* Android APK */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-8 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[#7ca982]/10 text-[#7ca982] rounded-2xl flex items-center justify-center mb-6">
              <Smartphone size={24} />
            </div>
            <h4 className="text-2xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-2">Android App</h4>
            <p className="text-xs text-[#888] leading-relaxed mb-6">
              Download the standalone lightweight APK. Provides the best Android performance.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex gap-3 mb-8">
              <ShieldAlert size={20} className="text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700 dark:text-amber-500 font-medium leading-relaxed">
                Because this app is not on the Play Store, your browser may flag it as "harmful". Chronoa is completely open-source and safe to install.
              </p>
            </div>
          </div>
          <a href="/chronoa.apk" download className="w-full flex items-center justify-center gap-2 py-4 bg-[#7ca982] text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#6a9a70] transition-colors shadow-md">
            <Download size={16} /> Download APK (1.4 MB)
          </a>
        </div>

        {/* PWA iOS / Web */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-8 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[#6e90c2]/10 text-[#6e90c2] rounded-2xl flex items-center justify-center mb-6">
              <AppWindow size={24} />
            </div>
            <h4 className="text-2xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-2">iOS & Web App</h4>
            <p className="text-xs text-[#888] leading-relaxed mb-6">
              Install Chronoa directly from Safari or Chrome to get a native-feeling app icon on your home screen.
            </p>
            <ul className="space-y-4 mb-8">
              {/* Desktop View */}
              <li className="hidden md:flex text-[11px] text-[#3d3b33] dark:text-[#e0e0e0] font-medium gap-3 bg-[#f7f5f0] dark:bg-[#252525] p-3 rounded-lg">
                <span className="font-bold text-[#6e90c2]">iOS:</span> Open in Safari → Tap Share icon → "Add to Home Screen"
              </li>
              <li className="hidden md:flex text-[11px] text-[#3d3b33] dark:text-[#e0e0e0] font-medium gap-3 bg-[#f7f5f0] dark:bg-[#252525] p-3 rounded-lg">
                <span className="font-bold text-[#6e90c2]">Android:</span> Open in Chrome → Tap Menu (⋮) → "Add to Home Screen"
              </li>

              {/* Mobile View */}
              <li className="md:hidden flex text-[11px] text-[#3d3b33] dark:text-[#e0e0e0] font-medium gap-3 bg-[#f7f5f0] dark:bg-[#252525] p-3 rounded-lg">
                <span className="font-bold text-[#6e90c2]">iOS:</span> Tap Share icon → "Add to Home Screen"
              </li>
              <li className="md:hidden flex text-[11px] text-[#3d3b33] dark:text-[#e0e0e0] font-medium gap-3 bg-[#f7f5f0] dark:bg-[#252525] p-3 rounded-lg">
                <span className="font-bold text-[#6e90c2]">Android:</span> Tap Menu (⋮) → "Add to Home Screen"
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}