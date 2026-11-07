import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures";
import { GT022Session } from "#src/templates/GT-022/session";

function getFixtures() {
  const fixture = GT022_FIXTURES[0];
  const hiddenFixture = GT022_FIXTURES[2];
  if (!(fixture && hiddenFixture)) {
    throw new Error("Fixture GT-022 not found");
  }
  return { fixture, hiddenFixture };
}

describe("GT-022 — dung sai chạm trong khung 5 vùng và nhãn đọc (BR-E022)", () => {
  const { fixture, hiddenFixture } = getFixtures();

  function buildStageSession(
    content = fixture.content,
    difficulty = fixture.difficulty
  ): GT022Session {
    const session = new GT022Session(content, difficulty, 1);
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

  it("chạm lệch tâm trong dung sai 24px (TAP_TOLERANCE_PX) kể cả khi có stageRect vẫn trúng", () => {
    const session = buildStageSession();
    const targetObj = session.resolvedObjects.find((o) => o.isTarget);
    if (!targetObj) {
      throw new Error("Thiếu targetObj");
    }

    const offset = targetObj.height / 2 + TAP_TOLERANCE_PX - 4;
    const action = session.toAction({
      type: "tap",
      x: targetObj.x,
      y: targetObj.y - offset,
      timeMs: 0,
    });

    expect(action).toEqual({
      type: "tap_object",
      data: { item_id: targetObj.id },
    });
  });

  it("chạm ra ngoài mọi vật bị nuốt, không tính là chạm sai (BR-ETS-02)", () => {
    const session = buildStageSession();

    const action = session.toAction({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(action).toBeNull();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });

  it("getView() ẩn spokenLabel khi vật đang bị che và hiện khi đã lộ", () => {
    const session = buildStageSession(
      hiddenFixture.content,
      hiddenFixture.difficulty
    );
    const hiddenDef = hiddenFixture.content.scene_objects.find(
      (o) => o.is_hidden
    );
    if (!hiddenDef) {
      throw new Error("Thiếu vật bị che trong fixture 2");
    }

    const viewBefore = session.getView();
    const ids = viewBefore.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const entityBefore = viewBefore.entities.find((e) => e.id === hiddenDef.id);
    expect(entityBefore?.spokenLabel).toBeUndefined();

    session.onRevealObject(hiddenDef.id);
    const entityAfter = session
      .getView()
      .entities.find((e) => e.id === hiddenDef.id);
    const expectedName =
      hiddenDef.asset.kind === "emoji"
        ? getByGlyph(hiddenDef.asset.ref)?.name
        : undefined;
    expect(entityAfter?.spokenLabel).toBe(expectedName);
  });
});
