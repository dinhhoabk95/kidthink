import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import type { ViewEntity } from "#src/interaction";
import {
  deriveLogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { computeStageGroupsLayout } from "#src/layout/stage-groups";
import {
  computeStageZones,
  type StageZones,
  type ZoneRect,
} from "#src/layout/stage-zones";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures";
import { GT036Session } from "#src/templates/GT-036/session";
import {
  GT036ContentSchema,
  GT036DifficultySchema,
} from "#src/templates/GT-036/template";
import {
  findHitPairViolations,
  findSlotsOutsideStage,
} from "../layout/stage-checks.ts";

/**
 * Task #313 — GT-036: nút xoá dải (`BR-E036-13`, ngoại lệ có phạm vi của
 * `BR-PSZ-05`, quyết định của product owner 2026-11-08).
 */
const BAND: AgeBand = "5-6";
const CLEAR_ID = "clear-track";

const found = GT036_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(): GT036Session {
  const session = new GT036Session(f.content, f.difficulty);
  session.prepareRound(BAND);
  return session;
}

function place(session: GT036Session, count: number): void {
  for (let i = 0; i < count; i++) {
    const elementId = f.content.palette[i % 2]?.id ?? "";
    session.commit({
      type: "place_element",
      data: { slotIndex: i, elementId },
    });
  }
}

function clearEntity(session: GT036Session): ViewEntity | undefined {
  return session.getView().entities.find((e) => e.id === CLEAR_ID);
}

function tapClear(session: GT036Session): void {
  const entity = clearEntity(session);
  if (!entity) {
    throw new Error("Thiếu nút xoá dải");
  }
  session.dispatch({ type: "tap", x: entity.x, y: entity.y, timeMs: 1 });
}

describe("GT-036 — nút xoá dải (BR-E036-13)", () => {
  it("ẩn khi dải rỗng, hiện khi có hạt, ẩn lại khi dải về rỗng", () => {
    const session = build();
    expect(clearEntity(session)).toBeUndefined();
    place(session, 2);
    expect(clearEntity(session)).toBeDefined();
    tapClear(session);
    expect(clearEntity(session)).toBeUndefined();
  });

  it("có nhãn đọc, không có nhãn chữ", () => {
    const session = build();
    place(session, 1);
    const entity = clearEntity(session);
    expect(entity?.spokenLabel).toBe("Xoá hết dải");
    expect(entity?.glyph).toBe("🧹");
    expect(entity?.label).toBeUndefined();
  });

  it("là nút (neutral), không phải phần tử để cầm; slot cuối, chỉ số dải và bảng giữ nguyên", () => {
    const session = build();
    place(session, 1);
    const entity = clearEntity(session);
    const trackLength = f.content.track_length;
    const paletteLength = f.content.palette.length;
    expect(entity?.role).toBe("neutral");
    expect(entity?.slotIndex).toBe(trackLength + paletteLength);
    expect(session.slots).toHaveLength(trackLength + paletteLength + 1);
    expect(session.slots[0]?.role).toBe("target");
    expect(session.slots[trackLength]?.role).toBe("source");
  });

  it("chạm nút gỡ hết hạt, mỗi hạt một element_removed", () => {
    const session = build();
    place(session, 4);
    tapClear(session);
    expect(session.placedElements.every((el) => el === null)).toBe(true);
    const removed = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "element_removed");
    expect(removed).toHaveLength(4);
  });

  it("không phải lượt sai, không đổi điểm, không thắng, nút xong mờ", () => {
    const session = build();
    place(session, 4);
    tapClear(session);
    expect(session.score).toBe(0);
    expect(session.checkWinCondition()).toBe(false);
    expect(session.canCommit()).toBe(false);
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names).not.toContain("attempt");
    expect(names).not.toContain("creation_submitted");
  });

  it("xoá rồi đặt lại hạt thì chốt vẫn thắng được", () => {
    const session = build();
    place(session, 3);
    tapClear(session);
    const ids = ["star", "moon", "star", "moon", "star", "moon"];
    ids.forEach((elementId, slotIndex) => {
      session.commit({ type: "place_element", data: { slotIndex, elementId } });
    });
    session.dispatch({ type: "commit", timeMs: 2 });
    expect(session.checkWinCondition()).toBe(true);
  });

  it("xoá dải tắt ô sáng và lời mời sau một lần chốt chưa có luật", () => {
    const session = build();
    for (let i = 0; i < 6; i++) {
      session.commit({
        type: "place_element",
        data: { slotIndex: i, elementId: "star" },
      });
    }
    session.dispatch({ type: "commit", timeMs: 1 });
    tapClear(session);
    expect(session.takeSpokenInvitation()).toBeNull();
    expect(session.getView().entities.some((e) => e.state === "active")).toBe(
      false
    );
  });

  it("chạm vào chỗ nút khi dải rỗng thì không làm gì", () => {
    const session = build();
    place(session, 1);
    const entity = clearEntity(session);
    if (!entity) {
      throw new Error("Thiếu nút");
    }
    session.commit({ type: "clear_track", data: {} });
    const before = removedCount(session);
    session.dispatch({ type: "tap", x: entity.x, y: entity.y, timeMs: 1 });
    expect(session.placedElements.every((el) => el === null)).toBe(true);
    expect(removedCount(session)).toBe(before);
    expect(
      session.validateAction({ type: "clear_track", data: {} }).valid
    ).toBe(false);
  });
});

