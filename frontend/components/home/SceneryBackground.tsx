// frontend/components/home/SceneryBackground.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useUiStore } from "@/store/uiStore";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

interface StarSpec {
  id: number;
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  peak: number;
  sparkle?: boolean;
}

interface MoteSpec {
  id: number;
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  driftX: string;
  driftY: string;
}

// Deterministic star layout to keep SSR hydration consistent and avoid crowding behind the center clock
const STAR_FIELD: StarSpec[] = [
  { id: 1, top: "8%", left: "11%", size: 2, delay: "0s", duration: "4.6s", peak: 0.9 },
  { id: 2, top: "14%", left: "24%", size: 1.5, delay: "1.4s", duration: "5.4s", peak: 0.7 },
  { id: 3, top: "9%", left: "38%", size: 2.5, delay: "2.3s", duration: "4.2s", peak: 0.95, sparkle: true },
  { id: 4, top: "6%", left: "54%", size: 1.5, delay: "0.7s", duration: "6.1s", peak: 0.75 },
  { id: 5, top: "13%", left: "69%", size: 2, delay: "3.1s", duration: "4.8s", peak: 0.85 },
  { id: 6, top: "7%", left: "84%", size: 2.5, delay: "1.1s", duration: "5.2s", peak: 0.95, sparkle: true },
  { id: 7, top: "21%", left: "7%", size: 2, delay: "2.8s", duration: "5.8s", peak: 0.8 },
  { id: 8, top: "24%", left: "19%", size: 1.5, delay: "0.4s", duration: "4.9s", peak: 0.65 },
  { id: 9, top: "19%", left: "78%", size: 2, delay: "4.0s", duration: "5.5s", peak: 0.88 },
  { id: 10, top: "23%", left: "92%", size: 1.5, delay: "1.9s", duration: "4.4s", peak: 0.75 },
  { id: 11, top: "32%", left: "13%", size: 2.5, delay: "3.5s", duration: "6.0s", peak: 0.9, sparkle: true },
  { id: 12, top: "35%", left: "88%", size: 2, delay: "0.9s", duration: "5.1s", peak: 0.85 },
  { id: 13, top: "16%", left: "46%", size: 1.5, delay: "2.1s", duration: "6.3s", peak: 0.6 },
  { id: 14, top: "27%", left: "62%", size: 1.5, delay: "3.8s", duration: "5.0s", peak: 0.68 },
  { id: 15, top: "44%", left: "6%", size: 2, delay: "1.6s", duration: "5.6s", peak: 0.78 },
  { id: 16, top: "48%", left: "94%", size: 2, delay: "2.9s", duration: "4.7s", peak: 0.82 },
  { id: 17, top: "58%", left: "11%", size: 1.5, delay: "0.3s", duration: "6.2s", peak: 0.65 },
  { id: 18, top: "63%", left: "86%", size: 2, delay: "3.3s", duration: "5.3s", peak: 0.8 },
  { id: 19, top: "71%", left: "19%", size: 2, delay: "1.8s", duration: "4.9s", peak: 0.75 },
  { id: 20, top: "74%", left: "74%", size: 1.5, delay: "4.2s", duration: "5.7s", peak: 0.7 },
  { id: 21, top: "82%", left: "8%", size: 2, delay: "2.5s", duration: "5.1s", peak: 0.8 },
  { id: 22, top: "84%", left: "34%", size: 1.5, delay: "0.6s", duration: "6.4s", peak: 0.6 },
  { id: 23, top: "81%", left: "64%", size: 1.5, delay: "3.0s", duration: "5.9s", peak: 0.62 },
  { id: 24, top: "79%", left: "91%", size: 2, delay: "1.2s", duration: "4.8s", peak: 0.82 },
  { id: 25, top: "11%", left: "60%", size: 1.5, delay: "2.4s", duration: "5.2s", peak: 0.72 },
  { id: 26, top: "29%", left: "30%", size: 1.5, delay: "4.4s", duration: "6.0s", peak: 0.55 },
  { id: 27, top: "66%", left: "44%", size: 1.5, delay: "1.5s", duration: "6.5s", peak: 0.52 },
  { id: 28, top: "88%", left: "51%", size: 2, delay: "2.7s", duration: "5.4s", peak: 0.68 },
];

