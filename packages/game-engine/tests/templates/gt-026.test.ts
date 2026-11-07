import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures";
import { GT026Session } from "#src/templates/GT-026/session";

describe("GT-026 — phản xạ đi/dừng trên bề mặt web (BR-E026, BR-PNR-02)", () => {
  const fixture = GT026_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-026 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(): GT026Session {
    const session = new GT026Session(content, difficulty, 1);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    return session;
  }

  it("getView().entities của kích thích có spokenLabel và khớp vùng chạm findHitEntity", () => {
    const session = buildStageSession();
    const view = session.getView();
    expect(view.entities).toHaveLength(1);
    const entity = view.entities[0];
    if (!entity) {
      throw new Error("Missing stimulus entity");
    }
    expect(entity.spokenLabel).toBeDefined();
    expect(findHitEntity(view.entities, entity.x, entity.y)?.id).toBe(
      entity.id
    );
  });

  it("chạm go và chờ hết giờ nogo qua toàn bộ các lượt thì hoàn thành vòng chơi", () => {
    const session = buildStageSession();

    for (let i = 0; i < content.trials.length; i++) {
      const trial = session.getCurrentTrial();
      if (!trial) {
        break;
      }
      const entity = session.getView().entities[0];
      if (!entity) {
        throw new Error(`Missing stimulus entity at trial ${i}`);
      }
      if (trial.kind === "go") {
        const verdict = session.dispatch({
          type: "tap",
          x: entity.x,
          y: entity.y,
          timeMs: i * 100,
        });
        expect(verdict?.valid).toBe(true);
      } else {
        session.update(difficulty.stimulus_window_ms + 10);
      }
      if (!session.checkWinCondition()) {
        session.update(difficulty.isi_ms + 10);
      }
    }

    expect(session.checkWinCondition()).toBe(true);
  });
});
