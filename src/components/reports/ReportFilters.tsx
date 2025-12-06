"use client";

import { CalendarIcon } from "@heroicons/react/24/outline";

interface ReportFiltersProps {
  type: string;
}

export function ReportFilters({ type }: ReportFiltersProps) {
  return (
    <div className="space-y-4">
      {/* 期間選択 */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            期間選択
          </h3>

          <div className="space-y-3">
            <div>
              <label htmlFor="preset-period" className="label">
                プリセット期間
              </label>
              <select
                id="preset-period"
                className="select select-bordered select-sm w-full"
              >
                <option>今月</option>
                <option>先月</option>
                <option>過去3ヶ月</option>
                <option>過去6ヶ月</option>
                <option>今年</option>
                <option>昨年</option>
                <option>カスタム</option>
              </select>
            </div>

            <div>
              <label htmlFor="start-date" className="label">
                開始日
              </label>
              <input
                id="start-date"
                type="date"
                className="input input-bordered input-sm w-full"
                defaultValue="2025-01-01"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="label">
                終了日
              </label>
              <input
                id="end-date"
                type="date"
                className="input input-bordered input-sm w-full"
                defaultValue="2025-01-31"
              />
            </div>
          </div>
        </div>
      </div>

      {/* レポート固有のフィルター */}
      {type === "sales" && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-3">売上フィルター</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="product-category" className="label">
                  商品カテゴリ
                </label>
                <select
                  id="product-category"
                  className="select select-bordered select-sm w-full"
                >
                  <option>すべて</option>
                  <option>ソフトウェア</option>
                  <option>コンサルティング</option>
                  <option>サポート</option>
                </select>
              </div>
              <div>
                <label htmlFor="region" className="label">
                  地域
                </label>
                <select
                  id="region"
                  className="select select-bordered select-sm w-full"
                >
                  <option>すべて</option>
                  <option>関東</option>
                  <option>関西</option>
                  <option>その他</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {type === "customer" && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-3">顧客フィルター</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="industry" className="label">
                  業界
                </label>
                <select
                  id="industry"
                  className="select select-bordered select-sm w-full"
                >
                  <option>すべて</option>
                  <option>テクノロジー</option>
                  <option>金融</option>
                  <option>ヘルスケア</option>
                  <option>製造業</option>
                </select>
              </div>
              <div>
                <label htmlFor="company-size" className="label">
                  企業規模
                </label>
                <select
                  id="company-size"
                  className="select select-bordered select-sm w-full"
                >
                  <option>すべて</option>
                  <option>スタートアップ</option>
                  <option>中小企業</option>
                  <option>中企業</option>
                  <option>大企業</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="font-semibold mb-3">表示オプション</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                defaultChecked
              />
              <span className="text-sm">トレンドライン表示</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                defaultChecked
              />
              <span className="text-sm">前年同期比較</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm" />
              <span className="text-sm">目標値表示</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
