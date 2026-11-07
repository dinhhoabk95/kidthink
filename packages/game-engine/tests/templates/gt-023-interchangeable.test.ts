import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { AssemblySystem } from "#src/systems/assembly-system";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures";
import { GT023Session } from "#src/templates/GT-023/session";

/**
 * Task #313 Phase 3 — GT-023: mảnh cùng hình thay nhau được (`BR-E023-04`) và
 * mỏ neo giữ hình mô hình trong sân khấu (`BR-E023-05`).
 */
function build(index: number, w = 964, h = 628): GT023Session {
  const f = GT023_FIXTURES[index];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT023Session(f.content, f.difficulty, 1);
  const space = deriveLogicSpace(w, h);
  const cssPerLogic = w / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "4-5",
    cssPerLogic,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(
    "4-5",
    space,
    zones.stage,
    zones.tray ?? undefined,
    cssPerLogic
  );
  return session;
}

describe("GT-023 — mảnh giống hệt thay nhau được (BR-E023-04)", () => {
  it("hai bánh xe cùng hình: đặt bánh 2 vào chỗ bánh 1 vẫn đúng, thắng khi đủ chỗ", () => {
    const session = build(1);
    const verdict = session.validateAction({
      type: "drop_item",
      data: { item_id: "part-wheel-2", target_id: "anchor-wheel-left" },
    });
    expect(verdict.valid).toBe(true);
    session.commit({
      type: "drop_item",
      data: { item_id: "part-wheel-2", target_id: "anchor-wheel-left" },
    });
    session.commit({
      type: "drop_item",
      data: { item_id: "part-wheel-1", target_id: "anchor-wheel-right" },
    });
    session.commit({
      type: "drop_item",
      data: { item_id: "part-chassis", target_id: "anchor-chassis" },
    });
    expect(session.checkWinCondition()).toBe(true);
  });

  it("neo đã khoá thì thả thêm mảnh cùng hình không đổi gì (BR-E023-03)", () => {
    const session = build(1);
    session.commit({
      type: "drop_item",
      data: { item_id: "part-wheel-1", target_id: "anchor-wheel-left" },
    });
    const again = {
      type: "drop_item",
      data: { item_id: "part-wheel-2", target_id: "anchor-wheel-left" },
    };
    expect(session.validateAction(again).valid).toBe(false);
    session.commit(again);
    expect(session.getPlacements().get("anchor-wheel-left")).toBe(
      "part-wheel-1"
    );
  });

  it("mảnh khác hình vẫn bị từ chối (thân xe vào chỗ bánh)", () => {
    const session = build(1);
    expect(
      session.validateAction({
        type: "drop_item",
        data: { item_id: "part-chassis", target_id: "anchor-wheel-left" },
      }).valid
    ).toBe(false);
  });

  it("assemblySystem: shapeKey trùng thì thay nhau, khác thì không", () => {
    const sys = new AssemblySystem();
    sys.init(
      [
        { anchorId: "a1", x: 0, y: 0, acceptedPartId: "p1" },
        { anchorId: "a2", x: 0, y: 0, acceptedPartId: "p2" },
      ],
      [
        { partId: "p1", targetAnchorId: "a1", shapeKey: "dot" },
        { partId: "p2", targetAnchorId: "a2", shapeKey: "dot" },
        { partId: "p3", targetAnchorId: "a2", shapeKey: "bar" },
      ]
    );
    expect(sys.acceptsPart("a1", "p2")).toBe(true);
    expect(sys.acceptsPart("a1", "p3")).toBe(false);
  });
});

describe("GT-023 — mỏ neo giữ hình mô hình trong sân khấu (BR-E023-05)", () => {
  it("xe: bánh ngang hàng ở hai bên, thân xe nằm trên hai bánh", () => {
    const session = build(1);
    const at = (id: string) => {
      const e = session.getView().entities.find((x) => x.id === id);
      if (!e) {
        throw new Error(`Thiếu ${id}`);
      }
      return e;
    };
    const left = at("anchor-wheel-left");
    const right = at("anchor-wheel-right");
    const body = at("anchor-chassis");
    expect(left.y).toBe(right.y);
    expect(left.x).toBeLessThan(body.x);
    expect(body.x).toBeLessThan(right.x);
    expect(body.y).toBeLessThan(left.y);
  });

  it("nhà: mái nằm trên thân", () => {
    const session = build(0);
    const roof = session.getView().entities.find((x) => x.id === "anchor-roof");
    const wall = session.getView().entities.find((x) => x.id === "anchor-wall");
    expect(roof && wall && roof.y < wall.y).toBe(true);
  });
});
