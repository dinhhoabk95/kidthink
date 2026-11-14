import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it } from "vitest";
import { ACTION_CORRECT, ACTION_IGNORED } from "#src/game-session";
import { deriveLogicSpace } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures";
import { GT022Session } from "#src/templates/GT-022/session";
import type {
  GT022Content,
  GT022Difficulty,
} from "#src/templates/GT-022/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText } from "#tests/helpers/rendered-text";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function getFixtures() {
  const fixture = GT022_FIXTURES[0];
  const twoTargetFixture = GT022_FIXTURES[1];
  const hiddenFixture = GT022_FIXTURES[2];
  if (!(fixture && twoTargetFixture && hiddenFixture)) {
    throw new Error("Fixture GT-022 not found");
  }
  return { fixture, twoTargetFixture, hiddenFixture };
}

describe("GT-022 — dung sai chạm trong khung 5 vùng và nhãn đọc (BR-E022)", () => {
  const { fixture, twoTargetFixture, hiddenFixture } = getFixtures();

  function buildStageSession(
    content: GT022Content = fixture.content,
    difficulty: GT022Difficulty = fixture.difficulty,
    seed = 1
  ): GT022Session {
    const session = new GT022Session(content, difficulty, seed);
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

  it("giải thành công GT022_FIXTURES[2] qua gesture tap khi thỏ ẩn trùng toạ độ bụi cây (BR-E022-03)", () => {
    const session = new GT022Session(
      hiddenFixture.content,
      hiddenFixture.difficulty,
      1
    );
    session.prepareRound("4-5");

    const act1 = session.toAction({ type: "tap", x: 350, y: 220, timeMs: 0 });
    expect(act1).toEqual({
      type: "reveal_object",
      data: { item_id: "target-rabbit" },
    });
    if (!act1) {
      throw new Error("Thiếu action reveal_object");
    }
    expect(session.validateAction(act1)).toEqual(ACTION_CORRECT);
    session.commit(act1);
    expect(session.validateAction(act1)).toEqual(ACTION_IGNORED);

    const act2 = session.toAction({ type: "tap", x: 350, y: 220, timeMs: 800 });
    expect(act2).toEqual({
      type: "tap_object",
      data: { item_id: "target-rabbit" },
    });
    if (!act2) {
      throw new Error("Thiếu action tap_object");
    }
    expect(session.validateAction(act2)).toEqual(ACTION_CORRECT);
    session.commit(act2);
    expect(session.checkWinCondition()).toBe(true);
    const eventsAfterWin = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "round_completed").length;
    expect(eventsAfterWin).toBe(1);
    session.onTapObject("target-rabbit");
    const eventsAfterRepeat = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "round_completed").length;
    expect(eventsAfterRepeat).toBe(1);
  });

  it("WrongFlashMap độc lập từng vật nhiễu: chạm nhầm 2 vật cách nhau 200ms tắt đúng mốc riêng", () => {
    const session = buildStageSession(
      twoTargetFixture.content,
      twoTargetFixture.difficulty
    );
    session.onTapObject("seaweed");
    expect(
      session.getView().entities.find((e) => e.id === "seaweed")?.state
    ).toBe("incorrect");

    session.update(200);
    session.onTapObject("rock");
    expect(
      session.getView().entities.find((e) => e.id === "seaweed")?.state
    ).toBe("incorrect");
    expect(session.getView().entities.find((e) => e.id === "rock")?.state).toBe(
      "incorrect"
    );

    session.update(WRONG_FLASH_MS - 200);
    expect(
      session.getView().entities.find((e) => e.id === "seaweed")?.state
    ).toBe("idle");
    expect(session.getView().entities.find((e) => e.id === "rock")?.state).toBe(
      "incorrect"
    );

    session.update(200);
    expect(session.getView().entities.find((e) => e.id === "rock")?.state).toBe(
      "idle"
    );

    session.onTapObject("rock");
    expect(session.getView().entities.find((e) => e.id === "rock")?.state).toBe(
      "incorrect"
    );
  });

  it("thang gợi ý L1 (góc phần tư) -> L2 (vật đích) -> L3 (slot + demo sequence 1 hoặc 2 bước)", () => {
    const session = buildStageSession(
      hiddenFixture.content,
      hiddenFixture.difficulty
    );
    const l1 = session.getHintTargetForLevel(1);
    expect(l1?.kind).toBe("region");
    if (l1?.kind === "region") {
      expect(l1.ids).toContain("target-rabbit");
    }

    const l2 = session.getHintTargetForLevel(2);
    expect(l2).toEqual({ kind: "region", ids: ["target-rabbit"] });

    const l3 = session.getHintTargetForLevel(3);
    expect(l3).toEqual({ kind: "slot", index: 0 });
    expect(session.getHintDemoSequence(3)).toEqual([{ from: 0 }, { from: 0 }]);

    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!(ctx && isCanvas2D(ctx))) {
      throw new Error("Không lấy được context");
    }
    const rs = new RenderSystem();
    for (const level of [1, 2, 3] as const) {
      session.onScaffoldEscalated(level, "timer");
      session.render(ctx, rs, level * 100);
    }
    session.onHintCleared();

    session.onRevealObject("target-rabbit");
    expect(session.getHintDemoSequence(3)).toEqual([{ from: 0 }]);
  });

  it("allow_retry === false: chạm nhầm vật nhiễu đóng lượt và mở sáng các vật đích còn lại", () => {
    const session = buildStageSession(fixture.content, {
      ...fixture.difficulty,
      allow_retry: false,
    });
    expect(session.isAcceptingInput()).toBe(true);

    session.onTapObject("distractor-flower1");
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(
      session.validateAction({
        type: "tap_object",
        data: { item_id: "target-butterfly" },
      })
    ).toEqual(ACTION_IGNORED);

    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!(ctx && isCanvas2D(ctx))) {
      throw new Error("Không lấy được context");
    }
    session.render(ctx, new RenderSystem(), 100);
  });

  it("vật đích có asset hỏng được loại khỏi target_count khi còn vật đích lành (§5 nhánh 5)", () => {
    const contentWithBrokenTarget: GT022Content = {
      ...twoTargetFixture.content,
      scene_objects: twoTargetFixture.content.scene_objects.map((obj) =>
        obj.id === "fish-1"
          ? { ...obj, asset: { kind: "emoji" as const, ref: "   " } }
          : obj
      ),
    };
    const session = buildStageSession(
      contentWithBrokenTarget,
      twoTargetFixture.difficulty
    );
    expect(session.sceneSystem.getTotalTargets()).toBe(1);

    const drawn = collectRenderedText(session, { prepare: false });
    expect(drawn.some((t) => t.startsWith("EMJ-"))).toBe(false);

    session.onTapObject("fish-2");
    expect(session.checkWinCondition()).toBe(true);
  });

  it("chơi lại vòng 2+ (N7): vị trí các vật trên sân khấu đổi sang bố trí mới", () => {
    const session = buildStageSession();
    const round1Coords = session.resolvedObjects.map((o) => `${o.x},${o.y}`);

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
    const round2Coords = session.resolvedObjects.map((o) => `${o.x},${o.y}`);
    expect(round2Coords).not.toEqual(round1Coords);
  });

  it("getView().entities xuất đủ hitW/hitH/hitShape và hỗ trợ setPointerOver / clearPointerOver", () => {
    const session = buildStageSession();
    for (const entity of session.getView().entities) {
      expect(Reflect.get(entity, "hitW")).toBeGreaterThan(0);
      expect(Reflect.get(entity, "hitH")).toBeGreaterThan(0);
      expect(entity.hitShape).toBe("square");
    }

    const first = session.resolvedObjects[0];
    if (!first) {
      throw new Error("Thiếu vật đầu tiên");
    }
    session.setPointerOver(first.x, first.y);
    expect(
      session.getView().entities.find((e) => e.id === first.id)?.state
    ).toBe("active");

    session.clearPointerOver();
    expect(
      session.getView().entities.find((e) => e.id === first.id)?.state
    ).toBe("idle");
  });

  it("BR-ERC-02: Object.entries(session) bất biến qua 100 frame render() và tôn trọng reducedMotion / degradation", () => {
    const session = buildStageSession();
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!(ctx && isCanvas2D(ctx))) {
      throw new Error("Không lấy được context");
    }
    const rs = new RenderSystem();
    rs.reducedMotion = true;

    const snapshotBefore = JSON.stringify(Object.entries(session));
    for (let i = 0; i < 100; i++) {
      session.render(ctx, rs, i * 16);
    }
    const snapshotAfter = JSON.stringify(Object.entries(session));
    expect(snapshotAfter).toBe(snapshotBefore);
  });
});
