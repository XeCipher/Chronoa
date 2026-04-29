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

  // Keep theme synced dynamically when changed
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
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