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

  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({
    opacity: 0,
    pointerEvents: "none",
    position: "fixed",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
  });

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

  // Handle the logic for calculating exactly where the text is on mobile
  useEffect(() => {
    if (!editor) return;

    const updateBubble = () => {
      if (window.innerWidth >= 768) {
        setBubbleStyle((prev) => ({ ...prev, opacity: 0, pointerEvents: "none" }));
        return;
      }

      const { selection } = editor.state;
      if (selection.empty || !editor.isFocused) {
        setBubbleStyle((prev) => ({ ...prev, opacity: 0, pointerEvents: "none" }));
        return;
      }

      const { view } = editor;
      // Get the absolute physical position of the selected text within the viewport
      const endCoords = view.coordsAtPos(selection.to);
      const startCoords = view.coordsAtPos(selection.from);

      // Horizontally center it based on the bounds of the selection
      const centerLeft = (startCoords.left + endCoords.left) / 2;
      const halfMenuWidth = 140; 
      let safeLeft = centerLeft;
      
      // Ensure the menu doesn't bleed off the left or right edges of the screen
      if (safeLeft < halfMenuWidth + 16) safeLeft = halfMenuWidth + 16;
      if (safeLeft > window.innerWidth - halfMenuWidth - 16) safeLeft = window.innerWidth - halfMenuWidth - 16;

      setBubbleStyle({
        opacity: 1,
        pointerEvents: "auto",
        position: "fixed",
        top: `${endCoords.bottom + 12}px`, // Places it precisely 12px below the text
        left: `${safeLeft}px`,
        transform: "translateX(-50%)",
        zIndex: 100,
      });
    };

    const handleBlur = () => {
      // Delay ensures we don't hide the menu when a formatting button itself is clicked
      setTimeout(() => {
        if (!editor.isFocused) {
          setBubbleStyle((prev) => ({ ...prev, opacity: 0, pointerEvents: "none" }));
        }
      }, 100);
    };

    editor.on("selectionUpdate", updateBubble);
    editor.on("focus", updateBubble);
    editor.on("blur", handleBlur);

    window.addEventListener("resize", updateBubble);
    window.addEventListener("scroll", updateBubble, true);

    return () => {
      editor.off("selectionUpdate", updateBubble);
      editor.off("focus", updateBubble);
      editor.off("blur", handleBlur);
      window.removeEventListener("resize", updateBubble);
      window.removeEventListener("scroll", updateBubble, true);
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
        // Prevent default handles focus loss, allowing the editor to stay focused!
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

  const renderFormattingButtons = () => (
    <>
      <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={activeStates.bold}><Bold size={15} /></ToolbarButton>
      <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={activeStates.italic}><Italic size={15} /></ToolbarButton>
      <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={activeStates.underline}><UnderlineIcon size={15} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={activeStates.heading1}><Heading1 size={15} /></ToolbarButton>
      <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={activeStates.heading2}><Heading2 size={15} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={activeStates.bulletList}><List size={15} /></ToolbarButton>
      <ToolbarButton title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={activeStates.orderedList}><ListOrdered size={15} /></ToolbarButton>
    </>
  );

  return (
    <div className="relative w-full flex flex-col gap-4">
      
      {/* MOBILE TITLE CONTROLS (Absolute Top Right) */}
      <div className="md:hidden absolute -top-[3.25rem] right-0 flex items-center gap-1.5 z-10">
        {isEditable && (
          <button
            onMouseDown={(e) => { e.preventDefault(); insertTimestamp(); }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-xl bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] text-[#888] hover:text-[#c2956e] shadow-sm transition-colors"
          >
            <Clock size={14} />
          </button>
        )}
        <ZoomControl preventFocus={isEditable} />
      </div>

      {isEditable && (
        <>
          {/* MOBILE POPUP: Appears dynamically tracking text coordinates */}
          <div
            className="md:hidden flex items-center gap-2 px-3 py-2 border border-[#e0ddd5] dark:border-[#2a2a2a] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md shadow-xl rounded-2xl w-max max-w-[92vw] overflow-x-auto no-scrollbar transition-opacity duration-200"
            style={bubbleStyle}
          >
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
              {renderFormattingButtons()}
            </div>
          </div>

          {/* DESKTOP STICKY TOOLBAR */}
          <div
            className={[
              "hidden md:flex",
              "md:sticky md:top-0 md:z-[100]",
              "md:p-2 md:border md:border-[#e0ddd5] md:dark:border-[#2a2a2a] md:rounded-2xl",
              "md:bg-white/95 md:dark:bg-[#121212]/95 md:backdrop-blur-md",
              "md:shadow-[0_2px_16px_0_rgba(0,0,0,0.07)] md:dark:shadow-[0_2px_16px_0_rgba(0,0,0,0.4)]",
              "items-center gap-2",
            ].join(" ")}
          >
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
              {renderFormattingButtons()}
              <Divider />
              <ToolbarButton title="Insert timestamp" onClick={insertTimestamp}>
                <Clock size={15} />
              </ToolbarButton>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
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
        </>
      )}

      {/* Read-only zoom control for Desktop */}
      {!isEditable && (
        <div className="hidden md:flex justify-end">
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