// frontend/components/notes/DistractionFreeEditor.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUiStore } from "@/store/uiStore";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import {
  Clock,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Maximize,
  Minimize,
  Link as LinkIcon
} from "lucide-react";

interface EditorProps {
  initialContent: string;
  isEditable?: boolean;
  onSave: (content: string) => void;
  noteType?: "notes" | "journal";
  entryDate?: string;
  isSandbox?: boolean;
  shouldFocusOnMount?: boolean;
}

type ActiveStates = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  heading1: boolean;
  heading2: boolean;
  bulletList: boolean;
  orderedList: boolean;
  link: boolean;
};

const PROMPTS = [
  "What are you grateful for today?",
  "What's on your mind right now?",
  "Describe a small win from today.",
  "What is one thing you learned recently?",
  "How are you feeling at this exact moment?",
  "What would make tomorrow a great day?",
  "Write about a moment that brought you peace.",
  "What are your main intentions for today?"
];

// ─── Cursor visibility buffer (px above visual viewport bottom) ────────────
const CURSOR_BUFFER = 88; // ~3 lines of text, keeps cursor comfortably above keyboard

export default function DistractionFreeEditor({
  initialContent,
  isEditable = true,
  onSave,
  noteType = "notes",
  entryDate,
  isSandbox = false,
  shouldFocusOnMount = false,
}: EditorProps) {
  const { journalZoom, setJournalZoom, isEditorFullscreen, toggleEditorFullscreen } = useUiStore();
  const [saveStatus, setSaveStatus] = useState("Saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [placeholder, setPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // ── Keyboard height tracking (iOS PWA) ────────────────────────────────────
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightRef = useRef(0);
  const isMobileRef = useRef(false);

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
    link: false,
  });

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 1024;
    if (noteType === "journal") {
      setPlaceholder(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    }
  }, [noteType]);

  // ── Core scroll function: keeps cursor above the keyboard ─────────────────
  // Uses a ref so it's always fresh inside editor callbacks without stale closures
  const ensureCursorVisible = useCallback((ed: ReturnType<typeof useEditor>) => {
    if (!ed || !isMobileRef.current) return;

    const run = () => {
      try {
        const vv = window.visualViewport;
        if (!vv) return;

        const { view, state } = ed as any;
        if (!view?.docView) return;

        const pos = state.selection.to;
        const coords = view.coordsAtPos(pos);

        // The bottom of the usable visible area, minus our comfortable buffer
        const safeBottom = vv.offsetTop + vv.height - CURSOR_BUFFER;

        if (coords.bottom <= safeBottom) return; // Already visible ✓

        const scrollBy = coords.bottom - safeBottom;

        // 1. Try the dedicated scroll container (parent sets this id)
        const scrollContainer = document.getElementById("notes-scroll-container");
        if (scrollContainer) {
          scrollContainer.scrollTop += scrollBy;
          return;
        }

        // 2. Walk up the DOM to find the nearest scrollable ancestor
        let el: HTMLElement | null = view.dom as HTMLElement;
        while (el && el !== document.documentElement) {
          const st = window.getComputedStyle(el);
          if (
            (st.overflowY === "auto" || st.overflowY === "scroll") &&
            el.scrollHeight > el.clientHeight
          ) {
            el.scrollTop += scrollBy;
            return;
          }
          el = el.parentElement;
        }

        // 3. Last resort – scroll the window
        window.scrollBy({ top: scrollBy });
      } catch (_) {
        // swallow – never crash the editor
      }
    };

    // Two RAF passes: first lets the DOM paint the new line, second measures it
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, []);

  // Keep a stable ref so effects that don't re-run can still call the latest version
  const ensureCursorVisibleRef = useRef(ensureCursorVisible);
  useEffect(() => {
    ensureCursorVisibleRef.current = ensureCursorVisible;
  }, [ensureCursorVisible]);

  // ── visualViewport resize → keyboard height + re-scroll ───────────────────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleVVChange = () => {
      isMobileRef.current = window.innerWidth < 1024;
      if (!isMobileRef.current) return;

      // keyboard height = portion of screen the keyboard is covering
      const kbH = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
      keyboardHeightRef.current = kbH;
      setKeyboardHeight(kbH);
    };

    vv.addEventListener("resize", handleVVChange);
    vv.addEventListener("scroll", handleVVChange);
    return () => {
      vv.removeEventListener("resize", handleVVChange);
      vv.removeEventListener("scroll", handleVVChange);
    };
  }, []);

  const editor = useEditor({
    editable: isEditable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "chronoa-editor focus:outline-none w-full min-h-[150px] md:min-h-[300px] text-[#3d3b33] dark:text-[#e0e0e0]",
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
        link: ed.isActive("link"),
      });
    },
    onFocus: ({ editor: ed }) => {
      setIsFocused(true);
      // After the keyboard finishes animating up (≈300 ms on iOS), scroll cursor into view
      setTimeout(() => ensureCursorVisibleRef.current(ed), 350);
    },
    onBlur: () => {
      setIsFocused(false);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      ensureCursorVisibleRef.current(ed);
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

      // Scroll immediately + a safety net 250 ms later (handles slow iOS reflows)
      ensureCursorVisibleRef.current(ed);
      setTimeout(() => ensureCursorVisibleRef.current(ed), 250);
    },
    immediatelyRender: false,
  });

  // ── Cleanup: flush any pending save on unmount ─────────────────────────────
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current && editor) {
        clearTimeout(saveTimeoutRef.current);
        onSaveRef.current(editor.getHTML());
      }
    };
  }, [editor]);

  // ── Auto-focus on desktop mount ────────────────────────────────────────────
  useEffect(() => {
    if (shouldFocusOnMount && editor && window.innerWidth >= 1024) {
      setTimeout(() => {
        if (!editor.isFocused) editor.commands.focus("end");
      }, 150);
    }
  }, [shouldFocusOnMount, editor]);

  // ── Re-scroll when keyboard height changes (keyboard slides up/resizes) ────
  useEffect(() => {
    if (!editor || keyboardHeight === 0) return;
    // Small delay for iOS keyboard animation to finish
    const t = setTimeout(() => ensureCursorVisibleRef.current(editor), 100);
    return () => clearTimeout(t);
  }, [editor, keyboardHeight]);

  // ── Ctrl/Cmd + scroll/key zoom ─────────────────────────────────────────────
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isEditable) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const z = useUiStore.getState().journalZoom;
        useUiStore.getState().setJournalZoom(
          e.deltaY < 0 ? Math.min(200, z + 5) : Math.max(50, z - 5)
        );
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditable) return;
      if (e.ctrlKey || e.metaKey) {
        const z = useUiStore.getState().journalZoom;
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          useUiStore.getState().setJournalZoom(Math.min(200, z + 10));
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          useUiStore.getState().setJournalZoom(Math.max(50, z - 10));
        }
      }
    };

    const editorEl = document.querySelector(".chronoa-editor");
    if (editorEl) {
      editorEl.addEventListener("wheel", handleWheel as any, { passive: false });
      editorEl.addEventListener("keydown", handleKeyDown as any);
    }
    return () => {
      if (editorEl) {
        editorEl.removeEventListener("wheel", handleWheel as any);
        editorEl.removeEventListener("keydown", handleKeyDown as any);
      }
    };
  }, [isEditable]);

  // ── Mobile floating bubble toolbar ────────────────────────────────────────
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

      const { view } = editor as any;
      const endCoords = view.coordsAtPos(selection.to);
      const startCoords = view.coordsAtPos(selection.from);
      const centerLeft = (startCoords.left + endCoords.left) / 2;
      const halfMenuWidth = 140;
      let safeLeft = centerLeft;
      if (safeLeft < halfMenuWidth + 16) safeLeft = halfMenuWidth + 16;
      if (safeLeft > window.innerWidth - halfMenuWidth - 16)
        safeLeft = window.innerWidth - halfMenuWidth - 16;

      setBubbleStyle({
        opacity: 1,
        pointerEvents: "auto",
        position: "fixed",
        top: `${endCoords.bottom + 12}px`,
        left: `${safeLeft}px`,
        transform: "translateX(-50%)",
        zIndex: 100,
      });
    };

    let rafId: number;
    const throttled = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateBubble);
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!editor.isFocused)
          setBubbleStyle((prev) => ({ ...prev, opacity: 0, pointerEvents: "none" }));
      }, 100);
    };

    editor.on("selectionUpdate", throttled);
    editor.on("focus", throttled);
    editor.on("blur", handleBlur);
    window.addEventListener("resize", throttled);
    window.addEventListener("scroll", throttled, true);

    return () => {
      editor.off("selectionUpdate", throttled);
      editor.off("focus", throttled);
      editor.off("blur", handleBlur);
      window.removeEventListener("resize", throttled);
      window.removeEventListener("scroll", throttled, true);
    };
  }, [editor]);

  // ── Timestamp insertion ────────────────────────────────────────────────────
  const insertTimestamp = () => {
    if (!editor) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateString = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    let display = `${dateString}, ${timeString}`;
    if (noteType === "journal" && entryDate) {
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (entryDate === localToday) display = timeString;
    }
    const isAtStart = editor.state.selection.anchor <= 1;
    const content = isAtStart
      ? `<p><strong>${display}</strong></p><p></p>`
      : `<p></p><p><strong>${display}</strong></p><p></p>`;
    editor.chain().focus().insertContent(content).run();
  };

  // ── Link toggle ────────────────────────────────────────────────────────────
  const setLink = () => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText) return;
    let url = selectedText.trim();
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url))
      url = `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) return null;

  // ── Sub-components ─────────────────────────────────────────────────────────
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
        ? { onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); fn(); } }
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
      <ToolbarButton title="Link" onClick={setLink} isActive={activeStates.link}><LinkIcon size={15} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={activeStates.heading1}><Heading1 size={15} /></ToolbarButton>
      <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={activeStates.heading2}><Heading2 size={15} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={activeStates.bulletList}><List size={15} /></ToolbarButton>
      <ToolbarButton title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={activeStates.orderedList}><ListOrdered size={15} /></ToolbarButton>
    </>
  );

  // ── Keyboard spacer height ─────────────────────────────────────────────────
  // Matches the actual iOS keyboard height so the content area is never hidden behind it.
  // Adding 24px extra gives that comfortable 1–2 line gap the user asked for.
  const spacerHeight = isFocused && keyboardHeight > 0 ? keyboardHeight + 24 : 0;

  return (
    <div className={`relative w-full flex flex-col gap-2 h-full ${isSandbox ? "md:gap-10" : "md:gap-4"}`}>

      {/* ── Mobile: save status + timestamp + zoom ── */}
      <div className="md:hidden flex w-full justify-between items-center gap-1.5 z-10 mt-2 mb-0">
        <span
          className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors pl-1 ${
            saveStatus === "Saving..."
              ? "text-[#c2956e] dark:text-[#d1a784]"
              : "text-[#c4c0b8] dark:text-[#555]"
          }`}
        >
          {saveStatus}
        </span>
        <div className="flex items-center gap-1.5">
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
      </div>

      {/* ── Mobile: floating selection toolbar ── */}
      {isEditable && (
        <>
          <div
            className="md:hidden flex items-center gap-2 px-3 py-2 border border-[#e0ddd5] dark:border-[#2a2a2a] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md shadow-xl rounded-2xl w-max max-w-[92vw] overflow-x-auto no-scrollbar transition-opacity duration-200"
            style={bubbleStyle}
          >
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
              {renderFormattingButtons()}
            </div>
          </div>

          {/* ── Desktop: sticky toolbar ── */}
          <div
            className={[
              "hidden md:flex",
              "sticky top-2 lg:top-4 z-[60]",
              "md:p-2 md:border md:border-[#e0ddd5] md:dark:border-[#2a2a2a] md:rounded-2xl",
              "md:bg-white/95 md:dark:bg-[#121212]/95 md:backdrop-blur-xl",
              "md:shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] md:dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.4)]",
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
              {!isSandbox && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); toggleEditorFullscreen(); }}
                  className="flex items-center justify-center w-[30px] h-[30px] md:w-8 md:h-8 rounded-xl bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] shadow-sm transition-colors shrink-0"
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isEditorFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Read-only desktop toolbar ── */}
      {!isEditable && (
        <div className="hidden md:flex justify-end items-center gap-2 sticky top-2 lg:top-4 z-[60] bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-[#e0ddd5] dark:border-[#2a2a2a]">
          <ZoomControl />
          {!isSandbox && (
            <button
              onMouseDown={(e) => { e.preventDefault(); toggleEditorFullscreen(); }}
              className="flex items-center justify-center w-[30px] h-[30px] md:w-8 md:h-8 rounded-xl bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] shadow-sm transition-colors shrink-0"
              data-tooltip-id="global-tooltip"
              data-tooltip-content={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isEditorFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          )}
        </div>
      )}

      {/* ── Editor content ── */}
      <div
        className="relative w-full flex-1"
        style={{ fontSize: `${(journalZoom / 100) * 1.05}rem`, fontFamily: "inherit" }}
      >
        {editor.isEmpty && (
          <div className="absolute top-0 left-0 pointer-events-none text-[#c4c0b8] dark:text-[#666] opacity-70 italic w-full leading-[1.45]">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} className="mt-0 pb-6" />

        {/*
         * ── iOS keyboard spacer ──────────────────────────────────────────────
         * Height = actual keyboard height (from visualViewport) + 24px buffer.
         * This guarantees the content area is never hidden behind the keyboard,
         * so the scroll container can always reach the cursor.
         * The `will-change: height` hint prevents a reflow jank on older iPhones.
         */}
        <div
          aria-hidden="true"
          className="md:hidden w-full shrink-0 pointer-events-none"
          style={{
            height: spacerHeight,
            transition: "height 0.28s ease",
            willChange: "height",
          }}
        />
      </div>
    </div>
  );
}