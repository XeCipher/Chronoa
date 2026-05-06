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
        {/* Rich Copper Bronze - Balanced warmth without the "neon" orange */}
        <stop offset="0%" stopColor="#b87333" />
        <stop offset="50%" stopColor="#8c5a3c" />
        <stop offset="100%" stopColor="#5d3a24" />
      </linearGradient>
      <linearGradient id="novice-highlight" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#795548" />
        <stop offset="100%" stopColor="#a1887f" />
      </linearGradient>
      <radialGradient id="novice-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#d7ccc8" />
        <stop offset="100%" stopColor="#8d6e63" />
      </radialGradient>
      <filter id="shadow-novice">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4" />
      </filter>
    </defs>
    <g filter="url(#shadow-novice)">
      {/* Outer Rim - Solid metallic feel */}
      <circle cx="60" cy="60" r="50" fill="url(#novice-metal)" />
      {/* Deep recessed area for contrast */}
      <circle cx="60" cy="60" r="42" fill="#321a11" />
      {/* Internal coin face */}
      <circle cx="60" cy="60" r="38" fill="url(#novice-highlight)" />
      
      {/* Center Star - Bronze texture */}
      <polygon points="60,18 70,50 102,60 70,70 60,102 50,70 18,60 50,50" fill="url(#novice-metal)" stroke="#321a11" strokeWidth="1.2" />
      
      {/* Faceting - Using low-opacity overlays to give it shape without looking "glowy" */}
      <polygon points="60,18 70,50 60,60" fill="#ffffff" opacity="0.2" />
      <polygon points="102,60 70,70 60,60" fill="#000000" opacity="0.15" />
      <polygon points="60,102 50,70 60,60" fill="#000000" opacity="0.3" />
      <polygon points="18,60 50,50 60,60" fill="#ffffff" opacity="0.1" />
      
      {/* Core Detail */}
      <circle cx="60" cy="60" r="12" fill="url(#novice-core)" />
      <circle cx="60" cy="60" r="12" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.2" />
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
      <style>{`
        @keyframes blossom-cw   { to   { transform: rotate(360deg);  } }
        @keyframes blossom-ccw  { to   { transform: rotate(-360deg); } }
        @keyframes blossom-cw45 { from { transform: rotate(45deg);   }
                                   to   { transform: rotate(405deg);  } }
      `}</style>

      <linearGradient id="blossom-pink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#ffc0cb" />
        <stop offset="40%"  stopColor="#ff69b4" />
        <stop offset="100%" stopColor="#c71585" />
      </linearGradient>
      <linearGradient id="blossom-petal-a" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#ffe4e1" />
        <stop offset="100%" stopColor="#ff1493" />
      </linearGradient>
      <linearGradient id="blossom-petal-b" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#ff69b4" />
        <stop offset="100%" stopColor="#ffb6c1" />
      </linearGradient>
      <radialGradient id="blossom-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"   />
        <stop offset="40%"  stopColor="#ff69b4" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ff1493" stopOpacity="0"   />
      </radialGradient>
      <radialGradient id="blossom-gem" cx="40%" cy="30%" r="65%">
        <stop offset="0%"   stopColor="#fff0f5" />
        <stop offset="50%"  stopColor="#ff69b4" />
        <stop offset="100%" stopColor="#8b0045" />
      </radialGradient>
      <filter id="shadow-blossom">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.7" floodColor="#ff1493" />
      </filter>
    </defs>

    <g filter="url(#shadow-blossom)">

      {/* Pulsing outer glow — opacity only, no rotation needed */}
      <circle cx="60" cy="60" r="52" fill="url(#blossom-glow)">
        <animate attributeName="opacity" values="0.3; 0.85; 0.3" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Outer star — CW 28 s */}
      <g style={{ transformOrigin: '50% 50%', animation: 'blossom-cw 28s linear infinite' }}>
        <polygon
          points="60,10 72,44 108,45 79,66 89,100 60,80 31,100 41,66 12,45 48,44"
          fill="url(#blossom-pink)" opacity="0.75"
        />
        <polygon
          points="60,10 72,44 108,45 79,66 89,100 60,80 31,100 41,66 12,45 48,44"
          fill="url(#blossom-petal-a)" transform="rotate(36 60 60)" opacity="0.38"
        />
      </g>

      {/* Inner petals A — CCW 20 s */}
      <g style={{ transformOrigin: '50% 50%', animation: 'blossom-ccw 20s linear infinite' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={i}
            d="M60 26 C80 26, 80 60, 60 60 C40 60, 40 26, 60 26 Z"
            transform={`rotate(${i * 72} 60 60)`}
            fill="url(#blossom-petal-a)"
            opacity="0.85"
          />
        ))}
      </g>

      {/* Inner petals B — CW 15 s, offset 36° */}
      <g style={{ transformOrigin: '50% 50%', animation: 'blossom-cw 15s linear infinite' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={i}
            d="M60 33 C73 33, 73 60, 60 60 C47 60, 47 33, 60 33 Z"
            transform={`rotate(${i * 72 + 36} 60 60)`}
            fill="url(#blossom-petal-b)"
            opacity="0.9"
          />
        ))}
      </g>

      {/* Shimmer ring — CW 7 s */}
      <circle
        cx="60" cy="60" r="30"
        fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="5 7" opacity="0.45"
        style={{ transformOrigin: '50% 50%', animation: 'blossom-cw 7s linear infinite' }}
      />

      {/* Core faceted diamond gem — static */}
      <polygon points="60,44 74,60 60,76 46,60" fill="url(#blossom-gem)" />
      <polygon points="60,44 74,60 60,60" fill="#ffffff" opacity="0.55" />
      <polygon points="74,60 60,76 60,60" fill="#c71585" opacity="0.3"  />
      <polygon points="60,76 46,60 60,60" fill="#8b0045" opacity="0.5"  />
      <polygon points="46,60 60,44 60,60" fill="#ffffff" opacity="0.85" />
      <polygon points="60,44 67,52 60,52" fill="#ffffff" opacity="0.8"  />

      {/* Cross-sparkle on gem — static */}
      <polygon points="60,48 62,58 60,68 58,58" fill="#ffffff" opacity="0.6" />
      <polygon points="52,60 58,58 68,60 58,62" fill="#ffffff" opacity="0.6" />

      {/* Centre pulse — radius + opacity only */}
      <circle cx="60" cy="60" r="4" fill="#ffffff">
        <animate attributeName="r"       values="3; 5.5; 3"   dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7; 1; 0.7" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Cardinal sparkle dots — CW 9 s */}
      <g style={{ transformOrigin: '50% 50%', animation: 'blossom-cw 9s linear infinite' }}>
        <circle cx="60"  cy="15"  r="2.8" fill="#ffffff" opacity="0.95" />
        <circle cx="105" cy="60"  r="2.8" fill="#ffffff" opacity="0.95" />
        <circle cx="60"  cy="105" r="2.8" fill="#ffffff" opacity="0.95" />
        <circle cx="15"  cy="60"  r="2.8" fill="#ffffff" opacity="0.95" />
      </g>

      {/* Diagonal sparkle dots — CW 14 s, starting at 45° */}
      <g style={{ transformOrigin: '50% 50%', animation: 'blossom-cw45 14s linear infinite' }}>
        <circle cx="60"  cy="15"  r="1.8" fill="#ffb6c1" opacity="0.9" />
        <circle cx="105" cy="60"  r="1.8" fill="#ffb6c1" opacity="0.9" />
        <circle cx="60"  cy="105" r="1.8" fill="#ffb6c1" opacity="0.9" />
        <circle cx="15"  cy="60"  r="1.8" fill="#ffb6c1" opacity="0.9" />
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
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>{`
        @keyframes leg-spin-cw { 100% { transform: rotate(360deg); } }
        @keyframes leg-spin-ccw { 100% { transform: rotate(-360deg); } }
        @keyframes leg-pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes leg-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
      `}</style>
      
      <linearGradient id="leg-cyan-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00ced1" />
        <stop offset="50%" stopColor="#008b8b" />
        <stop offset="100%" stopColor="#002b2b" />
      </linearGradient>
      <linearGradient id="leg-cyan-light" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0ffff" />
        <stop offset="50%" stopColor="#00ffff" />
        <stop offset="100%" stopColor="#008080" />
      </linearGradient>
      <radialGradient id="leg-core-glow" cx="50%" cy="50%" r="50%">
         <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
         <stop offset="30%" stopColor="#00ffff" stopOpacity="0.8" />
         <stop offset="100%" stopColor="#004040" stopOpacity="0" />
      </radialGradient>
      <filter id="shadow-leg-intense">
        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#00ffff" floodOpacity="0.7" />
      </filter>
    </defs>
    
    <g filter="url(#shadow-leg-intense)">
      {/* Intense Core Aura */}
      <circle cx="60" cy="60" r="55" fill="url(#leg-core-glow)" style={{ animation: 'leg-pulse 3s ease-in-out infinite', transformOrigin: 'center' }} />

      {/* Intricate Magic Circles */}
      <g style={{ animation: 'leg-spin-cw 20s linear infinite', transformOrigin: '50% 50%' }}>
        <circle cx="60" cy="60" r="48" fill="none" stroke="#00ffff" strokeWidth="1" strokeDasharray="2 4 8 4" opacity="0.6" />
        <polygon points="60,12 94,26 108,60 94,94 60,108 26,94 12,60 26,26" fill="none" stroke="#e0ffff" strokeWidth="0.5" opacity="0.5" />
      </g>
      <g style={{ animation: 'leg-spin-ccw 15s linear infinite', transformOrigin: '50% 50%' }}>
        <circle cx="60" cy="60" r="42" fill="none" stroke="#00ced1" strokeWidth="1.5" strokeDasharray="10 15 30 15" opacity="0.8" />
        <polygon points="60,18 89.7,89.7 18,42.7 102,42.7 30.3,89.7" fill="none" stroke="#00ffff" strokeWidth="0.5" opacity="0.4" />
      </g>

      {/* Orbiting Floating Shards */}
      <g style={{ animation: 'leg-spin-cw 25s linear infinite', transformOrigin: '50% 50%' }}>
        {[0, 90, 180, 270].map((angle, i) => (
          <g key={i} transform={`rotate(${angle} 60 60)`}>
            <polygon points="60,2 64,12 60,22 56,12" fill="url(#leg-cyan-light)" />
            <polygon points="60,2 64,12 60,12" fill="#ffffff" opacity="0.8" />
            <polygon points="64,12 60,22 60,12" fill="#004040" opacity="0.6" />
          </g>
        ))}
      </g>
      <g style={{ animation: 'leg-spin-ccw 18s linear infinite', transformOrigin: '50% 50%' }}>
        {[45, 135, 225, 315].map((angle, i) => (
          <g key={i} transform={`rotate(${angle} 60 60)`}>
            <polygon points="60,8 63,15 60,25 57,15" fill="url(#leg-cyan-dark)" />
            <polygon points="60,8 63,15 60,15" fill="#ffffff" opacity="0.9" />
            <polygon points="63,15 60,25 60,15" fill="#000000" opacity="0.5" />
          </g>
        ))}
      </g>

      {/* Main Crystal Monolith (Floating) */}
      <g style={{ animation: 'leg-float 4s ease-in-out infinite', transformOrigin: 'center' }}>
        {/* Outer Facets */}
        <polygon points="60,15 85,45 85,75 60,105 35,75 35,45" fill="url(#leg-cyan-dark)" />
        {/* Top/Bottom Pyramids */}
        <polygon points="60,15 85,45 60,60" fill="#ffffff" opacity="0.5" />
        <polygon points="60,15 35,45 60,60" fill="#ffffff" opacity="0.2" />
        <polygon points="85,75 60,105 60,60" fill="#000000" opacity="0.4" />
        <polygon points="35,75 60,105 60,60" fill="#000000" opacity="0.7" />
        {/* Side Facets */}
        <polygon points="85,45 85,75 60,60" fill="#008b8b" opacity="0.6" />
        <polygon points="35,45 35,75 60,60" fill="#00ced1" opacity="0.3" />

        {/* Inner Crystal Core */}
        <polygon points="60,30 75,50 75,70 60,90 45,70 45,50" fill="url(#leg-cyan-light)" />
        <polygon points="60,30 75,50 60,60" fill="#ffffff" opacity="0.8" />
        <polygon points="60,30 45,50 60,60" fill="#ffffff" opacity="0.4" />
        <polygon points="75,70 60,90 60,60" fill="#002b2b" opacity="0.6" />
        <polygon points="45,70 60,90 60,60" fill="#004040" opacity="0.8" />
        <polygon points="75,50 75,70 60,60" fill="#00ffff" opacity="0.3" />
        <polygon points="45,50 45,70 60,60" fill="#e0ffff" opacity="0.2" />

        {/* Center Diamond Spark */}
        <polygon points="60,45 66,60 60,75 54,60" fill="#ffffff" />
      </g>

      {/* Lens Flares / Glints */}
      <g style={{ animation: 'leg-pulse 2s ease-in-out infinite alternate', transformOrigin: 'center' }}>
        <polygon points="60,20 61,40 80,60 61,80 60,100 59,80 40,60 59,40" fill="#ffffff" opacity="0.6" />
        <circle cx="60" cy="60" r="3" fill="#ffffff" />
      </g>
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// Rank 8: Chronoa Ascendant (Gold / Divine) - Majestic, celestial, supreme
// ----------------------------------------------------------------------
const AscendantBadge = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>{`
        @keyframes asc-spin-cw { 100% { transform: rotate(360deg); } }
        @keyframes asc-spin-ccw { 100% { transform: rotate(-360deg); } }
        @keyframes asc-pulse-glow { 0%, 100% { opacity: 0.7; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes asc-heartbeat { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.15); } 30% { transform: scale(1); } 45% { transform: scale(1.15); } 60% { transform: scale(1); } }
      `}</style>
      
      <linearGradient id="asc-gold-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#fff8dc" />
        <stop offset="60%" stopColor="#ffd700" />
        <stop offset="100%" stopColor="#b8860b" />
      </linearGradient>
      <linearGradient id="asc-gold-dark" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#daa520" />
        <stop offset="50%" stopColor="#8b6508" />
        <stop offset="100%" stopColor="#4a3600" />
      </linearGradient>
      <radialGradient id="asc-divine-aura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="20%" stopColor="#ffd700" stopOpacity="0.9" />
        <stop offset="60%" stopColor="#ff8c00" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#8b0000" stopOpacity="0" />
      </radialGradient>
      <filter id="shadow-asc-godly">
        <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#ffd700" floodOpacity="0.8" />
        <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#8b6508" floodOpacity="0.6" />
      </filter>
    </defs>

    <g filter="url(#shadow-asc-godly)">
      {/* Divine Pulsing Aura */}
      <circle cx="60" cy="60" r="58" fill="url(#asc-divine-aura)" style={{ animation: 'asc-pulse-glow 4s ease-in-out infinite', transformOrigin: 'center' }} />

      {/* Clockwork / Astrolabe Outer Gears */}
      <g style={{ animation: 'asc-spin-cw 40s linear infinite', transformOrigin: '50% 50%' }}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="url(#asc-gold-dark)" strokeWidth="4" strokeDasharray="6 4" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="url(#asc-gold-light)" strokeWidth="1" strokeDasharray="20 10 5 10" opacity="0.8" />
        {/* Gear Teeth */}
        {Array.from({ length: 24 }).map((_, i) => (
          <polygon key={i} points="58,6 62,6 61,10 59,10" transform={`rotate(${i * 15} 60 60)`} fill="url(#asc-gold-light)" />
        ))}
      </g>

      {/* Inner Rotating Runes/Rings */}
      <g style={{ animation: 'asc-spin-ccw 25s linear infinite', transformOrigin: '50% 50%' }}>
        <circle cx="60" cy="60" r="38" fill="none" stroke="url(#asc-gold-light)" strokeWidth="2" strokeDasharray="1 6" />
        <circle cx="60" cy="60" r="42" fill="none" stroke="#daa520" strokeWidth="0.5" />
        {Array.from({ length: 8 }).map((_, i) => (
          <polygon key={i} points="60,18 63,22 57,22" transform={`rotate(${i * 45} 60 60)`} fill="#ffffff" opacity="0.8" />
        ))}
      </g>

      {/* Armillary Sphere Rings (3D Illusion) */}
      <g style={{ animation: 'asc-spin-cw 15s linear infinite', transformOrigin: '50% 50%' }}>
        <ellipse cx="60" cy="60" rx="32" ry="10" fill="none" stroke="url(#asc-gold-light)" strokeWidth="1.5" transform="rotate(30 60 60)" />
        <ellipse cx="60" cy="60" rx="32" ry="10" fill="none" stroke="url(#asc-gold-light)" strokeWidth="1.5" transform="rotate(90 60 60)" opacity="0.6" />
        <ellipse cx="60" cy="60" rx="32" ry="10" fill="none" stroke="url(#asc-gold-light)" strokeWidth="1.5" transform="rotate(150 60 60)" opacity="0.9" />
      </g>

      {/* Angelic Wing Motifs */}
      <g opacity="0.95">
        {/* Left Wings */}
        <path d="M 60 60 C 30 30 10 40 5 60 C 15 55 30 60 40 68 Z" fill="url(#asc-gold-light)" />
        <path d="M 60 60 C 35 45 15 65 10 80 C 25 70 40 70 45 75 Z" fill="url(#asc-gold-dark)" />
        <path d="M 60 60 C 40 65 25 85 20 100 C 35 85 50 80 55 85 Z" fill="url(#asc-gold-light)" opacity="0.8" />
        {/* Right Wings */}
        <path d="M 60 60 C 90 30 110 40 115 60 C 105 55 90 60 80 68 Z" fill="url(#asc-gold-light)" />
        <path d="M 60 60 C 85 45 105 65 110 80 C 95 70 80 70 75 75 Z" fill="url(#asc-gold-dark)" />
        <path d="M 60 60 C 80 65 95 85 100 100 C 85 85 70 80 65 85 Z" fill="url(#asc-gold-light)" opacity="0.8" />
      </g>

      {/* Central Chronoa Core (Hourglass / Starburst Hybrid) */}
      <g style={{ animation: 'asc-heartbeat 3s ease-in-out infinite', transformOrigin: 'center' }}>
        {/* 8-Pointed Star Base */}
        <polygon points="60,20 68,45 95,45 72,60 82,85 60,70 38,85 48,60 25,45 52,45" fill="url(#asc-gold-dark)" stroke="#fff8dc" strokeWidth="1" />
        {/* Inner Hourglass / Infinite Crystal */}
        <polygon points="45,35 75,35 60,60" fill="url(#asc-gold-light)" />
        <polygon points="45,35 75,35 60,60" fill="#ffffff" opacity="0.5" />
        <polygon points="45,85 75,85 60,60" fill="url(#asc-gold-dark)" />
        <polygon points="45,85 75,85 60,60" fill="#000000" opacity="0.4" />
        
        {/* Facet highlights */}
        <polygon points="60,35 75,35 60,60" fill="#ffffff" opacity="0.6" />
        <polygon points="45,85 60,85 60,60" fill="#ffffff" opacity="0.2" />

        {/* The Time Eye / Core Sphere */}
        <circle cx="60" cy="60" r="10" fill="#ffffff" />
        <circle cx="60" cy="60" r="8" fill="url(#asc-gold-light)" />
        <circle cx="60" cy="60" r="4" fill="#ffffff" />
      </g>

      {/* Floating Sparkles (Constellations) */}
      <g style={{ animation: 'asc-spin-cw 60s linear infinite', transformOrigin: '50% 50%' }}>
        {[[60, 5], [115, 60], [60, 115], [5, 60], [21, 21], [99, 21], [99, 99], [21, 99]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 2 : 1.5} fill="#ffffff" opacity={i % 2 === 0 ? 1 : 0.6} style={{ animation: 'asc-pulse-glow 2s infinite alternate', animationDelay: `${i * 0.2}s` }} />
        ))}
      </g>
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