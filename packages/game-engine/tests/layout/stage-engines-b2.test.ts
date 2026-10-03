import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures";
import { FIXTURES_BY_CODE, type FixturePayload } from "../fixtures-map.ts";
import { GT026ProgressBadgeSession } from "./fixtures/gt-026-progress-badge.ts";
import {
  findDrawsOutsideStage,
  findHitPairViolations,
  findSlotsOutsideStage,
} from "./stage-checks.ts";

const progressBadgeSpy = vi.hoisted(() => vi.fn());

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  // Nền cảnh phủ cả canvas là lớp 1 của khung, không phải phần engine vẽ.
  // Huy hiệu tiến độ bị cấm trên canvas (`BR-PSZ-06`): đếm lần gọi.
  return {
    ...actual,
    drawSceneBackground: vi.fn(),
    drawProgressBadge: progressBadgeSpy,
  };
});

/**
 * Lô B2 của Task #283 — nộp bài, tiến độ, ức chế: GT-002, 018, 026, 027. Ba
 * viewport (canvas CSS sau HUD và đệm): portrait 390x844 → 330x697, điện thoại
 * ngang 844x390 → 784x250, máy tính bảng → 964x628.
 */
const B2_CODES = ["GT-002", "GT-018", "GT-026", "GT-027"] as const;

const VIEWPORTS = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "ngang 784x250", cssW: 784, cssH: 250 },
  { name: "tablet 964x628", cssW: 964, cssH: 628 },
] as const;

/**
 * Band tuổi mà level của engine thật sự được cấp, theo `age_min` và
 * `banned_age_bands` ở `template.ts` (`BR-LAY-10`).
 */
const ACTIVE_BANDS: Readonly<
  Record<(typeof B2_CODES)[number], readonly AgeBand[]>
> = {
  "GT-002": ["4-5", "5-6"],
  "GT-018": ["4-5", "5-6"],
  "GT-026": ["4-5", "5-6"],
  "GT-027": ["5-6"],
};
/** GT-002 có hàng trăm level seed; quét ba viewport vượt 30 s mặc định. */
const SWEEP_TIMEOUT_MS = 180_000;
const ROUNDS_PER_CASE = 2;

/**
 * Nợ đã đo (`code viewport` → số ca band × level còn vi phạm). Số chỉ được giảm;
 * mỗi mục phải có nguyên nhân gốc ghi ở đây.
 */
// Số ca đo trên tập đã lấy mẫu theo hình (`SEEDS_PER_SHAPE`).
const KNOWN_STAGE_DEBT_CASES: Readonly<Record<string, number>> = {
  // Level 9-10 vật: `grid-2x4` chứa tối đa 8 ô một trang ở stage hẹp, ô còn lại
  // sang trang 1 mà engine không có phân trang (cùng nợ GT-029 ở B1).
  "GT-002 portrait 330x697": 2,
  // Điện thoại ngang: dải nhãn 44 px lấy chỗ của lưới nên level nhiều vật sang
  // trang 1; chờ phân trang `play-stage-zones.md` mục 11 câu hỏi số 4.
  "GT-027 ngang 784x250": 4,
};
/** Đủ dài để pha loé của GT-012 hết và lựa chọn hiện ra. */
const PHASE_ADVANCE_MS = 5000;
const MAX_REPORTED_VIOLATIONS = 6;
const MAX_REPORTED_SAMPLES = 4;

/** Phần của `TemplateGameSession` mà phép đo khung cần. */
type B2Session = GameSession &
  Pick<
    TemplateGameSession<never, never>,
    | "dispatch"
    | "canCommit"
    | "getHintTarget"
    | "getHintTargetIndex"
    | "needsCommit"
    | "needsTray"
    | "prepareRound"
    | "slots"
    | "usesPromptZone"
  >;

function isPayload(val: unknown): val is FixturePayload {
  return typeof val === "object" && val !== null;
}

function configFor(
  code: string,
  band: AgeBand,
  content: unknown,
  difficulty: unknown
): EngineConfig {
  return {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: isPayload(content) ? content : {},
    difficulty_params: isPayload(difficulty) ? difficulty : {},
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: true,
  };
}

interface Case {
  readonly name: string;
  readonly make: (band: AgeBand) => B2Session;
}

function makeSession(config: EngineConfig): B2Session {
  const session = createGameSessionSync(config.template_code, config);
  if (!(session instanceof TemplateGameSession)) {
    throw new Error(`${config.template_code} không phải TemplateGameSession`);
  }
  return session;
}

