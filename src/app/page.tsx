import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ImportantNotifications } from "@/components/dashboard/ImportantNotifications";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { TodayActivities } from "@/components/dashboard/TodayActivities";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            ダッシュボード
          </h1>
          <p className="text-base-content/70 mt-1">
            今日の概要と主要なKPIを確認できます
          </p>
        </div>
        <QuickActions />
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PipelineSummary />
          <RecentActivities />
        </div>

        <div className="space-y-6">
          <TodayActivities />
          <ImportantNotifications />
        </div>
      </div>
    </div>
  );
}