const LIGHT_MOTES: MoteSpec[] = [
  { id: 1, top: "18%", left: "14%", size: 10, delay: "0s", duration: "16s", driftX: "28px", driftY: "-44px" },
  { id: 2, top: "26%", left: "82%", size: 14, delay: "2.5s", duration: "19s", driftX: "-24px", driftY: "-52px" },
  { id: 3, top: "74%", left: "16%", size: 12, delay: "5s", duration: "18s", driftX: "34px", driftY: "-48px" },
  { id: 4, top: "68%", left: "78%", size: 9, delay: "1.5s", duration: "15s", driftX: "-20px", driftY: "-38px" },
  { id: 5, top: "42%", left: "8%", size: 8, delay: "7s", duration: "21s", driftX: "22px", driftY: "-56px" },
  { id: 6, top: "38%", left: "91%", size: 11, delay: "4s", duration: "17s", driftX: "-30px", driftY: "-42px" },
  { id: 7, top: "82%", left: "36%", size: 13, delay: "3s", duration: "20s", driftX: "18px", driftY: "-60px" },
  { id: 8, top: "15%", left: "62%", size: 8, delay: "6s", duration: "16s", driftX: "-16px", driftY: "-36px" },
  { id: 9, top: "58%", left: "24%", size: 7, delay: "8.5s", duration: "18s", driftX: "26px", driftY: "-45px" },
  { id: 10, top: "22%", left: "34%", size: 9, delay: "9.5s", duration: "22s", driftX: "20px", driftY: "-40px" },
  { id: 11, top: "79%", left: "64%", size: 11, delay: "2s", duration: "19s", driftX: "-26px", driftY: "-50px" },
  { id: 12, top: "52%", left: "86%", size: 8, delay: "5.5s", duration: "17s", driftX: "-22px", driftY: "-40px" },
];

