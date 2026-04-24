import TaskSection from "@/components/tasks/TaskSection";

export default function TasksPage() {
  return (
    <div className="max-w-6xl mx-auto p-10 space-y-12">
      <header>
        <h1 className="text-5xl text-[#3d3b33] mb-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
          Daily Focus
        </h1>
        <p className="text-[#888] tracking-widest text-xs uppercase font-semibold">Sanctuary Mode Active</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <TaskSection type="routine" title="My Routine" />
        <TaskSection type="normal" title="Tasks & Ideas" />
      </div>
    </div>
  );
}