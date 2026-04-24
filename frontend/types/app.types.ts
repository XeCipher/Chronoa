// This is our client-side representation. 'children' is added after fetching.
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
  children?: Task[];
};