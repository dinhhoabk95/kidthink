import { vi } from "vitest";
import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

/**
 * Phép kiểm khung dùng chung cho các engine chuyển vào năm vùng (Task #277 S7):
 * `BR-LAY-05` (vùng chạm không chồng, cách nhau ≥ `SLOT_GAP_PX`) và
 * `BR-PSZ-01` (slot và mọi lệnh vẽ nằm trong `zones.stage`).
 */

/** Sai số làm tròn cho phép khi so toạ độ vẽ với mép sân khấu. */
const EDGE_TOLERANCE_PX = 1;

interface HitBox {
  readonly index: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

function hitBox(slot: Slot): HitBox {
  return {
    index: slot.index,
    left: slot.x - slot.hitW / 2,
    right: slot.x + slot.hitW / 2,
    top: slot.y - slot.hitH / 2,
    bottom: slot.y + slot.hitH / 2,
  };
}

/** Khoảng trống giữa hai vùng chạm; âm khi chồng nhau. */
function separation(a: HitBox, b: HitBox): number {
  const dx = Math.max(b.left - a.right, a.left - b.right);
  const dy = Math.max(b.top - a.bottom, a.top - b.bottom);
  return Math.max(dx, dy);
}

/** `BR-LAY-05`: mọi cặp slot cùng trang phải cách nhau ít nhất `SLOT_GAP_PX`. */
export function findHitPairViolations(slots: readonly Slot[]): string[] {
  const violations: string[] = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (!(a && b) || a.page !== b.page) {
        continue;
      }
      const gap = separation(hitBox(a), hitBox(b));
      if (gap < SLOT_GAP_PX) {
        violations.push(`slot ${a.index} và ${b.index} cách ${gap}`);
      }
    }
  }
  return violations;
}

function isPointInStage(x: number, y: number, stage: ZoneRect): boolean {
  return (
    x >= stage.x - EDGE_TOLERANCE_PX &&
    x <= stage.x + stage.w + EDGE_TOLERANCE_PX &&
    y >= stage.y - EDGE_TOLERANCE_PX &&
    y <= stage.y + stage.h + EDGE_TOLERANCE_PX
  );
}

/** `BR-PSZ-01`: vùng chạm của mọi slot nằm trọn trong sân khấu. */
export function findSlotsOutsideStage(
  slots: readonly Slot[],
  stage: ZoneRect
): string[] {
  return slots
    .map(hitBox)
    .filter(
      (box) =>
        !(
          isPointInStage(box.left, box.top, stage) &&
          isPointInStage(box.right, box.bottom, stage)
        )
    )
    .map((box) => `slot ${box.index} ở [${box.left}, ${box.top}]`);
}

/**
 * Ghi mọi lệnh vẽ có toạ độ và trả về những lệnh rơi ra ngoài sân khấu.
 * Theo dõi `translate` qua `save`/`restore` — thân đất sét vẽ quanh gốc đã dời.
 */
export function findDrawsOutsideStage(
  stage: ZoneRect,
  draw: (ctx: CanvasRenderingContext2D) => void
): string[] {
  const fake = createFakeCanvas(stage.x + stage.w, stage.y + stage.h);
  const ctx = fake.getContext("2d");
  if (!ctx) {
    throw new Error("Fake canvas không có context");
  }
  const violations: string[] = [];
  const offsets: Array<{ x: number; y: number }> = [];
  let offset = { x: 0, y: 0 };

  const check = (name: string, x: number, y: number): void => {
    const px = x + offset.x;
    const py = y + offset.y;
    if (!isPointInStage(px, py, stage)) {
      violations.push(`${name} tại (${px}, ${py})`);
    }
  };
  const checkRect = (
    name: string,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    check(`${name}:đầu`, x, y);
    check(`${name}:cuối`, x + w, y + h);
  };

  vi.spyOn(ctx, "save").mockImplementation(() => {
    offsets.push(offset);
  });
  vi.spyOn(ctx, "restore").mockImplementation(() => {
    offset = offsets.pop() ?? { x: 0, y: 0 };
  });
  vi.spyOn(ctx, "translate").mockImplementation((dx: number, dy: number) => {
    offset = { x: offset.x + dx, y: offset.y + dy };
  });
  vi.spyOn(ctx, "moveTo").mockImplementation((x: number, y: number) =>
    check("moveTo", x, y)
  );
  vi.spyOn(ctx, "lineTo").mockImplementation((x: number, y: number) =>
    check("lineTo", x, y)
  );
  vi.spyOn(ctx, "fillText").mockImplementation(
    (text: string, x: number, y: number) => check(`fillText(${text})`, x, y)
  );
  vi.spyOn(ctx, "arc").mockImplementation((x: number, y: number, r: number) =>
    checkRect("arc", x - r, y - r, 2 * r, 2 * r)
  );
  vi.spyOn(ctx, "roundRect").mockImplementation(
    (x: number, y: number, w: number, h: number) =>
      checkRect("roundRect", x, y, w, h)
  );
  vi.spyOn(ctx, "rect").mockImplementation(
    (x: number, y: number, w: number, h: number) =>
      checkRect("rect", x, y, w, h)
  );
  vi.spyOn(ctx, "fillRect").mockImplementation(
    (x: number, y: number, w: number, h: number) =>
      checkRect("fillRect", x, y, w, h)
  );
  vi.spyOn(ctx, "strokeRect").mockImplementation(
    (x: number, y: number, w: number, h: number) =>
      checkRect("strokeRect", x, y, w, h)
  );

  draw(ctx as CanvasRenderingContext2D);
  return violations;
}
