"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DistractionFreeEditor from "@/components/journal/DistractionFreeEditor";

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    setSelectedDate(new Date().toISOString().split('T')[0]);
    fetchEntries(); 
  }, []);
  
  useEffect(() => {
    if (!selectedDate) return;
    const entry = entries.find(e => e.entry_date === selectedDate);
    setCurrentContent(entry ? entry.content : "<p></p>");
  }, [selectedDate, entries]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase.from('journal_entries').select('*').order('entry_date', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (!selectedDate) return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full">
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[#e0ddd5] dark:border-[#333] flex-shrink-0 p-4 lg:p-6 overflow-x-auto lg:overflow-y-auto">
        <h3 className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] tracking-[0.2em] uppercase font-bold mb-4 lg:mb-6">Archive</h3>
        <nav className="flex lg:flex-col gap-2 lg:space-y-1">
          <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className={`whitespace-nowrap w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedDate === new Date().toISOString().split('T')[0] ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white' : 'hover:bg-white dark:hover:bg-[#1a1a1a] text-[#888] dark:text-[#a0a0a0]'}`}>
            Today
          </button>
          {entries.filter(e => e.entry_date !== new Date().toISOString().split('T')[0]).map(entry => (
            <button key={entry.entry_date} onClick={() => setSelectedDate(entry.entry_date)} className={`whitespace-nowrap w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedDate === entry.entry_date ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white' : 'hover:bg-white dark:hover:bg-[#1a1a1a] text-[#888] dark:text-[#a0a0a0]'}`}>
              {formatDateLabel(entry.entry_date)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 w-full h-full flex flex-col p-4 lg:p-12 overflow-hidden">
        <header className="mb-6">
          <h1 className="text-4xl lg:text-5xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif italic">
            {formatDateLabel(selectedDate)}
          </h1>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#888] dark:text-[#555] italic">Finding your thoughts...</div>
        ) : (
          <DistractionFreeEditor initialContent={currentContent} date={selectedDate} />
        )}
      </main>
    </div>
  );
}