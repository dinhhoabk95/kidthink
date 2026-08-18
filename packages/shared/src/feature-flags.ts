export interface FeatureFlagDefinition {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  expiresAt: string; // ISO string
  safeDefaultReason: string;
}

export const CODE_FEATURE_FLAGS: Record<string, FeatureFlagDefinition> = {
  ai_content_pipeline: {
    key: "ai_content_pipeline",
    name: "Pipeline AI sinh nội dung",
    description: "Bật/tắt tính năng hỗ trợ sinh nháp nội dung qua LLM",
    defaultValue: false,
    expiresAt: "2026-12-31T23:59:59.000Z",
    safeDefaultReason:
      "Mặc định tắt để đảm bảo kiểm soát chất lượng nội dung con người",
  },
  payment_soft_unlock: {
    key: "payment_soft_unlock",
    name: "Mở khoá mềm thanh toán",
    description: "Tự động kích hoạt gói tạm thời khi có uỷ nhiệm chi hợp lệ",
    defaultValue: true,
    expiresAt: "2026-12-31T23:59:59.000Z",
    safeDefaultReason:
      "Mặc định bật để người dùng có thể cho trẻ trải nghiệm ngay sau thanh toán",
  },
  weekly_progress_email: {
    key: "weekly_progress_email",
    name: "Email báo cáo tuần cho người lớn",
    description: "Tự động gửi email tổng kết tiến độ học tập hàng tuần",
    defaultValue: false,
    expiresAt: "2026-12-31T23:59:59.000Z",
    safeDefaultReason:
      "Mặc định tắt trong quá trình hoàn thiện mẫu email và tổng hợp số liệu",
  },
  studio_publish: {
    key: "studio_publish",
    name: "Xuất bản nội dung từ Studio",
    description: "Cho phép quản trị viên xuất bản nội dung ra production",
    defaultValue: true,
    expiresAt: "2027-06-30T23:59:59.000Z",
    safeDefaultReason:
      "Mặc định bật để hỗ trợ chu trình biên tập và phát hành liên tục",
  },
  guest_play: {
    key: "guest_play",
    name: "Chơi thử không cần đăng nhập",
    description: "Cho phép khách vãng lai trải nghiệm các level miễn phí",
    defaultValue: true,
    expiresAt: "2027-06-30T23:59:59.000Z",
    safeDefaultReason: "Mặc định bật để thu hút và tiếp cận người dùng mới",
  },
  worksheet_activity: {
    key: "worksheet_activity",
    name: "Hoạt động phiếu bài tập (Worksheet)",
    description: "Cho phép tạo và liên kết hoạt động dạng phiếu bài tập PDF",
    defaultValue: false,
    expiresAt: "2027-12-31T23:59:59.000Z",
    safeDefaultReason: "Tính năng worksheet thuộc Phase 4, mặc định tắt ở MVP",
  },
};

export type FeatureFlagKey = keyof typeof CODE_FEATURE_FLAGS;
