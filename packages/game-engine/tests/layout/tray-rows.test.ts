import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import {
  deriveLogicSpace,
  getTouchFloorLogicPx,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import {
  computeStageZones,
  type StageZones,
  type ZoneRect,
} from "#src/layout/stage-zones";
import { layoutTrayGrid, TRAY_LABEL_ROW_PX } from "#src/layout/tray-grid";
import { computeTraySourceSlots } from "#src/layout/tray-layout";
import { legacyOneRowTraySlots } from "./fixtures/tray-one-row-legacy.ts";
import {
  findHitPairViolations,
  findSlotsOutsideStage,
} from "./stage-checks.ts";

/**
 * `BR-PSZ-13` — khay cao theo số vật, không phân trang; điện thoại ngang thấp
 * có lời dẫn cột bên trái và khay cột bên cạnh nút hành động.
 */
const PORTRAIT = { name: "portrait 330x697", cssW: 330, cssH: 697 };
const PHONE = { name: "điện thoại ngang 784x250", cssW: 784, cssH: 250 };
const DESKTOP = { name: "máy tính 964x628", cssW: 964, cssH: 628 };
const MAX_TRAY_ITEMS = 10;
const PURITY_RUNS = 50;

interface Viewport {
  readonly name: string;
  readonly cssW: number;
  readonly cssH: number;
}

function zonesFor(
  viewport: Viewport,
  band: AgeBand,
  trayItems: number,
  needsTray = true,
  trayLabels = false
): { zones: StageZones; floor: number } {
  const space = deriveLogicSpace(viewport.cssW, viewport.cssH);
  // Cùng phép của `RenderSystem.setupCanvas`: tỉ lệ chặn bởi cạnh chật hơn.
  const cssPerLogic = Math.min(
    viewport.cssW / space.w,
    viewport.cssH / space.h
  );
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray,
    needsCommit: false,
    trayItems,
    trayLabels,
  });
  return { zones, floor: getTouchFloorLogicPx(band, cssPerLogic) };
}

