import CenterClock from "@/components/home/CenterClock";

export default function HomePage() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Temporary placeholder for the scenery */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f7f5f0] to-[#e8d5f5]/30 pointer-events-none"></div>
      
      <div className="z-10 flex flex-col items-center">
        <CenterClock />
        <p className="mt-4 text-[#888] text-sm tracking-widest uppercase">Select a module from the sidebar</p>
      </div>
    </div>
  );
}