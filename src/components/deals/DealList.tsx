"use client";

import {
  BanknotesIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface Deal {
  id: string;
  title: string;
  customer: string;
  amount: number;
  stage:
    | "lead"
    | "prospect"
    | "proposal"
    | "negotiation"
    | "closing"
    | "won"
    | "lost";
  probability: number;
  expectedCloseDate: string;
  assignedUser: string;
  lastActivity: string;
  createdAt: string;
  source: string;
}

const mockDeals: Deal[] = [
  {
    id: "deal-001",
    title: "CRMシステム導入",
    customer: "株式会社テクノロジー",
    amount: 5000000,
    stage: "proposal",
    probability: 75,
    expectedCloseDate: "2025-08-15",
    assignedUser: "田中営業",
    lastActivity: "2025-07-02",
    createdAt: "2025-06-01",
    source: "ウェブサイト",
  },
  {
    id: "deal-002",
    title: "営業支援ツール",
    customer: "サービス株式会社",
    amount: 2400000,
    stage: "negotiation",
    probability: 60,
    expectedCloseDate: "2025-07-30",
    assignedUser: "山田営業",
    lastActivity: "2025-07-01",
    createdAt: "2025-05-15",
    source: "紹介",
  },
  {
    id: "deal-003",
    title: "データ分析プラットフォーム",
    customer: "イノベーション合同会社",
    amount: 8500000,
    stage: "lead",
    probability: 25,
    expectedCloseDate: "2025-09-30",
    assignedUser: "田中営業",
    lastActivity: "2025-06-30",
    createdAt: "2025-06-20",
    source: "展示会",
  },
  {
    id: "deal-004",
    title: "業務効率化システム",
    customer: "株式会社ソリューション",
    amount: 3200000,
    stage: "closing",
    probability: 90,
    expectedCloseDate: "2025-07-15",
    assignedUser: "佐々木営業",
    lastActivity: "2025-07-02",
    createdAt: "2025-04-10",
    source: "広告",
  },
  {
    id: "deal-005",
    title: "マーケティングオートメーション",
    customer: "デジタル株式会社",
    amount: 4800000,
    stage: "won",
    probability: 100,
    expectedCloseDate: "2025-06-30",
    assignedUser: "山田営業",
    lastActivity: "2025-06-30",
    createdAt: "2025-03-01",
    source: "SNS",
  },
];

const stageLabels = {
  lead: "リード",
  prospect: "見込み",
  proposal: "提案",
  negotiation: "交渉",
  closing: "クロージング",
  won: "受注",
  lost: "失注",
};

const stageColors = {
  lead: "badge-info",
  prospect: "badge-warning",
  proposal: "badge-primary",
  negotiation: "badge-accent",
  closing: "badge-success",
  won: "badge-success",
  lost: "badge-error",
};

const getProbabilityColor = (probability: number) => {
  if (probability >= 80) return "text-success";
  if (probability >= 60) return "text-warning";
  if (probability >= 40) return "text-info";
  return "text-error";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
};

export function DealList() {
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredDeals = mockDeals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.assignedUser.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === "all" || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDeals = filteredDeals.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // パイプラインビュー用のデータ整理
  const pipelineStages = [
    {
      key: "lead",
      label: "リード",
      deals: filteredDeals.filter((d) => d.stage === "lead"),
    },
    {
      key: "prospect",
      label: "見込み",
      deals: filteredDeals.filter((d) => d.stage === "prospect"),
    },
    {
      key: "proposal",
      label: "提案",
      deals: filteredDeals.filter((d) => d.stage === "proposal"),
    },
    {
      key: "negotiation",
      label: "交渉",
      deals: filteredDeals.filter((d) => d.stage === "negotiation"),
    },
    {
      key: "closing",
      label: "クロージング",
      deals: filteredDeals.filter((d) => d.stage === "closing"),
    },
  ];

  const totalPipelineValue = filteredDeals
    .filter((d) => !["won", "lost"].includes(d.stage))
    .reduce((sum, deal) => sum + (deal.amount * deal.probability) / 100, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <div className="form-control flex-1">
            <div className="input-group">
              <input
                type="text"
                placeholder="商談名、顧客名、担当者で検索..."
                className="input input-bordered flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="button" className="btn btn-square btn-outline">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <select
            className="select select-bordered min-w-fit"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="all">すべてのステージ</option>
            <option value="lead">リード</option>
            <option value="prospect">見込み</option>
            <option value="proposal">提案</option>
            <option value="negotiation">交渉</option>
            <option value="closing">クロージング</option>
            <option value="won">受注</option>
            <option value="lost">失注</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="btn-group">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "pipeline" ? "btn-active" : ""}`}
              onClick={() => setViewMode("pipeline")}
            >
              <FunnelIcon className="h-4 w-4" />
              パイプライン
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "list" ? "btn-active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <ViewColumnsIcon className="h-4 w-4" />
              リスト
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-sm">
            <PlusIcon className="h-5 w-5" />
            新規商談追加
          </button>
        </div>
      </div>

      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <BriefcaseIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">アクティブ商談</div>
          <div className="stat-value text-primary">
            {
              filteredDeals.filter((d) => !["won", "lost"].includes(d.stage))
                .length
            }
          </div>
          <div className="stat-desc">進行中の商談数</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-success">
            <BanknotesIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">パイプライン価値</div>
          <div className="stat-value text-success text-lg">
            {formatCurrency(totalPipelineValue)}
          </div>
          <div className="stat-desc">期待収益額</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-accent">
            <CalendarDaysIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">今月クローズ</div>
          <div className="stat-value text-accent">
            {
              filteredDeals.filter((d) => {
                const closeDate = new Date(d.expectedCloseDate);
                const now = new Date();
                return (
                  closeDate.getMonth() === now.getMonth() &&
                  closeDate.getFullYear() === now.getFullYear()
                );
              }).length
            }
          </div>
          <div className="stat-desc">予定商談数</div>
        </div>
      </div>

      {viewMode === "pipeline" ? (
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-4">
            {pipelineStages.map((stage) => (
              <div key={stage.key} className="flex-shrink-0 w-80">
                <div className="card bg-base-100 shadow-sm h-full">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{stage.label}</h3>
                      <div className="badge badge-outline">
                        {stage.deals.length}
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {stage.deals.map((deal) => (
                        <div
                          key={deal.id}
                          className="card bg-base-200 shadow-sm border border-base-300 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="card-body p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm line-clamp-2">
                                {deal.title}
                              </h4>
                              <Link
                                href={`/deals/${deal.id}`}
                                className="btn btn-ghost btn-xs"
                              >
                                <EyeIcon className="h-3 w-3" />
                              </Link>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2">
                                <BuildingOfficeIcon className="h-3 w-3 opacity-70" />
                                <span className="truncate">
                                  {deal.customer}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <BanknotesIcon className="h-3 w-3 opacity-70" />
                                <span className="font-medium">
                                  {formatCurrency(deal.amount)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <UserIcon className="h-3 w-3 opacity-70" />
                                <span className="truncate">
                                  {deal.assignedUser}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-sm font-medium ${getProbabilityColor(deal.probability)}`}
                                >
                                  {deal.probability}%
                                </span>
                                <span className="opacity-70">
                                  {deal.expectedCloseDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>商談情報</th>
                    <th>顧客</th>
                    <th>金額</th>
                    <th>ステージ</th>
                    <th>確度</th>
                    <th>担当者</th>
                    <th>クローズ予定</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDeals.map((deal) => (
                    <tr key={deal.id} className="hover">
                      <td>
                        <div>
                          <div className="font-bold">{deal.title}</div>
                          <div className="text-sm opacity-50">
                            ソース: {deal.source}
                          </div>
                          <div className="text-sm opacity-50">
                            登録: {deal.createdAt}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="h-4 w-4 opacity-70" />
                          {deal.customer}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-success">
                          {formatCurrency(deal.amount)}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${stageColors[deal.stage]} badge-sm`}
                        >
                          {stageLabels[deal.stage]}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-bold ${getProbabilityColor(deal.probability)}`}
                          >
                            {deal.probability}%
                          </span>
                          <progress
                            className="progress progress-primary w-16"
                            value={deal.probability}
                            max={100}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-8">
                              <span className="text-xs">
                                {deal.assignedUser.charAt(0)}
                              </span>
                            </div>
                          </div>
                          {deal.assignedUser}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div>{deal.expectedCloseDate}</div>
                          <div className="opacity-50">
                            最終活動: {deal.lastActivity}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/deals/${deal.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDeals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-base-content/50">
                  検索条件に一致する商談が見つかりません。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === "list" && totalPages > 1 && (
        <div className="flex justify-center">
          <div className="join">
            <button
              type="button"
              className="join-item btn btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              前へ
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`join-item btn btn-sm ${
                  page === currentPage ? "btn-active" : ""
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="join-item btn btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
