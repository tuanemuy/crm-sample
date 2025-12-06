"use client";

interface SalesData {
  month: string;
  sales: number;
  target: number;
}

interface ActivityData {
  activity: string;
  count: number;
  conversion: number;
}

interface ReportChartProps {
  type: string;
}

export function ReportChart({ type }: ReportChartProps) {
  // サンプルデータ（実際の実装では適切なチャートライブラリを使用）
  const getSampleData = () => {
    switch (type) {
      case "sales":
        return [
          { month: "1月", sales: 8500000, target: 10000000 },
          { month: "2月", sales: 9200000, target: 10000000 },
          { month: "3月", sales: 12500000, target: 10000000 },
          { month: "4月", sales: 11800000, target: 10000000 },
          { month: "5月", sales: 13200000, target: 10000000 },
        ];
      case "activity":
        return [
          { activity: "電話", count: 156, conversion: 15.2 },
          { activity: "メール", count: 234, conversion: 8.7 },
          { activity: "面談", count: 89, conversion: 42.1 },
          { activity: "訪問", count: 45, conversion: 67.3 },
        ];
      default:
        return [];
    }
  };

  const data = getSampleData();

  if (type === "sales") {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="text-lg font-semibold mb-4">月別売上実績</h3>

          {/* 簡易チャート表示（実際の実装ではChart.jsやRechartsなどを使用） */}
          <div className="h-64 bg-base-200 rounded-lg flex items-end p-4 gap-4">
            {(data as SalesData[]).map((item) => (
              <div
                key={item.month}
                className="flex flex-col items-center flex-1"
              >
                <div className="flex flex-col items-center gap-1 h-full justify-end">
                  {/* 実績バー */}
                  <div
                    className="bg-primary rounded-t w-full flex items-end justify-center pb-1"
                    style={{ height: `${(item.sales / 15000000) * 180}px` }}
                  >
                    <span className="text-xs text-primary-content font-semibold">
                      {(item.sales / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  {/* 目標ライン */}
                  <div className="w-full h-1 bg-error opacity-50 rounded" />
                </div>
                <span className="text-xs mt-2">{item.month}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded" />
              <span className="text-sm">実績</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-error rounded" />
              <span className="text-sm">目標</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "activity") {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="text-lg font-semibold mb-4">営業活動別実績</h3>

          <div className="space-y-4">
            {(data as ActivityData[]).map((item) => (
              <div key={item.activity} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">{item.activity}</div>
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1 bg-base-200 rounded-full h-3 relative">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${(item.count / 250) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-right">{item.count}件</div>
                  <div className="w-16 text-sm text-right text-success">
                    {item.conversion}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // デフォルトのプレースホルダー
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4">データ可視化</h3>
        <div className="h-64 bg-base-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-base-content/70">
              チャートデータを読み込み中...
            </div>
            <p className="text-sm text-base-content/50 mt-2">
              フィルターを適用してデータを表示
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
