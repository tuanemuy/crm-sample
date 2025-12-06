"use client";

import { ClockIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

export function FavoriteReports() {
  const favoriteReports = [
    {
      name: "月次売上レポート",
      lastAccessed: "2時間前",
    },
    {
      name: "営業活動サマリー",
      lastAccessed: "1日前",
    },
    {
      name: "顧客コンバージョン",
      lastAccessed: "3日前",
    },
  ];

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <StarIcon className="h-4 w-4 text-warning" />
          お気に入り
        </h3>
        <div className="space-y-3">
          {favoriteReports.map((report) => (
            <button
              type="button"
              key={report.name}
              className="block w-full text-left p-3 rounded-lg hover:bg-base-200 transition-colors"
            >
              <div className="font-medium text-sm">{report.name}</div>
              <div className="flex items-center gap-1 text-xs text-base-content/70 mt-1">
                <ClockIcon className="h-3 w-3" />
                {report.lastAccessed}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
