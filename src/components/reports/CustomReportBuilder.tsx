"use client";

import {
  DocumentIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface DataSource {
  id: string;
  name: string;
  table: string;
}

interface Metric {
  id: string;
  name: string;
  field: string;
  aggregation: "sum" | "count" | "avg" | "min" | "max";
}

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export function CustomReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [selectedDataSource, setSelectedDataSource] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [groupByFields, setGroupByFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [chartType, setChartType] = useState("bar");

  const dataSources: DataSource[] = [
    { id: "sales", name: "売上データ", table: "sales" },
    { id: "customers", name: "顧客データ", table: "customers" },
    { id: "activities", name: "営業活動データ", table: "activities" },
    { id: "leads", name: "リードデータ", table: "leads" },
  ];

  const availableMetrics: Record<string, Metric[]> = {
    sales: [
      {
        id: "total_amount",
        name: "売上合計",
        field: "amount",
        aggregation: "sum",
      },
      {
        id: "avg_amount",
        name: "平均売上",
        field: "amount",
        aggregation: "avg",
      },
      { id: "sales_count", name: "取引数", field: "id", aggregation: "count" },
    ],
    customers: [
      {
        id: "customer_count",
        name: "顧客数",
        field: "id",
        aggregation: "count",
      },
      {
        id: "avg_company_size",
        name: "平均企業規模",
        field: "size",
        aggregation: "avg",
      },
    ],
    activities: [
      {
        id: "activity_count",
        name: "活動数",
        field: "id",
        aggregation: "count",
      },
      {
        id: "avg_duration",
        name: "平均時間",
        field: "duration",
        aggregation: "avg",
      },
    ],
  };

  const availableFields: Record<string, string[]> = {
    sales: ["date", "customer", "product", "region", "status"],
    customers: ["industry", "size", "region", "status"],
    activities: ["type", "status", "assigned_user", "date"],
  };

  const addFilter = () => {
    const newFilter: Filter = {
      id: `filter_${Date.now()}`,
      field: "",
      operator: "equals",
      value: "",
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(
      filters.map((filter) =>
        filter.id === id ? { ...filter, ...updates } : filter,
      ),
    );
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((filter) => filter.id !== id));
  };

  const handleSaveReport = () => {
    // レポート保存処理
    console.log("レポートを保存:", {
      name: reportName,
      dataSource: selectedDataSource,
      metrics: selectedMetrics,
      groupBy: groupByFields,
      filters,
      chartType,
    });
  };

  return (
    <div className="space-y-6">
      {/* 基本設定 */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h3 className="text-lg font-semibold mb-4">基本設定</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="report-name" className="label">
                レポート名
              </label>
              <input
                id="report-name"
                type="text"
                className="input input-bordered w-full"
                placeholder="レポート名を入力"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="data-source" className="label">
                データソース
              </label>
              <select
                id="data-source"
                className="select select-bordered w-full"
                value={selectedDataSource}
                onChange={(e) => setSelectedDataSource(e.target.value)}
              >
                <option value="">データソースを選択</option>
                {dataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="chart-type" className="label">
                チャートタイプ
              </label>
              <select
                id="chart-type"
                className="select select-bordered w-full"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="bar">棒グラフ</option>
                <option value="line">線グラフ</option>
                <option value="pie">円グラフ</option>
                <option value="table">テーブル</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 指標選択 */}
      {selectedDataSource && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <h3 className="text-lg font-semibold mb-4">指標選択</h3>

            <div className="space-y-2">
              {availableMetrics[selectedDataSource]?.map((metric) => (
                <label
                  key={metric.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedMetrics.includes(metric.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMetrics([...selectedMetrics, metric.id]);
                      } else {
                        setSelectedMetrics(
                          selectedMetrics.filter((id) => id !== metric.id),
                        );
                      }
                    }}
                  />
                  <div>
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-sm text-base-content/70">
                      {metric.aggregation}({metric.field})
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* グループ化設定 */}
      {selectedDataSource && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <h3 className="text-lg font-semibold mb-4">グループ化</h3>

            <div className="space-y-2">
              {availableFields[selectedDataSource]?.map((field) => (
                <label
                  key={field}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={groupByFields.includes(field)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGroupByFields([...groupByFields, field]);
                      } else {
                        setGroupByFields(
                          groupByFields.filter((f) => f !== field),
                        );
                      }
                    }}
                  />
                  <span className="capitalize">{field}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* フィルター設定 */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">フィルター条件</h3>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={addFilter}
            >
              <PlusIcon className="h-4 w-4" />
              追加
            </button>
          </div>

          <div className="space-y-3">
            {filters.map((filter) => (
              <div key={filter.id} className="flex items-center gap-2">
                <select
                  className="select select-bordered select-sm flex-1"
                  value={filter.field}
                  onChange={(e) =>
                    updateFilter(filter.id, { field: e.target.value })
                  }
                >
                  <option value="">フィールドを選択</option>
                  {selectedDataSource &&
                    availableFields[selectedDataSource]?.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                </select>

                <select
                  className="select select-bordered select-sm"
                  value={filter.operator}
                  onChange={(e) =>
                    updateFilter(filter.id, { operator: e.target.value })
                  }
                >
                  <option value="equals">等しい</option>
                  <option value="not_equals">等しくない</option>
                  <option value="contains">含む</option>
                  <option value="greater_than">より大きい</option>
                  <option value="less_than">より小さい</option>
                </select>

                <input
                  type="text"
                  className="input input-bordered input-sm flex-1"
                  placeholder="値"
                  value={filter.value}
                  onChange={(e) =>
                    updateFilter(filter.id, { value: e.target.value })
                  }
                />

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeFilter(filter.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}

            {filters.length === 0 && (
              <div className="text-center text-base-content/50 py-4">
                フィルター条件がありません
              </div>
            )}
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-primary flex-1"
          onClick={handleSaveReport}
          disabled={
            !reportName || !selectedDataSource || selectedMetrics.length === 0
          }
        >
          <DocumentIcon className="h-4 w-4" />
          レポートを保存
        </button>

        <button type="button" className="btn btn-outline">
          <ShareIcon className="h-4 w-4" />
          共有
        </button>
      </div>
    </div>
  );
}
