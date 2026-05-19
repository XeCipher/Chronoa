// frontend/components/ai/AiChatWidget.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Send, X, Mic, RefreshCw, CheckCircle2, CheckSquare, 
  CalendarDays, FileText, BookOpen, Loader2, Edit3, Trash2, Timer, 
  Square, Navigation 
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useUiStore } from "@/store/uiStore";
import { useTimerStore } from "@/store/timerStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function AiButton({ variant }: { variant: 'desktop' | 'mobile' | 'global' }) {
  const { toggleAiChat } = useUiStore();
  
  if (variant === 'global') {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); toggleAiChat(); }}
        data-tooltip-id="global-tooltip" data-tooltip-content="Chronoa AI"
        className="w-[52px] h-[52px] rounded-[1rem] bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] shadow-sm flex items-center justify-center hover:scale-105 hover:shadow-md transition-all text-[#c2956e] dark:text-[#b0855f] group shrink-0 pointer-events-auto"
      >
        <Sparkles size={22} className="group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); toggleAiChat(); }}
      data-tooltip-id="global-tooltip" data-tooltip-content="Chronoa AI"
      className={`w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/70 md:bg-[#c2956e] dark:bg-[#1a1a1a]/80 md:dark:bg-[#b0855f] backdrop-blur-xl md:backdrop-blur-none border border-[#e0ddd5] md:border-transparent dark:border-[#333] md:dark:border-transparent text-[#c2956e] md:text-white dark:text-[#b0855f] md:dark:text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group shrink-0
      ${variant === 'desktop' ? 'hidden md:flex' : 'flex md:hidden'}`}
    >
      <Sparkles size={20} className="md:w-[22px] md:h-[22px] group-hover:animate-pulse" />
    </button>
  );
}

const EXAMPLE_PROMPTS = [
  "Add a team meeting tomorrow at 10 AM",
  "Start a 25 min focus timer for Coding",
  "Mark my 'Read 10 pages' task as complete",
  "Am I being productive today?",
  "Take me to my calendar"
];

const fetchUserContext = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "";
  
  const { data: tasks } = await supabase.from('tasks').select('id, title, is_completed, task_type').eq('user_id', user.id).is('deleted_at', null).order('position', { ascending: true });
  const { data: journals } = await supabase.from('journal_entries').select('entry_date, content').eq('user_id', user.id).order('entry_date', { ascending: false }).limit(3);
  const { data: events } = await supabase.from('calendar_events').select('id, title, start_time, end_time').eq('user_id', user.id).gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(8);
  
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  let ctx = `Current Context:\n`;
  ctx += `- Date/Time: ${new Date().toLocaleString()}\n`;
  ctx += `- Timezone: ${tz}\n\n`;
  
  ctx += `### Your Tasks\n`;
  if (tasks) {
     const pending = tasks.filter(t => !t.is_completed);
     const completed = tasks.filter(t => t.is_completed);
     ctx += `Pending Tasks:\n${pending.map(t => `- [ID: ${t.id}] ${t.title} (${t.task_type})`).join('\n')}\n\n`;
     ctx += `Completed Today:\n${completed.slice(0, 5).map(t => `- ${t.title}`).join('\n')}\n\n`;
  }
  
  ctx += `### Upcoming Events\n`;
  if (events) {
     events.forEach(e => {
        ctx += `- [ID: ${e.id}] ${e.title} at ${new Date(e.start_time).toLocaleString()}\n`;
     });
     ctx += '\n';
  }
  
  ctx += `### Running Timers\n`;
  const tStore = useTimerStore.getState();
  const runningTimers = tStore.timers.filter(t => t.isRunning);
  if (runningTimers.length > 0) {
     runningTimers.forEach(t => ctx += `- ${t.title} (Target: ${t.targetMinutes}m)\n`);
  } else {
     ctx += `No active timers.\n`;
  }
  
  return ctx;
};

const getAiUsage = () => {
  if (typeof window === 'undefined') return { count: 0, date: '' };
  const usage = JSON.parse(localStorage.getItem('chronoa_ai_usage') || '{"count": 0, "date": ""}');
  const today = new Date().toLocaleDateString();
  if (usage.date !== today) {
    return { count: 0, date: today };
  }
  return usage;
};

const incrementAiUsage = () => {
  const usage = getAiUsage();
  usage.count += 1;
  localStorage.setItem('chronoa_ai_usage', JSON.stringify(usage));
  return usage.count;
};

