/**
 * Application error messages constants
 * Use these constants to ensure consistent error messages across the application
 */

// English error messages for tests
export const ERROR_MESSAGES_EN = {
  // Validation errors
  INVALID_INPUT: "Invalid input",
  INVALID_QUERY: "Invalid query",
  INVALID_FILTER: "Invalid filter",
  INVALID_SORT: "Invalid sort",
  INVALID_PAGINATION: "Invalid pagination",

  // Entity not found errors
  USER_NOT_FOUND: "User not found",
  CUSTOMER_NOT_FOUND: "Customer not found",
  LEAD_NOT_FOUND: "Lead not found",
  LEADS_NOT_FOUND: "Leads not found",
  CONTACT_NOT_FOUND: "Contact not found",
  DEAL_NOT_FOUND: "Deal not found",
  ACTIVITY_NOT_FOUND: "Activity not found",
  APPROVAL_NOT_FOUND: "Approval not found",
  CAMPAIGN_NOT_FOUND: "Campaign not found",
  INTEGRATION_NOT_FOUND: "Integration not found",
  ORGANIZATION_NOT_FOUND: "Organization not found",

  // Customer operations
  INVALID_QUERY_LISTING_CUSTOMERS: "Invalid query for listing customers",
  FAILED_TO_LIST_CUSTOMERS: "Failed to list customers",

  // Contact history operations
  INVALID_QUERY_VIEWING_CONTACT_HISTORY:
    "Invalid query for viewing contact history",
  FAILED_TO_GET_CONTACT_HISTORY: "Failed to get contact history",

  // Dashboard operations
  INVALID_INPUT_PIPELINE_SUMMARY: "Invalid input for viewing pipeline summary",
  INVALID_INPUT_DASHBOARD_CREATION: "Invalid input for dashboard creation",
  INVALID_INPUT_DASHBOARD_UPDATE: "Invalid input for dashboard update",

  // Campaign operations
  INVALID_INPUT_ASSIGN_LEADS: "Invalid input for assigning leads to campaign",

  // Deal operations
  INVALID_INPUT_FILTER_DEALS: "Invalid input for filtering deals",
  INVALID_INPUT_SEARCH_DEALS: "Invalid input for searching deals",
  INVALID_INPUT_UPDATE_DEAL: "Invalid input for updating deal",
  INVALID_INPUT_UPDATE_DEAL_STAGE: "Invalid input for updating deal stage",
  INVALID_INPUT_VIEW_RELATED_DEALS: "Invalid input for viewing related deals",
  INVALID_INPUT_MANAGE_DEAL_AMOUNT: "Invalid input for managing deal amount",
  INVALID_INPUT_SALES_FORECAST: "Invalid input for sales forecast",
  INVALID_INPUT_RECORD_DEAL_ACTIVITY:
    "Invalid input for recording deal activity",
  INVALID_INPUT_RECORD_COMPETITOR_INFO:
    "Invalid input for recording competitor information",

  // User operations
  INVALID_INPUT_USER_OPERATION: "Invalid input for user operation",
  INVALID_INPUT_PROFILE_EDIT: "Invalid input for profile edit",
  CANNOT_DELETE_USER: "Cannot delete user",
  CANNOT_ACTIVATE_USER: "Cannot activate user",
  CANNOT_DEACTIVATE_USER: "Cannot deactivate user",
  CANNOT_UPDATE_USER: "Cannot update user",

  // Permission errors
  PERMISSION_DENIED: "Permission denied",
  UNAUTHORIZED: "Unauthorized",

  // Lead operations
  INVALID_INPUT_UPDATE_LEAD: "Invalid input for updating lead",
  INVALID_INPUT_UPDATE_LEAD_STATUS: "Invalid input for updating lead status",
  INVALID_INPUT_DELETE_LEAD: "Invalid input for deleting lead",
  INVALID_INPUT_CONVERT_LEAD: "Invalid input for lead conversion",
  INVALID_INPUT_SEARCH_LEADS: "Invalid input for searching leads",
  INVALID_INPUT_FILTER_LEADS_BY_SCORE:
    "Invalid input for filtering leads by score",
  INVALID_INPUT_VIEW_LEAD_BEHAVIOR_HISTORY:
    "Invalid input for viewing lead behavior history",

  // Activity operations
  INVALID_INPUT_ACTIVITY_CREATION: "Invalid input for activity creation",
  INVALID_INPUT_UPDATE_ACTIVITY: "Invalid input for updating activity",
  INVALID_INPUT_GET_ACTIVITY_DETAILS:
    "Invalid input for getting activity details",
  INVALID_INPUT_SET_ACTIVITY_REMINDER:
    "Invalid input for setting activity reminder",
  INVALID_INPUT_ACTIVITY_REPORT_GENERATION:
    "Invalid input for activity report generation",
  INVALID_INPUT_VIEW_ACTIVITY_CALENDAR:
    "Invalid input for viewing activity calendar",
  INVALID_ACTIVITY_ID: "Invalid input: activity ID must be a valid UUID",

  // Contact operations
  INVALID_INPUT_UPDATE_CONTACT: "Invalid input for updating contact",
  INVALID_INPUT_DELETE_CONTACT: "Invalid input",

  // Contact History operations
  INVALID_INPUT_ADD_CONTACT_RECORD: "Invalid input for adding contact record",

  // Customer operations
  INVALID_INPUT_CUSTOMER_UPDATE: "Invalid input for customer update",
  INVALID_INPUT_CUSTOMER_EXPORT: "Invalid input for customer export",
  INVALID_INPUT_CUSTOMER_SEARCH: "Invalid input for customer search",
  INVALID_INPUT_MANAGE_COMPANY_RELATIONS:
    "Invalid input for managing company relations",

  // Search operations
  INVALID_INPUT_GLOBAL_SEARCH: "Invalid input for global search",

  // Integration operations
  INVALID_INPUT_INTEGRATION_CREATION: "Invalid input for integration creation",
  INVALID_INPUT_INTEGRATION_TEST: "Invalid input for integration test",

  // Data Import/Export operations
  INVALID_INPUT_IMPORT_JOB_CREATION: "Invalid input for import job creation",
  INVALID_INPUT_EXPORT_JOB_CREATION: "Invalid input for export job creation",
  INVALID_INPUT_JOB_PROCESSING: "Invalid input for job processing",
  INVALID_INPUT_LISTING_JOBS: "Invalid input for listing jobs",

  // Display Settings operations
  INVALID_INPUT_DISPLAY_SETTINGS_UPDATE:
    "Invalid input for display settings update",

  // Notification operations
  INVALID_INPUT_NOTIFICATION_CREATION:
    "Invalid input for notification creation",
  INVALID_INPUT_NOTIFICATION_SETTINGS_CREATION:
    "Invalid input for notification settings creation",
  INVALID_INPUT_NOTIFICATION_SETTINGS_UPDATE:
    "Invalid input for notification settings update",

  // Scoring Rule operations
  INVALID_INPUT_CREATE_SCORING_RULE: "Invalid input for creating scoring rule",
  INVALID_INPUT_UPDATE_SCORING_RULE: "Invalid input for updating scoring rule",
  INVALID_INPUT_DELETE_SCORING_RULE: "Invalid input for deleting scoring rule",
  INVALID_INPUT_TEST_SCORING_RULE: "Invalid input for testing scoring rule",
  INVALID_INPUT_TOGGLE_SCORING_RULE: "Invalid input for toggling scoring rule",

  // Document operations
  INVALID_INPUT_DOCUMENT_UPDATE: "Invalid input for document update",
  INVALID_INPUT_FILE_UPLOAD: "Invalid input for file upload",

  // Database errors
  DATABASE_ERROR: "Database error",
  TRANSACTION_FAILED: "Transaction failed",
} as const;

