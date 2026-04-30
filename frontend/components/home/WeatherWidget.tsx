"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Cloud, Sun, Moon, CloudSun, CloudMoon, CloudRain, CloudDrizzle, Snowflake, CloudLightning, Wind, MapPin } from "lucide-react";

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [isToggled, setIsToggled] = useState(false);

  useEffect(() => {
    const initWeather = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('weather_lat, weather_lon, weather_city').eq('id', user.id).single();

      if (profile?.weather_lat && profile?.weather_lon) {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${profile.weather_lat}&longitude=${profile.weather_lon}&current=temperature_2m,weather_code,is_day&timezone=auto`, { cache: 'no-store' });
          const data = await res.json();
          setWeather(data.current);
          setCity(profile.weather_city);
        } catch (err) {}
      }
      setLoading(false);
    };
    initWeather();
  }, []);

  const getWeatherDetails = (code: number, isDay: number) => {
    const day = isDay === 1;
    if (code === 0) return { text: "Clear", icon: day ? Sun : Moon, color: day ? "text-amber-500" : "text-indigo-300" };
    if ([1, 2].includes(code)) return { text: "Partly Cloudy", icon: day ? CloudSun : CloudMoon, color: "text-gray-500 dark:text-gray-400" };
    if (code === 3) return { text: "Overcast", icon: Cloud, color: "text-gray-500 dark:text-gray-400" };
    if ([45, 48].includes(code)) return { text: "Fog", icon: Wind, color: "text-gray-400 dark:text-gray-500" };
    if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: CloudDrizzle, color: "text-blue-400" };
    if ([61, 63, 65, 66, 67].includes(code)) return { text: "Rain", icon: CloudRain, color: "text-blue-500" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: "Snow", icon: Snowflake, color: "text-blue-200 dark:text-blue-300" };
    if ([80, 81, 82].includes(code)) return { text: "Showers", icon: CloudRain, color: "text-blue-500" };
    if ([95, 96, 99].includes(code)) return { text: "Storms", icon: CloudLightning, color: "text-purple-600 dark:text-purple-400" };
    return { text: "Cloudy", icon: Cloud, color: "text-gray-400 dark:text-gray-500" };
  };

  if (loading || !weather) return null;

  const details = getWeatherDetails(weather.weather_code, weather.is_day);
  const Icon = details.icon;

  return (
    <div 
      onClick={() => setIsToggled(!isToggled)}
      className={`
        group flex items-center bg-white/10 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm rounded-full p-1.5 cursor-pointer transition-all duration-500 ease-out animate-fade-up
        ${isToggled ? 'pr-4' : 'pr-3'}
      `}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/20 dark:bg-black/40 transition-colors ${details.color}`}>
        <Icon size={16} strokeWidth={2} />
      </div>
      
      <span className="text-base font-medium text-[#3d3b33] dark:text-white ml-2.5 transition-colors">
        {Math.round(weather.temperature_2m)}°
      </span>

      <div className={`
        grid transition-all duration-500 ease-out 
        ${isToggled ? 'grid-cols-[1fr] opacity-100 ml-3' : 'grid-cols-[0fr] opacity-0 group-hover:grid-cols-[1fr] group-hover:opacity-100 group-hover:ml-3'}
      `}>
        <div className="overflow-hidden whitespace-nowrap flex flex-col justify-center border-l border-[#3d3b33]/15 dark:border-white/15 pl-3 transition-colors">
          <span className="text-[11px] font-semibold text-[#3d3b33] dark:text-white leading-tight tracking-wide transition-colors">
            {details.text}
          </span>
          {city && (
            <span className="text-[8px] text-[#b0ad9a] dark:text-[#a0a0a0] font-bold uppercase tracking-widest leading-tight flex items-center gap-1 mt-0.5 transition-colors">
              <MapPin size={8} /> {city}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}