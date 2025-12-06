"use client";

import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function ActivityActions() {
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);

  return (
    <div className="flex gap-2">
      <button type="button" className="btn btn-outline btn-sm">
        <ArrowDownTrayIcon className="h-4 w-4" />
        エクスポート
      </button>

      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => setShowNewActivityModal(true)}
      >
        <PlusIcon className="h-4 w-4" />
        新規活動
      </button>

      {/* 新規活動作成モーダル */}
      {showNewActivityModal && (
        <dialog open className="modal">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">新規活動作成</h3>

            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="activity-title">
                  活動タイトル
                </label>
                <input
                  id="activity-title"
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="活動タイトルを入力"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="activity-type">
                    活動タイプ
                  </label>
                  <select
                    id="activity-type"
                    className="select select-bordered w-full"
                  >
                    <option>電話</option>
                    <option>メール</option>
                    <option>面談</option>
                    <option>訪問</option>
                    <option>プレゼンテーション</option>
                    <option>その他</option>
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="activity-status">
                    ステータス
                  </label>
                  <select
                    id="activity-status"
                    className="select select-bordered w-full"
                  >
                    <option>予定</option>
                    <option>進行中</option>
                    <option>完了</option>
                    <option>キャンセル</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="start-date">
                    開始日時
                  </label>
                  <input
                    id="start-date"
                    type="datetime-local"
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="end-date">
                    終了日時
                  </label>
                  <input
                    id="end-date"
                    type="datetime-local"
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="related-customer">
                  関連顧客
                </label>
                <select
                  id="related-customer"
                  className="select select-bordered w-full"
                >
                  <option>顧客を選択</option>
                  <option>株式会社テックソリューションズ</option>
                  <option>グローバルイノベーション株式会社</option>
                  <option>デジタルプラットフォーム株式会社</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="activity-description">
                  説明
                </label>
                <textarea
                  id="activity-description"
                  className="textarea textarea-bordered w-full h-24"
                  placeholder="活動の詳細を入力"
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => setShowNewActivityModal(false)}
              >
                キャンセル
              </button>
              <button type="button" className="btn btn-primary">
                作成
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              type="button"
              onClick={() => setShowNewActivityModal(false)}
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
