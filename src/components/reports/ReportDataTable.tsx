"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface SalesData {
  date: string;
  customer: string;
  product: string;
  amount: number;
  status: string;
  assignedUser: string;
}

interface ActivityData {
  date: string;
  activity: string;
  type: string;
  customer: string;
  duration: number;
  result: string;
  assignedUser: string;
}

interface ReportDataTableProps {
  type: string;
}

export function ReportDataTable({ type }: ReportDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getSampleData = () => {
    switch (type) {
      case "sales":
        return [
          {
            date: "2025-01-15",
            customer: "株式会社テックソリューションズ",
            product: "システム導入",
            amount: 2500000,
            status: "完了",
            assignedUser: "田中太郎",
          },
          {
            date: "2025-01-14",
            customer: "グローバルイノベーション株式会社",
            product: "コンサルティング",
            amount: 1800000,
            status: "完了",
            assignedUser: "佐藤花子",
          },
          {
            date: "2025-01-13",
            customer: "デジタルプラットフォーム株式会社",
            product: "ライセンス",
            amount: 950000,
            status: "進行中",
            assignedUser: "鈴木一郎",
          },
          {
            date: "2025-01-12",
            customer: "株式会社スマートシステムズ",
            product: "サポート",
            amount: 650000,
            status: "完了",
            assignedUser: "高橋美理",
          },
        ];
      case "activity":
        return [
          {
            date: "2025-01-15",
            activity: "商談打ち合わせ",
            type: "面談",
            customer: "株式会社テックソリューションズ",
            duration: 60,
            result: "成功",
            assignedUser: "田中太郎",
          },
          {
            date: "2025-01-14",
            activity: "フォローアップ電話",
            type: "電話",
            customer: "グローバルイノベーション株式会社",
            duration: 30,
            result: "成功",
            assignedUser: "佐藤花子",
          },
          {
            date: "2025-01-13",
            activity: "提案書送付",
            type: "メール",
            customer: "デジタルプラットフォーム株式会社",
            duration: 15,
            result: "開封",
            assignedUser: "鈴木一郎",
          },
        ];
      default:
        return [];
    }
  };

  const data = getSampleData();
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  if (type === "sales") {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-0">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">売上詳細データ</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      日付
                      {sortBy === "date" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>顧客</th>
                  <th>商品・サービス</th>
                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort("amount")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      金額
                      {sortBy === "amount" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>ステータス</th>
                  <th>担当者</th>
                </tr>
              </thead>
              <tbody>
                {(currentData as SalesData[]).map((item) => (
                  <tr key={`${item.date}-${item.customer}`} className="hover">
                    <td>{item.date}</td>
                    <td>{item.customer}</td>
                    <td>{item.product}</td>
                    <td className="font-semibold">
                      {formatCurrency(item.amount)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === "完了"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.assignedUser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-base-content/70">
              {startIndex + 1}-{Math.min(endIndex, data.length)} / {data.length}
              件
            </div>

            <div className="join">
              <button
                type="button"
                className="join-item btn btn-sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={`join-item btn btn-sm ${
                      currentPage === page ? "btn-active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                className="join-item btn btn-sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "activity") {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-0">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">営業活動詳細データ</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      日付
                      {sortBy === "date" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th>活動内容</th>
                  <th>タイプ</th>
                  <th>顧客</th>
                  <th>時間(分)</th>
                  <th>結果</th>
                  <th>担当者</th>
                </tr>
              </thead>
              <tbody>
                {(currentData as ActivityData[]).map((item) => (
                  <tr key={`${item.date}-${item.customer}`} className="hover">
                    <td>{item.date}</td>
                    <td>{item.activity}</td>
                    <td>
                      <span className="badge badge-outline">{item.type}</span>
                    </td>
                    <td>{item.customer}</td>
                    <td>{item.duration}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.result === "成功"
                            ? "badge-success"
                            : "badge-info"
                        }`}
                      >
                        {item.result}
                      </span>
                    </td>
                    <td>{item.assignedUser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-base-content/70">
              {startIndex + 1}-{Math.min(endIndex, data.length)} / {data.length}
              件
            </div>

            <div className="join">
              <button
                type="button"
                className="join-item btn btn-sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={`join-item btn btn-sm ${
                      currentPage === page ? "btn-active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                className="join-item btn btn-sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // デフォルトのプレースホルダー
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4">データテーブル</h3>
        <div className="h-32 bg-base-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-base-content/70">データを読み込み中...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