const SCENERY_CSS = `
  .scenery-stage {
    --px: 0px;
    --py: 0px;
    --scenery-bg: #f2f6fd;
    --sky-top: #cfe1ff;
    --sky-bottom: #ffebc7;
    --horizon-glow: #74cefc;
    --orb-1: #8f82ff;
    --orb-2: #42b1ff;
    --orb-3: #3dd39c;
    --orb-4: #ffc55c;
    --mote-color: #ffffff;
    --star-color: #ffffff;
    --scenery-orb-blend: normal;
    --sky-top-alpha: 0.65;
    --sky-bottom-alpha: 0.6;
    --horizon-alpha: 0.35;
    --orb-1-alpha: 0.46;
    --orb-2-alpha: 0.46;
    --orb-3-alpha: 0.36;
    --orb-4-alpha: 0.42;
    --stars-layer-opacity: 0;
    --star-alpha-scale: 0.55;
    --motes-layer-opacity: 1;
    --mote-alpha-scale: 0.52;
    --grain-opacity: 0.025;
    background-color: var(--scenery-bg);
    isolation: isolate;
    transition: background-color 2000ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* Light Mode Palettes */
  .scenery-stage[data-time="dawn"] {
    --scenery-bg: #fdf3ea;
    --sky-top: #e3cfff;
    --sky-bottom: #ffd2b3;
    --horizon-glow: #ffaa6b;
    --orb-1: #ff8e61;
    --orb-2: #ff6e91;
    --orb-3: #c183fa;
    --orb-4: #ffc64f;
    --mote-color: #fff5e0;
    --star-color: #ffffff;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --orb-1-alpha: 0.48;
    --orb-2-alpha: 0.44;
    --orb-3-alpha: 0.38;
    --orb-4-alpha: 0.46;
    --horizon-alpha: 0.48;
  }

  .scenery-stage[data-time="day"] {
    --scenery-bg: #f2f6fd;
    --sky-top: #cfe1ff;
    --sky-bottom: #ffebc7;
    --horizon-glow: #74cefc;
    --orb-1: #8f82ff;
    --orb-2: #42b1ff;
    --orb-3: #3dd39c;
    --orb-4: #ffc55c;
    --mote-color: #ffffff;
    --star-color: #ffffff;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --orb-1-alpha: 0.44;
    --orb-2-alpha: 0.45;
    --orb-3-alpha: 0.35;
    --orb-4-alpha: 0.42;
    --horizon-alpha: 0.32;
  }

  .scenery-stage[data-time="dusk"] {
    --scenery-bg: #fcf0ed;
    --sky-top: #dccaff;
    --sky-bottom: #ffc7bd;
    --horizon-glow: #ff7766;
    --orb-1: #ff5e7a;
    --orb-2: #e267d8;
    --orb-3: #ff943d;
    --orb-4: #8b68f7;
    --mote-color: #fff0df;
    --star-color: #ffffff;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --orb-1-alpha: 0.46;
    --orb-2-alpha: 0.42;
    --orb-3-alpha: 0.44;
    --orb-4-alpha: 0.38;
    --horizon-alpha: 0.46;
  }

  .scenery-stage[data-time="night"] {
    --scenery-bg: #eaf0fc;
    --sky-top: #cddafd;
    --sky-bottom: #e7dcff;
    --horizon-glow: #7e8ef9;
    --orb-1: #5a84f7;
    --orb-2: #8a73f7;
    --orb-3: #3dc2e0;
    --orb-4: #c382f5;
    --mote-color: #ffffff;
    --star-color: #ffffff;
    --stars-layer-opacity: 1;
    --star-alpha-scale: 0.6;
    --motes-layer-opacity: 0;
    --orb-1-alpha: 0.46;
    --orb-2-alpha: 0.44;
    --orb-3-alpha: 0.36;
    --orb-4-alpha: 0.38;
    --horizon-alpha: 0.35;
  }

  /* Dark Mode Palettes */
  .dark .scenery-stage[data-time="dawn"],
  html .scenery-stage[data-forced-theme="dark"][data-time="dawn"] {
    --scenery-bg: #130a12;
    --sky-top: #261442;
    --sky-bottom: #421725;
    --horizon-glow: #f05a38;
    --orb-1: #ff6b4a;
    --orb-2: #e83e7c;
    --orb-3: #8b5cf6;
    --orb-4: #f59e0b;
    --mote-color: #ffd8ad;
    --star-color: #ffecd9;
    --scenery-orb-blend: screen;
    --sky-top-alpha: 0.72;
    --sky-bottom-alpha: 0.68;
    --horizon-alpha: 0.42;
    --orb-1-alpha: 0.56;
    --orb-2-alpha: 0.52;
    --orb-3-alpha: 0.46;
    --orb-4-alpha: 0.42;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --mote-alpha-scale: 0.42;
    --grain-opacity: 0.045;
  }

  .dark .scenery-stage[data-time="day"],
  html .scenery-stage[data-forced-theme="dark"][data-time="day"] {
    --scenery-bg: #070d1c;
    --sky-top: #102452;
    --sky-bottom: #08232b;
    --horizon-glow: #2563eb;
    --orb-1: #4f6bff;
    --orb-2: #0ea5e9;
    --orb-3: #10b981;
    --orb-4: #8b5cf6;
    --mote-color: #bae6fd;
    --star-color: #e0f2fe;
    --scenery-orb-blend: screen;
    --sky-top-alpha: 0.75;
    --sky-bottom-alpha: 0.7;
    --horizon-alpha: 0.34;
    --orb-1-alpha: 0.56;
    --orb-2-alpha: 0.52;
    --orb-3-alpha: 0.4;
    --orb-4-alpha: 0.44;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --mote-alpha-scale: 0.4;
    --grain-opacity: 0.045;
  }

  .dark .scenery-stage[data-time="dusk"],
  html .scenery-stage[data-forced-theme="dark"][data-time="dusk"] {
    --scenery-bg: #120814;
    --sky-top: #1d103d;
    --sky-bottom: #421125;
    --horizon-glow: #e11d48;
    --orb-1: #f43f5e;
    --orb-2: #c026d3;
    --orb-3: #fb923c;
    --orb-4: #6366f1;
    --mote-color: #fecdd3;
    --star-color: #fce7f3;
    --scenery-orb-blend: screen;
    --sky-top-alpha: 0.72;
    --sky-bottom-alpha: 0.7;
    --horizon-alpha: 0.42;
    --orb-1-alpha: 0.54;
    --orb-2-alpha: 0.48;
    --orb-3-alpha: 0.46;
    --orb-4-alpha: 0.46;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --mote-alpha-scale: 0.42;
    --grain-opacity: 0.045;
  }

  .dark .scenery-stage[data-time="night"],
  html .scenery-stage[data-forced-theme="dark"][data-time="night"] {
    --scenery-bg: #040714;
    --sky-top: #0b1436;
    --sky-bottom: #140b2e;
    --horizon-glow: #4f46e5;
    --orb-1: #3b82f6;
    --orb-2: #8b5cf6;
    --orb-3: #06b6d4;
    --orb-4: #d946ef;
    --mote-color: #c7d2fe;
    --star-color: #f0f4ff;
    --scenery-orb-blend: screen;
    --sky-top-alpha: 0.8;
    --sky-bottom-alpha: 0.75;
    --horizon-alpha: 0.36;
    --orb-1-alpha: 0.54;
    --orb-2-alpha: 0.56;
    --orb-3-alpha: 0.38;
    --orb-4-alpha: 0.32;
    --stars-layer-opacity: 1;
    --star-alpha-scale: 0.95;
    --motes-layer-opacity: 0;
    --grain-opacity: 0.045;
  }

  /* Explicit light override for landing page sandbox when global site is dark */
  html.dark .scenery-stage[data-forced-theme="light"] {
    --scenery-orb-blend: normal;
    --sky-top-alpha: 0.65;
    --sky-bottom-alpha: 0.6;
    --star-alpha-scale: 0.6;
    --mote-alpha-scale: 0.52;
    --grain-opacity: 0.025;
  }

  html.dark .scenery-stage[data-forced-theme="light"][data-time="dawn"] {
    --scenery-bg: #fdf3ea;
    --sky-top: #e3cfff;
    --sky-bottom: #ffd2b3;
    --horizon-glow: #ffaa6b;
    --orb-1: #ff8e61;
    --orb-2: #ff6e91;
    --orb-3: #c183fa;
    --orb-4: #ffc64f;
    --mote-color: #fff5e0;
    --star-color: #ffffff;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --orb-1-alpha: 0.48;
    --orb-2-alpha: 0.44;
    --orb-3-alpha: 0.38;
    --orb-4-alpha: 0.46;
    --horizon-alpha: 0.48;
  }

  html.dark .scenery-stage[data-forced-theme="light"][data-time="day"] {
    --scenery-bg: #f2f6fd;
    --sky-top: #cfe1ff;
    --sky-bottom: #ffebc7;
    --horizon-glow: #74cefc;
    --orb-1: #8f82ff;
    --orb-2: #42b1ff;
    --orb-3: #3dd39c;
    --orb-4: #ffc55c;
    --mote-color: #ffffff;
    --star-color: #ffffff;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --orb-1-alpha: 0.44;
    --orb-2-alpha: 0.45;
    --orb-3-alpha: 0.35;
    --orb-4-alpha: 0.42;
    --horizon-alpha: 0.32;
  }

  html.dark .scenery-stage[data-forced-theme="light"][data-time="dusk"] {
    --scenery-bg: #fcf0ed;
    --sky-top: #dccaff;
    --sky-bottom: #ffc7bd;
    --horizon-glow: #ff7766;
    --orb-1: #ff5e7a;
    --orb-2: #e267d8;
    --orb-3: #ff943d;
    --orb-4: #8b68f7;
    --mote-color: #fff0df;
    --star-color: #ffffff;
    --stars-layer-opacity: 0;
    --motes-layer-opacity: 1;
    --orb-1-alpha: 0.46;
    --orb-2-alpha: 0.42;
    --orb-3-alpha: 0.44;
    --orb-4-alpha: 0.38;
    --horizon-alpha: 0.46;
  }

  html.dark .scenery-stage[data-forced-theme="light"][data-time="night"] {
    --scenery-bg: #eaf0fc;
    --sky-top: #cddafd;
    --sky-bottom: #e7dcff;
    --horizon-glow: #7e8ef9;
    --orb-1: #5a84f7;
    --orb-2: #8a73f7;
    --orb-3: #3dc2e0;
    --orb-4: #c382f5;
    --mote-color: #ffffff;
    --star-color: #ffffff;
    --stars-layer-opacity: 1;
    --motes-layer-opacity: 0;
    --orb-1-alpha: 0.46;
    --orb-2-alpha: 0.44;
    --orb-3-alpha: 0.36;
    --orb-4-alpha: 0.38;
    --horizon-alpha: 0.35;
  }

  .scenery-sky-band {
    position: absolute;
    border-radius: 9999px;
    pointer-events: none;
    filter: blur(52px);
    transition: background-color 2000ms cubic-bezier(0.22, 1, 0.36, 1), opacity 2000ms ease;
  }

  .scenery-orb {
    position: absolute;
    border-radius: 9999px;
    pointer-events: none;
    mix-blend-mode: var(--scenery-orb-blend);
    filter: blur(52px);
    will-change: transform;
    transition: background-color 2000ms cubic-bezier(0.22, 1, 0.36, 1), opacity 2000ms ease;
  }

  @media (min-width: 768px) {
    .scenery-sky-band {
      filter: blur(84px);
    }
    .scenery-orb {
      filter: blur(84px);
    }
  }

  @keyframes sceneryFloat1 {
    0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
    33% { transform: translate3d(-44px, 34px, 0) scale(1.09); }
    66% { transform: translate3d(26px, -24px, 0) scale(0.94); }
  }

  @keyframes sceneryFloat2 {
    0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
    33% { transform: translate3d(48px, -42px, 0) scale(1.12); }
    66% { transform: translate3d(-28px, 24px, 0) scale(0.92); }
  }

  @keyframes sceneryFloat3 {
    0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
    40% { transform: translate3d(38px, 32px, 0) scale(0.93); }
    75% { transform: translate3d(-34px, -28px, 0) scale(1.1); }
  }

  @keyframes sceneryFloat4 {
    0%, 100% { transform: translate3d(0px, 0px, 0) scale(1); }
    35% { transform: translate3d(-36px, -30px, 0) scale(1.08); }
    70% { transform: translate3d(24px, 26px, 0) scale(0.94); }
  }

  @keyframes sceneryHorizon {
    0%, 100% { transform: translate3d(0px, 0px, 0) scaleX(1) scaleY(1); }
    50% { transform: translate3d(0px, -16px, 0) scaleX(1.08) scaleY(1.05); }
  }

  @keyframes sceneryTwinkle {
    0%, 100% { opacity: 0.22; transform: scale(0.85); }
    50% { opacity: 1; transform: scale(1.18); }
  }

  @keyframes sceneryMoteDrift {
    0% {
      opacity: 0;
      transform: translate3d(0px, 0px, 0) scale(0.75);
    }
    25% {
      opacity: var(--mote-alpha-scale);
    }
    75% {
      opacity: var(--mote-alpha-scale);
    }
    100% {
      opacity: 0;
      transform: translate3d(var(--drift-x), var(--drift-y), 0) scale(1.15);
    }
  }

  .scenery-orb-1 {
    top: -16%;
    right: -12%;
    background-color: var(--orb-1);
    opacity: var(--orb-1-alpha);
    translate: calc(var(--px) * 16) calc(var(--py) * 16);
    animation: sceneryFloat1 18s ease-in-out infinite;
  }

  .scenery-orb-2 {
    bottom: -20%;
    left: -14%;
    background-color: var(--orb-2);
    opacity: var(--orb-2-alpha);
    translate: calc(var(--px) * -14) calc(var(--py) * -14);
    animation: sceneryFloat2 22s ease-in-out infinite;
  }

  .scenery-orb-3 {
    top: 16%;
    left: 2%;
    background-color: var(--orb-3);
    opacity: var(--orb-3-alpha);
    translate: calc(var(--px) * 12) calc(var(--py) * -10);
    animation: sceneryFloat3 25s ease-in-out infinite;
  }

  .scenery-orb-4 {
    bottom: -8%;
    right: 4%;
    background-color: var(--orb-4);
    opacity: var(--orb-4-alpha);
    translate: calc(var(--px) * -12) calc(var(--py) * 12);
    animation: sceneryFloat4 20s ease-in-out infinite;
  }

  .scenery-horizon-glow {
    bottom: -24%;
    left: 8%;
    width: 84%;
    height: 46%;
    background-color: var(--horizon-glow);
    opacity: var(--horizon-alpha);
    mix-blend-mode: var(--scenery-orb-blend);
    animation: sceneryHorizon 26s ease-in-out infinite;
  }

  .scenery-stars-layer {
    opacity: var(--stars-layer-opacity);
    translate: calc(var(--px) * 24) calc(var(--py) * 24);
    transition: opacity 1500ms ease;
  }

  .scenery-motes-layer {
    opacity: var(--motes-layer-opacity);
    translate: calc(var(--px) * 20) calc(var(--py) * 20);
    transition: opacity 1500ms ease;
  }

  .scenery-grain {
    opacity: var(--grain-opacity);
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px 180px;
    mix-blend-mode: overlay;
    transition: opacity 1500ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .scenery-orb,
    .scenery-horizon-glow,
    .scenery-star-dot,
    .scenery-mote-dot {
      animation: none !important;
    }
  }
`;

