"use client";

import React from "react";

interface Props {
  rank: string;
  className?: string;
}

// ----------------------------------------------------------------------
// Rank 1: Novice (Bronze / Earth) - Sturdy, grounded, raw potential
// ----------------------------------------------------------------------
const NoviceBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="novice-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#cd7f32" />
        <stop offset="50%" stopColor="#8b4513" />
        <stop offset="100%" stopColor="#5c3a21" />
      </linearGradient>
      <linearGradient id="novice-highlight" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#a0522d" />
        <stop offset="100%" stopColor="#f4a460" />
      </linearGradient>
      <radialGradient id="novice-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffdab9" />
        <stop offset="100%" stopColor="#cd7f32" />
      </radialGradient>
      <filter id="shadow-novice">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4" />
      </filter>
    </defs>
    <g filter="url(#shadow-novice)">
      <circle cx="60" cy="60" r="50" fill="url(#novice-metal)" />
      <circle cx="60" cy="60" r="42" fill="#3e1f04" />
      <circle cx="60" cy="60" r="38" fill="url(#novice-highlight)" />
      <polygon points="60,18 70,50 102,60 70,70 60,102 50,70 18,60 50,50" fill="url(#novice-metal)" stroke="#3e1f04" strokeWidth="1.5" />
      <polygon points="60,18 70,50 60,60" fill="#ffffff" opacity="0.3" />
      <polygon points="102,60 70,70 60,60" fill="#000000" opacity="0.3" />
      <polygon points="60,102 50,70 60,60" fill="#000000" opacity="0.5" />
      <polygon points="18,60 50,50 60,60" fill="#ffffff" opacity="0.1" />
      <circle cx="60" cy="60" r="12" fill="url(#novice-core)" />
      <circle cx="60" cy="60" r="12" fill="none" stroke="#ffe4c4" strokeWidth="2" opacity="0.6" />
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Rank 2: Apprentice (Steel / Silver) - Industrial, structured, sharp
// ----------------------------------------------------------------------
const ApprenticeBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="app-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d3d3d3" />
        <stop offset="40%" stopColor="#a9a9a9" />
        <stop offset="60%" stopColor="#708090" />
        <stop offset="100%" stopColor="#2f4f4f" />
      </linearGradient>
      <radialGradient id="app-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#708090" stopOpacity="0" />
      </radialGradient>
      <filter id="shadow-app">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.5" />
      </filter>
    </defs>
    <g filter="url(#shadow-app)">
      <polygon points="60,10 103.3,35 103.3,85 60,110 16.7,85 16.7,35" fill="url(#app-metal)" />
      <polygon points="60,20 94.6,40 94.6,80 60,100 25.4,80 25.4,40" fill="#1c2833" />
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="15s" repeatCount="indefinite" />
        <circle cx="60" cy="60" r="32" fill="none" stroke="url(#app-metal)" strokeWidth="6" strokeDasharray="12 8" />
        <circle cx="60" cy="60" r="26" fill="url(#app-metal)" opacity="0.8" />
      </g>
      <polygon points="60,25 78,50 60,75 42,50" fill="#a9a9a9" />
      <polygon points="60,25 78,50 60,50" fill="#ffffff" opacity="0.5" />
      <polygon points="78,50 60,75 60,50" fill="#000000" opacity="0.3" />
      <polygon points="60,75 42,50 60,50" fill="#000000" opacity="0.6" />
      <polygon points="42,50 60,25 60,50" fill="#ffffff" opacity="0.1" />
      <circle cx="60" cy="60" r="10" fill="#ffffff" />
      <circle cx="60" cy="60" r="18" fill="url(#app-glow)" />
      {[[60, 16], [98, 38],[98, 82],[60, 104], [22, 82],[22, 38]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="#f8f8ff" opacity="0.8" />
      ))}
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Rank 3: Scholar (Sapphire / Water) - Elegant, flowing, wise
// ----------------------------------------------------------------------
const ScholarBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#87cefa" />
        <stop offset="50%" stopColor="#4169e1" />
        <stop offset="100%" stopColor="#000080" />
      </linearGradient>
      <radialGradient id="sch-core" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#e0ffff" />
        <stop offset="40%" stopColor="#00bfff" />
        <stop offset="100%" stopColor="#000033" />
      </radialGradient>
      <filter id="shadow-sch">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.6" />
      </filter>
    </defs>
    <g filter="url(#shadow-sch)">
      <path d="M 60 5 C 90 5 110 30 100 60 C 90 90 60 115 60 115 C 60 115 30 90 20 60 C 10 30 30 5 60 5 Z" fill="url(#sch-grad)" />
      <path d="M 60 12 C 85 12 100 32 92 58 C 85 82 60 105 60 105 C 60 105 35 82 28 58 C 20 32 35 12 60 12 Z" fill="url(#sch-core)" />
      <polygon points="60,12 92,58 60,60" fill="#ffffff" opacity="0.3" />
      <polygon points="92,58 60,105 60,60" fill="#000000" opacity="0.3" />
      <polygon points="60,105 28,58 60,60" fill="#000000" opacity="0.5" />
      <polygon points="28,58 60,12 60,60" fill="#ffffff" opacity="0.1" />
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="360 60 60" to="0 60 60" dur="12s" repeatCount="indefinite" />
        <polygon points="60,22 64,28 60,34 56,28" fill="#ffffff" opacity="0.9" />
        <polygon points="60,86 64,92 60,98 56,92" fill="#ffffff" opacity="0.9" />
        <polygon points="22,60 28,64 34,60 28,56" fill="#ffffff" opacity="0.9" />
        <polygon points="86,60 92,64 98,60 92,56" fill="#ffffff" opacity="0.9" />
      </g>
      <circle cx="60" cy="60" r="10" fill="#ffffff" opacity="0.9" />
      <circle cx="60" cy="60" r="25" fill="none" stroke="#87cefa" strokeWidth="1" strokeDasharray="4 4">
         <animateTransform begin="0s" attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="8s" repeatCount="indefinite" />
      </circle>
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Rank 4: Adept (Emerald / Nature) - Octagram, flourishing, radiant
// ----------------------------------------------------------------------
const AdeptBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="adept-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#98fb98" />
        <stop offset="100%" stopColor="#3cb371" />
      </linearGradient>
      <linearGradient id="adept-dark" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#006400" />
        <stop offset="100%" stopColor="#003300" />
      </linearGradient>
      <radialGradient id="adept-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="20%" stopColor="#00ff7f" />
        <stop offset="100%" stopColor="#006400" />
      </radialGradient>
      <filter id="shadow-adept">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.5" />
      </filter>
    </defs>
    <g filter="url(#shadow-adept)">
      <g>
         <animateTransform begin="0s" attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="40s" repeatCount="indefinite" />
         <rect x="20" y="20" width="80" height="80" fill="url(#adept-dark)" rx="4" />
         <rect x="20" y="20" width="80" height="80" fill="url(#adept-light)" rx="4" transform="rotate(45 60 60)" />
      </g>
      <polygon points="60,18 75,45 102,60 75,75 60,102 45,75 18,60 45,45" fill="url(#adept-core)" />
      <polygon points="60,18 75,45 60,60" fill="#ffffff" opacity="0.4" />
      <polygon points="102,60 75,45 60,60" fill="#ffffff" opacity="0.1" />
      <polygon points="102,60 75,75 60,60" fill="#000000" opacity="0.2" />
      <polygon points="60,102 75,75 60,60" fill="#000000" opacity="0.4" />
      <polygon points="60,102 45,75 60,60" fill="#000000" opacity="0.6" />
      <polygon points="18,60 45,75 60,60" fill="#000000" opacity="0.3" />
      <polygon points="18,60 45,45 60,60" fill="#ffffff" opacity="0.2" />
      <polygon points="60,18 45,45 60,60" fill="#ffffff" opacity="0.5" />
      <circle cx="60" cy="60" r="14" fill="#98fb98">
        <animate begin="0s" attributeName="r" values="12; 15; 12" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="60" r="8" fill="#ffffff" />
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Rank 5: Blossom (Pink / Magic) - Cute, beautifully faceted, glowing
// ----------------------------------------------------------------------
const BlossomBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blossom-pink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffb6c1" />
        <stop offset="50%" stopColor="#ff69b4" />
        <stop offset="100%" stopColor="#c71585" />
      </linearGradient>
      <radialGradient id="blossom-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#ff69b4" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ff1493" stopOpacity="0" />
      </radialGradient>
      <filter id="shadow-blossom">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.6" floodColor="#ff69b4" />
      </filter>
    </defs>
    <g filter="url(#shadow-blossom)">
      {/* Glowing Aura */}
      <circle cx="60" cy="60" r="45" fill="url(#blossom-glow)">
        <animate begin="0s" attributeName="opacity" values="0.5; 1; 0.5" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Outer Blooming Stars - Rotating clockwise */}
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="24s" repeatCount="indefinite" />
        <path d="M60 5 L68 40 L103 40 L76 60 L85 95 L60 75 L35 95 L44 60 L17 40 L52 40 Z" fill="url(#blossom-pink)" opacity="0.7" />
        <path d="M60 5 L68 40 L103 40 L76 60 L85 95 L60 75 L35 95 L44 60 L17 40 L52 40 Z" fill="url(#blossom-pink)" transform="rotate(36 60 60)" opacity="0.4" />
      </g>

      {/* Inner Heart/Flower - Rotating counter-clockwise */}
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="360 60 60" to="0 60 60" dur="18s" repeatCount="indefinite" />
        {Array.from({ length: 5 }).map((_, i) => (
          <path key={i} d="M60 25 C80 25, 80 60, 60 60 C40 60, 40 25, 60 25 Z" transform={`rotate(${i * 72} 60 60)`} fill="#ff1493" opacity="0.8" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <path key={i} d="M60 30 C72 30, 72 60, 60 60 C48 60, 48 30, 60 30 Z" transform={`rotate(${i * 72} 60 60)`} fill="#ffb6c1" opacity="0.9" />
        ))}
      </g>

      {/* Core Gem */}
      <polygon points="60,45 70,60 60,75 50,60" fill="#ffffff" />
      <polygon points="60,45 70,60 60,60" fill="#ff69b4" opacity="0.4" />
      <polygon points="70,60 60,75 60,60" fill="#c71585" opacity="0.3" />
      <polygon points="60,75 50,60 60,60" fill="#c71585" opacity="0.6" />
      <polygon points="50,60 60,45 60,60" fill="#ffffff" opacity="0.8" />

      {/* Shimmering Center Spark */}
      <circle cx="60" cy="60" r="3" fill="#ffffff">
        <animate begin="0s" attributeName="r" values="2; 4; 2" dur="1.5s" repeatCount="indefinite" />
      </circle>
      
      {/* Floating Magic Dust */}
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="8s" repeatCount="indefinite" />
        <circle cx="60" cy="18" r="2.5" fill="#ffffff" opacity="0.9" />
        <circle cx="60" cy="102" r="2.5" fill="#ffffff" opacity="0.9" />
        <circle cx="18" cy="60" r="2.5" fill="#ffffff" opacity="0.9" />
        <circle cx="102" cy="60" r="2.5" fill="#ffffff" opacity="0.9" />
      </g>
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Rank 6: Grandmaster (Amethyst / Void) - Ethereal, floating, cosmic
// ----------------------------------------------------------------------
const GrandmasterBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="gm-vortex" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#9932cc" />
        <stop offset="60%" stopColor="#4b0082" />
        <stop offset="100%" stopColor="#1a0024" />
      </radialGradient>
      <linearGradient id="gm-shard" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e6e6fa" />
        <stop offset="100%" stopColor="#8a2be2" />
      </linearGradient>
      <filter id="shadow-gm">
        <feDropShadow dx="0" dy="8" stdDeviation="7" floodOpacity="0.8" />
      </filter>
    </defs>
    <g filter="url(#shadow-gm)">
      <circle cx="60" cy="60" r="45" fill="url(#gm-vortex)" />
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="10s" repeatCount="indefinite" />
        <ellipse cx="60" cy="60" rx="55" ry="15" fill="none" stroke="#9932cc" strokeWidth="2" strokeDasharray="10 5" transform="rotate(45 60 60)" opacity="0.6" />
        <ellipse cx="60" cy="60" rx="55" ry="15" fill="none" stroke="#e6e6fa" strokeWidth="1.5" strokeDasharray="4 8" transform="rotate(-45 60 60)" opacity="0.8" />
      </g>
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="360 60 60" to="0 60 60" dur="20s" repeatCount="indefinite" />
        {[
          "60,2 66,16 60,22 54,16",
          "60,118 66,104 60,98 54,104",
          "2,60 16,66 22,60 16,54",
          "118,60 104,66 98,60 104,54"
        ].map((pts, i) => (
          <polygon key={i} points={pts} fill="url(#gm-shard)" />
        ))}
      </g>
      <polygon points="60,30 80,60 60,90 40,60" fill="url(#gm-shard)" />
      <polygon points="60,30 80,60 60,60" fill="#ffffff" opacity="0.4" />
      <polygon points="80,60 60,90 60,60" fill="#000000" opacity="0.4" />
      <polygon points="60,90 40,60 60,60" fill="#000000" opacity="0.6" />
      <polygon points="40,60 60,30 60,60" fill="#ffffff" opacity="0.1" />
      <ellipse cx="60" cy="60" rx="10" ry="4" fill="#ffffff" />
      <circle cx="60" cy="60" r="3" fill="#4b0082" />
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Rank 7: Legend (Cyan / Crystal) - Immaculate, highly faceted, pristine
// ----------------------------------------------------------------------
const LegendBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="leg-base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0ffff" />
        <stop offset="50%" stopColor="#00ced1" />
        <stop offset="100%" stopColor="#004040" />
      </linearGradient>
      <filter id="shadow-leg">
        <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.6" />
      </filter>
      <radialGradient id="leg-glow" cx="50%" cy="50%" r="50%">
         <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
         <stop offset="100%" stopColor="#00ced1" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g filter="url(#shadow-leg)">
      <circle cx="60" cy="60" r="45" fill="url(#leg-glow)">
        <animate begin="0s" attributeName="opacity" values="0.5; 1; 0.5" dur="3s" repeatCount="indefinite" />
      </circle>
      <polygon points="35,35 45,45 45,85 35,95 25,85 25,45" fill="#008b8b" />
      <polygon points="35,35 45,45 35,60" fill="#ffffff" opacity="0.3" />
      <polygon points="25,45 35,35 35,60" fill="#ffffff" opacity="0.6" />
      <polygon points="25,45 35,60 25,85" fill="#000000" opacity="0.2" />
      <polygon points="85,35 95,45 95,85 85,95 75,85 75,45" fill="#008b8b" />
      <polygon points="85,35 95,45 85,60" fill="#ffffff" opacity="0.3" />
      <polygon points="75,45 85,35 85,60" fill="#ffffff" opacity="0.6" />
      <polygon points="95,45 85,60 95,85" fill="#000000" opacity="0.4" />
      <polygon points="60,5 80,30 80,95 60,115 40,95 40,30" fill="url(#leg-base)" />
      <polygon points="60,5 80,30 60,60" fill="#ffffff" opacity="0.2" />
      <polygon points="80,30 80,95 60,60" fill="#000000" opacity="0.2" />
      <polygon points="80,95 60,115 60,60" fill="#000000" opacity="0.5" />
      <polygon points="60,115 40,95 60,60" fill="#000000" opacity="0.7" />
      <polygon points="40,95 40,30 60,60" fill="#ffffff" opacity="0.1" />
      <polygon points="40,30 60,5 60,60" fill="#ffffff" opacity="0.6" />
      <polygon points="60,30 65,40 60,50 55,40" fill="#ffffff" opacity="0.9" />
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Rank 8: Chronoa Ascendant (Gold / Divine) - Majestic, celestial, supreme
// ----------------------------------------------------------------------
const AscendantBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="asc-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff8dc" />
        <stop offset="30%" stopColor="#ffd700" />
        <stop offset="70%" stopColor="#daa520" />
        <stop offset="100%" stopColor="#8b6508" />
      </linearGradient>
      <radialGradient id="asc-light" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="50%" stopColor="#ffd700" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#daa520" stopOpacity="0" />
      </radialGradient>
      <filter id="shadow-asc">
        <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.8" />
      </filter>
    </defs>
    <g filter="url(#shadow-asc)">
      <circle cx="60" cy="60" r="55" fill="url(#asc-light)">
        <animate begin="0s" attributeName="r" values="50; 58; 50" dur="4s" repeatCount="indefinite" />
      </circle>
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="30s" repeatCount="indefinite" />
        {Array.from({ length: 12 }).map((_, i) => (
          <polygon key={i} points="57,15 63,15 60,0" transform={`rotate(${i * 30} 60 60)`} fill="url(#asc-gold)" />
        ))}
      </g>
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="360 60 60" to="0 60 60" dur="20s" repeatCount="indefinite" />
        <circle cx="60" cy="60" r="45" fill="none" stroke="url(#asc-gold)" strokeWidth="3" strokeDasharray="15 5 5 5" />
      </g>
      <g>
        <animateTransform begin="0s" attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="15s" repeatCount="indefinite" />
        <circle cx="60" cy="60" r="38" fill="none" stroke="#fff8dc" strokeWidth="1.5" strokeDasharray="4 8" />
      </g>
      <path d="M 45 25 C 20 15 5 45 10 75 C 20 50 35 55 45 60 Z" fill="url(#asc-gold)" />
      <path d="M 45 25 C 20 15 5 45 10 75 C 20 50 35 55 45 60 Z" fill="#ffffff" opacity="0.3" />
      <path d="M 75 25 C 100 15 115 45 110 75 C 100 50 85 55 75 60 Z" fill="url(#asc-gold)" />
      <path d="M 75 25 C 100 15 115 45 110 75 C 100 50 85 55 75 60 Z" fill="#000000" opacity="0.2" />
      <polygon points="60,15 85,60 60,105 35,60" fill="url(#asc-gold)" stroke="#ffffff" strokeWidth="2" />
      <polygon points="60,15 85,60 60,60" fill="#ffffff" opacity="0.5" />
      <polygon points="85,60 60,105 60,60" fill="#000000" opacity="0.3" />
      <polygon points="60,105 35,60 60,60" fill="#000000" opacity="0.6" />
      <polygon points="35,60 60,15 60,60" fill="#ffffff" opacity="0.2" />
      <polygon points="60,45 63,57 75,60 63,63 60,75 57,63 45,60 57,57" fill="#ffffff" />
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Master Renderer
// ----------------------------------------------------------------------
export default function RankBadge({ rank, className = "" }: Props) {
  const renderBadge = () => {
    switch (rank) {
      case "Novice": return <NoviceBadge />;
      case "Apprentice": return <ApprenticeBadge />;
      case "Scholar": return <ScholarBadge />;
      case "Adept": return <AdeptBadge />;
      case "Blossom": return <BlossomBadge />;
      case "Grandmaster": return <GrandmasterBadge />;
      case "Legend": return <LegendBadge />;
      case "Chronoa Ascendant": return <AscendantBadge />;
      default: return <NoviceBadge />;
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {renderBadge()}
    </div>
  );
}