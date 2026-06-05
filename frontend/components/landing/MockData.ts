// frontend/components/landing/MockData.ts
import { Task, CalendarEvent } from "@/types/app.types";

export const generateMockDailyMap = () => {
  const map: Record<string, any> = {};
  const categories = ['Deep Work', 'Learning', 'Workout', 'Projects'];
  
  for (let i = 365; i >= 0; i--) {
    // Fill all squares but keep some empty (15% completely zero)
    if (Math.random() > 0.85) continue;
    
    // Relative accurately starting exactly from today so there are no empty gaps
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Form a beautiful organic shape in the radar chart:
    // Balanced distribution across the entire day instead of forcing it into one corner.
    const makeTaskDate = () => {
       const newD = new Date(d);
       const hours = [7, 10, 13, 16, 19, 21, 23];
       const weights = [3, 5, 6, 5, 4, 2, 1]; // Smooth bell curve peaking slightly in afternoon
       let sum = weights.reduce((a, b) => a + b, 0);
       let r = Math.random() * sum;
       let h = 14;
       for (let j = 0; j < hours.length; j++) {
         if (r < weights[j]) { h = hours[j]; break; }
         r -= weights[j];
       }
       newD.setHours(h);
       return newD.toISOString();
    };

    const taskCount = Math.random() > 0.9 ? Math.floor(Math.random() * 5) + 4 : Math.floor(Math.random() * 3) + 1;
    
    // Distribute focus time into multiple sessions to show beautiful stacked bars in the chart
    let totalFocusMins = 0;
    const sessions = [];
    
    // 80% chance of having focus time on active days
    if (Math.random() > 0.2) {
       const numSessions = Math.floor(Math.random() * 3) + 1; // 1 to 3 sessions per day
       for (let s = 0; s < numSessions; s++) {
         // Skew slightly towards Deep Work for a realistic distribution
         const cat = Math.random() > 0.4 ? categories[0] : categories[Math.floor(Math.random() * categories.length)];
         const mins = Math.floor(Math.random() * 45) + 15; // 15 to 60 mins each
         totalFocusMins += mins;
         sessions.push({
           title: cat,
           duration_seconds: mins * 60,
           created_at: makeTaskDate()
         });
       }
    }

    map[ymd] = {
      date: ymd,
      tasks: Array.from({ length: taskCount }).map(() => ({ title: 'Task', completed_at: makeTaskDate(), task_type: 'normal' })),
      sessions: sessions,
      taskCount: taskCount,
      focusMinutes: totalFocusMins
    };
  }
  return map;
};

export const generateMockSessions = () => {
  const sessions = [];
  const categories = ['Deep Work', 'Learning', 'Workout', 'Projects'];
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
    { id: 'c1', title: 'Team Sync', start_time: setTime(today, 10), end_time: setTime(today, 11, 30), color: 'blue', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Google Meet', created_at: new Date().toISOString() },
    { id: 'c2', title: 'Design Review', start_time: setTime(today, 10, 30), end_time: setTime(today, 12), color: 'purple', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Zoom', created_at: new Date().toISOString() },
    { id: 'c3', title: 'Deep Work', start_time: setTime(today, 14), end_time: setTime(today, 16), color: 'emerald', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Home Office', created_at: new Date().toISOString() },
    
    { id: 'c4', title: 'Dentist Appointment', start_time: setTime(tomorrow, 9), end_time: setTime(tomorrow, 10), color: 'amber', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'City Clinic', created_at: new Date().toISOString() },
    { id: 'c5', title: 'Lunch with Sarah', start_time: setTime(tomorrow, 12, 30), end_time: setTime(tomorrow, 14), color: 'rose', is_all_day: false, is_readonly: false, user_id: 'mock', location: 'Downtown Cafe', created_at: new Date().toISOString() },
    
    { id: 'c6', title: 'F1 Grand Prix', start_time: setTime(dayAfter, 18), end_time: setTime(dayAfter, 20), color: 'rose', is_all_day: false, is_readonly: false, user_id: 'mock', source_id: 'mock-source', location: 'Silverstone Circuit', created_at: new Date().toISOString() },
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