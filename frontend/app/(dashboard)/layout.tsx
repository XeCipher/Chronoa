"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SidebarNav from "@/components/ui/SidebarNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
      else setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) return <div className="min-h-screen bg-[#f7f5f0]" />;

  return (
    <div className="flex h-screen w-full bg-[#f7f5f0] overflow-hidden">
      <SidebarNav />
      {/* We use w-full and min-w-0 here to ensure the main area expands correctly */}
      <main className="flex-1 h-full overflow-y-auto relative min-w-0">
        {children}
      </main>
    </div>
  );
}