import type { ContentThemeCode } from "@mindkid/shared";
import type { RoadmapBand } from "./types.js";

export type KogumaPillarCode = "K1" | "K2" | "K3" | "K4" | "K5";

export type MoetPreschoolThemeId =
  | "mam_non"
  | "ban_than"
  | "gia_dinh"
  | "nghe_nghiep"
  | "thuc_vat"
  | "dong_vat"
  | "giao_thong"
  | "hien_tuong_tu_nhien"
  | "que_huong"
  | "tieu_hoc";

export type KogumaCompetencyCode = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";

export interface KogumaDomainDef {
  readonly code: KogumaPillarCode;
  readonly title_vi: string;
  readonly kuno_domain_ja: string;
  readonly competency_codes: readonly KogumaCompetencyCode[];
  readonly unit_counts: {
    readonly "3-4": number;
    readonly "4-5": number;
    readonly "5-6": number;
    readonly total: number;
  };
}

export interface MoetPreschoolThemeDef {
  readonly order: number;
  readonly id: MoetPreschoolThemeId;
  readonly title_vi: string;
  readonly roadmap_label_vi: string;
  readonly week_start: number;
  readonly week_end: number;
  readonly content_themes_by_band: {
    readonly "3-4": readonly ContentThemeCode[];
    readonly "4-5": readonly ContentThemeCode[];
    readonly "5-6": readonly ContentThemeCode[];
  };
}

export interface KogumaUnitSchedule {
  readonly unit_code: string;
  readonly age_band: RoadmapBand;
  readonly primary_skill_code: string;
  readonly scheduled_roadmap_code: string;
  readonly scheduled_week_no: number;
  readonly scheduled_core_roadmap_code: string | null;
  readonly scheduled_core_week_no: number | null;
}

export interface KogumaUnitDef {
  readonly unit_code: string;
  readonly pillar: KogumaPillarCode;
  readonly age_band: RoadmapBand;
  readonly title_vi: string;
  readonly kuno_concept_ja: string;
  readonly primary_skill_code: string;
  readonly support_skill_codes: readonly string[];
  readonly recommended_templates: readonly string[];
  readonly moet_theme: MoetPreschoolThemeId;
  readonly content_theme: ContentThemeCode;
  readonly concrete_manipulative_vi: string;
  readonly scheduled_roadmap_code: string;
  readonly scheduled_week_no: number;
  readonly scheduled_core_roadmap_code: string | null;
  readonly scheduled_core_week_no: number | null;
}

export const KOGUMA_DOMAINS: readonly KogumaDomainDef[] = [
  {
    code: "K1",
    title_vi: "Vị trí – Không gian & Đại lượng trực quan",
    kuno_domain_ja: "位置表象・未測量",
    competency_codes: ["C1", "C2"],
    unit_counts: { "3-4": 6, "4-5": 7, "5-6": 7, total: 20 },
  },
  {
    code: "K2",
    title_vi: "Số lượng & Cấu tạo số",
    kuno_domain_ja: "数",
    competency_codes: ["C1"],
    unit_counts: { "3-4": 6, "4-5": 8, "5-6": 8, total: 22 },
  },
  {
    code: "K3",
    title_vi: "Hình học & Cấu trúc khối",
    kuno_domain_ja: "図形",
    competency_codes: ["C2"],
    unit_counts: { "3-4": 4, "4-5": 5, "5-6": 7, total: 16 },
  },
  {
    code: "K4",
    title_vi: "Ngôn ngữ tư duy & Tiền đọc viết Việt",
    kuno_domain_ja: "言語",
    competency_codes: ["C5"],
    unit_counts: { "3-4": 5, "4-5": 6, "5-6": 7, total: 18 },
  },
  {
    code: "K5",
    title_vi: "Logic – Phân loại – Quan sát & Điều hành",
    kuno_domain_ja: "推理・分類・観察・記憶・常識",
    competency_codes: ["C3", "C4", "C6"],
    unit_counts: { "3-4": 7, "4-5": 8, "5-6": 9, total: 24 },
  },
];

