// frontend/components/landing/DeveloperMessageModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Send, Loader2, MessageSquareHeart, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeveloperMessageModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Form, 2: Success
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setEmail("");
        setSubject("");
        setMessage("");
        setError(null);
        setIsSubmitting(false);
      }, 300);
    } else {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const formUrl = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL;
    if (!formUrl) {
      setError("Contact URL is not configured. Please report this issue via GitHub.");
      console.error("Error: NEXT_PUBLIC_FEEDBACK_FORM_URL is not set.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('entry.1992373351', subject);
      formData.append('entry.1365090192', message);
      formData.append('entry.823341020', 'N/A'); // Rating
      formData.append('entry.1374913440', 'No images attached'); // Images
      formData.append('entry.246438239', 'Anonymous (Landing Page)'); // Name
      formData.append('entry.255459370', email || 'No Email'); // Email
      formData.append('entry.1414051630', 'None'); // Avatar
      formData.append('entry.537182725', 'N/A'); // Joined Date
      formData.append('entry.1722269587', 'N/A'); // Weather City
      formData.append('entry.466313732', '0'); // Level

      await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      setStep(2);
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setError("An error occurred while sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Header */}
        <header className="px-6 py-5 border-b border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-between items-center bg-white dark:bg-[#1e1e1e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] font-medium flex items-center gap-2">
                {step === 2 ? "Message Sent!" : "Message Developer"} 
                {step === 1 && <MessageSquareHeart size={18} className="text-[#c2956e]" />}
              </h3>
              <div className="text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] uppercase tracking-widest mt-0.5">
                {step === 1 ? "We review every submission" : "Received"}
              </div>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 text-gray-400 hover:text-[#3d3b33] dark:hover:text-white bg-gray-50 dark:bg-[#252525] hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition-colors disabled:opacity-50">
            <X size={18} />
          </button>
        </header>

        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1 relative min-h-[300px]">
          {error && (
            <div className="absolute top-4 left-6 right-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center animate-fade-in z-10">
              {error}
            </div>
          )}

          {/* STEP 1: Form */}
          <div className={`space-y-6 transition-all duration-300 ${step === 1 ? 'opacity-100 translate-x-0 relative' : 'opacity-0 -translate-x-10 absolute inset-0 pointer-events-none'}`}>
            <p className="text-xs text-[#888] dark:text-[#a0a0a0] leading-relaxed">
              Have a feature request, found a bug, or just want to reach out? Drop a message below. We usually review and respond within 24 hours.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Email <span className="text-[#b0ad9a]">(Optional)</span></label>
              <input 
                type="email" 
                placeholder="your@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors shadow-sm"
              />
              <p className="text-[9px] text-[#b0ad9a] dark:text-[#7a7a7a] font-bold uppercase tracking-wider ml-1 mt-1">
                In order to reply, we are collecting your email.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Subject</label>
              <input 
                type="text" 
                placeholder="What is this regarding?" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Message</label>
              <textarea 
                placeholder="Please provide details..." 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-4 py-3.5 min-h-[120px] text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors resize-none shadow-sm"
              />
            </div>
          </div>

          {/* STEP 2: Success */}
          <div className={`flex flex-col items-center justify-center h-full transition-all duration-500 ${step === 2 ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'}`}>
             <div className="w-20 h-20 bg-[#7ca982]/10 dark:bg-[#6a9a70]/20 rounded-full flex items-center justify-center mb-6 text-[#7ca982] dark:text-[#8cbd92]">
                <CheckCircle2 size={40} strokeWidth={2.5} />
             </div>
             <h4 className="text-3xl font-serif text-[#3d3b33] dark:text-white mb-2 text-center">Message Delivered</h4>
             <p className="text-sm text-[#888] dark:text-[#7a7a7a] text-center max-w-[300px] leading-relaxed">
               Thank you for reaching out. Your feedback makes Chronoa better for everyone.
             </p>
          </div>
        </div>

        {/* Footer */}
        {step !== 2 && (
          <footer className="px-6 py-5 border-t border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-end gap-3 bg-[#f7f5f0] dark:bg-[#161616] shrink-0">
            <button onClick={onClose} disabled={isSubmitting} className="px-5 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[#888] hover:bg-white dark:hover:bg-[#2a2a2a] hover:text-[#3d3b33] dark:hover:text-white transition-colors disabled:opacity-50 border border-transparent hover:border-[#e0ddd5] dark:hover:border-[#444] shadow-sm">
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={!subject.trim() || !message.trim() || isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white bg-[#c2956e] dark:bg-[#b0855f] hover:bg-[#b0855f] dark:hover:bg-[#9e7653] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Sending...</>
              ) : (
                <><Send size={16} /> Send Message</>
              )}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}