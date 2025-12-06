"use client";

import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CurrencyYenIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export function QuickReports() {
  const quickStats = [
    {
      title: "今月の売上",
      value: "¥12,500,000",
      change: "+15.3%",
      changeType: "increase",
      icon: CurrencyYenIcon,
    },
    {
      title: "新規顧客",
      value: "24",
      change: "+8.2%",
      changeType: "increase",
      icon: UserGroupIcon,
    },
    {
      title: "商談成約率",
      value: "68.5%",
      change: "-2.1%",
      changeType: "decrease",
      icon: ChartBarIcon,
    },
    {
      title: "平均取引額",
      value: "¥520,000",
      change: "+12.8%",
      changeType: "increase",
      icon: ArrowTrendingUpIcon,
    },
  ];

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4">クイックレポート</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <div key={stat.title} className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="stat-title text-xs">{stat.title}</div>
              <div className="stat-value text-xl">{stat.value}</div>
              <div
                className={`stat-desc flex items-center gap-1 ${
                  stat.changeType === "increase" ? "text-success" : "text-error"
                }`}
              >
                <span>{stat.change}</span>
                <span className="text-base-content/70">前月比</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
