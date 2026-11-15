// frontend/components/notes/DistractionFreeEditor.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useUiStore } from "@/store/uiStore";
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/core";
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
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";

interface EditorProps {
  initialContent: string;
  isEditable?: boolean;
  onSave: (content: string, noteType?: "notes" | "journal") => void;
  noteType?: "notes" | "journal";
  entryDate?: string;
  isSandbox?: boolean;
  shouldFocusOnMount?: boolean;
  editorStateKey?: string;
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
  "What are your main intentions for today?",
];

// ProseMirror plugin to seamlessly auto-merge adjacent lists of the same type.
const MergeListsPlugin = Extension.create({
  name: "mergeLists",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("mergeLists"),
        appendTransaction(transactions, oldState, newState) {
          const tr = newState.tr;
          let modified = false;
          newState.doc.descendants((node, pos) => {
            if (node.type.name === "orderedList" || node.type.name === "bulletList") {
              const nextNode = newState.doc.nodeAt(pos + node.nodeSize);
              if (nextNode && nextNode.type.name === node.type.name) {
                tr.join(pos + node.nodeSize);
                modified = true;
              }
            }
          });
          return modified ? tr : null;
        },
      }),
    ];
  },
});

// The Collapsible Heading Extension
const CollapsibleHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      collapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-collapsed") === "true",
        renderHTML: (attributes) => {
          if (!attributes.collapsed) return {};
          return { "data-collapsed": "true" };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(HeadingNodeView);
  },
});

// The Interactive Heading Node View
const HeadingNodeView = (props: any) => {
  const { node, updateAttributes, editor } = props;
  const { level, collapsed } = node.attrs;
  const isEditable = editor.isEditable;
  const Tag = `h${level}` as any;

  return (
    <NodeViewWrapper className="relative group">
      {isEditable && (
        <div
          contentEditable={false}
          role="button"
          tabIndex={-1}
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          className="absolute -left-5 lg:-left-8 top-1/2 -translate-y-1/2 cursor-pointer opacity-50 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity text-[#b0ad9a] hover:text-[#c2956e] p-1 z-10"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateAttributes({ collapsed: !collapsed });
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </div>
      )}
      <NodeViewContent
        as={Tag}
        className={
          collapsed
            ? "border-b-2 border-dashed border-[#c2956e]/40 dark:border-[#b0855f]/40 pb-1 mb-2 inline-block w-full"
            : ""
        }
      />
    </NodeViewWrapper>
  );
};

