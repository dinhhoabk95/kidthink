import { describe, expect, it } from "vitest";
import { ACTION_IGNORED, ACTION_RETRY } from "#src/game-session";
import { GT029Generator } from "#src/generators/gt029";
import type { ThemeVocabulary } from "#src/generators/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { splitCaption } from "#src/layout/slot-fit";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures";
import { getGT029Clock } from "#src/templates/GT-029/layout";
import { GT029Session } from "#src/templates/GT-029/session";
import {
  type GT029Content,
  GT029ContentSchema,
  type GT029Difficulty,
} from "#src/templates/GT-029/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function get2DContext(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Cannot get 2D context from fake canvas");
  }
  return ctx;
}

const SAMPLE_VOCAB: ThemeVocabulary = {
  theme: "animals",
  nouns: [
    { label_vi: "con cá", emoji_ref: "🐟" },
    { label_vi: "con mèo", emoji_ref: "🐱" },
    { label_vi: "con chó", emoji_ref: "🐶" },
    { label_vi: "con gà", emoji_ref: "🐔" },
    { label_vi: "con vịt", emoji_ref: "🦆" },
    { label_vi: "con thỏ", emoji_ref: "🐰" },
  ],
};

describe("GT-029 — bớt khỏi tập hợp trên bề mặt web (BR-E029, BR-PNR-02)", () => {
  const fixture = GT029_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-029 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(
    customContent: GT029Content = content,
    customDiff: GT029Difficulty = difficulty,
    seed = 1
  ): GT029Session {
    const session = new GT029Session(customContent, customDiff, seed);
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

  it("getView().entities có spokenLabel cho vật thể và thẻ số đáp án, khớp vùng chạm findHitEntity", () => {
    const session = buildStageSession();
    const initialEntities = session.getView().entities;
    expect(initialEntities).toHaveLength(content.initial_items.length);

    for (const entity of initialEntities) {
      expect(entity.spokenLabel).toBeDefined();
      expect(findHitEntity(initialEntities, entity.x, entity.y)?.id).toBe(
        entity.id
      );
    }

    for (let i = 0; i < content.remove_count; i++) {
      const target = initialEntities[i];
      if (!target) {
        throw new Error(`Missing item ${i}`);
      }
      const res = session.dispatch({
        type: "tap",
        x: target.x,
        y: target.y,
        timeMs: i * 10,
      });
      expect(res?.valid).toBe(true);
    }

    const afterRemoveEntities = session.getView().entities;
    const optionEntities = afterRemoveEntities.filter(
      (e) => e.role === "target"
    );
    expect(optionEntities).toHaveLength(content.answer_options.length);

    for (const optEntity of optionEntities) {
      expect(optEntity.spokenLabel).toBeDefined();
      expect(optEntity.hitShape).toBe("square");
      expect(
        findHitEntity(afterRemoveEntities, optEntity.x, optEntity.y)?.id
      ).toBe(optEntity.id);
    }
  });

  it("BR-ERC-02: render() thuần 100% — gọi lặp 100 lần không đổi state, particle hay sinh telemetry", () => {
    const session = buildStageSession();
    const ctx = get2DContext();
    const rs = new RenderSystem();

    const firstItem = session.getDisplayItems()[0];
    if (!firstItem) {
      throw new Error("Missing first item");
    }
    session.commit({
      type: "remove_item",
      data: { item_id: firstItem.item_id },
    });

    const snapRemoved = [...session.removedItemIds];
    const snapSelected = session.selectedOptionId;
    const snapView = JSON.stringify(session.getView());
    const snapEvents = session.getTelemetry().events.length;

    for (let i = 0; i < 100; i++) {
      session.render(ctx, rs, 100 + i * 16);
    }

    expect([...session.removedItemIds]).toEqual(snapRemoved);
    expect(session.selectedOptionId).toBe(snapSelected);
    expect(JSON.stringify(session.getView())).toBe(snapView);
    expect(session.getTelemetry().events.length).toBe(snapEvents);

    const items = session.getDisplayItems();
    for (let i = 1; i < content.remove_count; i++) {
      const it = items[i];
      if (it) {
        session.commit({ type: "remove_item", data: { item_id: it.item_id } });
      }
    }
    const correctOpt = session.getDisplayOptions().find((o) => o.is_correct);
    if (!correctOpt) {
      throw new Error("Missing correct option");
    }
    session.commit({
      type: "select_option",
      data: { option_id: correctOpt.option_id },
    });
    const clock = getGT029Clock(session);
    const snapParticleCount = clock.particles.length;
    const snapFirstLife = clock.particles[0]?.life;
    expect(snapParticleCount).toBeGreaterThan(0);

    for (let i = 0; i < 50; i++) {
      session.render(ctx, rs, 500 + i * 16);
    }
    expect(clock.particles.length).toBe(snapParticleCount);
    expect(clock.particles[0]?.life).toBe(snapFirstLife);
  });

  it("không đè dải caption (-m + Mèo Mướp) ở 610x350 landscape thấp và 360x640 portrait nhỏ", () => {
    for (const [cssW, cssH] of [
      [610, 350],
      [360, 640],
    ] as const) {
      const session = new GT029Session(content, difficulty, 1);
      const space = deriveLogicSpace(cssW, cssH);
      const cssPerLogic = cssW / space.w;
      const zones = computeStageZones({
        logicW: space.w,
        logicH: space.h,
        ageBand: "4-5",
        cssPerLogic,
        needsTray: false,
        needsCommit: false,
      });
      session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
      const { caption } = splitCaption(zones.stage);
      const capBottom = caption.y + caption.h;
      for (const slot of session.slots) {
        expect(slot.y - slot.h / 2).toBeGreaterThanOrEqual(capBottom);
      }
    }
  });

  it("nhánh allow_retry: false đóng lượt khi chọn sai đáp án hoặc bớt lố (Spec §5 nhánh 2)", () => {
    const strictDiff: GT029Difficulty = {
      ...difficulty,
      allow_retry: false,
    };
    const session = buildStageSession(content, strictDiff, 7);
    const items = session.getDisplayItems();
    for (let i = 0; i < content.remove_count; i++) {
      const it = items[i];
      if (it) {
        session.commit({ type: "remove_item", data: { item_id: it.item_id } });
      }
    }
    expect(session.isAcceptingInput()).toBe(true);

    const wrongOpt = session.getDisplayOptions().find((o) => !o.is_correct);
    if (!wrongOpt) {
      throw new Error("Missing wrong option");
    }
    const res = session.validateAction({
      type: "select_option",
      data: { option_id: wrongOpt.option_id },
    });
    expect(res).toBe(ACTION_RETRY);
    session.commit({
      type: "select_option",
      data: { option_id: wrongOpt.option_id },
    });

    expect(session.isRoundClosedOnWrong()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(
      session.validateAction({
        type: "select_option",
        data: { option_id: "opt_3" },
      })
    ).toBe(ACTION_IGNORED);

    const ctx = get2DContext();
    const rs = new RenderSystem();
    session.render(ctx, rs, 250);
  });

  it("thang gợi ý 2 pha L1→L2→L3, getHintDemoSequence và getHintDestinationIndex === null (BR-E029-08)", () => {
    const session = buildStageSession();
    const ctx = get2DContext();
    const rs = new RenderSystem();

    expect(session.getHintDestinationIndex()).toBeNull();
    const p1L1 = session.getHintTargetForLevel(1);
    const p1L2 = session.getHintTargetForLevel(2);
    const p1L3 = session.getHintTargetForLevel(3);
    expect(p1L1).toEqual({
      kind: "region",
      ids: ["apple_1", "apple_2", "apple_3", "apple_4", "apple_5"],
    });
    expect(p1L2).toEqual({
      kind: "region",
      ids: ["apple_1", "apple_2"],
    });
    expect(p1L3).toEqual({ kind: "slot", index: 0 });
    expect(session.getHintDemoSequence(1)).toBeNull();
    const p1Demo = session.getHintDemoSequence(3);
    expect(p1Demo).toEqual([{ from: 0 }, { from: 1 }]);

    session.onScaffoldEscalated(1);
    session.render(ctx, rs, 100);
    session.onScaffoldEscalated(2);
    session.render(ctx, rs, 200);
    session.onScaffoldEscalated(3);
    session.render(ctx, rs, 300);
    session.onHintCleared();

    const items = session.getDisplayItems();
    for (let i = 0; i < content.remove_count; i++) {
      const it = items[i];
      if (it) {
        session.commit({ type: "remove_item", data: { item_id: it.item_id } });
      }
    }

    const p2L1 = session.getHintTargetForLevel(1);
    const p2L2 = session.getHintTargetForLevel(2);
    const p2L3 = session.getHintTargetForLevel(3);
    expect(p2L1).toEqual({
      kind: "region",
      ids: ["apple_3", "apple_4", "apple_5"],
    });
    expect(p2L2?.kind).toBe("region");
    if (p2L2?.kind === "region") {
      expect(p2L2.ids).toContain("opt_3");
      expect(p2L2.ids).toHaveLength(2);
    }
    expect(p2L3?.kind).toBe("slot");
    const p2Demo = session.getHintDemoSequence(3);
    expect(p2Demo).toHaveLength(1);
    expect(p2Demo?.[0]?.to).toBeUndefined();

    session.onScaffoldEscalated(1);
    session.render(ctx, rs, 400);
    session.onScaffoldEscalated(2);
    session.render(ctx, rs, 500);
    session.onScaffoldEscalated(3);
    session.render(ctx, rs, 600);
  });

  it("N7 chơi lại: roundGeneration >= 1 đổi vị trí cả vật lẫn phương án đáp số", () => {
    const shuffleDiff: GT029Difficulty = {
      ...difficulty,
      shuffle_items: true,
    };
    const session = new GT029Session(content, shuffleDiff, 42);
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
    const round0Opts = session.getDisplayOptions().map((o) => o.option_id);

    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    const round1Opts = session.getDisplayOptions().map((o) => o.option_id);

    expect(round1Opts).not.toEqual(round0Opts);
    expect([...round1Opts].sort()).toEqual([...round0Opts].sort());
  });

  it("hover toạ độ số (setPointerOver), clearPointerOver, destroy và degradation render sạch", () => {
    const session = buildStageSession();
    const ctx = get2DContext();
    const rs = new RenderSystem();

    const firstSlot = session.itemSlotFor(0);
    const firstItem = session.getDisplayItems()[0];
    if (!(firstSlot && firstItem)) {
      throw new Error("Missing first item or slot");
    }
    session.setPointerOver(firstSlot.x, firstSlot.y);
    expect(getGT029Clock(session).hoveredId).toBe(firstItem.item_id);

    const items = session.getDisplayItems();
    for (let i = 0; i < content.remove_count; i++) {
      const it = items[i];
      if (it) {
        session.commit({ type: "remove_item", data: { item_id: it.item_id } });
      }
    }

    const optSlot = session.slots[items.length];
    const firstOpt = session.getDisplayOptions()[0];
    if (!(optSlot && firstOpt)) {
      throw new Error("Missing first option or slot");
    }
    session.setPointerOver(optSlot.x, optSlot.y);
    expect(getGT029Clock(session).hoveredId).toBe(firstOpt.option_id);

    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.render(ctx, rs, 120);
    session.clearPointerOver();
    expect(getGT029Clock(session).hoveredId).toBeNull();
    session.render(ctx, rs, 140);
    expect(session.isAcceptingInput()).toBe(true);

    session.destroy();
    expect(session.removedItemIds.size).toBe(0);
    expect(session.selectedOptionId).toBeNull();
  });

  it("GT029Generator giữ initial_count <= 8 ở 5-6 (N1) và khoảng cách đáp án >= 2 ở 4-5 (§14)", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const gen45 = GT029Generator.generate({
        rng: createRng(seed),
        age_band: "4-5",
        what: "arithmetic",
        theme: "animals",
        vocabulary: SAMPLE_VOCAB,
        escalation_step: seed % 3,
      });
      const pack45 = GT029ContentSchema.parse(gen45.content_pack);
      expect(pack45.initial_items.length).toBeGreaterThanOrEqual(4);
      expect(pack45.initial_items.length).toBeLessThanOrEqual(6);
      const vals = pack45.answer_options.map((o) => o.value);
      for (let i = 0; i < vals.length; i++) {
        for (let j = i + 1; j < vals.length; j++) {
          const a = vals[i] ?? 0;
          const b = vals[j] ?? 0;
          expect(Math.abs(a - b)).toBeGreaterThanOrEqual(2);
        }
      }

      const gen56 = GT029Generator.generate({
        rng: createRng(seed + 100),
        age_band: "5-6",
        what: "arithmetic",
        theme: "animals",
        vocabulary: SAMPLE_VOCAB,
        escalation_step: seed % 5,
      });
      const pack56 = GT029ContentSchema.parse(gen56.content_pack);
      expect(pack56.initial_items.length).toBeGreaterThanOrEqual(6);
      expect(pack56.initial_items.length).toBeLessThanOrEqual(8);
    }
  });
});

