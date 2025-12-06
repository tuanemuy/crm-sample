"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  TrashIcon,
  TruckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface Activity {
  id: string;
  title: string;
  type: "phone" | "email" | "meeting" | "visit" | "other";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  customer: string;
  assignedUser: string;
  startTime: string;
  endTime: string;
  description: string;
  createdAt: string;
}

function getTypeIcon(type: Activity["type"]) {
  switch (type) {
    case "phone":
      return PhoneIcon;
    case "email":
      return EnvelopeIcon;
    case "meeting":
      return UserGroupIcon;
    case "visit":
      return TruckIcon;
    default:
      return UserGroupIcon;
  }
}

function getTypeLabel(type: Activity["type"]) {
  switch (type) {
    case "phone":
      return "電話";
    case "email":
      return "メール";
    case "meeting":
      return "面談";
    case "visit":
      return "訪問";
    case "other":
      return "その他";
    default:
      return "その他";
  }
}

function getStatusBadge(status: Activity["status"]) {
  switch (status) {
    case "scheduled":
      return "badge badge-info";
    case "in_progress":
      return "badge badge-warning";
    case "completed":
      return "badge badge-success";
    case "cancelled":
      return "badge badge-error";
    default:
      return "badge badge-neutral";
  }
}

function getStatusLabel(status: Activity["status"]) {
  switch (status) {
    case "scheduled":
      return "予定";
    case "in_progress":
      return "進行中";
    case "completed":
      return "完了";
    case "cancelled":
      return "キャンセル";
    default:
      return "不明";
  }
}

export function ActivityList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"startTime" | "customer" | "status">(
    "startTime",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // サンプルデータ
  const activities: Activity[] = [
    {
      id: "1",
      title: "商談打ち合わせ",
      type: "meeting",
      status: "scheduled",
      customer: "株式会社テックソリューションズ",
      assignedUser: "田中太郎",
      startTime: "2025-01-15T10:00:00",
      endTime: "2025-01-15T11:00:00",
      description: "新システム導入に関する詳細打ち合わせ",
      createdAt: "2025-01-10T09:00:00",
    },
    {
      id: "2",
      title: "フォローアップ電話",
      type: "phone",
      status: "completed",
      customer: "グローバルイノベーション株式会社",
      assignedUser: "佐藤花子",
      startTime: "2025-01-14T14:00:00",
      endTime: "2025-01-14T14:30:00",
      description: "提案内容の確認と次回面談の調整",
      createdAt: "2025-01-12T16:00:00",
    },
    {
      id: "3",
      title: "提案書プレゼンテーション",
      type: "meeting",
      status: "in_progress",
      customer: "デジタルプラットフォーム株式会社",
      assignedUser: "鈴木一郎",
      startTime: "2025-01-15T11:00:00",
      endTime: "2025-01-15T12:30:00",
      description: "新プロダクトの提案とデモンストレーション",
      createdAt: "2025-01-08T10:00:00",
    },
    {
      id: "4",
      title: "契約書確認メール",
      type: "email",
      status: "completed",
      customer: "株式会社スマートシステムズ",
      assignedUser: "高橋美理",
      startTime: "2025-01-13T09:00:00",
      endTime: "2025-01-13T09:15:00",
      description: "契約書の最終確認と調印スケジュール調整",
      createdAt: "2025-01-13T08:45:00",
    },
    {
      id: "5",
      title: "現地訪問",
      type: "visit",
      status: "scheduled",
      customer: "アドバンスドテクノロジー株式会社",
      assignedUser: "山田健太",
      startTime: "2025-01-16T13:00:00",
      endTime: "2025-01-16T17:00:00",
      description: "現地でのシステム確認と導入準備",
      createdAt: "2025-01-11T14:00:00",
    },
  ];

  const itemsPerPage = 10;
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = activities.slice(startIndex, endIndex);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-0">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">活動一覧</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>活動</th>
                <th>タイプ</th>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1 font-semibold"
                  >
                    ステータス
                    {sortBy === "status" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("customer")}
                    className="flex items-center gap-1 font-semibold"
                  >
                    顧客
                    {sortBy === "customer" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>担当者</th>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("startTime")}
                    className="flex items-center gap-1 font-semibold"
                  >
                    予定時刻
                    {sortBy === "startTime" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {currentActivities.map((activity) => {
                const TypeIcon = getTypeIcon(activity.type);
                return (
                  <tr key={activity.id} className="hover">
                    <td>
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-base-content/70 truncate max-w-xs">
                          {activity.description}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        {getTypeLabel(activity.type)}
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadge(activity.status)}>
                        {getStatusLabel(activity.status)}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium">{activity.customer}</div>
                    </td>
                    <td>{activity.assignedUser}</td>
                    <td>
                      <div className="text-sm">
                        <div>開始: {formatDateTime(activity.startTime)}</div>
                        <div className="text-base-content/70">
                          終了: {formatDateTime(activity.endTime)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" className="btn btn-ghost btn-xs">
                          <EyeIcon className="h-3 w-3" />
                        </button>
                        <button type="button" className="btn btn-ghost btn-xs">
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-base-content/70">
            {startIndex + 1}-{Math.min(endIndex, activities.length)} /{" "}
            {activities.length}件
          </div>

          <div className="join">
            <button
              type="button"
              className="join-item btn btn-sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                type="button"
                key={page}
                className={`join-item btn btn-sm ${
                  currentPage === page ? "btn-active" : ""
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="join-item btn btn-sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
