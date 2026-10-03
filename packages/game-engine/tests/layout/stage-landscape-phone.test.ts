import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import type { ViewEntity } from "#src/interaction";
import { deriveLogicSpace, type LogicSpace } from "#src/layout/constants";
import {
  computeStageZones,
  type StageZones,
  type ZoneRect,
} from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";
import {
  GT001ContentSchema,
  GT001DifficultySchema,
} from "#src/templates/GT-001/template";
import {
  LEGACY_LANDSCAPE_PHONE_SPACE,
  LEGACY_LANDSCAPE_PHONE_STAGE,
} from "#tests/layout/fixtures/landscape-phone-legacy-stage";
import {
  findHitPairViolations,
  findSlotsOutsideStage,
} from "./stage-checks.ts";

/**
 * Lỗi QA trình duyệt thật 2026-10-03 (Task #277 Checkpoint 1): ở điện thoại
 * ngang 844x390, thẻ mẫu của GT-001 bị hai ô lựa chọn đè lên và ô lựa chọn
 * tràn khỏi sân khấu. Nguyên nhân phía engine: landscape không có khay thì
 * sân khấu dừng trên đỉnh nút hành động, nên sân khấu chỉ còn 60 logic px
 * (`277-play-stage-zones-plan.md` `D-277-7`).
 *
 * Hộp canvas: 784x250 là số tính từ CSS ở plan mục 1.3 (M2); 784x311 là hộp
 * mà trình duyệt QA thật dựng ra khi canvas tràn đáy (chặn `85vh - 20px`);
 * 800x243 là hộp sau khi sửa CSS (HUD theo nút, arena co được), đo trên Chromium.
 */
const LANDSCAPE_PHONE_BOXES = [
  { name: "M2 784x250", cssW: 784, cssH: 250 },
  { name: "QA tràn 784x311", cssW: 784, cssH: 311 },
  { name: "sau sửa 800x243", cssW: 800, cssH: 243 },
] as const;

const AGE_BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

/** Hai level QA mở ở 844x390 — cả hai là GT-001 trong seed. */
const QA_LEVEL_CODES = ["GL-C2-POS-LOC-0004", "GL-C1-ADD-TAP-0001"] as const;

interface Gt001Case {
  readonly name: string;
  readonly create: () => GT001Session;
}

function qaLevels() {
  return ALL_SEED_LEVELS.filter((level) =>
    (QA_LEVEL_CODES as readonly string[]).includes(level.header.code)
  );
}

const GT001_CASES: readonly Gt001Case[] = [
  ...GT001_FIXTURES.map((fixture, index) => ({
    name: `mẫu ${index}`,
    create: () => new GT001Session(fixture.content, fixture.difficulty),
  })),
  ...qaLevels().map((level) => ({
    name: `seed ${level.header.code}`,
    create: () =>
      new GT001Session(
        GT001ContentSchema.parse(level.content_pack),
        GT001DifficultySchema.parse(level.difficulty_params)
      ),
  })),
];

function landscapeZones(
  cssW: number,
  cssH: number,
  ageBand: AgeBand
): { zones: StageZones; space: LogicSpace } {
  const space = deriveLogicSpace(cssW, cssH);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand,
    // Cùng phép của `RenderSystem.setupCanvas`: tỉ lệ chặn bởi cạnh chật hơn.
    cssPerLogic: Math.min(cssW / space.w, cssH / space.h),
    needsTray: false,
    needsCommit: false,
  });
  return { zones, space };
}

