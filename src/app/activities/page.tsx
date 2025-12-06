import { ActivityActions } from "@/components/activities/ActivityActions";
import { ActivityCalendar } from "@/components/activities/ActivityCalendar";
import { ActivityFilters } from "@/components/activities/ActivityFilters";
import { ActivityList } from "@/components/activities/ActivityList";
import { ActivityStats } from "@/components/activities/ActivityStats";

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">営業活動</h1>
          <p className="text-base-content/70 mt-1">
            営業活動の予定と履歴を管理できます
          </p>
        </div>
        <ActivityActions />
      </div>

      <ActivityStats />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 space-y-4">
          <ActivityFilters />
        </div>

        <div className="flex-1 space-y-6">
          <ActivityCalendar />
          <ActivityList />
        </div>
      </div>
    </div>
  );
}
