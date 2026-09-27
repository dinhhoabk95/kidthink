import { TOUCH_FLOORS } from "@mindkid/shared/touch-floors";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import {
  computeStageZones,
  type StageZones,
  type StageZonesInput,
  type ZoneRect,
} from "#src/layout/stage-zones";
import {
  LOGIC_PX_FLOOR_CSS_PER_LOGIC,
  LOGIC_PX_FLOOR_ZONES,
} from "#tests/layout/fixtures/stage-zones-logic-px-floor";

const FLOOR_BY_BAND: Record<AgeBand, number> = {
  "3-4": TOUCH_FLOORS.kidBand3_4,
  "4-5": TOUCH_FLOORS.kidPrimary,
  "5-6": TOUCH_FLOORS.kidMin,
};

/**
 * Hộp canvas CSS của ba viewport đo ở plan #277 mục 1.3 (M2): viewport trừ
 * HUD, đệm arena và viền khay gỗ.
 */
const CANVAS_BOXES = [
  { name: "844x390 điện thoại ngang", cssW: 784, cssH: 250 },
  { name: "390x844 điện thoại dọc", cssW: 330, cssH: 697 },
  { name: "1024x768 tablet ngang", cssW: 964, cssH: 628 },
] as const;

const AGE_BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

function inputFor(
  cssW: number,
  cssH: number,
  ageBand: AgeBand,
  flags: { needsTray: boolean; needsCommit: boolean }
): StageZonesInput {
  const logic = deriveLogicSpace(cssW, cssH);
  return {
    logicW: logic.w,
    logicH: logic.h,
    ageBand,
    cssPerLogic: Math.min(cssW, cssH) / Math.min(logic.w, logic.h),
    ...flags,
  };
}

function bottom(rect: ZoneRect): number {
  return rect.y + rect.h;
}

function right(rect: ZoneRect): number {
  return rect.x + rect.w;
}

function isInside(inner: ZoneRect, outer: ZoneRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    right(inner) <= right(outer) &&
    bottom(inner) <= bottom(outer)
  );
}

