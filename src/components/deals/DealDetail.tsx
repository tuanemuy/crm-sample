"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface DealDetailProps {
  dealId: string;
}

interface Deal {
  id: string;
  title: string;
  description: string;
  customer: {
    id: string;
    name: string;
    industry: string;
    contact: {
      name: string;
      email: string;
      phone: string;
    };
  };
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
  actualCloseDate?: string;
  assignedUser: string;
  source: string;
  competitors: string[];
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
  lastActivity: string;
  notes: string;
}

interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "proposal";
  title: string;
  description: string;
  user: string;
  timestamp: string;
  nextAction?: string;
}

const mockDeal: Deal = {
  id: "deal-001",
  title: "CRMシステム導入プロジェクト",
  description:
    "営業チーム向けの包括的なCRMシステム導入。顧客管理、商談管理、レポート機能を含む統合ソリューション。",
  customer: {
    id: "customer-001",
    name: "株式会社テクノロジー",
    industry: "IT・ソフトウェア",
    contact: {
      name: "佐藤 太郎",
      email: "sato@technology.jp",
      phone: "03-1234-5678",
    },
  },
  amount: 5000000,
  stage: "proposal",
  probability: 75,
  expectedCloseDate: "2025-08-15",
  assignedUser: "田中営業",
  source: "ウェブサイト問い合わせ",
  competitors: ["Salesforce", "HubSpot"],
  products: [
    { name: "CRMベーシック", quantity: 50, unitPrice: 60000 },
    { name: "カスタマイズ開発", quantity: 1, unitPrice: 2000000 },
  ],
  createdAt: "2025-06-01",
  lastActivity: "2025-07-02",
  notes: "決裁者は来月まで出張予定。8月上旬に最終プレゼンテーション実施予定。",
};

