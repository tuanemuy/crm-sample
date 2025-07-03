"use client";

import { FunnelIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface FilterState {
  industry: string;
  size: string;
  status: string;
  assignedUser: string;
}

export function CustomerFilters() {
  const [filters, setFilters] = useState<FilterState>({
    industry: "",
    size: "",
    status: "",
    assignedUser: "",
  });

  const industries = [
    { value: "", label: "すべて" },
    { value: "technology", label: "テクノロジー" },
    { value: "finance", label: "金融" },
    { value: "healthcare", label: "ヘルスケア" },
    { value: "manufacturing", label: "製造業" },
    { value: "retail", label: "小売" },
    { value: "other", label: "その他" },
  ];

  const sizes = [
    { value: "", label: "すべて" },
    { value: "startup", label: "スタートアップ" },
    { value: "small", label: "中小企業" },
    { value: "medium", label: "中企業" },
    { value: "large", label: "大企業" },
    { value: "enterprise", label: "エンタープライズ" },
  ];

  const statuses = [
    { value: "", label: "すべて" },
    { value: "active", label: "アクティブ" },
    { value: "inactive", label: "非アクティブ" },
    { value: "archived", label: "アーカイブ" },
  ];

  const assignedUsers = [
    { value: "", label: "すべて" },
    { value: "user1", label: "田中太郎" },
    { value: "user2", label: "佐藤花子" },
    { value: "user3", label: "鈴木一郎" },
    { value: "user4", label: "高橋美理" },
  ];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // TODO: フィルター処理を実装
  };

  const clearFilters = () => {
    setFilters({
      industry: "",
      size: "",
      status: "",
      assignedUser: "",
    });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base-content flex items-center gap-2">
            <FunnelIcon className="h-4 w-4" />
            フィルター
          </h3>
          <button onClick={clearFilters} className="btn btn-ghost btn-xs">
            クリア
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">業界</span>
            </label>
            <select
              className="select select-bordered w-full select-sm"
              value={filters.industry}
              onChange={(e) => handleFilterChange("industry", e.target.value)}
            >
              {industries.map((industry) => (
                <option key={industry.value} value={industry.value}>
                  {industry.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">企業規模</span>
            </label>
            <select
              className="select select-bordered w-full select-sm"
              value={filters.size}
              onChange={(e) => handleFilterChange("size", e.target.value)}
            >
              {sizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">ステータス</span>
            </label>
            <select
              className="select select-bordered w-full select-sm"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">担当者</span>
            </label>
            <select
              className="select select-bordered w-full select-sm"
              value={filters.assignedUser}
              onChange={(e) =>
                handleFilterChange("assignedUser", e.target.value)
              }
            >
              {assignedUsers.map((user) => (
                <option key={user.value} value={user.value}>
                  {user.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
