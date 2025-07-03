"use client";

import {
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  industry: string;
  size: string;
  status: "active" | "inactive" | "archived";
  assignedUser: string;
  contactPerson: string;
  email: string;
  phone: string;
  lastContact: string;
  createdAt: string;
}

function getStatusBadge(status: Customer["status"]) {
  switch (status) {
    case "active":
      return "badge badge-success";
    case "inactive":
      return "badge badge-warning";
    case "archived":
      return "badge badge-neutral";
    default:
      return "badge badge-neutral";
  }
}

function getStatusLabel(status: Customer["status"]) {
  switch (status) {
    case "active":
      return "アクティブ";
    case "inactive":
      return "非アクティブ";
    case "archived":
      return "アーカイブ";
    default:
      return "不明";
  }
}

function getSizeLabel(size: string) {
  const sizeMap: Record<string, string> = {
    startup: "スタートアップ",
    small: "中小企業",
    medium: "中企業",
    large: "大企業",
    enterprise: "エンタープライズ",
  };
  return sizeMap[size] || size;
}

function getIndustryLabel(industry: string) {
  const industryMap: Record<string, string> = {
    technology: "テクノロジー",
    finance: "金融",
    healthcare: "ヘルスケア",
    manufacturing: "製造業",
    retail: "小売",
    other: "その他",
  };
  return industryMap[industry] || industry;
}

export function CustomerList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "lastContact">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // サンプルデータ
  const customers: Customer[] = [
    {
      id: "1",
      name: "株式会社テックソリューションズ",
      industry: "technology",
      size: "medium",
      status: "active",
      assignedUser: "田中太郎",
      contactPerson: "山田花子",
      email: "yamada@techsolutions.co.jp",
      phone: "03-1234-5678",
      lastContact: "2025-01-15",
      createdAt: "2024-12-01",
    },
    {
      id: "2",
      name: "グローバルイノベーション株式会社",
      industry: "finance",
      size: "large",
      status: "active",
      assignedUser: "佐藤花子",
      contactPerson: "佐々木健一",
      email: "sasaki@global-innovation.com",
      phone: "03-2345-6789",
      lastContact: "2025-01-10",
      createdAt: "2024-11-15",
    },
    {
      id: "3",
      name: "デジタルプラットフォーム株式会社",
      industry: "technology",
      size: "startup",
      status: "inactive",
      assignedUser: "鈴木一郎",
      contactPerson: "高橋美紀",
      email: "takahashi@digital-platform.jp",
      phone: "03-3456-7890",
      lastContact: "2024-12-20",
      createdAt: "2024-10-30",
    },
    {
      id: "4",
      name: "株式会社スマートシステムズ",
      industry: "manufacturing",
      size: "large",
      status: "active",
      assignedUser: "高橋美理",
      contactPerson: "中村英三",
      email: "nakamura@smart-systems.co.jp",
      phone: "03-4567-8901",
      lastContact: "2025-01-12",
      createdAt: "2024-09-10",
    },
    {
      id: "5",
      name: "アドバンスドテクノロジー株式会社",
      industry: "technology",
      size: "enterprise",
      status: "archived",
      assignedUser: "山田健太",
      contactPerson: "伊藤美智子",
      email: "ito@advanced-tech.co.jp",
      phone: "03-5678-9012",
      lastContact: "2024-11-30",
      createdAt: "2024-08-15",
    },
  ];

  const itemsPerPage = 10;
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = customers.slice(startIndex, endIndex);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 font-semibold"
                  >
                    会社名
                    {sortBy === "name" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>業界</th>
                <th>規模</th>
                <th>ステータス</th>
                <th>担当者</th>
                <th>連絡先</th>
                <th>
                  <button
                    onClick={() => handleSort("lastContact")}
                    className="flex items-center gap-1 font-semibold"
                  >
                    最終コンタクト
                    {sortBy === "lastContact" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map((customer) => (
                <tr key={customer.id} className="hover">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-12">
                          <BuildingOfficeIcon className="h-6 w-6" />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{customer.name}</div>
                        <div className="text-sm opacity-50">
                          {customer.contactPerson}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-outline">
                      {getIndustryLabel(customer.industry)}
                    </span>
                  </td>
                  <td>{getSizeLabel(customer.size)}</td>
                  <td>
                    <span className={getStatusBadge(customer.status)}>
                      {getStatusLabel(customer.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      {customer.assignedUser}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div>{customer.email}</div>
                      <div className="opacity-50">{customer.phone}</div>
                    </div>
                  </td>
                  <td>{customer.lastContact}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link href={`/customers/${customer.id}`}>
                        <button className="btn btn-ghost btn-xs">
                          <EyeIcon className="h-3 w-3" />
                        </button>
                      </Link>
                      <Link href={`/customers/${customer.id}/edit`}>
                        <button className="btn btn-ghost btn-xs">
                          <PencilIcon className="h-3 w-3" />
                        </button>
                      </Link>
                      <button className="btn btn-ghost btn-xs text-error">
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-base-content/70">
            {startIndex + 1}-{Math.min(endIndex, customers.length)} /{" "}
            {customers.length}件
          </div>

          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`join-item btn btn-sm ${
                  currentPage === page ? "btn-active" : ""
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
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
