import { describe, expect, it } from "vitest";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures";
import { GT030Session } from "#src/templates/GT-030/session";

/**
 * Task #313 Phase 3 — GT-030: ô đặt không vẽ sẵn (không lộ đáp số), thả lệch
 * quá dung sai thì đơn vị không bám và khe/chồng hiện ra (`BR-E030-05`, `BR-E030-06`).
 */
const found = GT030_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(): GT030Session {
  const session = new GT030Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function dropAt(session: GT030Session, dx: number, dy = 0) {
  const length = f.content.object.length_in_units;
  const source = session.slots[1 + length];
  const next = session.slots[1 + session.getPlacedUnitsCount()];
  if (!(source && next)) {
    throw new Error("Thiếu slot");
  }
  return session.dispatch({
    type: "drop",
    fromX: source.x,
    fromY: source.y,
    toX: next.x + dx,
    toY: next.y + dy,
    timeMs: 10,
  });
}

describe("GT-030 — không vẽ sẵn số ô (BR-E030-05)", () => {
  it("view chỉ có đơn vị đã đặt và tối đa một mép kế tiếp, không đủ L ô", () => {
    const session = build();
    const cells = session
      .getView()
      .entities.filter((e) => e.id.startsWith("unit_slot_"));
    expect(cells.length).toBeLessThanOrEqual(1);
    dropAt(session, 0);
    dropAt(session, 0);
    const after = session
      .getView()
      .entities.filter((e) => e.id.startsWith("unit_slot_"));
    expect(after.length).toBeLessThanOrEqual(3);
    expect(after.length).toBeLessThan(f.content.object.length_in_units);
  });
});

describe("GT-030 — khe và chồng lấn nhìn thấy được (BR-E030-06)", () => {
  it("thả sát mép kế tiếp thì bám dính và đặt", () => {
    const session = build();
    const verdict = dropAt(session, 2);
    expect(verdict?.valid).toBe(true);
    expect(session.getPlacedUnitsCount()).toBe(1);
  });

  it("thả hở quá dung sai: không bám, báo nhẹ, khe hiện ra", () => {
    const session = build();
    const next = session.slots[1];
    if (!next) {
      throw new Error("Thiếu slot");
    }
    const verdict = dropAt(session, next.w * 0.6);
    expect(verdict?.valid).toBe(false);
    expect(verdict?.feedback).toBe("amber_soft");
    expect(session.getPlacedUnitsCount()).toBe(0);
    expect(session.getGapFlash()?.kind).toBe("gap");
  });

  it("thả chồng lấn quá dung sai: không bám, khe loại chồng", () => {
    const session = build();
    dropAt(session, 0);
    const next = session.slots[2];
    if (!next) {
      throw new Error("Thiếu slot");
    }
    const verdict = dropAt(session, -next.w * 0.6);
    expect(verdict?.valid).toBe(false);
    expect(session.getPlacedUnitsCount()).toBe(1);
    expect(session.getGapFlash()?.kind).toBe("overlap");
  });

  it("khe tự tắt sau một nhịp", () => {
    const session = build();
    const next = session.slots[1];
    if (!next) {
      throw new Error("Thiếu slot");
    }
    dropAt(session, next.w * 0.6);
    session.update(2000);
    expect(session.getGapFlash()).toBeNull();
  });

  it("chạm khay rồi chạm mép kế tiếp (lối thay thế) luôn đặt đúng chỗ", () => {
    const session = build();
    const length = f.content.object.length_in_units;
    const source = session.slots[1 + length];
    if (!source) {
      throw new Error("Thiếu slot");
    }
    const verdict = session.dispatch({
      type: "tap",
      x: source.x,
      y: source.y,
      timeMs: 5,
    });
    expect(verdict?.valid).toBe(true);
    expect(session.getPlacedUnitsCount()).toBe(1);
  });
});
