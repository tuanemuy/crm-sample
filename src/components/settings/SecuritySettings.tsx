"use client";

import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function SecuritySettings() {
  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
      expireDays: 90,
    },
    twoFactorAuth: {
      enabled: true,
      required: false,
    },
    sessionSettings: {
      timeout: 480, // minutes
      maxSessions: 3,
    },
    loginRestrictions: {
      enableIpWhitelist: false,
      ipWhitelist: "",
      maxFailedAttempts: 5,
      lockoutDuration: 30, // minutes
    },
    auditLog: {
      enabled: true,
      retentionDays: 365,
    },
  });

  const handleSave = () => {
    console.log("セキュリティ設定を保存:", securitySettings);
  };

  return (
    <div
      id="security"
      className="card bg-base-100 shadow-sm border border-base-300"
    >
      <div className="card-body p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5" />
          セキュリティ設定
        </h3>

        <div className="space-y-6">
          {/* パスワードポリシー */}
          <div className="border border-base-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">パスワードポリシー</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password-min-length" className="label">
                  最小文字数
                </label>
                <input
                  id="password-min-length"
                  type="number"
                  className="input input-bordered w-full"
                  min="6"
                  max="20"
                  value={securitySettings.passwordPolicy.minLength}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        minLength: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div>
                <label htmlFor="password-expire-days" className="label">
                  パスワード有効期限（日）
                </label>
                <input
                  id="password-expire-days"
                  type="number"
                  className="input input-bordered w-full"
                  min="30"
                  max="365"
                  value={securitySettings.passwordPolicy.expireDays}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        expireDays: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={securitySettings.passwordPolicy.requireUppercase}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireUppercase: e.target.checked,
                      },
                    })
                  }
                />
                <span>大文字を必須にする</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={securitySettings.passwordPolicy.requireLowercase}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireLowercase: e.target.checked,
                      },
                    })
                  }
                />
                <span>小文字を必須にする</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={securitySettings.passwordPolicy.requireNumbers}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireNumbers: e.target.checked,
                      },
                    })
                  }
                />
                <span>数字を必須にする</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={securitySettings.passwordPolicy.requireSymbols}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireSymbols: e.target.checked,
                      },
                    })
                  }
                />
                <span>記号を必須にする</span>
              </label>
            </div>
          </div>

          {/* 二段階認証 */}
          <div className="border border-base-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">二段階認証</h4>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={securitySettings.twoFactorAuth.enabled}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      twoFactorAuth: {
                        ...securitySettings.twoFactorAuth,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                <span>二段階認証を有効にする</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={securitySettings.twoFactorAuth.required}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      twoFactorAuth: {
                        ...securitySettings.twoFactorAuth,
                        required: e.target.checked,
                      },
                    })
                  }
                />
                <span>全ユーザーに二段階認証を必須にする</span>
              </label>
            </div>
          </div>

          {/* セッション設定 */}
          <div className="border border-base-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">セッション設定</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="session-timeout" className="label">
                  セッションタイムアウト（分）
                </label>
                <input
                  id="session-timeout"
                  type="number"
                  className="input input-bordered w-full"
                  min="15"
                  max="1440"
                  value={securitySettings.sessionSettings.timeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionSettings: {
                        ...securitySettings.sessionSettings,
                        timeout: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div>
                <label htmlFor="max-sessions" className="label">
                  最大同時セッション数
                </label>
                <input
                  id="max-sessions"
                  type="number"
                  className="input input-bordered w-full"
                  min="1"
                  max="10"
                  value={securitySettings.sessionSettings.maxSessions}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionSettings: {
                        ...securitySettings.sessionSettings,
                        maxSessions: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* ログイン制限 */}
          <div className="border border-base-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">ログイン制限</h4>

            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={securitySettings.loginRestrictions.enableIpWhitelist}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      loginRestrictions: {
                        ...securitySettings.loginRestrictions,
                        enableIpWhitelist: e.target.checked,
                      },
                    })
                  }
                />
                <span>IPアドレス制限を有効にする</span>
              </label>

              {securitySettings.loginRestrictions.enableIpWhitelist && (
                <div>
                  <label htmlFor="ip-whitelist" className="label">
                    許可IPアドレス（改行区切り）
                  </label>
                  <textarea
                    id="ip-whitelist"
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    placeholder="192.168.1.0/24"
                    value={securitySettings.loginRestrictions.ipWhitelist}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        loginRestrictions: {
                          ...securitySettings.loginRestrictions,
                          ipWhitelist: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="max-failed-attempts" className="label">
                    最大ログイン失敗回数
                  </label>
                  <input
                    id="max-failed-attempts"
                    type="number"
                    className="input input-bordered w-full"
                    min="3"
                    max="10"
                    value={securitySettings.loginRestrictions.maxFailedAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        loginRestrictions: {
                          ...securitySettings.loginRestrictions,
                          maxFailedAttempts: Number.parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="lockout-duration" className="label">
                    ロックアウト時間（分）
                  </label>
                  <input
                    id="lockout-duration"
                    type="number"
                    className="input input-bordered w-full"
                    min="5"
                    max="120"
                    value={securitySettings.loginRestrictions.lockoutDuration}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        loginRestrictions: {
                          ...securitySettings.loginRestrictions,
                          lockoutDuration: Number.parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 監査ログ */}
          <div className="border border-base-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3">監査ログ</h4>

            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={securitySettings.auditLog.enabled}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      auditLog: {
                        ...securitySettings.auditLog,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                <span>監査ログを有効にする</span>
              </label>

              <div>
                <label htmlFor="log-retention-days" className="label">
                  ログ保存期間（日）
                </label>
                <input
                  id="log-retention-days"
                  type="number"
                  className="input input-bordered w-full max-w-xs"
                  min="30"
                  max="2555"
                  value={securitySettings.auditLog.retentionDays}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      auditLog: {
                        ...securitySettings.auditLog,
                        retentionDays: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
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
