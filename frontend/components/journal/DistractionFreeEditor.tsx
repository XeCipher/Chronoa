"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUiStore } from "@/store/uiStore";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Clock, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2 } from "lucide-react";

export default function DistractionFreeEditor({ initialContent, date }: { initialContent: string, date: string }) {
  const { journalZoom, setJournalZoom } = useUiStore();
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [showToolbar, setShowToolbar] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2] } }), Underline],
    content: initialContent,
    editorProps: { attributes: { class: 'chronoa-editor focus:outline-none w-full min-h-[700px] pt-2 pb-20 text-[#3d3b33] dark:text-[#e0e0e0] selection:bg-[#c2956e]/20 dark:selection:bg-[#b0855f]/40' } },
    onUpdate: ({ editor }) => {
      setShowToolbar(!editor.state.selection.empty);
      setSaveStatus("Saving...");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        const html = editor.getHTML();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('journal_entries').upsert({ user_id: user.id, entry_date: date, content: html, updated_at: new Date().toISOString() }, { onConflict: 'user_id,entry_date' });
          setSaveStatus("Saved");
        }
      }, 1500);
    },
    onSelectionUpdate: ({ editor }) => { setShowToolbar(!editor.state.selection.empty); },
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if(editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
      setSaveStatus("Saved");
    }
  }, [initialContent, date, editor]);

  const insertTimestamp = () => {
    if (!editor) return;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isAtStart = editor.state.selection.anchor <= 1;
    const content = isAtStart ? `<p><strong>${timeString}</strong></p><p></p>` : `<p></p><p><strong>${timeString}</strong></p><p></p>`;
    editor.chain().focus().insertContent(content).run();
  };
  
  if (!editor) return null;

  return (
    <div className="relative flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4 z-20">
        <div className="flex items-center gap-3">
          <div className={`text-[10px] uppercase tracking-widest font-bold ${saveStatus === 'Saving...' ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#b0ad9a] dark:text-[#7a7a7a]'}`}>
            {saveStatus}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={insertTimestamp} title="Insert Timestamp" className="p-2 text-[#b0ad9a] dark:text-[#7a7a7a] hover:text-[#c2956e] dark:hover:text-[#d1a784] transition-colors"><Clock size={18} /></button>
          <div className="flex items-center gap-2 text-xs font-bold text-[#888] dark:text-[#ccc] bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] px-3 py-1.5 rounded-full">
            <button onClick={() => setJournalZoom(Math.max(50, journalZoom - 10))}>-</button>
            <span className="w-10 text-center">{journalZoom}%</span>
            <button onClick={() => setJournalZoom(Math.min(200, journalZoom + 10))}>+</button>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="flex gap-1 bg-[#3d3b33] dark:bg-[#222] text-white p-2 rounded-2xl shadow-2xl items-center border border-white/10 dark:border-white/5">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-xl ${editor.isActive('bold') ? 'bg-[#c2956e] dark:bg-[#b0855f]' : 'hover:bg-white/10'}`}><Bold size={18}/></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-xl ${editor.isActive('italic') ? 'bg-[#c2956e] dark:bg-[#b0855f]' : 'hover:bg-white/10'}`}><Italic size={18}/></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded-xl ${editor.isActive('underline') ? 'bg-[#c2956e] dark:bg-[#b0855f]' : 'hover:bg-white/10'}`}><UnderlineIcon size={18}/></button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded-xl ${editor.isActive('heading', { level: 1 }) ? 'bg-[#c2956e] dark:bg-[#b0855f]' : 'hover:bg-white/10'}`}><Heading1 size={18}/></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded-xl ${editor.isActive('heading', { level: 2 }) ? 'bg-[#c2956e] dark:bg-[#b0855f]' : 'hover:bg-white/10'}`}><Heading2 size={18}/></button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-xl ${editor.isActive('bulletList') ? 'bg-[#c2956e] dark:bg-[#b0855f]' : 'hover:bg-white/10'}`}><List size={18}/></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-xl ${editor.isActive('orderedList') ? 'bg-[#c2956e] dark:bg-[#b0855f]' : 'hover:bg-white/10'}`}><ListOrdered size={18}/></button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto no-scrollbar scroll-smooth">
        <div style={{ fontSize: `${(journalZoom / 100) * 1.15}rem`, fontFamily: 'system-ui, -apple-system, sans-serif' }} className="w-full max-w-none">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}