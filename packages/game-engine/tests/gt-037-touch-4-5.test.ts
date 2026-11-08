import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace, resolveTouchFloor } from "#src/layout/constants";
import { computeStageZones, type StageZones } from "#src/layout/stage-zones";
import { GT037_FIXTURES } from "#src/templates/GT-037/fixtures";
import {
  GT037_TOUCH_CSS_PX_4_5,
  GT037Session,
} from "#src/templates/GT-037/session";
import {
  type GT037Content,
  GT037ContentSchema,
  type GT037Difficulty,
  GT037DifficultySchema,
} from "#src/templates/GT-037/template";
import {
  findHitPairViolations,
  findSlotsOutsideStage,
} from "./layout/stage-checks.ts";

/**
 * Task #313 — GT-037 band 4-5: vùng chạm riêng to hơn sàn chạm chung
 * (`BR-E037-12`, quyết định product owner 2026-11-08).
 */
interface Viewport {
  readonly name: string;
  readonly cssW: number;
  readonly cssH: number;
}

const VIEWPORTS: readonly Viewport[] = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "portrait 390x844", cssW: 390, cssH: 844 },
  { name: "điện thoại ngang 610x350", cssW: 610, cssH: 350 },
  { name: "điện thoại ngang 844x390", cssW: 844, cssH: 390 },
  { name: "máy tính bảng 1024x640", cssW: 1024, cssH: 640 },
];

interface Frame {
  readonly zones: StageZones;
  readonly space: { w: number; h: number };
  readonly cssPerLogic: number;
}

function frameFor(viewport: Viewport, band: AgeBand, commit: boolean): Frame {
  const space = deriveLogicSpace(viewport.cssW, viewport.cssH);
  const cssPerLogic = viewport.cssW / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: false,
    needsCommit: commit,
  });
  return { zones, space, cssPerLogic };
}

interface Level {
  readonly name: string;
  readonly content: GT037Content;
  readonly difficulty: GT037Difficulty;
}

const LEVELS: readonly Level[] = [
  ...GT037_FIXTURES.map((fx) => ({
    name: `mẫu ${fx.id}`,
    content: fx.content,
    difficulty: fx.difficulty,
  })),
  ...ALL_SEED_LEVELS.filter((l) => l.header.template_code === "GT-037").map(
    (l) => ({
      name: `seed ${l.header.code}`,
      content: GT037ContentSchema.parse(l.content_pack),
      difficulty: GT037DifficultySchema.parse(l.difficulty_params),
    })
  ),
];

const SEEDS = [1, 2, 3, 7, 42];

function prepared(
  level: Level,
  band: AgeBand,
  frame: Frame,
  seed: number
): GT037Session {
  const session = new GT037Session(level.content, level.difficulty, seed);
  session.prepareRound(
    band,
    frame.space,
    frame.zones.stage,
    undefined,
    frame.cssPerLogic
  );
  return session;
}

describe("GT-037 — hằng vùng chạm band 4-5 (BR-E037-12)", () => {
  it("to hơn sàn chạm chung của band 4-5", () => {
    expect(GT037_TOUCH_CSS_PX_4_5).toBeGreaterThan(resolveTouchFloor("4-5"));
  });
});

