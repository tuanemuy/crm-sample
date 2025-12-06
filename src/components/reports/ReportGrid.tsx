"use client";

import {
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  ChartPieIcon,
  ClockIcon,
  CurrencyYenIcon,
  EyeIcon,
  PresentationChartLineIcon,
  StarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useState } from "react";

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  lastUpdated: string;
  isFavorite: boolean;
  type: string;
}

export function ReportGrid() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: "sales-monthly",
      name: "月次売上レポート",
      description: "月ごとの売上実績と前年同月比較",
      category: "売上レポート",
      icon: CurrencyYenIcon,
      lastUpdated: "2時間前",
      isFavorite: true,
      type: "sales",
    },
    {
      id: "activity-summary",
      name: "営業活動サマリー",
      description: "営業活動の実績と効果分析",
      category: "営業活動",
      icon: ChartBarIcon,
      lastUpdated: "1日前",
      isFavorite: true,
      type: "activity",
    },
    {
      id: "customer-analysis",
      name: "顧客分析レポート",
      description: "顧客セグメント別の売上と行動分析",
      category: "顧客分析",
      icon: UserGroupIcon,
      lastUpdated: "3日前",
      isFavorite: false,
      type: "customer",
    },
    {
      id: "roi-analysis",
      name: "ROI分析レポート",
      description: "マーケティング投資収益率分析",
      category: "ROI分析",
      icon: ChartPieIcon,
      lastUpdated: "1週間前",
      isFavorite: false,
      type: "roi",
    },
    {
      id: "sales-forecast",
      name: "売上予測レポート",
      description: "過去データに基づく売上予測",
      category: "予測分析",
      icon: PresentationChartLineIcon,
      lastUpdated: "2日前",
      isFavorite: false,
      type: "forecast",
    },
    {
      id: "customer-conversion",
      name: "顧客コンバージョンレポート",
      description: "リードから顧客への転換率分析",
      category: "顧客分析",
      icon: UserGroupIcon,
      lastUpdated: "5日前",
      isFavorite: true,
      type: "conversion",
    },
  ]);

  const toggleFavorite = (reportId: string) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? { ...report, isFavorite: !report.isFavorite }
          : report,
      ),
    );
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">利用可能なレポート</h3>
          <Link href="/reports/custom/new">
            <button type="button" className="btn btn-primary btn-sm">
              カスタムレポート作成
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="card bg-base-200 border border-base-300"
            >
              <div className="card-body p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-lg w-10">
                        <report.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{report.name}</h4>
                      <span className="badge badge-outline badge-xs">
                        {report.category}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(report.id)}
                    className="btn btn-ghost btn-xs"
                  >
                    {report.isFavorite ? (
                      <StarSolidIcon className="h-4 w-4 text-warning" />
                    ) : (
                      <StarIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-base-content/70 mb-3">
                  {report.description}
                </p>

                <div className="flex items-center justify-between text-xs text-base-content/70 mb-3">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    更新: {report.lastUpdated}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Link href={`/reports/${report.type}`} className="flex-1">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm w-full"
                    >
                      <EyeIcon className="h-3 w-3" />
                      表示
                    </button>
                  </Link>
                  <button type="button" className="btn btn-ghost btn-sm">
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ページネーション（将来の拡張用） */}
        <div className="flex justify-center mt-6">
          <div className="join">
            <button type="button" className="join-item btn btn-sm">
              1
            </button>
            <button type="button" className="join-item btn btn-sm btn-active">
              2
            </button>
            <button type="button" className="join-item btn btn-sm">
              3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
