import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { CustomReportBuilder } from "@/components/reports/CustomReportBuilder";
import { CustomReportPreview } from "@/components/reports/CustomReportPreview";

export default function CustomReportNewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <button type="button" className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            カスタムレポート作成
          </h1>
          <p className="text-base-content/70 mt-1">
            独自のレポートを作成してデータを分析できます
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* レポート設定 */}
        <div>
          <CustomReportBuilder />
        </div>

        {/* プレビュー */}
        <div>
          <CustomReportPreview />
        </div>
      </div>
    </div>
  );
}
