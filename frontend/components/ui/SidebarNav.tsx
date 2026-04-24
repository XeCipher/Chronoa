"use client";

import Link from 'next/link'
import { usePathname, useRouter } from "next/navigation";
import { Home, CheckSquare, BookOpen, BarChart2, Settings, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

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

  return (
    <div className="w-64 h-full bg-[#f7f5f0] border-r border-[#e0ddd5] flex flex-col px-6 py-8 z-50">
      <div className="mb-12 pl-2">
        <h2 className="text-3xl text-[#3d3b33] tracking-tight" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
          Chronoa
        </h2>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#c2956e] shadow-sm border border-[#e0ddd5]/50"
                  : "text-[#888888] hover:bg-[#e0ddd5]/30 hover:text-[#3d3b33]"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-8 border-t border-[#e0ddd5]/50">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            pathname === "/settings" ? "bg-white text-[#3d3b33] shadow-sm" : "text-[#888888] hover:bg-[#e0ddd5]/30 hover:text-[#3d3b33]"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#888888] hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}