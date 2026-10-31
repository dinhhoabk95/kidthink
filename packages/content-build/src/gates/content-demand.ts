/**
 * Bộ suy cầu: đọc lộ trình soạn, in sổ cầu nội dung.
 *
 * Mỗi tiết của lộ trình sinh đúng một ô. Ô nêu kỹ năng, vai trò, band, số
 * lượng nội dung cần, và danh sách khuôn hợp lệ lấy từ ma trận tương hợp.
 * Phần lấp ô là phép tra theo kỹ năng và band — không có phép chia lấy dư,
 * không có thứ tự id, không mượn nội dung của kỹ năng khác. Ô nào kho chưa
 * có nội dung thì `filled_by` rỗng: đó là nợ, và nợ được ghi ra.
 */

import type {
  RoadmapBand,
  RoadmapSeed,
  RoadmapSession,
} from "@mindkid/content";
import { BAND_AGES } from "./roadmap-seed-gate.js";

export interface DemandLevel {
  readonly code: string;
  readonly skill_codes: readonly string[];
  readonly age_min: number;
  readonly age_max: number;
  readonly difficulty: number;
}

export interface DemandCell {
  readonly roadmap_code: string;
  readonly band: RoadmapBand;
  readonly week_no: number;
  readonly session_no: number;
  readonly role: RoadmapSession["role"];
  readonly skill_code: string;
  readonly topic_code: string | null;
  readonly template_codes: readonly string[];
  readonly level_quota: number;
  readonly filled_by: readonly string[];
}

export interface DemandSummary {
  readonly roadmap_code: string;
  readonly roadmap_version: number;
  readonly band: RoadmapBand;
  readonly cells: number;
  readonly filled_cells: number;
  readonly debt_cells: number;
}

export interface ContentDemandLedger {
  readonly ledger_version: 1;
  readonly summary: readonly DemandSummary[];
  readonly cells: readonly DemandCell[];
}

export interface DemandInput {
  readonly roadmaps: readonly RoadmapSeed[];
  readonly affinities: Readonly<Record<string, readonly string[]>>;
  readonly levels: readonly DemandLevel[];
  readonly difficultyMaxByBand: Readonly<Record<RoadmapBand, number>>;
}

// Một tiết thực hành chơi ba level liên tiếp trong khung 10 phút của vai trò
// practice; các tiết còn lại dùng đúng một level.
export const PRACTICE_LEVEL_QUOTA = 3;
export const SINGLE_LEVEL_QUOTA = 1;

// Thứ tự cấp nội dung: tiết giới thiệu được chọn trước; thực hành, ôn tập,
// ngoài màn hình chọn theo thứ tự ưu tiên.
const ROLE_PRIORITY: Readonly<Record<RoadmapSession["role"], number>> = {
  introduce: 0,
  practice: 1,
  review: 2,
  offscreen: 3,
};

interface CellDraft {
  readonly week_no: number;
  readonly session_no: number;
  readonly role: RoadmapSession["role"];
  readonly skill_code: string;
}

function coversBand(
  band: RoadmapBand,
  ageMin: number,
  ageMax: number
): boolean {
  const [low, high] = BAND_AGES[band];
  return ageMin <= low && ageMax >= high;
}

function byCode<T extends { readonly code: string }>(a: T, b: T): number {
  if (a.code === b.code) {
    return 0;
  }
  return a.code < b.code ? -1 : 1;
}

function byDifficultyThenCode(a: DemandLevel, b: DemandLevel): number {
  return a.difficulty - b.difficulty || byCode(a, b);
}

function quotaFor(role: RoadmapSession["role"]): number {
  return role === "practice" ? PRACTICE_LEVEL_QUOTA : SINGLE_LEVEL_QUOTA;
}

function pickLevels(
  draft: CellDraft,
  band: RoadmapBand,
  levels: readonly DemandLevel[],
  difficultyMax: number,
  used: ReadonlySet<string>
): string[] {
  return levels
    .filter(
      (level) =>
        !used.has(level.code) &&
        level.skill_codes.includes(draft.skill_code) &&
        level.difficulty <= difficultyMax &&
        coversBand(band, level.age_min, level.age_max)
    )
    .sort(byDifficultyThenCode)
    .slice(0, quotaFor(draft.role))
    .map((level) => level.code);
}

