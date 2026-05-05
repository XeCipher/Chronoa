// frontend/types/app.types.ts
export type Task = {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  task_type: 'routine' | 'normal';
  parent_id: string | null;
  position: number;
  created_at: string;
  completed_at: string | null;
  deleted_at: string | null;
  color?: string | null;
  keep_alive?: boolean;
  is_collapsed?: boolean;
  children?: Task[];
};

export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  color: string;
  created_at: string;
  updated_at: string;
  series_id?: string | null;
  repeat_pattern?: string | null;
  meeting_url?: string | null;
  location?: string | null;
  is_readonly?: boolean;
  source_id?: string | null;
};

export type CalendarSource = {
  id: string;
  user_id: string;
  name: string;
  type: 'link' | 'file';
  url?: string | null;
  color: string;
  created_at: string;
};