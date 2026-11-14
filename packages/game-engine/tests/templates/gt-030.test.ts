import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it, vi } from "vitest";
import { GT030Generator } from "#src/generators/gt030";
import type { ThemeVocabulary } from "#src/generators/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures";
import { getGT030Clock } from "#src/templates/GT-030/layout";
import { GT030Session } from "#src/templates/GT-030/session";
import {
  type GT030Content,
  GT030ContentSchema,
  type GT030Difficulty,
} from "#src/templates/GT-030/template";
import {
  FIRST_OPTION_SLOT,
  SOURCE_SLOT,
  STRIP_SLOT,
} from "#src/templates/GT-030/zone-layout";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText } from "#tests/helpers/rendered-text";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function createCtx(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(964, 628).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Missing 2d context");
  }
  return ctx;
}

const BASE_FIXTURE = GT030_FIXTURES[0];
if (!BASE_FIXTURE) {
  throw new Error("Missing GT-030 fixture #0");
}
const BASE_CONTENT: GT030Content = BASE_FIXTURE.content;
const BASE_DIFFICULTY: GT030Difficulty = BASE_FIXTURE.difficulty;

function buildStageSession(
  content: GT030Content = BASE_CONTENT,
  difficulty: GT030Difficulty = BASE_DIFFICULTY,
  layoutSeed = 101
): GT030Session {
  const session = new GT030Session(content, difficulty, layoutSeed);
  const space = deriveLogicSpace(964, 628);
  const cssPerLogic = Math.min(964 / space.w, 628 / space.h);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "5-6",
    cssPerLogic,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(
    "5-6",
    space,
    zones.stage,
    zones.tray ?? undefined,
    cssPerLogic
  );
  return session;
}

function placeAllUnits(session: GT030Session): void {
  const target = session.content.object.length_in_units;
  while (session.getPlacedUnitsCount() < target) {
    session.commit({ type: "place_unit", data: {} });
  }
}

