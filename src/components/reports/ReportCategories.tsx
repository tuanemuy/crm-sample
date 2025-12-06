"use client";

import {
  ChartBarIcon,
  ChartPieIcon,
  CurrencyYenIcon,
  PresentationChartLineIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export function ReportCategories() {
  const categories = [
    {
      name: "売上レポート",
      icon: CurrencyYenIcon,
      count: 8,
      color: "text-success",
    },
    {
      name: "営業活動",
      icon: ChartBarIcon,
      count: 6,
      color: "text-primary",
    },
    {
      name: "顧客分析",
      icon: UserGroupIcon,
      count: 5,
      color: "text-info",
    },
    {
      name: "ROI分析",
      icon: ChartPieIcon,
      count: 4,
      color: "text-warning",
    },
    {
      name: "予測分析",
      icon: PresentationChartLineIcon,
      count: 3,
      color: "text-secondary",
    },
  ];

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="font-semibold mb-3">カテゴリ</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              type="button"
              key={category.name}
              className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-base-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <category.icon className={`h-5 w-5 ${category.color}`} />
                <span className="font-medium">{category.name}</span>
              </div>
              <span className="badge badge-neutral badge-sm">
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