function isInside(inner: ZoneRect, outer: ZoneRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

function entityRect(entity: ViewEntity): ZoneRect {
  return {
    x: entity.x - entity.w / 2,
    y: entity.y - entity.h / 2,
    w: entity.w,
    h: entity.h,
  };
}

function slotHitRect(slot: Slot): ZoneRect {
  return {
    x: slot.x - slot.hitW / 2,
    y: slot.y - slot.hitH / 2,
    w: slot.hitW,
    h: slot.hitH,
  };
}

function overlaps(a: ZoneRect, b: ZoneRect): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

/**
 * Mọi lỗi bố cục của một vòng GT-001 trong `stage`: thẻ mẫu chồng ô lựa
 * chọn, thẻ mẫu ra ngoài sân khấu, ô lựa chọn chồng nhau hoặc ra ngoài.
 */
function gt001LayoutViolations(
  session: GT001Session,
  stage: ZoneRect
): string[] {
  const card = session
    .getView()
    .entities.find((entity) => entity.role === "neutral");
  const violations = [
    ...findHitPairViolations(session.slots),
    ...findSlotsOutsideStage(session.slots, stage),
  ];
  if (!card) {
    return [...violations, "không có thẻ mẫu"];
  }
  const cardRect = entityRect(card);
  if (!isInside(cardRect, stage)) {
    violations.push("thẻ mẫu ra ngoài sân khấu");
  }
  for (const slot of session.slots) {
    if (overlaps(cardRect, slotHitRect(slot))) {
      violations.push(`thẻ mẫu chồng slot ${slot.index}`);
    }
  }
  return violations;
}

describe("điện thoại ngang 844x390 — khung năm vùng vừa canvas", () => {
  it("có đủ hai level QA trong seed để chạy lại", () => {
    expect(
      qaLevels()
        .map((level) => level.header.code)
        .sort()
    ).toEqual([...QA_LEVEL_CODES].sort());
  });

  it("mọi vùng nằm trong canvas logic, không vùng nào chồng vùng nào", () => {
    for (const box of LANDSCAPE_PHONE_BOXES) {
      for (const ageBand of AGE_BANDS) {
        const { zones, space } = landscapeZones(box.cssW, box.cssH, ageBand);
        const canvas: ZoneRect = { x: 0, y: 0, w: space.w, h: space.h };
        const label = `${box.name} band ${ageBand}`;

        for (const rect of [zones.prompt, zones.stage, zones.action]) {
          expect(isInside(rect, canvas), label).toBe(true);
        }
        expect(overlaps(zones.stage, zones.prompt), label).toBe(false);
        expect(overlaps(zones.stage, zones.action), label).toBe(false);
      }
    }
  });

  it("không khay: sân khấu kéo xuống đáy canvas, dừng trước cột nút hành động", () => {
    const { zones, space } = landscapeZones(784, 250, "3-4");

    expect(zones.stage.y + zones.stage.h).toBe(zones.action.y + zones.action.h);
    expect(zones.stage.x + zones.stage.w).toBeLessThan(zones.action.x);
    expect(zones.action.y + zones.action.h).toBeLessThanOrEqual(space.h);
  });

  for (const box of LANDSCAPE_PHONE_BOXES) {
    for (const ageBand of AGE_BANDS) {
      it.each(GT001_CASES)(
        `GT-001 $name — ${box.name} band ${ageBand}: thẻ mẫu và ô lựa chọn không chồng, nằm trong sân khấu`,
        ({ create }) => {
          const { zones, space } = landscapeZones(box.cssW, box.cssH, ageBand);
          const session = create();
          session.prepareRound(ageBand, space, zones.stage);

          expect(gt001LayoutViolations(session, zones.stage)).toEqual([]);
        }
      );
    }
  }

  it("ca âm: sân khấu cũ 60 logic px trên nút hành động bị báo chồng và tràn", () => {
    const first = GT001_CASES[0];
    if (!first) {
      throw new Error("GT-001 không có level mẫu");
    }
    const session = first.create();
    session.prepareRound(
      "3-4",
      LEGACY_LANDSCAPE_PHONE_SPACE,
      LEGACY_LANDSCAPE_PHONE_STAGE
    );

    const violations = gt001LayoutViolations(
      session,
      LEGACY_LANDSCAPE_PHONE_STAGE
    );

    expect(violations).toContain("thẻ mẫu ra ngoài sân khấu");
    expect(violations.some((v) => v.startsWith("thẻ mẫu chồng slot"))).toBe(
      true
    );
  });
});
