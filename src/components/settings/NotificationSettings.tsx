"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    email: {
      newDeals: true,
      taskReminders: true,
      dailyReports: false,
      weeklyReports: true,
    },
    push: {
      newDeals: true,
      taskReminders: true,
      mentions: true,
    },
    frequency: "immediate",
  });

  const handleSave = () => {
    console.log("通知設定を保存:", notifications);
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BellIcon className="h-5 w-5" />
          通知設定
        </h3>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">メール通知</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={notifications.email.newDeals}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      email: {
                        ...notifications.email,
                        newDeals: e.target.checked,
                      },
                    })
                  }
                />
                <span>新しい商談の通知</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={notifications.email.taskReminders}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      email: {
                        ...notifications.email,
                        taskReminders: e.target.checked,
                      },
                    })
                  }
                />
                <span>タスクリマインダー</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={notifications.email.dailyReports}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      email: {
                        ...notifications.email,
                        dailyReports: e.target.checked,
                      },
                    })
                  }
                />
                <span>日次レポート</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={notifications.email.weeklyReports}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      email: {
                        ...notifications.email,
                        weeklyReports: e.target.checked,
                      },
                    })
                  }
                />
                <span>週次レポート</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">プッシュ通知</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={notifications.push.newDeals}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      push: {
                        ...notifications.push,
                        newDeals: e.target.checked,
                      },
                    })
                  }
                />
                <span>新しい商談の通知</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={notifications.push.taskReminders}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      push: {
                        ...notifications.push,
                        taskReminders: e.target.checked,
                      },
                    })
                  }
                />
                <span>タスクリマインダー</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={notifications.push.mentions}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      push: {
                        ...notifications.push,
                        mentions: e.target.checked,
                      },
                    })
                  }
                />
                <span>メンション通知</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">通知頻度</h4>
            <select
              className="select select-bordered w-full max-w-xs"
              value={notifications.frequency}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  frequency: e.target.value,
                })
              }
            >
              <option value="immediate">即座に通知</option>
              <option value="hourly">1時間ごと</option>
              <option value="daily">1日1回</option>
              <option value="weekly">週1回</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
}
