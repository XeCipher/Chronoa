import ICloudTodayFeed from '@/components/tasks/ICloudTodayFeed';
import RoutineSection from '@/components/tasks/RoutineSection';

export default function TasksPage() {
  return (
    <div>
      <h1>Tasks</h1>
      <ICloudTodayFeed />
      <RoutineSection />
    </div>
  );
}
