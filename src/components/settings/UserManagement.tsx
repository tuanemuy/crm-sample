"use client";

import {
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "sales" | "viewer";
  status: "active" | "inactive" | "pending";
  lastLogin: string;
  createdAt: string;
}

export function UserManagement() {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [users, _setUsers] = useState<User[]>([
    {
      id: "1",
      name: "田中太郎",
      email: "tanaka@sample.co.jp",
      role: "admin",
      status: "active",
      lastLogin: "2025-01-15T10:30:00",
      createdAt: "2024-01-15T00:00:00",
    },
    {
      id: "2",
      name: "佐藤花子",
      email: "sato@sample.co.jp",
      role: "manager",
      status: "active",
      lastLogin: "2025-01-14T16:45:00",
      createdAt: "2024-02-01T00:00:00",
    },
    {
      id: "3",
      name: "鈴木一郎",
      email: "suzuki@sample.co.jp",
      role: "sales",
      status: "active",
      lastLogin: "2025-01-15T09:15:00",
      createdAt: "2024-03-10T00:00:00",
    },
    {
      id: "4",
      name: "高橋美理",
      email: "takahashi@sample.co.jp",
      role: "sales",
      status: "inactive",
      lastLogin: "2025-01-10T14:20:00",
      createdAt: "2024-04-05T00:00:00",
    },
  ]);

  const getRoleLabel = (role: User["role"]) => {
    const roleMap = {
      admin: "管理者",
      manager: "マネージャー",
      sales: "営業",
      viewer: "閲覧者",
    };
    return roleMap[role];
  };

  const getRoleBadge = (role: User["role"]) => {
    const badgeMap = {
      admin: "badge-error",
      manager: "badge-warning",
      sales: "badge-primary",
      viewer: "badge-info",
    };
    return `badge ${badgeMap[role]}`;
  };

  const getStatusBadge = (status: User["status"]) => {
    const badgeMap = {
      active: "badge-success",
      inactive: "badge-neutral",
      pending: "badge-warning",
    };
    return `badge ${badgeMap[status]}`;
  };

  const getStatusLabel = (status: User["status"]) => {
    const statusMap = {
      active: "アクティブ",
      inactive: "非アクティブ",
      pending: "招待中",
    };
    return statusMap[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP");
  };

  return (
    <div
      id="users"
      className="card bg-base-100 shadow-sm border border-base-300"
    >
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            ユーザー管理
          </h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddUserModal(true)}
          >
            <PlusIcon className="h-4 w-4" />
            ユーザー追加
          </button>
        </div>

        {/* ユーザー一覧テーブル */}
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>ユーザー</th>
                <th>ロール</th>
                <th>ステータス</th>
                <th>最終ログイン</th>
                <th>登録日</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-base-content/70">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getRoleBadge(user.role)}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusBadge(user.status)}>
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button type="button" className="btn btn-ghost btn-xs">
                        <EyeIcon className="h-3 w-3" />
                      </button>
                      <button type="button" className="btn btn-ghost btn-xs">
                        <PencilIcon className="h-3 w-3" />
                      </button>
                      <button type="button" className="btn btn-ghost btn-xs">
                        {user.status === "active" ? (
                          <EyeSlashIcon className="h-3 w-3" />
                        ) : (
                          <EyeIcon className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ユーザー追加モーダル */}
        {showAddUserModal && (
          <dialog open className="modal">
            <div className="modal-box w-11/12 max-w-md">
              <h3 className="font-bold text-lg mb-4">新規ユーザー追加</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="user-name" className="label">
                    名前
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="名前を入力"
                  />
                </div>

                <div>
                  <label htmlFor="user-email" className="label">
                    メールアドレス
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    className="input input-bordered w-full"
                    placeholder="メールアドレスを入力"
                  />
                </div>

                <div>
                  <label htmlFor="user-role" className="label">
                    ロール
                  </label>
                  <select
                    id="user-role"
                    className="select select-bordered w-full"
                  >
                    <option value="viewer">閲覧者</option>
                    <option value="sales">営業</option>
                    <option value="manager">マネージャー</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox" />
                    <span className="text-sm">招待メールを送信</span>
                  </label>
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowAddUserModal(false)}
                >
                  キャンセル
                </button>
                <button type="button" className="btn btn-primary">
                  追加
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button type="button" onClick={() => setShowAddUserModal(false)}>
                close
              </button>
            </form>
          </dialog>
        )}
      </div>
    </div>
  );
}
