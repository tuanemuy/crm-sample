"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function ReportSearch() {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="font-semibold mb-3">レポート検索</h3>
        <div className="relative">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="レポートを検索..."
            className="input input-bordered w-full pl-10"
          />
        </div>
      </div>
    </div>
  );
}
