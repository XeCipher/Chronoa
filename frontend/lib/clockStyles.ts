// frontend/lib/clockStyles.ts

export type HomeClockStyle =
  | "editorial"
  | "split"
  | "chrono"
  | "flip"
  | "orbit"
  | "stacked"
  | "dotmatrix"
  | "fullscreen";

export interface ClockStyleMeta {
  id: HomeClockStyle;
  name: string;
  subtitle: string;
  keywords: string[];
}

export const HOME_CLOCK_STYLES: ClockStyleMeta[] = [
  {
    id: "editorial",
    name: "Classic",
    subtitle: "Cormorant serif",
    keywords: ["classic", "serif", "default", "minimal"],
  },
  {
    id: "split",
    name: "Editorial",
    subtitle: "Roman & italic spread",
    keywords: ["editorial", "magazine", "italic", "split", "spread", "week"],
  },
  {
    id: "chrono",
    name: "Chronograph",
    subtitle: "Swiss watchmaker dial",
    keywords: ["chrono", "chronograph", "analog", "watch", "dial", "sweep"],
  },
  {
    id: "flip",
    name: "Split-Flap",
    subtitle: "3D kinetic plaques",
    keywords: ["flip", "split-flap", "mechanical", "retro", "board"],
  },
  {
    id: "orbit",
    name: "Celestial",
    subtitle: "Solar & lunar arc",
    keywords: ["orbit", "celestial", "sun", "moon", "solar", "astronomy"],
  },
  {
    id: "stacked",
    name: "Monumental",
    subtitle: "Layered poster type",
    keywords: ["stacked", "monumental", "poster", "bold", "modern"],
  },
  {
    id: "dotmatrix",
    name: "Dot Matrix",
    subtitle: "Hardware pin grid",
    keywords: ["dot", "matrix", "led", "hardware", "digital", "grid"],
  },
  {
    id: "fullscreen",
    name: "Fullscreen",
    subtitle: "Edge-to-edge display",
    keywords: ["fullscreen", "full", "immersive", "minimal", "screen", "giant", "big"],
  },
];

export const isValidHomeClockStyle = (val: unknown): val is HomeClockStyle => {
  return typeof val === "string" && HOME_CLOCK_STYLES.some((s) => s.id === val);
};

export interface ClockTimeParts {
  hours: string;
  minutes: string;
  seconds: string;
  ampm: "AM" | "PM";
  rawHours: number;
  rawMinutes: number;
  rawSeconds: number;
  weekdayShort: string;
  weekdayLong: string;
  monthShort: string;
  monthLong: string;
  dayNum: string;
  dayRaw: string;
  year: string;
  compactDate: string;
  dayOfYear: number;
  weekNumber: number;
  monthProgressPct: number;
  solarFraction: number;
  celestialPhase: string;
  isDaytime: boolean;
}

const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getIsoWeekNumber = (date: Date): number => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getCelestialPhase = (hour: number): string => {
  if (hour >= 5 && hour < 8) return "First Light";
  if (hour >= 8 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 14) return "Solar Zenith";
  if (hour >= 14 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 20) return "Golden Hour";
  if (hour >= 20 && hour < 22) return "Twilight";
  return "Deep Night";
};

export const getClockTimeParts = (time: Date, use24Hour: boolean): ClockTimeParts => {
  const rawHours = time.getHours();
  const rawMinutes = time.getMinutes();
  const rawSeconds = time.getSeconds();

  const displayHour = use24Hour ? rawHours : rawHours % 12 || 12;
  const hours = displayHour.toString().padStart(2, "0");
  const minutes = rawMinutes.toString().padStart(2, "0");
  const seconds = rawSeconds.toString().padStart(2, "0");
  const ampm: "AM" | "PM" = rawHours >= 12 ? "PM" : "AM";

  const weekdayShort = time.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const weekdayLong = time.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const monthShort = time.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const monthLong = time.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  const dayNum = time.getDate().toString().padStart(2, "0");
  const dayRaw = time.getDate().toString();
  const year = time.getFullYear().toString();
  const compactDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const elapsedSeconds = rawHours * 3600 + rawMinutes * 60 + rawSeconds;
  const solarFraction = elapsedSeconds / 86400;

  const daysInMonth = new Date(time.getFullYear(), time.getMonth() + 1, 0).getDate();
  const monthProgressPct = Math.min(100, Math.max(1, Math.round((time.getDate() / daysInMonth) * 100)));

  return {
    hours,
    minutes,
    seconds,
    ampm,
    rawHours,
    rawMinutes,
    rawSeconds,
    weekdayShort,
    weekdayLong,
    monthShort,
    monthLong,
    dayNum,
    dayRaw,
    year,
    compactDate,
    dayOfYear: getDayOfYear(time),
    weekNumber: getIsoWeekNumber(time),
    monthProgressPct,
    solarFraction,
    celestialPhase: getCelestialPhase(rawHours),
    isDaytime: rawHours >= 6 && rawHours < 19,
  };
};