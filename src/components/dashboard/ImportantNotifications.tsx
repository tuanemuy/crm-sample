import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface Notification {
  id: string;
  type: "warning" | "info" | "success" | "alert";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "warning":
      return ExclamationTriangleIcon;
    case "info":
      return InformationCircleIcon;
    case "success":
      return CheckCircleIcon;
    case "alert":
      return BellIcon;
    default:
      return InformationCircleIcon;
  }
}

function getNotificationColor(type: Notification["type"]) {
  switch (type) {
    case "warning":
      return "text-warning bg-warning/10";
    case "info":
      return "text-info bg-info/10";
    case "success":
      return "text-success bg-success/10";
    case "alert":
      return "text-error bg-error/10";
    default:
      return "text-info bg-info/10";
  }
}

export function ImportantNotifications() {
  const notifications: Notification[] = [
    {
      id: "1",
      type: "warning",
      title: "契約期限が近づいています",
      message: "株式会社テックソリューションズの契約が3日後に期限切れします。",
      time: "30分前",
      isRead: false,
    },
    {
      id: "2",
      type: "success",
      title: "商談が成約しました",
      message: "グローバルイノベーション株式会社との商談が成約しました。",
      time: "1時間前",
      isRead: false,
    },
    {
      id: "3",
      type: "info",
      title: "新しいリードが登録されました",
      message: "アドバンスドテクノロジー株式会社から問い合わせがありました。",
      time: "2時間前",
      isRead: true,
    },
    {
      id: "4",
      type: "alert",
      title: "緊急タスクがあります",
      message:
        "デジタルプラットフォーム株式会社の提案書を今日中に提出してください。",
      time: "3時間前",
      isRead: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title text-base-content flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              重要通知
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-base-content/70">
                未読: {unreadCount}件
              </p>
            )}
          </div>
          <button type="button" className="btn btn-sm btn-ghost">
            すべて表示
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);

            return (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all hover:bg-base-200 ${
                  notification.isRead
                    ? "border-base-300 opacity-75"
                    : "border-primary bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full ${colorClass}`}>
                    <Icon className="h-3 w-3" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-medium truncate ${
                          notification.isRead
                            ? "text-base-content/70"
                            : "text-base-content"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs text-base-content/50 whitespace-nowrap">
                        {notification.time}
                      </span>
                    </div>

                    <p
                      className={`text-xs mt-1 ${
                        notification.isRead
                          ? "text-base-content/50"
                          : "text-base-content/70"
                      }`}
                    >
                      {notification.message}
                    </p>

                    {!notification.isRead && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                        >
                          確認
                        </button>
                        <button type="button" className="btn btn-xs btn-ghost">
                          後で
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
