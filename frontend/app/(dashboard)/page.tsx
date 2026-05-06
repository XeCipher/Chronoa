"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, FileText, Timer, CalendarDays, BarChart2, 
  Smartphone, Download, Sun, Moon, Monitor, Share, 
  PlusSquare, Play, Pause, Square, AlertTriangle, Sparkles
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

const GithubIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// --- INTERACTIVE MOCKUP COMPONENTS ---

const MockTasks = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Finish daily journaling", done: false },
    { id: 2, text: "Sync Apple Calendar", done: false },
    { id: 3, text: "Enter 2 hours of Deep Work", done: false },
  ]);

  const toggle = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto select-none">
      <AnimatePresence>
        {tasks.map((t, i) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.15 }}
            onClick={() => toggle(t.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer shadow-sm transition-all duration-300 ${
              t.done
                ? 'bg-[#7ca982]/10 border-[#7ca982]/30 scale-[0.98] opacity-60'
                : 'bg-white dark:bg-[#1a1a1a] border-[#e0ddd5] dark:border-[#333] hover:border-[#7ca982]/50 hover:shadow-md'
            }`}
          >
            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors duration-300 shrink-0 ${
              t.done ? 'bg-[#7ca982] border-[#7ca982]' : 'border-[#d4d0c8] dark:border-[#555]'
            }`}>
              {t.done && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
            </div>
            <span className={`text-[15px] font-medium transition-colors duration-300 ${t.done ? 'line-through text-[#888]' : 'text-[#3d3b33] dark:text-[#f0f0f0]'}`}>
              {t.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const MockTimer = () => {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(25 * 60);

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setTime(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(i);
  }, [running]);

  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = (time % 60).toString().padStart(2, '0');
  const progress = 1 - time / (25 * 60);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center p-8 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] shadow-xl w-full max-w-sm mx-auto select-none"
    >
      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="96" cy="96" r="90" fill="none" stroke="currentColor" className="text-[#f0ede8] dark:text-[#2a2a2a]" strokeWidth="6" />
          <motion.circle
            cx="96" cy="96" r="90" fill="none" stroke="currentColor"
            className="text-[#c2956e] dark:text-[#b0855f]" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 90}
            animate={{ strokeDashoffset: (2 * Math.PI * 90) * (1 - progress) }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-mono text-[#3d3b33] dark:text-[#f0f0f0] font-light tracking-tighter">
            {m}:{s}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b0ad9a] dark:text-[#7a7a7a] mt-2">Deep Work</span>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => setRunning(!running)}
          className="w-16 h-16 flex items-center justify-center bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#121212] rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          {running ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>
        <button
          onClick={() => { setRunning(false); setTime(25 * 60); }}
          className="w-16 h-16 flex items-center justify-center bg-[#f0ede8] dark:bg-[#2a2a2a] text-[#888] dark:text-[#a0a0a0] rounded-full hover:scale-105 active:scale-95 transition-all hover:text-[#3d3b33] dark:hover:text-white"
        >
          <Square size={20} fill="currentColor" />
        </button>
      </div>
    </motion.div>
  );
};

// --- MAIN PAGE ---

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const { theme, setTheme } = useUiStore();
  const { scrollYProgress } = useScroll();
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 200]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/home');
      } else {
        setIsChecking(false);
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  useEffect(() => {
    try {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    } catch (e) {}
  }, [theme]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

  if (isChecking) return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;

  return (
    <div className="relative min-h-screen bg-[#f7f5f0] dark:bg-[#121212] overflow-x-hidden selection:bg-[#c2956e]/30 dark:selection:bg-[#b0855f]/40">
      
      {/* Background Parallax Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-100">
        <motion.div style={{ y: y1 }} className="absolute w-[800px] h-[800px] -translate-y-48 translate-x-32 bg-[radial-gradient(circle,rgba(168,130,194,0.15)_0%,transparent_60%)] blur-[100px]" />
        <motion.div style={{ y: y2 }} className="absolute w-[800px] h-[800px] translate-y-48 -translate-x-32 bg-[radial-gradient(circle,rgba(124,169,130,0.15)_0%,transparent_60%)] blur-[100px]" />
        <motion.div style={{ y: y3 }} className="absolute w-[1000px] h-[1000px] translate-y-12 bg-[radial-gradient(circle,rgba(194,149,110,0.1)_0%,transparent_60%)] blur-[100px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 dark:bg-[#121212]/80 backdrop-blur-xl border-b border-[#e0ddd5] dark:border-[#2a2a2a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif font-bold tracking-tight">Chronoa</h1>
            <span className="hidden sm:inline-block px-2.5 py-1 bg-[#c2956e]/10 text-[#c2956e] text-[9px] font-bold uppercase tracking-widest rounded-full border border-[#c2956e]/20">Open Source</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {mounted && (
              <button onClick={cycleTheme} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] text-[#888] hover:text-[#c2956e] transition-all hover:scale-105 shadow-sm" title={`Theme: ${theme}`}>
                <ThemeIcon size={16} />
              </button>
            )}
            
            <a href="https://github.com/XeCipher/Chronoa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] text-[#888] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-all hover:scale-105 shadow-sm">
              <GithubIcon size={18} />
            </a>
            
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="px-5 sm:px-6 py-2.5 bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#1a1a1a] rounded-full text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-black dark:hover:bg-white shadow-md hover:scale-105 hover:shadow-lg disabled:opacity-50"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-40 pb-20 sm:pt-48 sm:pb-32 px-6 w-full flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c2956e]/10 dark:bg-[#b0855f]/10 border border-[#c2956e]/20 dark:border-[#b0855f]/20 text-[#c2956e] dark:text-[#d1a784] text-[10px] font-bold uppercase tracking-widest mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#c2956e] dark:bg-[#d1a784] animate-pulse" /> Welcome to your personal workspace
          </div>
          
          <h2 className="text-6xl sm:text-7xl md:text-8xl text-[#3d3b33] dark:text-[#f0f0f0] mb-6 tracking-tight font-serif leading-[1.05]">
            Master your time. <br />
            <span className="italic text-[#c2956e] dark:text-[#d1a784]">Clear your mind.</span>
          </h2>
          
          <p className="text-[#888888] dark:text-[#a0a0a0] text-lg sm:text-xl md:text-2xl mb-12 max-w-2xl leading-relaxed">
            Chronoa seamlessly merges intentional task management, deep work timers, distraction-free journaling, and RPG analytics into one beautiful experience.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#c2956e] dark:bg-[#b0855f] rounded-2xl text-white text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#b0855f] dark:hover:bg-[#9e7653] hover:shadow-xl hover:shadow-[#c2956e]/20 hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0 bg-white rounded-full p-[3px] shadow-sm group-hover:scale-110 transition-transform">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </motion.div>
      </main>

      {/* Interactive Features Showcase */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col gap-32 overflow-hidden">
        
        {/* Feature 1: Tasks */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
            className="flex-1 space-y-6 text-center lg:text-left"
          >
            <div className="w-14 h-14 bg-[#7ca982]/10 text-[#7ca982] rounded-2xl flex items-center justify-center mx-auto lg:mx-0 shadow-sm border border-[#7ca982]/20">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white leading-tight">Intentional Tasks</h2>
            <p className="text-lg text-[#888] dark:text-[#a0a0a0] leading-relaxed max-w-lg mx-auto lg:mx-0">
              A meticulously designed daily list. Completed items gracefully vanish from your view, ensuring you only see what requires your attention right now.
            </p>
          </motion.div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7ca982]/20 to-transparent blur-[80px] -z-10 rounded-full" />
            <MockTasks />
          </div>
        </div>

        {/* Feature 2: Timer */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
          <motion.div 
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
            className="flex-1 space-y-6 text-center lg:text-left"
          >
            <div className="w-14 h-14 bg-[#c2956e]/10 text-[#c2956e] dark:text-[#d1a784] rounded-2xl flex items-center justify-center mx-auto lg:mx-0 shadow-sm border border-[#c2956e]/20">
              <Timer size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white leading-tight">Deep Work Timers</h2>
            <p className="text-lg text-[#888] dark:text-[#a0a0a0] leading-relaxed max-w-lg mx-auto lg:mx-0">
              Integrated pomodoro timers and stopwatches. Your sessions sync seamlessly across all devices, automatically recording your focus data to generate beautiful insights.
            </p>
          </motion.div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tl from-[#c2956e]/20 to-transparent blur-[80px] -z-10 rounded-full" />
            <MockTimer />
          </div>
        </div>

      </section>

      {/* Grid Features */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white">Everything in one place</h2>
          <p className="text-lg text-[#888] dark:text-[#a0a0a0] max-w-2xl mx-auto">
            Stop switching between five different productivity apps. Chronoa brings your entire workflow into a single, cohesive environment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: FileText, color: "text-[#a882c2]", bg: "bg-[#a882c2]/10", title: "Distraction-free Notes", desc: "A zen-like space for your daily journal entries, meetings, and free-form thoughts with a rich-text editor." },
            { icon: CalendarDays, color: "text-[#6e90c2]", bg: "bg-[#6e90c2]/10", title: "Calendar Sync", desc: "Connect Apple & Google calendars, or subscribe to any public ICS link. View your day seamlessly." },
            { icon: BarChart2, color: "text-[#5b9ea0]", bg: "bg-[#5b9ea0]/10", title: "RPG Analytics", desc: "Earn XP automatically as you work. Level up to unlock Ascendant ranks, and view beautiful heatmaps." }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-[#c2956e]/40 dark:hover:border-[#b0855f]/40 hover:-translate-y-1 transition-all duration-300"
            >
               <div className={`w-14 h-14 ${feat.bg} ${feat.color} rounded-2xl flex items-center justify-center mb-6`}>
                 <feat.icon size={26} strokeWidth={2.5} />
               </div>
               <h3 className="text-2xl font-serif text-[#3d3b33] dark:text-white mb-3 font-medium">{feat.title}</h3>
               <p className="text-[#888] dark:text-[#a0a0a0] text-[15px] leading-relaxed">
                 {feat.desc}
               </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mobile App & Download Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
            <Sparkles size={14} /> Install Chronoa Anywhere
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white">Experience Chronoa Natively</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
          {/* Android APK */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-2xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-start relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm">
              <Smartphone size={32} strokeWidth={2} />
            </div>
            <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-white mb-3">Android Native</h3>
            <p className="text-[15px] text-[#888] dark:text-[#a0a0a0] mb-8 leading-relaxed">
              Download our ultra-lightweight ~1MB native APK. It bypasses the Google Play Store overhead entirely, granting you instant, clean access to your workspace.
            </p>
            <a 
              href="/chronoa.apk" download 
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              <Download size={18} /> Download APK
            </a>
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 w-full">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800/80 dark:text-amber-500/90 leading-relaxed font-medium">
                Browsers often flag direct APK downloads as "harmful" because they aren't downloaded via the Play Store. This is standard behavior. Chronoa is completely safe and open-source.
              </p>
            </div>
          </motion.div>

          {/* iOS / PWA */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-2xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-start relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm">
              <Monitor size={32} strokeWidth={2} />
            </div>
            <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-white mb-3">iOS & Desktop</h3>
            <p className="text-[15px] text-[#888] dark:text-[#a0a0a0] mb-8 leading-relaxed">
              Chronoa is engineered as a highly optimized Progressive Web App (PWA). Add it directly to your home screen for a seamless, app-like fullscreen experience.
            </p>
            
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-4 bg-[#f7f5f0]/80 dark:bg-[#252525]/80 p-4 md:p-5 rounded-2xl border border-[#e0ddd5] dark:border-[#444] shadow-inner">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Share size={20} />
                </div>
                <div className="text-[15px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">1. Tap the <strong>Share</strong> button in Safari or Chrome</div>
              </div>
              <div className="flex items-center gap-4 bg-[#f7f5f0]/80 dark:bg-[#252525]/80 p-4 md:p-5 rounded-2xl border border-[#e0ddd5] dark:border-[#444] shadow-inner">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <PlusSquare size={20} />
                </div>
                <div className="text-[15px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">2. Select <strong>Add to Home Screen</strong></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-[#e0ddd5] dark:border-[#2a2a2a] bg-white/50 dark:bg-[#121212]/50 backdrop-blur-md py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#888] dark:text-[#7a7a7a] font-medium">
          <p>© {new Date().getFullYear()} Chronoa. Built for deep focus.</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/XeCipher/Chronoa" target="_blank" rel="noopener noreferrer" className="hover:text-[#c2956e] transition-colors flex items-center gap-2">
              <GithubIcon size={16} /> Source Code
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}