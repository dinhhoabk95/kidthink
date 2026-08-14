export type ConsentType = "terms" | "privacy" | "child_data";

export interface PolicyConsentMetadata {
  readonly consentType: ConsentType;
  readonly slug: string;
  readonly titleVi: string;
  readonly currentVersion: string;
  readonly effectiveDate: string;
  readonly summaryVi: string;
  readonly isChildSpecific: boolean;
  readonly requiresConsent: boolean;
}

export const CONSENT_POLICY_MAP: Record<
  ConsentType,
  {
    slug: string;
    titleVi: string;
    currentVersion: string;
    effectiveDate: string;
    summaryVi: string;
    isChildSpecific: boolean;
  }
> = {
  terms: {
    slug: "terms",
    titleVi: "Điều khoản sử dụng dịch vụ",
    currentVersion: "1.0",
    effectiveDate: "2026-08-01",
    summaryVi:
      "Quy định quyền và nghĩa vụ của phụ huynh và nhà trường khi sử dụng nền tảng KidThink.",
    isChildSpecific: false,
  },
  privacy: {
    slug: "privacy",
    titleVi: "Chính sách quyền riêng tư",
    currentVersion: "1.0",
    effectiveDate: "2026-08-01",
    summaryVi:
      "Cam kết bảo vệ dữ liệu cá nhân của phụ huynh và gia đình theo quy định pháp luật Việt Nam.",
    isChildSpecific: false,
  },
  child_data: {
    slug: "child-privacy",
    titleVi: "Chính sách bảo vệ dữ liệu trẻ em",
    currentVersion: "1.0",
    effectiveDate: "2026-08-01",
    summaryVi:
      "Quy định chuyên biệt bảo vệ quyền riêng tư và an toàn thông tin trẻ em theo Nghị định 13/2023/NĐ-CP và Luật Trẻ em.",
    isChildSpecific: true,
  },
};

/**
 * D-IH: Mandatory summary_vi for policy revisions.
 * Revisions CANNOT exist without a concise Vietnamese summary of changes.
 */
export function validatePolicyVersionSummary(
  version: string,
  summaryVi?: string | null
): boolean {
  if (typeof summaryVi !== "string" || summaryVi.trim().length === 0) {
    throw new Error(
      `D-IH VIOLATION: summary_vi là bắt buộc cho chính sách phiên bản ${version}`
    );
  }
  return true;
}
