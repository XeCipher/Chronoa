// frontend/app/(dashboard)/template.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUiStore } from "@/store/uiStore";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasDashboardMounted = useUiStore((state) => state.hasDashboardMounted);
  const setHasDashboardMounted = useUiStore((state) => state.setHasDashboardMounted);

  // Skip the crossfade when Settings slides in on mobile so the horizontal push stays opaque
  const [shouldFade] = useState(() => {
    if (!hasDashboardMounted) return false;
    if (typeof window !== "undefined" && window.innerWidth < 768 && pathname === "/settings") {
      return false;
    }
    return true;
  });

  // Use a brisk fade-in when returning from Settings on mobile so there is no sluggish pause
  const [isQuickReturnFade] = useState(() => {
    if (!hasDashboardMounted) return false;
    if (typeof window === "undefined" || window.innerWidth >= 768) return false;
    return useUiStore.getState().lastVisitedPage === "/settings";
  });

  useEffect(() => {
    if (!hasDashboardMounted) {
      setHasDashboardMounted(true);
    }
  }, [hasDashboardMounted, setHasDashboardMounted]);

  return (
    <motion.div
      initial={shouldFade ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{
        duration: isQuickReturnFade ? 0.22 : 0.48,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}