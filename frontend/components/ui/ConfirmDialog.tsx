// frontend/components/ui/ConfirmDialog.tsx
"use client";

import { useUiStore } from "@/store/uiStore";
import { AlertTriangle, Info } from "lucide-react";

export default function ConfirmDialog() {
  const { confirmDialog, closeConfirmDialog } = useUiStore();

  if (!confirmDialog) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in transition-all">
      <div className="bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-fade-up flex flex-col items-center text-center">
        
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${confirmDialog.isDestructive ? 'bg-red-100 text-red-500 dark:bg-red-900/30' : 'bg-[#c2956e]/20 text-[#c2956e] dark:bg-[#b0855f]/20 dark:text-[#d1a784]'}`}>
           {confirmDialog.isDestructive ? <AlertTriangle size={28} /> : <Info size={28} />}
        </div>
        
        <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-2 leading-tight">
          {confirmDialog.title}
        </h3>
        
        <p className="text-[13px] text-[#888] dark:text-[#7a7a7a] mb-8 leading-relaxed px-2">
          {confirmDialog.message}
        </p>

        <div className="flex w-full gap-3">
           <button 
             onClick={closeConfirmDialog} 
             className="flex-1 px-4 py-3.5 rounded-xl bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] text-[#888] font-bold text-[11px] uppercase tracking-widest hover:text-[#3d3b33] dark:hover:text-white transition-colors shadow-sm"
           >
              {confirmDialog.cancelText || "Cancel"}
           </button>
           <button 
             onClick={() => { confirmDialog.onConfirm(); closeConfirmDialog(); }} 
             className={`flex-1 px-4 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white transition-colors shadow-md ${confirmDialog.isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-[#c2956e] hover:bg-[#b0855f]'}`}
           >
              {confirmDialog.confirmText || "Confirm"}
           </button>
        </div>
        
      </div>
    </div>
  );
}