function draftCells(roadmap: RoadmapSeed): CellDraft[] {
  return roadmap.weeks.flatMap((week) =>
    week.sessions.map((session) => {
      if (session.topics && session.topics.length > 0) {
        throw new Error(
          `Lộ trình ${roadmap.code} tuần ${week.week_no} khai topics[] nhưng sổ cầu theo chủ đề chưa được cài`
        );
      }
      return {
        week_no: week.week_no,
        session_no: session.session_no,
        role: session.role,
        skill_code: session.skill_code,
      };
    })
  );
}

function cellKey(draft: CellDraft): string {
  return `${draft.week_no}:${draft.session_no}`;
}

function fillRoadmap(
  roadmap: RoadmapSeed,
  drafts: readonly CellDraft[],
  input: DemandInput
): Map<string, string[]> {
  const used = new Set<string>();
  const fills = new Map<string, string[]>();
  const order = [...drafts].sort(
    (a, b) =>
      ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role] ||
      a.week_no - b.week_no ||
      a.session_no - b.session_no
  );
  for (const draft of order) {
    const picked = pickLevels(
      draft,
      roadmap.band,
      input.levels,
      input.difficultyMaxByBand[roadmap.band],
      used
    );
    for (const code of picked) {
      used.add(code);
    }
    fills.set(cellKey(draft), picked);
  }
  return fills;
}

function deriveRoadmap(
  roadmap: RoadmapSeed,
  input: DemandInput
): { cells: DemandCell[]; summary: DemandSummary } {
  const drafts = draftCells(roadmap);
  const fills = fillRoadmap(roadmap, drafts, input);
  const cells = drafts.map<DemandCell>((draft) => ({
    roadmap_code: roadmap.code,
    band: roadmap.band,
    week_no: draft.week_no,
    session_no: draft.session_no,
    role: draft.role,
    skill_code: draft.skill_code,
    topic_code: null,
    template_codes: input.affinities[draft.skill_code] ?? [],
    level_quota: quotaFor(draft.role),
    filled_by: fills.get(cellKey(draft)) ?? [],
  }));
  const filled = cells.filter(
    (cell) => cell.filled_by.length >= cell.level_quota
  ).length;
  return {
    cells,
    summary: {
      roadmap_code: roadmap.code,
      roadmap_version: roadmap.version,
      band: roadmap.band,
      cells: cells.length,
      filled_cells: filled,
      debt_cells: cells.length - filled,
    },
  };
}

export function deriveContentDemand(input: DemandInput): ContentDemandLedger {
  const derived = input.roadmaps.map((roadmap) =>
    deriveRoadmap(roadmap, input)
  );
  return {
    ledger_version: 1,
    summary: derived.map((entry) => entry.summary),
    cells: derived.flatMap((entry) => entry.cells),
  };
}

export function serializeContentDemand(ledger: ContentDemandLedger): string {
  return `${JSON.stringify(ledger, null, 2)}\n`;
}

export function listPracticeCellsWithoutTemplate(
  ledger: ContentDemandLedger
): DemandCell[] {
  return ledger.cells.filter(
    (cell) => cell.role === "practice" && cell.template_codes.length === 0
  );
}

export interface BandMismatch {
  readonly roadmap_code: string;
  readonly band: RoadmapBand;
  readonly week_no: number;
  readonly session_no: number;
  readonly content_code: string;
  readonly reason: "unknown_content" | "band_not_covered";
}

export function findBandMismatches(
  ledger: ContentDemandLedger,
  levels: readonly DemandLevel[]
): BandMismatch[] {
  const ages = new Map<string, { min: number; max: number }>();
  for (const entry of levels) {
    ages.set(entry.code, { min: entry.age_min, max: entry.age_max });
  }
  const mismatches: BandMismatch[] = [];
  for (const cell of ledger.cells) {
    for (const contentCode of cell.filled_by) {
      const range = ages.get(contentCode);
      let reason: BandMismatch["reason"] | null = null;
      if (range === undefined) {
        reason = "unknown_content";
      } else if (!coversBand(cell.band, range.min, range.max)) {
        reason = "band_not_covered";
      }
      if (reason !== null) {
        mismatches.push({
          roadmap_code: cell.roadmap_code,
          band: cell.band,
          week_no: cell.week_no,
          session_no: cell.session_no,
          content_code: contentCode,
          reason,
        });
      }
    }
  }
  return mismatches;
}
