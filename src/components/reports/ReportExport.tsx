"use client";

import {
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  PrinterIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

interface ReportExportProps {
  type: string;
}

export function ReportExport({ type: _type }: ReportExportProps) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <select className="select select-bordered select-sm">
                <option>棒グラフ</option>
                <option>線グラフ</option>
                <option>円グラフ</option>
                <option>テーブル</option>
              </select>
            </div>

            <div className="divider divider-horizontal" />

            <div className="btn-group">
              <button type="button" className="btn btn-sm btn-active">
                日
              </button>
              <button type="button" className="btn btn-sm">
                週
              </button>
              <button type="button" className="btn btn-sm">
                月
              </button>
              <button type="button" className="btn btn-sm">
                年
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" className="btn btn-outline btn-sm">
              <ShareIcon className="h-4 w-4" />
              共有
            </button>

            <button type="button" className="btn btn-outline btn-sm">
              <PrinterIcon className="h-4 w-4" />
              印刷
            </button>

            <div className="dropdown dropdown-end">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-outline btn-sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                エクスポート
              </button>
              <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <button type="button">PDF形式</button>
                </li>
                <li>
                  <button type="button">Excel形式</button>
                </li>
                <li>
                  <button type="button">CSV形式</button>
                </li>
                <li>
                  <button type="button">画像形式 (PNG)</button>
                </li>
              </ul>
            </div>

            <button type="button" className="btn btn-ghost btn-sm">
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
