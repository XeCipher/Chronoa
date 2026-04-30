// frontend/components/notes/DistractionFreeEditor.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useUiStore } from "@/store/uiStore";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Clock, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2 } from "lucide-react";

interface EditorProps {
  initialContent: string;
  isEditable?: boolean;
  onSave: (content: string) => void;
}

export default function DistractionFreeEditor({ initialContent, isEditable = true, onSave }: EditorProps) {
  const { journalZoom, setJournalZoom } = useUiStore();
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [showToolbar, setShowToolbar] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    editable: isEditable,
    extensions: [StarterKit.configure({ heading: { levels: [1, 2] } }), Underline],
    content: initialContent,
    editorProps: { 
      attributes: { 
        class: 'chronoa-editor focus:outline-none w-full min-h-[500px] text-[#3d3b33] dark:text-[#e0e0e0] selection:bg-[#c2956e]/20 dark:selection:bg-[#b0855f]/40' 
      } 
    },
    onUpdate: ({ editor }) => {
      if (!isEditable) return;
      setShowToolbar(!editor.state.selection.empty);
      setSaveStatus("Saving...");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSave(editor.getHTML());
        setSaveStatus("Saved");
      }, 1000);
    },
    onSelectionUpdate: ({ editor }) => { 
      if (isEditable) setShowToolbar(!editor.state.selection.empty); 
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const insertTimestamp = () => {
    if (!editor) return;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Logic: Is the cursor at the absolute start of the document (position 0 or 1)?
    const isAtStart = editor.state.selection.anchor <= 1;

    // If at start: No leading line break.
    // If not at start: Exactly one leading line break.
    const content = isAtStart 
      ? `<p><strong>${timeString}</strong></p><p></p>` 
      : `<p></p><p><strong>${timeString}</strong></p><p></p>`;

    editor.chain()
      .focus()
      .insertContent(content)
      .run();
  };
  
  if (!editor) return null;

  return (
    <div className="relative w-full">
      {/* Zoom and Status Controls */}
      <div className="absolute -top-10 right-0 flex items-center gap-4 z-20">
        {isEditable && (
          <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-colors ${saveStatus === 'Saving...' ? 'text-[#c2956e] bg-[#c2956e]/5' : 'text-[#b0ad9a]'}`}>
            {saveStatus}
          </div>
        )}
        <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-[#f0ede8] dark:border-[#2a2a2a] px-2 py-1 rounded-xl shadow-sm">
           <button onClick={() => setJournalZoom(Math.max(50, journalZoom - 10))} className="text-[#888] hover:text-[#c2956e] text-xs font-bold">-</button>
           <span className="text-[9px] font-bold text-[#3d3b33] dark:text-[#f0f0f0] w-6 text-center">{journalZoom}%</span>
           <button onClick={() => setJournalZoom(Math.min(200, journalZoom + 10))} className="text-[#888] hover:text-[#c2956e] text-xs font-bold">+</button>
        </div>
        {isEditable && (
          <button onClick={insertTimestamp} className="p-2 text-[#b0ad9a] hover:text-[#c2956e] transition-colors">
            <Clock size={16} />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div style={{ fontSize: `${(journalZoom / 100) * 1.05}rem`, fontFamily: 'inherit' }}>
        <EditorContent editor={editor} />
      </div>

      {/* Floating Formatting Toolbar - FIXED at bottom of viewport */}
      {isEditable && (
        <div className={`fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${showToolbar ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
          <div className="flex gap-1 bg-[#3d3b33] dark:bg-[#252525] text-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] items-center border border-white/10 backdrop-blur-md">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('bold') ? 'bg-[#c2956e]' : 'hover:bg-white/10'}`}><Bold size={16}/></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('italic') ? 'bg-[#c2956e]' : 'hover:bg-white/10'}`}><Italic size={16}/></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('underline') ? 'bg-[#c2956e]' : 'hover:bg-white/10'}`}><UnderlineIcon size={16}/></button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-[#c2956e]' : 'hover:bg-white/10'}`}><Heading1 size={16}/></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-[#c2956e]' : 'hover:bg-white/10'}`}><Heading2 size={16}/></button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('bulletList') ? 'bg-[#c2956e]' : 'hover:bg-white/10'}`}><List size={16}/></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('orderedList') ? 'bg-[#c2956e]' : 'hover:bg-white/10'}`}><ListOrdered size={16}/></button>
          </div>
        </div>
      )}
    </div>
  );
}