function removedCount(session: GT036Session): number {
  return session
    .getTelemetry()
    .events.filter((e) => e.event_name === "element_removed").length;
}

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

const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

interface Frame {
  readonly zones: StageZones;
  readonly space: { w: number; h: number };
  readonly cssPerLogic: number;
}

function frameFor(viewport: Viewport, band: AgeBand): Frame {
  const space = deriveLogicSpace(viewport.cssW, viewport.cssH);
  const cssPerLogic = viewport.cssW / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: false,
    needsCommit: true,
  });
  return { zones, space, cssPerLogic };
}

function gapToRect(
  slot: { x: number; y: number; hitW: number; hitH: number },
  rect: ZoneRect
): number {
  const dx = Math.max(
    rect.x - (slot.x + slot.hitW / 2),
    slot.x - slot.hitW / 2 - (rect.x + rect.w)
  );
  const dy = Math.max(
    rect.y - (slot.y + slot.hitH / 2),
    slot.y - slot.hitH / 2 - (rect.y + rect.h)
  );
  return Math.max(dx, dy);
}

/** Bố cục khi chưa có nút xoá: dải trên, bảng phần tử dưới. */
function plainLayout(session: GT036Session, band: AgeBand, frame: Frame) {
  return computeStageGroupsLayout({
    stage: frame.zones.stage,
    ageBand: band,
    cssPerLogic: frame.cssPerLogic,
    groups: [
      { count: session.content.track_length, role: "target" },
      { count: session.content.palette.length, role: "source" },
    ],
  });
}

function prepared(
  create: () => GT036Session,
  band: AgeBand,
  frame: Frame
): GT036Session {
  const session = create();
  session.prepareRound(
    band,
    frame.space,
    frame.zones.stage,
    undefined,
    frame.cssPerLogic
  );
  return session;
}

const LEVELS = [
  ...GT036_FIXTURES.map((fx) => ({
    name: `mẫu ${fx.id}`,
    create: () => new GT036Session(fx.content, fx.difficulty),
  })),
  ...ALL_SEED_LEVELS.filter((l) => l.header.template_code === "GT-036").map(
    (l) => ({
      name: `seed ${l.header.code}`,
      create: () =>
        new GT036Session(
          GT036ContentSchema.parse(l.content_pack),
          GT036DifficultySchema.parse(l.difficulty_params)
        ),
    })
  ),
];