describe.each(VIEWPORTS)("GT-037 band 4-5 ở $name", (viewport) => {
  it("có seed GT-037 để đo", () => {
    expect(LEVELS.length).toBeGreaterThan(GT037_FIXTURES.length);
  });

  it.each(LEVELS)(
    "$name — mọi ô ≥ sàn band, trong sân khấu, không chồng; ô riêng ≥ ngưỡng mới khi vừa khung",
    (level) => {
      const band: AgeBand = "4-5";
      const commit = level.difficulty.finish_mode === "declare";
      const frame = frameFor(viewport, band, commit);
      const bandFloor = resolveTouchFloor(band, frame.cssPerLogic);
      const ownFloor = Math.ceil(GT037_TOUCH_CSS_PX_4_5 / frame.cssPerLogic);
      for (const seed of SEEDS) {
        const session = prepared(level, band, frame, seed);
        const slots = session.slots;
        expect(slots.length).toBe(session.boardSymbols.length);
        expect(findHitPairViolations(slots)).toEqual([]);
        expect(findSlotsOutsideStage(slots, frame.zones.stage)).toEqual([]);
        const first = slots[0];
        if (!first) {
          throw new Error("Bảng rỗng");
        }
        // Mọi ô cùng một cỡ; không bao giờ dưới sàn band.
        for (const slot of slots) {
          expect(slot.hitW).toBe(first.hitW);
          expect(slot.hitW).toBeGreaterThanOrEqual(bandFloor);
          expect(slot.hitH).toBeGreaterThanOrEqual(bandFloor);
        }
        // Còn chỗ cho bản sao đích với tỉ lệ đích ≤ 35% thì phải dùng ngưỡng riêng.
        if (session.usesOwnTouchFloor) {
          expect(first.hitW).toBeGreaterThanOrEqual(ownFloor);
          expect(first.hitH).toBeGreaterThanOrEqual(ownFloor);
          expect(session.targetCopies / slots.length).toBeLessThanOrEqual(
            0.35 + 1e-9
          );
        }
      }
    }
  );
});

describe("GT-037 band 4-5 — khung đủ rộng thì chạm ≥ ngưỡng riêng (BR-E037-12)", () => {
  const roomy = VIEWPORTS.filter((v) => v.cssW >= 844 || v.cssH >= 800);
  it.each(roomy)(
    "$name dùng ngưỡng riêng cho level có ≤ 4 bản sao đích",
    (viewport) => {
      const frame = frameFor(viewport, "4-5", false);
      const ownFloor = Math.ceil(GT037_TOUCH_CSS_PX_4_5 / frame.cssPerLogic);
      const small = LEVELS.filter(
        (l) => (l.difficulty.target_copies ?? l.content.target_copies) <= 4
      );
      expect(small.length).toBeGreaterThan(0);
      for (const level of small) {
        const session = prepared(level, "4-5", frame, 1);
        expect(session.usesOwnTouchFloor).toBe(true);
        for (const slot of session.slots) {
          expect(slot.hitW).toBeGreaterThanOrEqual(ownFloor);
        }
      }
    }
  );

  it("khung quá chật (610x350) co về sàn band, không dưới sàn band", () => {
    const frame = frameFor({ name: "", cssW: 610, cssH: 350 }, "4-5", false);
    const bandFloor = resolveTouchFloor("4-5", frame.cssPerLogic);
    for (const level of LEVELS) {
      const session = prepared(level, "4-5", frame, 1);
      expect(session.usesOwnTouchFloor).toBe(false);
      for (const slot of session.slots) {
        expect(slot.hitW).toBe(bandFloor);
      }
    }
  });
});

describe("GT-037 band 5-6 — không đổi sàn chạm", () => {
  it("sàn chung vẫn là sàn của band", () => {
    const first = LEVELS[0];
    if (!first) {
      throw new Error("Thiếu level");
    }
    const frame = frameFor(
      VIEWPORTS[4] ?? { name: "", cssW: 1024, cssH: 640 },
      "5-6",
      false
    );
    const session = prepared(first, "5-6", frame, 1);
    expect(session.usesOwnTouchFloor).toBe(false);
    const floor = resolveTouchFloor("5-6", frame.cssPerLogic);
    for (const slot of session.slots) {
      expect(slot.hitW).toBe(floor);
    }
  });
});

describe("GT-037 — game_started ghi số ô thật sau khi hạ ô (BR-E037-12)", () => {
  it.each(VIEWPORTS)("$name: item_count bằng số ô trên bảng", (viewport) => {
    const frame = frameFor(viewport, "4-5", false);
    for (const level of LEVELS) {
      const session = prepared(level, "4-5", frame, 1);
      const started = session
        .getTelemetry()
        .events.filter((e) => e.event_name === "game_started");
      expect(started).toHaveLength(1);
      expect(started[0]?.data?.item_count).toBe(session.slots.length);
      expect(started[0]?.data?.target_copies).toBe(session.targetCopies);
    }
  });
});
