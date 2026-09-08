import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { MVP_TEMPLATES } from "../../src/generated/template-registry.js";

export interface EngineBehaviorViolation {
  readonly templateCode?: string;
  readonly file?: string;
  readonly rule: string;
  readonly message: string;
}

export interface BandDomainSummary {
  readonly band: "3-4" | "4-5" | "5-6";
  readonly engineCount: number;
  readonly domainCount: number;
  readonly domains: readonly string[];
  readonly target: number;
  readonly passed: boolean;
}

export interface EngineBehaviorGateResult {
  readonly totalEngines: number;
  readonly registryEngineCount: number;
  /** Số nguồn từ vựng tag đã soi cho BR-EBD-03. 0 nghĩa là luật KHÔNG được đo. */
  readonly taggingSourcesChecked: number;
  /** Engine chưa đủ hai kênh thắng cuộc (BR-EBD-07). Bậc thang cấm tăng. */
  readonly channelDebt: readonly string[];
  readonly bandSummaries: readonly BandDomainSummary[];
  readonly violations: readonly EngineBehaviorViolation[];
}

export const ALLOWED_DOMAINS = [
  "chi-dinh",
  "van-chuyen",
  "sap-dat",
  "dieu-chinh",
  "lan-net",
  "kien-tao",
] as const;

export type BehaviorDomain = (typeof ALLOWED_DOMAINS)[number];

export const ALLOWED_NHIP = ["tu-do", "nhip-de", "thoi-gian-that"] as const;

export type BehaviorNhip = (typeof ALLOWED_NHIP)[number];

export const GT_CODE_REGEX = /^GT-\d{3}$/;

export const EngineBehaviorEntrySchema = z.object({
  mien: z.string(),
  mien_phu: z.string().nullable(),
  nhip: z.string(),
});

export type EngineBehaviorEntry = z.infer<typeof EngineBehaviorEntrySchema>;

export const EngineBehaviorConfigSchema = z.object({
  domains: z.array(z.string()).min(1),
  nhip: z.array(z.string()).min(1),
  engines: z.record(z.string().regex(GT_CODE_REGEX), EngineBehaviorEntrySchema),
});

export type EngineBehaviorConfig = z.infer<typeof EngineBehaviorConfigSchema>;

/**
 * Bậc thang nằm ở tệp riêng, không nằm cùng tệp dữ liệu nó canh. Cùng một sửa
 * đổi vừa bỏ một miền vừa hạ sàn là cách bậc thang chết lặng lẽ.
 */
export const EngineBehaviorBaselineSchema = z.object({
  min_domains_per_band: z.object({
    "3-4": z.number().int().positive(),
    "4-5": z.number().int().positive(),
    "5-6": z.number().int().positive(),
  }),
  max_engines_below_two_channels: z.number().int().nonnegative(),
});

export type EngineBehaviorBaseline = z.infer<
  typeof EngineBehaviorBaselineSchema
>;

export interface TemplateAgeLimits {
  readonly age_min: number;
  readonly age_max: number;
  readonly banned_age_bands?: readonly string[];
}

export interface ScanEngineBehaviorGateOptions {
  readonly specsDir?: string;
  /** Nguồn từ vựng tag để kiểm BR-EBD-03 (schema tagging + spec content-tagging). */
  readonly taggingSources?: readonly string[];
  readonly configPath?: string;
  readonly baselinePath?: string;
  readonly templatesRegistry?: Record<string, TemplateAgeLimits>;
  readonly customConfig?: EngineBehaviorConfig;
  readonly customBaseline?: EngineBehaviorBaseline;
}

const SECTION_17_HEADER_REGEX = /##\s*17\.\s*Miền hành vi/i;
const SECTION_18_HEADER_REGEX = /##\s*18\.\s*Trục biến thể và độ mở/i;
const SECTION_NEXT_REGEX = /##\s*19\./;

const MIEN_CHỦ_ĐẠO_REGEX = /\*\*Miền chủ đạo:\*\*\s*`([^`]+)`/;
const MIEN_PHU_REGEX = /\*\*Miền phụ:\*\*\s*([^·\n]+)/;
const BACKTICK_CAPTURE_REGEX = /`([^`]+)`/;
const NHIP_REGEX = /\*\*Ràng buộc nhịp:\*\*\s*`([^`]+)`/;

const OBS_HEADER_SEARCH_REGEX = /\|\s*Câu quan sát/i;
const OBS_HEADER_TEST_REGEX = /\|\s*Câu quan sát/i;
const TABLE_DIVIDER_REGEX = /\|\s*---/;

const PREREQ_HEADER_SEARCH_REGEX = /\*\*Điều kiện phát triển tiên quyết\*\*/i;
const PREREQ_HEADER_TEST_REGEX = /\|\s*Điều kiện\s*\|/i;

const REP_HEADER_SEARCH_REGEX = /\*\*Bậc biểu diễn theo band\*\*/i;
const REP_END_SEARCH_REGEX = /\n\s*\n|##\s*18\./;
const REP_SPLIT_REGEX = /`4-5`|`5-6`/;

const VAR_TABLE_SEARCH_REGEX = /\|\s*Trục\s*\|/i;
const VAR_TABLE_TEST_REGEX = /\|\s*Trục\s*\|/i;
const VAR_MULTI_VAL_REGEX = /\d+\s*chủ đề|≥\s*\d+/i;

const DO_MO_REGEX = /\*\*Độ mở\s*(?:\(`do_mo`\))?:\*\*\s*`([^`]+)`/;
const QUYEN_REGEX = /\*\*Quyền của trẻ\s*(?:\(`BR-EBD-09`\))?:\*\*\s*([^\n]+)/;

const FORBIDDEN_OBSERVATION_TERMS = [
  "chọn đáp án đúng",
  "hoàn thành lượt",
  "trả về true",
];

const FORBIDDEN_VARIANT_TERMS = ["đa dạng", "nhiều chủ đề", "phong phú"];

const ALLOWED_DO_MO = ["đóng", "bán mở", "mở"] as const;

const TAG_AXIS_ENUM_REGEX = /pgEnum\(\s*"tag_axis"\s*,\s*\[([^\]]*)\]/;
const TAG_AXIS_VALUE_REGEX = /"([^"]+)"/g;

