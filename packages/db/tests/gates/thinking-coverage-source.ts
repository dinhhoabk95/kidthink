/**
 * Nguồn đọc của cổng đo phủ trục tư duy (BR-TCM-03).
 * Spec: docs/specs/08-quality/thinking-coverage-matrix.md
 *
 * Nguồn mặc định là **corpus seed trong repo**, không phải cơ sở dữ liệu dev.
 * Lý do đo được: cơ sở dữ liệu dev dùng chung `DATABASE_URL` với test tích hợp, nên nó
 * chứa 281 hàng `game_templates` (gồm `GT-999`, `GT-212`, … do test sinh) và 1854 hàng
 * `game_levels`. Đo trên đó thì ma trận phủ báo `C1 3-4: 1444` và năm competency còn lại
 * bằng 0 — một con số không nói gì về catalog thật.
 *
 * Corpus seed thì tất định, luôn đọc được, và là thứ được review qua PR.
 */

import type { ContentItem } from "./thinking-coverage.ts";

/** Một hàng seed không quy được về competency hoặc mechanic. */
export interface UnresolvedItem {
  code: string;
  reason: string;
}

export interface SeedCorpusLoad {
  items: ContentItem[];
  unresolved: UnresolvedItem[];
}

const COMPETENCY_FROM_LEVEL_CODE = /^GL-(C[1-6])-/;
const COMPETENCY_FROM_SKILL_CODE = /^(C[1-6])\./;

/** Band tuổi suy từ `age_min`, cùng luật với bảng ở game-level-model.md §7.1. */
function toAgeBand(ageMin: number): ContentItem["ageBand"] {
  if (ageMin <= 3) {
    return "3-4";
  }
  if (ageMin === 4) {
    return "4-5";
  }
  return "5-6";
}

/**
 * Quy một hàng seed về competency. Không có giá trị mặc định: quy không được thì trả
 * `null` để hàm gọi ghi vào `unresolved`. Giá trị mặc định `"C1"` của bản cũ là lý do
 * mọi thứ không quy được đều đổ dồn vào C1.
 */
function resolveCompetency(
  levelCode: string,
  skillCodes: readonly string[]
): string | null {
  const bySkill = skillCodes[0]?.match(COMPETENCY_FROM_SKILL_CODE)?.[1];
  if (bySkill) {
    return bySkill;
  }
  return levelCode.match(COMPETENCY_FROM_LEVEL_CODE)?.[1] ?? null;
}

interface SeedLevelHeader {
  code: string;
  template_code: string;
  age_min: number;
  skill_codes: string[];
  what_tags: string[];
  thinking_tags: string[];
  theme_tag?: string;
  origin: "human" | "ai_assisted";
}

interface SeedLevel {
  header: SeedLevelHeader;
}

/**
 * Đọc corpus seed và quy về `ContentItem[]`.
 *
 * `mechanicByTemplateCode` do hàm gọi cấp, lấy từ registry template đã sinh — trục
 * `mechanic` suy ra từ template, không nhập tay (content-tagging.md §7.1).
 */
export function mapSeedLevels(
  levels: readonly SeedLevel[],
  mechanicByTemplateCode: ReadonlyMap<string, string>
): SeedCorpusLoad {
  const items: ContentItem[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (const level of levels) {
    const h = level.header;
    const competencyCode = resolveCompetency(h.code, h.skill_codes);
    if (!competencyCode) {
      unresolved.push({
        code: h.code,
        reason: `không quy được competency từ skill_codes=[${h.skill_codes.join(", ")}] hay từ mã level`,
      });
      continue;
    }

    const mechanicCode = mechanicByTemplateCode.get(h.template_code);
    if (!mechanicCode) {
      unresolved.push({
        code: h.code,
        reason: `template_code "${h.template_code}" không có trong registry template`,
      });
      continue;
    }

    items.push({
      code: h.code,
      kind: "game_level",
      status: "published",
      competencyCode,
      ageBand: toAgeBand(h.age_min),
      templateCode: h.template_code,
      mechanicCode,
      whatTags: h.what_tags.length > 0 ? h.what_tags : undefined,
      thinkingTags: h.thinking_tags.length > 0 ? h.thinking_tags : undefined,
      themeTag: h.theme_tag,
      origin: h.origin,
    });
  }

  return { items, unresolved };
}

/** Nạp corpus seed thật từ `packages/db` và registry template của engine. */
export async function loadItemsFromSeedCorpus(): Promise<SeedCorpusLoad> {
  const [{ ALL_SEED_LEVELS }, { ALL_TEMPLATES }] = await Promise.all([
    import("#src/seed-content/index"),
    import("@mindkid/game-engine"),
  ]);

  const mechanicByTemplateCode = new Map<string, string>(
    Object.values(ALL_TEMPLATES).map((t) => [t.code, t.mechanic])
  );

  return mapSeedLevels(ALL_SEED_LEVELS, mechanicByTemplateCode);
}
