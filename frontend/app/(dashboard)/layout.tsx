"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SidebarNav from "@/components/ui/SidebarNav";
import { useUiStore } from "@/store/uiStore";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { theme, toggleMobileMenu } = useUiStore();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
      else setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // BULLETPROOF THEME & ICON SWITCHER
  useEffect(() => {
    const updateEverything = (isDark: boolean) => {
      // 1. Update the UI class
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 2. Find and completely remove ANY existing favicon links
      const existingLinks = document.querySelectorAll("link[rel~='icon']");
      existingLinks.forEach(link => link.remove());

      // 3. Create a brand new link tag and append it to the head
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = 'image/svg+xml';
      // Timestamp trick completely bypasses browser caching
      newLink.href = `${isDark ? '/icon-dark.svg' : '/icon-light.svg'}?v=${Date.now()}`;
      document.head.appendChild(newLink);
    };

    const isCurrentlyDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    updateEverything(isCurrentlyDark);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => updateEverything(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  if (isLoading) return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f7f5f0] dark:bg-[#121212]">
      {/* Mobile Top Bar */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 flex items-center justify-between px-4 z-40 bg-transparent pointer-events-none">
        <button 
          onClick={toggleMobileMenu} 
          className="pointer-events-auto p-2.5 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border border-[#e0ddd5] dark:border-[#333] rounded-xl shadow-sm text-[#3d3b33] dark:text-[#e0e0e0]"
        >
          <Menu size={20} />
        </button>
      </div>

      <SidebarNav />
      <main className="flex-1 h-full overflow-y-auto relative min-w-0 pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}