// Japanese error messages
export const ERROR_MESSAGES = {
  // Customer related errors
  CUSTOMER_INVALID_INPUT: "顧客情報の入力内容に誤りがあります",
  CUSTOMER_NAME_DUPLICATE: "同じ名前の顧客が既に存在します",
  CUSTOMER_NOT_FOUND: "顧客が見つかりません",
  CUSTOMER_ASSIGNED_USER_NOT_FOUND: "指定された担当者が存在しません",
  CUSTOMER_PARENT_NOT_FOUND: "指定された親顧客が存在しません",
  CUSTOMER_CREATION_FAILED: "顧客の作成に失敗しました",
  CUSTOMER_UPDATE_FAILED: "顧客の更新に失敗しました",
  CUSTOMER_DELETE_FAILED: "顧客の削除に失敗しました",

  // Contact History related errors
  CONTACT_HISTORY_INVALID_QUERY: "Invalid query for viewing contact history",
  CONTACT_HISTORY_CUSTOMER_NOT_FOUND: "Customer not found",
  CONTACT_HISTORY_FETCH_FAILED: "Failed to get contact history",

  // User related errors
  USER_INVALID_INPUT: "ユーザー情報の入力内容に誤りがあります",
  USER_EMAIL_DUPLICATE: "同じメールアドレスのユーザーが既に存在します",
  USER_NOT_FOUND: "ユーザーが見つかりません",
  USER_CREATION_FAILED: "ユーザーの作成に失敗しました",
  USER_UPDATE_FAILED: "ユーザーの更新に失敗しました",
  USER_DELETE_FAILED: "ユーザーの削除に失敗しました",

  // Lead related errors
  LEAD_INVALID_INPUT: "リード情報の入力内容に誤りがあります",
  LEAD_EMAIL_DUPLICATE: "同じメールアドレスのリードが既に存在します",
  LEAD_NOT_FOUND: "リードが見つかりません",
  LEAD_CREATION_FAILED: "リードの作成に失敗しました",
  LEAD_UPDATE_FAILED: "リードの更新に失敗しました",
  LEAD_DELETE_FAILED: "リードの削除に失敗しました",

  // Deal related errors
  DEAL_INVALID_INPUT: "案件情報の入力内容に誤りがあります",
  DEAL_NOT_FOUND: "案件が見つかりません",
  DEAL_CREATION_FAILED: "案件の作成に失敗しました",
  DEAL_UPDATE_FAILED: "案件の更新に失敗しました",
  DEAL_DELETE_FAILED: "案件の削除に失敗しました",

  // Activity related errors
  ACTIVITY_INVALID_INPUT: "活動情報の入力内容に誤りがあります",
  ACTIVITY_NOT_FOUND: "活動が見つかりません",
  ACTIVITY_CREATION_FAILED: "活動の作成に失敗しました",
  ACTIVITY_UPDATE_FAILED: "活動の更新に失敗しました",
  ACTIVITY_DELETE_FAILED: "活動の削除に失敗しました",

  // Contact related errors
  CONTACT_INVALID_INPUT: "連絡先情報の入力内容に誤りがあります",
  CONTACT_NOT_FOUND: "連絡先が見つかりません",
  CONTACT_CREATION_FAILED: "連絡先の作成に失敗しました",
  CONTACT_UPDATE_FAILED: "連絡先の更新に失敗しました",
  CONTACT_DELETE_FAILED: "連絡先の削除に失敗しました",

  // General errors
  UNAUTHORIZED: "認証が必要です",
  FORBIDDEN: "この操作を実行する権限がありません",
  VALIDATION_ERROR: "入力内容に誤りがあります",
  DATABASE_ERROR: "データベースエラーが発生しました",
  NETWORK_ERROR: "ネットワークエラーが発生しました",
  UNKNOWN_ERROR: "不明なエラーが発生しました",
} as const;

