import { LeadScoring } from "@/components/leads/LeadScoring";

export default function LeadScoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">
          リードスコアリング設定
        </h1>
        <p className="text-base-content/70 mt-1">
          リードの評価基準とスコア配分を設定・管理できます
        </p>
      </div>

      <LeadScoring />
    </div>
  );
}
