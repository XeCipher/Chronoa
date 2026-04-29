"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SidebarNav from "@/components/ui/SidebarNav";
import { useUiStore } from "@/store/uiStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useUiStore();

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
      <SidebarNav />
      <main className="flex-1 h-full overflow-y-auto relative min-w-0 pb-[72px] md:pb-0 pt-[max(1rem,env(safe-area-inset-top))] md:pt-0">
        {children}
      </main>
    </div>
  );
}