/** Bốn trục tag đã đóng. Miền hành vi cấm trở thành trục thứ năm (BR-EBD-03). */
const ALLOWED_TAG_AXES = ["what", "thinking", "mechanic", "theme"] as const;

/** Tên gợi ý một trục tag miền hành vi đang bị lén thêm vào. */
/** Ba kênh mang thông tin thắng cuộc. Màu KHÔNG phải kênh (BR-EBD-07). */
const WIN_CHANNELS = ["hình", "âm", "ký hiệu"] as const;

const WIN_CHANNEL_REGEX = /\*\*Kênh thắng cuộc\*\*[^:]*:\s*([^\n]+)/;
const BACKTICK_ALL_REGEX = /`([^`]+)`/g;
const MIN_WIN_CHANNELS = 2;

const BEHAVIOR_TAG_TERMS = [
  "behavior_domain",
  "behavior-domain",
  "behaviour_domain",
  "mien_hanh_vi",
  "mien-hanh-vi",
];

const NHIP_SPEC_MAP: Record<string, string> = {
  "tu-do": "tự do",
  "nhip-de": "nhịp-đề",
  "thoi-gian-that": "thời-gian-thật",
};

export function isTemplateActiveForBand(
  template: TemplateAgeLimits,
  band: "3-4" | "4-5" | "5-6"
): boolean {
  if (template.banned_age_bands?.includes(band)) {
    return false;
  }
  if (band === "3-4") {
    return template.age_min <= 3 && template.age_max >= 3;
  }
  if (band === "4-5") {
    return template.age_min <= 4 && template.age_max >= 4;
  }
  return template.age_min <= 5 && template.age_max >= 5;
}

function parseConfig(
  configPath?: string,
  customConfig?: EngineBehaviorConfig,
  violations: EngineBehaviorViolation[] = []
): EngineBehaviorConfig | null {
  if (customConfig) {
    const result = EngineBehaviorConfigSchema.safeParse(customConfig);
    if (result.success) {
      return result.data;
    }
    violations.push({
      rule: "BR-EBD-01",
      message: `Custom config schema invalid: ${result.error.message}`,
    });
    return null;
  }

  if (!(configPath && existsSync(configPath))) {
    violations.push({
      file: configPath,
      rule: "BR-EBD-01",
      message: `Config file does not exist: ${configPath}`,
    });
    return null;
  }

  try {
    const rawContent = readFileSync(configPath, "utf-8");
    const jsonParsed: unknown = JSON.parse(rawContent);
    const result = EngineBehaviorConfigSchema.safeParse(jsonParsed);
    if (result.success) {
      return result.data;
    }
    violations.push({
      file: configPath,
      rule: "BR-EBD-01",
      message: `Config validation failed: ${result.error.message}`,
    });
    return null;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    violations.push({
      file: configPath,
      rule: "BR-EBD-01",
      message: `Failed to read or parse config file: ${errMsg}`,
    });
    return null;
  }
}

function parseBaseline(
  baselinePath?: string,
  customBaseline?: EngineBehaviorBaseline,
  violations: EngineBehaviorViolation[] = []
): EngineBehaviorBaseline | null {
  if (customBaseline) {
    const result = EngineBehaviorBaselineSchema.safeParse(customBaseline);
    if (result.success) {
      return result.data;
    }
    violations.push({
      rule: "BR-EBD-04",
      message: `Bậc thang truyền vào sai schema: ${result.error.message}`,
    });
    return null;
  }

  if (!(baselinePath && existsSync(baselinePath))) {
    violations.push({
      file: baselinePath,
      rule: "BR-EBD-04",
      message: `Tệp bậc thang không tồn tại: ${baselinePath}`,
    });
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(baselinePath, "utf-8"));
    const result = EngineBehaviorBaselineSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    violations.push({
      file: baselinePath,
      rule: "BR-EBD-04",
      message: `Bậc thang sai schema: ${result.error.message}`,
    });
    return null;
  } catch (err: unknown) {
    violations.push({
      file: baselinePath,
      rule: "BR-EBD-04",
      message: `Không đọc được tệp bậc thang: ${err instanceof Error ? err.message : String(err)}`,
    });
    return null;
  }
}

function extractSectionContent(
  fullContent: string,
  startRegex: RegExp,
  endRegex?: RegExp
): string {
  const startMatch = startRegex.exec(fullContent);
  if (!startMatch || startMatch.index === undefined) {
    return "";
  }
  const startIndex = startMatch.index + startMatch[0].length;
  const rest = fullContent.slice(startIndex);
  if (!endRegex) {
    return rest;
  }
  const endMatch = endRegex.exec(rest);
  if (!endMatch || endMatch.index === undefined) {
    return rest;
  }
  return rest.slice(0, endMatch.index);
}

function checkPrimaryDomain(
  code: string,
  specPath: string,
  section17: string,
  entry: EngineBehaviorEntry,
  violations: EngineBehaviorViolation[]
): void {
  const mienMatch = section17.match(MIEN_CHỦ_ĐẠO_REGEX);
  if (!mienMatch) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-ESS-16",
      message: `${code} mục 17 thiếu khai báo **Miền chủ đạo:**`,
    });
    return;
  }

  const specMien = mienMatch[1]?.trim() ?? "";
  if (specMien !== entry.mien) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-ESS-16",
      message: `${code} mục 17 ghi miền "${specMien}", cấu hình ghi "${entry.mien}"   LỆCH`,
    });
  }
}

function checkSecondaryDomain(
  code: string,
  specPath: string,
  section17: string,
  entry: EngineBehaviorEntry,
  violations: EngineBehaviorViolation[]
): void {
  const mienPhuMatch = section17.match(MIEN_PHU_REGEX);
  if (!mienPhuMatch) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-ESS-16",
      message: `${code} mục 17 thiếu khai báo **Miền phụ:**`,
    });
    return;
  }

  const specMienPhuRaw = mienPhuMatch[1]?.trim() ?? "";
  const hasBacktick = specMienPhuRaw.match(BACKTICK_CAPTURE_REGEX);
  const specMienPhu = hasBacktick?.[1]?.trim() ?? null;
  const isNone =
    specMienPhuRaw.includes("—") ||
    specMienPhuRaw === "-" ||
    specMienPhuRaw.toLowerCase().includes("không");

  if (entry.mien_phu === null) {
    if (specMienPhuRaw.length === 0) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-ESS-16",
        message: `${code} mục 17 bỏ trống miền phụ, phải ghi rõ "—" khi không có`,
      });
    } else if (!isNone) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-ESS-16",
        message: `${code} mục 17 ghi miền phụ "${specMienPhuRaw}", cấu hình ghi null   LỆCH`,
      });
    }
  } else if (specMienPhu !== entry.mien_phu) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-ESS-16",
      message: `${code} mục 17 ghi miền phụ "${specMienPhuRaw}", cấu hình ghi "${entry.mien_phu}"   LỆCH`,
    });
  }
}

function checkRhythmDeclaration(
  code: string,
  specPath: string,
  section17: string,
  entry: EngineBehaviorEntry,
  violations: EngineBehaviorViolation[]
): void {
  const nhipMatch = section17.match(NHIP_REGEX);
  if (!nhipMatch) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-ESS-16",
      message: `${code} mục 17 thiếu khai báo **Ràng buộc nhịp:**`,
    });
    return;
  }

  const specNhip = nhipMatch[1]?.trim() ?? "";
  const expectedSpecNhip = NHIP_SPEC_MAP[entry.nhip] ?? entry.nhip;
  if (specNhip !== expectedSpecNhip) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-ESS-16",
      message: `${code} mục 17 ghi ràng buộc nhịp "${specNhip}", cấu hình ghi "${expectedSpecNhip}"   LỆCH`,
    });
  }
}

function parseObservationRows(
  code: string,
  specPath: string,
  section17: string,
  violations: EngineBehaviorViolation[]
): string[] | null {
  const obsIndex = section17.search(OBS_HEADER_SEARCH_REGEX);
  if (obsIndex === -1) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-05",
      message: `${code} mục 17 thiếu bảng câu quan sát`,
    });
    return null;
  }

  const obsLines = section17.slice(obsIndex).split("\n");
  const dataRows: string[] = [];
  for (const line of obsLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (dataRows.length > 0) {
        break;
      }
      continue;
    }
    if (
      OBS_HEADER_TEST_REGEX.test(trimmed) ||
      TABLE_DIVIDER_REGEX.test(trimmed)
    ) {
      continue;
    }
    dataRows.push(trimmed);
  }

  if (dataRows.length === 0) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-05",
      message: `${code} mục 17 bảng câu quan sát không có hàng dữ liệu nào`,
    });
    return null;
  }

  return dataRows;
}

function validateObservationRows(
  code: string,
  specPath: string,
  dataRows: string[],
  violations: EngineBehaviorViolation[]
): void {
  for (const row of dataRows) {
    const sentence = row.split("|")[1]?.trim() ?? "";
    if (sentence.length === 0) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-EBD-05",
        message: `${code} bảng câu quan sát có hàng bỏ trống ô câu quan sát`,
      });
    }

    const lower = row.toLowerCase();
    for (const forbidden of FORBIDDEN_OBSERVATION_TERMS) {
      if (lower.includes(forbidden)) {
        violations.push({
          templateCode: code,
          file: specPath,
          rule: "BR-EBD-05",
          message: `${code} câu quan sát chứa từ kỹ thuật bị cấm: "${forbidden}"`,
        });
      }
    }
  }
}

function checkObservationTable(
  code: string,
  specPath: string,
  section17: string,
  violations: EngineBehaviorViolation[]
): void {
  const dataRows = parseObservationRows(code, specPath, section17, violations);
  if (dataRows) {
    validateObservationRows(code, specPath, dataRows, violations);
  }
}

function checkPrerequisitesTable(
  code: string,
  specPath: string,
  section17: string,
  violations: EngineBehaviorViolation[]
): void {
  const prereqHeaderIndex = section17.search(PREREQ_HEADER_SEARCH_REGEX);
  if (prereqHeaderIndex === -1) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-06",
      message: `${code} mục 17 thiếu bảng **Điều kiện phát triển tiên quyết**`,
    });
    return;
  }

  const prereqLines = section17.slice(prereqHeaderIndex).split("\n");
  const dataRows: string[] = [];
  for (const line of prereqLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (dataRows.length > 0) {
        break;
      }
      continue;
    }
    if (
      PREREQ_HEADER_TEST_REGEX.test(trimmed) ||
      TABLE_DIVIDER_REGEX.test(trimmed)
    ) {
      continue;
    }
    dataRows.push(trimmed);
  }

  if (dataRows.length < 4) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-06",
      message: `${code} bảng điều kiện phát triển tiên quyết có ${dataRows.length} dòng, yêu cầu đủ 4 dòng`,
    });
    return;
  }

  const combined = dataRows.join(" ").toLowerCase();
  if (!combined.includes("vận động")) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-06",
      message: `${code} bảng điều kiện phát triển tiên quyết thiếu tiêu chí vận động`,
    });
  }
}

function checkRepresentationLadder(
  code: string,
  specPath: string,
  section17: string,
  templateInfo: TemplateAgeLimits | undefined,
  violations: EngineBehaviorViolation[]
): void {
  const repHeaderIndex = section17.search(REP_HEADER_SEARCH_REGEX);
  if (repHeaderIndex === -1) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-12",
      message: `${code} mục 17 thiếu dòng **Bậc biểu diễn theo band** (BR-EBD-12)`,
    });
    return;
  }

  if (!templateInfo) {
    return;
  }

  const afterRep = section17.slice(repHeaderIndex);
  const endParagraph = afterRep.search(REP_END_SEARCH_REGEX);
  const repParagraph = (
    endParagraph === -1 ? afterRep : afterRep.slice(0, endParagraph)
  ).replace(/\n/g, " ");

  const bands: ("3-4" | "4-5" | "5-6")[] = ["3-4", "4-5", "5-6"];
  for (const band of bands) {
    if (
      isTemplateActiveForBand(templateInfo, band) &&
      !repParagraph.includes(band)
    ) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-EBD-12",
        message: `${code} nhận band ${band} nhưng mục 17 chưa khai bậc biểu diễn cho band này`,
      });
    }
  }

  // Band 3-4 must not have symbol standing alone without physical object or image
  if (isTemplateActiveForBand(templateInfo, "3-4")) {
    const parts = repParagraph.split(REP_SPLIT_REGEX);
    const b34Part = parts[0] ?? "";
    if (
      b34Part.includes("ký hiệu") &&
      !b34Part.includes("vật") &&
      !b34Part.includes("hình")
    ) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-EBD-12",
        message: `${code} ở band 3-4 có bậc ký hiệu đứng một mình không kèm vật hoặc hình`,
      });
    }
  }
}

function checkRhythmConstraints(
  code: string,
  specPath: string,
  section17: string,
  entry: EngineBehaviorEntry,
  templateInfo: TemplateAgeLimits | undefined,
  violations: EngineBehaviorViolation[]
): void {
  if (entry.nhip === "thoi-gian-that") {
    if (templateInfo && isTemplateActiveForBand(templateInfo, "3-4")) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-EBD-11",
        message: `${code} có nhịp thời-gian-thật nhưng vẫn nhận band 3-4`,
      });
    }
    if (templateInfo && isTemplateActiveForBand(templateInfo, "4-5")) {
      const lower = section17.toLowerCase();
      const hasToleranceOrUntimed =
        lower.includes("dung sai") ||
        lower.includes("không tính giờ") ||
        lower.includes("không đếm giờ");
      if (!hasToleranceOrUntimed) {
        violations.push({
          templateCode: code,
          file: specPath,
          rule: "BR-EBD-11",
          message: `${code} nhịp thời-gian-thật nhận band 4-5 phải khai cửa sổ dung sai hoặc lối không tính giờ ở mục 17`,
        });
      }
    }
  } else if (entry.nhip === "nhip-de") {
    const hasStimulusTiming =
      section17.includes("Thời gian hiện đề theo band") ||
      section17.toLowerCase().includes("thời gian hiện đề");
    if (!hasStimulusTiming) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-EBD-11",
        message: `${code} có nhịp-đề phải khai thời gian hiện đề theo band ở mục 17`,
      });
    }
  }
}

/**
 * BR-EBD-07: thông tin cần để thắng phải đến qua >=2 kênh trong `hình` · `âm` ·
 * `ký hiệu`. Trẻ mầm non chưa đọc, một phần trẻ không phân biệt được màu, và
 * máy trong lớp thường tắt âm — một kênh duy nhất là một cửa đóng.
 *
 * Trả về true khi phiếu chưa đủ hai kênh, để cổng đếm nợ theo bậc thang.
 */
function checkWinChannels(
  code: string,
  specPath: string,
  section17: string,
  violations: EngineBehaviorViolation[]
): boolean {
  const match = WIN_CHANNEL_REGEX.exec(section17);
  if (!match?.[1]) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-07",
      message: `${code} mục 17 thiếu dòng **Kênh thắng cuộc**`,
    });
    return true;
  }

  const line = match[1];
  const declaredBeforeDash = line.split("—")[0] ?? "";
  const declared = [...declaredBeforeDash.matchAll(BACKTICK_ALL_REGEX)].map(
    (m) => (m[1] ?? "").trim()
  );

  const unknown = declared.filter(
    (value) => !WIN_CHANNELS.includes(value as (typeof WIN_CHANNELS)[number])
  );
  for (const value of unknown) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-07",
      message: `${code} khai kênh "${value}" ngoài ba kênh đóng (${WIN_CHANNELS.join(", ")}) — màu sắc cấm là kênh`,
    });
  }

  const valid = new Set(
    declared.filter((value) =>
      WIN_CHANNELS.includes(value as (typeof WIN_CHANNELS)[number])
    )
  );

  if (valid.size < MIN_WIN_CHANNELS) {
    // Chưa đủ hai kênh: đếm vào nợ bậc thang thay vì đỏ ngay, nhưng phiếu phải
    // tự khai NỢ để khoản nợ đó đọc được ở chính chỗ nó nằm.
    if (!line.includes("NỢ")) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-EBD-07",
        message: `${code} chỉ khai ${valid.size} kênh thắng cuộc, dưới mức hai kênh mà không ghi **NỢ**`,
      });
    }
    return true;
  }

  return false;
}

function checkSpecSection17(
  code: string,
  specPath: string,
  section17: string,
  entry: EngineBehaviorEntry,
  templateInfo: TemplateAgeLimits | undefined,
  violations: EngineBehaviorViolation[]
): boolean {
  checkPrimaryDomain(code, specPath, section17, entry, violations);
  checkSecondaryDomain(code, specPath, section17, entry, violations);
  checkRhythmDeclaration(code, specPath, section17, entry, violations);
  checkObservationTable(code, specPath, section17, violations);
  checkPrerequisitesTable(code, specPath, section17, violations);
  checkRepresentationLadder(
    code,
    specPath,
    section17,
    templateInfo,
    violations
  );
  checkRhythmConstraints(
    code,
    specPath,
    section17,
    entry,
    templateInfo,
    violations
  );
  return checkWinChannels(code, specPath, section17, violations);
}

function parseVariantRows(
  code: string,
  specPath: string,
  section18: string,
  violations: EngineBehaviorViolation[]
): string[] | null {
  const varTableIndex = section18.search(VAR_TABLE_SEARCH_REGEX);
  if (varTableIndex === -1) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-10",
      message: `${code} mục 18 thiếu bảng trục biến thể`,
    });
    return null;
  }

  const varLines = section18.slice(varTableIndex).split("\n");
  const dataRows: string[] = [];
  for (const line of varLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (dataRows.length > 0) {
        break;
      }
      continue;
    }
    if (
      VAR_TABLE_TEST_REGEX.test(trimmed) ||
      TABLE_DIVIDER_REGEX.test(trimmed)
    ) {
      continue;
    }
    dataRows.push(trimmed);
  }

  if (dataRows.length < 3) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-10",
      message: `${code} mục 18 chỉ có ${dataRows.length} trục biến thể, tối thiểu là 3`,
    });
    return null;
  }

  return dataRows;
}

function validateVariantRowValues(
  code: string,
  specPath: string,
  rowIndex: number,
  row: string,
  violations: EngineBehaviorViolation[]
): boolean {
  const lower = row.toLowerCase();
  for (const forbidden of FORBIDDEN_VARIANT_TERMS) {
    if (lower.includes(forbidden)) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-EBD-10",
        message: `${code} trục biến thể ở hàng ${rowIndex + 1} chứa từ chung chung bị cấm: "${forbidden}"`,
      });
    }
  }

  const cols = row
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (cols.length < 2) {
    return false;
  }

  const valCol = cols[1];
  if (!valCol) {
    return false;
  }

  if (valCol.includes("·")) {
    const parts = valCol
      .split("·")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length >= 2) {
      return true;
    }
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-10",
      message: `${code} trục biến thể ở hàng ${rowIndex + 1} phân tách bằng · phải có >= 2 giá trị`,
    });
    return false;
  }

  if (VAR_MULTI_VAL_REGEX.test(valCol)) {
    return true;
  }

  return false;
}

function checkVariantAxes(
  code: string,
  specPath: string,
  section18: string,
  violations: EngineBehaviorViolation[]
): void {
  const dataRows = parseVariantRows(code, specPath, section18, violations);
  if (!dataRows) {
    return;
  }

  let rowsWithMultipleValues = 0;
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row) {
      continue;
    }
    const isMultiple = validateVariantRowValues(
      code,
      specPath,
      i,
      row,
      violations
    );
    if (isMultiple) {
      rowsWithMultipleValues++;
    }
  }

  if (rowsWithMultipleValues === 0) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-10",
      message: `${code} bảng trục biến thể không có trục nào khai >= 2 giá trị cụ thể`,
    });
  }
}

function checkOpenness(
  code: string,
  specPath: string,
  section18: string,
  violations: EngineBehaviorViolation[]
): void {
  const doMoMatch = section18.match(DO_MO_REGEX);
  if (!doMoMatch) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-08",
      message: `${code} mục 18 thiếu khai báo độ mở do_mo`,
    });
    return;
  }

  const doMoVal = doMoMatch[1]?.trim() ?? "";
  const isClosed = doMoVal === "đóng";

  if (!ALLOWED_DO_MO.includes(doMoVal as (typeof ALLOWED_DO_MO)[number])) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-08",
      message: `${code} độ mở "${doMoVal}" không thuộc {${ALLOWED_DO_MO.join(", ")}}`,
    });
  }

  if (isClosed) {
    const doMoIndex = section18.indexOf(doMoMatch[0]);
    const doMoLine = section18.slice(
      doMoIndex,
      section18.indexOf("\n", doMoIndex)
    );
    if (!doMoLine.toLowerCase().includes("lý do cơ chế")) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-EBD-08",
        message: `${code} độ mở "đóng" phải kèm chữ "lý do cơ chế"`,
      });
    }
  }
}

function checkAgency(
  code: string,
  specPath: string,
  section18: string,
  violations: EngineBehaviorViolation[]
): void {
  const quyenMatch = section18.match(QUYEN_REGEX);
  const quyenVal = quyenMatch?.[1]?.trim() ?? "";
  if (quyenVal.length === 0) {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-EBD-09",
      message: `${code} mục 18 thiếu khai báo quyền của trẻ (BR-EBD-09)`,
    });
  }
}

function checkSpecSection18(
  code: string,
  specPath: string,
  section18: string,
  violations: EngineBehaviorViolation[]
): void {
  checkVariantAxes(code, specPath, section18, violations);
  checkOpenness(code, specPath, section18, violations);
  checkAgency(code, specPath, section18, violations);
}

export function lintSingleBehaviorSpec(
  code: string,
  content: string,
  entry: EngineBehaviorEntry,
  templateInfo?: TemplateAgeLimits,
  specPath = `${code}.md`,
  /** Nhận mã engine chưa đủ hai kênh thắng cuộc, để cổng đếm nợ bậc thang. */
  channelDebt?: string[]
): EngineBehaviorViolation[] {
  const violations: EngineBehaviorViolation[] = [];

  if (SECTION_17_HEADER_REGEX.test(content)) {
    const section17 = extractSectionContent(
      content,
      SECTION_17_HEADER_REGEX,
      SECTION_18_HEADER_REGEX
    );
    const inDebt = checkSpecSection17(
      code,
      specPath,
      section17,
      entry,
      templateInfo,
      violations
    );
    if (inDebt) {
      channelDebt?.push(code);
    }
  } else {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-ESS-16",
      message: `${code} thiếu mục 17: Miền hành vi`,
    });
    channelDebt?.push(code);
  }

  if (SECTION_18_HEADER_REGEX.test(content)) {
    const section18 = extractSectionContent(
      content,
      SECTION_18_HEADER_REGEX,
      SECTION_NEXT_REGEX
    );
    checkSpecSection18(code, specPath, section18, violations);
  } else {
    violations.push({
      templateCode: code,
      file: specPath,
      rule: "BR-ESS-17",
      message: `${code} thiếu mục 18: Trục biến thể và độ mở`,
    });
  }

  return violations;
}

function validateConfigVocabulary(
  code: string,
  entry: EngineBehaviorEntry,
  violations: EngineBehaviorViolation[]
): void {
  if (!ALLOWED_DOMAINS.includes(entry.mien as BehaviorDomain)) {
    violations.push({
      templateCode: code,
      rule: "BR-EBD-01",
      message: `${code} khai miền "${entry.mien}" ngoài từ vựng đóng (${ALLOWED_DOMAINS.join(", ")})`,
    });
  }

  if (entry.mien_phu !== null) {
    if (!ALLOWED_DOMAINS.includes(entry.mien_phu as BehaviorDomain)) {
      violations.push({
        templateCode: code,
        rule: "BR-EBD-01",
        message: `${code} khai miền phụ "${entry.mien_phu}" ngoài từ vựng đóng (${ALLOWED_DOMAINS.join(", ")})`,
      });
    }
    if (entry.mien === entry.mien_phu) {
      violations.push({
        templateCode: code,
        rule: "BR-EBD-02",
        message: `${code} khai hai miền chủ đạo hoặc trùng miền phụ "${entry.mien}"`,
      });
    }
  }

  if (!ALLOWED_NHIP.includes(entry.nhip as BehaviorNhip)) {
    violations.push({
      templateCode: code,
      rule: "BR-EBD-01",
      message: `${code} khai ràng buộc nhịp "${entry.nhip}" ngoài từ vựng đóng (${ALLOWED_NHIP.join(", ")})`,
    });
  }
}

function sameVocabulary(
  declared: readonly string[],
  allowed: readonly string[]
): boolean {
  return (
    declared.length === allowed.length &&
    allowed.every((value) => declared.includes(value))
  );
}

/**
 * `domains` và `nhip` trong cấu hình phải trùng đúng từ vựng đóng của
 * `engine-behavior-domain.md`. Không có phép kiểm này thì hai trường đó là
 * trang trí: sửa chúng không làm cổng đỏ (BR-EBD-01).
 */
function validateConfigVocabularyLists(
  config: EngineBehaviorConfig,
  violations: EngineBehaviorViolation[]
): void {
  if (!sameVocabulary(config.domains, ALLOWED_DOMAINS)) {
    violations.push({
      rule: "BR-EBD-01",
      message: `Cấu hình khai domains [${config.domains.join(", ")}], từ vựng đóng là [${ALLOWED_DOMAINS.join(", ")}]   LỆCH`,
    });
  }

  if (!sameVocabulary(config.nhip, ALLOWED_NHIP)) {
    violations.push({
      rule: "BR-EBD-01",
      message: `Cấu hình khai nhip [${config.nhip.join(", ")}], từ vựng đóng là [${ALLOWED_NHIP.join(", ")}]   LỆCH`,
    });
  }
}

/**
 * Registry và cấu hình phải phủ đúng cùng một tập mã. Thiếu phép kiểm này thì
 * một engine mới thêm vào registry không có hàng cấu hình sẽ bỏ qua toàn bộ
 * mười phép kiểm mà cổng vẫn xanh (BR-EBD-01).
 */
function checkRegistryReconciliation(
  config: EngineBehaviorConfig,
  templatesRegistry: Record<string, TemplateAgeLimits>,
  violations: EngineBehaviorViolation[]
): void {
  for (const code of Object.keys(templatesRegistry).sort()) {
    if (!config.engines[code]) {
      violations.push({
        templateCode: code,
        rule: "BR-EBD-01",
        message: `${code} có trong registry nhưng thiếu hàng trong engine-behavior-domain.json`,
      });
    }
  }

  for (const code of Object.keys(config.engines).sort()) {
    if (!templatesRegistry[code]) {
      violations.push({
        templateCode: code,
        rule: "BR-EBD-01",
        message: `${code} có trong engine-behavior-domain.json nhưng không có trong registry`,
      });
    }
  }
}

/**
 * BR-EBD-03: miền hành vi là **cách nhóm** một từ vựng đã đóng, cấm trở thành
 * trục tag thứ năm. Người soạn nội dung đã gánh bốn trục; trục thứ năm là ô bắt
 * buộc nữa trên vai họ, và corpus đã trả giá một lần vì trục nới lỏng.
 */
function checkBehaviorDomainNotATagAxis(
  taggingSources: readonly string[],
  violations: EngineBehaviorViolation[]
): void {
  for (const sourcePath of taggingSources) {
    if (!existsSync(sourcePath)) {
      violations.push({
        file: sourcePath,
        rule: "BR-EBD-03",
        message: `Không đọc được nguồn từ vựng tag để kiểm BR-EBD-03: ${sourcePath}`,
      });
      continue;
    }

    const content = readFileSync(sourcePath, "utf-8");
    const lower = content.toLowerCase();
    for (const term of BEHAVIOR_TAG_TERMS) {
      if (lower.includes(term)) {
        violations.push({
          file: sourcePath,
          rule: "BR-EBD-03",
          message: `Từ vựng tag nhắc "${term}" — miền hành vi cấm trở thành trục tag nội dung`,
        });
      }
    }

    const axisMatch = TAG_AXIS_ENUM_REGEX.exec(content);
    if (!axisMatch?.[1]) {
      continue;
    }
    const declared = [...axisMatch[1].matchAll(TAG_AXIS_VALUE_REGEX)].map(
      (m) => m[1] ?? ""
    );
    for (const axis of declared) {
      if (
        !ALLOWED_TAG_AXES.includes(axis as (typeof ALLOWED_TAG_AXES)[number])
      ) {
        violations.push({
          file: sourcePath,
          rule: "BR-EBD-03",
          message: `tag_axis khai trục "${axis}" ngoài bốn trục đóng (${ALLOWED_TAG_AXES.join(", ")})`,
        });
      }
    }
  }
}

function scanSpecSheets(
  specsDir: string | undefined,
  config: EngineBehaviorConfig,
  engineCodes: readonly string[],
  templatesRegistry: Record<string, TemplateAgeLimits>,
  violations: EngineBehaviorViolation[],
  channelDebt: string[]
): void {
  if (!(specsDir && existsSync(specsDir))) {
    return;
  }

  for (const code of engineCodes) {
    const entry = config.engines[code];
    if (!entry) {
      continue;
    }
    const specPath = join(specsDir, `${code}.md`);
    if (!existsSync(specPath)) {
      violations.push({
        templateCode: code,
        file: specPath,
        rule: "BR-ESS-01",
        message: `Phiếu spec không tồn tại cho ${code}: ${specPath}`,
      });
      continue;
    }

    const content = readFileSync(specPath, "utf-8");
    const templateInfo = templatesRegistry[code];
    const specViolations = lintSingleBehaviorSpec(
      code,
      content,
      entry,
      templateInfo,
      specPath,
      channelDebt
    );
    violations.push(...specViolations);
  }
}

function checkBandDomainFloors(
  config: EngineBehaviorConfig,
  baseline: EngineBehaviorBaseline,
  templatesRegistry: Record<string, TemplateAgeLimits>,
  violations: EngineBehaviorViolation[]
): BandDomainSummary[] {
  const bands: ("3-4" | "4-5" | "5-6")[] = ["3-4", "4-5", "5-6"];
  const bandSummaries: BandDomainSummary[] = [];

  for (const band of bands) {
    const target = baseline.min_domains_per_band[band];
    const activeEngines: string[] = [];
    const domainSet = new Set<string>();

    for (const [code, tInfo] of Object.entries(templatesRegistry)) {
      if (isTemplateActiveForBand(tInfo, band)) {
        activeEngines.push(code);
        const cfgEngine = config.engines[code];
        if (
          cfgEngine &&
          ALLOWED_DOMAINS.includes(cfgEngine.mien as BehaviorDomain)
        ) {
          domainSet.add(cfgEngine.mien);
        }
      }
    }

    const domainList = [...domainSet].sort();
    const passed = domainList.length >= target;

    bandSummaries.push({
      band,
      engineCount: activeEngines.length,
      domainCount: domainList.length,
      domains: domainList,
      target,
      passed,
    });

    if (!passed) {
      violations.push({
        rule: "BR-EBD-04",
        message: `Band ${band} chỉ có ${domainList.length} miền (${domainList.join(", ")}), dưới sàn bậc thang ratchet ${target}`,
      });
    }
  }

  return bandSummaries;
}

export function scanEngineBehaviorGate(
  options: ScanEngineBehaviorGateOptions = {}
): EngineBehaviorGateResult {
  const violations: EngineBehaviorViolation[] = [];
  const config = parseConfig(
    options.configPath,
    options.customConfig,
    violations
  );
  const baseline = parseBaseline(
    options.baselinePath,
    options.customBaseline,
    violations
  );

  if (!(config && baseline)) {
    return {
      totalEngines: 0,
      registryEngineCount: 0,
      taggingSourcesChecked: 0,
      channelDebt: [],
      bandSummaries: [],
      violations,
    };
  }

  const templatesRegistry = options.templatesRegistry ?? MVP_TEMPLATES;
  const engineCodes = Object.keys(config.engines).sort();

  validateConfigVocabularyLists(config, violations);
  checkRegistryReconciliation(config, templatesRegistry, violations);
  const taggingSources = options.taggingSources ?? [];
  checkBehaviorDomainNotATagAxis(taggingSources, violations);

  for (const code of engineCodes) {
    const entry = config.engines[code];
    if (entry) {
      validateConfigVocabulary(code, entry, violations);
    }
  }

  const channelDebt: string[] = [];
  scanSpecSheets(
    options.specsDir,
    config,
    engineCodes,
    templatesRegistry,
    violations,
    channelDebt
  );

  const channelCeiling = baseline.max_engines_below_two_channels;
  if (channelDebt.length > channelCeiling) {
    violations.push({
      rule: "BR-EBD-07",
      message: `${channelDebt.length} engine chưa đủ hai kênh thắng cuộc (${channelDebt.join(", ")}), vượt trần bậc thang ${channelCeiling}`,
    });
  }

  const bandSummaries = checkBandDomainFloors(
    config,
    baseline,
    templatesRegistry,
    violations
  );

  return {
    totalEngines: engineCodes.length,
    registryEngineCount: Object.keys(templatesRegistry).length,
    taggingSourcesChecked: taggingSources.length,
    channelDebt,
    bandSummaries,
    violations,
  };
}

export function formatEngineBehaviorReport(
  result: EngineBehaviorGateResult
): string {
  const lines: string[] = [];
  lines.push(
    "═════════════════════════════════════════════════════════════════"
  );
  lines.push(
    "              CỔNG MIỀN HÀNH VI ENGINE (Task #261)               "
  );
  lines.push(
    "═════════════════════════════════════════════════════════════════"
  );
  lines.push(
    `Tổng engine trong cấu hình: ${result.totalEngines} · trong registry: ${result.registryEngineCount}`
  );
  lines.push(
    result.taggingSourcesChecked > 0
      ? `BR-EBD-03 (miền không phải trục tag): đã soi ${result.taggingSourcesChecked} nguồn từ vựng tag`
      : "BR-EBD-03 (miền không phải trục tag): ✗ KHÔNG ĐO — thiếu nguồn từ vựng tag"
  );
  lines.push(
    `BR-EBD-07 (hai kênh thắng cuộc): ${result.channelDebt.length} engine còn nợ${
      result.channelDebt.length > 0 ? ` — ${result.channelDebt.join(", ")}` : ""
    }`
  );
  lines.push("");
  lines.push("Số miền hành vi theo band tuổi (BR-EBD-04):");

  for (const s of result.bandSummaries) {
    const status = s.passed ? "✓ ĐẠT" : "✗ DƯỚI SÀN";
    lines.push(
      `  • Band ${s.band}: ${s.domainCount}/6 miền (${s.domains.join(" · ")}) — ${s.engineCount} engine — sàn ≥${s.target} [${status}]`
    );
  }

  lines.push("");

  if (result.violations.length === 0) {
    lines.push(
      `✓ Toàn bộ ${result.totalEngines} engine đạt mọi phép kiểm miền hành vi (0 vi phạm).`
    );
  } else {
    lines.push(`✗ Phát hiện ${result.violations.length} vi phạm:`);
    for (const v of result.violations) {
      const prefix = v.templateCode ? `[${v.templateCode}] ` : "";
      lines.push(`  - [${v.rule}] ${prefix}${v.message}`);
    }
  }

  lines.push(
    "═════════════════════════════════════════════════════════════════"
  );
  return lines.join("\n");
}
