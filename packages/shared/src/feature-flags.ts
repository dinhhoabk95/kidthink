export interface FeatureFlagDefinition {
  key: string;
  nameVi: string;
  descriptionVi: string;
  defaultValue: boolean;
  expiresAt: string; // ISO string
  safeDefaultReason: string;
}

export const CODE_FEATURE_FLAGS: Record<string, FeatureFlagDefinition> = {
  ai_content_pipeline: {
    key: "ai_content_pipeline",
    nameVi: "Pipeline AI sinh nội dung",
    descriptionVi: "Bật/tắt tính năng hỗ trợ sinh nháp nội dung qua LLM",
    defaultValue: false,
    expiresAt: "2026-12-31T23:59:59.000Z",
    safeDefaultReason:
      "Mặc định tắt để đảm bảo kiểm soát chất lượng nội dung con người",
  },
  payment_soft_unlock: {
    key: "payment_soft_unlock",
    nameVi: "Mở khoá mềm thanh toán",
    descriptionVi: "Tự động kích hoạt gói tạm thời khi có uỷ nhiệm chi hợp lệ",
    defaultValue: true,
    expiresAt: "2026-12-31T23:59:59.000Z",
    safeDefaultReason:
      "Mặc định bật để phụ huynh có thể cho trẻ trải nghiệm ngay sau thanh toán",
  },
  weekly_progress_email: {
    key: "weekly_progress_email",
    nameVi: "Email báo cáo tuần cho phụ huynh",
    descriptionVi: "Tự động gửi email tổng kết tiến độ học tập hàng tuần",
    defaultValue: false,
    expiresAt: "2026-12-31T23:59:59.000Z",
    safeDefaultReason:
      "Mặc định tắt trong quá trình hoàn thiện mẫu email và tổng hợp số liệu",
  },
  studio_publish: {
    key: "studio_publish",
    nameVi: "Xuất bản nội dung từ Studio",
    descriptionVi: "Cho phép quản trị viên xuất bản nội dung ra production",
    defaultValue: true,
    expiresAt: "2027-06-30T23:59:59.000Z",
    safeDefaultReason:
      "Mặc định bật để hỗ trợ chu trình biên tập và phát hành liên tục",
  },
  guest_play: {
    key: "guest_play",
    nameVi: "Chơi thử không cần đăng nhập",
    descriptionVi: "Cho phép khách vãng lai trải nghiệm các level miễn phí",
    defaultValue: true,
    expiresAt: "2027-06-30T23:59:59.000Z",
    safeDefaultReason: "Mặc định bật để thu hút và tiếp cận người dùng mới",
  },
};

export type FeatureFlagKey = keyof typeof CODE_FEATURE_FLAGS;