describe("GT-029 — bước trung gian là thao tác nháp (BR-E029-12, BR-EIC-10)", () => {
  const f = GT029_FIXTURES[0];
  if (!f) {
    throw new Error("Fixture GT-029 not found");
  }
  const { content: fx, difficulty: fd } = f;
  const QUIET = { valid: true, feedback: "none" };

  function build(): GT029Session {
    const session = new GT029Session(fx, fd, 1);
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

  it("bớt, hoàn lại một vật và chạm thẻ đáp số khi còn khoá đều QUIET_OK", () => {
    const session = build();
    const id = session.getDisplayItems()[0]?.item_id ?? "";
    const opt = session.getDisplayOptions()[0];
    expect(
      session.validateAction({ type: "remove_item", data: { item_id: id } })
    ).toEqual(QUIET);
    session.commit({ type: "remove_item", data: { item_id: id } });
    expect(
      session.validateAction({ type: "remove_item", data: { item_id: id } })
    ).toEqual(QUIET);
    session.commit({ type: "remove_item", data: { item_id: id } });
    if (fx.remove_count > 0) {
      expect(
        session.validateAction({
          type: "select_option",
          data: { option_id: opt?.option_id },
        })
      ).toEqual(QUIET);
    }
  });

  it("ca âm: bớt đủ rồi chọn đáp số sai vẫn RETRY", () => {
    const session = build();
    const items = session.getDisplayItems();
    for (let i = 0; i < fx.remove_count; i++) {
      session.commit({
        type: "remove_item",
        data: { item_id: items[i]?.item_id },
      });
    }
    const wrong = session.getDisplayOptions().find((o) => !o.is_correct);
    expect(
      session.validateAction({
        type: "select_option",
        data: { option_id: wrong?.option_id },
      })
    ).toBe(ACTION_RETRY);
  });
});
