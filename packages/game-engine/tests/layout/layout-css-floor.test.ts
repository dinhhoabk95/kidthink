import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace, getTouchFloor } from "#src/layout/constants";
import { LAYOUT_IDS, resolveLayout } from "#src/layout/registry";
import { computeStageZones } from "#src/layout/stage-zones";
import type { LayoutId, LayoutInput, Slot } from "#src/layout/types";
import debt from "../layout-stage-overflow-debt.json" with { type: "json" };
import { layoutWithLogicPxFloor } from "./fixtures/layout-ignores-css-floor.ts";
import { findSlotsOutsideStage } from "./stage-checks.ts";

/**
 * `BR-PSZ-04` cho layout: sàn chạm tính trên px CSS thật. Portrait 390x844 còn
 * hộp canvas 330x697 sau HUD (`stage-zones.test.ts`, `CANVAS_BOXES`).
 */
const CSS_W = 330;
const CSS_H = 697;
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
/** Số slot lớn nhất mà bộ nội dung seed dùng cho một layout, làm tròn lên. */
const LARGEST_SLOT_COUNT = 12;

const LOGIC = deriveLogicSpace(CSS_W, CSS_H);
const CSS_PER_LOGIC = Math.min(CSS_W, CSS_H) / Math.min(LOGIC.w, LOGIC.h);

function stageFor(band: AgeBand) {
  return computeStageZones({
    logicW: LOGIC.w,
    logicH: LOGIC.h,
    ageBand: band,
    cssPerLogic: CSS_PER_LOGIC,
    needsTray: false,
    needsCommit: true,
  }).stage;
}

function inputFor(band: AgeBand): LayoutInput {
  return {
    slotCount: LARGEST_SLOT_COUNT,
    targetCount: LARGEST_SLOT_COUNT / 2,
    ageBand: band,
    stage: stageFor(band),
    cssPerLogic: CSS_PER_LOGIC,
  };
}

/** Slot bấm được (không phải vùng tham chiếu `neutral`) có vùng chạm dưới sàn px CSS. */
function findBelowCssFloor(slots: readonly Slot[], band: AgeBand): number[] {
  const floor = getTouchFloor(band);
  return slots
    .filter((slot) => slot.role !== "neutral")
    .filter(
      (slot) => Math.min(slot.hitW, slot.hitH) * CSS_PER_LOGIC < floor - 0.01
    )
    .map((slot) => slot.index);
}

describe("sàn chạm px CSS thật ở portrait 330x697 (BR-PSZ-04)", () => {
  it.each(LAYOUT_IDS)(
    "%s — vùng chạm × cssPerLogic ≥ sàn band ở slotCount lớn nhất",
    (id) => {
      for (const band of BANDS) {
        const slots = resolveLayout(id)(inputFor(band));

        expect(findBelowCssFloor(slots, band), `${id} ${band}`).toEqual([]);
      }
    }
  );

  it("ca âm: layout tính sàn ở logic px bị báo vi phạm ở ít nhất một LayoutId", () => {
    const violating: LayoutId[] = LAYOUT_IDS.filter((id) =>
      BANDS.some(
        (band) =>
          findBelowCssFloor(layoutWithLogicPxFloor(id, inputFor(band)), band)
            .length > 0
      )
    );

    // Đo 17/24: layout có ô lớn hơn sàn (lưới, một ô) tình cờ vẫn qua; phép
    // kiểm phải bắt được ít nhất các layout bipartite và đường chạy.
    expect(violating).toEqual(
      expect.arrayContaining([
        "top-source-bottom-target",
        "left-source-right-target",
        "horizontal-track",
      ])
    );
  });
});

/**
 * Nợ còn lại của `BR-PSZ-04` nhánh thay thế (giảm cột / phân trang): sàn lớn
 * hơn ở px CSS làm nhiều layout không còn vừa `zones.stage`. Số đo ở
 * `slotCount` 12, `targetCount` 6, portrait 330x697. Số chỉ được giảm.
 */
describe("nợ tràn zones.stage khi sàn tính trên px CSS thật", () => {
  const pairs: Readonly<Record<string, number>> = debt.pairs;

  it.each(LAYOUT_IDS)("%s — tràn không vượt sổ nợ", (id) => {
    for (const band of BANDS) {
      const input = inputFor(band);
      const slots = resolveLayout(id)(input);
      const outside = findSlotsOutsideStage(slots, stageFor(band)).length;
      const allowed = pairs[`${id}/${band}`] ?? 0;

      expect(outside, `${id} ${band}`).toBeLessThanOrEqual(allowed);
    }
  });
});
