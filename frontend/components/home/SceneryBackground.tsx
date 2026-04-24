"use client";

import { useEffect, useState } from "react";

export default function SceneryBackground() {
  const [hour, setHour] = useState(new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Determine time of day
  const getTimeOfDay = () => {
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "dusk";
    return "night";
  };

  const time = getTimeOfDay();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-[3000ms]">
      {/* Dynamic Sky Gradient */}
      <div className={`absolute inset-0 transition-opacity duration-[3000ms] ${
        time === 'dawn' ? 'bg-gradient-to-b from-[#ff9a8b] to-[#f7f5f0] opacity-100' :
        time === 'day' ? 'bg-gradient-to-b from-[#87ceeb]/20 to-[#f7f5f0] opacity-100' :
        time === 'dusk' ? 'bg-gradient-to-b from-[#2c3e50] via-[#fd746c] to-[#f7f5f0] opacity-100' :
        'bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364] opacity-100'
      }`} />

      {/* Atmospheric Elements */}
      <div className="absolute inset-0">
        {/* Dawn/Dusk Sun/Moon */}
        {(time === 'dawn' || time === 'dusk') && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-400/20 rounded-full blur-[120px]" />
        )}
        
        {/* Night Stars (CSS generated) */}
        {time === 'night' && (
          <div className="absolute inset-0 opacity-50">
            {[...Array(50)].map((_, i) => (
              <div 
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                  width: Math.random() * 2 + 'px',
                  height: Math.random() * 2 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animationDelay: Math.random() * 3 + 's'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Distant Hills (Pure CSS Silhouettes) */}
      <div className="absolute bottom-0 w-full h-[30vh] opacity-30">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full preserve-3d">
          <path 
            fill={time === 'night' ? '#001524' : '#7ca982'} 
            fillOpacity="0.4" 
            d="M0,160L80,176C160,192,320,224,480,213.3C640,203,800,149,960,144C1120,139,1280,181,1360,202.7L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
}