const mockActivities: Activity[] = [
  {
    id: "activity-001",
    type: "proposal",
    title: "正式提案書提出",
    description:
      "カスタマイズ要件を含む詳細な提案書を提出。技術仕様と導入スケジュールを説明。",
    user: "田中営業",
    timestamp: "2025-07-02 15:00",
    nextAction: "8月5日に最終プレゼンテーション予定",
  },
  {
    id: "activity-002",
    type: "meeting",
    title: "要件ヒアリング会議",
    description:
      "IT部門および営業部門の責任者と要件について詳細打ち合わせ。カスタマイズ範囲を確定。",
    user: "田中営業",
    timestamp: "2025-06-28 14:00",
  },
  {
    id: "activity-003",
    type: "call",
    title: "予算確認",
    description:
      "予算枠と承認プロセスについて確認。来期予算で対応可能との回答。",
    user: "田中営業",
    timestamp: "2025-06-25 10:30",
  },
  {
    id: "activity-004",
    type: "email",
    title: "デモ動画送付",
    description: "システムの主要機能を説明するデモ動画とカタログを送付。",
    user: "田中営業",
    timestamp: "2025-06-20 16:45",
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

const activityIcons = {
  call: PhoneIcon,
  email: EnvelopeIcon,
  meeting: CalendarIcon,
  note: DocumentTextIcon,
  proposal: BriefcaseIcon,
};

const stages = [
  "lead",
  "prospect",
  "proposal",
  "negotiation",
  "closing",
  "won",
];

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

export function DealDetail({ dealId: _dealId }: DealDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "activities" | "products"
  >("overview");

  const currentStageIndex = stages.indexOf(mockDeal.stage);
  const totalAmount = mockDeal.products.reduce(
    (sum, product) => sum + product.quantity * product.unitPrice,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/deals" className="btn btn-ghost btn-sm">
          <ArrowLeftIcon className="h-4 w-4" />
          商談一覧に戻る
        </Link>
        <div className="divider divider-horizontal" />
        <h1 className="text-3xl font-bold text-base-content">
          {mockDeal.title}
        </h1>
        <div className={`badge ${stageColors[mockDeal.stage]} badge-lg`}>
          {stageLabels[mockDeal.stage]}
        </div>
      </div>

      {/* ステージ進捗 */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title mb-4">営業ステージ</h2>
          <div className="steps steps-horizontal w-full">
            {stages.slice(0, -1).map((stage, index) => (
              <div
                key={stage}
                className={`step ${index <= currentStageIndex ? "step-primary" : ""}`}
              >
                {stageLabels[stage as keyof typeof stageLabels]}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4">
              <span
                className={`text-2xl font-bold ${getProbabilityColor(mockDeal.probability)}`}
              >
                {mockDeal.probability}%
              </span>
              <progress
                className="progress progress-primary w-32"
                value={mockDeal.probability}
                max={100}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-outline btn-sm">
                <ArrowLeftIcon className="h-4 w-4" />
                ステージを戻す
              </button>
              <button type="button" className="btn btn-primary btn-sm">
                <ArrowRightIcon className="h-4 w-4" />
                ステージを進める
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h2 className="card-title">基本情報</h2>
                <button type="button" className="btn btn-ghost btn-sm">
                  <PencilIcon className="h-4 w-4" />
                  編集
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">商談概要</h3>
                    <p className="text-sm bg-base-200 p-3 rounded-lg">
                      {mockDeal.description}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <BuildingOfficeIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <div className="font-medium">
                        {mockDeal.customer.name}
                      </div>
                      <div className="text-sm opacity-70">
                        {mockDeal.customer.industry}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <UserIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <div className="font-medium">
                        {mockDeal.customer.contact.name}
                      </div>
                      <div className="text-sm opacity-70">担当者</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <BanknotesIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <div className="text-2xl font-bold text-success">
                        {formatCurrency(mockDeal.amount)}
                      </div>
                      <div className="text-sm opacity-70">商談金額</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <div className="font-medium">
                        {mockDeal.expectedCloseDate}
                      </div>
                      <div className="text-sm opacity-70">クローズ予定日</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <span className="badge badge-outline">
                        {mockDeal.source}
                      </span>
                      <div className="text-sm opacity-70 mt-1">
                        獲得チャネル
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {mockDeal.competitors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">競合他社</h3>
                  <div className="flex gap-2">
                    {mockDeal.competitors.map((competitor) => (
                      <span
                        key={competitor}
                        className="badge badge-error badge-outline"
                      >
                        {competitor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mockDeal.notes && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">メモ</h3>
                  <p className="text-sm bg-base-200 p-3 rounded-lg">
                    {mockDeal.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="tabs tabs-bordered">
                <button
                  type="button"
                  className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  概要
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === "products" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("products")}
                >
                  商品・サービス
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === "activities" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("activities")}
                >
                  営業活動履歴
                </button>
              </div>

              <div className="mt-6">
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <div className="stats shadow">
                      <div className="stat">
                        <div className="stat-title">担当営業</div>
                        <div className="stat-value text-lg">
                          {mockDeal.assignedUser}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">最終活動</div>
                        <div className="stat-value text-lg">
                          {mockDeal.lastActivity}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">登録日</div>
                        <div className="stat-value text-lg">
                          {mockDeal.createdAt}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "products" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>商品・サービス名</th>
                            <th>数量</th>
                            <th>単価</th>
                            <th>金額</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockDeal.products.map((product) => (
                            <tr key={product.name}>
                              <td className="font-medium">{product.name}</td>
                              <td>{product.quantity}</td>
                              <td>{formatCurrency(product.unitPrice)}</td>
                              <td className="font-bold">
                                {formatCurrency(
                                  product.quantity * product.unitPrice,
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th colSpan={3}>合計</th>
                            <th className="text-success text-lg">
                              {formatCurrency(totalAmount)}
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "activities" && (
                  <div className="space-y-4">
                    {mockActivities.map((activity) => {
                      const IconComponent = activityIcons[activity.type];
                      return (
                        <div
                          key={activity.id}
                          className="flex gap-4 p-4 bg-base-200 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium">{activity.title}</h4>
                              <span className="text-sm opacity-70">
                                {activity.timestamp}
                              </span>
                            </div>
                            <p className="text-sm opacity-80 mb-2">
                              {activity.description}
                            </p>
                            {activity.nextAction && (
                              <div className="alert alert-info alert-sm">
                                <span className="text-xs">
                                  次のアクション: {activity.nextAction}
                                </span>
                              </div>
                            )}
                            <div className="text-xs opacity-60 mt-2">
                              担当: {activity.user}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="text-center pt-4">
                      <button type="button" className="btn btn-outline btn-sm">
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        新規活動を追加
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">連絡先情報</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 opacity-70" />
                  <div>
                    <div className="font-medium">
                      {mockDeal.customer.contact.name}
                    </div>
                    <div className="text-sm opacity-70">担当者</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 opacity-70" />
                  <a
                    href={`mailto:${mockDeal.customer.contact.email}`}
                    className="link"
                  >
                    {mockDeal.customer.contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 opacity-70" />
                  <a
                    href={`tel:${mockDeal.customer.contact.phone}`}
                    className="link"
                  >
                    {mockDeal.customer.contact.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">クイックアクション</h2>
              <div className="space-y-2">
                <button type="button" className="btn btn-primary btn-sm w-full">
                  <PhoneIcon className="h-4 w-4" />
                  電話をかける
                </button>
                <button type="button" className="btn btn-outline btn-sm w-full">
                  <EnvelopeIcon className="h-4 w-4" />
                  メールを送る
                </button>
                <button type="button" className="btn btn-outline btn-sm w-full">
                  <CalendarIcon className="h-4 w-4" />
                  ミーティング予約
                </button>
                <button type="button" className="btn btn-outline btn-sm w-full">
                  <DocumentTextIcon className="h-4 w-4" />
                  提案書作成
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