/**
 * Hình học của một level chỉ phụ thuộc số phần tử các mảng nội dung (số vật,
 * số phương án...): chạy lại mọi seed cùng hình chỉ tốn thời gian (GT-002 có
 * hàng trăm level, ~160 s một viewport). Giữ tối đa `SEEDS_PER_SHAPE` level mỗi
 * hình, theo thứ tự seed nên ổn định giữa các lần chạy (`BR-LAY-10`).
 */
const SEEDS_PER_SHAPE = 2;

function shapeKey(contentPack: unknown): string {
  if (!isPayload(contentPack)) {
    return "";
  }
  return Object.entries(contentPack)
    .map(
      ([key, value]) => `${key}:${Array.isArray(value) ? value.length : "-"}`
    )
    .join("|");
}

function sampleByShape<T extends { readonly content_pack: unknown }>(
  levels: readonly T[]
): T[] {
  const seen = new Map<string, number>();
  return levels.filter((level) => {
    const key = shapeKey(level.content_pack);
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count < SEEDS_PER_SHAPE;
  });
}

function casesFor(code: string): Case[] {
  const fromFixtures = (FIXTURES_BY_CODE[code] ?? []).map((f, i) => ({
    name: `mẫu ${i}`,
    make: (band: AgeBand) =>
      makeSession(configFor(code, band, f.content, f.difficulty)),
  }));
  const fromSeeds = sampleByShape(
    ALL_SEED_LEVELS.filter((level) => level.header.template_code === code)
  ).map((level) => ({
    name: `seed ${level.header.code}`,
    make: (band: AgeBand) =>
      makeSession(
        configFor(code, band, level.content_pack, level.difficulty_params)
      ),
  }));
  return [...fromFixtures, ...fromSeeds];
}

/** Chạm vào ô gợi ý (bước đúng kế tiếp) để đưa vòng sang trạng thái giữa chừng. */
function tapHintTarget(session: B2Session, timeMs: number): void {
  const index = session.getHintTargetIndex?.() ?? null;
  const slot = index === null ? undefined : session.slots[index];
  if (slot) {
    session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs });
  }
}

interface Frame {
  readonly cssW: number;
  readonly cssH: number;
}

function violationsOf(session: B2Session, band: AgeBand, frame: Frame) {
  const space = deriveLogicSpace(frame.cssW, frame.cssH);
  const cssPerLogic = frame.cssW / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: session.needsTray,
    needsCommit: session.needsCommit,
  });
  const rs = new RenderSystem();
  const found: string[] = [];
  for (let round = 0; round < ROUNDS_PER_CASE; round++) {
    session.prepareRound(
      band,
      space,
      zones.stage,
      zones.tray ?? undefined,
      cssPerLogic
    );
    const where = `vòng ${round}`;
    const hit = findHitPairViolations(session.slots);
    const outside = findSlotsOutsideStage(session.slots, zones.stage);
    const opening = findDrawsOutsideStage(zones.stage, (ctx) =>
      session.render?.(ctx, rs, 0)
    );
    session.update?.(PHASE_ADVANCE_MS);
    tapHintTarget(session, 1);
    const midRound = findDrawsOutsideStage(zones.stage, (ctx) =>
      session.render?.(ctx, rs, 2)
    );
    const paged = session.slots
      .filter((slot) => slot.page !== 0)
      .map((slot) => `slot ${slot.index} ở trang ${slot.page}`);
    found.push(
      ...paged.map((v) => `${where} trang: ${v}`),
      ...hit.map((v) => `${where} chạm: ${v}`),
      ...outside.map((v) => `${where} slot: ${v}`),
      ...opening.map((v) => `${where} vẽ đầu vòng: ${v}`),
      ...midRound.map((v) => `${where} vẽ giữa vòng: ${v}`)
    );
  }
  return found;
}

const VIOLATION_KIND_PATTERN =
  /vòng \d (trang|chạm|slot|vẽ đầu vòng|vẽ giữa vòng)/;

/** Đếm vi phạm theo loại (chạm / slot / vẽ đầu vòng / vẽ giữa vòng). */
function summarize(found: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const line of found) {
    const kind = VIOLATION_KIND_PATTERN.exec(line)?.[1];
    counts.set(kind ?? "khác", (counts.get(kind ?? "khác") ?? 0) + 1);
  }
  const kinds = [...counts].map(([k, n]) => `${k}=${n}`).join(" ");
  const samples = [
    ...new Set(
      found.map((line) => line.replace(/\d+(?:\.\d+)?/g, "N").slice(0, 80))
    ),
  ].slice(0, MAX_REPORTED_SAMPLES);
  return `${kinds} | ${samples.join(" ; ")}`;
}

