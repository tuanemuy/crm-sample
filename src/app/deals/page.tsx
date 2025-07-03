import { DealList } from "@/components/deals/DealList";

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">商談管理</h1>
          <p className="text-base-content/70 mt-1">
            営業パイプラインと商談進捗を管理できます
          </p>
        </div>
      </div>

      <DealList />
    </div>
  );
}
