/**
 * Sư phạm Vật thật & Đối thoại Koguma-kai / Kuno Method (Jibutsu & Taiwa Kyoiku).
 *
 * 1. Jibutsu (事物教育): Sự vật thật trước ký hiệu, thao tác trực quan trước chữ số.
 * 2. Taiwa (対話教育): Câu hỏi gợi mở lấy trẻ làm trung tâm theo 3 lứa tuổi
 *    Mầm (3–4), Chồi (4–5), Lá (5–6), câu ngắn ≤ 12 tiếng, 0 từ phủ định.
 */

export type PreschoolAgeGroup = "mam" | "choi" | "la";

export type KunoPillarCode = "K1" | "K2" | "K3" | "K4" | "K5";

export type KogumaDomainCode =
  | "spatial_perspective"
  | "quantity_concrete"
  | "shape_composition"
  | "language_executive"
  | "classification_logic";

export interface KogumaConcreteDomain {
  readonly code: KogumaDomainCode;
  readonly kuno_pillar: KunoPillarCode;
  readonly title_vi: string;
  readonly kuno_principle_vi: string;
  readonly scaffolding_hints: Readonly<
    Record<PreschoolAgeGroup, readonly string[]>
  >;
}

const WHITESPACE_SPLIT_RE = /\s+/;
const COMPOUND_VA_RE =
  /(?:^|\s)(?:và|vừa\s+\S+\s+vừa|cùng\s+với|đồng\s+thời)(?=\s|$|[,.!?])/i;
const FORBIDDEN_NEGATION_SUBSTRINGS = [
  "không",
  "đừng",
  "chớ",
  "never",
  "don't",
  "do not",
] as const;

export function resolvePreschoolAgeGroup(band?: string): PreschoolAgeGroup {
  if (band === "3-4") {
    return "mam";
  }
  if (band === "5-6" || band === "4-6") {
    return "la";
  }
  return "choi";
}

export function countPromptWords(text: string): number {
  return text.trim().split(WHITESPACE_SPLIT_RE).filter(Boolean).length;
}

export function isChildSafePrompt(
  text: string,
  opts?: { readonly forbidConjunctionVa?: boolean }
): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 4 || trimmed.length > 80) {
    return false;
  }
  if (countPromptWords(trimmed) > 12) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  for (const banned of FORBIDDEN_NEGATION_SUBSTRINGS) {
    if (lower.includes(banned)) {
      return false;
    }
  }
  if (opts?.forbidConjunctionVa && COMPOUND_VA_RE.test(trimmed)) {
    return false;
  }
  return true;
}

export function sanitizeChildPrompt(
  candidate: string,
  fallback: string,
  opts?: { readonly forbidConjunctionVa?: boolean }
): string {
  const normalized = candidate.trim().replace(/\bsố\s+không\b/gi, "số 0");
  if (isChildSafePrompt(normalized, opts)) {
    return normalized;
  }
  const safeFallback = fallback.trim().replace(/\bsố\s+không\b/gi, "số 0");
  if (isChildSafePrompt(safeFallback, opts)) {
    return safeFallback;
  }
  return "Bé thử chạm chọn đáp án đúng nhé!";
}

export function pickAgeBandPrompt(
  band: string | undefined,
  variants: Readonly<Record<PreschoolAgeGroup, string>>,
  fallback: string,
  opts?: { readonly forbidConjunctionVa?: boolean }
): string {
  const group = resolvePreschoolAgeGroup(band);
  return sanitizeChildPrompt(variants[group], fallback, opts);
}

