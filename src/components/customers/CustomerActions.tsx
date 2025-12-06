import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export function CustomerActions() {
  return (
    <div className="flex gap-2">
      <button type="button" className="btn btn-ghost btn-sm gap-2">
        <ArrowUpTrayIcon className="h-4 w-4" />
        インポート
      </button>

      <button type="button" className="btn btn-ghost btn-sm gap-2">
        <ArrowDownTrayIcon className="h-4 w-4" />
        エクスポート
      </button>

      <Link href="/customers/new">
        <button type="button" className="btn btn-primary btn-sm gap-2">
          <PlusIcon className="h-4 w-4" />
          新規顧客
        </button>
      </Link>
    </div>
  );
}
