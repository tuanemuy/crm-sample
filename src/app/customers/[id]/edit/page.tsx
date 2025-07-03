import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { CustomerForm } from "@/components/customers/CustomerForm";

interface CustomerEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerEditPage({
  params,
}: CustomerEditPageProps) {
  const { id } = await params;

  // TODO: 顧客データを取得
  const customerData = {
    name: "株式会社テックソリューションズ",
    industry: "technology",
    size: "medium",
    location: "東京都渋谷区",
    foundedYear: "2020",
    website: "https://techsolutions.co.jp",
    description: "最新技術を活用したソリューション開発を行うIT企業です。",
    contactPerson: {
      name: "山田花子",
      title: "営業部長",
      email: "yamada@techsolutions.co.jp",
      phone: "03-1234-5678",
      department: "営業部",
    },
    assignedUserId: "user1",
    parentCustomerId: "",
    status: "active" as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/customers/${id}`}>
          <button className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
            戻る
          </button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-base-content">顧客編集</h1>
          <p className="text-base-content/70 mt-1">顧客情報を編集します</p>
        </div>
      </div>

      <CustomerForm mode="edit" initialData={customerData} customerId={id} />
    </div>
  );
}
