"use client";

import { ArrowPathIcon, EyeIcon } from "@heroicons/react/24/outline";

export function CustomReportPreview() {
  // サンプルプレビューデータ
  const sampleData = [
    { category: "テクノロジー", value: 12500000, count: 15 },
    { category: "金融", value: 8900000, count: 12 },
    { category: "ヘルスケア", value: 6700000, count: 8 },
    { category: "製造業", value: 5400000, count: 6 },
  ];

  const maxValue = Math.max(...sampleData.map((item) => item.value));

  return (
    <div className="space-y-6">
      {/* プレビューヘッダー */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              プレビュー
            </h3>
            <button type="button" className="btn btn-outline btn-sm">
              <ArrowPathIcon className="h-4 w-4" />
              更新
            </button>
          </div>
        </div>
      </div>

      {/* チャートプレビュー */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h4 className="font-semibold mb-4">業界別売上実績</h4>

          {/* 簡易棒グラフ */}
          <div className="space-y-3">
            {sampleData.map((item) => (
              <div key={item.category} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium truncate">
                  {item.category}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-base-200 rounded-full h-4 relative">
                    <div
                      className="bg-primary h-full rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    >
                      <span className="text-xs text-primary-content font-semibold">
                        {(item.value / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-right">{item.count}件</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-base-200 rounded-lg">
            <div className="text-sm text-base-content/70">
              <strong>合計:</strong> ¥
              {sampleData
                .reduce((sum, item) => sum + item.value, 0)
                .toLocaleString()}{" "}
              / {sampleData.reduce((sum, item) => sum + item.count, 0)}件
            </div>
          </div>
        </div>
      </div>

      {/* データテーブルプレビュー */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-0">
          <div className="p-4 border-b">
            <h4 className="font-semibold">データテーブル</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>業界</th>
                  <th>売上合計</th>
                  <th>取引数</th>
                  <th>平均取引額</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.map((item) => (
                  <tr key={item.category}>
                    <td>{item.category}</td>
                    <td>¥{item.value.toLocaleString()}</td>
                    <td>{item.count}</td>
                    <td>¥{(item.value / item.count).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h4 className="font-semibold mb-4">統計サマリー</h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="stat bg-base-200 rounded-lg p-3">
              <div className="stat-title text-xs">総売上</div>
              <div className="stat-value text-lg">
                ¥
                {sampleData
                  .reduce((sum, item) => sum + item.value, 0)
                  .toLocaleString()}
              </div>
            </div>

            <div className="stat bg-base-200 rounded-lg p-3">
              <div className="stat-title text-xs">総取引数</div>
              <div className="stat-value text-lg">
                {sampleData.reduce((sum, item) => sum + item.count, 0)}件
              </div>
            </div>

            <div className="stat bg-base-200 rounded-lg p-3">
              <div className="stat-title text-xs">平均取引額</div>
              <div className="stat-value text-lg">
                ¥
                {Math.round(
                  sampleData.reduce((sum, item) => sum + item.value, 0) /
                    sampleData.reduce((sum, item) => sum + item.count, 0),
                ).toLocaleString()}
              </div>
            </div>

            <div className="stat bg-base-200 rounded-lg p-3">
              <div className="stat-title text-xs">最高売上業界</div>
              <div className="stat-value text-lg">{sampleData[0].category}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="alert alert-info">
        <div className="text-sm">
          <div className="font-semibold">プレビューについて</div>
          <div className="mt-1">
            これはサンプルデータを使用したプレビューです。
            実際のレポートでは選択したデータソースと条件に基づいてデータが表示されます。
          </div>
        </div>
      </div>
    </div>
  );
}
