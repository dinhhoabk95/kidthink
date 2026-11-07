import { describe, expect, it, vi } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones, type StageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures";
import { GT028Session } from "#src/templates/GT-028/session";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

describe("GT-028 — chạm đếm tích luỹ trên bề mặt web (BR-E028, BR-PNR-02, BR-PSZ-01)", () => {
  const fixture = GT028_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-028 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(): {
    session: GT028Session;
    zones: StageZones;
  } {
    const session = new GT028Session(content, difficulty, 1);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: true,
    });
    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    return { session, zones };
  }

  it("cập nhật spokenLabel là số đếm tích luỹ tiếng Việt trước mỗi lần chạm (BR-PNR-02)", () => {
    const { session } = buildStageSession();

    // Trước lần chạm 1 (step = 2): mọi vật chưa chọn có spokenLabel = "Số hai"
    const view0 = session.getView();
    expect(view0.entities[0]?.spokenLabel).toBe("Số hai");
    expect(
      findHitEntity(
        view0.entities,
        view0.entities[0]?.x ?? 0,
        view0.entities[0]?.y ?? 0
      )?.id
    ).toBe(view0.entities[0]?.id);

    session.dispatch({
      type: "tap",
      x: view0.entities[0]?.x ?? 0,
      y: view0.entities[0]?.y ?? 0,
      timeMs: 10,
    });

    // Trước lần chạm 2: vật đã chọn giữ "Số hai", vật chưa chọn tiếp theo đọc "Số bốn"
    const view1 = session.getView();
    expect(view1.entities[0]?.spokenLabel).toBe("Số hai");
    expect(view1.entities[1]?.spokenLabel).toBe("Số bốn");

    session.dispatch({
      type: "tap",
      x: view1.entities[1]?.x ?? 0,
      y: view1.entities[1]?.y ?? 0,
      timeMs: 20,
    });

    // Trước lần chạm 3: vật chưa chọn tiếp theo đọc "Số sáu"
    const view2 = session.getView();
    expect(view2.entities[2]?.spokenLabel).toBe("Số sáu");
  });

  it("mọi lệnh vẽ (bao gồm dock gỗ) nằm trọn trong zones.stage (BR-PSZ-01)", () => {
    const { session, zones } = buildStageSession();
    const rs = new RenderSystem();
    const outside = findDrawsOutsideStage(zones.stage, (ctx) =>
      session.render(ctx, rs, 0)
    );
    expect(outside).toEqual([]);
  });
});
