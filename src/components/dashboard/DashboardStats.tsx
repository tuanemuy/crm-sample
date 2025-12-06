import {
  BriefcaseIcon,
  ChartBarIcon,
  CurrencyYenIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300">
      <div className="stat-figure text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <div className="stat-title text-base-content/70">{title}</div>
      <div className="stat-value text-base-content">{value}</div>
      <div className="stat-desc">
        <span
          className={`${
            changeType === "increase" ? "text-success" : "text-error"
          } font-medium`}
        >
          {changeType === "increase" ? "↗︎" : "↘︎"} {change}
        </span>
        <span className="text-base-content/70 ml-1">先月比</span>
      </div>
    </div>
  );
}

export function DashboardStats() {
  const stats = [
    {
      title: "月間売上",
      value: "¥12,450,000",
      change: "12%",
      changeType: "increase" as const,
      icon: CurrencyYenIcon,
    },
    {
      title: "アクティブ商談数",
      value: "47",
      change: "8%",
      changeType: "increase" as const,
      icon: BriefcaseIcon,
    },
    {
      title: "コンバージョン率",
      value: "24.5%",
      change: "3.2%",
      changeType: "increase" as const,
      icon: ChartBarIcon,
    },
    {
      title: "新規顧客数",
      value: "12",
      change: "5%",
      changeType: "decrease" as const,
      icon: UserGroupIcon,
    },
  ];

  return (
    <div className="stats stats-horizontal shadow w-full bg-base-100">
      {stats.map((stat, _index) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}
