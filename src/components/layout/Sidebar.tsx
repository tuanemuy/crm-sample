"use client";

import {
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? "bg-primary text-primary-content"
            : "text-base-content hover:bg-base-200"
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
      </Link>
    </li>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: "/",
      icon: HomeIcon,
      label: "ダッシュボード",
    },
    {
      href: "/customers",
      icon: UserGroupIcon,
      label: "顧客",
    },
    {
      href: "/leads",
      icon: UsersIcon,
      label: "リード",
    },
    {
      href: "/deals",
      icon: BriefcaseIcon,
      label: "商談",
    },
    {
      href: "/activities",
      icon: CalendarIcon,
      label: "営業活動",
    },
    {
      href: "/reports",
      icon: ChartBarIcon,
      label: "レポート",
    },
    {
      href: "/settings",
      icon: CogIcon,
      label: "設定",
    },
  ];

  return (
    <aside className="min-h-full w-80 bg-base-100 shadow-lg">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-content font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-base-content">CRM System</h1>
            <p className="text-sm text-base-content/70">顧客関係管理</p>
          </div>
        </div>

        <nav>
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