export function SceneryStage({
  timeOfDay,
  forcedDark,
  interactive = false,
  className = "",
}: {
  timeOfDay: TimeOfDay;
  forcedDark?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number | null = null;

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      if (stageRef.current) {
        stageRef.current.style.setProperty("--px", `${currentX.toFixed(3)}px`);
        stageRef.current.style.setProperty("--py", `${currentY.toFixed(3)}px`);
      }

      if (Math.abs(targetX - currentX) > 0.005 || Math.abs(targetY - currentY) > 0.005) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetX = nx;
      targetY = ny;
      if (rafId === null) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
      if (rafId === null) {
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [interactive]);

  return (
    <div
      ref={stageRef}
      data-time={timeOfDay}
      data-forced-theme={forcedDark === undefined ? undefined : forcedDark ? "dark" : "light"}
      className={`scenery-stage overflow-hidden pointer-events-none select-none ${className}`}
    >
      <style dangerouslySetInnerHTML={{ __html: SCENERY_CSS }} />

      {/* Directional Zenith & Horizon Sky Washes */}
      <div
        className="scenery-sky-band"
        style={{
          top: "-20%",
          left: "-12%",
          right: "-12%",
          height: "52%",
          backgroundColor: "var(--sky-top)",
          opacity: "var(--sky-top-alpha)",
        }}
      />
      <div
        className="scenery-sky-band"
        style={{
          bottom: "-22%",
          left: "-12%",
          right: "-12%",
          height: "54%",
          backgroundColor: "var(--sky-bottom)",
          opacity: "var(--sky-bottom-alpha)",
        }}
      />

      {/* Luminous Aurora / Atmospheric Orbs */}
      <div className="scenery-orb scenery-horizon-glow" />
      <div className="scenery-orb scenery-orb-1 w-[82%] md:w-[52%] aspect-square" />
      <div className="scenery-orb scenery-orb-2 w-[88%] md:w-[56%] aspect-square" />
      <div className="scenery-orb scenery-orb-3 w-[72%] md:w-[44%] aspect-square" />
      <div className="scenery-orb scenery-orb-4 w-[76%] md:w-[46%] aspect-square" />

      {/* Night Starfield */}
      <div className="scenery-stars-layer absolute inset-0 pointer-events-none">
        {STAR_FIELD.map((star) => (
          <div
            key={star.id}
            style={{
              position: "absolute",
              top: star.top,
              left: star.left,
              opacity: `calc(${star.peak} * var(--star-alpha-scale))`,
            }}
          >
            {star.sparkle ? (
              <svg
                viewBox="0 0 24 24"
                className="scenery-star-dot"
                style={{
                  width: `${star.size * 4}px`,
                  height: `${star.size * 4}px`,
                  color: "var(--star-color)",
                  filter: "drop-shadow(0 0 6px var(--star-color))",
                  animation: `sceneryTwinkle ${star.duration} ease-in-out ${star.delay} infinite`,
                }}
                fill="currentColor"
              >
                <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6Z" />
              </svg>
            ) : (
              <div
                className="scenery-star-dot rounded-full"
                style={{
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  backgroundColor: "var(--star-color)",
                  boxShadow: "0 0 6px var(--star-color)",
                  animation: `sceneryTwinkle ${star.duration} ease-in-out ${star.delay} infinite`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Dawn / Day / Dusk Sunlit Bokeh Motes */}
      <div className="scenery-motes-layer absolute inset-0 pointer-events-none">
        {LIGHT_MOTES.map((mote) => (
          <div
            key={mote.id}
            className="scenery-mote-dot absolute rounded-full"
            style={
              {
                top: mote.top,
                left: mote.left,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                backgroundColor: "var(--mote-color)",
                filter: "blur(1.5px)",
                boxShadow: "0 0 12px var(--mote-color)",
                "--drift-x": mote.driftX,
                "--drift-y": mote.driftY,
                animation: `sceneryMoteDrift ${mote.duration} ease-in-out ${mote.delay} infinite`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Subtle Cached Film Grain */}
      <div className="scenery-grain absolute inset-0 pointer-events-none" />
    </div>
  );
}

export default function SceneryBackground() {
  const [hour, setHour] = useState<number | null>(() =>
    typeof window !== "undefined" && useUiStore.getState().hasDashboardMounted ? new Date().getHours() : null
  );

  useEffect(() => {
    setHour(new Date().getHours());
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTimeOfDay = (): TimeOfDay => {
    if (hour === null) return "day";
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "dusk";
    return "night";
  };

  return (
    <SceneryStage
      timeOfDay={getTimeOfDay()}
      interactive={true}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}