describe.each(B2_CODES)("%s vào khung năm vùng — lô B2 (Task #283)", (code) => {
  beforeAll(async () => {
    await preloadGameSession(code);
  });

  it("khai usesPromptZone — shell vẽ lời dẫn (BR-PSZ-08)", () => {
    const first = casesFor(code)[0];
    expect(first?.make("5-6").usesPromptZone).toBe(true);
  });

  it("có level đã seed để chạy lại, không chỉ level mẫu (BR-LAY-10)", () => {
    const seeded = casesFor(code).filter((c) => c.name.startsWith("seed "));
    expect(seeded.length).toBeGreaterThan(0);
  });

  it.each(VIEWPORTS)(
    "$name — vùng chạm không chồng, slot và nét vẽ trong stage (BR-LAY-05, BR-PSZ-01)",
    { timeout: SWEEP_TIMEOUT_MS },
    (frame) => {
      const found: string[] = [];
      const violatingCases = new Set<string>();
      for (const band of ACTIVE_BANDS[code]) {
        for (const { name, make } of casesFor(code)) {
          for (const v of violationsOf(make(band), band, frame)) {
            found.push(`${band} ${name} ${v}`);
            violatingCases.add(`${band} ${name}`);
          }
        }
      }
      const debt = KNOWN_STAGE_DEBT_CASES[`${code} ${frame.name}`] ?? 0;
      const reported = violatingCases.size <= debt ? [] : found;
      expect(
        reported.slice(0, MAX_REPORTED_VIOLATIONS),
        `${violatingCases.size} ca vi phạm (nợ đã ghi ${debt}): ${summarize(found)}`
      ).toEqual([]);
    }
  );
});

describe("huy hiệu tiến độ không vẽ trên canvas (BR-PSZ-06)", () => {
  beforeAll(async () => {
    await Promise.all(B2_CODES.map((code) => preloadGameSession(code)));
  });

  beforeEach(() => {
    progressBadgeSpy.mockClear();
  });

  it.each(B2_CODES)("%s render không gọi drawProgressBadge", (code) => {
    const frame = VIEWPORTS[0];
    for (const { make } of casesFor(code).slice(0, 3)) {
      violationsOf(make(ACTIVE_BANDS[code][0] ?? "5-6"), "5-6", frame);
    }

    expect(progressBadgeSpy).not.toHaveBeenCalled();
  });

  it("ca âm: engine khôi phục drawProgressBadge → bị đếm", () => {
    const fixture = GT026_FIXTURES[0];
    if (!fixture) {
      throw new Error("GT-026 không có fixture");
    }
    const session = new GT026ProgressBadgeSession(
      fixture.content,
      fixture.difficulty
    );

    violationsOf(session, "5-6", VIEWPORTS[0]);

    expect(progressBadgeSpy).toHaveBeenCalled();
  });
});

describe("needsCommit của lô B2 (BR-PSZ-05)", () => {
  it("GT-002 có nút Xong, chỉ sáng khi đã chọn vật", () => {
    const fixture = FIXTURES_BY_CODE["GT-002"]?.[0];
    if (!fixture) {
      throw new Error("GT-002 không có fixture");
    }
    const session = makeSession(
      configFor("GT-002", "5-6", fixture.content, fixture.difficulty)
    );
    session.prepareRound("5-6", deriveLogicSpace(330, 697), undefined);

    expect(session.needsCommit).toBe(true);
    expect(session.canCommit()).toBe(false);
  });

  it.each([
    { mode: "select", needsCommit: false },
    { mode: "sequence", needsCommit: true },
  ] as const)(
    "GT-018 response_mode=$mode → needsCommit=$needsCommit",
    ({ mode, needsCommit }) => {
      const fixture = FIXTURES_BY_CODE["GT-018"]?.find(
        (f) => isPayload(f.content) && f.content.response_mode === mode
      );
      if (!fixture) {
        throw new Error(`GT-018 không có fixture ${mode}`);
      }
      const session = makeSession(
        configFor("GT-018", "5-6", fixture.content, fixture.difficulty)
      );

      expect(session.needsCommit).toBe(needsCommit);
      expect(session.getHintTarget()?.kind).toBe(
        needsCommit ? "action" : "slot"
      );
    }
  );

  it("GT-026 và GT-027 không có nút nộp", () => {
    for (const code of ["GT-026", "GT-027"] as const) {
      const fixture = FIXTURES_BY_CODE[code]?.[0];
      if (!fixture) {
        throw new Error(`${code} không có fixture`);
      }
      const session = makeSession(
        configFor(code, "5-6", fixture.content, fixture.difficulty)
      );

      expect(session.needsCommit).toBe(false);
    }
  });
});