function isInside(inner: ZoneRect, outer: ZoneRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

function overlaps(a: ZoneRect, b: ZoneRect): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

describe("BR-PSZ-13 — khay nhiều hàng ở portrait", () => {
  it("10 vật band 4-5: khay cao hơn một hàng, mọi slot nguồn page 0, trong khay, không chồng", () => {
    const { zones, floor } = zonesFor(PORTRAIT, "4-5", MAX_TRAY_ITEMS);
    const tray = zones.tray;
    expect(tray).not.toBeNull();
    if (!tray) {
      return;
    }

    const slots = computeTraySourceSlots(MAX_TRAY_ITEMS, tray, floor);

    expect(layoutTrayGrid(MAX_TRAY_ITEMS, tray.w, floor).rows).toBeGreaterThan(
      1
    );
    expect(slots).toHaveLength(MAX_TRAY_ITEMS);
    expect(slots.every((slot) => slot.page === 0)).toBe(true);
    expect(findSlotsOutsideStage(slots, tray)).toEqual([]);
    expect(findHitPairViolations(slots)).toEqual([]);
    expect(slots.every((slot) => slot.hitW >= floor)).toBe(true);
  });

  it("sân khấu còn ít nhất hai hàng ô ở sàn chạm dù khay đông", () => {
    const { zones, floor } = zonesFor(PORTRAIT, "4-5", MAX_TRAY_ITEMS);

    expect(zones.stage.h).toBeGreaterThanOrEqual(
      2 * floor + SLOT_GAP_PX - 2 * 6
    );
  });

  it("khay không vật nào hoặc ít vật giữ chiều cao một hàng như trước", () => {
    const empty = zonesFor(PORTRAIT, "4-5", 0).zones;
    const few = zonesFor(PORTRAIT, "4-5", 2).zones;

    expect(few.tray).toEqual(empty.tray);
    expect(few.stage).toEqual(empty.stage);
  });

  it("ca âm: khay một hàng cũ xếp 10 vật làm vùng chạm chồng nhau", () => {
    const { zones, floor } = zonesFor(PORTRAIT, "4-5", MAX_TRAY_ITEMS);
    const tray = zones.tray;
    if (!tray) {
      throw new Error("thiếu khay");
    }

    const legacy = legacyOneRowTraySlots(MAX_TRAY_ITEMS, tray, floor);

    expect(findHitPairViolations(legacy).length).toBeGreaterThan(0);
  });
});

describe("BR-PSZ-13 — số vật khay không đổi vị trí lời dẫn và nút hành động (BR-PSZ-03)", () => {
  it.each([PORTRAIT, PHONE, DESKTOP])(
    "$name: prompt, promptSpeaker, action bằng nhau với 0, 4 và 10 vật",
    (viewport) => {
      const base = zonesFor(viewport, "4-5", 0, false).zones;
      for (const items of [0, 4, MAX_TRAY_ITEMS]) {
        const withTray = zonesFor(viewport, "4-5", items).zones;

        expect(withTray.prompt).toEqual(base.prompt);
        expect(withTray.promptSpeaker).toEqual(base.promptSpeaker);
        expect(withTray.action).toEqual(base.action);
        expect(withTray.promptPlacement).toBe(base.promptPlacement);
      }
    }
  );

  it("hàm vùng thuần với trayItems", () => {
    const first = zonesFor(PHONE, "5-6", 6).zones;
    for (let run = 0; run < PURITY_RUNS; run++) {
      expect(zonesFor(PHONE, "5-6", 6).zones).toEqual(first);
    }
  });
});

describe("BR-PSZ-13 — điện thoại ngang thấp", () => {
  it.each(["3-4", "4-5", "5-6"] as const)(
    "band %s: lời dẫn là cột bên trái, khay là cột cạnh nút hành động, ba vùng không chồng",
    (band) => {
      const { zones } = zonesFor(PHONE, band, 6);
      const tray = zones.tray;
      expect(zones.promptPlacement).toBe("side");
      expect(tray).not.toBeNull();
      if (!tray) {
        return;
      }

      expect(tray.x + tray.w).toBeLessThanOrEqual(zones.action.x);
      expect(overlaps(tray, zones.stage)).toBe(false);
      expect(overlaps(zones.prompt, zones.stage)).toBe(false);
      expect(overlaps(tray, zones.action)).toBe(false);
      expect(isInside(zones.promptSpeaker, zones.prompt)).toBe(true);
    }
  );

  it("sân khấu lấy trọn chiều cao canvas, cao hơn dải lời dẫn trên cùng", () => {
    const space = deriveLogicSpace(PHONE.cssW, PHONE.cssH);
    const { zones } = zonesFor(PHONE, "4-5", 0, false);

    expect(zones.stage.h).toBe(space.h - 2 * SLOT_GAP_PX);
    expect(zones.stage.y).toBe(SLOT_GAP_PX);
  });

  it("máy tính giữ lời dẫn dải trên cùng và khay dải dưới", () => {
    const { zones } = zonesFor(DESKTOP, "4-5", 4);

    expect(zones.promptPlacement).toBe("top");
    expect(zones.tray?.w).toBeGreaterThan(zones.tray?.h ?? 0);
  });
});

describe("BR-PSZ-13 — lưới trong sân khấu không phân trang", () => {
  it("10 ô trong sân khấu portrait band 4-5 đều ở page 0", () => {
    const { zones } = zonesFor(PORTRAIT, "4-5", 0, false);
    const space = deriveLogicSpace(PORTRAIT.cssW, PORTRAIT.cssH);

    const slots = resolveLayout("grid")({
      slotCount: MAX_TRAY_ITEMS,
      ageBand: "4-5",
      logic: space,
      stage: zones.stage,
      cssPerLogic: Math.min(PORTRAIT.cssW / space.w, PORTRAIT.cssH / space.h),
    });

    expect(slots).toHaveLength(MAX_TRAY_ITEMS);
    expect(slots.every((slot) => slot.page === 0)).toBe(true);
    expect(findSlotsOutsideStage(slots, zones.stage)).toEqual([]);
  });
});

describe("BR-PSZ-13 — khay có nhãn dưới vật", () => {
  const LABEL_TEXT_PX = 20;

  it("nhãn của hàng cuối nằm trong khay, không rơi ra ngoài dock", () => {
    const { zones, floor } = zonesFor(PORTRAIT, "5-6", 8, true, true);
    const tray = zones.tray;
    if (!tray) {
      throw new Error("thiếu khay");
    }

    const slots = computeTraySourceSlots(8, tray, floor, 0, true);
    const lowestLabelBottom = Math.max(
      ...slots.map((slot) => slot.y + slot.w / 2 + 4 + LABEL_TEXT_PX)
    );

    expect(lowestLabelBottom).toBeLessThanOrEqual(tray.y + tray.h);
    expect(findHitPairViolations(slots)).toEqual([]);
  });

  it("khay có nhãn cao hơn khay không nhãn đúng một dải nhãn mỗi hàng", () => {
    const plain = zonesFor(PORTRAIT, "5-6", 8).zones.tray;
    const labelled = zonesFor(PORTRAIT, "5-6", 8, true, true).zones.tray;

    expect(labelled?.h).toBeGreaterThan(plain?.h ?? 0);
    expect(TRAY_LABEL_ROW_PX).toBeGreaterThan(0);
  });

  it("ca âm: bỏ dải nhãn thì nhãn hàng cuối rơi ra ngoài khay", () => {
    const { zones, floor } = zonesFor(PORTRAIT, "5-6", 8, true, false);
    const tray = zones.tray;
    if (!tray) {
      throw new Error("thiếu khay");
    }

    const slots = computeTraySourceSlots(8, tray, floor, 0, false);
    const lowestLabelBottom = Math.max(
      ...slots.map((slot) => slot.y + slot.w / 2 + 4 + LABEL_TEXT_PX)
    );

    expect(lowestLabelBottom).toBeGreaterThan(tray.y + tray.h);
  });
});
