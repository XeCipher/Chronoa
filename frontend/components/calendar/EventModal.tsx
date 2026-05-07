// frontend/components/calendar/EventModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, AlignLeft, Palette, Trash2, CheckCircle2, Repeat, MapPin, Video, Lock } from "lucide-react";
import { CalendarEvent } from "@/types/app.types";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";
import CustomDateTimePicker from "./CustomDateTimePicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>, updateMode: 'this' | 'future', originalEventObj?: CalendarEvent | null) => void;
  onDelete?: (event: CalendarEvent, deleteMode: 'this' | 'future') => void;
  initialEvent?: CalendarEvent | null;
  dragTimeRange?: { start: Date, end: Date } | null;
  defaultBaseDate?: Date | null;
  defaultTitle?: string;
}

const COLORS = [
  { id: 'amber', label: 'Amber', colorClass: 'bg-[#c2956e]' },
  { id: 'blue', label: 'Blue', colorClass: 'bg-blue-500' },
  { id: 'purple', label: 'Purple', colorClass: 'bg-purple-500' },
  { id: 'rose', label: 'Rose', colorClass: 'bg-rose-500' },
  { id: 'emerald', label: 'Emerald', colorClass: 'bg-emerald-500' },
  { id: 'sage', label: 'Sage', colorClass: 'bg-[#7ca982]' },
];

const REPEAT_OPTIONS = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'daily', label: 'Every Day' },
  { id: 'weekly', label: 'Every Week' },
  { id: 'monthly', label: 'Every Month' },
  { id: 'yearly', label: 'Every Year' },
  { id: 'custom', label: 'Custom Days...' }
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'S' },
  { id: 1, label: 'M' },
  { id: 2, label: 'T' },
  { id: 3, label: 'W' },
  { id: 4, label: 'T' },
  { id: 5, label: 'F' },
  { id: 6, label: 'S' }
];

