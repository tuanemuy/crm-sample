import { DashboardCustomization } from "@/components/settings/DashboardCustomization";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PasswordSettings } from "@/components/settings/PasswordSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SettingsNavigation } from "@/components/settings/SettingsNavigation";

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">個人設定</h1>
          <p className="text-base-content/70 mt-1">ユーザー個人の設定を管理</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ナビゲーション */}
        <div className="lg:w-64">
          <SettingsNavigation currentPage="profile" />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 space-y-6">
          <ProfileSettings />
          <PasswordSettings />
          <NotificationSettings />
          <DashboardCustomization />
        </div>
      </div>
    </div>
  );
}
