"use client";

import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface Integration {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  icon: string;
  settings?: Record<string, string | number | boolean>;
}

export function IntegrationSettings() {
  const integrations: Integration[] = [
    {
      id: "salesforce",
      name: "Salesforce",
      description: "顧客データと営業活動を同期",
      status: "connected",
      icon: "🔗",
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "マーケティングデータとリード情報を連携",
      status: "disconnected",
      icon: "📈",
    },
    {
      id: "gmail",
      name: "Gmail",
      description: "メール活動の自動記録",
      status: "connected",
      icon: "✉️",
    },
    {
      id: "slack",
      name: "Slack",
      description: "営業活動の通知を送信",
      status: "error",
      icon: "💬",
    },
  ];

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return "badge badge-success";
      case "disconnected":
        return "badge badge-neutral";
      case "error":
        return "badge badge-error";
      default:
        return "badge badge-neutral";
    }
  };

  const getStatusLabel = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return "接続中";
      case "disconnected":
        return "未接続";
      case "error":
        return "エラー";
      default:
        return "不明";
    }
  };

  const getStatusIcon = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircleIcon className="h-5 w-5 text-success" />;
      case "disconnected":
        return <XCircleIcon className="h-5 w-5 text-neutral" />;
      case "error":
        return <XCircleIcon className="h-5 w-5 text-error" />;
      default:
        return null;
    }
  };

  return (
    <div
      id="integrations"
      className="card bg-base-100 shadow-sm border border-base-300"
    >
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CloudArrowUpIcon className="h-5 w-5" />
          統合設定
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="border border-base-300 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <h4 className="font-semibold">{integration.name}</h4>
                    <p className="text-sm text-base-content/70">
                      {integration.description}
                    </p>
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className={getStatusBadge(integration.status)}>
                  {getStatusLabel(integration.status)}
                </span>

                <div className="flex gap-2">
                  {integration.status === "connected" ? (
                    <>
                      <button type="button" className="btn btn-outline btn-xs">
                        設定
                      </button>
                      <button type="button" className="btn btn-error btn-xs">
                        切断
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-primary btn-xs">
                      接続
                    </button>
                  )}
                </div>
              </div>

              {integration.status === "error" && (
                <div className="mt-2 text-xs text-error">
                  認証エラーが発生しています。再接続してください。
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h4 className="font-semibold mb-2">新しい統合を追加</h4>
          <p className="text-sm text-base-content/70 mb-3">
            他のサービスとの連携をご希望の場合は、サポートチームまでお問い合わせください。
          </p>
          <button type="button" className="btn btn-outline btn-sm">
            統合リクエスト
          </button>
        </div>
      </div>
    </div>
  );
}
