"use client";

import {
  BuildingOfficeIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface SettingsNavigationProps {
  currentPage: "system" | "profile";
}

export function SettingsNavigation({ currentPage }: SettingsNavigationProps) {
  const navigationItems = [
    {
      id: "system",
      label: "システム設定",
      icon: Cog6ToothIcon,
      href: "/settings/system",
      description: "システム全体の設定",
    },
    {
      id: "profile",
      label: "個人設定",
      icon: UserIcon,
      href: "/settings/profile",
      description: "個人の設定とプロフィール",
    },
  ];

  const systemCategories = [
    {
      label: "組織設定",
      icon: BuildingOfficeIcon,
      anchor: "#organization",
    },
    {
      label: "ユーザー管理",
      icon: UsersIcon,
      anchor: "#users",
    },
    {
      label: "セキュリティ",
      icon: ShieldCheckIcon,
      anchor: "#security",
    },
    {
      label: "統合設定",
      icon: CloudArrowUpIcon,
      anchor: "#integrations",
    },
  ];

  return (
    <div className="space-y-4">
      {/* メインナビゲーション */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="font-semibold mb-3">設定カテゴリ</h3>
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link key={item.id} href={item.href}>
                <button
                  type="button"
                  className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? "bg-primary text-primary-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div
                      className={`text-xs ${
                        currentPage === item.id
                          ? "text-primary-content/70"
                          : "text-base-content/70"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* システム設定のサブカテゴリ */}
      {currentPage === "system" && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-3">設定セクション</h3>
            <div className="space-y-1">
              {systemCategories.map((category) => (
                <a
                  key={category.label}
                  href={category.anchor}
                  className="flex items-center gap-3 w-full p-2 rounded hover:bg-base-200 transition-colors text-sm"
                >
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
