// frontend/components/notes/DistractionFreeEditor.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useUiStore } from "@/store/uiStore";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Clock,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
} from "lucide-react";

interface EditorProps {
  initialContent: string;
  isEditable?: boolean;
  onSave: (content: string) => void;
  noteType?: "notes" | "journal";
  entryDate?: string;
}

type ActiveStates = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  heading1: boolean;
  heading2: boolean;
  bulletList: boolean;
  orderedList: boolean;
};

export default function DistractionFreeEditor({
  initialContent,
  isEditable = true,
  onSave,
  noteType = "notes",
  entryDate,
}: EditorProps) {
  const { journalZoom, setJournalZoom } = useUiStore();
  const [saveStatus, setSaveStatus] = useState("Saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const [activeStates, setActiveStates] = useState<ActiveStates>({
    bold: false,
    italic: false,
    underline: false,
    heading1: false,
    heading2: false,
    bulletList: false,
    orderedList: false,
  });

  const editor = useEditor({
    editable: isEditable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Underline,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "chronoa-editor focus:outline-none w-full min-h-[500px] text-[#3d3b33] dark:text-[#e0e0e0]",
        spellcheck: "false",
      },
    },
    onTransaction: ({ editor: ed }) => {
      setActiveStates({
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        heading1: ed.isActive("heading", { level: 1 }),
        heading2: ed.isActive("heading", { level: 2 }),
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
      });
    },
    onUpdate: ({ editor: ed }) => {
      if (!isEditable) return;
      setSaveStatus("Saving...");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSaveRef.current(ed.getHTML());
        setSaveStatus("Saved");
        saveTimeoutRef.current = null;
      }, 1000);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current && editor) {
        clearTimeout(saveTimeoutRef.current);
        onSaveRef.current(editor.getHTML());
      }
    };
  }, [editor]);

  const insertTimestamp = () => {
    if (!editor) return;

    const todayObj = new Date();
    const timeString = todayObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateString = todayObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let displayString = `${dateString}, ${timeString}`;

    if (noteType === "journal" && entryDate) {
      const localTodayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
      if (entryDate === localTodayStr) {
        displayString = timeString;
      }
    }

    const isAtStart = editor.state.selection.anchor <= 1;
    const content = isAtStart
      ? `<p><strong>${displayString}</strong></p><p></p>`
      : `<p></p><p><strong>${displayString}</strong></p><p></p>`;
    editor.chain().focus().insertContent(content).run();
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    title?: string;
    children: React.ReactNode;
  }) => (
    <button
      onMouseDown={(e) => {
        // Prevent the editor from losing focus when tapping toolbar buttons
        e.preventDefault();
        onClick();
      }}
      data-tooltip-id="global-tooltip"
      data-tooltip-content={title}
      className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 shrink-0 ${
        isActive
          ? "bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-sm"
          : "text-[#888] dark:text-[#999] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] hover:bg-[#f0ede8] dark:hover:bg-[#2a2a2a]"
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#333] mx-0.5 shrink-0 self-center" />
  );

  const ZoomControl = ({ preventFocus = false }: { preventFocus?: boolean }) => {
    const bind = (fn: () => void) =>
      preventFocus
        ? {
            onMouseDown: (e: React.MouseEvent) => {
              e.preventDefault();
              fn();
            },
          }
        : { onClick: fn };

    return (
      <div className="flex items-center gap-1 bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] px-2 py-1 rounded-xl shrink-0">
        <button
          {...bind(() => setJournalZoom(Math.max(50, journalZoom - 10)))}
          className="text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] text-sm font-bold leading-none transition-colors w-4 text-center select-none"
        >
          −
        </button>
        <span className="text-[9px] font-bold text-[#3d3b33] dark:text-[#f0f0f0] w-7 text-center tabular-nums">
          {journalZoom}%
        </span>
        <button
          {...bind(() => setJournalZoom(Math.min(200, journalZoom + 10)))}
          className="text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] text-sm font-bold leading-none transition-colors w-4 text-center select-none"
        >
          +
        </button>
      </div>
    );
  };

  return (
    // No bottom padding here — let the parent layout own page-level spacing.
    <div className="relative w-full flex flex-col gap-4">

      {isEditable && (
        /*
         * TOOLBAR — always `sticky top-0`, never `fixed`.
         *
         * Why not fixed?
         *   `position: fixed` is supposed to be relative to the viewport, but
         *   it silently breaks when ANY ancestor has transform / will-change /
         *   filter / overflow-scroll set — which Next.js layout wrappers
         *   commonly do. The result: the toolbar disappears or mispositions
         *   when the keyboard opens, because the browser scrolls the page and
         *   the "fixed" element is actually fixed to the wrong container.
         *
         * Why sticky is correct here:
         *   • It stays in document flow — parent overflow/transform don't
         *     affect it at all.
         *   • It scrolls with the page until it would leave the top of its
         *     scroll container, then locks in place.
         *   • When the keyboard opens and the browser scrolls to the cursor,
         *     the toolbar simply stays locked at the top — always visible,
         *     always reachable with a single scroll-up gesture.
         *   • Zero iOS Safari quirks. Rock solid.
         *
         * Mobile visual polish:
         *   • mx-3 insets it from both edges → floating panel, not a glued strip.
         *   • mt-1 adds a tiny breathing gap from the very top of the page.
         *   • Rounded corners + soft shadow reinforce the elevated feel.
         */
        <div
          className={[
            "sticky top-0 z-50",
            // Inset from screen edges on mobile; full-width on desktop
            "mx-3 md:mx-0",
            // Tiny gap from the page top on mobile
            "mt-1 md:mt-0",
            "px-3 py-2",
            "flex items-center gap-2",
            "bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md",
            "border border-[#e0ddd5] dark:border-[#2a2a2a]",
            "rounded-2xl",
            // Soft downward shadow so the toolbar reads as floating
            "shadow-[0_2px_16px_0_rgba(0,0,0,0.07)] dark:shadow-[0_2px_16px_0_rgba(0,0,0,0.4)]",
          ].join(" ")}
        >
          {/* Formatting buttons — scrollable so narrow phones never clip */}
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
            <ToolbarButton
              title="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={activeStates.bold}
            >
              <Bold size={15} />
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={activeStates.italic}
            >
              <Italic size={15} />
            </ToolbarButton>
            <ToolbarButton
              title="Underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={activeStates.underline}
            >
              <UnderlineIcon size={15} />
            </ToolbarButton>
            <Divider />
            <ToolbarButton
              title="Heading 1"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={activeStates.heading1}
            >
              <Heading1 size={15} />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 2"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={activeStates.heading2}
            >
              <Heading2 size={15} />
            </ToolbarButton>
            <Divider />
            <ToolbarButton
              title="Bullet list"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={activeStates.bulletList}
            >
              <List size={15} />
            </ToolbarButton>
            <ToolbarButton
              title="Ordered list"
              onClick={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
              isActive={activeStates.orderedList}
            >
              <ListOrdered size={15} />
            </ToolbarButton>
            <Divider />
            <ToolbarButton title="Insert timestamp" onClick={insertTimestamp}>
              <Clock size={15} />
            </ToolbarButton>
          </div>

          {/* Right: save indicator + zoom */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`hidden md:block text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                saveStatus === "Saving..."
                  ? "text-[#c2956e] dark:text-[#d1a784]"
                  : "text-[#c4c0b8] dark:text-[#555]"
              }`}
            >
              {saveStatus}
            </span>
            <ZoomControl preventFocus />
          </div>
        </div>
      )}

      {/* Read-only zoom control */}
      {!isEditable && (
        <div className="flex justify-end">
          <ZoomControl />
        </div>
      )}

      <div
        style={{
          fontSize: `${(journalZoom / 100) * 1.05}rem`,
          fontFamily: "inherit",
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}