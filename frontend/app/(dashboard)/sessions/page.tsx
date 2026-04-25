"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, Search, Trash2, Edit2, PlayCircle, Timer, AlertCircle } from "lucide-react";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'timer' | 'stopwatch'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('time_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setSessions(data);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session forever?")) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    await supabase.from('time_sessions').delete().eq('id', id);
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to completely wipe your time tracking history? This cannot be undone.")) return;
    const { data: { user } } = await supabase.auth.getUser();
    setSessions([]);
    await supabase.from('time_sessions').delete().eq('user_id', user?.id);
  };

  const handleSaveEdit = async (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle } : s));
    setEditingId(null);
    await supabase.from('time_sessions').update({ title: editTitle }).eq('id', id);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || s.session_type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-5xl mx-auto p-8 md:p-12 space-y-12 animate-fade-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] text-[#c2956e] tracking-[0.3em] uppercase font-bold mb-2">Chronoa Database</p>
          <h1 className="text-6xl text-[#3d3b33] font-serif italic leading-none">Time Log</h1>
        </div>
        <button onClick={handleDeleteAll} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
          <AlertCircle size={14} /> Wipe History
        </button>
      </header>

      <div className="bg-white border border-[#ebe8e2] rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
            <input 
              type="text" placeholder="Search sessions..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f7f5f0] border border-[#e0ddd5] rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-[#c2956e] text-sm"
            />
          </div>
          <div className="flex bg-[#f7f5f0] border border-[#e0ddd5] p-1 rounded-2xl">
            {['all', 'timer', 'stopwatch'].map(f => (
              <button 
                key={f} onClick={() => setFilter(f as any)}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888] hover:text-[#3d3b33]'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? <div className="h-32 animate-pulse bg-gray-100 rounded-2xl" /> : 
           filteredSessions.length > 0 ? filteredSessions.map(session => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-white border border-[#e0ddd5] rounded-2xl hover:border-[#c2956e]/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${session.session_type === 'timer' ? 'bg-orange-50 text-orange-400' : 'bg-blue-50 text-blue-400'}`}>
                  {session.session_type === 'timer' ? <Timer size={18} /> : <PlayCircle size={18} />}
                </div>
                <div className="flex flex-col">
                  {editingId === session.id ? (
                    <input 
                      autoFocus type="text" value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveEdit(session.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(session.id)}
                      className="border-b border-[#c2956e] outline-none text-[#3d3b33] font-medium pb-0.5"
                    />
                  ) : (
                    <span className="text-[#3d3b33] font-medium">{session.title}</span>
                  )}
                  <span className="text-[10px] text-[#b0ad9a] font-bold uppercase tracking-widest mt-1">
                    {new Date(session.created_at).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <span className="text-xl font-serif italic text-[#3d3b33]">{formatDuration(session.duration_seconds)}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#f7f5f0] p-1 rounded-lg border border-[#e0ddd5]">
                  <button onClick={() => {setEditingId(session.id); setEditTitle(session.title)}} className="p-1.5 text-gray-400 hover:text-[#6e90c2] rounded-md hover:bg-white transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(session.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-white transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 border-2 border-dashed border-[#e0ddd5] rounded-3xl text-gray-400 italic text-sm">
              No sessions found. Start tracking your focus!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}