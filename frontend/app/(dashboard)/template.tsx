// frontend/app/(dashboard)/template.tsx
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

let hasMountedDashboard = false;

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hasMountedDashboard = true;
  }, []);

  return (
    <motion.div
      initial={hasMountedDashboard ? { opacity: 0.92 } : false}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}