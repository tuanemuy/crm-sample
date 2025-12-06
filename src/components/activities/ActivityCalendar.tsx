"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface Activity {
  id: string;
  title: string;
  type: "phone" | "email" | "meeting" | "visit";
  time: string;
  customer: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
}

const sampleActivities: Record<string, Activity[]> = {
  "2025-01-15": [
    {
      id: "1",
      title: "商談打ち合わせ",
      type: "meeting",
      time: "10:00",
      customer: "株式会社テックソリューションズ",
      status: "scheduled",
    },
    {
      id: "2",
      title: "フォローアップ電話",
      type: "phone",
      time: "14:00",
      customer: "グローバルイノベーション株式会社",
      status: "scheduled",
    },
  ],
  "2025-01-16": [
    {
      id: "3",
      title: "提案書プレゼン",
      type: "meeting",
      time: "11:00",
      customer: "デジタルプラットフォーム株式会社",
      status: "scheduled",
    },
  ],
};

function getTypeColor(type: Activity["type"]) {
  switch (type) {
    case "phone":
      return "bg-info text-info-content";
    case "email":
      return "bg-secondary text-secondary-content";
    case "meeting":
      return "bg-primary text-primary-content";
    case "visit":
      return "bg-accent text-accent-content";
    default:
      return "bg-neutral text-neutral-content";
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
    default:
      return "その他";
  }
}

export function ActivityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 15)); // January 15, 2025
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const monthNames = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month's trailing days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {year}年 {monthNames[month]}
            </h2>
            <div className="btn-group">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "month" ? "btn-active" : ""}`}
                onClick={() => setViewMode("month")}
              >
                月
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "week" ? "btn-active" : ""}`}
                onClick={() => setViewMode("week")}
              >
                週
              </button>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentDate(new Date())}
            >
              今日
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Header */}
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <div
              key={day}
              className="p-2 text-center font-semibold text-base-content/70 border-b"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => {
            const dateKey = day ? formatDateKey(year, month, day) : null;
            const dayActivities = dateKey
              ? sampleActivities[dateKey] || []
              : [];
            const isToday = day === 15; // Sample today is 15th

            return (
              <div
                key={day ? `${year}-${month}-${day}` : `empty-${index}`}
                className={`p-1 min-h-[80px] border border-base-300 ${
                  day ? "bg-base-100" : "bg-base-200"
                } ${isToday ? "ring-2 ring-primary" : ""}`}
              >
                {day && (
                  <>
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday ? "text-primary" : "text-base-content"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayActivities.slice(0, 2).map((activity) => (
                        <div
                          key={activity.id}
                          className={`text-xs p-1 rounded truncate ${getTypeColor(activity.type)}`}
                          title={`${activity.time} - ${activity.title}`}
                        >
                          {activity.time} {getTypeLabel(activity.type)}
                        </div>
                      ))}
                      {dayActivities.length > 2 && (
                        <div className="text-xs text-base-content/50">
                          +{dayActivities.length - 2}件
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
