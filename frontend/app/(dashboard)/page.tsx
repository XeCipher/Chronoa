import CenterClock from "@/components/home/CenterClock";
import SceneryBackground from "@/components/home/SceneryBackground";

export default function HomePage() {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center p-6">
      <SceneryBackground />
      
      <div className="z-10 flex flex-col items-center">
        <CenterClock />
        
        {/* We will add the hover-reveal timers here in the next step! */}
        <div className="mt-20 h-20">
          <p className="text-[10px] text-[#b0ad9a] tracking-[0.2em] uppercase font-bold animate-pulse">
            Scroll down to reveal dock
          </p>
        </div>
      </div>
    </div>
  );
}