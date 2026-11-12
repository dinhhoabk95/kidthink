import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures";
import { GT006Session } from "#src/templates/GT-006/session";
import type { GT006Content } from "#src/templates/GT-006/template";
import { collectRenderedText } from "#tests/helpers/rendered-text";

function getFixture() {
  const fixture = GT006_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-006 fixture");
  }
  return fixture;
}

describe("GT-006 — sắp xếp thứ tự (sequence-order): hit-test, spokenLabel, commit", () => {
  const fixture = getFixture();

  function buildStageSession(
    overrides?: Partial<typeof fixture.difficulty>,
    customContent?: GT006Content
  ): GT006Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "5-6",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: true,
    });
    const session = new GT006Session(
      customContent ?? fixture.content,
      { ...fixture.difficulty, shuffle_initial: false, ...overrides },
      1
    );
    session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, zones.stage);
    return session;
  }

  it("chạm lệch mép trong dung sai TAP_TOLERANCE_PX (24px) vẫn chọn và đổi chỗ được hai bước", () => {
    const session = buildStageSession();
    const slot0 = session.slots[0];
    const slot1 = session.slots[1];
    if (!(slot0 && slot1)) {
      throw new Error("Missing slots");
    }

    const offset0 = slot0.hitH / 2 + TAP_TOLERANCE_PX - 4;
    expect(
      session.toAction({
        type: "tap",
        x: slot0.x,
        y: slot0.y + offset0,
        timeMs: 0,
      })
    ).toBeNull();
    expect(session.getStagedIndex()).toBe(0);

    const offset1 = slot1.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const action = session.toAction({
      type: "tap",
      x: slot1.x,
      y: slot1.y + offset1,
      timeMs: 10,
    });
    expect(action).toEqual({
      type: "reorder_step",
      data: { from_index: 0, to_index: 1 },
    });
  });

  it("chạm ngoài mọi thẻ bị nuốt (feedback none, không tính sai)", () => {
    const session = buildStageSession();
    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict?.feedback).toBe("none");
    expect(verdict?.valid).toBe(false);
  });

  it("getView() gán hitShape square, spokenLabel tiếng Việt và id duy nhất cho từng bước", () => {
    const session = buildStageSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entity of view.entities) {
      expect(entity.hitShape).toBe("square");
      expect(entity.spokenLabel).toBeTruthy();
    }
  });

  it("chuyển pha Explore -> Challenge sau 2 thao tác hoán đổi toa và tính đúng cao độ getStepPitchIndex", () => {
    const session = buildStageSession();
    session.startExplorePhase();
    expect(session.getExploreTracker().getPhase()).toBe("explore");

    expect(session.getStepPitchIndex("s1")).toBe(0);
    expect(session.getStepPitchIndex("s2")).toBe(1);
    expect(session.getStepPitchIndex("s3")).toBe(2);

    session.reorderSteps(0, 1);
    expect(session.getExploreTracker().getPhase()).toBe("explore");
    expect(session.getExploreTracker().getExploreActionsCount()).toBe(1);

    session.reorderSteps(1, 0);
    expect(session.getExploreTracker().getPhase()).toBe("challenge");
    expect(session.getExploreTracker().getExploreActionsCount()).toBe(2);
  });

  it("phát hiện vị trí lệch đầu tiên findFirstMismatchIndex, phản hồi Control of Error và kích hoạt Micro-Sandbox sau 2 lần nộp sai", () => {
    const session = buildStageSession();
    expect(session.findFirstMismatchIndex()).toBe(-1);

    session.reorderSteps(0, 1);
    expect(session.findFirstMismatchIndex()).toBe(0);

    session.onSubmitSequence();
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Toa thứ 1 chưa đúng nhịp quy luật"
    );
    expect(session.getControlOfError()?.targetId).toBe("s2");
    expect(session.getControlOfError()?.actualValue).toBe(1);
    expect(session.isMicroSandboxActive()).toBe(false);

    session.onSubmitSequence();
    expect(session.isMicroSandboxActive()).toBe(true);
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Toa thứ 1 chưa đúng nhịp quy luật"
    );

    session.reorderSteps(0, 1);
    expect(session.findFirstMismatchIndex()).toBe(-1);
    session.onSubmitSequence();
    expect(session.checkWinCondition()).toBe(true);
    expect(session.isMicroSandboxActive()).toBe(false);
    expect(session.getControlOfError()).toBeNull();
  });

  it("chặn no-op reorder (fromIndex === toIndex) và swap (indexA === indexB), không phát film_tick giả", () => {
    const mechanic = new OrderingMechanic();
    mechanic.setInitialSequence(["a", "b", "c"]);
    expect(mechanic.reorder(1, 1)).toBe(false);
    expect(mechanic.swap(2, 2)).toBe(false);
    expect(
      mechanic.validate(
        { type: "reorder_step", data: { from_index: 1, to_index: 1 } },
        ["a", "b", "c"]
      )
    ).toEqual({ valid: false, feedback: "none" });

    const session = buildStageSession();
    session.reorderSteps(0, 0);
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
    const reordered = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "step_reordered");
    expect(reordered).toHaveLength(0);
  });

  it("allow_retry === false: nộp sai đóng lượt ngay, khoá nhận input và canCommit() trả false", () => {
    const session = buildStageSession({
      allow_retry: false,
      shuffle_initial: true,
    });
    expect(session.isAcceptingInput()).toBe(true);
    expect(session.canCommit()).toBe(true);

    session.commit({ type: "check_sequence", data: {} });
    expect(session.checkWinCondition()).toBe(false);
    expect(session.isRoundLocked()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.canCommit()).toBe(false);
    expect(session.getHintTarget()).toBeNull();
    expect(session.getHintDemoSequence(3)).toBeNull();

    const slot0 = session.slots[0];
    if (slot0) {
      expect(
        session.toAction({ type: "tap", x: slot0.x, y: slot0.y, timeMs: 20 })
      ).toBeNull();
    }
    expect(
      session.validateAction({ type: "check_sequence", data: {} })
    ).toEqual({ valid: false, feedback: "none" });
  });

  it("chấp nhận hai bước tương đương thị giác (cùng asset và label) là hợp lệ", () => {
    const dupContent: GT006Content = {
      prompt: "Xếp các quả táo theo thứ tự",
      sequence: [
        {
          step_id: "a1",
          asset: { kind: "emoji", ref: "🍎" },
          order_index: 1,
          label: "Táo",
        },
        {
          step_id: "a2",
          asset: { kind: "emoji", ref: "🍎" },
          order_index: 2,
          label: "Táo",
        },
        {
          step_id: "b1",
          asset: { kind: "emoji", ref: "🍌" },
          order_index: 3,
          label: "Chuối",
        },
      ],
    };
    const session = buildStageSession({ shuffle_initial: false }, dupContent);
    // Hoán đổi hai quả táo giống hệt nhau ở vị trí 0 và 1
    session.reorderSteps(0, 1);
    expect(session.getCurrentSequence()).toEqual(["a2", "a1", "b1"]);
    expect(session.findFirstMismatchIndex()).toBe(-1);

    session.commit({ type: "check_sequence", data: {} });
    expect(session.checkWinCondition()).toBe(true);
  });

  it("thang gợi ý L1 / L2 / L3 và chuỗi làm mẫu getHintDemoSequence(3)", () => {
    const session = buildStageSession({ shuffle_initial: false });
    // Khi dãy đã đúng thứ tự mà chưa bấm xong -> gợi ý bấm nút xong
    expect(session.getHintTargetForLevel(2)).toEqual({ kind: "action" });

    // Đảo dãy sang [s3, s2, s1]
    session.reorderSteps(2, 0);
    session.reorderSteps(2, 1);
    expect(session.getCurrentSequence()).toEqual(["s3", "s2", "s1"]);

    const l1 = session.getHintTargetForLevel(1);
    expect(l1).toEqual({ kind: "region", ids: ["s3", "s1"] });

    // Trên bài 4 bước derangement, L1 cũng chỉ khoanh đúng cặp 2 thẻ đầu tiên cần đổi
    const fourStepContent: GT006Content = {
      prompt: "Xếp 4 bước theo thứ tự",
      sequence: [
        { step_id: "p1", asset: { kind: "emoji", ref: "🌱" }, order_index: 1 },
        { step_id: "p2", asset: { kind: "emoji", ref: "🌿" }, order_index: 2 },
        { step_id: "p3", asset: { kind: "emoji", ref: "🌳" }, order_index: 3 },
        { step_id: "p4", asset: { kind: "emoji", ref: "🍎" }, order_index: 4 },
      ],
    };
    const fourSession = buildStageSession(
      { shuffle_initial: true },
      fourStepContent
    );
    const fourL1 = fourSession.getHintTargetForLevel(1);
    expect(fourL1?.kind).toBe("region");
    if (fourL1?.kind === "region") {
      expect(fourL1.ids).toHaveLength(2);
    }

    const l2 = session.getHintTargetForLevel(2);
    expect(l2).toEqual({ kind: "slot", index: 2, toIndex: 0 });
    expect(session.getHintTarget()).toEqual(l2);

    const demo = session.getHintDemoSequence(3);
    expect(demo).not.toBeNull();
    expect((demo ?? []).length).toBeGreaterThanOrEqual(2);
    expect(session.getHintDemoSequence(1)).toBeNull();
  });

  it("phản hồi trạng thái chạm, rà con trỏ, render thuần và vẽ nội dung dải đáp án khi allow_retry: false", () => {
    const emojiContent: GT006Content = {
      prompt: "Xếp trái cây theo thứ tự",
      sequence: [
        {
          step_id: "em1",
          asset: { kind: "emoji", ref: "🍎" },
          order_index: 1,
          label: "Táo",
        },
        {
          step_id: "em2",
          asset: { kind: "emoji", ref: "🍌" },
          order_index: 2,
          label: "Chuối",
        },
        {
          step_id: "em3",
          asset: { kind: "emoji", ref: "🍇" },
          order_index: 3,
          label: "Nho",
        },
      ],
    };
    const session = buildStageSession(
      { shuffle_initial: true, allow_retry: false },
      emojiContent
    );
    const slot0 = session.slots[0];
    const slot1 = session.slots[1];
    if (!(slot0 && slot1)) {
      throw new Error("Missing slots");
    }

    session.setTouchingIndex(0);
    expect(session.getTouchingIndex()).toBe(0);
    expect(session.getView().entities[0]?.state).toBe("selected");

    session.toAction({ type: "tap", x: slot0.x, y: slot0.y, timeMs: 10 });
    expect(session.getStagedIndex()).toBe(0);
    expect(session.getTouchingIndex()).toBeNull();

    session.setPointerOver(slot1.x, slot1.y);
    expect(session.getHoveredTargetIndex()).toBe(1);

    const beforeSeq = [...session.getCurrentSequence()];
    const openTexts = collectRenderedText(session, { prepare: false });
    expect(session.getCurrentSequence()).toEqual(beforeSeq);
    expect(openTexts.filter((t) => t === "🍎")).toHaveLength(1);
    expect(openTexts.filter((t) => t === "🍌")).toHaveLength(1);
    expect(openTexts.filter((t) => t === "🍇")).toHaveLength(1);

    session.clearPointerOver();
    expect(session.getHoveredTargetIndex()).toBeNull();

    // Nộp sai ở allow_retry: false -> vẽ thêm glyph đáp án ["🍎", "🍌", "🍇"] trong dải đối chiếu
    session.commit({ type: "check_sequence", data: {} });
    const closedTexts = collectRenderedText(session, { prepare: false });
    expect(closedTexts.filter((t) => t === "🍎")).toHaveLength(2);
    expect(closedTexts.filter((t) => t === "🍌")).toHaveLength(2);
    expect(closedTexts.filter((t) => t === "🍇")).toHaveLength(2);
    expect(session.isRoundLocked()).toBe(true);
  });
});