const tools: any = [{
  functionDeclarations: [
    {
      name: 'add_task',
      description: 'Adds a new task to the workspace.',
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "The task title" },
          task_type: { type: "STRING", description: '"normal" or "routine"' },
          color: { type: "STRING", description: '"none", "rose", "amber", "emerald", "blue", "purple"' },
        },
        required: ["title", "task_type"]
      }
    },
    {
      name: 'update_task',
      description: 'Updates an existing task (e.g. marking it as completed or changing title).',
      parameters: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING", description: "Task ID to update" },
          title: { type: "STRING", description: "The task title" },
          is_completed: { type: "BOOLEAN" },
          color: { type: "STRING" }
        },
        required: ["id", "title"]
      }
    },
    {
      name: 'delete_task',
      description: 'Moves a task to the trash.',
      parameters: {
        type: "OBJECT",
        properties: { 
          id: { type: "STRING", description: "Task ID to delete" },
          title: { type: "STRING", description: "Title of the task being deleted" }
        },
        required: ["id", "title"]
      }
    },
    {
      name: 'add_event',
      description: 'Prepares to schedule a new calendar event.',
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Event title" },
          start_time: { type: "STRING", description: "ISO format WITHOUT Z (Local Time), e.g. 2026-05-19T22:00:00" },
          end_time: { type: "STRING", description: "ISO format WITHOUT Z (Local Time), e.g. 2026-05-19T23:00:00" },
          location: { type: "STRING", description: "Event location" },
          description: { type: "STRING", description: "Event description" },
          color: { type: "STRING", description: '"amber", "blue", "purple", "rose", "emerald", "sage"' },
          repeat_pattern: { type: "STRING", description: '"none", "daily", "weekly", "monthly", "yearly"' }
        },
        required: ["title", "start_time", "end_time"]
      }
    },
    {
      name: 'update_event',
      description: 'Updates an existing calendar event.',
      parameters: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING", description: "Event ID to update" },
          title: { type: "STRING", description: "The event title" },
          start_time: { type: "STRING", description: "ISO format WITHOUT Z (Local Time)" },
          end_time: { type: "STRING", description: "ISO format WITHOUT Z (Local Time)" },
        },
        required: ["id", "title"]
      }
    },
    {
      name: 'delete_event',
      description: 'Deletes an event from the calendar.',
      parameters: {
        type: "OBJECT",
        properties: { 
          id: { type: "STRING", description: "Event ID to delete" },
          title: { type: "STRING", description: "Title of the event being deleted" }
        },
        required: ["id", "title"]
      }
    },
    {
      name: 'add_note',
      description: 'Prepares to add a new note.',
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Note title" },
          content: { type: "STRING", description: "HTML string with proper formatting (e.g. <h1>, <strong>, <p>)" }
        },
        required: ["title", "content"]
      }
    },
    {
      name: 'add_journal',
      description: 'Prepares to add a journal entry. Can append to existing.',
      parameters: {
        type: "OBJECT",
        properties: {
          date: { type: "STRING", description: "YYYY-MM-DD format" },
          content: { type: "STRING", description: "HTML string with proper formatting" },
          append: { type: "BOOLEAN", description: "Whether to append to the existing journal entry for that date" }
        },
        required: ["date", "content"]
      }
    },
    {
      name: 'start_focus_timer',
      description: 'Starts a new Pomodoro focus timer.',
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "What the user wants to focus on" },
          duration_minutes: { type: "INTEGER", description: "Target minutes" }
        },
        required: ["title", "duration_minutes"]
      }
    },
    {
      name: 'stop_all_timers',
      description: 'Pauses all currently running timers and stopwatches.',
      parameters: {
        type: "OBJECT",
        properties: {}
      }
    },
    {
      name: 'navigate_to',
      description: 'Navigates the user to a different page.',
      parameters: {
        type: "OBJECT",
        properties: {
          page: { type: "STRING", description: '"home", "tasks", "notes", "calendar", "analytics", "sessions", "settings"' }
        },
        required: ["page"]
      }
    }
  ]
}];

