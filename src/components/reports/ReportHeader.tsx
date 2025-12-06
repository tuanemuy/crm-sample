"use client";

import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface ReportHeaderProps {
  type: string;
}

const reportTitles: Record<string, string> = {
  sales: "売上実績レポート",
  activity: "営業活動レポート",
  customer: "顧客分析レポート",
  roi: "ROI分析レポート",
  forecast: "売上予測レポート",
  conversion: "顧客コンバージョンレポート",
};

const reportDescriptions: Record<string, string> = {
  sales: "売上実績と前年同期比較、トレンド分析",
  activity: "営業活動の実績と効果分析",
  customer: "顧客セグメント別の売上と行動分析",
  roi: "マーケティング投資収益率分析",
  forecast: "過去データに基づく売上予測",
  conversion: "リードから顧客への転換率分析",
};

export function ReportHeader({ type }: ReportHeaderProps) {
  const title = reportTitles[type] || "レポート";
  const description = reportDescriptions[type] || "データ分析レポート";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <button type="button" className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-base-content">{title}</h1>
          <p className="text-base-content/70 mt-1">{description}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn btn-outline btn-sm">
          <ArrowPathIcon className="h-4 w-4" />
          更新
        </button>
      </div>
    </div>
  );
}
