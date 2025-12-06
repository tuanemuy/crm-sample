"use client";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function PasswordSettings() {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleChangePassword = () => {
    console.log("パスワード変更:", passwords);
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LockClosedIcon className="h-5 w-5" />
          パスワード変更
        </h3>

        <div className="space-y-4 max-w-md">
          <div>
            <label htmlFor="current-password" className="label">
              現在のパスワード
            </label>
            <input
              id="current-password"
              type="password"
              className="input input-bordered w-full"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  current: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="new-password" className="label">
              新しいパスワード
            </label>
            <input
              id="new-password"
              type="password"
              className="input input-bordered w-full"
              value={passwords.new}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  new: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="label">
              新しいパスワード（確認）
            </label>
            <input
              id="confirm-password"
              type="password"
              className="input input-bordered w-full"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  confirm: e.target.value,
                })
              }
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleChangePassword}
          >
            パスワードを変更
          </button>
        </div>
      </div>
    </div>
  );
}
