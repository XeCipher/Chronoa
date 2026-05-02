// frontend/app/(dashboard)/template.tsx
"use client";

import { motion } from "framer-motion";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
      // FIXED: Restored 'transform' properties explicitly to none upon animation finish so fixed positioned elements do not get constrained & scroll within it
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { transform: "none", filter: "none" } }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1], // Custom fluid easing
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}