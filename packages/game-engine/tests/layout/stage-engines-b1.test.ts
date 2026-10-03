import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, describe, expect, it, vi } from "vitest";
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
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures";
import { FIXTURES_BY_CODE, type FixturePayload } from "../fixtures-map.ts";
import { GT009LegacyLayoutSession } from "./fixtures/gt-009-legacy-layout.ts";
import {
  findDrawsOutsideStage,
  findHitPairViolations,
  findSlotsOutsideStage,
} from "./stage-checks.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  // Nền cảnh phủ cả canvas là lớp 1 của khung, không phải phần engine vẽ.
  return { ...actual, drawSceneBackground: vi.fn() };
});

/**
 * Lô B1 của Task #283 — chạm chọn một: GT-009, 010, 011, 012, 022, 025, 029,
 * 032. Ba viewport (canvas CSS sau HUD và đệm): portrait 390x844 → 330x697,
 * điện thoại ngang 844x390 → canvas 610x350 (HUD thành cột lề), máy tính bảng → 964x628.
 */
const B1_CODES = [
  "GT-009",
  "GT-010",
  "GT-011",
  "GT-012",
  "GT-022",
  "GT-025",
  "GT-029",
  "GT-032",
] as const;

const VIEWPORTS = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "ngang 610x350", cssW: 610, cssH: 350 },
  { name: "tablet 964x628", cssW: 964, cssH: 628 },
] as const;

/**
 * Band tuổi mà level của engine thật sự được cấp, theo `age_min` và
 * `banned_age_bands` ở `template.ts` (`BR-LAY-10`: band không được cấp thì
 * không phải đo). Band thấp nhất có sàn chạm cao nhất nên là ca khắt khe nhất.
 */
const ACTIVE_BANDS: Readonly<
  Record<(typeof B1_CODES)[number], readonly AgeBand[]>
> = {
  "GT-009": ["4-5", "5-6"],
  "GT-010": ["4-5", "5-6"],
  "GT-011": ["5-6"],
  "GT-012": ["3-4", "4-5", "5-6"],
  "GT-022": ["4-5", "5-6"],
  "GT-025": ["4-5", "5-6"],
  "GT-029": ["4-5", "5-6"],
  "GT-032": ["5-6"],
};
const ROUNDS_PER_CASE = 2;

/**
 * Nợ đã đo (`code viewport` → số ca band × level còn vi phạm). Số chỉ được giảm;
 * mỗi mục phải có nguyên nhân gốc ghi ở đây.
 */
const KNOWN_STAGE_DEBT_CASES: Readonly<Record<string, number>> = {
  // Số đo sau khi khay nhiều hàng, không phân trang và cột lời dẫn bên trái
  // (`play-stage-zones.md` `BR-PSZ-13`). Còn lại là giới hạn vật lý: sàn chạm của
  // band ở canvas thấp làm số ô cần xếp lớn hơn diện tích sân khấu. Chỉ được giảm.
  "GT-009 ngang 610x350": 21,
  "GT-025 ngang 610x350": 3,
  "GT-029 ngang 610x350": 32,
};
/** Đủ dài để pha loé của GT-012 hết và lựa chọn hiện ra. */
const PHASE_ADVANCE_MS = 5000;
const MAX_REPORTED_VIOLATIONS = 6;
const MAX_REPORTED_SAMPLES = 4;

/** Phần của `TemplateGameSession` mà phép đo khung cần. */
type B1Session = GameSession &
  Pick<
    TemplateGameSession<never, never>,
    | "dispatch"
    | "getHintTargetIndex"
    | "needsCommit"
    | "needsTray"
    | "trayItemCount"
    | "trayHasLabels"
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
  readonly make: (band: AgeBand) => B1Session;
}

function makeSession(config: EngineConfig): B1Session {
  const session = createGameSessionSync(config.template_code, config);
  if (!(session instanceof TemplateGameSession)) {
    throw new Error(`${config.template_code} không phải TemplateGameSession`);
  }
  return session;
}

function casesFor(code: string): Case[] {
  const fromFixtures = (FIXTURES_BY_CODE[code] ?? []).map((f, i) => ({
    name: `mẫu ${i}`,
    make: (band: AgeBand) =>
      makeSession(configFor(code, band, f.content, f.difficulty)),
  }));
  const fromSeeds = ALL_SEED_LEVELS.filter(
    (level) => level.header.template_code === code
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
function tapHintTarget(session: B1Session, timeMs: number): void {
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

function violationsOf(session: B1Session, band: AgeBand, frame: Frame) {
  const space = deriveLogicSpace(frame.cssW, frame.cssH);
  const cssPerLogic = frame.cssW / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
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

describe.each(B1_CODES)("%s vào khung năm vùng — lô B1 (Task #283)", (code) => {
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

describe("Ca âm: toạ độ cứng của canvas cũ (lô B1)", () => {
  it.each(VIEWPORTS)(
    "GT-009 xếp slot theo toạ độ cứng — $name bị báo",
    (frame) => {
      const fixture = GT009_FIXTURES[0];
      if (!fixture) {
        throw new Error("GT-009 không có fixture");
      }
      const session = new GT009LegacyLayoutSession(
        fixture.content,
        fixture.difficulty
      );

      const found = violationsOf(session, "5-6", frame);

      expect(found.length).toBeGreaterThan(0);
    }
  );
});
