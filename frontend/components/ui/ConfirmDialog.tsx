// frontend/components/ui/ConfirmDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useUiStore } from "@/store/uiStore";
import { AlertTriangle, Info, Edit3 } from "lucide-react";

export default function ConfirmDialog() {
  const { confirmDialog, closeConfirmDialog } = useUiStore();
  const[inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (confirmDialog?.isPrompt) {
      setInputValue(confirmDialog.promptDefaultValue || "");
    } else {
      setInputValue("");
    }
  }, [confirmDialog]);

  if (!confirmDialog) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in transition-all">
      <div className="bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-fade-up flex flex-col items-center text-center">
        
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${confirmDialog.isDestructive ? 'bg-[#d45b5b]/10 text-[#d45b5b] dark:bg-[#d45b5b]/20 dark:text-[#e07a7a]' : 'bg-[#c2956e]/20 text-[#c2956e] dark:bg-[#b0855f]/20 dark:text-[#d1a784]'}`}>
           {confirmDialog.isDestructive ? <AlertTriangle size={28} /> : (confirmDialog.isPrompt ? <Edit3 size={28} /> : <Info size={28} />)}
        </div>
        
        <h3 className="text-2xl md:text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-2 leading-tight">
          {confirmDialog.title}
        </h3>
        
        <p className={`text-[13px] text-[#888] dark:text-[#7a7a7a] leading-relaxed px-2 ${confirmDialog.isPrompt ? 'mb-4' : 'mb-8'}`}>
          {confirmDialog.message}
        </p>

        {confirmDialog.isPrompt && (
          <div className="w-full mb-8">
            <input 
              type="text" 
              autoFocus 
              placeholder={confirmDialog.promptPlaceholder || "Enter value..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (inputValue.trim()) {
                     confirmDialog.onConfirm(inputValue);
                     closeConfirmDialog();
                  }
                }
              }}
              spellCheck={false}
              className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#444] rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors shadow-sm"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3">
           {confirmDialog.secondaryAction && (
             <button 
               onClick={() => { confirmDialog.secondaryAction!.onClick(); closeConfirmDialog(); }} 
               className="flex-1 px-3 py-3.5 rounded-xl bg-[#ebe8e2] dark:bg-[#2a2a2a] border border-[#e0ddd5] dark:border-[#444] text-[#888] dark:text-[#a0a0a0] font-bold text-[10px] sm:text-[11px] uppercase tracking-widest hover:text-[#3d3b33] dark:hover:text-white transition-colors shadow-sm"
             >
               {confirmDialog.secondaryAction.text}
             </button>
           )}
           <button 
             onClick={closeConfirmDialog} 
             className="flex-1 px-3 py-3.5 rounded-xl bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] text-[#888] font-bold text-[10px] sm:text-[11px] uppercase tracking-widest hover:text-[#3d3b33] dark:hover:text-white transition-colors shadow-sm"
           >
              {confirmDialog.cancelText || "Cancel"}
           </button>
           <button 
             disabled={confirmDialog.isPrompt && !inputValue.trim()}
             onClick={() => { confirmDialog.onConfirm(confirmDialog.isPrompt ? inputValue : undefined); closeConfirmDialog(); }} 
             className={`flex-1 px-3 py-3.5 rounded-xl font-bold text-[10px] sm:text-[11px] uppercase tracking-widest text-white transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${confirmDialog.isDestructive ? 'bg-[#d45b5b] hover:bg-[#b94a4a]' : 'bg-[#c2956e] hover:bg-[#b0855f]'}`}
           >
              {confirmDialog.confirmText || "Confirm"}
           </button>
        </div>
        
      </div>
    </div>
  );
}