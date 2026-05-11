// frontend/components/ui/SidebarNav.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";
import { Home, CheckSquare, BarChart2, PanelLeftClose, PanelLeft, Sun, FileText, CalendarDays, User } from "lucide-react";

export default function SidebarNav() {
  const pathname = usePathname();
  
  const { isSidebarPinned, toggleSidebarPin, isSidebarIconPinned, toggleSidebarIconPin, mobileNoteOpen, isEditorFullscreen } = useUiStore();
  const [isHovered, setIsHovered] = useState(false);
  const[isAsleep, setIsAsleep] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  
  // Cache user avatar for instant load
  const [userAvatar, setUserAvatar] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('chronoa_avatar');
    return null;
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setUserAvatar(user.user_metadata.avatar_url);
        localStorage.setItem('chronoa_avatar', user.user_metadata.avatar_url);
      }
    });
  },[]);

  // Update spinKey on pathname change to trigger re-animation on the Sun logo
  useEffect(() => {
    setSpinKey(prev => prev + 1);
  }, [pathname]);

  // Auto-close to asleep (hidden) state in 3 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isSidebarPinned && !isHovered && !touchOpen) {
      timeout = setTimeout(() => setIsAsleep(true), 3000);
    } else {
      setIsAsleep(false);
    }
    return () => clearTimeout(timeout);
  }, [isSidebarPinned, isHovered, touchOpen]);

  // Handle iPad / Touch device interactions
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const isTouch = window.matchMedia('(hover: none)').matches || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    
    if (isTouch && (isHovered || touchOpen) && !isSidebarPinned) {
      timeout = setTimeout(() => {
        setIsHovered(false);
        setTouchOpen(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  },[isHovered, touchOpen, isSidebarPinned, pathname]);

  const isExpanded = isSidebarPinned || isHovered || touchOpen;
  const isHiddenMode = !isExpanded && isAsleep && !isSidebarIconPinned;

  const desktopNavItems =[
    { name: "Home", href: "/home", icon: Home },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
  ];

  const mobileNavItems =[
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "Home", href: "/home", icon: Sun, isLogo: true },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
  ];

  const currentItem = desktopNavItems.find(item => item.href === pathname) || { 
    name: pathname === '/settings' ? 'Profile' : pathname === '/sessions' ? 'Time Log' : 'Chronoa' 
  };

  const handleTabClick = (e: React.MouseEvent, href: string, isActive: boolean) => {
    if (isActive) {
      e.preventDefault();
      setSpinKey(prev => prev + 1); // Triggers re-spin if actively tapped again
      window.dispatchEvent(new CustomEvent('chronoa-reset-tab', { detail: href }));
      
      const containers =["notes-library-scroll-container", "notes-scroll-container", "tasks-scroll-container", "analytics-scroll-container", "sessions-scroll-container", "settings-scroll-container"];
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
          ${isEditorFullscreen ? 'w-0 opacity-0 overflow-hidden !border-none' : isExpanded ? 'w-60' : isHiddenMode ? 'w-10' : 'w-20'}
        `}
      >
        {/* Tappable Vertical Text Area */}
        <div 
          onClick={() => {
            if (isHiddenMode) setTouchOpen(true);
          }}
          className={`absolute top-1/2 left-11 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 delay-100 flex items-center justify-center w-10 z-30 ${
          isHiddenMode && !isEditorFullscreen ? 'opacity-100 pointer-events-auto cursor-pointer' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="-rotate-90 flex items-center gap-3">
             <Sun key={`vert-logo-${spinKey}`} size={16} className="text-[#c2956e] dark:text-[#b0855f] animate-spin-once shrink-0" />
             <span className="whitespace-nowrap text-[10px] tracking-[0.4em] uppercase font-bold text-[#b0ad9a] dark:text-[#7a7a7a]">
               {currentItem.name}
             </span>
          </div>
        </div>

        <div className={`absolute inset-y-0 left-0 h-full bg-[#f7f5f0] dark:bg-[#161616] flex flex-col z-40 transition-all duration-500 ease-in-out overflow-hidden ${
          isEditorFullscreen ? 'w-0 border-none shadow-none -translate-x-full' :
          isExpanded ? 'w-60 translate-x-0 border-r border-[#e0ddd5] dark:border-[#2a2a2a] shadow-xl shadow-[#e0ddd5]/50 dark:shadow-black/50' : 
          isHiddenMode ? 'w-20 -translate-x-full border-r border-[#e0ddd5] dark:border-[#2a2a2a] shadow-none' : 
          'w-20 translate-x-0 border-r border-[#e0ddd5] dark:border-[#2a2a2a] shadow-none'
        }`}>
          
          <div className="flex items-center h-24 relative shrink-0">
            {/* Expanded State with Text + Logo */}
            <div className={`absolute inset-0 flex items-center px-6 gap-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <Sun 
                 className={`text-[#c2956e] dark:text-[#b0855f] shrink-0 transition-transform duration-700 ease-out ${isExpanded ? 'rotate-45 scale-110' : 'rotate-0 scale-100'}`} 
                 size={28} 
              />
              <h2 className="text-3xl text-[#3d3b33] dark:text-[#e0e0e0] font-serif tracking-tight mt-1" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
                Chronoa
              </h2>
            </div>
            
            {/* Collapsed State with smaller Logo only */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <Sun 
                 className={`text-[#c2956e] dark:text-[#b0855f] transition-transform duration-700 ease-out ${isExpanded ? 'rotate-45 scale-110' : 'rotate-0 scale-100'}`} 
                 size={22} 
               />
            </div>
          </div>

          <nav className="flex-1 space-y-2 pt-4 overflow-y-auto no-scrollbar pb-4">
            {desktopNavItems.map((item) => {
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
              <div className="w-[32px] h-[32px] flex items-center justify-center shrink-0">
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-[30px] h-[30px] rounded-full object-cover border-[2px] border-[#d4d0c8] dark:border-[#444] shadow-sm" />
                ) : (
                  <User className="w-[22px] h-[22px] text-[#888] dark:text-[#a0a0a0]" />
                )}
              </div>
               <span className={`transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                Profile
              </span>
            </Link>
          </div>
        </div>

        {/* Full Pin Button */}
        <button
          onClick={toggleSidebarPin}
          data-tooltip-id="global-tooltip" data-tooltip-content={isSidebarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
          className={`hidden md:flex items-center justify-center absolute bottom-42 right-0 translate-x-1/2 z-50 p-2 bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-full shadow-lg transition-all duration-500 ease-in-out
            ${isSidebarPinned ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#888] dark:text-[#a0a0a0] md:hover:text-[#c2956e] md:dark:hover:text-[#d1a784]'}
            ${(isHiddenMode || isEditorFullscreen) ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}
          `}
        >
          <PanelLeftClose size={16} />
        </button>

        {/* Icon Pin Button */}
        <button
          onClick={toggleSidebarIconPin}
          data-tooltip-id="global-tooltip" data-tooltip-content={isSidebarIconPinned ? "Auto-hide Sidebar completely" : "Keep Icons visible"}
          className={`hidden md:flex items-center justify-center absolute bottom-30 right-0 translate-x-1/2 z-50 p-2 bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-full shadow-lg transition-all duration-500 ease-in-out
            ${isSidebarIconPinned ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#888] dark:text-[#a0a0a0] md:hover:text-[#c2956e] md:dark:hover:text-[#d1a784]'}
            ${(isHiddenMode || isEditorFullscreen) ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}
          `}
        >
          <PanelLeft size={16} />
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full h-[calc(82px+env(safe-area-inset-bottom))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-0 px-6 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-t border-[#e0ddd5] dark:border-[#2a2a2a] flex items-center justify-between z-[100] transition-transform duration-300 ease-in-out overflow-x-auto no-scrollbar ${mobileNoteOpen || isEditorFullscreen ? 'translate-y-full' : 'translate-y-0'}`}>
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleTabClick(e, item.href, isActive)}
              className={`flex items-center justify-center shrink-0 transition-all ${
                item.isLogo ? 'w-[56px] h-[56px]' : 'w-[50px] h-[50px]'
              } ${
                isActive ? "text-[#c2956e] dark:text-[#d1a784]" : "text-[#888888] dark:text-[#a0a0a0] active:text-[#3d3b33] dark:active:text-[#fff]"
              }`}
            >
              {item.isLogo ? (
                <item.icon 
                  key={`mob-logo-${isActive ? spinKey : ''}`}
                  className={`shrink-0 transition-transform ${isActive ? 'animate-spin-once text-[#c2956e] dark:text-[#d1a784]' : ''}`} 
                  style={{ width: 32, height: 32 }}
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              ) : (
                <item.icon className="w-[24px] h-[24px]" strokeWidth={isActive ? 2.5 : 2} />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}