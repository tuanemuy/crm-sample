import {
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

interface TodayActivity {
  id: string;
  type: "meeting" | "call" | "video_call";
  title: string;
  time: string;
  customer: string;
  status: "upcoming" | "completed" | "in_progress";
}

function getActivityIcon(type: TodayActivity["type"]) {
  switch (type) {
    case "meeting":
      return CalendarIcon;
    case "call":
      return PhoneIcon;
    case "video_call":
      return VideoCameraIcon;
    default:
      return CalendarIcon;
  }
}

function getStatusColor(status: TodayActivity["status"]) {
  switch (status) {
    case "upcoming":
      return "text-blue-500 bg-blue-100";
    case "completed":
      return "text-green-500 bg-green-100";
    case "in_progress":
      return "text-orange-500 bg-orange-100";
    default:
      return "text-gray-500 bg-gray-100";
  }
}

function getStatusLabel(status: TodayActivity["status"]) {
  switch (status) {
    case "upcoming":
      return "予定";
    case "completed":
      return "完了";
    case "in_progress":
      return "進行中";
    default:
      return "不明";
  }
}

export function TodayActivities() {
  const activities: TodayActivity[] = [
    {
      id: "1",
      type: "meeting",
      title: "四半期予算ミーティング",
      time: "09:00",
      customer: "株式会社テックソリューションズ",
      status: "completed",
    },
    {
      id: "2",
      type: "call",
      title: "フォローアップ電話",
      time: "11:30",
      customer: "グローバルイノベーション株式会社",
      status: "in_progress",
    },
    {
      id: "3",
      type: "video_call",
      title: "デモンストレーション",
      time: "14:00",
      customer: "デジタルプラットフォーム株式会社",
      status: "upcoming",
    },
    {
      id: "4",
      type: "meeting",
      title: "月次レビュー会議",
      time: "16:30",
      customer: "株式会社スマートシステムズ",
      status: "upcoming",
    },
  ];

  const upcomingCount = activities.filter(
    (a) => a.status === "upcoming",
  ).length;
  const completedCount = activities.filter(
    (a) => a.status === "completed",
  ).length;

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title text-base-content flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              今日の予定
            </h2>
            <p className="text-sm text-base-content/70">
              完了: {completedCount}件 / 予定: {upcomingCount}件
            </p>
          </div>
          <button type="button" className="btn btn-sm btn-ghost">
            カレンダー
          </button>
        </div>

        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const statusColor = getStatusColor(activity.status);
            const statusLabel = getStatusLabel(activity.status);

            return (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors"
              >
                <div className="text-primary">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-base-content text-sm truncate">
                      {activity.title}
                    </h3>
                    <span className="text-xs font-mono text-base-content/70 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>

                  <p className="text-xs text-base-content/70 truncate mt-1">
                    {activity.customer}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <button type="button" className="btn btn-sm btn-primary btn-block">
            新しい予定を追加
          </button>
        </div>
      </div>
    </div>
  );
}