/** Mọi vùng chạm có cạnh px CSS dưới sàn band — rỗng là đạt `BR-PSZ-04`. */
function touchFloorViolations(
  zones: StageZones,
  cssPerLogic: number,
  ageBand: AgeBand
): string[] {
  const floor = FLOOR_BY_BAND[ageBand];
  const touchZones: ReadonlyArray<readonly [string, ZoneRect]> = [
    ["promptSpeaker", zones.promptSpeaker],
    ["action", zones.action],
  ];
  return touchZones
    .filter(([, rect]) => Math.min(rect.w, rect.h) * cssPerLogic < floor - 1e-9)
    .map(([name]) => name);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("computeStageZones — BR-PSZ-02 hàm thuần", () => {
  it("50 lần gọi cùng input cho 50 kết quả bằng nhau và không đọc Date", () => {
    const dateNow = vi.spyOn(Date, "now");
    const input = inputFor(784, 250, "4-5", {
      needsTray: true,
      needsCommit: true,
    });

    const results = Array.from({ length: 50 }, () => computeStageZones(input));

    for (const result of results) {
      expect(result).toEqual(results[0]);
    }
    expect(dateNow).not.toHaveBeenCalled();
  });

  it("không sửa object input", () => {
    const input = Object.freeze(
      inputFor(330, 697, "3-4", { needsTray: true, needsCommit: true })
    );

    expect(() => computeStageZones(input)).not.toThrow();
  });
});

describe("computeStageZones — BR-PSZ-01 thứ tự năm vùng", () => {
  it("landscape: lời dẫn trên sân khấu, khay và hành động chung hàng đáy", () => {
    const zones = computeStageZones(
      inputFor(964, 628, "4-5", { needsTray: true, needsCommit: true })
    );

    expect(zones.orientation).toBe("landscape");
    expect(zones.tray).not.toBeNull();
    const tray = zones.tray as ZoneRect;
    expect(bottom(zones.prompt)).toBeLessThanOrEqual(zones.stage.y);
    expect(bottom(zones.stage)).toBeLessThanOrEqual(tray.y);
    expect(bottom(zones.stage)).toBeLessThanOrEqual(zones.action.y);
    expect(right(tray)).toBeLessThanOrEqual(zones.action.x);
  });

  it("portrait: lời dẫn, sân khấu, khay, hành động xếp dọc từ trên xuống", () => {
    const zones = computeStageZones(
      inputFor(330, 697, "4-5", { needsTray: true, needsCommit: true })
    );

    expect(zones.orientation).toBe("portrait");
    const tray = zones.tray as ZoneRect;
    expect(bottom(zones.prompt)).toBeLessThanOrEqual(zones.stage.y);
    expect(bottom(zones.stage)).toBeLessThanOrEqual(tray.y);
    expect(bottom(tray)).toBeLessThanOrEqual(zones.action.y);
  });

  it("mọi vùng nằm trong canvas logic và loa nằm trong vùng lời dẫn", () => {
    for (const box of CANVAS_BOXES) {
      for (const needsTray of [true, false]) {
        const input = inputFor(box.cssW, box.cssH, "3-4", {
          needsTray,
          needsCommit: true,
        });
        const canvas: ZoneRect = {
          x: 0,
          y: 0,
          w: input.logicW,
          h: input.logicH,
        };
        const zones = computeStageZones(input);
        const rects = [zones.prompt, zones.stage, zones.action];
        if (zones.tray) {
          rects.push(zones.tray);
        }

        for (const rect of rects) {
          expect(isInside(rect, canvas), `${box.name} tray=${needsTray}`).toBe(
            true
          );
          expect(rect.h, `${box.name} tray=${needsTray}`).toBeGreaterThan(0);
        }
        expect(isInside(zones.promptSpeaker, zones.prompt)).toBe(true);
      }
    }
  });

  it("không có khay thì tray là null và sân khấu cao hơn", () => {
    const withTray = computeStageZones(
      inputFor(330, 697, "4-5", { needsTray: true, needsCommit: true })
    );
    const withoutTray = computeStageZones(
      inputFor(330, 697, "4-5", { needsTray: false, needsCommit: true })
    );

    expect(withoutTray.tray).toBeNull();
    expect(withoutTray.stage.h).toBeGreaterThan(withTray.stage.h);
  });

  it("needsCommit false vẫn tính rect hành động, cùng chỗ với needsCommit true", () => {
    const withCommit = computeStageZones(
      inputFor(784, 250, "5-6", { needsTray: true, needsCommit: true })
    );
    const withoutCommit = computeStageZones(
      inputFor(784, 250, "5-6", { needsTray: true, needsCommit: false })
    );

    expect(withoutCommit.action).toEqual(withCommit.action);
  });
});

describe("computeStageZones — BR-PSZ-03 khung không đổi theo engine", () => {
  it("844x390 band 4-5: prompt, promptSpeaker, action bằng nhau khi có và không có khay", () => {
    const withTray = computeStageZones(
      inputFor(784, 250, "4-5", { needsTray: true, needsCommit: true })
    );
    const withoutTray = computeStageZones(
      inputFor(784, 250, "4-5", { needsTray: false, needsCommit: true })
    );

    expect(withoutTray.prompt).toEqual(withTray.prompt);
    expect(withoutTray.promptSpeaker).toEqual(withTray.promptSpeaker);
    expect(withoutTray.action).toEqual(withTray.action);
  });
});

describe("computeStageZones — BR-PSZ-04 sàn chạm trên px CSS thật", () => {
  it("390x844 band 3-4: loa và nút hành động không dưới 96px thật", () => {
    const input = inputFor(330, 697, "3-4", {
      needsTray: true,
      needsCommit: true,
    });

    const zones = computeStageZones(input);

    expect(touchFloorViolations(zones, input.cssPerLogic, "3-4")).toEqual([]);
  });

  it("mọi viewport đo ở M2 và mọi band: không vùng chạm nào dưới sàn", () => {
    for (const box of CANVAS_BOXES) {
      for (const ageBand of AGE_BANDS) {
        const input = inputFor(box.cssW, box.cssH, ageBand, {
          needsTray: true,
          needsCommit: true,
        });

        const zones = computeStageZones(input);

        expect(
          touchFloorViolations(zones, input.cssPerLogic, ageBand),
          `${box.name} band ${ageBand}`
        ).toEqual([]);
      }
    }
  });

  it("ca âm: vùng tính theo sàn logic px ở cssPerLogic 0,72 bị báo vi phạm", () => {
    expect(
      touchFloorViolations(
        LOGIC_PX_FLOOR_ZONES,
        LOGIC_PX_FLOOR_CSS_PER_LOGIC,
        "3-4"
      )
    ).toEqual(["promptSpeaker", "action"]);
  });
});

describe("computeStageZones — input không hợp lệ", () => {
  it("cssPerLogic 0 hoặc NaN không sinh NaN trong vùng", () => {
    for (const cssPerLogic of [0, Number.NaN, -1]) {
      const zones = computeStageZones({
        logicW: 960,
        logicH: 540,
        ageBand: "4-5",
        cssPerLogic,
        needsTray: true,
        needsCommit: true,
      });

      const values = [
        zones.prompt,
        zones.promptSpeaker,
        zones.stage,
        zones.action,
      ].flatMap((rect) => [rect.x, rect.y, rect.w, rect.h]);
      expect(values.every(Number.isFinite), `cssPerLogic=${cssPerLogic}`).toBe(
        true
      );
    }
  });
});
