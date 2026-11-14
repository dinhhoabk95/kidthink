import { describe, expect, it, vi } from "vitest";
import { GT023Generator } from "#src/generators/gt023";
import type { ThemeVocabulary } from "#src/generators/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures";
import { GT023Session } from "#src/templates/GT-023/session";
import GT023Template, {
  type GT023Content,
  type GT023Difficulty,
} from "#src/templates/GT-023/template";
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

describe("GT-023 — dung sai chạm, kéo thả / chạm-chạm và nhãn đọc (BR-E023)", () => {
  const fixture = GT023_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-023 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(
    customContent: GT023Content = content,
    customDifficulty: GT023Difficulty = difficulty,
    seed = 1
  ): GT023Session {
    const session = new GT023Session(customContent, customDifficulty, seed);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
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

  it("chạm lệch tâm trong dung sai 24px (TAP_TOLERANCE_PX) vào mảnh nguồn rồi mỏ neo vẫn lắp đúng", () => {
    const session = buildStageSession();
    const anchor0 = content.anchors[0];
    if (!anchor0) {
      throw new Error("Thiếu anchor 0");
    }
    const partIdx = content.parts.findIndex(
      (p) => p.part_id === anchor0.accepted_part_id
    );
    const sourceSlot = session.sourceSlots[partIdx];
    const targetSlot = session.targetSlots[0];
    if (!(sourceSlot && targetSlot)) {
      throw new Error("Thiếu sourceSlot hoặc targetSlot");
    }

    const srcOffset = sourceSlot.hitW / 2 + TAP_TOLERANCE_PX - 4;
    session.dispatch({
      type: "tap",
      x: sourceSlot.x + srcOffset,
      y: sourceSlot.y,
      timeMs: 10,
    });
    expect(session.getStagedItemId()).toBe(anchor0.accepted_part_id);

    const res = session.dispatch({
      type: "tap",
      x: targetSlot.x,
      y: targetSlot.y + TAP_TOLERANCE_PX,
      timeMs: 20,
    });
    expect(res?.valid).toBe(true);
    expect(session.getPlacements().get(anchor0.anchor_id)).toBe(
      anchor0.accepted_part_id
    );
  });

  it("chạm ra ngoài mọi slot bị nuốt, không tính là chạm sai (BR-ETS-02)", () => {
    const session = buildStageSession();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });

  it("getView() trả về ID duy nhất, có thẻ target-model (role neutral) và spokenLabel nhưng không có label chữ (BR-E023-06)", () => {
    const session = buildStageSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const sourceEntities = view.entities.filter((e) => e.role === "source");
    expect(sourceEntities.length).toBe(content.parts.length);
    for (const entity of view.entities) {
      expect(entity.label).toBeUndefined();
    }
    for (const entity of sourceEntities) {
      expect(entity.spokenLabel).toBeDefined();
    }
    const modelEntity = view.entities.find((e) => e.role === "neutral");
    expect(modelEntity).toBeDefined();
    expect(modelEntity?.id).toBe("target-model");
    expect(modelEntity?.spokenLabel).toBeDefined();
  });

  it("thả sai mảnh kích hoạt WrongFlashMap trên cả mảnh nguồn lẫn mỏ neo, gọi drawRetryRing và không bị nuốt khi chạm sai lặp lại", () => {
    const session = buildStageSession();
    const anchor0 = content.anchors[0];
    const wrongPart = content.parts.find(
      (p) => p.part_id !== anchor0?.accepted_part_id
    );
    if (!(anchor0 && wrongPart)) {
      throw new Error("Thiếu anchor0 hoặc wrongPart");
    }
    const wrongIdx = session.displayParts.findIndex(
      (p) => p.part_id === wrongPart.part_id
    );
    const srcSlot = session.sourceSlots[wrongIdx];
    const dstSlot = session.targetSlots[0];
    if (!(srcSlot && dstSlot)) {
      throw new Error("Thiếu slot");
    }

    const r1 = session.dispatch({
      type: "drop",
      fromX: srcSlot.x,
      fromY: srcSlot.y,
      toX: dstSlot.x,
      toY: dstSlot.y,
      timeMs: 100,
    });
    expect(r1?.valid).toBe(false);
    expect(r1?.feedback).toBe("amber_soft");

    const viewAfterWrong = session.getView();
    const partEntity = viewAfterWrong.entities.find(
      (e) => e.id === wrongPart.part_id
    );
    const anchorEntity = viewAfterWrong.entities.find(
      (e) => e.id === anchor0.anchor_id
    );
    expect(partEntity?.state).toBe("incorrect");
    expect(anchorEntity?.state).toBe("incorrect");

    const ctx = get2DContext();
    const rs = new RenderSystem();
    const retrySpy = vi.spyOn(rs, "drawRetryRing");
    session.render(ctx, rs, 150);
    expect(retrySpy).toHaveBeenCalled();

    const r2 = session.dispatch({
      type: "drop",
      fromX: srcSlot.x,
      fromY: srcSlot.y,
      toX: dstSlot.x,
      toY: dstSlot.y,
      timeMs: 200,
    });
    expect(r2?.valid).toBe(false);
    expect(r2?.feedback).toBe("amber_soft");
  });

  it("allow_retry = false đóng lượt ngay khi thả sai mảnh và vẽ trạng thái tự hoàn thiện an toàn", () => {
    const session = buildStageSession(content, {
      ...difficulty,
      allow_retry: false,
    });
    const anchor0 = content.anchors[0];
    const wrongPart = content.parts.find(
      (p) => p.part_id !== anchor0?.accepted_part_id
    );
    if (!(anchor0 && wrongPart)) {
      throw new Error("Thiếu dữ liệu");
    }
    const res = session.onAssemblePart(wrongPart.part_id, anchor0.anchor_id);
    expect(res.isAnchorMatch).toBe(false);
    expect(session.roundClosedOnWrong).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);

    const ctx = get2DContext();
    const rs = new RenderSystem();
    expect(() => session.render(ctx, rs, 250)).not.toThrow();

    const ignored = session.onAssemblePart(
      anchor0.accepted_part_id,
      anchor0.anchor_id
    );
    expect(ignored.valid).toBe(false);
  });

  it("thang gợi ý L1 -> L2 -> L3 trả đúng mục tiêu và chuỗi demo kéo mảnh vào mỏ neo (N5)", () => {
    const session = buildStageSession();
    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);
    expect(l1?.kind).toBe("region");
    expect(l2?.kind).toBe("region");
    expect(l3?.kind).toBe("slot");

    const demo = session.getHintDemoSequence(3);
    expect(demo).not.toBeNull();
    expect(demo?.length).toBe(1);
    expect(session.getHintDemoSequence(2)).toBeNull();

    const ctx = get2DContext();
    const rs = new RenderSystem();
    session.onScaffoldEscalated(2, "timer");
    expect(() => session.render(ctx, rs, 300)).not.toThrow();
    session.onHintCleared();
    expect(() => session.render(ctx, rs, 350)).not.toThrow();
  });

  it("setPointerOver làm sáng mỏ neo trong tầm hút (active) ngay cả khi reducedMotion bật", () => {
    const session = buildStageSession();
    const targetSlot = session.targetSlots[0];
    const anchor0 = content.anchors[0];
    if (!(targetSlot && anchor0)) {
      throw new Error("Thiếu targetSlot");
    }
    session.setPointerOver(targetSlot.x + 10, targetSlot.y - 8);
    const view = session.getView();
    const anchorEntity = view.entities.find((e) => e.id === anchor0.anchor_id);
    expect(anchorEntity?.state).toBe("active");

    const ctx = get2DContext();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    expect(() => session.render(ctx, rs, 100)).not.toThrow();

    session.clearPointerOver();
    expect(
      session.getView().entities.find((e) => e.id === anchor0.anchor_id)?.state
    ).toBe("idle");
  });

  it("N7 chơi lại vòng 2+ hoán vị thứ tự mảnh trong khay theo seed", () => {
    const session = buildStageSession(content, difficulty, 42);
    const round1Order = session.displayParts.map((p) => p.part_id);
    const space = deriveLogicSpace(964, 628);
    session.prepareRound(
      "4-5",
      space,
      session.stageRect,
      session.trayRect,
      session.cssPerLogic
    );
    const round2Order = session.displayParts.map((p) => p.part_id);
    expect(round2Order).not.toEqual(round1Order);
  });

  it("BR-ERC-02: Object.entries(session) bất biến 100% qua 100 frame render() và không bắn lặp round_completed", () => {
    const session = buildStageSession();
    const ctx = get2DContext();
    const rs = new RenderSystem();
    const snapBefore = JSON.stringify(Object.entries(session));
    for (let f = 0; f < 100; f++) {
      session.render(ctx, rs, f * 16);
    }
    const snapAfter = JSON.stringify(Object.entries(session));
    expect(snapAfter).toBe(snapBefore);

    for (const anchor of content.anchors) {
      session.onAssemblePart(anchor.accepted_part_id, anchor.anchor_id);
    }
    expect(session.checkWinCondition()).toBe(true);
    const eventsAfterWin = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "round_completed").length;
    expect(eventsAfterWin).toBe(1);
    session.onAssemblePart(
      content.anchors[0]?.accepted_part_id ?? "p1",
      content.anchors[0]?.anchor_id ?? "a1"
    );
    expect(
      session
        .getTelemetry()
        .events.filter((e) => e.event_name === "round_completed").length
    ).toBe(1);
  });

  it("GT023Generator sinh cấu hình hợp lệ qua nhiều seed và bậc thang cho cả 4-5 và 5-6", () => {
    const vocab: ThemeVocabulary = {
      theme: "vehicle",
      nouns: [
        { emoji_ref: "🚗", label_vi: "ô tô" },
        { emoji_ref: "🛞", label_vi: "bánh xe" },
        { emoji_ref: "🚪", label_vi: "cánh cửa" },
        { emoji_ref: "🪟", label_vi: "cửa sổ" },
        { emoji_ref: "🚨", label_vi: "đèn còi" },
        { emoji_ref: "🛞", label_vi: "lốp xe" },
      ],
    };
    for (const age_band of ["4-5", "5-6"] as const) {
      for (let step = 0; step <= 3; step++) {
        const gen = GT023Generator.generate({
          rng: createRng(10 + step),
          age_band,
          theme: "vehicle",
          vocabulary: vocab,
          escalation_step: step,
        });
        expect(
          GT023Template.content_contract.parse(gen.content_pack)
        ).toBeDefined();
        expect(
          GT023Template.difficulty_contract.parse(gen.difficulty_params)
        ).toBeDefined();
        if (age_band === "4-5") {
          expect(gen.difficulty_params.show_anchor_outline).toBe(true);
        }
      }
    }
  });

  it("neo 1 đã khoá không cướp vùng hút của neo 2 trống liền kề và 1 partId không thể lắp trùng 2 neo cùng hình (BR-E023-03, BR-E023-04)", () => {
    const identicalFixture = GT023_FIXTURES[1];
    if (!identicalFixture) {
      throw new Error("Thiếu GT023_FIXTURES[1]");
    }
    const session = buildStageSession(
      identicalFixture.content,
      identicalFixture.difficulty
    );
    const [a0, a1] = identicalFixture.content.anchors;
    const [s0, s1] = session.targetSlots;
    if (!(a0 && a1 && s0 && s1)) {
      throw new Error("Thiếu anchors hoặc targetSlots");
    }

    const r1 = session.onAssemblePart(a0.accepted_part_id, a0.anchor_id);
    expect(r1.isAnchorMatch).toBe(true);

    const dup = session.onAssemblePart(a0.accepted_part_id, a1.anchor_id);
    expect(dup.valid).toBe(false);
    expect(session.getPlacements().has(a1.anchor_id)).toBe(false);

    const overlapX = (s0.x + s1.x) / 2 + (s0.x < s1.x ? -4 : 4);
    const overlapY = (s0.y + s1.y) / 2;
    session.setPointerOver(overlapX, overlapY);
    const view = session.getView();
    expect(view.entities.find((e) => e.id === a1.anchor_id)?.state).toBe(
      "active"
    );

    const snapped = session.onSnapPart(a1.accepted_part_id, overlapX, overlapY);
    expect(snapped?.isAnchorMatch).toBe(true);
    expect(session.getPlacements().get(a1.anchor_id)).toBe(a1.accepted_part_id);
  });

  it("toAction(tapSource) thuần khiết không tự đổi stagedItemId trước commit, và chạm thẻ target-model không huỷ stagedItemId (BR-EIC-03)", () => {
    const session = buildStageSession();
    const srcSlot = session.sourceSlots[0];
    const part0 = session.displayParts[0];
    if (!(srcSlot && part0)) {
      throw new Error("Thiếu srcSlot");
    }

    const action = session.toAction({
      type: "tap",
      x: srcSlot.x,
      y: srcSlot.y,
      timeMs: 10,
    });
    expect(action).toEqual({
      type: "stage_part",
      data: { part_id: part0.part_id },
    });
    expect(session.getStagedItemId()).toBeNull();

    if (action) {
      session.commit(action);
    }
    expect(session.getStagedItemId()).toBe(part0.part_id);

    const modelSlot = session.slots.find((s) => s.role === "neutral");
    if (!modelSlot) {
      throw new Error("Thiếu modelSlot");
    }
    session.dispatch({
      type: "tap",
      x: modelSlot.x,
      y: modelSlot.y,
      timeMs: 20,
    });
    expect(session.getStagedItemId()).toBe(part0.part_id);
  });

  it("BR-ERC-09: mặc định bật shadowBlur > 0 và tắt bóng đổ khi softShadowsEnabled = false hoặc degradation tắt", () => {
    const session = buildStageSession();
    const recordBlurs = (rs: RenderSystem): number[] => {
      const ctx = get2DContext();
      const blurs: number[] = [];
      vi.spyOn(ctx, "fill").mockImplementation(() => {
        if (ctx.shadowBlur !== 14) {
          blurs.push(ctx.shadowBlur);
        }
      });
      session.render(ctx, rs, 100);
      return blurs;
    };

    const defaultBlurs = recordBlurs(new RenderSystem());
    expect(Math.max(...defaultBlurs)).toBeGreaterThan(0);

    const rsNoShadow = new RenderSystem();
    rsNoShadow.softShadowsEnabled = false;
    expect(Math.max(...recordBlurs(rsNoShadow))).toBe(0);

    session.degradation = {
      particles_enabled: true,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    expect(Math.max(...recordBlurs(new RenderSystem()))).toBe(0);
  });
});
