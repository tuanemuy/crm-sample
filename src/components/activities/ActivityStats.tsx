"use client";

import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

export function ActivityStats() {
  const stats = [
    {
      title: "今日の予定",
      value: "8",
      icon: CalendarIcon,
      color: "text-primary",
    },
    {
      title: "今週の完了",
      value: "24",
      icon: CheckCircleIcon,
      color: "text-success",
    },
    {
      title: "進行中",
      value: "5",
      icon: ClockIcon,
      color: "text-warning",
    },
    {
      title: "今月の通話",
      value: "156",
      icon: PhoneIcon,
      color: "text-info",
    },
  ];

  return (
    <div className="stats shadow border border-base-300 w-full">
      {stats.map((stat) => (
        <div key={stat.title} className="stat">
          <div className="stat-figure">
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
          </div>
          <div className="stat-title">{stat.title}</div>
          <div className={`stat-value text-3xl ${stat.color}`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
