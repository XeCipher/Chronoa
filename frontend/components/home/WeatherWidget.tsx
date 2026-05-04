// frontend/components/home/WeatherWidget.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Cloud, Sun, Moon, CloudSun, CloudMoon, CloudRain, CloudDrizzle, Snowflake, CloudLightning, Wind, MapPin } from "lucide-react";

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [city, setCity] = useState("");
  const [isToggled, setIsToggled] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsToggled(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
       document.removeEventListener("mousedown", handleClickOutside);
       document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const fetchWeather = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('weather_lat, weather_lon, weather_city')
      .eq('id', user.id)
      .single();

    if (profile?.weather_lat && profile?.weather_lon && profile?.weather_city) {
      try {
        const params = new URLSearchParams({
          latitude: profile.weather_lat.toString(),
          longitude: profile.weather_lon.toString(),
          current: 'temperature_2m,weather_code,is_day,precipitation,cloud_cover',
          timezone: 'auto',
          forecast_days: '1'
        });

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();

        if (data?.current) {
          setWeather(data.current);
          setCity(profile.weather_city);
          localStorage.setItem('chronoa_cache_weather', JSON.stringify(data.current));
          localStorage.setItem('chronoa_cache_weather_city', profile.weather_city);
        }
      } catch (err) {
        console.error("Weather Error:", err);
      }
    } else {
      // Forcefully clear cache and state if no location is set
      setWeather(null);
      setCity("");
      localStorage.removeItem('chronoa_cache_weather');
      localStorage.removeItem('chronoa_cache_weather_city');
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem('chronoa_cache_weather');
    const cachedCity = localStorage.getItem('chronoa_cache_weather_city');
    if (cached && cachedCity) {
      try {
        setWeather(JSON.parse(cached));
        setCity(cachedCity);
      } catch(e) {}
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 20 * 60 * 1000); 
    return () => clearInterval(interval);
  }, []);

  const getWeatherDetails = (code: number, isDay: number, precipitation: number, cloudCover: number) => {
    const day = isDay === 1;
    let calibratedCode = code;

    if (precipitation <= 0 && (code >= 50)) {
      if (cloudCover < 20) calibratedCode = 0; 
      else if (cloudCover < 50) calibratedCode = 1; 
      else calibratedCode = 3; 
    }

    if (calibratedCode === 0) return { text: day ? "Sunny" : "Clear", icon: day ? Sun : Moon, color: day ? "text-amber-500" : "text-indigo-300" };
    if ([1, 2].includes(calibratedCode)) return { text: "Partly Cloudy", icon: day ? CloudSun : CloudMoon, color: "text-gray-400" };
    if (calibratedCode === 3) return { text: "Cloudy", icon: Cloud, color: "text-gray-500" };
    if ([45, 48].includes(calibratedCode)) return { text: "Foggy", icon: Wind, color: "text-gray-400" };
    if ([51, 53, 55, 56, 57].includes(calibratedCode)) return { text: "Drizzle", icon: CloudDrizzle, color: "text-blue-300" };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(calibratedCode)) return { text: "Rainy", icon: CloudRain, color: "text-blue-500" };
    if ([71, 73, 75, 77, 85, 86].includes(calibratedCode)) return { text: "Snowy", icon: Snowflake, color: "text-blue-100" };
    if ([95, 96, 99].includes(calibratedCode)) return { text: "Storms", icon: CloudLightning, color: "text-purple-500" };
    return { text: day ? "Sunny" : "Clear", icon: day ? Sun : Moon, color: day ? "text-amber-500" : "text-indigo-300" };
  };

  // Completely invisible if no weather is available
  if (!weather || !city) return null;

  const details = getWeatherDetails(weather.weather_code, weather.is_day, weather.precipitation, weather.cloud_cover);
  const Icon = details.icon;

  return (
    <div 
      ref={widgetRef}
      onClick={() => setIsToggled(!isToggled)}
      className={`
        group flex items-center bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] p-1.5 md:p-2 cursor-pointer transition-all duration-500 ease-out animate-fade-up h-[48px] md:h-[56px]
        ${isToggled ? 'pr-4 md:pr-5' : 'pr-3 md:pr-4'}
      `}
    >
      <div className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 dark:bg-black/40 transition-colors ${details.color} shrink-0`}>
        <Icon size={18} strokeWidth={2.5} className="md:w-[20px] md:h-[20px]" />
      </div>
      
      <span className="text-[14px] md:text-[15px] font-semibold text-[#3d3b33] dark:text-white ml-2 md:ml-2.5 transition-colors tabular-nums">
        {Math.round(weather.temperature_2m)}°
      </span>

      <div className={`
        flex overflow-hidden transition-all duration-400 ease-out 
        ${isToggled ? 'max-w-[150px] opacity-100 ml-2.5 md:ml-3' : 'max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-2.5 group-hover:md:ml-3'}
      `}>
        <div className="whitespace-nowrap flex flex-col justify-center border-l border-[#3d3b33]/15 dark:border-white/15 pl-2.5 md:pl-3 transition-colors">
          <span className="text-[10px] md:text-[11px] font-semibold text-[#3d3b33] dark:text-white leading-tight tracking-wide transition-colors">
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