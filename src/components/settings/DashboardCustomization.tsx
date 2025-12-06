"use client";

import {
  EyeIcon,
  EyeSlashIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
}

export function DashboardCustomization() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    {
      id: "kpi-cards",
      name: "KPIカード",
      description: "主要な業績指標を表示",
      enabled: true,
      order: 1,
    },
    {
      id: "activity-timeline",
      name: "活動タイムライン",
      description: "最近の営業活動を表示",
      enabled: true,
      order: 2,
    },
    {
      id: "notifications",
      name: "通知リスト",
      description: "重要な通知を表示",
      enabled: true,
      order: 3,
    },
    {
      id: "pipeline-chart",
      name: "パイプラインチャート",
      description: "商談の進捗状況を表示",
      enabled: false,
      order: 4,
    },
    {
      id: "team-performance",
      name: "チーム業績",
      description: "チーム全体の業績を表示",
      enabled: true,
      order: 5,
    },
    {
      id: "quick-actions",
      name: "クイックアクション",
      description: "よく使う機能へのショートカット",
      enabled: false,
      order: 6,
    },
  ]);

  const [theme, setTheme] = useState("light");

  const toggleWidget = (id: string) => {
    setWidgets(
      widgets.map((widget) =>
        widget.id === id ? { ...widget, enabled: !widget.enabled } : widget,
      ),
    );
  };

  const moveWidget = (id: string, direction: "up" | "down") => {
    const currentIndex = widgets.findIndex((w) => w.id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === widgets.length - 1)
    ) {
      return;
    }

    const newWidgets = [...widgets];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Swap the widgets
    [newWidgets[currentIndex], newWidgets[targetIndex]] = [
      newWidgets[targetIndex],
      newWidgets[currentIndex],
    ];

    // Update order numbers
    newWidgets.forEach((widget, index) => {
      widget.order = index + 1;
    });

    setWidgets(newWidgets);
  };

  const handleSave = () => {
    console.log("ダッシュボード設定を保存:", { widgets, theme });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Squares2X2Icon className="h-5 w-5" />
          ダッシュボードカスタマイズ
        </h3>

        <div className="space-y-6">
          {/* テーマ選択 */}
          <div>
            <h4 className="font-semibold mb-3">テーマ</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  className="radio"
                  checked={theme === "light"}
                  onChange={(e) => setTheme(e.target.value)}
                />
                <span>ライト</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  className="radio"
                  checked={theme === "dark"}
                  onChange={(e) => setTheme(e.target.value)}
                />
                <span>ダーク</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="auto"
                  className="radio"
                  checked={theme === "auto"}
                  onChange={(e) => setTheme(e.target.value)}
                />
                <span>自動</span>
              </label>
            </div>
          </div>

          {/* ウィジェット設定 */}
          <div>
            <h4 className="font-semibold mb-3">ダッシュボードウィジェット</h4>
            <p className="text-sm text-base-content/70 mb-4">
              表示するウィジェットを選択し、順序を調整できます。
            </p>

            <div className="space-y-2">
              {widgets
                .sort((a, b) => a.order - b.order)
                .map((widget, index) => (
                  <div
                    key={widget.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      widget.enabled
                        ? "border-primary bg-primary/5"
                        : "border-base-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleWidget(widget.id)}
                        className="btn btn-ghost btn-sm"
                      >
                        {widget.enabled ? (
                          <EyeIcon className="h-4 w-4" />
                        ) : (
                          <EyeSlashIcon className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <div className="font-medium">{widget.name}</div>
                        <div className="text-sm text-base-content/70">
                          {widget.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveWidget(widget.id, "up")}
                        disabled={index === 0}
                        className="btn btn-ghost btn-xs"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(widget.id, "down")}
                        disabled={index === widgets.length - 1}
                        className="btn btn-ghost btn-xs"
                      >
                        ↓
                      </button>
                      <span className="text-sm text-base-content/70 ml-2">
                        {widget.order}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
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
