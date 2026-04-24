"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DistractionFreeEditor from "@/components/journal/DistractionFreeEditor";

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentContent, setCurrentContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    const entry = entries.find(e => e.entry_date === selectedDate);
    setCurrentContent(entry ? entry.content : "<p></p>"); // Default to empty paragraph for tiptap
  }, [selectedDate, entries]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase.from('journal_entries').select('*').order('entry_date', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  const formatDateLabel = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex h-full w-full">
      {/* History Sidebar */}
      <aside className="w-64 border-r border-[#e0ddd5] flex-shrink-0 p-6 overflow-y-auto">
        <h3 className="text-[10px] text-[#b0ad9a] tracking-[0.2em] uppercase font-bold mb-6">Archive</h3>
        <nav className="space-y-1">
          <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedDate === new Date().toISOString().split('T')[0] ? 'bg-[#c2956e] text-white' : 'hover:bg-white text-[#888]'}`}>
            Today
          </button>
          {entries.filter(e => e.entry_date !== new Date().toISOString().split('T')[0]).map(entry => (
            <button key={entry.entry_date} onClick={() => setSelectedDate(entry.entry_date)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedDate === entry.entry_date ? 'bg-[#c2956e] text-white' : 'hover:bg-white text-[#888]'}`}>
              {formatDateLabel(entry.entry_date)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Full-width Editor Container */}
      <main className="flex-1 w-full h-full flex flex-col p-6 lg:p-12 overflow-hidden">
        <header className="mb-6">
          <h1 className="text-5xl text-[#3d3b33] font-serif italic">
            {formatDateLabel(selectedDate)}
          </h1>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 italic">Finding your thoughts...</div>
        ) : (
          <DistractionFreeEditor initialContent={currentContent} date={selectedDate} />
        )}
      </main>
    </div>
  );
}