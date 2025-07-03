import { LeadList } from "@/components/leads/LeadList";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">リード管理</h1>
          <p className="text-base-content/70 mt-1">
            見込み客の情報とスコアリングを管理できます
          </p>
        </div>
      </div>

      <LeadList />
    </div>
  );
}
