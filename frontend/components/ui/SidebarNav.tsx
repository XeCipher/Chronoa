// frontend/components/ui/SidebarNav.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/store/uiStore";
import { Home, CheckSquare, BarChart2, Settings, PanelLeftClose, Sun, FileText, CalendarDays } from "lucide-react";

export default function SidebarNav() {
  const pathname = usePathname();
  
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

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
  ];

  const currentItem = navItems.find(item => item.href === pathname) || { 
    name: pathname === '/settings' ? 'Settings' : pathname === '/sessions' ? 'Time Log' : 'Chronoa' 
  };

  const handleTabClick = (e: React.MouseEvent, href: string, isActive: boolean) => {
    if (isActive) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('chronoa-reset-tab', { detail: href }));
      
      const containers = ["notes-library-scroll-container", "notes-scroll-container", "main-scroll-container", "calendar-scroll-container"];
      for (const id of containers) {
        const el = document.getElementById(id);
        if (el) el.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:block relative h-full z-50 transition-all duration-500 ease-in-out shrink-0
          ${isExpanded ? 'w-60' : isHiddenMode ? 'w-10' : 'w-20'}
        `}
      >
        <div className={`absolute top-1/2 left-11 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-500 delay-100 flex items-center justify-center w-10 z-50 ${
          isHiddenMode ? 'opacity-100' : 'opacity-0'
        }`}>
          <span className="-rotate-90 whitespace-nowrap text-[10px] tracking-[0.4em] uppercase font-bold text-[#b0ad9a] dark:text-[#7a7a7a]">
            {currentItem.name}
          </span>
        </div>

        <div className={`absolute inset-y-0 left-0 h-full bg-[#f7f5f0] dark:bg-[#161616] border-r border-[#e0ddd5] dark:border-[#2a2a2a] flex flex-col z-40 transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'w-60 translate-x-0 shadow-xl shadow-[#e0ddd5]/50 dark:shadow-black/50' : 
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

          <nav className="flex-1 space-y-2 pt-4 overflow-y-auto no-scrollbar pb-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleTabClick(e, item.href, isActive)}
                  className={`flex items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden group shrink-0
                    ${isExpanded ? "mx-6 px-4 justify-start gap-4" : "mx-4 justify-center"}
                    ${isActive 
                      ? "bg-white dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] shadow-sm border border-[#e0ddd5] dark:border-[#333]" 
                      : "text-[#888888] dark:text-[#a0a0a0] md:hover:bg-white/50 md:dark:hover:bg-[#2a2a2a] md:hover:text-[#3d3b33] md:dark:hover:text-[#fff]"
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
              onClick={(e) => handleTabClick(e, "/settings", pathname === "/settings")}
              className={`flex items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden shrink-0
                ${isExpanded ? "px-4 justify-start gap-4" : "mx-0 justify-center"}
                ${pathname === "/settings" ? "bg-white dark:bg-[#252525] text-[#3d3b33] dark:text-[#fff] shadow-sm border border-[#e0ddd5] dark:border-[#333]" : "text-[#888888] dark:text-[#a0a0a0] md:hover:bg-white/50 md:dark:hover:bg-[#2a2a2a] md:hover:text-[#3d3b33] md:dark:hover:text-[#fff]"}
              `}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
               <span className={`transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                Settings
              </span>
            </Link>
          </div>
        </div>

        <button
          onClick={toggleSidebarPin}
          data-tooltip-id="global-tooltip" data-tooltip-content={isSidebarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
          className={`hidden md:block absolute top-20 right-0 translate-x-1/2 z-50 p-2 bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-full shadow-lg text-[#888] dark:text-[#a0a0a0] md:hover:text-[#c2956e] md:dark:hover:text-[#d1a784] transition-all duration-500 ease-in-out
            ${isHiddenMode ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}
          `}
        >
          <PanelLeftClose size={16} className={`transition-transform duration-300 ${isSidebarPinned ? '' : 'rotate-180'}`} />
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full h-[calc(82px+env(safe-area-inset-bottom))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-0 px-6 bg-[#f7f5f0]/90 dark:bg-[#121212]/90 backdrop-blur-xl border-t border-[#e0ddd5] dark:border-[#2a2a2a] flex items-center justify-between z-[100] transition-transform duration-300 ease-in-out overflow-x-auto no-scrollbar ${mobileNoteOpen ? 'translate-y-full' : 'translate-y-0'}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleTabClick(e, item.href, isActive)}
              className={`flex items-center justify-center w-[50px] shrink-0 h-[50px] transition-all ${
                isActive ? "text-[#c2956e] dark:text-[#d1a784]" : "text-[#888888] dark:text-[#a0a0a0] active:text-[#3d3b33] dark:active:text-[#fff]"
              }`}
            >
              <item.icon className="w-[24px] h-[24px]" strokeWidth={isActive ? 2.5 : 2} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}