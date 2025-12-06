"use client";

import {
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CustomerData {
  name: string;
  industry: string;
  size: string;
  location: string;
  foundedYear: string;
  website: string;
  description: string;
  contactPerson: {
    name: string;
    title: string;
    email: string;
    phone: string;
    department: string;
  };
  assignedUserId: string;
  parentCustomerId: string;
  status: "active" | "inactive";
}

interface CustomerFormProps {
  mode: "create" | "edit";
  initialData?: Partial<CustomerData>;
  customerId?: string;
}

export function CustomerForm({
  mode,
  initialData,
  customerId,
}: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerData>({
    name: "",
    industry: "",
    size: "",
    location: "",
    foundedYear: "",
    website: "",
    description: "",
    contactPerson: {
      name: "",
      title: "",
      email: "",
      phone: "",
      department: "",
    },
    assignedUserId: "",
    parentCustomerId: "",
    status: "active",
    ...initialData,
  });

  const industries = [
    { value: "", label: "選択してください" },
    { value: "technology", label: "テクノロジー" },
    { value: "finance", label: "金融" },
    { value: "healthcare", label: "ヘルスケア" },
    { value: "manufacturing", label: "製造業" },
    { value: "retail", label: "小売" },
    { value: "education", label: "教育" },
    { value: "consulting", label: "コンサルティング" },
    { value: "other", label: "その他" },
  ];

  const sizes = [
    { value: "", label: "選択してください" },
    { value: "startup", label: "スタートアップ" },
    { value: "small", label: "中小企業" },
    { value: "medium", label: "中企業" },
    { value: "large", label: "大企業" },
    { value: "enterprise", label: "エンタープライズ" },
  ];

  const assignedUsers = [
    { value: "", label: "選択してください" },
    { value: "user1", label: "田中太郎" },
    { value: "user2", label: "佐藤花子" },
    { value: "user3", label: "鈴木一郎" },
    { value: "user4", label: "高橋美理" },
    { value: "user5", label: "山田健太" },
  ];

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("contactPerson.")) {
      const contactField = field.replace("contactPerson.", "");
      setFormData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [contactField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: API呼び出しを実装
      await new Promise((resolve) => setTimeout(resolve, 1000)); // シミュレート

      console.log("Customer data:", formData);

      // 成功後のリダイレクト
      if (mode === "create") {
        router.push("/customers");
      } else {
        router.push(`/customers/${customerId}`);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      // TODO: エラーハンドリングを実装
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (mode === "create") {
      router.push("/customers");
    } else {
      router.push(`/customers/${customerId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 企業基本情報 */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base-content flex items-center gap-2">
            <BuildingOfficeIcon className="h-5 w-5" />
            企業基本情報
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label" htmlFor="customer-name">
                <span className="label-text">
                  会社名 <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="customer-name"
                type="text"
                placeholder="株式会社例示コーポレーション"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="customer-industry">
                <span className="label-text">
                  業界 <span className="text-error">*</span>
                </span>
              </label>
              <select
                id="customer-industry"
                className="select select-bordered w-full"
                value={formData.industry}
                onChange={(e) => handleInputChange("industry", e.target.value)}
                required
              >
                {industries.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="customer-size">
                <span className="label-text">
                  企業規模 <span className="text-error">*</span>
                </span>
              </label>
              <select
                id="customer-size"
                className="select select-bordered w-full"
                value={formData.size}
                onChange={(e) => handleInputChange("size", e.target.value)}
                required
              >
                {sizes.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="customer-location">
                <span className="label-text flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  所在地
                </span>
              </label>
              <input
                id="customer-location"
                type="text"
                placeholder="東京都渋谷区"
                className="input input-bordered w-full"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="customer-founded-year">
                <span className="label-text flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  設立年
                </span>
              </label>
              <input
                id="customer-founded-year"
                type="number"
                placeholder="2020"
                className="input input-bordered w-full"
                value={formData.foundedYear}
                onChange={(e) =>
                  handleInputChange("foundedYear", e.target.value)
                }
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label" htmlFor="customer-website">
                <span className="label-text flex items-center gap-1">
                  <GlobeAltIcon className="h-4 w-4" />
                  ウェブサイト
                </span>
              </label>
              <input
                id="customer-website"
                type="url"
                placeholder="https://example.com"
                className="input input-bordered w-full"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label" htmlFor="customer-description">
                <span className="label-text flex items-center gap-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  企業説明
                </span>
              </label>
              <textarea
                id="customer-description"
                placeholder="企業の概要や事業内容を記載してください"
                className="textarea textarea-bordered w-full h-24"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 担当者情報 */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base-content flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            担当者情報
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label" htmlFor="contact-person-name">
                <span className="label-text">
                  担当者名 <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="contact-person-name"
                type="text"
                placeholder="山田太郎"
                className="input input-bordered w-full"
                value={formData.contactPerson.name}
                onChange={(e) =>
                  handleInputChange("contactPerson.name", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="contact-person-title">
                <span className="label-text">役職</span>
              </label>
              <input
                id="contact-person-title"
                type="text"
                placeholder="営業部長"
                className="input input-bordered w-full"
                value={formData.contactPerson.title}
                onChange={(e) =>
                  handleInputChange("contactPerson.title", e.target.value)
                }
              />
            </div>

            <div>
              <label className="label" htmlFor="contact-person-email">
                <span className="label-text flex items-center gap-1">
                  <EnvelopeIcon className="h-4 w-4" />
                  メールアドレス <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="contact-person-email"
                type="email"
                placeholder="yamada@example.com"
                className="input input-bordered w-full"
                value={formData.contactPerson.email}
                onChange={(e) =>
                  handleInputChange("contactPerson.email", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="contact-person-phone">
                <span className="label-text flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4" />
                  電話番号
                </span>
              </label>
              <input
                id="contact-person-phone"
                type="tel"
                placeholder="03-1234-5678"
                className="input input-bordered w-full"
                value={formData.contactPerson.phone}
                onChange={(e) =>
                  handleInputChange("contactPerson.phone", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="label" htmlFor="contact-person-department">
                <span className="label-text">部署</span>
              </label>
              <input
                id="contact-person-department"
                type="text"
                placeholder="営業部"
                className="input input-bordered w-full"
                value={formData.contactPerson.department}
                onChange={(e) =>
                  handleInputChange("contactPerson.department", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 管理情報 */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base-content">管理情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label" htmlFor="assigned-user">
                <span className="label-text">
                  担当者 <span className="text-error">*</span>
                </span>
              </label>
              <select
                id="assigned-user"
                className="select select-bordered w-full"
                value={formData.assignedUserId}
                onChange={(e) =>
                  handleInputChange("assignedUserId", e.target.value)
                }
                required
              >
                {assignedUsers.map((user) => (
                  <option key={user.value} value={user.value}>
                    {user.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="customer-status">
                <span className="label-text">ステータス</span>
              </label>
              <select
                id="customer-status"
                className="select select-bordered w-full"
                value={formData.status}
                onChange={(e) =>
                  handleInputChange(
                    "status",
                    e.target.value as "active" | "inactive",
                  )
                }
              >
                <option value="active">アクティブ</option>
                <option value="inactive">非アクティブ</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label" htmlFor="parent-customer">
                <span className="label-text">親会社</span>
                <span className="label-text-alt">関連企業がある場合のみ</span>
              </label>
              <input
                id="parent-customer"
                type="text"
                placeholder="親会社名を検索..."
                className="input input-bordered w-full"
                value={formData.parentCustomerId}
                onChange={(e) =>
                  handleInputChange("parentCustomerId", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-ghost"
          disabled={isSubmitting}
        >
          キャンセル
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              {mode === "create" ? "登録中..." : "更新中..."}
            </>
          ) : mode === "create" ? (
            "登録"
          ) : (
            "更新"
          )}
        </button>
      </div>
    </form>
  );
}
