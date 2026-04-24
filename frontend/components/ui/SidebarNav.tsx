"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/store/uiStore";
import { Home, CheckSquare, BookOpen, BarChart2, Settings, LogOut, PanelLeftClose, Sun } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  const { isSidebarPinned, toggleSidebarPin } = useUiStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isAsleep, setIsAsleep] = useState(false);

  // 1. The 5-Second Auto-Hide Timer
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isSidebarPinned && !isHovered) {
      // If not pinned and mouse leaves, start the 5 second countdown to "sleep"
      timeout = setTimeout(() => setIsAsleep(true), 5000);
    } else {
      // Wake up immediately if hovered or pinned
      setIsAsleep(false);
    }
    return () => clearTimeout(timeout);
  }, [isSidebarPinned, isHovered]);

  // 2. Computed States
  const isExpanded = isSidebarPinned || isHovered;
  const isHiddenMode = !isExpanded && isAsleep;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
  ];

  // Get current page name for the vertical text
  const currentItem = navItems.find(item => item.href === pathname) || { name: pathname === '/settings' ? 'Settings' : 'Chronoa' };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // The parent wrapper controls the "document flow" width. w-0 pushes the main content to full screen!
      className={`relative h-full z-50 transition-[width] duration-500 ease-in-out ${
        isExpanded ? 'w-64' : isHiddenMode ? 'w-0' : 'w-20'
      }`}
    >
      {/* Invisible Hover Trigger (Catch the mouse when w-0) */}
      <div className={`absolute inset-y-0 left-0 w-12 z-50 ${isHiddenMode ? 'block' : 'hidden'}`} />

      {/* Floating Vertical Text (Visible only when asleep) */}
      <div className={`absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none transition-all duration-500 delay-100 flex items-center justify-center ${
        isHiddenMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
      }`}>
        <span className="-rotate-90 whitespace-nowrap text-[10px] tracking-[0.4em] uppercase font-bold text-[#b0ad9a]">
          {currentItem.name}
        </span>
      </div>

      {/* The Visual Sidebar Box */}
      <div className={`absolute inset-y-0 left-0 h-full bg-[#f7f5f0] border-r border-[#e0ddd5] flex flex-col z-40 transition-all duration-500 ease-in-out overflow-hidden ${
        isExpanded ? 'w-64 translate-x-0 shadow-xl shadow-[#e0ddd5]/50' : 
        isHiddenMode ? 'w-20 -translate-x-full shadow-none' : 
        'w-20 translate-x-0 shadow-none'
      }`}>
        
        {/* Header with Logo and Pin Button */}
        <div className="flex items-center h-24 relative shrink-0">
          <div className={`absolute inset-0 flex items-center px-8 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <h2 className="text-3xl text-[#3d3b33]" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
              Chronoa
            </h2>
          </div>
          
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <Sun className="text-[#c2956e]" size={22} />
          </div>
          
          {/* Pin Toggle Button */}
          <button
            onClick={toggleSidebarPin}
            className={`absolute top-8 -right-3 z-50 p-1.5 bg-white border border-[#e0ddd5] rounded-full shadow-sm text-[#888] hover:text-[#3d3b33] transition-all duration-300 ${
              isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
            title={isSidebarPinned ? "Unpin Sidebar" : "Pin Sidebar Open"}
          >
            <PanelLeftClose size={14} className={`transition-transform duration-300 ${isSidebarPinned ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Main Navigation */}
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
                    ? "bg-white text-[#c2956e] shadow-sm border border-[#e0ddd5]" 
                    : "text-[#888888] hover:bg-white/50 hover:text-[#3d3b33]"
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

        {/* Footer Navigation */}
        <div className="mt-auto space-y-2 pb-6 pt-4 border-t border-[#e0ddd5]/50 mx-4">
          <Link
            href="/settings"
            className={`flex items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden
              ${isExpanded ? "px-4 justify-start gap-4" : "justify-center"}
              ${pathname === "/settings" ? "bg-white text-[#3d3b33] shadow-sm" : "text-[#888888] hover:bg-white/50 hover:text-[#3d3b33]"}
            `}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
             <span className={`transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              Settings
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className={`flex w-full items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden text-[#888888] hover:bg-red-50 hover:text-red-600
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
    </aside>
  );
}