import {
  CalendarIcon,
  DocumentIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "document";
  title: string;
  customer: string;
  time: string;
  user: string;
}

function getActivityIcon(type: Activity["type"]) {
  switch (type) {
    case "call":
      return PhoneIcon;
    case "email":
      return EnvelopeIcon;
    case "meeting":
      return CalendarIcon;
    case "document":
      return DocumentIcon;
    default:
      return DocumentIcon;
  }
}

function getActivityColor(type: Activity["type"]) {
  switch (type) {
    case "call":
      return "text-blue-500";
    case "email":
      return "text-green-500";
    case "meeting":
      return "text-purple-500";
    case "document":
      return "text-orange-500";
    default:
      return "text-gray-500";
  }
}

export function RecentActivities() {
  const activities: Activity[] = [
    {
      id: "1",
      type: "call",
      title: "商談フォローアップ",
      customer: "株式会社テックソリューションズ",
      time: "2時間前",
      user: "田中太郎",
    },
    {
      id: "2",
      type: "meeting",
      title: "提案プレゼンテーション",
      customer: "グローバルイノベーション株式会社",
      time: "4時間前",
      user: "佐藤花子",
    },
    {
      id: "3",
      type: "email",
      title: "見積書送付",
      customer: "デジタルプラットフォーム株式会社",
      time: "6時間前",
      user: "鈴木一郎",
    },
    {
      id: "4",
      type: "document",
      title: "契約書アップロード",
      customer: "株式会社スマートシステムズ",
      time: "8時間前",
      user: "高橋美理",
    },
    {
      id: "5",
      type: "call",
      title: "新規問い合わせ対応",
      customer: "アドバンスドテクノロジー株式会社",
      time: "1日前",
      user: "山田健太",
    },
  ];

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-base-content">最近の活動</h2>
          <button className="btn btn-sm btn-ghost">すべて表示</button>
        </div>

        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors"
              >
                <div className={`p-2 rounded-full bg-base-200 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-base-content truncate">
                      {activity.title}
                    </h3>
                    <span className="text-sm text-base-content/70 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>

                  <p className="text-sm text-base-content/70 truncate">
                    {activity.customer}
                  </p>

                  <p className="text-xs text-base-content/50">
                    担当: {activity.user}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
