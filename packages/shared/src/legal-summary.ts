export type ConsentType = "terms" | "privacy" | "child_data";

export interface PolicyConsentMetadata {
  readonly consentType: ConsentType;
  readonly slug: string;
  readonly titleVi: string;
  readonly lastUpdatedOn: string;
  readonly summaryVi: string;
  readonly isChildSpecific: boolean;
  readonly requiresConsent: boolean;
}

export const CONSENT_POLICY_MAP: Record<
  ConsentType,
  {
    slug: string;
    titleVi: string;
    lastUpdatedOn: string;
    summaryVi: string;
    isChildSpecific: boolean;
    requiresConsent: boolean;
  }
> = {
  terms: {
    slug: "terms",
    titleVi: "Điều khoản sử dụng dịch vụ",
    lastUpdatedOn: "2026-08-01",
    summaryVi:
      "Quy định quyền và nghĩa vụ của phụ huynh và nhà trường khi sử dụng nền tảng KidThink.",
    isChildSpecific: false,
    requiresConsent: true,
  },
  privacy: {
    slug: "privacy",
    titleVi: "Chính sách quyền riêng tư",
    lastUpdatedOn: "2026-08-01",
    summaryVi:
      "Cam kết bảo vệ dữ liệu cá nhân của phụ huynh và gia đình theo quy định pháp luật Việt Nam.",
    isChildSpecific: false,
    requiresConsent: true,
  },
  child_data: {
    slug: "child-privacy",
    titleVi: "Chính sách bảo vệ dữ liệu trẻ em",
    lastUpdatedOn: "2026-08-01",
    summaryVi:
      "Quy định chuyên biệt bảo vệ quyền riêng tư và an toàn thông tin trẻ em theo Nghị định 13/2023/NĐ-CP và Luật Trẻ em.",
    isChildSpecific: true,
    requiresConsent: true,
  },
};
