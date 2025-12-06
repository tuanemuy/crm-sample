"use client";

import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function OrganizationSettings() {
  const [organizationData, setOrganizationData] = useState({
    name: "サンプル株式会社",
    industry: "technology",
    size: "medium",
    website: "https://sample.co.jp",
    phone: "03-1234-5678",
    address: "東京都渋谷区渋谷1-1-1",
    taxId: "1234567890",
    currency: "JPY",
    timezone: "Asia/Tokyo",
    fiscalYearStart: "04",
  });

  const handleSave = () => {
    // 保存処理
    console.log("組織設定を保存:", organizationData);
  };

  return (
    <div
      id="organization"
      className="card bg-base-100 shadow-sm border border-base-300"
    >
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BuildingOfficeIcon className="h-5 w-5" />
          組織情報
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="org-name" className="label">
              組織名
            </label>
            <input
              id="org-name"
              type="text"
              className="input input-bordered w-full"
              value={organizationData.name}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="org-industry" className="label">
              業界
            </label>
            <select
              id="org-industry"
              className="select select-bordered w-full"
              value={organizationData.industry}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  industry: e.target.value,
                })
              }
            >
              <option value="technology">テクノロジー</option>
              <option value="finance">金融</option>
              <option value="healthcare">ヘルスケア</option>
              <option value="manufacturing">製造業</option>
              <option value="retail">小売</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div>
            <label htmlFor="org-size" className="label">
              組織規模
            </label>
            <select
              id="org-size"
              className="select select-bordered w-full"
              value={organizationData.size}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  size: e.target.value,
                })
              }
            >
              <option value="startup">スタートアップ</option>
              <option value="small">中小企業</option>
              <option value="medium">中企業</option>
              <option value="large">大企業</option>
              <option value="enterprise">エンタープライズ</option>
            </select>
          </div>

          <div>
            <label htmlFor="org-website" className="label">
              ウェブサイト
            </label>
            <input
              id="org-website"
              type="url"
              className="input input-bordered w-full"
              value={organizationData.website}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  website: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="org-phone" className="label">
              電話番号
            </label>
            <input
              id="org-phone"
              type="tel"
              className="input input-bordered w-full"
              value={organizationData.phone}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  phone: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="org-tax-id" className="label">
              法人番号
            </label>
            <input
              id="org-tax-id"
              type="text"
              className="input input-bordered w-full"
              value={organizationData.taxId}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  taxId: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="org-currency" className="label">
              通貨
            </label>
            <select
              id="org-currency"
              className="select select-bordered w-full"
              value={organizationData.currency}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  currency: e.target.value,
                })
              }
            >
              <option value="JPY">日本円 (JPY)</option>
              <option value="USD">米ドル (USD)</option>
              <option value="EUR">ユーロ (EUR)</option>
            </select>
          </div>

          <div>
            <label htmlFor="org-timezone" className="label">
              タイムゾーン
            </label>
            <select
              id="org-timezone"
              className="select select-bordered w-full"
              value={organizationData.timezone}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
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
            <label htmlFor="org-address" className="label">
              住所
            </label>
            <textarea
              id="org-address"
              className="textarea textarea-bordered w-full"
              rows={3}
              value={organizationData.address}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  address: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="org-fiscal-year" className="label">
              会計年度開始月
            </label>
            <select
              id="org-fiscal-year"
              className="select select-bordered w-full"
              value={organizationData.fiscalYearStart}
              onChange={(e) =>
                setOrganizationData({
                  ...organizationData,
                  fiscalYearStart: e.target.value,
                })
              }
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month.toString().padStart(2, "0")}>
                  {month}月
                </option>
              ))}
            </select>
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
