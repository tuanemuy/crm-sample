"use client";

import {
  ArrowLeftIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface ScoringCategory {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  factors: ScoringFactor[];
}

interface ScoringFactor {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  rules: ScoringRule[];
}

interface ScoringRule {
  id: string;
  condition: string;
  score: number;
  description: string;
}

const mockScoringCategories: ScoringCategory[] = [
  {
    id: "basic-info",
    name: "基本情報",
    description: "リードの基本的な属性に基づく評価",
    maxScore: 25,
    factors: [
      {
        id: "company-size",
        name: "会社規模",
        description: "従業員数による評価",
        maxScore: 10,
        rules: [
          {
            id: "rule-1",
            condition: "従業員数 1000名以上",
            score: 10,
            description: "大企業",
          },
          {
            id: "rule-2",
            condition: "従業員数 100-999名",
            score: 7,
            description: "中企業",
          },
          {
            id: "rule-3",
            condition: "従業員数 10-99名",
            score: 4,
            description: "小企業",
          },
          {
            id: "rule-4",
            condition: "従業員数 10名未満",
            score: 1,
            description: "零細企業",
          },
        ],
      },
      {
        id: "industry",
        name: "業界適合性",
        description: "ターゲット業界との適合度",
        maxScore: 10,
        rules: [
          {
            id: "rule-5",
            condition: "IT・テクノロジー",
            score: 10,
            description: "最適業界",
          },
          {
            id: "rule-6",
            condition: "製造業",
            score: 8,
            description: "高適合",
          },
          {
            id: "rule-7",
            condition: "サービス業",
            score: 6,
            description: "中適合",
          },
          {
            id: "rule-8",
            condition: "その他",
            score: 3,
            description: "低適合",
          },
        ],
      },
      {
        id: "position",
        name: "役職",
        description: "決裁権限レベル",
        maxScore: 5,
        rules: [
          {
            id: "rule-9",
            condition: "経営層（CEO、CTO等）",
            score: 5,
            description: "最高決裁権",
          },
          {
            id: "rule-10",
            condition: "部長・マネージャー",
            score: 4,
            description: "部門決裁権",
          },
          {
            id: "rule-11",
            condition: "主任・リーダー",
            score: 2,
            description: "限定決裁権",
          },
          {
            id: "rule-12",
            condition: "一般社員",
            score: 1,
            description: "決裁権なし",
          },
        ],
      },
    ],
  },
  {
    id: "engagement",
    name: "エンゲージメント",
    description: "リードとの関係性の深さ",
    maxScore: 40,
    factors: [
      {
        id: "website-visit",
        name: "ウェブサイト訪問",
        description: "サイト活動による評価",
        maxScore: 15,
        rules: [
          {
            id: "rule-13",
            condition: "月10回以上訪問",
            score: 15,
            description: "高関心",
          },
          {
            id: "rule-14",
            condition: "月5-9回訪問",
            score: 10,
            description: "中関心",
          },
          {
            id: "rule-15",
            condition: "月1-4回訪問",
            score: 5,
            description: "低関心",
          },
          {
            id: "rule-16",
            condition: "訪問なし",
            score: 0,
            description: "関心なし",
          },
        ],
      },
      {
        id: "content-download",
        name: "資料ダウンロード",
        description: "コンテンツへの関心度",
        maxScore: 10,
        rules: [
          {
            id: "rule-17",
            condition: "ホワイトペーパーDL",
            score: 10,
            description: "高価値コンテンツ",
          },
          {
            id: "rule-18",
            condition: "事例資料DL",
            score: 7,
            description: "中価値コンテンツ",
          },
          {
            id: "rule-19",
            condition: "基本資料DL",
            score: 3,
            description: "低価値コンテンツ",
          },
        ],
      },
      {
        id: "email-response",
        name: "メール反応",
        description: "メールキャンペーンへの反応",
        maxScore: 10,
        rules: [
          {
            id: "rule-20",
            condition: "メール返信",
            score: 10,
            description: "直接反応",
          },
          {
            id: "rule-21",
            condition: "リンククリック",
            score: 5,
            description: "間接反応",
          },
          {
            id: "rule-22",
            condition: "メール開封のみ",
            score: 2,
            description: "最小反応",
          },
        ],
      },
      {
        id: "seminar",
        name: "セミナー参加",
        description: "イベントへの参加状況",
        maxScore: 5,
        rules: [
          {
            id: "rule-23",
            condition: "有料セミナー参加",
            score: 5,
            description: "高コミット",
          },
          {
            id: "rule-24",
            condition: "無料セミナー参加",
            score: 3,
            description: "中コミット",
          },
          {
            id: "rule-25",
            condition: "ウェビナー参加",
            score: 2,
            description: "低コミット",
          },
        ],
      },
    ],
  },
  {
    id: "purchase-intent",
    name: "購買意欲",
    description: "購入に向けた準備状況",
    maxScore: 30,
    factors: [
      {
        id: "budget",
        name: "予算確保状況",
        description: "購入予算の準備度",
        maxScore: 10,
        rules: [
          {
            id: "rule-26",
            condition: "予算確保済み",
            score: 10,
            description: "即座購入可能",
          },
          {
            id: "rule-27",
            condition: "予算検討中",
            score: 7,
            description: "短期購入可能",
          },
          {
            id: "rule-28",
            condition: "来期予算",
            score: 4,
            description: "中期購入可能",
          },
          {
            id: "rule-29",
            condition: "予算未定",
            score: 1,
            description: "購入困難",
          },
        ],
      },
      {
        id: "authority",
        name: "決裁権限",
        description: "購入決定権の有無",
        maxScore: 10,
        rules: [
          {
            id: "rule-30",
            condition: "最終決裁者",
            score: 10,
            description: "即決可能",
          },
          {
            id: "rule-31",
            condition: "影響力大",
            score: 7,
            description: "強い推薦力",
          },
          {
            id: "rule-32",
            condition: "影響力小",
            score: 4,
            description: "限定的影響力",
          },
          {
            id: "rule-33",
            condition: "影響力なし",
            score: 1,
            description: "決定関与なし",
          },
        ],
      },
      {
        id: "timeline",
        name: "導入時期",
        description: "導入スケジュールの明確さ",
        maxScore: 10,
        rules: [
          {
            id: "rule-34",
            condition: "3ヶ月以内",
            score: 10,
            description: "緊急ニーズ",
          },
          {
            id: "rule-35",
            condition: "6ヶ月以内",
            score: 7,
            description: "明確なスケジュール",
          },
          {
            id: "rule-36",
            condition: "1年以内",
            score: 4,
            description: "中期計画",
          },
          {
            id: "rule-37",
            condition: "時期未定",
            score: 1,
            description: "計画なし",
          },
        ],
      },
    ],
  },
  {
    id: "fit",
    name: "フィット度",
    description: "製品・サービスとの適合性",
    maxScore: 5,
    factors: [
      {
        id: "needs-fit",
        name: "ニーズ適合",
        description: "顧客ニーズとの適合度",
        maxScore: 5,
        rules: [
          {
            id: "rule-38",
            condition: "完全適合",
            score: 5,
            description: "ニーズ100%適合",
          },
          {
            id: "rule-39",
            condition: "高適合",
            score: 4,
            description: "ニーズ80%適合",
          },
          {
            id: "rule-40",
            condition: "中適合",
            score: 3,
            description: "ニーズ60%適合",
          },
          {
            id: "rule-41",
            condition: "低適合",
            score: 1,
            description: "ニーズ40%以下",
          },
        ],
      },
    ],
  },
];

export function LeadScoring() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingFactor, setEditingFactor] = useState<string | null>(null);

  const totalMaxScore = mockScoringCategories.reduce(
    (sum, category) => sum + category.maxScore,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads" className="btn btn-ghost btn-sm">
          <ArrowLeftIcon className="h-4 w-4" />
          リード管理に戻る
        </Link>
      </div>

      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <SparklesIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">総スコア</div>
          <div className="stat-value text-primary">{totalMaxScore}</div>
          <div className="stat-desc">最大獲得可能スコア</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-secondary">
            <ChartBarIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">評価カテゴリ</div>
          <div className="stat-value text-secondary">
            {mockScoringCategories.length}
          </div>
          <div className="stat-desc">設定済みカテゴリ数</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-accent">
            <Cog6ToothIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">評価要素</div>
          <div className="stat-value text-accent">
            {mockScoringCategories.reduce(
              (sum, cat) => sum + cat.factors.length,
              0,
            )}
          </div>
          <div className="stat-desc">設定済み要素数</div>
        </div>
      </div>

      <div className="space-y-4">
        {mockScoringCategories.map((category) => (
          <div key={category.id} className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div
                // biome-ignore lint/a11y/useSemanticElements: Complex accordion with nested buttons requires role="button" to avoid HTML spec violation
                role="button"
                tabIndex={0}
                className="flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setActiveCategory(
                    activeCategory === category.id ? null : category.id,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveCategory(
                      activeCategory === category.id ? null : category.id,
                    );
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm opacity-70">{category.description}</p>
                  </div>
                  <div className="badge badge-primary badge-lg">
                    最大 {category.maxScore}点
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-ghost btn-sm">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`btn btn-ghost btn-sm transition-transform ${
                      activeCategory === category.id ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </button>
                </div>
              </div>

              {activeCategory === category.id && (
                <div className="mt-6 space-y-4">
                  {category.factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="border border-base-300 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{factor.name}</h4>
                          <p className="text-sm opacity-70">
                            {factor.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-outline">
                            最大 {factor.maxScore}点
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() =>
                              setEditingFactor(
                                editingFactor === factor.id ? null : factor.id,
                              )
                            }
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {factor.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-center justify-between bg-base-200 p-3 rounded"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {rule.condition}
                              </div>
                              <div className="text-xs opacity-70">
                                {rule.description}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="badge badge-primary badge-sm">
                                {rule.score}点
                              </span>
                              {editingFactor === factor.id && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {editingFactor === factor.id && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm w-full"
                          >
                            <PlusIcon className="h-4 w-4" />
                            新しいルールを追加
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button type="button" className="btn btn-outline btn-sm">
                    <PlusIcon className="h-4 w-4" />
                    新しい評価要素を追加
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="btn btn-outline">
          <PlusIcon className="h-4 w-4" />
          新しいカテゴリを追加
        </button>
        <button type="button" className="btn btn-primary">
          設定を保存
        </button>
      </div>
    </div>
  );
}