// Plugin to hide trailing elements up to the next highest or identical heading
const CollapsePluginKey = new PluginKey("collapsePlugin");
const CollapsePlugin = Extension.create({
  name: "collapsePlugin",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CollapsePluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldSet, oldState, newState) {
            const decos: Decoration[] = [];
            let currentCollapseLevel: number | null = null;

            newState.doc.forEach((node, offset) => {
              if (node.type.name === "heading") {
                const level = node.attrs.level;
                if (currentCollapseLevel !== null && level <= currentCollapseLevel) {
                  currentCollapseLevel = null;
                }

                if (currentCollapseLevel === null && node.attrs.collapsed) {
                  currentCollapseLevel = level;
                }
              } else {
                if (currentCollapseLevel !== null) {
                  decos.push(
                    Decoration.node(offset, offset + node.nodeSize, {
                      class: "hidden-by-collapse",
                    })
                  );
                }
              }
            });

            return DecorationSet.create(newState.doc, decos);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export default function DistractionFreeEditor({
  initialContent,
  isEditable = true,
  onSave,
  noteType = "notes",
  entryDate,
  isSandbox = false,
  shouldFocusOnMount = false,
  editorStateKey,
}: EditorProps) {
  const {
    journalZoom,
    setJournalZoom,
    isEditorFullscreen,
    toggleEditorFullscreen,
    mobileNoteOpen,
  } = useUiStore();

  const [mounted, setMounted] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [placeholder, setPlaceholder] = useState("");
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const mobileBarRef = useRef<HTMLDivElement>(null);
  const baselineHeightRef = useRef<number>(800);
  const isMobileKeyboardOpenRef = useRef(false);

  const onSaveRef = useRef(onSave);
  const noteTypeRef = useRef(noteType);
  const editorStateKeyRef = useRef(editorStateKey);
  const isSandboxRef = useRef(isSandbox);

  useEffect(() => {
    setMounted(true);
    baselineHeightRef.current = window.innerHeight;
    const handleResize = () => setIsMobileViewport(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    noteTypeRef.current = noteType;
  }, [noteType]);

  useEffect(() => {
    editorStateKeyRef.current = editorStateKey;
  }, [editorStateKey]);

  useEffect(() => {
    isSandboxRef.current = isSandbox;
  }, [isSandbox]);

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

  // Track pointer interaction and restoration state to prevent unwanted scroll jumps
  const isPointerDownRef = useRef(false);
  const lastTypeTimeRef = useRef(0);
  const isRestoringStateRef = useRef(false);
  const hasRestoredStateRef = useRef(false);

  // Track clean touch taps so iOS focuses on the first tap without firing on scroll
  const touchStartRef = useRef<{ x: number; y: number; time: number; wasFocused: boolean } | null>(null);
  const lastHandledTouchEndRef = useRef(0);
  const lastTouchToolbarTriggerRef = useRef(0);

  // Track cursor selection, scroll offset, and focus state across route changes
  const latestSelectionRef = useRef<{ from: number; to: number }>({ from: 0, to: 0 });
  const lastScrollTopRef = useRef<number>(0);
  const isFocusedRef = useRef<boolean>(false);
  const lastBlurredAtRef = useRef<number>(0);
  const blurredToInputRef = useRef<boolean>(false);

  useEffect(() => {
    const handlePointerDown = () => {
      isPointerDownRef.current = true;
    };
    const handlePointerUp = () => {
      isPointerDownRef.current = false;
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp);
    window.addEventListener("touchcancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("touchcancel", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const scroller = document.getElementById("notes-scroll-container");
    if (!scroller) return;

    const handleScroll = () => {
      lastScrollTopRef.current = scroller.scrollTop;
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (noteType === "journal") {
      setPlaceholder(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    } else {
      setPlaceholder("");
    }
  }, [noteType]);

  // ── Core Scroll Engine: Flawless Margin Management ─────────────────────────
  const ensureCursorVisible = useCallback((ed: ReturnType<typeof useEditor>) => {
    if (!ed || isRestoringStateRef.current) return;

    // Do not interfere while the user holds a finger/mouse down
    if (isPointerDownRef.current) return;

    // Do not interfere if text is actively drag-selected
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) return;

    // On desktop, only enforce the bottom buffer while actively typing
    if (window.innerWidth >= 1024) {
      if (Date.now() - lastTypeTimeRef.current > 1000) return;
    }

    requestAnimationFrame(() => {
      try {
        const vv = window.visualViewport;
        if (!vv) return;

        const { view, state } = ed as any;
        if (!view?.docView) return;

        const pos = state.selection.to;
        const coords = view.coordsAtPos(pos);

        const isPhone = window.innerWidth < 768;
        const isTabletOrSmaller = window.innerWidth < 1024;

        let topBuffer = 100;
        if (isTabletOrSmaller && !isSandboxRef.current) {
          const mobileHeader = document.getElementById("notes-mobile-header");
          const headerBottom = mobileHeader ? mobileHeader.getBoundingClientRect().bottom : 88;
          topBuffer = headerBottom + (isPhone ? 12 : 68);
        }

        const bottomBuffer = isPhone && !isSandboxRef.current
          ? (isMobileKeyboardOpenRef.current ? 74 : 88)
          : 120;

        const safeTop = vv.offsetTop + topBuffer;
        const safeBottom = Math.max(safeTop + 36, vv.offsetTop + vv.height - bottomBuffer);

        let scrollDelta = 0;
        if (coords.bottom > safeBottom) {
          scrollDelta = coords.bottom - safeBottom;
        } else if (coords.top < safeTop) {
          scrollDelta = coords.top - safeTop;
        }

        if (scrollDelta !== 0) {
          const scrollContainer = document.getElementById("notes-scroll-container");
          if (scrollContainer) {
            scrollContainer.scrollTop += scrollDelta;
          } else {
            window.scrollBy({ top: scrollDelta });
          }
        }
      } catch (_) {}
    });
  }, []);

  const ensureCursorVisibleRef = useRef(ensureCursorVisible);
  useEffect(() => {
    ensureCursorVisibleRef.current = ensureCursorVisible;
  }, [ensureCursorVisible]);

  // ── Editor Configuration ───────────────────────────────────────────────────
  const editor = useEditor({
    editable: isEditable,
    extensions: [
      StarterKit.configure({ heading: false }),
      CollapsibleHeading.configure({ levels: [1, 2] }),
      CollapsePlugin,
      Underline,
      MergeListsPlugin,
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
      clipboardTextSerializer: (slice) => {
        return slice.content.textBetween(0, slice.content.size, "\n");
      },
      attributes: {
        class:
          "chronoa-editor select-text focus:outline-none w-full flex-1 h-full min-h-[70vh] text-[#3d3b33] dark:text-[#e0e0e0] pb-[48vh] md:pb-[30vh] cursor-text",
        spellcheck: "false",
        autocorrect: "off",
        autocomplete: "off",
        "data-form-type": "other",
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
      isFocusedRef.current = true;
      blurredToInputRef.current = false;
      latestSelectionRef.current = {
        from: ed.state.selection.from,
        to: ed.state.selection.to,
      };

      // Allow iOS/Android keyboard animation and tap caret placement to settle before adjusting scroll
      setTimeout(() => ensureCursorVisibleRef.current(ed), 140);
      setTimeout(() => ensureCursorVisibleRef.current(ed), 360);
    },
    onBlur: ({ editor: ed, event }) => {
      isFocusedRef.current = false;
      lastBlurredAtRef.current = Date.now();
      const rel = (event as FocusEvent | undefined)?.relatedTarget as HTMLElement | null;
      blurredToInputRef.current = Boolean(rel && (rel.tagName === "INPUT" || rel.tagName === "TEXTAREA"));

      latestSelectionRef.current = {
        from: ed.state.selection.from,
        to: ed.state.selection.to,
      };

      if (!isSandboxRef.current && editorStateKeyRef.current) {
        useUiStore.getState().setEditorCursorState(editorStateKeyRef.current, {
          from: ed.state.selection.from,
          to: ed.state.selection.to,
          scrollTop: lastScrollTopRef.current,
          restoreFocus: false,
        });
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      latestSelectionRef.current = {
        from: ed.state.selection.from,
        to: ed.state.selection.to,
      };
      ensureCursorVisibleRef.current(ed);
    },
    onUpdate: ({ editor: ed }) => {
      if (!isEditable) return;
      lastTypeTimeRef.current = Date.now();
      latestSelectionRef.current = {
        from: ed.state.selection.from,
        to: ed.state.selection.to,
      };

      setSaveStatus("Saving...");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSaveRef.current(ed.getHTML(), noteTypeRef.current);
        setSaveStatus("Saved");
        saveTimeoutRef.current = null;
      }, 1000);

      ensureCursorVisibleRef.current(ed);
    },
    immediatelyRender: false,
  });

  // Keep editable state synchronized without emitting spurious updates
  useEffect(() => {
    if (editor && editor.isEditable !== isEditable) {
      editor.setEditable(isEditable, false);
    }
  }, [editor, isEditable]);

  // Restore cursor position, focus, and scroll position when returning from another tab
  useEffect(() => {
    if (!editor || hasRestoredStateRef.current) return;
    hasRestoredStateRef.current = true;

    if (isSandbox || shouldFocusOnMount || !editorStateKey) return;

    const saved = useUiStore.getState().editorCursorStates[editorStateKey];
    if (!saved) return;

    isRestoringStateRef.current = true;
    const docSize = editor.state.doc.content.size;
    const safeFrom = Math.min(Math.max(0, saved.from), docSize);
    const safeTo = Math.min(Math.max(0, saved.to), docSize);

    latestSelectionRef.current = { from: safeFrom, to: safeTo };
    lastScrollTopRef.current = saved.scrollTop;

    requestAnimationFrame(() => {
      if (editor.isDestroyed) {
        isRestoringStateRef.current = false;
        return;
      }

      try {
        editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
        if (saved.restoreFocus && window.innerWidth >= 1024) {
          editor.view.dom.focus({ preventScroll: true });
        }
      } catch (_) {}

      const scroller = document.getElementById("notes-scroll-container");
      if (scroller) scroller.scrollTop = saved.scrollTop;

      setTimeout(() => {
        const scroller2 = document.getElementById("notes-scroll-container");
        if (scroller2) scroller2.scrollTop = saved.scrollTop;
        isRestoringStateRef.current = false;
      }, 120);
    });
  }, [editor, editorStateKey, isSandbox, shouldFocusOnMount]);

  // Sync external updates silently (TipTap v3 defaults emitUpdate to true unless passed false)
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      if (!editor.isFocused && !saveTimeoutRef.current) {
        const currentHTML = editor.getHTML();
        if (currentHTML !== initialContent) {
          editor.commands.setContent(initialContent, { emitUpdate: false });
        }
      }
    }
  }, [initialContent, editor]);

  // Explicit programmatic focus helper (used by desktop container clicks and Enter on note title)
  useEffect(() => {
    const handleFocus = () => {
      if (!editor || !isEditable) return;

      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        return;
      }

      editor.commands.focus("end", { scrollIntoView: false });
      editor.view.dom.focus({ preventScroll: true });
    };
    window.addEventListener("focus-editor", handleFocus);
    return () => window.removeEventListener("focus-editor", handleFocus);
  }, [editor, isEditable]);

  // Synchronous clean-tap focus dispatched from outer scroll container on mobile/desktop
  useEffect(() => {
    const handleOuterTap = () => {
      if (!editor || !isEditable) return;
      lastHandledTouchEndRef.current = Date.now();
      editor.commands.focus("end", { scrollIntoView: false });
      editor.view.dom.focus({ preventScroll: true });
    };
    window.addEventListener("chronoa-focus-editor-tap", handleOuterTap);
    return () => window.removeEventListener("chronoa-focus-editor-tap", handleOuterTap);
  }, [editor, isEditable]);

  // ── VisualViewport Resize Listener & Mobile Formatting Bar Positioning ─────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleVVChange = () => {
      if (editor && editor.isFocused) {
        ensureCursorVisibleRef.current(editor);
      }
    };

    vv.addEventListener("resize", handleVVChange);
    return () => vv.removeEventListener("resize", handleVVChange);
  }, [editor]);

  useEffect(() => {
    const handleFocusTrack = () => {
      const active = document.activeElement as HTMLElement | null;
      setIsTitleFocused(Boolean(active?.getAttribute("data-note-title-input") === "true"));
    };
    window.addEventListener("focusin", handleFocusTrack);
    window.addEventListener("focusout", handleFocusTrack);
    return () => {
      window.removeEventListener("focusin", handleFocusTrack);
      window.removeEventListener("focusout", handleFocusTrack);
    };
  }, []);

  useEffect(() => {
    if (isSandbox || !isEditable || !isMobileViewport || !mobileNoteOpen || isTitleFocused) {
      isMobileKeyboardOpenRef.current = false;
      setIsMobileKeyboardOpen(false);
      return;
    }

    let rafId = 0;
    const syncBarPosition = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const bar = mobileBarRef.current;
        const vv = window.visualViewport;
        const vvTop = vv ? vv.offsetTop : 0;
        const vvHeight = vv ? vv.height : window.innerHeight;
        const vvBottom = vvTop + vvHeight;

        const active = document.activeElement as HTMLElement | null;
        const isAnyInputFocused = Boolean(
          active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)
        );
        if (!isAnyInputFocused) {
          baselineHeightRef.current = Math.max(baselineHeightRef.current, vvHeight, window.innerHeight);
        }

        const kbOpen =
          baselineHeightRef.current - vvHeight > 120 ||
          window.innerHeight - vvHeight > 120;

        isMobileKeyboardOpenRef.current = kbOpen;
        setIsMobileKeyboardOpen((prev) => (prev !== kbOpen ? kbOpen : prev));

        if (bar) {
          bar.style.transform = `translate3d(0, calc(${vvBottom}px - 100%), 0)`;
        }
      });
    };

    const handleFocusDelayedSync = () => {
      syncBarPosition();
      setTimeout(syncBarPosition, 120);
      setTimeout(syncBarPosition, 340);
    };

    syncBarPosition();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncBarPosition);
    vv?.addEventListener("scroll", syncBarPosition);
    window.addEventListener("resize", syncBarPosition);
    window.addEventListener("focusin", handleFocusDelayedSync);
    window.addEventListener("focusout", handleFocusDelayedSync);

    return () => {
      cancelAnimationFrame(rafId);
      vv?.removeEventListener("resize", syncBarPosition);
      vv?.removeEventListener("scroll", syncBarPosition);
      window.removeEventListener("resize", syncBarPosition);
      window.removeEventListener("focusin", handleFocusDelayedSync);
      window.removeEventListener("focusout", handleFocusDelayedSync);
    };
  }, [isSandbox, isEditable, isMobileViewport, mobileNoteOpen, isTitleFocused, mounted]);

  // ── Cleanup: Flush Pending Saves & Store Cursor Position ───────────────────
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current && editor) {
        clearTimeout(saveTimeoutRef.current);
        onSaveRef.current(editor.getHTML(), noteTypeRef.current);
      }
      if (!isSandboxRef.current && editorStateKeyRef.current && editor) {
        const wasJustFocused =
          isFocusedRef.current ||
          (!blurredToInputRef.current && Date.now() - lastBlurredAtRef.current < 800);
        useUiStore.getState().setEditorCursorState(editorStateKeyRef.current, {
          from: latestSelectionRef.current.from,
          to: latestSelectionRef.current.to,
          scrollTop: lastScrollTopRef.current,
          restoreFocus: wasJustFocused,
        });
      }
    };
  }, [editor]);

  // ── Auto-Focus on Mount (Desktop only for newly created items) ─────────────
  useEffect(() => {
    if (shouldFocusOnMount && editor && window.innerWidth >= 1024) {
      setTimeout(() => {
        if (!editor.isFocused) editor.commands.focus("end");
      }, 150);
    }
  }, [shouldFocusOnMount, editor]);

  // ── Ctrl/Cmd + Zoom Interaction ────────────────────────────────────────────
  useEffect(() => {
    if (!isEditable || !editor) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const z = useUiStore.getState().journalZoom;
        useUiStore.getState().setJournalZoom(
          e.deltaY < 0 ? Math.min(200, z + 5) : Math.max(50, z - 5)
        );
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
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

    const editorEl = editor.view.dom;
    editorEl.addEventListener("wheel", handleWheel, { passive: false });
    editorEl.addEventListener("keydown", handleKeyDown);
    return () => {
      editorEl.removeEventListener("wheel", handleWheel);
      editorEl.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditable, editor]);

  // ── Timestamp & Link Handlers ──────────────────────────────────────────────
  const insertTimestamp = () => {
    if (!editor) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateString = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    let display = `${dateString}, ${timeString}`;
    if (noteType === "journal" && entryDate) {
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (entryDate === localToday) display = timeString;
    }
    const isAtStart = editor.state.selection.anchor <= 1;
    const content = isAtStart ? `<p><strong>${display}</strong></p><p></p>` : `<p></p><p><strong>${display}</strong></p><p></p>`;
    editor.chain().focus().insertContent(content).run();
    editor.view.dom.focus({ preventScroll: true });
  };

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
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url)) url = `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // ── Touch Focus Handler for Single-Tap iOS Activation ──────────────────────
  const handleContainerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isEditable || !editor || e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, .no-editor-focus, .chronoa-mobile-toolbar")) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      wasFocused: editor.isFocused,
    };
  };

  const handleContainerTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !isEditable || !editor || e.changedTouches.length !== 1) return;

    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, .no-editor-focus, .chronoa-mobile-toolbar")) return;

    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - start.x);
    const dy = Math.abs(touch.clientY - start.y);
    const dt = Date.now() - start.time;

    // Ignore scrolls and long presses
    if (dx > 10 || dy > 10 || dt > 450) return;

    const editorDom = editor.view.dom;
    const lastChild = editorDom.lastElementChild;
    const tappedBelowContent =
      !lastChild || touch.clientY > lastChild.getBoundingClientRect().bottom + 12;
    const tappedInsideEditorDom = editorDom.contains(target);

    if (tappedBelowContent || !tappedInsideEditorDom) {
      lastHandledTouchEndRef.current = Date.now();
      e.preventDefault();
      e.stopPropagation();
      editor.commands.focus("end", { scrollIntoView: false });
      editor.view.dom.focus({ preventScroll: true });
      return;
    }

    if (!start.wasFocused) {
      lastHandledTouchEndRef.current = Date.now();
      e.preventDefault();
      e.stopPropagation();
      const coords = editor.view.posAtCoords({ left: touch.clientX, top: touch.clientY });
      if (coords) {
        editor.commands.focus(coords.pos, { scrollIntoView: false });
      } else {
        editor.commands.focus("end", { scrollIntoView: false });
      }
      editor.view.dom.focus({ preventScroll: true });
    }
  };

  if (!editor) return null;

  // ── UI Components ──────────────────────────────────────────────────────────
  const ToolbarButton = ({ onClick, isActive, title, children }: any) => (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      data-tooltip-id="global-tooltip"
      data-tooltip-content={title}
      className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 shrink-0 cursor-pointer ${
        isActive
          ? "bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-sm"
          : "text-[#888] dark:text-[#999] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] hover:bg-[#f0ede8] dark:hover:bg-[#2a2a2a]"
      }`}
    >
      {children}
    </button>
  );

  // Mobile toolbar button preserves iOS selection & keyboard while allowing horizontal scroll
  const MobileBarButton = ({ onAction, isActive, label, children }: any) => {
    const btnTouchStartRef = useRef<{ x: number; y: number } | null>(null);

    return (
      <button
        type="button"
        aria-label={label}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            btnTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchEnd={(e) => {
          const start = btnTouchStartRef.current;
          btnTouchStartRef.current = null;
          if (!start || e.changedTouches.length !== 1) return;
          const t = e.changedTouches[0];
          if (Math.abs(t.clientX - start.x) < 10 && Math.abs(t.clientY - start.y) < 10) {
            e.preventDefault();
            e.stopPropagation();
            lastTouchToolbarTriggerRef.current = Date.now();
            onAction();
          }
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (Date.now() - lastTouchToolbarTriggerRef.current < 400) return;
          onAction();
        }}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 shrink-0 cursor-pointer ${
          isActive
            ? "bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-sm"
            : "text-[#888] dark:text-[#999] active:bg-[#f0ede8] dark:active:bg-[#2a2a2a]"
        }`}
      >
        {children}
      </button>
    );
  };

  const Divider = () => <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#333] mx-0.5 shrink-0 self-center" />;

  const ZoomControl = ({ preventFocus = false }: { preventFocus?: boolean }) => {
    const bind = (fn: () => void) =>
      preventFocus
        ? {
            onPointerDown: (e: React.PointerEvent) => {
              e.preventDefault();
              e.stopPropagation();
              fn();
            },
          }
        : { onClick: fn };
    return (
      <div className="flex items-center gap-1 bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] px-2 py-1 rounded-xl shrink-0">
        <button
          {...bind(() => setJournalZoom(Math.max(50, journalZoom - 10)))}
          className="text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] text-sm font-bold leading-none transition-colors w-4 text-center select-none cursor-pointer"
        >
          −
        </button>
        <span className="text-[9px] font-bold text-[#3d3b33] dark:text-[#f0f0f0] w-7 text-center tabular-nums">
          {journalZoom}%
        </span>
        <button
          {...bind(() => setJournalZoom(Math.min(200, journalZoom + 10)))}
          className="text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] text-sm font-bold leading-none transition-colors w-4 text-center select-none cursor-pointer"
        >
          +
        </button>
      </div>
    );
  };

  const renderFormattingButtons = () => (
    <>
      <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={activeStates.bold}>
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={activeStates.italic}>
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={activeStates.underline}
      >
        <UnderlineIcon size={15} />
      </ToolbarButton>
      <ToolbarButton title="Link" onClick={setLink} isActive={activeStates.link}>
        <LinkIcon size={15} />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={activeStates.heading1}
      >
        <Heading1 size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
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
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={activeStates.orderedList}
      >
        <ListOrdered size={15} />
      </ToolbarButton>
    </>
  );

  const showDockedMobileBar =
    mounted && !isSandbox && isEditable && isMobileViewport && mobileNoteOpen && !isTitleFocused;

  const showPlaceholder =
    Boolean(placeholder) &&
    editor.isEmpty &&
    !editor.isActive("heading") &&
    !editor.isActive("bulletList") &&
    !editor.isActive("orderedList");

  return (
    <div
      className={`chronoa-editor-root relative w-full flex flex-col gap-2 h-full ${isSandbox ? "md:gap-10" : "md:gap-4"}`}
      onTouchStart={handleContainerTouchStart}
      onTouchEnd={handleContainerTouchEnd}
    >
      {/* Mobile Top Status & Zoom Bar */}
      {!isSandbox && (
        <div className="md:hidden flex w-full justify-between items-center gap-1.5 z-10 mt-2 mb-0">
          <span
            className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors pl-1 ${
              saveStatus === "Saving..." ? "text-[#c2956e] dark:text-[#d1a784]" : "text-[#c4c0b8] dark:text-[#555]"
            }`}
          >
            {saveStatus}
          </span>
          <div className="flex items-center gap-1.5">
            <ZoomControl preventFocus={isEditable} />
          </div>
        </div>
      )}

      {/* Keyboard-Aware Mobile Docked Formatting Bar (eliminates overlap with native iOS Copy/Paste popup) */}
      {showDockedMobileBar &&
        createPortal(
          <div
            ref={mobileBarRef}
            className="chronoa-mobile-toolbar md:hidden fixed top-0 left-0 right-0 z-[90] bg-[#fdfbf7]/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-[#e0ddd5] dark:border-[#2a2a2a] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)] flex items-center gap-1.5 px-3 pt-1.5"
            style={{
              paddingBottom: isMobileKeyboardOpen ? "6px" : "max(10px, env(safe-area-inset-bottom))",
              willChange: "transform",
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
              <MobileBarButton
                label="Bold"
                isActive={activeStates.bold}
                onAction={() => {
                  editor.chain().focus().toggleBold().run();
                  editor.view.dom.focus({ preventScroll: true });
                }}
              >
                <Bold size={16} />
              </MobileBarButton>
              <MobileBarButton
                label="Italic"
                isActive={activeStates.italic}
                onAction={() => {
                  editor.chain().focus().toggleItalic().run();
                  editor.view.dom.focus({ preventScroll: true });
                }}
              >
                <Italic size={16} />
              </MobileBarButton>
              <MobileBarButton
                label="Underline"
                isActive={activeStates.underline}
                onAction={() => {
                  editor.chain().focus().toggleUnderline().run();
                  editor.view.dom.focus({ preventScroll: true });
                }}
              >
                <UnderlineIcon size={16} />
              </MobileBarButton>
              <MobileBarButton
                label="Link"
                isActive={activeStates.link}
                onAction={() => {
                  setLink();
                  editor.view.dom.focus({ preventScroll: true });
                }}
              >
                <LinkIcon size={16} />
              </MobileBarButton>
              <Divider />
              <MobileBarButton
                label="Heading 1"
                isActive={activeStates.heading1}
                onAction={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  editor.view.dom.focus({ preventScroll: true });
                }}
              >
                <Heading1 size={16} />
              </MobileBarButton>
              <MobileBarButton
                label="Heading 2"
                isActive={activeStates.heading2}
                onAction={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  editor.view.dom.focus({ preventScroll: true });
                }}
              >
                <Heading2 size={16} />
              </MobileBarButton>
              <Divider />
              <MobileBarButton
                label="Bullet list"
                isActive={activeStates.bulletList}
                onAction={() => {
                  editor.chain().focus().toggleBulletList().run();
                  editor.view.dom.focus({ preventScroll: true });
                }}
              >
                <List size={16} />
              </MobileBarButton>
              <MobileBarButton
                label="Ordered list"
                isActive={activeStates.orderedList}
                onAction={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  editor.view.dom.focus({ preventScroll: true });
                }}
              >
                <ListOrdered size={16} />
              </MobileBarButton>
              <Divider />
              <MobileBarButton
                label="Insert timestamp"
                isActive={false}
                onAction={insertTimestamp}
              >
                <Clock size={16} />
              </MobileBarButton>
            </div>

            {isMobileKeyboardOpen && (
              <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-[#e0ddd5] dark:border-[#333]">
                <button
                  type="button"
                  aria-label="Dismiss keyboard"
                  onMouseDown={(e) => e.preventDefault()}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.commands.blur();
                    (document.activeElement as HTMLElement)?.blur();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.commands.blur();
                    (document.activeElement as HTMLElement)?.blur();
                  }}
                  className="flex items-center gap-1 px-2.5 h-8 rounded-xl bg-[#c2956e]/15 dark:bg-[#b0855f]/25 text-[#c2956e] dark:text-[#d1a784] text-[10px] font-bold uppercase tracking-widest shrink-0"
                >
                  <Check size={13} strokeWidth={2.5} />
                  <span>Done</span>
                </button>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Desktop Sticky Toolbar (also rendered on mobile inside landing page sandbox) */}
      {isEditable && (
        <div
          className={[
            isSandbox ? "flex p-2 border border-[#e0ddd5] dark:border-[#2a2a2a] rounded-2xl bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.4)]" : "hidden md:flex md:p-2 md:border md:border-[#e0ddd5] md:dark:border-[#2a2a2a] md:rounded-2xl md:bg-white/95 md:dark:bg-[#121212]/95 md:backdrop-blur-xl md:shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] md:dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.4)]",
            "sticky top-2 lg:top-4 z-[60] no-editor-focus cursor-default items-center gap-2",
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
                saveStatus === "Saving..." ? "text-[#c2956e] dark:text-[#d1a784]" : "text-[#c4c0b8] dark:text-[#555]"
              }`}
            >
              {saveStatus}
            </span>
            <ZoomControl preventFocus />
            {!isSandbox && (
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleEditorFullscreen();
                }}
                className="cursor-pointer flex items-center justify-center w-[30px] h-[30px] md:w-8 md:h-8 rounded-xl bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] shadow-sm transition-colors shrink-0"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isEditorFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Read-only Toolbar */}
      {!isEditable && (
        <div
          className={`${
            isSandbox ? "flex" : "hidden md:flex"
          } justify-end items-center gap-2 sticky top-2 lg:top-4 z-[60] bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-[#e0ddd5] dark:border-[#2a2a2a] no-editor-focus cursor-default`}
        >
          <ZoomControl />
          {!isSandbox && (
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleEditorFullscreen();
              }}
              className="cursor-pointer flex items-center justify-center w-[30px] h-[30px] md:w-8 md:h-8 rounded-xl bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] text-[#888] hover:text-[#c2956e] dark:hover:text-[#d1a784] shadow-sm transition-colors shrink-0"
              data-tooltip-id="global-tooltip"
              data-tooltip-content={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isEditorFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          )}
        </div>
      )}

      <div
        className="relative w-full flex-1 flex flex-col cursor-text select-text"
        style={{ fontSize: `${(journalZoom / 100) * 1.05}rem`, fontFamily: "inherit" }}
        onClick={(e) => {
          if (!isEditable || !editor) return;
          if (Date.now() - lastHandledTouchEndRef.current < 500) return;

          const selection = window.getSelection();
          if (selection && selection.toString().length > 0) return;

          const target = e.target as HTMLElement;
          if (target.closest("p, h1, h2, h3, li, ul, ol, a, strong, em, button, input, .no-editor-focus")) {
            return;
          }

          if (!editor.isFocused) {
            editor.commands.focus("end", { scrollIntoView: false });
            editor.view.dom.focus({ preventScroll: true });
          }
        }}
      >
        {showPlaceholder && (
          <div className="absolute top-0 left-0 pointer-events-none text-[#c4c0b8] dark:text-[#666] opacity-70 italic w-full leading-[1.45]">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} className="select-text mt-0 flex-1 flex flex-col h-full w-full" />
      </div>
    </div>
  );
}