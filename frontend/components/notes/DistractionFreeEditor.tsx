// frontend/components/notes/DistractionFreeEditor.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  ChevronRight
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
  "What are your main intentions for today?"
];

// ProseMirror plugin to seamlessly auto-merge adjacent lists of the same type.
const MergeListsPlugin = Extension.create({
  name: 'mergeLists',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mergeLists'),
        appendTransaction(transactions, oldState, newState) {
          let tr = newState.tr;
          let modified = false;
          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'orderedList' || node.type.name === 'bulletList') {
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
        parseHTML: element => element.getAttribute('data-collapsed') === 'true',
        renderHTML: attributes => {
          if (!attributes.collapsed) return {};
          return { 'data-collapsed': 'true' };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(HeadingNodeView);
  }
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
          className="absolute -left-6 lg:-left-8 top-1/2 -translate-y-1/2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-[#b0ad9a] hover:text-[#c2956e] p-1 z-10"
          onPointerDown={(e) => { e.preventDefault(); updateAttributes({ collapsed: !collapsed }); }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </div>
      )}
      <NodeViewContent as={Tag} className={collapsed ? 'border-b-2 border-dashed border-[#c2956e]/40 dark:border-[#b0855f]/40 pb-1 mb-2 inline-block w-full' : ''} />
    </NodeViewWrapper>
  );
};

// Plugin to hide trailing elements up to the next highest or identical heading
const CollapsePluginKey = new PluginKey('collapsePlugin');