import { FavoriteReports } from "@/components/reports/FavoriteReports";
import { QuickReports } from "@/components/reports/QuickReports";
import { ReportCategories } from "@/components/reports/ReportCategories";
import { ReportGrid } from "@/components/reports/ReportGrid";
import { ReportSearch } from "@/components/reports/ReportSearch";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            レポートダッシュボード
          </h1>
          <p className="text-base-content/70 mt-1">
            各種レポートへのアクセスと主要KPIの表示
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* サイドバー */}
        <div className="lg:col-span-1 space-y-6">
          <ReportSearch />
          <ReportCategories />
          <FavoriteReports />
        </div>

        {/* メインコンテンツ */}
        <div className="lg:col-span-3 space-y-6">
          <QuickReports />
          <ReportGrid />
        </div>
      </div>
    </div>
  );
}
