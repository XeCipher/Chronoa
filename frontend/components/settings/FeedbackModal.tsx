// frontend/components/settings/FeedbackModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { X, ImagePlus, Trash2, Star, Send, Loader2, MessageSquareHeart, ChevronLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Details, 2: Rating, 3: Success
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setTitle("");
        setDescription("");
        setFiles([]);
        setPreviews([]);
        setRating(0);
        setError(null);
        setIsSubmitting(false);
      }, 300);
    } else {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const remainingSlots = 5 - files.length;
      const validFiles = selected.slice(0, remainingSlots);

      if (selected.length > remainingSlots) {
        setError("You can only upload a maximum of 5 images.");
        setTimeout(() => setError(null), 3000);
      }

      setFiles(prev => [...prev, ...validFiles]);
      
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    const formUrl = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL;
    if (!formUrl) {
      setError("Feedback URL is not configured. Please contact support.");
      console.error("Error: NEXT_PUBLIC_FEEDBACK_FORM_URL is not set in your .env.local file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Gather User Context from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      let userName = 'Anonymous';
      let userEmail = 'No Email';
      let avatarUrl = 'None';
      let joinedDate = 'Unknown';
      let weatherCity = 'None';
      let lastCelebratedLevel = '0';

      if (user) {
        userName = user.user_metadata?.full_name || 'Anonymous';
        userEmail = user.email || 'No Email';
        avatarUrl = user.user_metadata?.avatar_url || 'None';
        joinedDate = new Date(user.created_at).toLocaleDateString();

        const { data: profile } = await supabase
          .from('profiles')
          .select('weather_city, last_celebrated_level')
          .eq('id', user.id)
          .single();

        if (profile) {
          weatherCity = profile.weather_city || 'None';
          lastCelebratedLevel = String(profile.last_celebrated_level || 0);
        }
      }

      // 2. Upload Images to Supabase Storage
      const uploadedUrls: string[] = [];
      if (files.length > 0 && user) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('feedback_images')
            .upload(filePath, file);

          if (!uploadError) {
            const { data } = supabase.storage.from('feedback_images').getPublicUrl(filePath);
            uploadedUrls.push(data.publicUrl);
          }
        }
      }

      // 3. Post data to Google Forms
      const formData = new URLSearchParams();
      formData.append('entry.1992373351', title);
      formData.append('entry.1365090192', description);
      formData.append('entry.823341020', `${rating} out of 5`);
      formData.append('entry.1374913440', uploadedUrls.length > 0 ? uploadedUrls.join('\n') : 'No images attached');
      formData.append('entry.246438239', userName);
      formData.append('entry.255459370', userEmail);
      formData.append('entry.1414051630', avatarUrl);
      formData.append('entry.537182725', joinedDate);
      formData.append('entry.1722269587', weatherCity);
      formData.append('entry.466313732', lastCelebratedLevel);

      await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors', // Essential for submitting to Google Forms from browser
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      // 4. Success Step
      setStep(3);
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setError("An error occurred while sending feedback. Please try again.");
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
            {step === 2 && (
               <button onClick={() => setStep(1)} className="p-1.5 -ml-1.5 rounded-full text-[#888] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                 <ChevronLeft size={20} />
               </button>
            )}
            <div className="flex flex-col gap-0.5">
              <h3 className="text-xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] font-medium flex items-center gap-2">
                {step === 3 ? "Thank You!" : "Share Feedback"} 
                {step === 1 && <MessageSquareHeart size={18} className="text-[#c2956e]" />}
              </h3>
              <div className="text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] uppercase tracking-widest mt-0.5">
                {step === 1 ? "Help us improve Chronoa" : step === 2 ? "Rate your experience" : "Feedback received"}
              </div>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 text-gray-400 hover:text-[#3d3b33] dark:hover:text-white bg-gray-50 dark:bg-[#252525] hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition-colors disabled:opacity-50">
            <X size={18} />
          </button>
        </header>

        {/* Dynamic Content */}
        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1 relative min-h-[300px]">
          
          {error && (
            <div className="absolute top-4 left-6 right-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center animate-fade-in z-10">
              {error}
            </div>
          )}

          {/* STEP 1: Details */}
          <div className={`space-y-5 transition-all duration-300 ${step === 1 ? 'opacity-100 translate-x-0 relative' : 'opacity-0 -translate-x-10 absolute inset-0 pointer-events-none'}`}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Title</label>
              <input 
                type="text" 
                placeholder="What is this regarding?" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Description</label>
              <textarea 
                placeholder="Please provide details, feature requests, or bug descriptions..." 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-4 py-3.5 min-h-[120px] text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors resize-none shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Attachments</label>
                 <span className="text-[10px] font-bold text-[#b0ad9a]">{files.length} / 5</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#e0ddd5] dark:border-[#333] group bg-[#ebe8e2] dark:bg-[#222]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Upload ${i+1}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeFile(i)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                {files.length < 5 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#d4d0c8] dark:border-[#444] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#c2956e] dark:hover:border-[#b0855f] hover:text-[#c2956e] dark:hover:text-[#b0855f] text-[#b0ad9a] dark:text-[#7a7a7a] transition-colors bg-white/50 dark:bg-[#252525]/50 hover:bg-white dark:hover:bg-[#252525]">
                    <ImagePlus size={20} />
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Rating */}
          <div className={`flex flex-col items-center justify-center h-full transition-all duration-300 ${step === 2 ? 'opacity-100 translate-x-0 relative' : 'opacity-0 translate-x-10 absolute inset-0 pointer-events-none'}`}>
             <div className="w-16 h-16 bg-[#c2956e]/10 dark:bg-[#b0855f]/10 rounded-full flex items-center justify-center mb-6">
                <Star size={32} className="text-[#c2956e] dark:text-[#d1a784] fill-current" />
             </div>
             <h4 className="text-2xl font-serif text-[#3d3b33] dark:text-white mb-2 text-center">How would you rate Chronoa?</h4>
             <p className="text-xs text-[#888] dark:text-[#7a7a7a] text-center max-w-[250px] mb-8">
               Your honest rating helps us improve the experience for everyone.
             </p>
             
             <div className="flex items-center gap-2 mb-4">
               {[1, 2, 3, 4, 5].map(star => (
                 <button
                   key={star}
                   onClick={() => setRating(star)}
                   onMouseEnter={() => setHoveredStar(star)}
                   onMouseLeave={() => setHoveredStar(0)}
                   className="p-1 transform transition-transform hover:scale-110 outline-none"
                 >
                   <Star 
                     size={40} 
                     className={`transition-colors duration-200 ${(hoveredStar || rating) >= star ? 'text-[#c2956e] dark:text-[#d1a784] fill-current' : 'text-[#d4d0c8] dark:text-[#444]'}`} 
                     strokeWidth={1.5}
                   />
                 </button>
               ))}
             </div>
             <div className="h-4 text-[10px] font-bold uppercase tracking-widest text-[#c2956e] dark:text-[#d1a784]">
               {rating > 0 && `${rating} out of 5 stars`}
             </div>
          </div>

          {/* STEP 3: Success */}
          <div className={`flex flex-col items-center justify-center h-full transition-all duration-500 ${step === 3 ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'}`}>
             <div className="w-20 h-20 bg-[#7ca982]/10 dark:bg-[#6a9a70]/20 rounded-full flex items-center justify-center mb-6 text-[#7ca982] dark:text-[#8cbd92]">
                <CheckCircle2 size={40} strokeWidth={2.5} />
             </div>
             <h4 className="text-3xl font-serif text-[#3d3b33] dark:text-white mb-2 text-center">Feedback Sent</h4>
             <p className="text-sm text-[#888] dark:text-[#7a7a7a] text-center max-w-[300px] leading-relaxed">
               Thank you for taking the time to help us refine your workspace. 
             </p>
          </div>

        </div>

        {/* Footer */}
        {step !== 3 && (
          <footer className="px-6 py-5 border-t border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-end gap-3 bg-[#f7f5f0] dark:bg-[#161616] shrink-0">
            <button onClick={onClose} disabled={isSubmitting} className="px-5 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[#888] hover:bg-white dark:hover:bg-[#2a2a2a] hover:text-[#3d3b33] dark:hover:text-white transition-colors disabled:opacity-50 border border-transparent hover:border-[#e0ddd5] dark:hover:border-[#444] shadow-sm">
              Cancel
            </button>
            
            {step === 1 ? (
              <button 
                onClick={() => setStep(2)} 
                disabled={!title.trim() || !description.trim()}
                className="px-8 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white bg-[#3d3b33] dark:bg-[#f0f0f0] dark:text-[#1a1a1a] hover:bg-black dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
              >
                Continue
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                disabled={rating === 0 || isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white bg-[#c2956e] dark:bg-[#b0855f] hover:bg-[#b0855f] dark:hover:bg-[#9e7653] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><Send size={16} /> Submit Feedback</>
                )}
              </button>
            )}
          </footer>
        )}

      </div>
    </div>
  );
}