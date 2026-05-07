// frontend/components/landing/MockData.ts
import { Task, CalendarEvent } from "@/types/app.types";

export const generateMockDailyMap = () => {
  const map: Record<string, any> = {};
  for (let i = 21; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Spread completion hours somewhat realistically
    const makeTaskDate = () => {
       const newD = new Date(d);
       newD.setHours(Math.floor(Math.random() * 12) + 8); // Between 8 AM and 8 PM
       return newD.toISOString();
    };

    map[ymd] = {
      date: ymd,
      tasks: Array.from({ length: Math.floor(Math.random() * 6) + 3 }).map(() => ({ title: 'Task', completed_at: makeTaskDate(), task_type: 'normal' })),
      sessions: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => ({ title: 'Focus', duration_seconds: Math.floor(Math.random() * 3600) + 1800, created_at: makeTaskDate() })),
      taskCount: Math.floor(Math.random() * 8) + 2,
      focusMinutes: Math.floor(Math.random() * 120) + 30
    };
  }
  return map;
};

export const generateMockSessions = () => {
  const sessions = [];
  const categories = ['Deep Work', 'Learning', 'Planning', 'Emails'];
  for (let i = 0; i < 20; i++) {
     sessions.push({
        title: categories[Math.floor(Math.random() * categories.length)],
        duration_seconds: Math.floor(Math.random() * 3600) + 1200,
        created_at: new Date().toISOString()
     });
  }
  return sessions;
};

export const generateMockEvents = (): CalendarEvent[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const setTime = (d: Date, h: number, m: number = 0) => {
    const newD = new Date(d);
    newD.setHours(h, m, 0, 0);
    return newD.toISOString();
  };

  return [
    // Today (Overlapping pair)
    { id: 'c1', title: 'Team Sync', start_time: setTime(today, 10), end_time: setTime(today, 11, 30), color: 'blue', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Google Meet', created_at: new Date().toISOString() },
    { id: 'c2', title: 'Design Review', start_time: setTime(today, 10, 30), end_time: setTime(today, 12), color: 'purple', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Zoom', created_at: new Date().toISOString() },
    { id: 'c3', title: 'Deep Work', start_time: setTime(today, 14), end_time: setTime(today, 16), color: 'emerald', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Home Office', created_at: new Date().toISOString() },
    
    // Tomorrow
    { id: 'c4', title: 'Dentist Appointment', start_time: setTime(tomorrow, 9), end_time: setTime(tomorrow, 10), color: 'amber', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'City Clinic', created_at: new Date().toISOString() },
    { id: 'c5', title: 'Lunch with Sarah', start_time: setTime(tomorrow, 12, 30), end_time: setTime(tomorrow, 14), color: 'rose', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Downtown Cafe', created_at: new Date().toISOString() },
    
    // Day After
    { id: 'c6', title: 'F1 Grand Prix', start_time: setTime(dayAfter, 18), end_time: setTime(dayAfter, 20), color: 'rose', is_all_day: false, is_readonly: true, user_id: 'mock', source_id: 'mock-source', location: 'Silverstone Circuit', created_at: new Date().toISOString() },
    { id: 'c7', title: 'Project Planning', start_time: setTime(dayAfter, 11), end_time: setTime(dayAfter, 13), color: 'blue', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Office Room B', created_at: new Date().toISOString() },
  ] as CalendarEvent[];
};

export const initialMockTasks: Task[] = [
  { id: '1', user_id: 'mock', title: 'Morning Routine', task_type: 'routine', parent_id: null, position: 0, is_completed: false, created_at: new Date().toISOString(), completed_at: null, deleted_at: null, color: 'blue', keep_alive: true, is_collapsed: false, children: [] },
  { id: '2', user_id: 'mock', title: 'Drink water', task_type: 'routine', parent_id: '1', position: 0, is_completed: true, created_at: new Date().toISOString(), completed_at: new Date().toISOString(), deleted_at: null, color: null, keep_alive: false, is_collapsed: false, children:[] },
  { id: '3', user_id: 'mock', title: 'Read 10 pages', task_type: 'routine', parent_id: '1', position: 1, is_completed: false, created_at: new Date().toISOString(), completed_at: null, deleted_at: null, color: null, keep_alive: false, is_collapsed: false, children:[] },
  { id: '4', user_id: 'mock', title: 'Project Chronoa', task_type: 'normal', parent_id: null, position: 0, is_completed: false, created_at: new Date().toISOString(), completed_at: null, deleted_at: null, color: 'emerald', keep_alive: true, is_collapsed: false, children:[] },
  { id: '5', user_id: 'mock', title: 'Design Landing Page', task_type: 'normal', parent_id: '4', position: 0, is_completed: true, created_at: new Date().toISOString(), completed_at: new Date().toISOString(), deleted_at: null, color: null, keep_alive: false, is_collapsed: false, children:[] },
  { id: '6', user_id: 'mock', title: 'Implement Sandbox Features', task_type: 'normal', parent_id: '4', position: 1, is_completed: false, created_at: new Date().toISOString(), completed_at: null, deleted_at: null, color: null, keep_alive: false, is_collapsed: false, children:[] },
];