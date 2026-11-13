import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it, vi } from "vitest";
import {
  type LabelledVocabulary,
  pickContrast,
} from "#src/generators/contrast";
import { GT014Generator } from "#src/generators/gt014";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawBalanceScale } from "#src/render/board-shapes";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import {
  GT014_FIXTURES,
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-014/fixtures";
import { BalanceScaleSession } from "#src/templates/GT-014/session";
import type { GT014Content } from "#src/templates/GT-014/template";
import { solveWithWebGestures } from "#tests/gates/web-gesture-solver";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

const DIGIT_RE = /\d/;

vi.mock("#src/render/board-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/board-shapes")>();
  return { ...actual, drawBalanceScale: vi.fn(actual.drawBalanceScale) };
});

const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: true,
  trayItems: 4,
  needsCommit: false,
});

function openStageSession(
  content: GT014Content = SAMPLE_LEVEL_2.content_pack,
  difficulty = SAMPLE_LEVEL_2.difficulty_params,
  layoutSeed = 0
): BalanceScaleSession {
  const session = new BalanceScaleSession(content, difficulty, layoutSeed);
  session.prepareRound(
    "5-6",
    DEFAULT_LOGIC_SPACE,
    ZONES.stage,
    ZONES.tray ?? undefined
  );
  return session;
}

