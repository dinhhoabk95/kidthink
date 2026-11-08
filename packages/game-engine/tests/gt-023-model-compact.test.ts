import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace, SLOT_GAP_PX } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures";
import { GT023Session } from "#src/templates/GT-023/session";

/**
 * GT-023 xem bằng mắt (Phase 24, `BR-E023-11`): các ô đích của một hình ghép
 * nằm liền nhau theo đúng hình mẫu. Trên điện thoại dọc, mái và thân nhà từng
 * cách nhau ~450 px vì hai trục co độc lập và lấp đầy sân khấu cao.
 */
const FRAMES = [
  { name: "360x640", w: 360, h: 640 },
  { name: "390x844", w: 390, h: 844 },
  { name: "330x697", w: 330, h: 697 },
  { name: "610x350", w: 610, h: 350 },
  { name: "964x628", w: 964, h: 628 },
] as const;
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

function separation(a: Slot, b: Slot): number {
  const dx = Math.abs(a.x - b.x) - (a.hitW + b.hitW) / 2;
  const dy = Math.abs(a.y - b.y) - (a.hitH + b.hitH) / 2;
  return Math.max(dx, dy);
}

function anchorSlots(
  fixture: (typeof GT023_FIXTURES)[number],
  band: AgeBand,
  frame: (typeof FRAMES)[number]
): readonly Slot[] {
  const session = new GT023Session(fixture.content, fixture.difficulty, 1);
  const space = deriveLogicSpace(frame.w, frame.h);
  const cssPerLogic = frame.w / space.w;
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
  session.prepareRound(
    band,
    space,
    zones.stage,
    zones.tray ?? undefined,
    cssPerLogic
  );
  return session.targetSlots;
}

describe("GT-023: ô đích liền nhau theo hình mẫu (BR-E023-11)", () => {
  it("cặp ô gần nhất cách nhau <= 2 x SLOT_GAP_PX, ở mọi khung, band và level", () => {
    const problems: string[] = [];
    GT023_FIXTURES.forEach((fixture, fi) => {
      for (const band of BANDS) {
        for (const frame of FRAMES) {
          const slots = anchorSlots(fixture, band, frame);
          let nearest = Number.POSITIVE_INFINITY;
          for (let i = 0; i < slots.length; i++) {
            for (let j = i + 1; j < slots.length; j++) {
              const a = slots[i];
              const b = slots[j];
              if (a && b) {
                nearest = Math.min(nearest, separation(a, b));
              }
            }
          }
          if (nearest > 2 * SLOT_GAP_PX) {
            problems.push(
              `mẫu ${fi} ${band} ${frame.name}: ${Math.round(nearest)}`
            );
          }
        }
      }
    });
    expect(problems, problems.slice(0, 5).join("; ")).toEqual([]);
  });

  it("giữ tỉ lệ hình mẫu: hai trục co cùng hệ số", () => {
    const fixture = GT023_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture");
    }
    const anchors = fixture.content.anchors;
    for (const frame of FRAMES) {
      const slots = anchorSlots(fixture, "4-5", frame);
      const [a0, a1] = [anchors[0], anchors[1]];
      const [s0, s1] = [slots[0], slots[1]];
      if (!(a0 && a1 && s0 && s1)) {
        throw new Error("Thiếu mỏ neo");
      }
      const dxC = Math.abs(a0.x - a1.x);
      const dyC = Math.abs(a0.y - a1.y);
      const dxS = Math.abs(s0.x - s1.x);
      const dyS = Math.abs(s0.y - s1.y);
      // Mái nằm trên thân, cùng cột: không lệch ngang, thứ tự trên-dưới giữ nguyên.
      expect(dxC === 0 ? dxS <= 1 : dxS > 0).toBe(true);
      expect(Math.sign(s0.y - s1.y)).toBe(Math.sign(a0.y - a1.y));
      if (dxC > 0 && dyC > 0) {
        expect(dxS / dyS).toBeCloseTo(dxC / dyC, 1);
      }
    }
  });
});
