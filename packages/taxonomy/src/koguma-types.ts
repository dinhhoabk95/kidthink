import type { ContentThemeCode } from "@mindkid/shared/client";
import { KOGUMA_UNIT_SCHEDULES } from "./koguma-schedules.js";

export type KogumaAgeBand = "3-4" | "4-5" | "5-6";

export type KogumaPillarCode = "K1" | "K2" | "K3" | "K4" | "K5";

export type KogumaTrack = "core_12w" | "year_36w";

export type KogumaStage = 1 | 2;

export type KogumaVariantCode = "01" | "02" | "year-01" | "year-02";

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
  readonly short_title_vi: string;
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

export interface KogumaMoetThemePublic {
  readonly id: MoetPreschoolThemeId;
  readonly order: number;
  readonly title_vi: string;
  readonly roadmap_label_vi: string;
  readonly week_start: number;
  readonly week_end: number;
}

export interface KogumaTaiwaPromptsByBand {
  readonly "3-4": string;
  readonly "4-5": string;
  readonly "5-6": string;
}

export interface KogumaRawUnitInput {
  readonly unit_code: string;
  readonly pillar: KogumaPillarCode;
  readonly age_band: KogumaAgeBand;
  readonly title_vi: string;
  readonly kuno_concept_ja: string;
  readonly primary_skill_code: string;
  readonly support_skill_codes: readonly string[];
  readonly recommended_templates: readonly string[];
  readonly moet_theme: MoetPreschoolThemeId;
  readonly content_theme: ContentThemeCode;
  readonly concrete_manipulative_vi: string;
  readonly taiwa_parent_prompt_vi: string;
  readonly offscreen_parent_activity?: Partial<KogumaTaiwaPromptsByBand>;
}

export interface KogumaUnitSchedule {
  readonly unit_code: string;
  readonly age_band: KogumaAgeBand;
  readonly primary_skill_code: string;
  readonly scheduled_roadmap_code: string;
  readonly scheduled_curriculum_code: string;
  readonly scheduled_week_no: number;
  readonly scheduled_core_roadmap_code: string | null;
  readonly scheduled_core_week_no: number | null;
}

export interface KogumaSiblingTrackInfo {
  readonly variant: KogumaVariantCode;
  readonly koguma_track: KogumaTrack;
  readonly koguma_stage: KogumaStage;
  readonly roadmap_code: string;
  readonly curriculum_code: string;
  readonly duration_weeks: 12 | 36;
  readonly label_vi: string;
  readonly short_label_vi: string;
}

export interface KogumaUnitDef {
  readonly unit_code: string;
  readonly code: string;
  readonly pillar: KogumaPillarCode;
  readonly pillar_code: KogumaPillarCode;
  readonly age_band: KogumaAgeBand;
  readonly title_vi: string;
  readonly kuno_concept_ja: string;
  readonly primary_skill_code: string;
  readonly support_skill_codes: readonly string[];
  readonly recommended_templates: readonly string[];
  readonly moet_theme: MoetPreschoolThemeId;
  readonly moet_theme_title: string;
  readonly content_theme: ContentThemeCode;
  readonly concrete_manipulative_vi: string;
  readonly jibutsu_manipulative_vi: string;
  readonly taiwa_parent_prompt_vi: string;
  readonly offscreen_parent_activity: KogumaTaiwaPromptsByBand;
  readonly roadmap_code: string;
  readonly curriculum_code: string;
  readonly core_roadmap_code: string;
  readonly core_curriculum_code: string;
  readonly scheduled_roadmap_code: string;
  readonly scheduled_curriculum_code: string;
  readonly scheduled_week_no: number;
  readonly scheduled_core_roadmap_code: string | null;
  readonly scheduled_core_week_no: number | null;
}

export interface KogumaUnitSummary {
  readonly code: string;
  readonly title_vi: string;
  readonly pillar_code: KogumaPillarCode;
  readonly pillar_title_vi: string;
  readonly moet_theme_id: MoetPreschoolThemeId;
  readonly moet_theme_title: string;
  readonly jibutsu_manipulative_vi: string;
  readonly taiwa_parent_prompt_vi: string;
  readonly primary_skill_code: string;
  readonly age_band: KogumaAgeBand;
  readonly scheduled_roadmap_code: string;
  readonly scheduled_curriculum_code: string;
  readonly scheduled_week_no: number;
  readonly scheduled_core_roadmap_code: string | null;
  readonly scheduled_core_week_no: number | null;
}

export interface KogumaPillarShare {
  readonly code: KogumaPillarCode;
  readonly title_vi: string;
  readonly short_title_vi: string;
  readonly count: number;
  readonly share: number;
}

export interface KogumaProgramMeta {
  readonly is_koguma: boolean;
  readonly koguma_track: KogumaTrack | null;
  readonly koguma_stage: KogumaStage | null;
  readonly koguma_variant: KogumaVariantCode | null;
  readonly koguma_track_label_vi: string | null;
  readonly age_band: KogumaAgeBand | null;
  readonly roadmap_code: string;
  readonly curriculum_code: string;
  readonly moet_themes: readonly KogumaMoetThemePublic[];
}