describe("GT-014: Cân hai bên — UI/UX Montessori 3D, Kéo-thả 2 chiều, Gợi ý L1..L3", () => {
  it("huy hiệu mục tiêu trên trụ cân & kim chỉ thăng bằng vẽ thuần vector (0 chữ số, 0 chữ cái, vẫn gọi drawBalanceScale)", () => {
    const goals: readonly GT014Content["goal"][] = [
      "balance",
      "pick_heavier",
      "pick_lighter",
    ];
    for (const goal of goals) {
      const content: GT014Content = {
        ...SAMPLE_LEVEL_1.content_pack,
        goal,
      };
      const session = openStageSession(
        content,
        SAMPLE_LEVEL_1.difficulty_params
      );
      vi.mocked(drawBalanceScale).mockClear();
      const texts = collectRenderedText(session, { prepare: false });
      expect(vi.mocked(drawBalanceScale)).toHaveBeenCalled();
      expect(texts.filter((t) => DIGIT_RE.test(t))).toEqual([]);
      expect(lettersOnly(texts)).toEqual([]);
    }
  });

  it("kéo-thả 2 chiều (drop khay -> đĩa; drop đĩa -> khay) và chạm-chạm 2 chiều hoạt động mượt", () => {
    const session = openStageSession(
      SAMPLE_LEVEL_2.content_pack,
      SAMPLE_LEVEL_2.difficulty_params
    );
    const view0 = session.getView();
    const opt2 = view0.entities.find((e) => e.id === "opt_2");
    const rightPan = view0.entities.find((e) => e.id === "right_pan");
    expect(opt2).toBeDefined();
    expect(rightPan).toBeDefined();
    if (!(opt2 && rightPan)) {
      return;
    }

    // 1. Kéo quả cân opt_2 (weight 2) từ khay thả lên đĩa phải
    const placeAction = session.toAction({
      type: "drop",
      fromX: opt2.x,
      fromY: opt2.y,
      toX: rightPan.x,
      toY: rightPan.y,
      timeMs: 100,
    });
    expect(placeAction).toEqual({
      type: "place_item",
      data: { item_id: "opt_2", target_pan: "right" },
    });
    if (placeAction) {
      expect(session.validateAction(placeAction).valid).toBe(true);
      session.commit(placeAction);
    }
    expect(session.getRightWeight()).toBe(7);

    // 2. Kéo quả cân opt_2 từ đĩa phải thả trả về vùng khay
    const view1 = session.getView();
    const placedOpt2 = view1.entities.find((e) => e.id === "pan-1:opt_2");
    expect(placedOpt2?.slotIndex).toBe(-1);
    expect(placedOpt2?.state).toBe("active");
    const trayCenter = ZONES.tray
      ? {
          x: ZONES.tray.x + ZONES.tray.w / 2,
          y: ZONES.tray.y + ZONES.tray.h / 2,
        }
      : { x: opt2.x, y: opt2.y };

    const returnAction = session.toAction({
      type: "drop",
      fromX: placedOpt2?.x ?? rightPan.x,
      fromY: placedOpt2?.y ?? rightPan.y,
      toX: trayCenter.x,
      toY: trayCenter.y,
      timeMs: 200,
    });
    expect(returnAction).toEqual({
      type: "return_item",
      data: { item_id: "opt_2", from_pan: "right" },
    });
    if (returnAction) {
      expect(session.validateAction(returnAction).valid).toBe(true);
      session.commit(returnAction);
    }
    expect(session.getRightWeight()).toBe(5);
    expect(session.getTrayItems().some((t) => t.item_id === "opt_2")).toBe(
      true
    );
    expect(
      session.validateAction({
        type: "return_item",
        data: { item_id: "init_l1", from_pan: "left" },
      }).valid
    ).toBe(false);
    expect(session.returnItem("init_l1", "left")).toBe(false);

    // 3. Chạm-chạm 2 chiều: tap chọn opt_3 rồi tap đĩa phải -> thắng
    const view2 = session.getView();
    const opt3 = view2.entities.find((e) => e.id === "opt_3");
    expect(opt3).toBeDefined();
    if (!opt3) {
      return;
    }
    expect(
      session.toAction({ type: "tap", x: opt3.x, y: opt3.y, timeMs: 300 })
    ).toBeNull();
    expect(session.getStagedItemId()).toBe("opt_3");
    const tapPlace = session.toAction({
      type: "tap",
      x: rightPan.x,
      y: rightPan.y,
      timeMs: 400,
    });
    expect(tapPlace).toEqual({
      type: "place_item",
      data: { item_id: "opt_3", target_pan: "right" },
    });
    if (tapPlace) {
      session.commit(tapPlace);
    }
    expect(session.checkWinCondition()).toBe(true);
  });

  it("xáo trộn khay tất định theo layoutSeed (0 giữ nguyên, !== 0 derange)", () => {
    const baseOrder = SAMPLE_LEVEL_2.content_pack.tray.map((t) => t.item_id);
    const s0 = openStageSession(
      SAMPLE_LEVEL_2.content_pack,
      SAMPLE_LEVEL_2.difficulty_params,
      0
    );
    expect(s0.getTrayItems().map((t) => t.item_id)).toEqual(baseOrder);

    const s1 = openStageSession(
      SAMPLE_LEVEL_2.content_pack,
      SAMPLE_LEVEL_2.difficulty_params,
      42
    );
    const s1Repeat = openStageSession(
      SAMPLE_LEVEL_2.content_pack,
      SAMPLE_LEVEL_2.difficulty_params,
      42
    );
    const order42 = s1.getTrayItems().map((t) => t.item_id);
    expect(order42).toEqual(s1Repeat.getTrayItems().map((t) => t.item_id));
    expect(order42).not.toEqual(baseOrder);
  });

  it("solver gợi ý thông minh L1 / L2 / L3 + getHintDestinationIndex + getHintDemoSequence(3) giải cả bài đặt 2 bên và bài đặt dư vật", () => {
    // 1. Bài cần đặt vật lên cả 2 bên (trái = 5, phải = 2; khay có [2, 5] -> đặt 5 bên phải và 2 bên trái = 7)
    const twoSidedPack: GT014Content = {
      prompt: "Cân bằng hai đĩa!",
      goal: "balance",
      left_pan: [
        { item_id: "l5", asset: { kind: "emoji", ref: "🍉" }, weight: 5 },
      ],
      right_pan: [
        { item_id: "r2", asset: { kind: "emoji", ref: "🍎" }, weight: 2 },
      ],
      tray: [
        { item_id: "t2", asset: { kind: "emoji", ref: "🍓" }, weight: 2 },
        { item_id: "t5", asset: { kind: "emoji", ref: "🍐" }, weight: 5 },
      ],
    };
    const session = openStageSession(
      twoSidedPack,
      SAMPLE_LEVEL_2.difficulty_params
    );
    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);
    expect(l1).toEqual({ kind: "region", ids: ["right_pan"] });
    expect(l2).toEqual({ kind: "region", ids: ["right_pan", "t5"] });
    expect(l3?.kind).toBe("slot");
    expect(session.getHintDestinationIndex()).toBe(1);
    const demoSeq = session.getHintDemoSequence(3);
    expect(demoSeq).toHaveLength(2);

    // 2. Bài trẻ lỡ đặt dư vật làm kẹt đường cân bằng -> gợi ý nhấc vật dư ra
    const overplacedSession = openStageSession(
      SAMPLE_LEVEL_2.content_pack,
      SAMPLE_LEVEL_2.difficulty_params
    );
    overplacedSession.placeItem("opt_4", "right"); // phải = 5 + 4 = 9 !== 8
    overplacedSession.placeItem("opt_3", "right"); // phải = 9 + 3 = 12 > trái = 8, khay chỉ còn [2]
    const returnHintIdx = overplacedSession.getHintTargetIndex();
    // Đĩa phải là slotIndex 1, không có destination (chạm để trả về khay)
    expect(returnHintIdx).toBe(1);
    expect(overplacedSession.getHintDestinationIndex()).toBeNull();
    expect(overplacedSession.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["right_pan", "opt_3"],
    });
  });

  it("solveWithWebGestures đạt 'won' cho cả 3 fixtures GT-014#0, GT-014#1, GT-014#2", async () => {
    for (const [index, fixture] of GT014_FIXTURES.entries()) {
      const outcome = await solveWithWebGestures("GT-014", fixture, index);
      expect(outcome, `GT-014#${index}`).toBe("won");
    }
  });

  it("allow_retry = false đóng lượt sau 1 lần chọn sai; allow_retry = true re-tap cùng bên sai kích lại wrongFlash + wonder", () => {
    const noRetrySession = openStageSession(SAMPLE_LEVEL_1.content_pack, {
      ...SAMPLE_LEVEL_1.difficulty_params,
      allow_retry: false,
    });
    expect(noRetrySession.isAcceptingInput()).toBe(true);
    noRetrySession.commit({ type: "select_side", data: "right" });
    expect(noRetrySession.checkWinCondition()).toBe(false);
    expect(noRetrySession.isAcceptingInput()).toBe(false);
    expect(
      noRetrySession.validateAction({ type: "select_side", data: "left" }).valid
    ).toBe(false);

    // Render trạng thái đóng lượt (reveal đáp án tĩnh) không ném lỗi và ngoài pill Montessori không có chữ số trên đĩa
    const pillReason = noRetrySession.getControlOfError()?.reasonVi;
    const texts = collectRenderedText(noRetrySession, { prepare: false });
    expect(texts.filter((t) => t !== pillReason && DIGIT_RE.test(t))).toEqual(
      []
    );

    // allow_retry = true: re-tap cùng bên sai vẫn kích lại wonder
    const retrySession = openStageSession(
      SAMPLE_LEVEL_1.content_pack,
      SAMPLE_LEVEL_1.difficulty_params
    );
    retrySession.commit({ type: "select_side", data: "right" });
    expect(retrySession.mascotMood()).toBe("wonder");
    retrySession.update(1600);
    expect(retrySession.mascotMood()).toBeNull();
    retrySession.commit({ type: "select_side", data: "right" });
    expect(retrySession.mascotMood()).toBe("wonder");
  });

  it("render() thuần 100%, tôn trọng reducedMotion, fallback asset hỏng tỉ lệ khối lượng và GT014Generator không cố định đáp án ở tray[0]", () => {
    // 1. Render purity & reducedMotion
    const session = openStageSession(
      SAMPLE_LEVEL_3.content_pack,
      SAMPLE_LEVEL_3.difficulty_params
    );
    session.onScaffoldEscalated(2, "timer");
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    const beforeView = JSON.stringify(session.getView());
    const beforeTelem = session.getTelemetry().events.length;
    findDrawsOutsideStage(ZONES.stage, (ctx) => {
      session.render(ctx, rs, 500);
      session.render(ctx, rs, 2500);
    });
    expect(JSON.stringify(session.getView())).toBe(beforeView);
    expect(session.getTelemetry().events.length).toBe(beforeTelem);

    // 2. Fallback asset rỗng vẽ quả cân đồng thau vector không lỗi và 0 chữ số
    const brokenPack: GT014Content = {
      ...SAMPLE_LEVEL_2.content_pack,
      tray: SAMPLE_LEVEL_2.content_pack.tray.map((t) => ({
        ...t,
        asset: { kind: "emoji", ref: " " },
      })),
    };
    const brokenSession = openStageSession(
      brokenPack,
      SAMPLE_LEVEL_2.difficulty_params
    );
    const brokenTexts = collectRenderedText(brokenSession, { prepare: false });
    expect(brokenTexts.filter((t) => DIGIT_RE.test(t))).toEqual([]);

    // 3. GT014Generator: không sinh chữ số trong emoji_ref và vị trí vật cân bằng phân bố đều
    const allVocab: LabelledVocabulary[] = CONTENT_THEMES.map((t) => ({
      theme: t.code,
      label_vi: t.label_vi,
      icon_emoji_ref: t.icon_emoji_ref,
      nouns: t.nouns.map((n) => ({
        emoji_ref: n.emoji_ref,
        label_vi: n.text_vi,
      })),
    }));
    const baseVocab = allVocab[0];
    expect(baseVocab).toBeDefined();
    if (!baseVocab) {
      return;
    }
    const answerIndices = new Set<number>();
    for (let seed = 1; seed <= 12; seed++) {
      const gen = GT014Generator.generate({
        rng: createRng(seed * 997),
        age_band: "5-6",
        theme: baseVocab.theme,
        vocabulary: {
          ...baseVocab,
          contrast: pickContrast(baseVocab, allVocab),
        },
      });
      const pack = gen.content_pack;
      const needed =
        (pack.left_pan[0]?.weight ?? 0) - (pack.right_pan[0]?.weight ?? 0);
      const ansIdx = pack.tray.findIndex((t) => t.weight === needed);
      expect(ansIdx).toBeGreaterThanOrEqual(0);
      answerIndices.add(ansIdx);
      for (const item of [...pack.left_pan, ...pack.right_pan, ...pack.tray]) {
        if (item.asset.kind === "emoji") {
          expect(item.asset.ref).not.toMatch(DIGIT_RE);
        }
      }
    }
    expect(answerIndices.size).toBeGreaterThan(1);
  });
});
