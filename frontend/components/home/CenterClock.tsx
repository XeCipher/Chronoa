// frontend/components/home/CenterClock.tsx
"use client";

import { useState, useEffect } from "react";
import { useUiStore } from "@/store/uiStore";
import { HomeClockStyle, getClockTimeParts } from "@/lib/clockStyles";
import {
  EditorialClock,
  SplitEditorialClock,
  OrbitCelestialClock,
  StackedMonumentClock,
} from "./clocks/ClassicAndEditorialClocks";
import {
  ChronoDialClock,
  FlipBoardClock,
  DotMatrixClock,
} from "./clocks/MechanicalClocks";

interface CenterClockProps {
  clockStyle?: HomeClockStyle;
  showSeconds?: boolean;
  use24Hour?: boolean;
  forceTheme?: "light" | "dark";
}

export default function CenterClock({
  clockStyle,
  showSeconds,
  use24Hour,
  forceTheme,
}: CenterClockProps = {}) {
  const [time, setTime] = useState<Date | null>(() =>
    typeof window !== "undefined" && useUiStore.getState().hasDashboardMounted
      ? new Date()
      : null
  );

  const storeSeconds = useUiStore((state) => state.showHomeSeconds);
  const store24Hour = useUiStore((state) => state.showHome24Hour);
  const storeStyle = useUiStore((state) => state.homeClockStyle);

  const activeStyle = clockStyle ?? storeStyle;
  const activeShowSeconds = showSeconds ?? storeSeconds;
  const activeUse24Hour = use24Hour ?? store24Hour;

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-[200px]" />; // Prevents Hydration Shift

  const parts = getClockTimeParts(time, activeUse24Hour);
  const themeClass =
    forceTheme === "dark"
      ? "clock-theme-dark"
      : forceTheme === "light"
      ? "clock-theme-light"
      : "clock-theme-auto";

  const renderFace = () => {
    const faceProps = {
      time,
      parts,
      showSeconds: activeShowSeconds,
      use24Hour: activeUse24Hour,
    };

    switch (activeStyle) {
      case "split":
        return <SplitEditorialClock {...faceProps} />;
      case "chrono":
        return <ChronoDialClock {...faceProps} />;
      case "flip":
        return <FlipBoardClock {...faceProps} />;
      case "orbit":
        return <OrbitCelestialClock {...faceProps} />;
      case "stacked":
        return <StackedMonumentClock {...faceProps} />;
      case "dotmatrix":
        return <DotMatrixClock {...faceProps} />;
      case "editorial":
      default:
        return <EditorialClock {...faceProps} />;
    }
  };

  return (
    <div key={activeStyle} className={`${themeClass} animate-fade-up`}>
      {renderFace()}
    </div>
  );
}