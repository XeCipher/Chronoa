"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Cloud, Sun, Moon, CloudSun, CloudMoon, CloudRain, 
  CloudDrizzle, Snowflake, CloudLightning, Wind, MapPin 
} from "lucide-react";

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initWeather = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('weather_lat, weather_lon, weather_city')
        .eq('id', user.id)
        .single();

      // Only fetch weather if coordinates exist in DB. 
      // Removed navigator.geolocation fallback per request.
      if (profile?.weather_lat && profile?.weather_lon) {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${profile.weather_lat}&longitude=${profile.weather_lon}&current=temperature_2m,weather_code,is_day&timezone=auto`,
            { cache: 'no-store' }
          );
          const data = await res.json();
          setWeather(data.current);
          setCity(profile.weather_city);
        } catch (err) {
          console.error("Weather fetch failed", err);
        }
      }
      setLoading(false);
    };
    
    initWeather();
  }, []);

  const getWeatherDetails = (code: number, isDay: number) => {
    const day = isDay === 1;
    if (code === 0) return { text: "Clear", icon: day ? Sun : Moon, color: day ? "text-amber-500" : "text-indigo-300" };
    if (code === 1) return { text: "Mostly Clear", icon: day ? CloudSun : CloudMoon, color: day ? "text-amber-400" : "text-indigo-200" };
    if (code === 2) return { text: "Partly Cloudy", icon: day ? CloudSun : CloudMoon, color: "text-gray-500" };
    if (code === 3) return { text: "Overcast", icon: Cloud, color: "text-gray-500" };
    if (code === 45 || code === 48) return { text: "Foggy", icon: Wind, color: "text-gray-400" };
    if (code >= 51 && code <= 55) return { text: "Drizzle", icon: CloudDrizzle, color: "text-blue-400" };
    if (code >= 61 && code <= 65) return { text: "Rain", icon: CloudRain, color: "text-blue-500" };
    if (code >= 71 && code <= 77) return { text: "Snow", icon: Snowflake, color: "text-blue-200" };
    if (code >= 80 && code <= 82) return { text: "Showers", icon: CloudRain, color: "text-blue-500" };
    if (code >= 95) return { text: "Storms", icon: CloudLightning, color: "text-purple-600" };
    return { text: "Cloudy", icon: Cloud, color: "text-gray-400" };
  };

  if (loading || !weather) return null;

  const details = getWeatherDetails(weather.weather_code, weather.is_day);
  const Icon = details.icon;

  return (
    <div className="group flex items-center bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 shadow-sm rounded-full p-1.5 pr-3 cursor-default transition-all duration-500 ease-out animate-fade-up">
      
      {/* Icon */}
      <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/20 transition-colors ${details.color}`}>
        <Icon size={16} strokeWidth={2} />
      </div>
      
      {/* Temperature */}
      <span className="text-base font-medium text-[#3d3b33] ml-2.5">
        {Math.round(weather.temperature_2m)}°
      </span>

      {/* Hover-reveal Details */}
      <div className="grid transition-all duration-500 ease-out grid-cols-[0fr] opacity-0 group-hover:grid-cols-[1fr] group-hover:opacity-100 group-hover:ml-3">
        <div className="overflow-hidden whitespace-nowrap flex flex-col justify-center border-l border-[#3d3b33]/15 pl-3">
          <span className="text-[11px] font-semibold text-[#3d3b33] leading-tight tracking-wide">
            {details.text}
          </span>
          {city && (
            <span className="text-[8px] text-[#b0ad9a] font-bold uppercase tracking-widest leading-tight flex items-center gap-1 mt-0.5">
              <MapPin size={8} /> {city}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}