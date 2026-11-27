// frontend/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SidebarNav from "@/components/ui/SidebarNav";
import { useUiStore } from "@/store/uiStore";
import { useTimerStore } from "@/store/timerStore";
import { isValidHomeClockStyle } from "@/lib/clockStyles";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import GlobalTimeWidget from "@/components/ui/GlobalTimeWidget";
import { AiChatPanel } from "@/components/ai/AiChatWidget";
import { Tooltip } from "react-tooltip";

const generateSyncId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

const cacheUserMetadata = (user: any) => {
  if (!user) return;
  try {
    localStorage.setItem("chronoa_user_name", user.user_metadata?.full_name || "User");
    localStorage.setItem("chronoa_user_email", user.email || "");
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (avatarUrl) {
      localStorage.setItem("chronoa_avatar", avatarUrl);
    }
  } catch (e) {}
};

const clearUserCaches = () => {
  try {
    localStorage.removeItem("chronoa_user_name");
    localStorage.removeItem("chronoa_user_email");
    localStorage.removeItem("chronoa_avatar");
    localStorage.removeItem("chronoa_cache_cal_sources");
    localStorage.removeItem("chronoa_cache_weather");
    localStorage.removeItem("chronoa_cache_weather_city");
  } catch (e) {}
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    theme,
    setLastVisitedPage,
    setNotesTab,
    isSidebarPinned,
    toggleSidebarPin,
    hotkeysEnabled,
    disabledHotkeys,
  } = useUiStore();

  const toggleFirstActive = useTimerStore((state) => state.toggleFirstActive);

  const initialRestoreDone = useRef(false);
  const isRedirecting = useRef(false);

  const localSyncId = useRef<string>("");
  const isApplyingRemote = useRef(false);
  const lastLocalStateStr = useRef<string>("");
  const previousStateForDiff = useRef<any>(null);

  // Track our own sync identifiers to completely eliminate self-echo typing race conditions
  const myRecentSyncIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearUserCaches();
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let channel: any;
    let isMounted = true;

    const hydrateProfileAndSubscribe = async (currentUserId: string) => {
      supabase
        .from("profiles")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", currentUserId)
        .then();

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUserId)
        .single();

      if (!isMounted) return;

      if (profile) {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if ((profile as any).timezone !== userTimezone) {
          await supabase
            .from("profiles")
            .update({ timezone: userTimezone })
            .eq("id", currentUserId);
        }

        try {
          if (profile.weather_city) {
            localStorage.setItem("chronoa_cache_weather_city", profile.weather_city);
          } else {
            localStorage.removeItem("chronoa_cache_weather_city");
          }
        } catch (e) {}

        const state = useUiStore.getState();
        if (profile.theme && profile.theme !== state.theme) state.setTheme(profile.theme);
        if (profile.task_archive_delay !== null && profile.task_archive_delay !== state.taskArchiveDelay)
          state.setTaskArchiveDelay(profile.task_archive_delay);
        if (profile.routine_reset_hour !== null && profile.routine_reset_hour !== state.routineResetHour)
          state.setRoutineResetHour(profile.routine_reset_hour);
        if (profile.hotkeys_enabled !== null && profile.hotkeys_enabled !== state.hotkeysEnabled)
          state.setHotkeysEnabled(profile.hotkeys_enabled);
        if (
          profile.disabled_hotkeys &&
          JSON.stringify(profile.disabled_hotkeys) !== JSON.stringify(state.disabledHotkeys)
        ) {
          state.setDisabledHotkeys(profile.disabled_hotkeys);
        }
        if (
          profile.move_completed_to_bottom !== null &&
          profile.move_completed_to_bottom !== state.moveCompletedToBottom
        ) {
          state.setMoveCompletedToBottom(profile.move_completed_to_bottom);
        }
        if (
          profile.keep_parent_task_alive !== null &&
          profile.keep_parent_task_alive !== state.keepParentTaskAlive
        ) {
          state.setKeepParentTaskAlive(profile.keep_parent_task_alive);
        }
        if (profile.add_task_at_top !== null && profile.add_task_at_top !== state.addTaskAtTop) {
          state.setAddTaskAtTop(profile.add_task_at_top);
        }
        if (
          profile.show_home_task_progress !== null &&
          profile.show_home_task_progress !== state.showHomeTaskProgress
        ) {
          state.setShowHomeTaskProgress(profile.show_home_task_progress);
        }
        if (
          typeof profile.show_home_seconds === "boolean" &&
          profile.show_home_seconds !== state.showHomeSeconds
        ) {
          state.setShowHomeSeconds(profile.show_home_seconds);
        }
        if (
          typeof profile.show_home_24_hour === "boolean" &&
          profile.show_home_24_hour !== state.showHome24Hour
        ) {
          state.setShowHome24Hour(profile.show_home_24_hour);
        }
        if (
          isValidHomeClockStyle(profile.home_clock_style) &&
          profile.home_clock_style !== state.homeClockStyle
        ) {
          state.setHomeClockStyle(profile.home_clock_style);
        }

        if (profile.timer_state) {
          localSyncId.current = profile.timer_state.sync_id || generateSyncId();

          const newState = {
            timers: profile.timer_state.timers || [],
            stopwatches: profile.timer_state.stopwatches || [],
            activeTab: profile.timer_state.activeTab || "stopwatch",
          };

          const newStateStr = JSON.stringify(newState);
          previousStateForDiff.current = newState;

          if (newStateStr !== lastLocalStateStr.current) {
            isApplyingRemote.current = true;
            lastLocalStateStr.current = newStateStr;
            useTimerStore.setState(newState);
            setTimeout(() => {
              isApplyingRemote.current = false;
            }, 100);
          }
        }
      }

      if (!isMounted) return;

      channel = supabase
        .channel(`profile_${currentUserId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${currentUserId}` },
          (payload) => {
            const rec = payload.new;
            const state = useUiStore.getState();

            if (rec.theme && rec.theme !== state.theme) state.setTheme(rec.theme);
            if (rec.task_archive_delay !== null && rec.task_archive_delay !== state.taskArchiveDelay)
              state.setTaskArchiveDelay(rec.task_archive_delay);
            if (rec.routine_reset_hour !== null && rec.routine_reset_hour !== state.routineResetHour)
              state.setRoutineResetHour(rec.routine_reset_hour);
            if (rec.hotkeys_enabled !== null && rec.hotkeys_enabled !== state.hotkeysEnabled)
              state.setHotkeysEnabled(rec.hotkeys_enabled);
            if (
              rec.disabled_hotkeys &&
              JSON.stringify(rec.disabled_hotkeys) !== JSON.stringify(state.disabledHotkeys)
            ) {
              state.setDisabledHotkeys(rec.disabled_hotkeys);
            }
            if (
              rec.move_completed_to_bottom !== null &&
              rec.move_completed_to_bottom !== state.moveCompletedToBottom
            ) {
              state.setMoveCompletedToBottom(rec.move_completed_to_bottom);
            }
            if (
              rec.keep_parent_task_alive !== null &&
              rec.keep_parent_task_alive !== state.keepParentTaskAlive
            ) {
              state.setKeepParentTaskAlive(rec.keep_parent_task_alive);
            }
            if (rec.add_task_at_top !== null && rec.add_task_at_top !== state.addTaskAtTop)
              state.setAddTaskAtTop(rec.add_task_at_top);
            if (
              rec.show_home_task_progress !== null &&
              rec.show_home_task_progress !== state.showHomeTaskProgress
            ) {
              state.setShowHomeTaskProgress(rec.show_home_task_progress);
            }
            if (
              typeof rec.show_home_seconds === "boolean" &&
              rec.show_home_seconds !== state.showHomeSeconds
            ) {
              state.setShowHomeSeconds(rec.show_home_seconds);
            }
            if (
              typeof rec.show_home_24_hour === "boolean" &&
              rec.show_home_24_hour !== state.showHome24Hour
            ) {
              state.setShowHome24Hour(rec.show_home_24_hour);
            }
            if (
              isValidHomeClockStyle(rec.home_clock_style) &&
              rec.home_clock_style !== state.homeClockStyle
            ) {
              state.setHomeClockStyle(rec.home_clock_style);
            }

            if (rec.timer_state) {
              const remoteSyncId = rec.timer_state.sync_id;

              // Drop our own echoes to avoid typing race conditions
              if (remoteSyncId && myRecentSyncIds.current.has(remoteSyncId)) {
                return;
              } else if (remoteSyncId && remoteSyncId !== localSyncId.current) {
                localSyncId.current = remoteSyncId;
                isApplyingRemote.current = true;

                const parsedState = {
                  timers: rec.timer_state.timers || [],
                  stopwatches: rec.timer_state.stopwatches || [],
                  activeTab: rec.timer_state.activeTab || "stopwatch",
                };

                useTimerStore.setState(parsedState);

                previousStateForDiff.current = parsedState;
                lastLocalStateStr.current = JSON.stringify(parsedState);

                setTimeout(() => {
                  isApplyingRemote.current = false;
                }, 100);
              }
            }
          }
        )
        .subscribe();
    };

    const checkAuthAndSubscribe = async () => {
      // Read cached session first so installed PWA boots instantly without network flicker
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session?.user) {
        const currentUserId = session.user.id;
        cacheUserMetadata(session.user);
        setUserId(currentUserId);

        const savedLastPage = useUiStore.getState().lastVisitedPage;
        const currentPath = window.location.pathname;
        const isEntryPage = currentPath === "/" || currentPath === "/home";

        if (!initialRestoreDone.current) {
          initialRestoreDone.current = true;
          if (isEntryPage && savedLastPage && savedLastPage !== "/" && savedLastPage !== "/home") {
            isRedirecting.current = true;
            router.replace(savedLastPage);
          } else if (currentPath === "/") {
            isRedirecting.current = true;
            router.replace("/home");
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }

        // Verify JWT in background; ignore transient offline errors when laptop wakes
        supabase.auth.getUser().then(async ({ data: { user }, error }) => {
          if (!isMounted) return;
          if (error) {
            const isNetworkError =
              !navigator.onLine ||
              error.message?.toLowerCase().includes("fetch") ||
              error.message?.toLowerCase().includes("network");
            if (isNetworkError) {
              hydrateProfileAndSubscribe(currentUserId);
              return;
            }
          }
          if (!user || error) {
            clearUserCaches();
            await supabase.auth.signOut();
            if (window.location.pathname !== "/") {
              window.location.href = "/";
            } else {
              setUserId(null);
              setIsLoading(false);
            }
            return;
          }
          cacheUserMetadata(user);
          hydrateProfileAndSubscribe(user.id);
        });

        return;
      }

      // No cached session: fall back to server check
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user || error) {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        } else {
          setIsLoading(false);
        }
        return;
      }

      cacheUserMetadata(user);
      setUserId(user.id);
      setIsLoading(false);
      hydrateProfileAndSubscribe(user.id);
    };

    checkAuthAndSubscribe();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;

    const updateLastAccessed = () => {
      supabase.from("profiles").update({ last_accessed_at: new Date().toISOString() }).eq("id", userId).then();
    };

    const intervalId = setInterval(updateLastAccessed, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [userId]);

  useEffect(() => {
    if (isLoading || !userId) return;
    let timeoutId: NodeJS.Timeout;

    if (!previousStateForDiff.current) {
      previousStateForDiff.current = {
        timers: useTimerStore.getState().timers,
        stopwatches: useTimerStore.getState().stopwatches,
        activeTab: useTimerStore.getState().activeTab,
      };
    }

    const unsub = useTimerStore.subscribe((state) => {
      if (isApplyingRemote.current) return;

      const currentState = {
        timers: state.timers,
        stopwatches: state.stopwatches,
        activeTab: state.activeTab,
      };

      const currentStr = JSON.stringify(currentState);

      if (currentStr !== lastLocalStateStr.current) {
        lastLocalStateStr.current = currentStr;

        let isCritical = false;
        const prev = previousStateForDiff.current || currentState;

        if (
          prev.activeTab !== currentState.activeTab ||
          prev.timers.length !== currentState.timers.length ||
          prev.stopwatches.length !== currentState.stopwatches.length
        ) {
          isCritical = true;
        } else {
          for (let i = 0; i < currentState.timers.length; i++) {
            if (
              currentState.timers[i]?.id !== prev.timers[i]?.id ||
              currentState.timers[i]?.title !== prev.timers[i]?.title ||
              currentState.timers[i]?.targetMinutes !== prev.timers[i]?.targetMinutes ||
              currentState.timers[i]?.isRunning !== prev.timers[i]?.isRunning ||
              currentState.timers[i]?.accumulatedSeconds !== prev.timers[i]?.accumulatedSeconds
            ) {
              isCritical = true;
              break;
            }
          }
          if (!isCritical) {
            for (let i = 0; i < currentState.stopwatches.length; i++) {
              if (
                currentState.stopwatches[i]?.id !== prev.stopwatches[i]?.id ||
                currentState.stopwatches[i]?.title !== prev.stopwatches[i]?.title ||
                currentState.stopwatches[i]?.isRunning !== prev.stopwatches[i]?.isRunning ||
                currentState.stopwatches[i]?.accumulatedSeconds !== prev.stopwatches[i]?.accumulatedSeconds
              ) {
                isCritical = true;
                break;
              }
            }
          }
        }

        previousStateForDiff.current = JSON.parse(currentStr);

        const newSyncId = generateSyncId();
        localSyncId.current = newSyncId;

        myRecentSyncIds.current.add(newSyncId);
        if (myRecentSyncIds.current.size > 50) {
          const arr = Array.from(myRecentSyncIds.current).slice(-20);
          myRecentSyncIds.current = new Set(arr);
        }

        const payload = { ...currentState, sync_id: newSyncId };

        const executeSave = async () => {
          const { error } = await supabase.from("profiles").update({ timer_state: payload }).eq("id", userId);
          if (error) console.error("Sync Error:", error);
        };

        clearTimeout(timeoutId);
        if (isCritical) {
          timeoutId = setTimeout(executeSave, 100);
        } else {
          timeoutId = setTimeout(executeSave, 1000);
        }
      }
    });

    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  }, [isLoading, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hotkeysEnabled) return;

      const isAlt = e.altKey;
      const isTyping =
        ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable;
      if (isAlt) {
        const key = e.key.toLowerCase();
        if (key === "h" && !disabledHotkeys?.includes("home")) {
          e.preventDefault();
          router.push("/home");
        }
        if (key === "t" && !disabledHotkeys?.includes("tasks")) {
          e.preventDefault();
          router.push("/tasks");
        }
        if (key === "n" && !disabledHotkeys?.includes("notes")) {
          e.preventDefault();
          setNotesTab("notes");
          router.push("/notes");
        }
        if (key === "j" && !disabledHotkeys?.includes("journal") && !disabledHotkeys?.includes("notes")) {
          e.preventDefault();
          setNotesTab("journal");
          router.push("/notes");
        }
        if (key === "c" && !disabledHotkeys?.includes("calendar")) {
          e.preventDefault();
          router.push("/calendar");
        }
        if (key === "a" && !disabledHotkeys?.includes("analytics")) {
          e.preventDefault();
          router.push("/analytics");
        }
        if (key === "p" && !disabledHotkeys?.includes("settings")) {
          e.preventDefault();
          router.push("/settings");
        }
      }
      if (e.code === "Space" && pathname === "/home" && !isTyping && !disabledHotkeys?.includes("space")) {
        e.preventDefault();
        toggleFirstActive();
      }
      if (e.key === "Escape" && isSidebarPinned && !disabledHotkeys?.includes("escape")) toggleSidebarPin();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router, setNotesTab, isSidebarPinned, toggleSidebarPin, toggleFirstActive, hotkeysEnabled, disabledHotkeys]);

  useEffect(() => {
    if (!userId) return;

    if (pathname !== "/") {
      setIsLoading(false);
    }

    if (isRedirecting.current && (pathname === "/" || pathname === "/home")) {
      return;
    }

    isRedirecting.current = false;
    if (pathname !== "/") {
      setLastVisitedPage(pathname);
    }
  }, [pathname, setLastVisitedPage, userId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isCurrentlyDark = theme === "dark" || (theme === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", isCurrentlyDark);
    };
    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  const isHomePage = pathname === "/home";
  const isLandingPage = pathname === "/";

  if (isLoading || (userId && isLandingPage)) {
    return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;
  }

  if (isLandingPage) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#f7f5f0] dark:bg-[#121212]">
        <main
          id="landing-scroll-container"
          className="flex-1 h-full overflow-y-auto overflow-x-hidden no-scrollbar relative min-w-0"
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isHomePage ? "bg-transparent" : "bg-[#f7f5f0] dark:bg-[#121212]"}`}>
      <SidebarNav />
      <main
        id="main-scroll-container"
        className="flex-1 h-full overflow-hidden relative min-w-0 pb-[calc(82px+env(safe-area-inset-bottom))] md:pb-0 pt-[max(1rem,env(safe-area-inset-top))] md:pt-0"
      >
        {children}
      </main>

      <Tooltip
        id="global-tooltip"
        className="max-md:!hidden z-[600] !bg-[#3d3b33] dark:!bg-[#2a2a2a] !text-white !rounded-xl !shadow-xl !font-semibold !text-[11px] !px-3 !py-1.5 !border-none"
      />

      <ConfirmDialog />
      <GlobalTimeWidget />
      <AiChatPanel />
    </div>
  );
}