// frontend/components/ui/SidebarNav.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/store/uiStore";
import { Home, CheckSquare, BarChart2, Settings, LogOut, PanelLeftClose, Sun, Hourglass, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  const { isSidebarPinned, toggleSidebarPin, mobileNoteOpen } = useUiStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isAsleep, setIsAsleep] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isSidebarPinned && !isHovered) {
      timeout = setTimeout(() => setIsAsleep(true), 5000);
    } else {
      setIsAsleep(false);
    }
    return () => clearTimeout(timeout);
  }, [isSidebarPinned, isHovered]);

  const isExpanded = isSidebarPinned || isHovered;
  const isHiddenMode = !isExpanded && isAsleep;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "Time Log", href: "/sessions", icon: Hourglass },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
  ];

  const currentItem = navItems.find(item => item.href === pathname) || { name: pathname === '/settings' ? 'Settings' : 'Chronoa' };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:block relative h-full z-50 transition-all duration-500 ease-in-out 
          ${isExpanded ? 'w-64' : isHiddenMode ? 'w-0' : 'w-20'}
        `}
      >
        <div className={`absolute inset-y-0 left-0 w-12 z-50 ${isHiddenMode ? 'block' : 'hidden'}`} />

        <div className={`absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none transition-all duration-500 delay-100 flex items-center justify-center ${
          isHiddenMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        }`}>
          <span className="-rotate-90 whitespace-nowrap text-[10px] tracking-[0.4em] uppercase font-bold text-[#b0ad9a] dark:text-[#7a7a7a]">
            {currentItem.name}
          </span>
        </div>

        <div className={`absolute inset-y-0 left-0 h-full bg-[#f7f5f0] dark:bg-[#161616] border-r border-[#e0ddd5] dark:border-[#2a2a2a] flex flex-col z-40 transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'w-64 translate-x-0 shadow-xl shadow-[#e0ddd5]/50 dark:shadow-black/50' : 
          isHiddenMode ? 'w-20 -translate-x-full shadow-none' : 
          'w-20 translate-x-0 shadow-none'
        }`}>
          
          <div className="flex items-center h-24 relative shrink-0">
            <div className={`absolute inset-0 flex items-center px-8 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <h2 className="text-3xl text-[#3d3b33] dark:text-[#e0e0e0]" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
                Chronoa
              </h2>
            </div>
            
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <Sun className="text-[#c2956e] dark:text-[#b0855f]" size={22} />
            </div>
          </div>

          <nav className="flex-1 space-y-2 pt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden group
                    ${isExpanded ? "mx-6 px-4 justify-start gap-4" : "mx-4 justify-center"}
                    ${isActive 
                      ? "bg-white dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] shadow-sm border border-[#e0ddd5] dark:border-[#333]" 
                      : "text-[#888888] dark:text-[#a0a0a0] hover:bg-white/50 dark:hover:bg-[#2a2a2a] hover:text-[#3d3b33] dark:hover:text-[#fff]"
                    }
                  `}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 pb-6 pt-4 border-t border-[#e0ddd5]/50 dark:border-[#333]/50 mx-4">
            <Link
              href="/settings"
              className={`flex items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden
                ${isExpanded ? "px-4 justify-start gap-4" : "justify-center"}
                ${pathname === "/settings" ? "bg-white dark:bg-[#252525] text-[#3d3b33] dark:text-[#fff] shadow-sm border border-[#e0ddd5] dark:border-[#333]" : "text-[#888888] dark:text-[#a0a0a0] hover:bg-white/50 dark:hover:bg-[#2a2a2a] hover:text-[#3d3b33] dark:hover:text-[#fff]"}
              `}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
               <span className={`transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                Settings
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className={`flex w-full items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden text-[#888888] dark:text-[#a0a0a0] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
                ${isExpanded ? "px-4 justify-start gap-4" : "justify-center"}
              `}
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                Log out
              </span>
            </button>
          </div>
        </div>

        <button
          onClick={toggleSidebarPin}
          className={`hidden md:block absolute top-20 right-0 translate-x-1/2 z-50 p-2 bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-full shadow-lg text-[#888] dark:text-[#a0a0a0] hover:text-[#c2956e] dark:hover:text-[#d1a784] transition-all duration-500 ease-in-out
            ${isHiddenMode ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}
          `}
          title={isSidebarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
        >
          <PanelLeftClose size={16} className={`transition-transform duration-300 ${isSidebarPinned ? '' : 'rotate-180'}`} />
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full h-[72px] pb-[env(safe-area-inset-bottom)] bg-[#f7f5f0]/90 dark:bg-[#121212]/90 backdrop-blur-xl border-t border-[#e0ddd5] dark:border-[#2a2a2a] flex items-center justify-around z-[100] transition-transform duration-300 ease-in-out ${mobileNoteOpen ? 'translate-y-full' : 'translate-y-0'}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  const containers = ["notes-library-scroll-container", "notes-scroll-container", "main-scroll-container"];
                  for (const id of containers) {
                    const el = document.getElementById(id);
                    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }
              }}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all ${
                isActive ? "text-[#c2956e] dark:text-[#d1a784]" : "text-[#888888] dark:text-[#a0a0a0] hover:text-[#3d3b33] dark:hover:text-[#fff]"
              }`}
            >
              <item.icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[9px] font-medium tracking-wide ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          onClick={(e) => {
            if (pathname === "/settings") {
              e.preventDefault();
              const el = document.getElementById("main-scroll-container");
              if (el) el.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all ${
            pathname === "/settings" ? "text-[#3d3b33] dark:text-[#fff]" : "text-[#888888] dark:text-[#a0a0a0] hover:text-[#3d3b33] dark:hover:text-[#fff]"
          }`}
        >
          <Settings className="w-[20px] h-[20px]" strokeWidth={pathname === "/settings" ? 2.5 : 2} />
          <span className={`text-[9px] font-medium tracking-wide ${pathname === "/settings" ? "opacity-100" : "opacity-70"}`}>
            Settings
          </span>
        </Link>
      </nav>
    </>
  );
}