export const KOGUMA_PILLARS: readonly KogumaDomainDef[] = KOGUMA_DOMAINS;

export const MOET_PRESCHOOL_THEMES: readonly MoetPreschoolThemeDef[] = [
  {
    order: 1,
    id: "mam_non",
    title_vi: "Trường mầm non",
    roadmap_label_vi: "Trường mầm non",
    week_start: 1,
    week_end: 3,
    content_themes_by_band: {
      "3-4": ["school"],
      "4-5": ["school"],
      "5-6": ["school"],
    },
  },
  {
    order: 2,
    id: "ban_than",
    title_vi: "Bản thân & Ngũ quan",
    roadmap_label_vi: "Bản thân",
    week_start: 4,
    week_end: 7,
    content_themes_by_band: {
      "3-4": ["body"],
      "4-5": ["body", "food"],
      "5-6": ["body", "school"],
    },
  },
  {
    order: 3,
    id: "gia_dinh",
    title_vi: "Gia đình & Ngôi nhà thân yêu",
    roadmap_label_vi: "Gia đình",
    week_start: 8,
    week_end: 10,
    content_themes_by_band: {
      "3-4": ["family", "home"],
      "4-5": ["family", "home"],
      "5-6": ["family", "home"],
    },
  },
  {
    order: 4,
    id: "nghe_nghiep",
    title_vi: "Nghề nghiệp quanh bé",
    roadmap_label_vi: "Nghề nghiệp",
    week_start: 11,
    week_end: 14,
    content_themes_by_band: {
      "3-4": ["job"],
      "4-5": ["job", "art"],
      "5-6": ["job", "art"],
    },
  },
  {
    order: 5,
    id: "thuc_vat",
    title_vi: "Thế giới thực vật & Quả quê",
    roadmap_label_vi: "Thế giới thực vật",
    week_start: 15,
    week_end: 18,
    content_themes_by_band: {
      "3-4": ["nature", "food"],
      "4-5": ["nature", "food"],
      "5-6": ["nature", "food"],
    },
  },
  {
    order: 6,
    id: "dong_vat",
    title_vi: "Thế giới động vật & Đại dương",
    roadmap_label_vi: "Thế giới động vật",
    week_start: 19,
    week_end: 22,
    content_themes_by_band: {
      "3-4": ["animal", "farm"],
      "4-5": ["animal", "farm", "ocean"],
      "5-6": ["animal", "farm", "ocean"],
    },
  },
  {
    order: 7,
    id: "giao_thong",
    title_vi: "Phương tiện & An toàn giao thông",
    roadmap_label_vi: "Phương tiện giao thông",
    week_start: 23,
    week_end: 25,
    content_themes_by_band: {
      "3-4": ["vehicle"],
      "4-5": ["vehicle"],
      "5-6": ["vehicle"],
    },
  },
  {
    order: 8,
    id: "hien_tuong_tu_nhien",
    title_vi: "Nước, Hiện tượng tự nhiên & Vũ trụ",
    roadmap_label_vi: "Nước & Hiện tượng tự nhiên",
    week_start: 26,
    week_end: 29,
    content_themes_by_band: {
      "3-4": ["weather"],
      "4-5": ["weather", "ocean"],
      "5-6": ["weather", "space", "ocean"],
    },
  },
  {
    order: 9,
    id: "que_huong",
    title_vi: "Quê hương – Đất nước – Bác Hồ",
    roadmap_label_vi: "Quê hương – Đất nước – Bác Hồ",
    week_start: 30,
    week_end: 33,
    content_themes_by_band: {
      "3-4": ["nature", "home"],
      "4-5": ["homeland"],
      "5-6": ["homeland"],
    },
  },
  {
    order: 10,
    id: "tieu_hoc",
    title_vi: "Tết, Lễ hội truyền thống & Hành trang lên lớp",
    roadmap_label_vi: "Tết và mùa lễ hội",
    week_start: 34,
    week_end: 36,
    content_themes_by_band: {
      "3-4": ["family", "food"],
      "4-5": ["festival"],
      "5-6": ["festival", "school"],
    },
  },
];
