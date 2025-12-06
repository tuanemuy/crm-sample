"use client";

import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export function Header() {
  return (
    <div className="navbar bg-base-100 shadow-sm border-b border-base-300">
      <div className="navbar-start">
        <label
          htmlFor="sidebar-toggle"
          className="btn btn-square btn-ghost lg:hidden"
        >
          <Bars3Icon className="h-6 w-6" />
        </label>
      </div>

      <div className="navbar-center flex-1 px-4">
        <div className="form-control w-full max-w-md">
          <div className="input-group">
            <input
              type="text"
              placeholder="顧客、リード、商談を検索..."
              className="input input-bordered w-full"
            />
            <button type="button" className="btn btn-square btn-primary">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="navbar-end">
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost btn-circle">
            <div className="indicator">
              <BellIcon className="h-6 w-6" />
              <span className="badge badge-xs badge-primary indicator-item">
                3
              </span>
            </div>
          </button>

          <div className="dropdown dropdown-end">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                <img
                  alt="ユーザーアバター"
                  src="https://picsum.photos/40/40"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
            </button>
            <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <button type="button" className="justify-between">
                  プロフィール
                  <span className="badge">新着</span>
                </button>
              </li>
              <li>
                <button type="button">設定</button>
              </li>
              <li>
                <button type="button">ログアウト</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