/**
 * Validation error messages for specific fields
 */
export const VALIDATION_ERROR_MESSAGES = {
  // Common field validation
  REQUIRED_FIELD: "必須項目です",
  INVALID_EMAIL: "有効なメールアドレスを入力してください",
  INVALID_URL: "有効なURLを入力してください",
  INVALID_UUID: "有効なUUIDを入力してください",
  INVALID_DATE: "有効な日付を入力してください",

  // String validation
  STRING_TOO_SHORT: "文字数が不足しています",
  STRING_TOO_LONG: "文字数が上限を超えています",

  // Number validation
  NUMBER_TOO_SMALL: "値が小さすぎます",
  NUMBER_TOO_LARGE: "値が大きすぎます",

  // Customer specific validation
  CUSTOMER_NAME_REQUIRED: "会社名は必須です",
  CUSTOMER_NAME_TOO_LONG: "会社名は255文字以内で入力してください",
  CUSTOMER_FOUNDED_YEAR_MIN: "創業年は1800年以降を入力してください",
  CUSTOMER_FOUNDED_YEAR_MAX: "創業年は今年以前の年を入力してください",

  // User specific validation
  USER_EMAIL_REQUIRED: "メールアドレスは必須です",
  USER_NAME_REQUIRED: "ユーザー名は必須です",
  USER_PASSWORD_REQUIRED: "パスワードは必須です",
  USER_PASSWORD_TOO_SHORT: "パスワードは8文字以上で入力してください",

  // Lead specific validation
  LEAD_EMAIL_REQUIRED: "メールアドレスは必須です",
  LEAD_FIRST_NAME_REQUIRED: "名前は必須です",
  LEAD_LAST_NAME_REQUIRED: "姓は必須です",

  // Deal specific validation
  DEAL_TITLE_REQUIRED: "タイトルは必須です",
  DEAL_AMOUNT_REQUIRED: "金額は必須です",
  DEAL_AMOUNT_POSITIVE: "金額は正の値を入力してください",

  // Pagination validation
  PAGINATION_PAGE_MIN: "ページ番号は1以上を入力してください",
  PAGINATION_LIMIT_MIN: "1ページあたりの表示件数は1以上を入力してください",
  PAGINATION_LIMIT_MAX: "1ページあたりの表示件数は1000以下を入力してください",
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
export type ValidationErrorMessage =
  (typeof VALIDATION_ERROR_MESSAGES)[keyof typeof VALIDATION_ERROR_MESSAGES];
