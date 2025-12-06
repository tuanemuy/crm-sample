import { ReportChart } from "@/components/reports/ReportChart";
import { ReportDataTable } from "@/components/reports/ReportDataTable";
import { ReportExport } from "@/components/reports/ReportExport";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportHeader } from "@/components/reports/ReportHeader";

interface StandardReportPageProps {
  params: {
    type: string;
  };
}

export default function StandardReportPage({
  params,
}: StandardReportPageProps) {
  const { type } = params;

  return (
    <div className="space-y-6">
      <ReportHeader type={type} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* フィルターサイドバー */}
        <div className="lg:w-64">
          <ReportFilters type={type} />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 space-y-6">
          <ReportExport type={type} />
          <ReportChart type={type} />
          <ReportDataTable type={type} />
        </div>
      </div>
    </div>
  );
}
