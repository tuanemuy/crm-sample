import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { CustomerDetail } from "@/components/customers/CustomerDetail";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <button className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
            一覧に戻る
          </button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-base-content">顧客詳細</h1>
          <p className="text-base-content/70 mt-1">
            顧客の詳細情報と関連データを表示します
          </p>
        </div>
      </div>

      <CustomerDetail customerId={id} />
    </div>
  );
}
