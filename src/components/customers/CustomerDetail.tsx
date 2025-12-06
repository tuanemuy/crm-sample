"use client";

import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface CustomerDetailProps {
  customerId: string;
}

interface Customer {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  foundedYear: number;
  website: string;
  description: string;
  contactPerson: {
    name: string;
    title: string;
    email: string;
    phone: string;
    department: string;
  };
  assignedUser: string;
  status: "active" | "inactive" | "archived";
  createdAt: string;
  updatedAt: string;
}

interface Deal {
  id: string;
  title: string;
  amount: number;
  stage: string;
  probability: number;
  expectedCloseDate: string;
  status: "active" | "closed_won" | "closed_lost";
}

interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "document";
  title: string;
  description: string;
  date: string;
  user: string;
}

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "deals" | "activities" | "documents"
  >("overview");

  // サンプルデータ
  const customer: Customer = {
    id: customerId,
    name: "株式会社テックソリューションズ",
    industry: "technology",
    size: "medium",
    location: "東京都渋谷区",
    foundedYear: 2020,
    website: "https://techsolutions.co.jp",
    description:
      "最新技術を活用したソリューション開発を行うIT企業です。特にAIやIoTの分野での実績が豊富で、企業向けのデジタルトランスフォーメーション支援を主力事業としています。",
    contactPerson: {
      name: "山田花子",
      title: "営業部長",
      email: "yamada@techsolutions.co.jp",
      phone: "03-1234-5678",
      department: "営業部",
    },
    assignedUser: "田中太郎",
    status: "active",
    createdAt: "2024-12-01",
    updatedAt: "2025-01-15",
  };

  const deals: Deal[] = [
    {
      id: "1",
      title: "デジタルプラットフォーム導入",
      amount: 5000000,
      stage: "提案",
      probability: 75,
      expectedCloseDate: "2025-03-31",
      status: "active",
    },
    {
      id: "2",
      title: "AIソリューションコンサルティング",
      amount: 2000000,
      stage: "初回接触",
      probability: 30,
      expectedCloseDate: "2025-05-15",
      status: "active",
    },
  ];

  const activities: Activity[] = [
    {
      id: "1",
      type: "meeting",
      title: "四半期予算ミーティング",
      description:
        "2025年度の予算計画とプロジェクトの優先度について話し合いました。",
      date: "2025-01-15 09:00",
      user: "田中太郎",
    },
    {
      id: "2",
      type: "email",
      title: "提案書送付",
      description:
        "デジタルプラットフォーム導入に関する詳細な提案書を送付しました。",
      date: "2025-01-10 14:30",
      user: "田中太郎",
    },
    {
      id: "3",
      type: "call",
      title: "フォローアップ電話",
      description:
        "前回のミーティングのフォローアップと、追加資料の共有を行いました。",
      date: "2025-01-08 16:00",
      user: "田中太郎",
    },
  ];

  const getStatusBadge = (status: Customer["status"]) => {
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
  };

  const getStatusLabel = (status: Customer["status"]) => {
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
  };

  const getSizeLabel = (size: string) => {
    const sizeMap: Record<string, string> = {
      startup: "スタートアップ",
      small: "中小企業",
      medium: "中企業",
      large: "大企業",
      enterprise: "エンタープライズ",
    };
    return sizeMap[size] || size;
  };

  const getIndustryLabel = (industry: string) => {
    const industryMap: Record<string, string> = {
      technology: "テクノロジー",
      finance: "金融",
      healthcare: "ヘルスケア",
      manufacturing: "製造業",
      retail: "小売",
      other: "その他",
    };
    return industryMap[industry] || industry;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダーアクション */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-lg w-16">
              <BuildingOfficeIcon className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-base-content">
              {customer.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={getStatusBadge(customer.status)}>
                {getStatusLabel(customer.status)}
              </span>
              <span className="text-base-content/70">
                {getIndustryLabel(customer.industry)} ・{" "}
                {getSizeLabel(customer.size)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/customers/${customerId}/edit`}>
            <button type="button" className="btn btn-primary btn-sm gap-2">
              <PencilIcon className="h-4 w-4" />
              編集
            </button>
          </Link>
          <button
            type="button"
            className="btn btn-error btn-outline btn-sm gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            削除
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="tabs tabs-lifted">
        <button
          type="button"
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          概要
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "deals" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("deals")}
        >
          商談 ({deals.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "activities" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("activities")}
        >
          活動履歴 ({activities.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "documents" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          ドキュメント
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 企業情報 */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-base-content flex items-center gap-2">
                  <BuildingOfficeIcon className="h-5 w-5" />
                  企業情報
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-base-content/70">業界</span>
                      <p className="font-medium">
                        {getIndustryLabel(customer.industry)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-base-content/70">
                        企業規模
                      </span>
                      <p className="font-medium">
                        {getSizeLabel(customer.size)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-base-content/70 flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        所在地
                      </span>
                      <p className="font-medium">{customer.location}</p>
                    </div>
                    <div>
                      <span className="text-sm text-base-content/70 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        設立年
                      </span>
                      <p className="font-medium">{customer.foundedYear}年</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-base-content/70 flex items-center gap-1">
                      <GlobeAltIcon className="h-3 w-3" />
                      ウェブサイト
                    </span>
                    <a
                      href={customer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      {customer.website}
                    </a>
                  </div>

                  <div>
                    <span className="text-sm text-base-content/70 flex items-center gap-1">
                      <DocumentTextIcon className="h-3 w-3" />
                      企業説明
                    </span>
                    <p className="text-sm mt-1">{customer.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 担当者情報 */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-base-content flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  担当者情報
                </h3>

                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-base-content/70">
                      担当者名
                    </span>
                    <p className="font-medium">{customer.contactPerson.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-base-content/70">役職</span>
                      <p className="font-medium">
                        {customer.contactPerson.title}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-base-content/70">部署</span>
                      <p className="font-medium">
                        {customer.contactPerson.department}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-base-content/70 flex items-center gap-1">
                      <EnvelopeIcon className="h-3 w-3" />
                      メールアドレス
                    </span>
                    <a
                      href={`mailto:${customer.contactPerson.email}`}
                      className="link link-primary"
                    >
                      {customer.contactPerson.email}
                    </a>
                  </div>

                  <div>
                    <span className="text-sm text-base-content/70 flex items-center gap-1">
                      <PhoneIcon className="h-3 w-3" />
                      電話番号
                    </span>
                    <a
                      href={`tel:${customer.contactPerson.phone}`}
                      className="link link-primary"
                    >
                      {customer.contactPerson.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-sm text-base-content/70">担当者</span>
                    <p className="font-medium">{customer.assignedUser}</p>
                  </div>
                </div>

                <div className="card-actions mt-4">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-block gap-2"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    コンタクトを追加
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "deals" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">関連商談</h3>
              <button type="button" className="btn btn-primary btn-sm gap-2">
                <PlusIcon className="h-4 w-4" />
                新規商談
              </button>
            </div>

            <div className="space-y-4">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="card bg-base-100 shadow-sm border border-base-300"
                >
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base-content flex items-center gap-2">
                          <BriefcaseIcon className="h-4 w-4" />
                          {deal.title}
                        </h4>
                        <p className="text-sm text-base-content/70 mt-1">
                          ステージ: {deal.stage} ・ 確度: {deal.probability}%
                        </p>
                        <p className="text-sm text-base-content/70">
                          予定終了日: {deal.expectedCloseDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatCurrency(deal.amount)}
                        </p>
                        <span className="badge badge-primary">
                          {deal.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">活動履歴</h3>
              <button type="button" className="btn btn-primary btn-sm gap-2">
                <PlusIcon className="h-4 w-4" />
                活動を追加
              </button>
            </div>

            <div className="timeline timeline-vertical">
              {activities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="timeline-start timeline-box">
                    <div className="text-xs text-base-content/70">
                      {activity.date}
                    </div>
                    <div className="font-semibold">{activity.title}</div>
                    <div className="text-sm text-base-content/70 mt-1">
                      {activity.description}
                    </div>
                    <div className="text-xs text-base-content/50 mt-2">
                      担当: {activity.user}
                    </div>
                  </div>
                  <div className="timeline-middle">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                  </div>
                  {index < activities.length - 1 && <hr />}
                </li>
              ))}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">ドキュメント</h3>
              <button type="button" className="btn btn-primary btn-sm gap-2">
                <DocumentDuplicateIcon className="h-4 w-4" />
                アップロード
              </button>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body text-center py-12">
                <DocumentDuplicateIcon className="h-12 w-12 mx-auto text-base-content/30" />
                <p className="text-base-content/70 mt-4">
                  ドキュメントがまだアップロードされていません
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm mt-4 gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  最初のドキュメントをアップロード
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
