import { Task, CalendarEvent } from "@/types/app.types";

export const generateMockDailyMap = () => {
  const map: Record<string, any> = {};
  for (let i = 21; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    map[ymd] = {
      date: ymd,
      tasks: Array.from({ length: Math.floor(Math.random() * 6) + 3 }).map(() => ({ title: 'Task', completed_at: d.toISOString(), task_type: 'normal' })),
      sessions: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => ({ title: 'Focus', duration_seconds: Math.floor(Math.random() * 3600) + 1800 })),
      taskCount: Math.floor(Math.random() * 8) + 2,
      focusMinutes: Math.floor(Math.random() * 120) + 30
    };
  }
  return map;
};

export const generateMockEvents = (): CalendarEvent[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const setTime = (d: Date, h: number) => {
    const newD = new Date(d);
    newD.setHours(h, 0, 0, 0);
    return newD.toISOString();
  };

  return[
    { id: 'c1', title: 'Deep Work Session', start_time: setTime(today, 9), end_time: setTime(today, 11), color: 'emerald', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Home Office', created_at: new Date().toISOString() },
    { id: 'c2', title: 'Team Sync', start_time: setTime(today, 14), end_time: setTime(today, 15), color: 'blue', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Google Meet', created_at: new Date().toISOString() },
    { id: 'c3', title: 'F1 Grand Prix', start_time: setTime(tomorrow, 18), end_time: setTime(tomorrow, 20), color: 'rose', is_all_day: false, is_readonly: true, user_id: 'mock', source_id: 'mock-source', location: 'Silverstone Circuit', created_at: new Date().toISOString() },
  ] as CalendarEvent[];
};

export const initialMockTasks: Task[] =[
  { id: '1', user_id: 'mock', title: 'Morning Routine', task_type: 'routine', parent_id: null, position: 0, is_completed: false, created_at: new Date().toISOString(), completed_at: null, deleted_at: null, color: 'blue', keep_alive: true, is_collapsed: false, children: [] },
  { id: '2', user_id: 'mock', title: 'Drink water', task_type: 'routine', parent_id: '1', position: 0, is_completed: true, created_at: new Date().toISOString(), completed_at: new Date().toISOString(), deleted_at: null, color: null, keep_alive: false, is_collapsed: false, children:[] },
  { id: '3', user_id: 'mock', title: 'Read 10 pages', task_type: 'routine', parent_id: '1', position: 1, is_completed: false, created_at: new Date().toISOString(), completed_at: null, deleted_at: null, color: null, keep_alive: false, is_collapsed: false, children:[] },
  { id: '4', user_id: 'mock', title: 'Project Chronoa', task_type: 'normal', parent_id: null, position: 0, is_completed: false, created_at: new Date().toISOString(), completed_at: null, deleted_at: null, color: 'emerald', keep_alive: true, is_collapsed: false, children:[] },
  { id: '5', user_id: 'mock', title: 'Design Landing Page', task_type: 'normal', parent_id: '4', position: 0, is_completed: true, created_at: new Date().toISOString(), completed_at: new Date().toISOString(), deleted_at: null, color: null, keep_alive: false, is_collapsed: false, children:[] },
  { id: '6', user_id: 'mock', title: 'Implement Sandbox Features', task_type: 'normal', parent_id: '4', position: 1, is_completed: false, created_at: new Date().toISOString(), completed_at: null, deleted_at: null, color: null, keep_alive: false, is_collapsed: false, children:[] },
];