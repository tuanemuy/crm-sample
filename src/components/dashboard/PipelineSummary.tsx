interface PipelineStage {
  name: string;
  count: number;
  value: number;
  color: string;
}

export function PipelineSummary() {
  const stages: PipelineStage[] = [
    {
      name: "リード",
      count: 24,
      value: 48000000,
      color: "bg-blue-500",
    },
    {
      name: "初回接触",
      count: 18,
      value: 36000000,
      color: "bg-indigo-500",
    },
    {
      name: "提案",
      count: 12,
      value: 24000000,
      color: "bg-purple-500",
    },
    {
      name: "交渉",
      count: 8,
      value: 16000000,
      color: "bg-pink-500",
    },
    {
      name: "クロージング",
      count: 5,
      value: 10000000,
      color: "bg-green-500",
    },
  ];

  const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);
  const totalCount = stages.reduce((sum, stage) => sum + stage.count, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="card-title text-base-content">
              パイプラインサマリー
            </h2>
            <p className="text-sm text-base-content/70">
              合計: {totalCount}件 / {formatCurrency(totalValue)}
            </p>
          </div>
          <button className="btn btn-sm btn-primary">詳細表示</button>
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const percentage = (stage.value / totalValue) * 100;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-base-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <div>
                    <h3 className="font-medium text-base-content">
                      {stage.name}
                    </h3>
                    <p className="text-sm text-base-content/70">
                      {stage.count}件
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-base-content">
                    {formatCurrency(stage.value)}
                  </p>
                  <p className="text-sm text-base-content/70">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="flex h-2 rounded-full overflow-hidden bg-base-300">
            {stages.map((stage, index) => {
              const percentage = (stage.value / totalValue) * 100;
              return (
                <div
                  key={index}
                  className={stage.color}
                  style={{ width: `${percentage}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