const CASES = VIEWPORTS.flatMap((viewport) =>
  BANDS.map((band) => ({ viewport, band, label: `${viewport.name} ${band}` }))
);

describe.each(CASES)(
  "GT-036 — bố cục nút xoá ở $label",
  ({ viewport, band }) => {
    it.each(LEVELS)(
      "$name — không làm tràn thêm; có ô thì trong sân khấu, ≥ sàn chạm, cách nút xong",
      ({ create }) => {
        const frame = frameFor(viewport, band);
        const session = prepared(create, band, frame);
        const stage = frame.zones.stage;
        const plain = plainLayout(session, band, frame);
        expect(findHitPairViolations(session.slots)).toEqual([]);
        // Ô xoá không bao giờ đẩy ô dải hay phần tử ra khỏi sân khấu.
        expect(
          findSlotsOutsideStage(session.slots, stage).length
        ).toBeLessThanOrEqual(findSlotsOutsideStage(plain, stage).length);

        const clearIndex =
          session.content.track_length + session.content.palette.length;
        const clear = session.slots[clearIndex];
        if (!clear) {
          // Không còn chỗ: bố cục y như khi chưa có nút, và nút không bao giờ hiện.
          expect(session.slots).toEqual(plain);
          place(session, 1);
          expect(clearEntity(session)).toBeUndefined();
          return;
        }
        expect(clear.role).toBe("neutral");
        expect(findSlotsOutsideStage([clear], stage)).toEqual([]);
        const floor = resolveTouchFloor(band, frame.cssPerLogic);
        expect(clear.hitW).toBeGreaterThanOrEqual(floor);
        expect(clear.hitH).toBeGreaterThanOrEqual(floor);
        // Tách khỏi nút xong: cách ít nhất một cạnh chạm, không chỉ một khe.
        expect(gapToRect(clear, frame.zones.action)).toBeGreaterThanOrEqual(
          floor + SLOT_GAP_PX
        );
      }
    );
  }
);

describe("GT-036 — ba cách đặt ô xoá (BR-E036-13)", () => {
  const fixture = LEVELS[0];
  if (!fixture) {
    throw new Error("Thiếu level");
  }

  it("sân khấu rộng: ô xoá là nhóm riêng trước dải, dải và bảng không đổi chỗ khi ô ẩn/hiện", () => {
    const frame = frameFor(
      VIEWPORTS[0] ?? { name: "", cssW: 330, cssH: 697 },
      BAND
    );
    const session = prepared(fixture.create, BAND, frame);
    const clear = session.slots.at(-1);
    const track0 = session.slots[0];
    if (!(clear && track0)) {
      throw new Error("Thiếu slot");
    }
    expect(clear.y).toBeLessThan(track0.y);
    const before = session.slots.map((slot) => [slot.x, slot.y]);
    place(session, 2);
    tapClear(session);
    expect(session.slots.map((slot) => [slot.x, slot.y])).toEqual(before);
  });

  it("sân khấu chật: ô xoá nhường vào đầu hàng bảng phần tử", () => {
    const frame = frameFor({ name: "", cssW: 610, cssH: 350 }, "3-4");
    const session = prepared(fixture.create, "3-4", frame);
    const clear = session.slots.at(-1);
    const pal0 = session.slots[session.content.track_length];
    if (!(clear && pal0)) {
      throw new Error("Thiếu slot");
    }
    expect(clear.role).toBe("neutral");
    expect(clear.y).toBe(pal0.y);
    expect(clear.x).toBeLessThan(pal0.x);
  });

  it("không còn chỗ: không có ô xoá, bố cục như khi chưa có nút", () => {
    const frame = frameFor({ name: "", cssW: 330, cssH: 697 }, "3-4");
    const session = prepared(fixture.create, "3-4", frame);
    expect(session.slots).toEqual(plainLayout(session, "3-4", frame));
    place(session, 2);
    expect(clearEntity(session)).toBeUndefined();
  });
});