describe("GT-030 — hợp đồng vẽ thuần, 5 trạng thái, fallback, degradation, allow_retry, N5 & N7", () => {
  it("BR-ERC-02: gọi render() 100 lần liên tiếp thuần 100%, không mutate state", () => {
    const session = buildStageSession();
    session.commit({ type: "place_unit", data: {} });
    const ctx = createCtx();
    const rs = new RenderSystem();
    const beforeView = JSON.stringify(session.getView());
    const beforeCount = session.getPlacedUnitsCount();
    const beforeSelected = session.getSelectedOptionId();
    const beforeClosed = session.isRoundClosedOnWrong();
    const beforeWin = session.checkWinCondition();

    for (let i = 0; i < 100; i++) {
      session.render(ctx, rs, i * 16);
    }

    expect(session.getPlacedUnitsCount()).toBe(beforeCount);
    expect(session.getSelectedOptionId()).toBe(beforeSelected);
    expect(session.isRoundClosedOnWrong()).toBe(beforeClosed);
    expect(session.checkWinCondition()).toBe(beforeWin);
    expect(JSON.stringify(session.getView())).toBe(beforeView);

    // Sau khi chọn đáp án đúng và thắng (particles > 0), gọi render() 100 lần vẫn giữ nguyên particles
    placeAllUnits(session);
    const correctOpt = session.getDisplayOptions().find((o) => o.is_correct);
    if (!correctOpt) {
      throw new Error("Missing correct option");
    }
    session.commit({
      type: "select_option",
      data: { option_id: correctOpt.option_id },
    });
    const clock = getGT030Clock(session);
    const initialParticleCount = clock.particles.length;
    const initialFirstLife = clock.particles[0]?.life;
    const initialEventCount = session.getTelemetry().events.length;
    expect(initialParticleCount).toBeGreaterThan(0);

    for (let i = 0; i < 100; i++) {
      session.render(ctx, rs, i * 16);
    }

    expect(clock.particles.length).toBe(initialParticleCount);
    expect(clock.particles[0]?.life).toBe(initialFirstLife);
    expect(session.getTelemetry().events.length).toBe(initialEventCount);
  });

  it("5 trạng thái thị giác (idle, hovered, selected, wrong, correct) phản ánh trên view và canvas", () => {
    const session = buildStageSession();
    const ctx = createCtx();
    const rs = new RenderSystem();

    // 1. idle + hovered ở khay nguồn
    const sourceSlot = session.slots[SOURCE_SLOT];
    if (!sourceSlot) {
      throw new Error("Missing sourceSlot");
    }
    session.setPointerOver(sourceSlot.x, sourceSlot.y);
    expect(
      session.getView().entities.find((e) => e.slotIndex === SOURCE_SLOT)?.state
    ).toBe("selected");
    session.render(ctx, rs, 100);
    session.clearPointerOver();
    expect(
      session.getView().entities.find((e) => e.slotIndex === SOURCE_SLOT)?.state
    ).toBe("idle");

    // 2. Đặt đủ đơn vị -> hiện các thẻ số đáp án
    placeAllUnits(session);
    const options = session.getDisplayOptions();
    const wrongIdx = options.findIndex((o) => !o.is_correct);
    const correctIdx = options.findIndex((o) => o.is_correct);
    const wrongSlot = session.slots[FIRST_OPTION_SLOT + wrongIdx];
    const correctSlot = session.slots[FIRST_OPTION_SLOT + correctIdx];
    if (!(wrongSlot && correctSlot)) {
      throw new Error("Missing option slots");
    }

    // 3. hovered trên thẻ đáp án
    session.setPointerOver(wrongSlot.x, wrongSlot.y);
    expect(
      session
        .getView()
        .entities.find((e) => e.slotIndex === FIRST_OPTION_SLOT + wrongIdx)
        ?.state
    ).toBe("selected");
    session.render(ctx, rs, 200);

    // 4. wrong trên thẻ đáp án sai
    const wrongOpt = options[wrongIdx];
    if (!wrongOpt) {
      throw new Error("Missing wrong option");
    }
    session.commit({
      type: "select_option",
      data: { option_id: wrongOpt.option_id },
    });
    expect(
      session.getView().entities.find((e) => e.id === wrongOpt.option_id)?.state
    ).toBe("incorrect");
    const retrySpy = vi.spyOn(rs, "drawRetryRing");
    session.render(ctx, rs, 250);
    expect(retrySpy).toHaveBeenCalled();

    // Hết nhịp flash sai -> về idle
    session.update(1000);
    expect(session.getSelectedOptionId()).toBeNull();

    // 5. correct trên thẻ đáp án đúng
    const correctOpt = options[correctIdx];
    if (!correctOpt) {
      throw new Error("Missing correct option");
    }
    session.commit({
      type: "select_option",
      data: { option_id: correctOpt.option_id },
    });
    expect(session.checkWinCondition()).toBe(true);
    expect(
      session.getView().entities.find((e) => e.id === correctOpt.option_id)
        ?.state
    ).toBe("correct");
    session.render(ctx, rs, 1400);
  });

  it("BR-ERC-09: không rò chữ prose thừa hay mã lỗi asset hỏng (EMJ-*) lên canvas", () => {
    const brokenContent: GT030Content = {
      ...BASE_CONTENT,
      object: {
        ...BASE_CONTENT.object,
        asset: { kind: "emoji", ref: "EMJ-BROKEN-OBJ" },
      },
      unit: {
        ...BASE_CONTENT.unit,
        asset: { kind: "emoji", ref: "EMJ-BROKEN-UNIT" },
      },
    };
    const session = buildStageSession(brokenContent);
    session.commit({ type: "place_unit", data: {} });
    const view = session.getView();
    for (const entity of view.entities) {
      expect(entity.spokenLabel).toBeTruthy();
      expect(entity.spokenLabel).not.toContain("EMJ-");
    }
    const texts = collectRenderedText(session);
    for (const entry of texts) {
      expect(entry).not.toContain("EMJ-");
      expect(entry).not.toContain("Vật cần đo");
      expect(entry).not.toContain("Chạm để xếp");
      expect(entry).not.toContain("Đã đặt:");
    }
  });

  it("GT-030.md §12: thứ tự tuột hiệu ứng khi thiết bị yếu (particles -> soft shadows / vạch chéo)", () => {
    const session = buildStageSession();
    placeAllUnits(session);
    const correctOpt = session.getDisplayOptions().find((o) => o.is_correct);
    if (!correctOpt) {
      throw new Error("Missing correct option");
    }
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.commit({
      type: "select_option",
      data: { option_id: correctOpt.option_id },
    });
    expect(getGT030Clock(session).particles).toHaveLength(0);

    // Khi soft_shadows_enabled = false, vạch chéo khe hở tuột nhưng bàn đo và đơn vị vẫn vẽ đủ
    const session2 = buildStageSession();
    session2.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    const strip = session2.slots[STRIP_SLOT];
    if (!strip) {
      throw new Error("Missing strip");
    }
    session2.commit({
      type: "place_unit",
      data: { offset_px: Math.round(strip.w * 0.4) },
    });
    expect(session2.getGapFlash()?.kind).toBe("gap");
    const ctx = createCtx();
    const rs = new RenderSystem();
    session2.render(ctx, rs, 100);
    expect(session2.getView().entities.length).toBeGreaterThanOrEqual(3);
  });

  it("allow_retry: false đóng vòng ngay sau khi chọn sai phương án và hiện khung đối chiếu", () => {
    const noRetryDiff: GT030Difficulty = {
      ...BASE_DIFFICULTY,
      allow_retry: false,
    };
    const session = buildStageSession(BASE_CONTENT, noRetryDiff);
    placeAllUnits(session);

    const wrongOpt = session.getDisplayOptions().find((o) => !o.is_correct);
    const correctOpt = session.getDisplayOptions().find((o) => o.is_correct);
    if (!(wrongOpt && correctOpt)) {
      throw new Error("Missing options");
    }

    const verdict = session.validateAction({
      type: "select_option",
      data: { option_id: wrongOpt.option_id },
    });
    expect(verdict.valid).toBe(false);
    session.commit({
      type: "select_option",
      data: { option_id: wrongOpt.option_id },
    });

    expect(session.isRoundClosedOnWrong()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);

    // Mọi thao tác sau khi đóng vòng đều bị từ chối
    expect(
      session.validateAction({
        type: "select_option",
        data: { option_id: correctOpt.option_id },
      }).valid
    ).toBe(false);
    expect(
      session.toAction({
        type: "tap",
        x: session.slots[FIRST_OPTION_SLOT]?.x ?? 0,
        y: session.slots[FIRST_OPTION_SLOT]?.y ?? 0,
        timeMs: 300,
      })
    ).toBeNull();

    const ctx = createCtx();
    const dashSpy = vi.spyOn(ctx, "setLineDash");
    session.render(ctx, new RenderSystem(), 300);
    expect(dashSpy).toHaveBeenCalled();
  });

  it("N7: sang vòng 2+ với layoutSeed > 0 thì xáo vị trí đáp án và đổi ô đúng", () => {
    const session = buildStageSession(BASE_CONTENT, BASE_DIFFICULTY, 42);
    const round1CorrectIdx = session
      .getDisplayOptions()
      .findIndex((o) => o.is_correct);

    const space = deriveLogicSpace(964, 628);
    session.prepareRound(
      "5-6",
      space,
      session.stageRect,
      session.trayRect,
      session.cssPerLogic
    );
    const round2CorrectIdx = session
      .getDisplayOptions()
      .findIndex((o) => o.is_correct);
    expect(round2CorrectIdx).toBeGreaterThanOrEqual(0);
    expect(round2CorrectIdx).not.toBe(round1CorrectIdx);

    session.prepareRound(
      "5-6",
      space,
      session.stageRect,
      session.trayRect,
      session.cssPerLogic
    );
    const round3CorrectIdx = session
      .getDisplayOptions()
      .findIndex((o) => o.is_correct);
    expect(round3CorrectIdx).not.toBe(round2CorrectIdx);
  });

  it("N5: thang gợi ý L1 -> L2 -> L3 và getHintDemoSequence(3) ở cả 2 pha", () => {
    const session = buildStageSession();
    const ctx = createCtx();
    const rs = new RenderSystem();

    // Pha 1: đang đặt đơn vị
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["strip"],
    });
    session.render(ctx, rs, 100);

    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["source-unit", "strip"],
    });
    session.render(ctx, rs, 200);

    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: SOURCE_SLOT,
      toIndex: STRIP_SLOT,
    });
    const seqPhase1 = session.getHintDemoSequence(3);
    expect(seqPhase1).not.toBeNull();
    expect(seqPhase1?.length).toBe(session.content.object.length_in_units + 1);
    expect(seqPhase1?.[0]).toEqual({ from: SOURCE_SLOT, to: STRIP_SLOT });

    // Pha 2: đã đặt đủ đơn vị, chuyển sang chọn số đo
    placeAllUnits(session);
    const l1Select = session.getHintTargetForLevel(1);
    expect(l1Select?.kind).toBe("region");
    if (l1Select?.kind === "region") {
      expect(l1Select.ids[0]).toBe("strip");
      expect(l1Select.ids.length).toBe(session.getDisplayOptions().length + 1);
    }

    const l2Select = session.getHintTargetForLevel(2);
    expect(l2Select?.kind).toBe("region");
    if (l2Select?.kind === "region") {
      expect(l2Select.ids[0]).toBe("strip");
      expect(l2Select.ids).toHaveLength(3);
    }
    session.render(ctx, rs, 300);

    const correctIdx = session
      .getDisplayOptions()
      .findIndex((o) => o.is_correct);
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: FIRST_OPTION_SLOT + correctIdx,
    });
    expect(session.getHintDemoSequence(3)).toEqual([
      { from: FIRST_OPTION_SLOT + correctIdx },
    ]);
    session.render(ctx, rs, 400);

    session.onHintCleared();
    expect(getGT030Clock(session).activeHintLevel).toBe(0);
  });

  it("GT030Generator: luôn sinh length_in_units >= 4 và hỗ trợ number-rod khi what = number", () => {
    const theme = CONTENT_THEMES[0];
    if (!theme) {
      throw new Error("Missing theme");
    }
    const vocabulary: ThemeVocabulary = {
      theme: theme.code,
      label_vi: theme.label_vi,
      icon_emoji_ref: theme.icon_emoji_ref,
      nouns: theme.nouns.map((n) => ({
        emoji_ref: n.emoji_ref,
        label_vi: n.text_vi,
      })),
    };

    for (let seed = 1; seed <= 20; seed++) {
      const level = GT030Generator.generate({
        rng: createRng(seed * 997),
        age_band: "5-6",
        what: seed % 2 === 0 ? "number" : "size",
        theme: theme.code,
        vocabulary,
        escalation_step: seed % 4,
      });
      const parsed = GT030ContentSchema.parse(level.content_pack);
      expect(parsed.object.length_in_units).toBeGreaterThanOrEqual(4);
      expect(parsed.object.length_in_units).toBeLessThanOrEqual(8);
      if (seed % 2 === 0) {
        expect(parsed.representation).toBe("number-rod");
      }
    }
  });
});
