// frontend/components/home/WeatherWidget.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Cloud, Sun, Moon, CloudSun, CloudMoon, CloudRain, CloudDrizzle, Snowflake, CloudLightning, Wind, MapPin } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function WeatherWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const [weather, setWeather] = useState<any>(null);
  const [city, setCity] = useState("");
  const [isToggled, setIsToggled] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
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

  const loadData = useCallback(async (isInitial = false) => {
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

        // Appending a timestamp bypasses aggressive browser/Next.js fetch caches
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}&_t=${Date.now()}`, { cache: 'no-store' });
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
      setWeather(null);
      setCity("");
      localStorage.removeItem('chronoa_cache_weather');
      localStorage.removeItem('chronoa_cache_weather_city');
      
      if (isInitial) {
        const count = parseInt(localStorage.getItem('chronoa_weather_prompt_count') || '0', 10);
        if (count < 3) {
          setPromptCount(count + 1);
          localStorage.setItem('chronoa_weather_prompt_count', (count + 1).toString());
        }
      }
    }
    setIsLoaded(true);
  }, []);

  // Standard interval and initial mount effect
  useEffect(() => {
    const cached = localStorage.getItem('chronoa_cache_weather');
    const cachedCity = localStorage.getItem('chronoa_cache_weather_city');
    
    if (cached && cachedCity) {
      try {
        setWeather(JSON.parse(cached));
        setCity(cachedCity);
        setIsLoaded(true);
      } catch(e) {}
    }

    loadData(true);
    const interval = setInterval(() => loadData(false), 20 * 60 * 1000); 
    return () => clearInterval(interval);
  }, [loadData]);

  // Next.js Router specific effect to force updates when returning to the home page
  useEffect(() => {
    if (pathname === '/home' || pathname === '/') {
      loadData(false);
    }
  }, [pathname, loadData]);

  // OS Tab Focus specific effect (Switching back to the app from another window)
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') loadData(false);
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);
    return () => {
       window.removeEventListener('focus', handleFocus);
       window.removeEventListener('visibilitychange', handleFocus);
    }
  }, [loadData]);

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

  if (!isLoaded) return null;

  if (!weather || !city) {
    if (promptCount > 0 && promptCount <= 3) {
      return (
        <div onClick={() => router.push('/settings#weather')} className="cursor-pointer group flex items-center bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[1.25rem] md:rounded-[1.5rem] p-2 md:p-2.5 animate-fade-up z-40 transition-all duration-300">
           <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 dark:bg-black/40 mr-2 md:mr-2.5 shrink-0">
             <MapPin size={12} className="text-[#3d3b33] dark:text-white" />
           </div>
           <span className="text-[9px] md:text-[10px] font-semibold text-[#3d3b33] dark:text-white tracking-wide pr-1 md:pr-2">Add location for weather</span>
        </div>
      );
    }
    return null;
  }

  const details = getWeatherDetails(weather.weather_code, weather.is_day, weather.precipitation, weather.cloud_cover);
  const Icon = details.icon;

  return (
    <div 
      ref={widgetRef}
      onClick={() => setIsToggled(!isToggled)}
      className={`
        group flex items-center bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] p-1.5 md:p-2 cursor-pointer transition-all duration-500 ease-in-out animate-fade-up h-[48px] md:h-[56px] overflow-hidden z-40
        ${isToggled ? 'max-w-[250px] pr-4 md:pr-5' : 'max-w-[90px] md:max-w-[104px] hover:max-w-[250px] hover:pr-4 md:hover:pr-5'}
      `}
    >
      <div className="flex items-center w-[78px] md:w-[88px] shrink-0 justify-between">
        <div className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 dark:bg-black/40 transition-colors ${details.color} shrink-0`}>
          <Icon size={18} strokeWidth={2.5} className="md:w-[20px] md:h-[20px]" />
        </div>
        <span className="flex-1 text-center text-[14px] md:text-[15px] font-semibold text-[#3d3b33] dark:text-white transition-colors tabular-nums">
          {Math.round(weather.temperature_2m)}°
        </span>
      </div>

      <div className={`
        flex overflow-hidden transition-all duration-500 ease-in-out 
        ${isToggled ? 'max-w-[150px] opacity-100 ml-1.5 md:ml-2' : 'max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-1.5 group-hover:md:ml-2'}
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