export default function EventModal({ isOpen, onClose, onSave, onDelete, initialEvent, dragTimeRange, defaultBaseDate, defaultTitle }: Props) {
  const { showConfirmDialog } = useUiStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [color, setColor] = useState("amber");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [sourceName, setSourceName] = useState<string | null>(null);
  
  const [repeatSelect, setRepeatSelect] = useState("none");
  const [customDays, setCustomDays] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialEvent) {
        setTitle(initialEvent.title);
        setDescription(initialEvent.description || "");
        setLocation(initialEvent.location || "");
        setMeetingUrl(initialEvent.meeting_url || "");
        setIsAllDay(initialEvent.is_all_day);
        setStartTime(new Date(initialEvent.start_time));
        setEndTime(new Date(initialEvent.end_time));
        setColor(initialEvent.color || "amber");
        setIsReadOnly(initialEvent.is_readonly || false);
        
        if (initialEvent.source_id) {
           supabase.from('calendar_sources').select('name').eq('id', initialEvent.source_id).single().then(({data}) => {
             if (data) setSourceName(data.name);
           });
        } else {
           setSourceName(null);
        }
        
        const pattern = initialEvent.series_id ? (initialEvent.repeat_pattern || 'none') : 'none';
        if (pattern.startsWith('custom:')) {
           setRepeatSelect('custom');
           setCustomDays(pattern.split(':')[1].split(',').map(Number));
        } else {
           setRepeatSelect(pattern);
           setCustomDays([new Date(initialEvent.start_time).getDay()]);
        }
      } else {
        setTitle(defaultTitle || "");
        setDescription("");
        setLocation("");
        setMeetingUrl("");
        setColor("amber");
        setIsAllDay(false);
        setRepeatSelect("none");
        setIsReadOnly(false);
        setSourceName(null);

        if (dragTimeRange) {
          setStartTime(dragTimeRange.start);
          setEndTime(dragTimeRange.end);
          setCustomDays([dragTimeRange.start.getDay()]);
        } else {
          const start = new Date();
          
          if (defaultBaseDate) {
             const isTodayBase = start.getFullYear() === defaultBaseDate.getFullYear() &&
                                 start.getMonth() === defaultBaseDate.getMonth() &&
                                 start.getDate() === defaultBaseDate.getDate();
             if (!isTodayBase) start.setFullYear(defaultBaseDate.getFullYear(), defaultBaseDate.getMonth(), defaultBaseDate.getDate());
          }

          const m = start.getMinutes();
          if (m < 30) start.setMinutes(30, 0, 0);
          else {
             start.setHours(start.getHours() + 1);
             start.setMinutes(0, 0, 0);
          }
          
          const end = new Date(start);
          end.setHours(start.getHours() + 1);
          setStartTime(start);
          setEndTime(end);
          setCustomDays([start.getDay()]);
        }
      }
    }
  }, [isOpen, initialEvent, dragTimeRange, defaultBaseDate, defaultTitle]);

  const isEndTimeInvalid = !isAllDay && endTime <= startTime;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        
        if (isReadOnly) {
          onClose();
          return;
        }
        
        let hasChanges = false;
        if (!initialEvent) {
          hasChanges = title.trim() !== (defaultTitle || "") || description.trim() !== "" || location.trim() !== "" || meetingUrl.trim() !== "";
        } else {
          hasChanges = 
            title !== initialEvent.title ||
            description !== (initialEvent.description || "") ||
            location !== (initialEvent.location || "") ||
            meetingUrl !== (initialEvent.meeting_url || "") ||
            isAllDay !== initialEvent.is_all_day ||
            color !== (initialEvent.color || "amber");
        }

        if (hasChanges) {
          showConfirmDialog({
            title: "Discard Changes?",
            message: "You have unsaved changes. Are you sure you want to discard them?",
            confirmText: "Discard",
            cancelText: "Keep Editing",
            isDestructive: true,
            onConfirm: () => onClose()
          });
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, initialEvent, title, description, location, meetingUrl, isAllDay, color, isReadOnly, onClose, showConfirmDialog, defaultTitle]);

  if (!isOpen) return null;

  const toggleCustomDay = (dayId: number) => {
    if (isReadOnly) return;
    setCustomDays(prev => prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort());
  };

  const getFinalRepeatPattern = () => {
    if (repeatSelect === 'custom') {
      if (customDays.length === 0) return 'none';
      return `custom:${customDays.join(',')}`;
    }
    return repeatSelect;
  };

  const performSave = (updateMode: 'this' | 'future') => {
    let finalStart = new Date(startTime);
    let finalEnd = new Date(endTime);

    if (isAllDay) {
      finalStart.setHours(0, 0, 0, 0);
      finalEnd.setHours(23, 59, 59, 999);
    }

    onSave({
      ...(initialEvent ? { id: initialEvent.id, series_id: initialEvent.series_id } : {}),
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      meeting_url: meetingUrl.trim() || null,
      is_all_day: isAllDay,
      start_time: finalStart.toISOString(),
      end_time: finalEnd.toISOString(),
      color,
      repeat_pattern: getFinalRepeatPattern()
    }, updateMode, initialEvent);
    
    onClose();
  };

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    // If it's a read-only calendar integration, immediately update the entire calendar's colors
    if (isReadOnly && initialEvent?.source_id) {
      await supabase.from('calendar_sources').update({ color: newColor }).eq('id', initialEvent.source_id);
      await supabase.from('calendar_events').update({ color: newColor }).eq('source_id', initialEvent.source_id);
      onSave({ id: initialEvent.id, color: newColor }, 'this', initialEvent);
    }
  };

  const handleSaveWrapper = () => {
    if (isReadOnly || !title.trim() || isEndTimeInvalid) return;

    if (initialEvent && initialEvent.series_id) {
      showConfirmDialog({
        title: "Update Series",
        message: "Do you want to update just this event, or this and all future events?",
        confirmText: "All Future Events",
        cancelText: "Cancel",
        secondaryAction: {
          text: "Only This Event",
          onClick: () => performSave('this')
        },
        onConfirm: () => performSave('future')
      });
    } else {
      performSave('this');
    }
  };

  const handleDeleteWrapper = () => {
    if (isReadOnly || !initialEvent || !onDelete) return;
    if (initialEvent.series_id) {
      showConfirmDialog({
        title: "Delete Series",
        message: "Do you want to delete just this event, or this and all future events?",
        isDestructive: true,
        confirmText: "All Future Events",
        cancelText: "Cancel",
        secondaryAction: {
          text: "Only This Event",
          onClick: () => { onDelete(initialEvent, 'this'); onClose(); }
        },
        onConfirm: () => { onDelete(initialEvent, 'future'); onClose(); }
      });
    } else {
      onDelete(initialEvent, 'this'); 
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-fade-up flex flex-col max-h-[90vh]">

        <header className="px-6 py-5 border-b border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-between items-center bg-white dark:bg-[#1e1e1e] shrink-0 rounded-t-[2.5rem]">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] font-medium">
              {isReadOnly ? "View Event" : (initialEvent ? "Edit Event" : "New Event")}
            </h3>
            {isReadOnly && sourceName && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#888] uppercase tracking-widest mt-1">
                <CalendarIcon size={10} className="mb-[1px]" /> Read-only from {sourceName}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isReadOnly && initialEvent && onDelete && (
               <button onClick={handleDeleteWrapper} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                  <Trash2 size={18} />
               </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-[#3d3b33] dark:hover:text-white bg-gray-50 dark:bg-[#252525] hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar space-y-5 flex-1 min-h-0 w-full relative">
          
          <div className="flex items-center justify-between gap-3 w-full">
            <input 
              autoFocus={!isReadOnly}
              type="text" 
              placeholder="Event Title" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              disabled={isReadOnly}
              className={`flex-1 min-w-0 w-full text-2xl sm:text-3xl font-serif outline-none placeholder:text-[#c4c0b8] dark:placeholder:text-[#555] transition-colors ${isReadOnly ? 'bg-transparent text-[#3d3b33] dark:text-white cursor-default' : 'bg-transparent text-[#3d3b33] dark:text-white'}`}
            />
            {meetingUrl && (
              <button 
                onClick={() => window.open(meetingUrl, '_blank')}
                className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#c2956e] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#b0855f] transition-colors shadow-sm"
              >
                <Video size={14} /> Join
              </button>
            )}
          </div>

          <div className="space-y-4">
            
            <div className={`flex items-center justify-between p-4 bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl shadow-sm ${!isReadOnly ? 'cursor-pointer' : 'opacity-80'}`} onClick={() => !isReadOnly && setIsAllDay(!isAllDay)}>
              <div className="flex items-center gap-3 text-[#3d3b33] dark:text-[#f0f0f0]">
                <CalendarIcon size={18} className="text-[#888]" />
                <span className="text-sm font-medium">All-day</span>
              </div>
              <button disabled={isReadOnly} className={`w-10 h-5 rounded-full transition-colors relative ${isAllDay ? 'bg-[#c2956e]' : 'bg-[#e0ddd5] dark:bg-[#444]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${isAllDay ? 'translate-x-5' : 'translate-x-0.5 shadow-sm'}`} />
              </button>
            </div>

            <div className={`flex flex-col sm:flex-row gap-4 w-full relative ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
               <CustomDateTimePicker value={startTime} onChange={d => !isReadOnly && setStartTime(d)} isAllDay={isAllDay} label="Starts" minDate={undefined} />
               <div className="flex-1 flex flex-col relative">
                  <CustomDateTimePicker value={endTime} onChange={d => !isReadOnly && setEndTime(d)} isAllDay={isAllDay} label="Ends" minDate={startTime} />
                  {isEndTimeInvalid && !isReadOnly && (
                     <span className="absolute -bottom-4 left-1 text-[9px] text-red-500 font-bold uppercase tracking-widest animate-fade-in">Must be after start time</span>
                  )}
               </div>
            </div>

            <div className={`flex flex-col gap-1.5 relative w-full pt-1 ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
               <span className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">Repeat</span>
               <div className="relative">
                 <Repeat size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0ad9a]" />
                 <select 
                   value={repeatSelect} 
                   onChange={e => setRepeatSelect(e.target.value)}
                   disabled={isReadOnly}
                   className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors appearance-none shadow-sm disabled:opacity-100"
                 >
                   {REPEAT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                 </select>
               </div>
            </div>

            {repeatSelect === 'custom' && (
              <div className={`flex justify-between items-center bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl p-2 shadow-sm animate-fade-in ${isReadOnly ? 'opacity-80' : ''}`}>
                 {DAYS_OF_WEEK.map(day => (
                   <button 
                     key={day.id} 
                     disabled={isReadOnly}
                     onClick={() => toggleCustomDay(day.id)}
                     className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${customDays.includes(day.id) ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888] hover:bg-[#f0ede8] dark:hover:bg-[#333]'}`}
                   >
                      {day.label}
                   </button>
                 ))}
              </div>
            )}

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isReadOnly ? 'opacity-90' : ''}`}>
              <div className="relative w-full">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0ad9a]" />
                <input 
                  type="text" placeholder="Location..." 
                  value={location} onChange={e => setLocation(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors shadow-sm disabled:opacity-100"
                />
              </div>
              <div className="relative w-full">
                <Video size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0ad9a]" />
                <input 
                  type="url" placeholder="Meeting URL..." 
                  value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors shadow-sm disabled:opacity-100"
                />
              </div>
            </div>

            <div className={`relative w-full ${isReadOnly ? 'opacity-90' : ''}`}>
              <AlignLeft size={16} className="absolute left-3.5 top-3.5 text-[#b0ad9a]" />
              <textarea 
                placeholder="Description or notes..." 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-10 pr-4 py-3 min-h-[90px] text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors resize-none shadow-sm disabled:opacity-100"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 w-full">
              <div className="flex items-center gap-2">
                 <Palette size={16} className="text-[#b0ad9a] ml-1 shrink-0" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#888] sm:hidden">Color</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                   <button
                     key={c.id}
                     onClick={() => handleColorChange(c.id)}
                     className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${c.colorClass} ${color === c.id ? 'ring-2 ring-offset-2 ring-[#c2956e] dark:ring-offset-[#1a1a1a] scale-110' : 'opacity-80 hover:opacity-100 hover:scale-110'}`}
                   >
                     {color === c.id && <CheckCircle2 size={16} className="text-white drop-shadow-md" />}
                   </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {!isReadOnly && (
          <footer className="px-6 py-5 border-t border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-end gap-3 bg-white dark:bg-[#1e1e1e] shrink-0 rounded-b-[2.5rem]">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[#888] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-[#3d3b33] dark:hover:text-white transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSaveWrapper} 
              disabled={!title.trim() || isEndTimeInvalid}
              className="px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white bg-[#c2956e] hover:bg-[#b0855f] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
            >
              Save Event
            </button>
          </footer>
        )}

      </div>
    </div>
  );
}