export const KOGUMA_CONCRETE_DOMAINS: readonly KogumaConcreteDomain[] = [
  {
    code: "spatial_perspective",
    kuno_pillar: "K1",
    title_vi: "Vị trí, Phương hướng & Đại lượng trực quan",
    kuno_principle_vi:
      "Trải nghiệm vị trí trên dưới trước sau và so trực tiếp bằng cơ thể",
    scaffolding_hints: {
      mam: [
        "Bé nhìn xem bạn nhỏ đứng ở đâu nhỉ?",
        "Mình dắt bạn đi từng bước về đích nhé!",
      ],
      choi: [
        "Đố bé rẽ lối nào tới nhanh hơn nhỉ?",
        "Đĩa cân trĩu xuống là bên nặng hơn đấy!",
      ],
      la: [
        "Dáng cốc cao thấp khác nhau, lượng nước sao nhỉ?",
        "Nếu đứng phía đối diện thì bên phải ở đâu?",
      ],
    },
  },
  {
    code: "quantity_concrete",
    kuno_pillar: "K2",
    title_vi: "Số lượng & Cấu tạo số từ vật thật",
    kuno_principle_vi:
      "Chạm đếm vật rời, gộp tách trực quan trước khi nhìn chữ số",
    scaffolding_hints: {
      mam: [
        "Bé chạm tay đếm từng bạn một nhé!",
        "Mình xếp thẳng hàng rồi đếm thử xem!",
      ],
      choi: [
        "Đố bé gộp hai giỏ lại được mấy nhỉ?",
        "Bé thử tách ra hai đĩa xem sao nhé!",
      ],
      la: [
        "Vì sao hai cách chia vẫn bằng nhau nhỉ?",
        "Đố bé gom theo từng đôi đếm thật nhanh!",
      ],
    },
  },
  {
    code: "shape_composition",
    kuno_pillar: "K3",
    title_vi: "Hình học & Cấu trúc khối gỗ",
    kuno_principle_vi:
      "Xoay, lật, ghép mảnh gỗ để tự tay khám phá cấu trúc hình",
    scaffolding_hints: {
      mam: [
        "Bé thử ướm mảnh ghép vào bóng mờ nhé!",
        "Mình lướt ngón tay nối theo chấm tròn nào!",
      ],
      choi: [
        "Đố bé xoay nhẹ mảnh hình cho vừa khít nhé!",
        "Bé thử nhìn qua gương xem hình đổi thế nào!",
      ],
      la: [
        "Đố bé đếm đủ các khối gỗ xếp chồng lên nhau!",
        "Bé ghép nửa hoa văn đối xứng qua trục nhé!",
      ],
    },
  },
  {
    code: "language_executive",
    kuno_pillar: "K4",
    title_vi: "Ngôn ngữ tư duy, Đồng dao & Tiền đọc viết Việt",
    kuno_principle_vi:
      "Lắng nghe trọn câu chuyện, giữ nhịp đồng dao và diễn đạt mạch lạc",
    scaffolding_hints: {
      mam: [
        "Bé lắng tai nghe rồi chạm đúng hình nhé!",
        "Mình cùng vỗ tay theo nhịp trống vui nào!",
      ],
      choi: [
        "Đố bé nghe tiếng đầu giống với từ nào nhỉ?",
        "Bé sắp xếp các bức tranh theo đúng chuyện kể nhé!",
      ],
      la: [
        "Vì sao hai tiếng này lại bắt vần với nhau nhỉ?",
        "Đố bé nghe nhịp trống rồi gõ nối tiếp thật chuẩn!",
      ],
    },
  },
  {
    code: "classification_logic",
    kuno_pillar: "K5",
    title_vi: "Logic, Phân loại, Quan sát & Điều hành",
    kuno_principle_vi:
      "Tìm quy luật trực quan, loại trừ manh mối và đổi luật linh hoạt",
    scaffolding_hints: {
      mam: [
        "Bé bỏ các bạn cùng loại vào chung giỏ nhé!",
        "Mình tìm hai thẻ giống hệt nhau nào!",
      ],
      choi: [
        "Đố bé nhớ vừa thoáng qua mấy bạn nhỏ nhỉ?",
        "Bé mở từng manh mối để đoán vật bí mật nhé!",
      ],
      la: [
        "Bé nhìn kỹ cả hàng ngang lẫn cột dọc nhé!",
        "Tín hiệu đổi rồi, mình đổi cách chọn ngay nhé!",
      ],
    },
  },
] as const;

export function getKogumaScaffoldingHint(
  domain: KogumaDomainCode,
  band?: string,
  index = 0
): string {
  const entry = KOGUMA_CONCRETE_DOMAINS.find((d) => d.code === domain);
  const group = resolvePreschoolAgeGroup(band);
  const hints = entry?.scaffolding_hints[group] ?? [
    "Bé thử quan sát kỹ rồi chạm chọn nhé!",
  ];
  return hints[Math.abs(index) % hints.length] ?? hints[0] ?? "";
}
