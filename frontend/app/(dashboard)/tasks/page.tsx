import TaskSection from "@/components/tasks/TaskSection";

export default function TasksPage() {
  return (
    /*
     * Full-bleed page wrapper — the sidebar layout already provides
     * horizontal padding, so we only add vertical breathing room here.
     * On large screens we cap at 6xl and center; on small screens it
     * collapses to a single column naturally.
     */
    <div className="min-h-screen bg-[#f7f5f0]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 space-y-10">

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <header className="space-y-1">
          <p className="text-[10.5px] text-[#b0ad9a] tracking-[0.14em] uppercase font-[600]">
            Chronoa
          </p>
          <h1
            className="text-[46px] sm:text-[52px] text-[#3d3b33] leading-[1.05]"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontStyle: "italic",
            }}
          >
            Daily Focus
          </h1>
          <p className="text-[12px] text-[#b0ad9a] tracking-[0.10em] uppercase pt-0.5">
            Make today count
          </p>
        </header>

        {/* ── Two Columns on lg, stacked on smaller ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <TaskSection type="routine" title="My Routine" />
          <TaskSection type="normal" title="Tasks & Ideas" />
        </div>

      </div>
    </div>
  );
}