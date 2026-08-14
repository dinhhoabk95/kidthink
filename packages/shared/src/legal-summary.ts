export type ConsentType = "terms" | "privacy" | "child_data";

export interface PolicyConsentMetadata {
  readonly consentType: ConsentType;
  readonly slug: string;
  readonly title: string;
  readonly lastUpdatedOn: string;
  readonly summary: string;
  readonly isChildSpecific: boolean;
  readonly requiresConsent: boolean;
}

export const CONSENT_POLICY_MAP: Record<
  ConsentType,
  {
    slug: string;
    title: string;
    lastUpdatedOn: string;
    summary: string;
    isChildSpecific: boolean;
    requiresConsent: boolean;
  }
> = {
  terms: {
    slug: "terms",
    title: "Điều khoản sử dụng dịch vụ",
    lastUpdatedOn: "2026-08-01",
    summary:
      "Quy định quyền và nghĩa vụ của phụ huynh và nhà trường khi sử dụng nền tảng KidThink.",
    isChildSpecific: false,
    requiresConsent: true,
  },
  privacy: {
    slug: "privacy",
    title: "Chính sách quyền riêng tư",
    lastUpdatedOn: "2026-08-01",
    summary:
      "Cam kết bảo vệ dữ liệu cá nhân của phụ huynh và gia đình theo quy định pháp luật Việt Nam.",
    isChildSpecific: false,
    requiresConsent: true,
  },
  child_data: {
    slug: "child-privacy",
    title: "Chính sách bảo vệ dữ liệu trẻ em",
    lastUpdatedOn: "2026-08-01",
    summary:
      "Quy định chuyên biệt bảo vệ quyền riêng tư và an toàn thông tin trẻ em theo Nghị định 13/2023/NĐ-CP và Luật Trẻ em.",
    isChildSpecific: true,
    requiresConsent: true,
  },
};
