"use client";

import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  SparklesIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface LeadDetailProps {
  leadId: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  address: string;
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
  notes: string;
}

interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note";
  title: string;
  description: string;
  user: string;
  timestamp: string;
}

interface ScoreDetail {
  category: string;
  score: number;
  maxScore: number;
  factors: Array<{
    name: string;
    score: number;
    maxScore: number;
  }>;
}

const mockLead: Lead = {
  id: "lead-001",
  name: "佐藤 太郎",
  company: "株式会社テクノロジー",
  position: "ITマネージャー",
  email: "sato@technology.jp",
  phone: "03-1234-5678",
  address: "東京都渋谷区1-2-3",
  source: "ウェブサイト",
  status: "qualified",
  score: 85,
  assignedUser: "田中営業",
  lastActivity: "2025-07-02",
  createdAt: "2025-06-28",
  notes: "IT導入を検討している。予算は来期に確保予定。",
};

const mockActivities: Activity[] = [
  {
    id: "activity-001",
    type: "call",
    title: "初回ヒアリング",
    description: "導入要件と予算について確認。関心度高い。",
    user: "田中営業",
    timestamp: "2025-07-02 14:30",
  },
  {
    id: "activity-002",
    type: "email",
    title: "資料送付",
    description: "サービス紹介資料とデモ動画を送付。",
    user: "田中営業",
    timestamp: "2025-07-01 16:45",
  },
  {
    id: "activity-003",
    type: "meeting",
    title: "Webミーティング予約",
    description: "来週の木曜日にデモンストレーション実施予定。",
    user: "田中営業",
    timestamp: "2025-06-30 10:15",
  },
];

const mockScoreDetails: ScoreDetail[] = [
  {
    category: "基本情報",
    score: 20,
    maxScore: 25,
    factors: [
      { name: "会社規模", score: 8, maxScore: 10 },
      { name: "業界適合性", score: 7, maxScore: 10 },
      { name: "役職", score: 5, maxScore: 5 },
    ],
  },
  {
    category: "エンゲージメント",
    score: 35,
    maxScore: 40,
    factors: [
      { name: "ウェブサイト訪問", score: 12, maxScore: 15 },
      { name: "資料ダウンロード", score: 8, maxScore: 10 },
      { name: "メール反応", score: 10, maxScore: 10 },
      { name: "セミナー参加", score: 5, maxScore: 5 },
    ],
  },
  {
    category: "購買意欲",
    score: 25,
    maxScore: 30,
    factors: [
      { name: "予算確保状況", score: 8, maxScore: 10 },
      { name: "決裁権限", score: 7, maxScore: 10 },
      { name: "導入時期", score: 10, maxScore: 10 },
    ],
  },
  {
    category: "フィット度",
    score: 5,
    maxScore: 5,
    factors: [{ name: "ニーズ適合", score: 5, maxScore: 5 }],
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

const activityIcons = {
  call: PhoneIcon,
  email: EnvelopeIcon,
  meeting: CalendarIcon,
  note: DocumentTextIcon,
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
};

export function LeadDetail({ leadId }: LeadDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "scoring" | "activities"
  >("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads" className="btn btn-ghost btn-sm">
          <ArrowLeftIcon className="h-4 w-4" />
          リード一覧に戻る
        </Link>
        <div className="divider divider-horizontal" />
        <h1 className="text-3xl font-bold text-base-content">
          {mockLead.name}
        </h1>
        <div className={`badge ${statusColors[mockLead.status]} badge-lg`}>
          {statusLabels[mockLead.status]}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <UserIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <div className="font-medium">{mockLead.name}</div>
                      <div className="text-sm opacity-70">
                        {mockLead.position}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BuildingOfficeIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <div className="font-medium">{mockLead.company}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <EnvelopeIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <a href={`mailto:${mockLead.email}`} className="link">
                        {mockLead.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <a href={`tel:${mockLead.phone}`} className="link">
                        {mockLead.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>{mockLead.address}</div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ChartBarIcon className="h-5 w-5 mt-1 opacity-70" />
                    <div>
                      <span className="badge badge-outline">
                        {mockLead.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {mockLead.notes && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">メモ</h3>
                  <p className="text-sm bg-base-200 p-3 rounded-lg">
                    {mockLead.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="tabs tabs-bordered">
                <a
                  className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  概要
                </a>
                <a
                  className={`tab ${activeTab === "scoring" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("scoring")}
                >
                  スコアリング詳細
                </a>
                <a
                  className={`tab ${activeTab === "activities" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("activities")}
                >
                  営業活動履歴
                </a>
              </div>

              <div className="mt-6">
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <div className="stats shadow">
                      <div className="stat">
                        <div className="stat-title">担当営業</div>
                        <div className="stat-value text-lg">
                          {mockLead.assignedUser}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">最終活動</div>
                        <div className="stat-value text-lg">
                          {mockLead.lastActivity}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">登録日</div>
                        <div className="stat-value text-lg">
                          {mockLead.createdAt}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "scoring" && (
                  <div className="space-y-6">
                    {mockScoreDetails.map((category, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            {category.category}
                          </h3>
                          <div className="text-right">
                            <span className="text-2xl font-bold">
                              {category.score}
                            </span>
                            <span className="text-base-content/70">
                              /{category.maxScore}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {category.factors.map((factor, factorIndex) => (
                            <div
                              key={factorIndex}
                              className="flex items-center gap-3"
                            >
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm">{factor.name}</span>
                                  <span className="text-sm">
                                    {factor.score}/{factor.maxScore}
                                  </span>
                                </div>
                                <progress
                                  className="progress progress-primary w-full"
                                  value={factor.score}
                                  max={factor.maxScore}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {index < mockScoreDetails.length - 1 && (
                          <div className="divider" />
                        )}
                      </div>
                    ))}
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
                            <div className="text-xs opacity-60">
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
            <div className="card-body text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <SparklesIcon className="h-6 w-6 text-primary" />
                <h2 className="card-title">リードスコア</h2>
              </div>
              <div
                className={`text-4xl font-bold ${getScoreColor(mockLead.score)}`}
              >
                {mockLead.score}
              </div>
              <div className="text-sm opacity-70">/ 100点</div>
              <progress
                className="progress progress-primary w-full mt-4"
                value={mockLead.score}
                max={100}
              />
              <div className="text-sm mt-2">
                {mockLead.score >= 80 ? (
                  <span className="badge badge-success">HOT LEAD</span>
                ) : mockLead.score >= 60 ? (
                  <span className="badge badge-warning">WARM LEAD</span>
                ) : (
                  <span className="badge badge-error">COLD LEAD</span>
                )}
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
                  <UserIcon className="h-4 w-4" />
                  顧客に変換
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
