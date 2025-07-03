import { CustomerActions } from "@/components/customers/CustomerActions";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { CustomerList } from "@/components/customers/CustomerList";
import { CustomerSearch } from "@/components/customers/CustomerSearch";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">顧客管理</h1>
          <p className="text-base-content/70 mt-1">
            顧客情報を一覧表示し、管理できます
          </p>
        </div>
        <CustomerActions />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 space-y-4">
          <CustomerSearch />
          <CustomerFilters />
        </div>

        <div className="flex-1">
          <CustomerList />
        </div>
      </div>
    </div>
  );
}
