export type PurgeClassification = "delete" | "anonymize" | "retain";

export interface TablePurgeMetadata {
  readonly tableName: string;
  readonly classification: PurgeClassification;
  readonly reason: string;
  readonly legalBasis: string;
}

/**
 * D-IF & BR-ADL-01..10: Canonical 3-group classification for account purge.
 * Every table in DB schema must be categorized into exactly one group:
 * 1. 'delete': personal & transient operational records that must be hard deleted.
 * 2. 'anonymize': aggregated & historical records where PII identifiers are unlinked (e.g. child_uuid = NULL).
 * 3. 'retain': statutory/accounting logs and read-only taxonomy/content catalogs.
 */
export const PURGE_TABLE_CLASSIFICATIONS: readonly TablePurgeMetadata[] = [
  // --- Group 1: DELETE ---
  {
    tableName: "child_profiles",
    classification: "delete",
    reason:
      "Hồ sơ trẻ em và thông tin độ tuổi cần xoá triệt để khi người dùng xoá tài khoản",
    legalBasis: "Nghị định 13/2023/NĐ-CP Điều 16 (Quyền xoá dữ liệu cá nhân)",
  },
  {
    tableName: "active_sessions",
    classification: "delete",
    reason: "Thu hồi toàn bộ phiên đăng nhập của tài khoản",
    legalBasis: "BR-LGN-06 & BR-ADL-01",
  },
  {
    tableName: "verification_tokens",
    classification: "delete",
    reason: "Xoá token xác thực email và đặt lại mật khẩu của người dùng",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "mfa_settings",
    classification: "delete",
    reason: "Xoá cấu hình xác thực đa yếu tố của tài khoản",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "mfa_recovery_codes",
    classification: "delete",
    reason: "Xoá mã khôi phục xác thực đa yếu tố",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "social_identities",
    classification: "delete",
    reason:
      "Xoá cứng danh tính SNS để giải phóng ràng buộc UNIQUE provider_user_id (BR-ADL-10)",
    legalBasis: "BR-ADL-10 & BR-SLK-01",
  },
  {
    tableName: "entitlements",
    classification: "delete",
    reason: "Xoá quyền truy cập gói của tài khoản bị xoá",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "quota_usage",
    classification: "delete",
    reason: "Xoá theo dõi hạn mức sử dụng của tài khoản",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "mastery_state",
    classification: "delete",
    reason: "Xoá trạng thái thành thạo BKT của trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "level_params",
    classification: "delete",
    reason: "Xoá tham số độ khó thích ứng ZPD của trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "play_sessions",
    classification: "delete",
    reason: "Xoá phiên chơi tương tác của trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "child_session_summaries",
    classification: "delete",
    reason: "Xoá tổng kết phiên chơi cá nhân hoá của trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "child_daily_stats",
    classification: "delete",
    reason: "Xoá thống kê ngày của từng trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "curriculum_enrollments",
    classification: "delete",
    reason: "Xoá đăng ký lộ trình học của trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "curriculum_item_progress",
    classification: "delete",
    reason: "Xoá tiến độ từng bài học trong lộ trình của trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "personal_curriculum_enrollments",
    classification: "delete",
    reason: "Xoá đăng ký lộ trình cá nhân của trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "personal_curriculum_item_progress",
    classification: "delete",
    reason: "Xoá tiến độ từng bài học trong lộ trình cá nhân của trẻ",
    legalBasis: "BR-CDC-10 & BR-ADL-01",
  },
  {
    tableName: "personal_curricula",
    classification: "delete",
    reason: "Xoá lộ trình học cá nhân do người dùng tạo khi đóng tài khoản",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "personal_curriculum_items",
    classification: "delete",
    reason: "Xoá các mục bài học trong lộ trình cá nhân của người dùng",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "custom_games",
    classification: "delete",
    reason: "Xoá các trò chơi tùy chỉnh do người dùng tạo khi đóng tài khoản",
    legalBasis: "BR-ADL-01 & BR-CGB-01",
  },
  {
    tableName: "user_tags",
    classification: "delete",
    reason: "Xoá gắn thẻ cá nhân hoá người dùng",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "notifications",
    classification: "delete",
    reason: "Xoá thông báo gửi cho người dùng",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "notification_deliveries",
    classification: "delete",
    reason: "Xoá lịch sử phân phối thông báo cho người dùng",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "notification_reads",
    classification: "delete",
    reason: "Xoá trạng thái đọc thông báo của người dùng",
    legalBasis: "BR-ADL-01",
  },
  {
    tableName: "ai_credit_balance",
    classification: "delete",
    reason: "Xoá bộ đệm số dư AI credit của người dùng khi đóng tài khoản",
    legalBasis: "BR-ADL-01 & BR-ACL-01",
  },
  {
    tableName: "notification_endpoints",
    classification: "delete",
    reason: "Xoá endpoint thiết bị nhận push notification",
    legalBasis: "BR-ADL-01",
  },

  // --- Group 2: ANONYMIZE ---
  {
    tableName: "users",
    classification: "anonymize",
    reason:
      "Ẩn danh email (deleted+uuid@mindkid.invalid), tên hiển thị, xoá password_hash và đặt status = 'purged' (BR-ADL-09)",
    legalBasis: "BR-ADL-09 & Nghị định 13/2023",
  },
  {
    tableName: "telemetry_events",
    classification: "anonymize",
    reason:
      "Ẩn danh sự kiện đo lường bằng cách gán child_uuid = NULL (BR-ADL-04)",
    legalBasis: "BR-ADL-04 & BR-TLM-03",
  },

  // --- Group 3: RETAIN ---
  {
    tableName: "audit_logs",
    classification: "retain",
    reason:
      "Nhật ký kiểm toán hệ thống được giữ lại theo quy định pháp luật an ninh mạng",
    legalBasis: "BR-ADL-05 & Luật An ninh mạng Điều 26",
  },
  {
    tableName: "consent_logs",
    classification: "retain",
    reason:
      "Bằng chứng đồng ý pháp lý của chủ thể dữ liệu được lưu trữ INSERT-only",
    legalBasis: "BR-ADL-05 & BR-CDC-07",
  },
  {
    tableName: "payment_orders",
    classification: "retain",
    reason:
      "Lưu trữ chứng từ giao dịch thanh toán và đối soát kế toán theo luật thuế (ẩn danh liên kết user)",
    legalBasis: "BR-ADL-05 & Luật Kế toán",
  },
  {
    tableName: "ai_credit_ledger",
    classification: "retain",
    reason: "Nhật ký sổ cái giao dịch AI credit đối soát kế toán và kiểm toán",
    legalBasis: "BR-ACL-01 & BR-ADL-05",
  },
  {
    tableName: "managers",
    classification: "retain",
    reason: "Tài khoản quản trị viên và người duyệt nội dung nội bộ",
    legalBasis: "BR-ADA-01",
  },
  {
    tableName: "content_review_log",
    classification: "retain",
    reason: "Nhật ký duyệt nội dung của ban biên tập",
    legalBasis: "BR-AUD-01",
  },
  {
    tableName: "content_seed_batches",
    classification: "retain",
    reason: "Lịch sử nạp dữ liệu mầm nội dung",
    legalBasis: "BR-SDB-01",
  },
  {
    tableName: "backup_log",
    classification: "retain",
    reason: "Nhật ký sao lưu và kiểm thử khôi phục cơ sở dữ liệu",
    legalBasis: "BR-BAK-01",
  },
  {
    tableName: "entitlement_keys",
    classification: "retain",
    reason: "Danh mục khoá quyền hệ thống",
    legalBasis: "BR-ENT-01",
  },
  {
    tableName: "packages",
    classification: "retain",
    reason: "Danh mục gói cước sản phẩm",
    legalBasis: "BR-PKG-01",
  },
  {
    tableName: "package_entitlements",
    classification: "retain",
    reason: "Cấu hình quyền theo gói sản phẩm",
    legalBasis: "BR-PKG-01",
  },
  {
    tableName: "competencies",
    classification: "retain",
    reason: "Khung năng lực tư duy sư phạm (Lớp 1)",
    legalBasis: "BR-TAX-01",
  },
  {
    tableName: "strands",
    classification: "retain",
    reason: "Mạch kiến thức phân nhánh (Lớp 1)",
    legalBasis: "BR-TAX-01",
  },
  {
    tableName: "skills",
    classification: "retain",
    reason: "Kỹ năng tư duy mầm non (Lớp 1)",
    legalBasis: "BR-TAX-01",
  },
  {
    tableName: "skill_prerequisites",
    classification: "retain",
    reason: "Đồ thị có hướng tiền điều kiện kỹ năng (DAG)",
    legalBasis: "BR-TAX-04",
  },
  {
    tableName: "learning_objectives",
    classification: "retain",
    reason: "Mục tiêu học tập có thể đo lường",
    legalBasis: "BR-TAX-01",
  },
  {
    tableName: "emoji_registry",
    classification: "retain",
    reason: "Từ vựng biểu tượng cảm xúc giáo dục",
    legalBasis: "BR-EMJ-01",
  },
  {
    tableName: "curricula",
    classification: "retain",
    reason: "Lộ trình học theo tuần sư phạm",
    legalBasis: "BR-CUR-01",
  },
  {
    tableName: "curriculum_items",
    classification: "retain",
    reason: "Các bài học trong lộ trình sư phạm",
    legalBasis: "BR-CUR-01",
  },
  {
    tableName: "game_templates",
    classification: "retain",
    reason: "Khuôn mẫu trò chơi tương tác Canvas",
    legalBasis: "BR-GTC-01",
  },
  {
    tableName: "game_levels",
    classification: "retain",
    reason: "Màn chơi tương tác được biên soạn",
    legalBasis: "BR-GDP-01",
  },
  {
    tableName: "lessons",
    classification: "retain",
    reason: "Bài học sư phạm tương tác",
    legalBasis: "BR-LSN-01",
  },
  {
    tableName: "activities",
    classification: "retain",
    reason: "Hoạt động học tập mầm non",
    legalBasis: "BR-ACT-01",
  },
  {
    tableName: "lesson_activities",
    classification: "retain",
    reason: "Liên kết bài học và hoạt động",
    legalBasis: "BR-LSN-01",
  },
  {
    tableName: "worksheets",
    classification: "retain",
    reason: "Phiếu bài tập in ấn",
    legalBasis: "BR-WSK-01",
  },
  {
    tableName: "content_images",
    classification: "retain",
    reason: "Kho hình ảnh minh hoạ bài học",
    legalBasis: "BR-AST-01",
  },
  {
    tableName: "content_tags",
    classification: "retain",
    reason: "Từ vựng gắn thẻ nội dung 3 trục",
    legalBasis: "BR-TAG-01",
  },
  {
    tableName: "content_tag_map",
    classification: "retain",
    reason: "Ánh xạ thẻ nội dung",
    legalBasis: "BR-TAG-01",
  },
  {
    tableName: "content_skill_map",
    classification: "retain",
    reason: "Trọng số đóng góp kỹ năng của nội dung",
    legalBasis: "BR-TAG-03",
  },
  {
    tableName: "level_daily_stats",
    classification: "retain",
    reason: "Thống kê tổng hợp ẩn danh hiệu quả màn chơi",
    legalBasis: "BR-TLM-01",
  },
  {
    tableName: "skill_daily_stats",
    classification: "retain",
    reason: "Thống kê tổng hợp ẩn danh độ khó kỹ năng",
    legalBasis: "BR-TLM-01",
  },
] as const;

export const PURGE_TABLE_MAP: ReadonlyMap<string, TablePurgeMetadata> = new Map(
  PURGE_TABLE_CLASSIFICATIONS.map((entry) => [entry.tableName, entry])
);

/**
 * D-IF Gate: Validates that all active schema tables are explicitly classified.
 * Throws an error listing unclassified tables if any are detected.
 */
export function validateSchemaTablesClassified(
  discoveredTableNames: readonly string[]
): {
  totalClassified: number;
  unclassified: readonly string[];
} {
  const unclassified = discoveredTableNames.filter(
    (name) => !PURGE_TABLE_MAP.has(name)
  );

  if (unclassified.length > 0) {
    throw new Error(
      `D-IF GATE VIOLATION: ${unclassified.length} bảng DB chưa được phân loại phạm vi purge (delete/anonymize/retain): ${unclassified.join(", ")}`
    );
  }

  return {
    totalClassified: PURGE_TABLE_CLASSIFICATIONS.length,
    unclassified: [],
  };
}
