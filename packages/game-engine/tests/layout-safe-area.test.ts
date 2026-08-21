import { describe, expect, it } from "vitest";
import type { AgeBand } from "../src/contracts/types.js";
import { ALL_TEMPLATES } from "../src/generated/template-registry.js";
import {
  LOGIC_HEIGHT,
  LOGIC_WIDTH,
  SAFE_MARGIN_PX,
} from "../src/layout/constants.js";
import { resolveLayout } from "../src/layout/registry.js";
import DEBT from "./layout-safe-area-debt.json" with { type: "json" };

/**
 * BR-LAY-09 quét đúng **dải mà khuôn tự khai** — không phải một cấu hình duy nhất.
 *
 * Test BR-LAY-09 cũ chỉ gọi mỗi layout một lần với `slotCount: 4, targetCount: 2`,
 * nên nó xanh trong khi sáu cặp khuôn-layout tràn lề ở số slot mà chính khuôn cho
 * phép. Quét cả dải là cách duy nhất thấy được điều đó.
 *
 * Nợ đã đo nằm ở `layout-safe-area-debt.json`. Cặp không có trong đó phải sạch.
 */
const ALL_BANDS: AgeBand[] = ["3-4", "4-5", "5-6"];
const KNOWN_DEBT: Record<string, number> = DEBT.pairs;

function bandsFor(ageMin: number, ageMax: number): AgeBand[] {
  return ALL_BANDS.filter((band) => {
    const low = Number(band.split("-")[0]);
    return low >= ageMin && low <= ageMax;
  });
}

function isOutsideSafeArea(slot: {
  x: number;
  y: number;
  w: number;
  h: number;
}): boolean {
  return (
    slot.x - slot.w / 2 < SAFE_MARGIN_PX - 2 ||
    slot.x + slot.w / 2 > LOGIC_WIDTH - SAFE_MARGIN_PX + 2 ||
    slot.y - slot.h / 2 < SAFE_MARGIN_PX - 2 ||
    slot.y + slot.h / 2 > LOGIC_HEIGHT - SAFE_MARGIN_PX + 2
  );
}

function countOverflow(
  template: (typeof ALL_TEMPLATES)[string],
  layout: string
): number {
  const layoutFn = resolveLayout(layout as Parameters<typeof resolveLayout>[0]);
  let overflow = 0;
  for (const band of bandsFor(template.age_min, template.age_max)) {
    for (
      let slotCount = template.limits.item_count[0];
      slotCount <= template.limits.item_count[1];
      slotCount++
    ) {
      for (
        let targetCount = template.limits.target_count[0];
        targetCount <= template.limits.target_count[1];
        targetCount++
      ) {
        for (const slot of layoutFn({
          slotCount,
          ageBand: band,
          targetCount,
        })) {
          if (isOutsideSafeArea(slot)) {
            overflow++;
          }
        }
      }
    }
  }
  return overflow;
}

describe("BR-LAY-09 trên dải limits của từng khuôn", () => {
  const measured: Record<string, number> = {};
  for (const template of Object.values(ALL_TEMPLATES)) {
    for (const layout of template.layouts) {
      const key = `${template.code}/${layout}`;
      const overflow = countOverflow(template, layout);
      if (overflow > 0) {
        measured[key] = overflow;
      }
    }
  }

  it("không cặp khuôn-layout nào tràn lề ngoài danh sách nợ đã ghi", () => {
    const unlisted = Object.keys(measured).filter(
      (key) => !(key in KNOWN_DEBT)
    );
    expect(unlisted).toEqual([]);
  });

  it("nợ đã ghi không lớn thêm", () => {
    const grown = Object.entries(measured)
      .filter(([key, count]) => count > (KNOWN_DEBT[key] ?? 0))
      .map(([key, count]) => `${key}: ${count} > ${KNOWN_DEBT[key] ?? 0}`);
    expect(grown).toEqual([]);
  });

  it("hàng nợ đã trả thì phải xoá khỏi file, không để lại", () => {
    const stale = Object.keys(KNOWN_DEBT).filter((key) => !(key in measured));
    expect(stale).toEqual([]);
  });
});
