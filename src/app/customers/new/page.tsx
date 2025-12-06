import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <button type="button" className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
            戻る
          </button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-base-content">新規顧客登録</h1>
          <p className="text-base-content/70 mt-1">
            新しい顧客情報を登録します
          </p>
        </div>
      </div>

      <CustomerForm mode="create" />
    </div>
  );
}
