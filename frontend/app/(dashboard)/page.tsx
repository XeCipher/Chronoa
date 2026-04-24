import CenterClock from "@/components/home/CenterClock";
import SceneryBackground from "@/components/home/SceneryBackground";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";

export default function HomePage() {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center p-6">
      <SceneryBackground />
      
      <div className="z-10 flex flex-col items-center">
        <CenterClock />
        <ProductivityWidgets />
      </div>
    </div>
  );
}