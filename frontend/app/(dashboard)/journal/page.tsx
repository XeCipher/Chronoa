"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import DistractionFreeEditor from "@/components/journal/DistractionFreeEditor";
import { Search } from "lucide-react";

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredEntries = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Ensure "Today" is always present in the array for selection
    const allDisplayEntries = [...entries];
    if (!allDisplayEntries.some(e => e.entry_date === todayStr)) {
      allDisplayEntries.unshift({ entry_date: todayStr, content: "<p></p>" });
    }
    
    // Ensure correct chronological sorting
    allDisplayEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    if (!searchQuery.trim()) return allDisplayEntries;

    const query = searchQuery.toLowerCase();
    
    return allDisplayEntries.filter(entry => {
      const isToday = entry.entry_date === todayStr;
      const dateLabel1 = isToday ? "today" : "";
      const dateLabel2 = formatDateLabel(entry.entry_date).toLowerCase();
      
      // Strip HTML tags for clean text search inside TipTap string content
      const plainContent = (entry.content || "").replace(/<[^>]+>/g, '').toLowerCase();

      return dateLabel1.includes(query) || 
             dateLabel2.includes(query) || 
             plainContent.includes(query);
    });
  }, [entries, searchQuery]);

  if (!selectedDate) return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full">
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[#e0ddd5] dark:border-[#333] flex-shrink-0 p-4 lg:p-6 flex flex-col">
        <h3 className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] tracking-[0.2em] uppercase font-bold mb-4 lg:mb-6 shrink-0">Archive</h3>
        
        <div className="relative mb-4 lg:mb-6 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0ad9a] dark:text-[#7a7a7a]" size={14} />
          <input 
            type="text" 
            placeholder="Search journals..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-[#f0f0f0] transition-colors shadow-sm"
          />
        </div>

        <div className="flex-1 overflow-x-auto lg:overflow-y-auto no-scrollbar min-h-0">
          <nav className="flex lg:flex-col gap-2 lg:space-y-1">
            {filteredEntries.map(entry => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = entry.entry_date === todayStr;
              const label = isToday ? "Today" : formatDateLabel(entry.entry_date);
              
              return (
                <button 
                  key={entry.entry_date} 
                  onClick={() => setSelectedDate(entry.entry_date)} 
                  className={`whitespace-nowrap w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedDate === entry.entry_date ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white' : 'hover:bg-white dark:hover:bg-[#1a1a1a] text-[#888] dark:text-[#a0a0a0]'}`}
                >
                  {label}
                </button>
              );
            })}
            
            {filteredEntries.length === 0 && (
              <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] italic px-2 py-4">No entries found.</p>
            )}
          </nav>
        </div>
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