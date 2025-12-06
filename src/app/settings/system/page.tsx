import { DataManagement } from "@/components/settings/DataManagement";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { SettingsNavigation } from "@/components/settings/SettingsNavigation";
import { UserManagement } from "@/components/settings/UserManagement";

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">システム設定</h1>
          <p className="text-base-content/70 mt-1">
            システム全体の設定を管理（管理者のみ）
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ナビゲーション */}
        <div className="lg:w-64">
          <SettingsNavigation currentPage="system" />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 space-y-6">
          <OrganizationSettings />
          <UserManagement />
          <SecuritySettings />
          <IntegrationSettings />
          <DataManagement />
        </div>
      </div>
    </div>
  );
}