export function AiChatPanel() {
  const router = useRouter();
  const { isAiChatOpen, setAiChatOpen } = useUiStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [context, setContext] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAiChatOpen) {
       fetchUserContext().then(setContext);
    }
  }, [isAiChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in your browser.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
        }
        if (final) {
          setInput(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + final);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };
      
      recognition.start();
      setIsDictating(true);
      recognitionRef.current = recognition;
    }
  };

  const getModelName = () => {
    const usage = getAiUsage();
    return usage.count >= 5 ? "gemini-2.5-flash-lite" : "gemini-2.5-flash";
  };

  const formatHistory = (msgs: any[]) => {
    const formatted: any[] = [];
    for (const m of msgs) {
      if (m.role === 'user') formatted.push({ role: 'user', parts: [{ text: m.text }] });
      else if (m.role === 'model' && m.text) formatted.push({ role: 'model', parts: [{ text: m.text }] });
      else if (m.role === 'tool_call') {
        formatted.push({ role: 'model', parts: [{ functionCall: { name: m.call.name, args: m.call.args } }] });
      }
      else if (m.role === 'tool_result') {
        formatted.push({ role: 'user', parts: [{ functionResponse: { name: m.callName, response: m.result } }] });
      }
    }
    return formatted;
  };

  const executeTool = async (call: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const args = call.args;

    // Helper to safely parse AI local time without Z shifting
    const parseLocalTime = (isoNoZ: string) => new Date(isoNoZ).toISOString();

    switch (call.name) {
      case 'add_task':
        await supabase.from('tasks').insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          title: args.title,
          task_type: args.task_type || 'normal',
          position: 0,
          color: args.color && args.color !== 'none' ? args.color : null
        });
        break;

      case 'update_task':
        const taskUpdates: any = {};
        if (args.title) taskUpdates.title = args.title;
        if (args.is_completed !== undefined) {
          taskUpdates.is_completed = args.is_completed;
          taskUpdates.completed_at = args.is_completed ? new Date().toISOString() : null;
        }
        if (args.color) taskUpdates.color = args.color === 'none' ? null : args.color;
        await supabase.from('tasks').update(taskUpdates).eq('id', args.id);
        break;

      case 'delete_task':
        await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', args.id);
        break;

      case 'add_event': {
        const baseEvent = {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: args.title,
          start_time: parseLocalTime(args.start_time),
          end_time: parseLocalTime(args.end_time),
          location: args.location || null,
          description: args.description || null,
          color: args.color || 'amber',
          is_all_day: false,
          repeat_pattern: args.repeat_pattern || 'none',
          series_id: args.repeat_pattern && args.repeat_pattern !== 'none' ? crypto.randomUUID() : null
        };
        await supabase.from('calendar_events').insert([baseEvent]);
        break;
      }

      case 'update_event': {
        const evUpdates: any = {};
        if (args.title) evUpdates.title = args.title;
        if (args.start_time) evUpdates.start_time = parseLocalTime(args.start_time);
        if (args.end_time) evUpdates.end_time = parseLocalTime(args.end_time);
        await supabase.from('calendar_events').update(evUpdates).eq('id', args.id);
        break;
      }

      case 'delete_event':
        await supabase.from('calendar_events').delete().eq('id', args.id);
        break;

      case 'add_note':
        await supabase.from('notes').insert({ user_id: user.id, title: args.title, content: args.content });
        break;

      case 'add_journal': {
        const { data: existing } = await supabase.from('journal_entries').select('content').eq('user_id', user.id).eq('entry_date', args.date).single();
        if (existing && args.append) {
          const content = `${existing.content}<p><br></p>${args.content}`;
          await supabase.from('journal_entries').update({ content }).eq('user_id', user.id).eq('entry_date', args.date);
        } else {
          await supabase.from('journal_entries').upsert({ user_id: user.id, entry_date: args.date, content: args.content }, { onConflict: 'user_id, entry_date' });
        }
        break;
      }

      case 'start_focus_timer': {
        const store = useTimerStore.getState();
        const tid = store.addInstance('timer', args.title);
        store.setTargetMinutes(tid, args.duration_minutes);
        store.start('timer', tid);
        store.setActiveTab('timer');
        useUiStore.getState().setGlobalTimeWidgetExpanded(true);
        setTimeout(() => useUiStore.getState().setGlobalTimeWidgetExpanded(false), 3000);
        break;
      }

      case 'stop_all_timers': {
        const tStore = useTimerStore.getState();
        tStore.timers.forEach(t => { if(t.isRunning) tStore.pause('timer', t.id); });
        tStore.stopwatches.forEach(s => { if(s.isRunning) tStore.pause('stopwatch', s.id); });
        break;
      }

      case 'navigate_to':
        router.push(`/${args.page}`);
        setAiChatOpen(false);
        break;
    }
  };

  const handleToolAction = async (msgId: string, action: 'add' | 'retry' | 'skip') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: action } : m));
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    
    if (action === 'add') {
      setIsTyping(true);
      try {
        await executeTool(msg.call);
        const resultMsg = { id: crypto.randomUUID(), role: 'tool_result', callName: msg.call.name, result: { success: true, message: 'Action executed successfully.' } };
        setMessages(prev => [...prev, resultMsg]);
        
        const ai = new GoogleGenAI({
          apiKey: process.env.NEXT_PUBLIC_GEMPRISM_API_KEY || "dummy",
          httpOptions: { baseUrl: "https://gemprism.vercel.app/api/proxy" },
        });
        const systemInstruction = `You are Chronoa AI, an elite productivity assistant. Always adopt a calm, encouraging, and aesthetic tone.\n\n${context}`;
        const hist = formatHistory([...messages, resultMsg]);
        const res = await ai.models.generateContent({ model: getModelName(), contents: hist, config: { systemInstruction, tools } });
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: res.text }]);
      } catch(e) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: 'Action completed! ✅' }]);
      }
      setIsTyping(false);
    } else if (action === 'skip') {
      setIsTyping(true);
      const resultMsg = { id: crypto.randomUUID(), role: 'tool_result', callName: msg.call.name, result: { success: false, message: 'User skipped this action.' } };
      setMessages(prev => [...prev, resultMsg]);
      
      const ai = new GoogleGenAI({
        apiKey: process.env.NEXT_PUBLIC_GEMPRISM_API_KEY || "dummy",
        httpOptions: { baseUrl: "https://gemprism.vercel.app/api/proxy" },
      });
      const systemInstruction = `You are Chronoa AI, an elite productivity assistant. Always adopt a calm, encouraging, and aesthetic tone.\n\n${context}`;
      const hist = formatHistory([...messages, resultMsg]);
      try {
        const res = await ai.models.generateContent({ model: getModelName(), contents: hist, config: { systemInstruction, tools } });
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: res.text }]);
      } catch(e) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: 'Skipped.' }]);
      }
      setIsTyping(false);
    } else {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: 'What details would you like to change?' }]);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    incrementAiUsage();
    
    const newUserMsg = { id: crypto.randomUUID(), role: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.NEXT_PUBLIC_GEMPRISM_API_KEY || "dummy",
        httpOptions: { baseUrl: "https://gemprism.vercel.app/api/proxy" },
      });
      
      const systemInstruction = `You are Chronoa AI, an elite productivity assistant natively integrated into the user's workspace. Always adopt a calm, encouraging, and highly aesthetic tone.
      CRITICAL RULES:
      1. ONLY call tools when the user explicitly commands you to add, update, delete, start, stop, or navigate.
      2. Do NOT use tools for read-only queries (like asking what tasks are left or what is on the schedule). Read the Context and answer natively.
      3. If generating ISO times for tools, ALWAYS use local format YYYY-MM-DDTHH:mm:ss WITHOUT 'Z' at the end.
      
      ${context}`;
      
      const currentHistory = formatHistory([...messages, newUserMsg]);

      const res = await ai.models.generateContent({ 
        model: getModelName(), 
        contents: currentHistory, 
        config: { systemInstruction, tools } 
      });

      if (res.functionCalls && res.functionCalls.length > 0) {
        const call = res.functionCalls[0];
        const msgId = crypto.randomUUID();
        
        const autoExecute = call.name && ['start_focus_timer', 'stop_all_timers', 'navigate_to'].includes(call.name);
        
        if (autoExecute) {
            setMessages(prev => [...prev, { id: msgId, role: 'tool_call', call, status: 'success' }]);
            await executeTool(call);
            
            if (call.name === 'navigate_to') {
                setIsTyping(false);
                return; // Chat closes automatically via executeTool
            }
            
            const resultMsg = { id: crypto.randomUUID(), role: 'tool_result', callName: call.name, result: { success: true } };
            setMessages(prev => [...prev, resultMsg]);
            
            const currentHistory2 = formatHistory([...messages, newUserMsg, { id: msgId, role: 'tool_call', call }, resultMsg]);
            const res2 = await ai.models.generateContent({ model: getModelName(), contents: currentHistory2, config: { systemInstruction, tools } });
            
            if (res2.text) setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: res2.text }]);
        } else {
            setMessages(prev => [...prev, { id: msgId, role: 'tool_call', call, status: 'pending' }]);
        }
      } else if (res.text) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: res.text }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: "I'm having trouble connecting right now. Please try again." }]);
    }
    setIsTyping(false);
  };

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const ToolCard = ({ msg }: { msg: any }) => {
    const isDone = msg.status === 'success' || msg.status === 'skipped' || msg.status === 'retry';
    const cName = msg.call.name;
    const args = msg.call.args;
    
    const getIcon = () => {
      switch(cName) {
        case 'add_task': return <CheckSquare size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        case 'update_task': return <Edit3 size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        case 'delete_task': return <Trash2 size={16} className="text-red-500" />;
        case 'add_event': return <CalendarDays size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        case 'update_event': return <Edit3 size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        case 'delete_event': return <Trash2 size={16} className="text-red-500" />;
        case 'add_note': return <FileText size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        case 'add_journal': return <BookOpen size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        case 'start_focus_timer': return <Timer size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        case 'stop_all_timers': return <Square size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        case 'navigate_to': return <Navigation size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
        default: return <Sparkles size={16} className="text-[#c2956e] dark:text-[#b0855f]" />;
      }
    };
  
    const getTitle = () => {
      switch(cName) {
        case 'add_task': return 'New Task';
        case 'update_task': return 'Update Task';
        case 'delete_task': return 'Delete Task';
        case 'add_event': return 'New Event';
        case 'update_event': return 'Update Event';
        case 'delete_event': return 'Delete Event';
        case 'add_note': return 'New Note';
        case 'add_journal': return 'Journal Entry';
        case 'start_focus_timer': return 'Start Timer';
        case 'stop_all_timers': return 'Stop Timers';
        case 'navigate_to': return 'Navigate';
        default: return 'Action';
      }
    };
  
    return (
      <div className={`p-5 rounded-2xl w-[90%] md:w-[85%] border shadow-sm transition-all ${isDone ? 'bg-[#f7f5f0]/50 dark:bg-[#222]/50 border-[#e0ddd5]/50 dark:border-[#333]/50 opacity-70' : 'bg-white dark:bg-[#252525] border-[#e0ddd5] dark:border-[#444]'}`}>
        <div className="flex items-center gap-2 mb-3">
          {getIcon()}
          <span className="font-bold text-xs uppercase tracking-widest text-[#3d3b33] dark:text-[#f0f0f0]">{getTitle()}</span>
        </div>
        
        <div className="text-sm text-[#888] dark:text-[#a0a0a0] mb-4 space-y-1">
          {cName === 'add_task' && (
             <><p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Title:</span> {args.title}</p><p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Type:</span> {args.task_type}</p></>
          )}
          {cName === 'update_task' && (
             <><p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Task:</span> {args.title || args.id.split('-')[0]}</p>{args.is_completed !== undefined && <p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Done:</span> {args.is_completed ? 'Yes' : 'No'}</p>}</>
          )}
          {cName === 'delete_task' && <p>Are you sure you want to delete <span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">"{args.title}"</span>?</p>}
          {cName === 'add_event' && (
             <><p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Title:</span> {args.title}</p><p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Time:</span> {new Date(args.start_time).toLocaleString()}</p></>
          )}
          {cName === 'update_event' && (
             <><p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Event:</span> {args.title || args.id.split('-')[0]}</p>{args.start_time && <p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">New Time:</span> {new Date(args.start_time).toLocaleString()}</p>}</>
          )}
          {cName === 'delete_event' && <p>Are you sure you want to delete <span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">"{args.title}"</span>?</p>}
          {(cName === 'add_note' || cName === 'add_journal') && (
             <p className="line-clamp-2">{args.content.replace(/<[^>]*>?/gm, '')}</p>
          )}
          {cName === 'start_focus_timer' && (
             <><p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Focusing on:</span> {args.title}</p><p><span className="font-medium text-[#3d3b33] dark:text-[#e0e0e0]">Duration:</span> {args.duration_minutes}m</p></>
          )}
          {cName === 'stop_all_timers' && <p>Stop all running sessions.</p>}
          {cName === 'navigate_to' && <p>Open {args.page} workspace.</p>}
        </div>
  
        {!isDone && (
          <div className="flex gap-2">
            <button onClick={() => handleToolAction(msg.id, 'skip')} className="flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] text-[#888] hover:bg-[#e0ddd5] dark:hover:bg-[#333] transition-colors">Skip</button>
            <button onClick={() => handleToolAction(msg.id, 'retry')} className="flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] text-[#888] hover:bg-[#e0ddd5] dark:hover:bg-[#333] transition-colors">Edit</button>
            <button onClick={() => handleToolAction(msg.id, 'add')} className="flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#c2956e] text-white hover:bg-[#b0855f] transition-colors shadow-sm">Confirm</button>
          </div>
        )}
        {isDone && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#c2956e] dark:text-[#b0855f]">
            {msg.status === 'success' ? 'Executed Successfully' : msg.status === 'skipped' ? 'Skipped' : 'Retrying'}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[400] transition-opacity duration-500 ${isAiChatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setAiChatOpen(false)} />
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-[#161616] border-l border-[#e0ddd5] dark:border-[#333] shadow-2xl z-[500] transition-transform duration-500 flex flex-col ${isAiChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-[#e0ddd5] dark:border-[#2a2a2a] bg-[#fdfbf7] dark:bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c2956e]/10 dark:bg-[#b0855f]/20 flex items-center justify-center text-[#c2956e] dark:text-[#d1a784]">
              <Sparkles size={20} className="fill-current" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-[#3d3b33] dark:text-[#f0f0f0] tracking-tight">Chronoa AI</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMessages([])} className="p-2 text-[#888] hover:bg-[#f0ede8] dark:hover:bg-[#2a2a2a] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] rounded-full transition-colors" data-tooltip-id="global-tooltip" data-tooltip-content="Clear Chat"><RefreshCw size={18} /></button>
            <button onClick={() => setAiChatOpen(false)} className="p-2 text-[#888] hover:bg-[#f0ede8] dark:hover:bg-[#2a2a2a] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] rounded-full transition-colors"><X size={18} /></button>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 px-6">
             <Sparkles size={40} className="mb-4 text-[#c2956e] dark:text-[#b0855f]" />
             <p className="text-sm text-[#3d3b33] dark:text-[#e0e0e0] font-medium mb-6 px-4">How can I help you focus today?</p>
             <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
                {EXAMPLE_PROMPTS.map(p => (
                  <button key={p} onClick={() => handleSend(p)} className="px-4 py-3.5 rounded-2xl bg-[#f7f5f0] dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] text-xs text-[#888] dark:text-[#a0a0a0] hover:text-[#c2956e] dark:hover:text-[#d1a784] hover:border-[#c2956e]/50 transition-colors text-left shadow-sm leading-relaxed">{p}</button>
                ))}
             </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
            {messages.map(m => (
               <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'tool_call' ? (
                     <ToolCard msg={m} />
                  ) : m.role === 'tool_result' ? null : (
                     <div className={`px-5 py-3.5 rounded-[1.25rem] max-w-[85%] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#c2956e] text-white rounded-br-md' : 'bg-[#f7f5f0] dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] text-[#3d3b33] dark:text-[#e0e0e0] rounded-bl-md'}`}>
                       {renderMarkdown(m.text || '')}
                     </div>
                  )}
               </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                  <div className="px-5 py-3.5 rounded-[1.25rem] bg-[#f7f5f0] dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-bl-md flex gap-1.5 items-center h-[52px] shadow-sm">
                     <span className="w-1.5 h-1.5 bg-[#c2956e] dark:bg-[#b0855f] rounded-full animate-bounce" />
                     <span className="w-1.5 h-1.5 bg-[#c2956e] dark:bg-[#b0855f] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                     <span className="w-1.5 h-1.5 bg-[#c2956e] dark:bg-[#b0855f] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        <div className="p-4 md:p-6 border-t border-[#e0ddd5] dark:border-[#2a2a2a] shrink-0 bg-[#fdfbf7] dark:bg-[#1a1a1a]">
          <div className="relative flex items-center">
            <textarea 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder={isDictating ? "Listening..." : "Ask Chronoa AI..."}
              spellCheck={false}
              className={`w-full bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-[1.5rem] pl-5 pr-28 py-4 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] resize-none h-[54px] max-h-[120px] shadow-sm text-[#3d3b33] dark:text-[#f0f0f0] transition-colors ${isDictating ? 'placeholder:text-red-500/70 border-red-500/50' : ''}`}
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <button onClick={toggleDictation} className={`p-2.5 rounded-xl transition-colors ${isDictating ? 'bg-red-100 dark:bg-red-900/20 text-red-500 animate-pulse' : 'text-[#888] hover:bg-[#f0ede8] dark:hover:bg-[#333]'}`}>
                <Mic size={18} />
              </button>
              <button onClick={() => handleSend(input)} disabled={!input.trim() || isTyping} className="p-2.5 bg-[#c2956e] dark:bg-[#b0855f] text-white rounded-xl disabled:opacity-50 transition-colors shadow-sm hover:bg-[#b0855f] dark:hover:bg-[#9e7653]">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}