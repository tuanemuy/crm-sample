"use client";

import {
  ArrowUpIcon,
  BuildingOfficeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status:
    | "new"
    | "contacted"
    | "qualified"
    | "nurturing"
    | "converted"
    | "lost";
  score: number;
  assignedUser: string;
  lastActivity: string;
  createdAt: string;
}

const mockLeads: Lead[] = [
  {
    id: "lead-001",
    name: "佐藤 太郎",
    company: "株式会社テクノロジー",
    email: "sato@technology.jp",
    phone: "03-1234-5678",
    source: "ウェブサイト",
    status: "qualified",
    score: 85,
    assignedUser: "田中営業",
    lastActivity: "2025-07-02",
    createdAt: "2025-06-28",
  },
  {
    id: "lead-002",
    name: "鈴木 花子",
    company: "サービス株式会社",
    email: "suzuki@service.co.jp",
    phone: "03-2345-6789",
    source: "紹介",
    status: "new",
    score: 72,
    assignedUser: "山田営業",
    lastActivity: "2025-07-01",
    createdAt: "2025-06-30",
  },
  {
    id: "lead-003",
    name: "高橋 次郎",
    company: "イノベーション合同会社",
    email: "takahashi@innovation.com",
    phone: "03-3456-7890",
    source: "展示会",
    status: "contacted",
    score: 68,
    assignedUser: "田中営業",
    lastActivity: "2025-06-30",
    createdAt: "2025-06-25",
  },
  {
    id: "lead-004",
    name: "伊藤 美智子",
    company: "株式会社ソリューション",
    email: "ito@solution.jp",
    phone: "03-4567-8901",
    source: "広告",
    status: "nurturing",
    score: 45,
    assignedUser: "佐々木営業",
    lastActivity: "2025-06-29",
    createdAt: "2025-06-20",
  },
  {
    id: "lead-005",
    name: "渡辺 健一",
    company: "デジタル株式会社",
    email: "watanabe@digital.co.jp",
    phone: "03-5678-9012",
    source: "SNS",
    status: "converted",
    score: 95,
    assignedUser: "山田営業",
    lastActivity: "2025-07-01",
    createdAt: "2025-06-15",
  },
];

const statusLabels = {
  new: "新規",
  contacted: "接触済み",
  qualified: "見込み有り",
  nurturing: "育成中",
  converted: "顧客化",
  lost: "失注",
};

const statusColors = {
  new: "badge-info",
  contacted: "badge-warning",
  qualified: "badge-success",
  nurturing: "badge-primary",
  converted: "badge-accent",
  lost: "badge-error",
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
};

const getScoreBadgeColor = (score: number) => {
  if (score >= 80) return "badge-success";
  if (score >= 60) return "badge-warning";
  return "badge-error";
};

export function LeadList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeads = filteredLeads.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <div className="form-control flex-1">
            <div className="input-group">
              <input
                type="text"
                placeholder="リード名、会社名、メールアドレスで検索..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">すべてのステータス</option>
            <option value="new">新規</option>
            <option value="contacted">接触済み</option>
            <option value="qualified">見込み有り</option>
            <option value="nurturing">育成中</option>
            <option value="converted">顧客化</option>
            <option value="lost">失注</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Link href="/leads/scoring" className="btn btn-outline">
            <SparklesIcon className="h-5 w-5" />
            スコアリング設定
          </Link>
          <button type="button" className="btn btn-primary">
            <PlusIcon className="h-5 w-5" />
            新規リード追加
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>リード情報</th>
                  <th>会社</th>
                  <th>ソース</th>
                  <th>ステータス</th>
                  <th className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <SparklesIcon className="h-4 w-4" />
                      スコア
                    </div>
                  </th>
                  <th>担当者</th>
                  <th>最終活動</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {currentLeads.map((lead) => (
                  <tr key={lead.id} className="hover">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral-focus text-neutral-content rounded-full w-12">
                            <UserIcon className="h-6 w-6" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{lead.name}</div>
                          <div className="text-sm opacity-50">{lead.email}</div>
                          <div className="text-sm opacity-50">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-4 w-4 opacity-70" />
                        {lead.company}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline">{lead.source}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${statusColors[lead.status]} badge-sm`}
                      >
                        {statusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`text-2xl font-bold ${getScoreColor(lead.score)}`}
                        >
                          {lead.score}
                        </span>
                        <div className="flex flex-col items-center">
                          <ArrowUpIcon className="h-3 w-3 opacity-50" />
                          <div
                            className={`badge ${getScoreBadgeColor(lead.score)} badge-xs`}
                          >
                            {lead.score >= 80
                              ? "HOT"
                              : lead.score >= 60
                                ? "WARM"
                                : "COLD"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                          <div className="bg-primary text-primary-content rounded-full w-8">
                            <span className="text-xs">
                              {lead.assignedUser.charAt(0)}
                            </span>
                          </div>
                        </div>
                        {lead.assignedUser}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div>{lead.lastActivity}</div>
                        <div className="opacity-50">登録: {lead.createdAt}</div>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
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

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <p className="text-base-content/50">
                検索条件に一致するリードが見つかりません。
              </p>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
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
