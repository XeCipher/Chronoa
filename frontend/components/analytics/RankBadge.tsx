"use client";

interface Props {
  rank: string;
  className?: string;
}

export default function RankBadge({ rank, className = "" }: Props) {
  const getBadgeColors = () => {
    switch (rank) {
      case "Novice": return { primary: "#cd7f32", secondary: "#8b4513", accent: "#a0522d" }; // Bronze
      case "Apprentice": return { primary: "#b0c4de", secondary: "#708090", accent: "#778899" }; // Iron/Steel
      case "Scholar": return { primary: "#4682b4", secondary: "#2f4f4f", accent: "#5f9ea0" }; // Blue Steel
      case "Adept": return { primary: "#3cb371", secondary: "#2e8b57", accent: "#00fa9a" }; // Emerald
      case "Master": return { primary: "#dc143c", secondary: "#8b0000", accent: "#ff4500" }; // Ruby
      case "Grandmaster": return { primary: "#9932cc", secondary: "#4b0082", accent: "#ba55d3" }; // Amethyst
      case "Legend": return { primary: "#00ced1", secondary: "#008080", accent: "#20b2aa" }; // Diamond/Cyan
      case "Chronoa Ascendant": return { primary: "#ffd700", secondary: "#daa520", accent: "#ff8c00" }; // Gold
      default: return { primary: "#cd7f32", secondary: "#8b4513", accent: "#a0522d" };
    }
  };

  const colors = getBadgeColors();

  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-xl ${className}`}
    >
      <defs>
        <linearGradient id={`gradMain-${rank}`} x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor={colors.primary} />
          <stop offset="1" stopColor={colors.secondary} />
        </linearGradient>
        <linearGradient id={`gradAccent-${rank}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor={colors.accent} />
          <stop offset="1" stopColor={colors.secondary} />
        </linearGradient>
        <linearGradient id={`gradGlow-${rank}`} x1="0" y1="0" x2="100" y2="100">
          <stop stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill={`url(#gradAccent-${rank})`} />
      <path d="M50 12 L82 28 L82 72 L50 88 L18 72 L18 28 Z" fill={`url(#gradMain-${rank})`} />
      <path d="M50 12 L82 28 L50 50 L18 28 Z" fill={`url(#gradGlow-${rank})`} />
      <path d="M82 28 L82 72 L50 88 L50 50 Z" fill="#000000" fillOpacity="0.2" />
      <path d="M50 35 L65 50 L50 65 L35 50 Z" fill="#ffffff" fillOpacity="0.8" />
      <path d="M50 35 L65 50 L50 50 Z" fill="#ffffff" fillOpacity="0.4" />
      <path d="M65 50 L50 65 L50 50 Z" fill="#000000" fillOpacity="0.1" />

      {(rank === "Legend" || rank === "Chronoa Ascendant") && (
        <>
          <path d="M50 5 L52 15 L62 17 L52 19 L50 29 L48 19 L38 17 L48 15 Z" fill="#ffffff" />
          <path d="M20 70 L21 75 L26 76 L21 77 L20 82 L19 77 L14 76 L19 75 Z" fill="#ffffff" />
          <path d="M80 70 L81 75 L86 76 L81 77 L80 82 L79 77 L74 76 L79 75 Z" fill="#ffffff" />
        </>
      )}
    </svg>
  );
}