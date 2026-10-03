import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { LAYOUT_IDS, resolveLayout } from "#src/layout/registry";
import golden from "./fixtures/layout-golden.json" with { type: "json" };

/**
 * `BR-LAY-10`: geometry layout đã publish là breaking. Layout KHÔNG có `stage`
 * và KHÔNG có `cssPerLogic` phải ra đúng như trước Task #283 N. Fixture là hash
 * sha1 (12 ký tự đầu) của slot, chụp từ mã trước khi thêm `stage`/`cssPerLogic`,
 * cho mọi `LayoutId` × band × không gian logic × slotCount × targetCount.
 */
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
const LOGICS = [
  [0, 0],
  [540, 1000],
  [960, 540],
  [1280, 540],
] as const;
const SLOT_COUNTS = [1, 2, 3, 4, 5, 6, 8, 9, 12, 16, 24] as const;
const TARGET_COUNTS = [undefined, 2] as const;
const GOLDEN: Readonly<Record<string, string>> = golden;

function hashSlots(slots: readonly object[]): string {
  return createHash("sha1")
    .update(JSON.stringify(slots))
    .digest("hex")
    .slice(0, 12);
}

describe("golden layout không stage (BR-LAY-10)", () => {
  it.each(LAYOUT_IDS)("%s giữ nguyên mọi tổ hợp đã chụp", (id) => {
    const mismatches: string[] = [];
    let checked = 0;
    for (const band of BANDS) {
      for (const [lw, lh] of LOGICS) {
        for (const n of SLOT_COUNTS) {
          for (const t of TARGET_COUNTS) {
            const key = `${id}|${band}|${lw}x${lh}|${n}|${t ?? "-"}`;
            const slots = resolveLayout(id)({
              slotCount: n,
              ageBand: band,
              targetCount: t,
              logic: lw ? { w: lw, h: lh } : undefined,
            });
            checked += 1;
            if (hashSlots(slots) !== GOLDEN[key]) {
              mismatches.push(key);
            }
          }
        }
      }
    }
    expect(checked).toBe(3 * 4 * 11 * 2);
    expect(mismatches).toEqual([]);
  });
});