export const KOGUMA_DOMAINS: readonly KogumaDomainDef[] = [
  {
    code: "K1",
    title_vi: "Vị trí – Không gian & Đại lượng trực quan",
    short_title_vi: "Vị trí – Không gian",
    kuno_domain_ja: "位置表象・未測量",
    competency_codes: ["C1", "C2"],
    unit_counts: { "3-4": 6, "4-5": 7, "5-6": 7, total: 20 },
  },
  {
    code: "K2",
    title_vi: "Số lượng & Cấu tạo số",
    short_title_vi: "Số lượng",
    kuno_domain_ja: "数",
    competency_codes: ["C1"],
    unit_counts: { "3-4": 6, "4-5": 8, "5-6": 8, total: 22 },
  },
  {
    code: "K3",
    title_vi: "Hình học & Cấu trúc khối",
    short_title_vi: "Hình học",
    kuno_domain_ja: "図形",
    competency_codes: ["C2"],
    unit_counts: { "3-4": 4, "4-5": 5, "5-6": 7, total: 16 },
  },
  {
    code: "K4",
    title_vi: "Ngôn ngữ tư duy & Tiền đọc viết Việt",
    short_title_vi: "Ngôn ngữ tư duy",
    kuno_domain_ja: "言語",
    competency_codes: ["C5"],
    unit_counts: { "3-4": 5, "4-5": 6, "5-6": 7, total: 18 },
  },
  {
    code: "K5",
    title_vi: "Logic – Phân loại – Quan sát & Điều hành",
    short_title_vi: "Logic – Quan sát – Điều hành",
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

const MOET_THEME_MAP = new Map<MoetPreschoolThemeId, MoetPreschoolThemeDef>(
  MOET_PRESCHOOL_THEMES.map((t) => [t.id, t])
);

function buildDefaultBandActivities(
  basePrompt: string,
  manipulative: string
): KogumaTaiwaPromptsByBand {
  return {
    "3-4": `${basePrompt} (Gợi ý lớp Mầm 3–4 tuổi: cho bé chạm tay trực tiếp vào ${manipulative.toLowerCase()} rồi chỉ và gọi tên nhẹ nhàng.)`,
    "4-5": `${basePrompt} (Gợi ý lớp Chồi 4–5 tuổi: mời bé tự tay sắp xếp ${manipulative.toLowerCase()} và kể lại bằng câu trọn vẹn.)`,
    "5-6": `${basePrompt} (Gợi ý lớp Lá 5–6 tuổi: đố bé thử thêm một cách xếp khác với ${manipulative.toLowerCase()} và giải thích vì sao.)`,
  };
}

export function hydrateKogumaUnit(raw: KogumaRawUnitInput): KogumaUnitDef {
  const themeDef = MOET_THEME_MAP.get(raw.moet_theme);
  const moetThemeTitle = themeDef?.title_vi ?? "Trường mầm non";
  const defaults = buildDefaultBandActivities(
    raw.taiwa_parent_prompt_vi,
    raw.concrete_manipulative_vi
  );
  const offscreen: KogumaTaiwaPromptsByBand = {
    "3-4":
      raw.offscreen_parent_activity?.["3-4"] ??
      (raw.age_band === "3-4" ? raw.taiwa_parent_prompt_vi : defaults["3-4"]),
    "4-5":
      raw.offscreen_parent_activity?.["4-5"] ??
      (raw.age_band === "4-5" ? raw.taiwa_parent_prompt_vi : defaults["4-5"]),
    "5-6":
      raw.offscreen_parent_activity?.["5-6"] ??
      (raw.age_band === "5-6" ? raw.taiwa_parent_prompt_vi : defaults["5-6"]),
  };

  const schedule = KOGUMA_UNIT_SCHEDULES[raw.unit_code];
  if (!schedule) {
    throw new Error(
      `Missing Koguma unit schedule entry for ${raw.unit_code} in koguma-schedules.ts`
    );
  }

  const scheduledRoadmapCode = schedule.scheduled_roadmap_code;
  const scheduledCurriculumCode = `CUR-${scheduledRoadmapCode}`;
  const coreRoadmapCode =
    schedule.scheduled_core_roadmap_code ?? `RM-${raw.age_band}-koguma-01`;

  return {
    unit_code: raw.unit_code,
    code: raw.unit_code,
    pillar: raw.pillar,
    pillar_code: raw.pillar,
    age_band: raw.age_band,
    title_vi: raw.title_vi,
    kuno_concept_ja: raw.kuno_concept_ja,
    primary_skill_code: raw.primary_skill_code,
    support_skill_codes: raw.support_skill_codes,
    recommended_templates: raw.recommended_templates,
    moet_theme: raw.moet_theme,
    moet_theme_title: moetThemeTitle,
    content_theme: raw.content_theme,
    concrete_manipulative_vi: raw.concrete_manipulative_vi,
    jibutsu_manipulative_vi: raw.concrete_manipulative_vi,
    taiwa_parent_prompt_vi: raw.taiwa_parent_prompt_vi,
    offscreen_parent_activity: offscreen,
    roadmap_code: scheduledRoadmapCode,
    curriculum_code: scheduledCurriculumCode,
    core_roadmap_code: coreRoadmapCode,
    core_curriculum_code: `CUR-${coreRoadmapCode}`,
    scheduled_roadmap_code: scheduledRoadmapCode,
    scheduled_curriculum_code: scheduledCurriculumCode,
    scheduled_week_no: schedule.scheduled_week_no,
    scheduled_core_roadmap_code: schedule.scheduled_core_roadmap_code,
    scheduled_core_week_no: schedule.scheduled_core_week_no,
  };
}
