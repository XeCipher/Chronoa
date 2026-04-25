"use client";

import CenterClock from "@/components/home/CenterClock";
import SceneryBackground from "@/components/home/SceneryBackground";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";
import WeatherWidget from "@/components/home/WeatherWidget"; // NEW

export default function HomePage() {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      <SceneryBackground />
      
      {/* Top Right Header */}
      <div className="absolute top-8 right-10 z-20">
        <WeatherWidget />
      </div>

      <div className="z-10 flex flex-col items-center animate-fade-up">
        <CenterClock />
        <ProductivityWidgets />
      </div>
    </div>
  );
}