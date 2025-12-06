"use client";

import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export function DataManagement() {
  const backupHistory = [
    {
      id: "1",
      date: "2025-01-15T02:00:00",
      type: "full",
      size: "245MB",
      status: "completed",
    },
    {
      id: "2",
      date: "2025-01-14T02:00:00",
      type: "incremental",
      size: "12MB",
      status: "completed",
    },
    {
      id: "3",
      date: "2025-01-13T02:00:00",
      type: "incremental",
      size: "8MB",
      status: "completed",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP");
  };

  const getBackupTypeLabel = (type: string) => {
    return type === "full" ? "フル" : "差分";
  };

  return (
    <div
      id="data"
      className="card bg-base-100 shadow-sm border border-base-300"
    >
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DocumentArrowDownIcon className="h-5 w-5" />
          データ管理
        </h3>

        <div className="space-y-6">
          {/* データエクスポート */}
          <div className="border border-base-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">データエクスポート</h4>
            <p className="text-sm text-base-content/70 mb-4">
              システム内のデータを様々な形式でエクスポートできます。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button type="button" className="btn btn-outline">
                <ArrowDownTrayIcon className="h-4 w-4" />
                顧客データ (CSV)
              </button>
              <button type="button" className="btn btn-outline">
                <ArrowDownTrayIcon className="h-4 w-4" />
                営業活動 (CSV)
              </button>
              <button type="button" className="btn btn-outline">
                <ArrowDownTrayIcon className="h-4 w-4" />
                売上データ (Excel)
              </button>
              <button type="button" className="btn btn-outline">
                <ArrowDownTrayIcon className="h-4 w-4" />
                全データ (ZIP)
              </button>
            </div>
          </div>

          {/* データインポート */}
          <div className="border border-base-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">データインポート</h4>
            <p className="text-sm text-base-content/70 mb-4">
              CSVファイルから既存システムのデータをインポートできます。
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="import-type" className="label">
                  インポートタイプ
                </label>
                <select
                  id="import-type"
                  className="select select-bordered w-full max-w-xs"
                >
                  <option>顧客データ</option>
                  <option>営業活動</option>
                  <option>商談データ</option>
                  <option>リードデータ</option>
                </select>
              </div>

              <div>
                <label htmlFor="file-input" className="label">
                  ファイル選択
                </label>
                <input
                  id="file-input"
                  type="file"
                  className="file-input file-input-bordered w-full max-w-xs"
                />
              </div>

              <button type="button" className="btn btn-primary">
                <ArrowUpTrayIcon className="h-4 w-4" />
                インポート実行
              </button>
            </div>
          </div>

          {/* バックアップ */}
          <div className="border border-base-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">バックアップ</h4>

            <div className="flex gap-3 mb-4">
              <button type="button" className="btn btn-outline">
                <DocumentArrowDownIcon className="h-4 w-4" />
                今すぐバックアップ
              </button>
              <button type="button" className="btn btn-ghost">
                バックアップ設定
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>日時</th>
                    <th>タイプ</th>
                    <th>サイズ</th>
                    <th>ステータス</th>
                    <th>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {backupHistory.map((backup) => (
                    <tr key={backup.id}>
                      <td>{formatDate(backup.date)}</td>
                      <td>{getBackupTypeLabel(backup.type)}</td>
                      <td>{backup.size}</td>
                      <td>
                        <span className="badge badge-success">
                          {backup.status === "completed"
                            ? "完了"
                            : backup.status}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="btn btn-ghost btn-xs">
                          <ArrowDownTrayIcon className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* データ削除 */}
          <div className="border border-error rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-error">危険な操作</h4>
            <p className="text-sm text-base-content/70 mb-4">
              以下の操作は元に戻せません。実行前に必ずバックアップを取得してください。
            </p>

            <div className="space-y-3">
              <button type="button" className="btn btn-error btn-outline">
                <TrashIcon className="h-4 w-4" />
                古いデータを削除 (1年以上前)
              </button>
              <button type="button" className="btn btn-error btn-outline">
                <TrashIcon className="h-4 w-4" />
                非アクティブユーザーを削除
              </button>
              <button type="button" className="btn btn-error">
                <TrashIcon className="h-4 w-4" />
                全データを削除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
