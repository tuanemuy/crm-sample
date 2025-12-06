"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function ActivityFilters() {
  return (
    <div className="space-y-4">
      {/* 検索 */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="font-semibold mb-3">検索</h3>
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
            <input
              type="text"
              placeholder="活動を検索..."
              className="input input-bordered w-full pl-10"
            />
          </div>
        </div>
      </div>

      {/* 活動タイプフィルター */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="font-semibold mb-3">活動タイプ</h3>
          <div className="space-y-2">
            {[
              { label: "すべて", count: 42 },
              { label: "電話", count: 18 },
              { label: "メール", count: 12 },
              { label: "面談", count: 8 },
              { label: "訪問", count: 4 },
            ].map((type) => (
              <label
                key={type.label}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input type="checkbox" className="checkbox checkbox-sm" />
                <span className="flex-1">{type.label}</span>
                <span className="badge badge-neutral badge-sm">
                  {type.count}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ステータスフィルター */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="font-semibold mb-3">ステータス</h3>
          <div className="space-y-2">
            {[
              { label: "予定", count: 15, color: "badge-info" },
              { label: "進行中", count: 5, color: "badge-warning" },
              { label: "完了", count: 20, color: "badge-success" },
              { label: "キャンセル", count: 2, color: "badge-error" },
            ].map((status) => (
              <label
                key={status.label}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input type="checkbox" className="checkbox checkbox-sm" />
                <span className="flex-1">{status.label}</span>
                <span className={`badge ${status.color} badge-sm`}>
                  {status.count}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 担当者フィルター */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="font-semibold mb-3">担当者</h3>
          <div className="space-y-2">
            {[
              { label: "田中太郎", count: 12 },
              { label: "佐藤花子", count: 8 },
              { label: "鈴木一郎", count: 15 },
              { label: "高橋美理", count: 7 },
            ].map((user) => (
              <label
                key={user.label}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input type="checkbox" className="checkbox checkbox-sm" />
                <span className="flex-1">{user.label}</span>
                <span className="badge badge-neutral badge-sm">
                  {user.count}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
