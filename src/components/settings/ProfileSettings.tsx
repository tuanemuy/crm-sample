"use client";

import { CameraIcon, UserIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function ProfileSettings() {
  const [profileData, setProfileData] = useState({
    name: "田中太郎",
    email: "tanaka@sample.co.jp",
    phone: "03-1234-5678",
    department: "営業部",
    position: "営業マネージャー",
    bio: "10年以上の営業経験を持ち、チームを率いて目標達成に貢献しています。",
    timezone: "Asia/Tokyo",
    language: "ja",
    dateFormat: "YYYY/MM/DD",
    timeFormat: "24h",
  });

  const handleSave = () => {
    console.log("プロフィール設定を保存:", profileData);
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          プロフィール情報
        </h3>

        <div className="flex items-center gap-6 mb-6">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-24">
              <span className="text-2xl">田</span>
            </div>
          </div>
          <div>
            <button type="button" className="btn btn-outline btn-sm">
              <CameraIcon className="h-4 w-4" />
              写真を変更
            </button>
            <p className="text-sm text-base-content/70 mt-1">
              JPG、PNG形式、最大2MB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-name" className="label">
              名前
            </label>
            <input
              id="profile-name"
              type="text"
              className="input input-bordered w-full"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="label">
              メールアドレス
            </label>
            <input
              id="profile-email"
              type="email"
              className="input input-bordered w-full"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  email: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="label">
              電話番号
            </label>
            <input
              id="profile-phone"
              type="tel"
              className="input input-bordered w-full"
              value={profileData.phone}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  phone: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="profile-department" className="label">
              部署
            </label>
            <input
              id="profile-department"
              type="text"
              className="input input-bordered w-full"
              value={profileData.department}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  department: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="profile-position" className="label">
              役職
            </label>
            <input
              id="profile-position"
              type="text"
              className="input input-bordered w-full"
              value={profileData.position}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  position: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="profile-timezone" className="label">
              タイムゾーン
            </label>
            <select
              id="profile-timezone"
              className="select select-bordered w-full"
              value={profileData.timezone}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  timezone: e.target.value,
                })
              }
            >
              <option value="Asia/Tokyo">アジア/東京</option>
              <option value="America/New_York">アメリカ/ニューヨーク</option>
              <option value="Europe/London">ヨーロッパ/ロンドン</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="profile-bio" className="label">
              自己紹介
            </label>
            <textarea
              id="profile-bio"
              className="textarea textarea-bordered w-full"
              rows={3}
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  bio: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
}
