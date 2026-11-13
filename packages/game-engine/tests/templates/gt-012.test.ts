import { describe, expect, it, vi } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { DegradationManager } from "#src/systems/degradation";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { SAMPLE_LEVEL_1, SAMPLE_LEVEL_3 } from "#src/templates/GT-012/fixtures";
import { TOUCH_PULSE_MS } from "#src/templates/GT-012/layout";
import { FlashRecallSession } from "#src/templates/GT-012/session";
import { computeFlashSlots } from "#src/templates/GT-012/zone-layout";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

function makePreparedSession(
  overrides?: Partial<typeof SAMPLE_LEVEL_1.difficulty_params>,
  layoutSeed = 0,
  sample = SAMPLE_LEVEL_1
): FlashRecallSession {
  const space = deriveLogicSpace(964, 628);
  const session = new FlashRecallSession(
    sample.content_pack,
    { ...sample.difficulty_params, ...overrides },
    layoutSeed
  );
  const zones = computeZonesForSession(
    { logicW: space.w, logicH: space.h, ageBand: "4-5", cssPerLogic: 1 },
    session
  );
  session.prepareRound("4-5", space, zones.stage, undefined, 1);
  return session;
}

describe("GT-012: FlashRecallSession — Replay, Render Purity, Retry, Seed & Hints", () => {
  it("1. replay_flash qua dispatch(tap) mở lại nắp đúng 1 lần rồi đóng hẳn (BR-E012-02)", () => {
    const session = makePreparedSession({ allow_replay: true });
    const plate0 = session.plateRect;
    expect(plate0).not.toBeNull();
    if (!plate0) {
      return;
    }

    // Chạm mở nắp lần đầu
    const startVerdict = session.dispatch({
      type: "tap",
      x: plate0.x + plate0.w / 2,
      y: plate0.y + plate0.h / 2,
      timeMs: 100,
    });
    expect(startVerdict).toEqual({ valid: true, feedback: "none" });
    expect(session.isFlashVisible()).toBe(true);
    expect(session.takeSfxCues()).toEqual(["bell_open"]);

    // Hết thời gian flash lần 1 -> chuyển sang pha trả lời
    session.update(SAMPLE_LEVEL_1.difficulty_params.flash_ms + 50);
    expect(session.isFlashVisible()).toBe(false);
    expect(session.isCovered()).toBe(true);
    expect(session.canReplay()).toBe(true);

    const plate1 = session.plateRect;
    expect(plate1).not.toBeNull();
    if (!plate1) {
      return;
    }
    const replayEntity = session
      .getView()
      .entities.find((e) => e.id === "cloche-plate");
    expect(replayEntity).toBeDefined();

    // Chạm vào nắp chuông để xem lại qua dispatch(tap) thật
    const replayVerdict = session.dispatch({
      type: "tap",
      x: plate1.x + plate1.w / 2,
      y: plate1.y + plate1.h / 2,
      timeMs: 2000,
    });
    expect(replayVerdict).toEqual({ valid: true, feedback: "none" });
    expect(session.isFlashVisible()).toBe(true);
    expect(session.canReplay()).toBe(false);
    expect(session.takeSfxCues()).toEqual(["bell_open"]);
    expect(
      session
        .getTelemetry()
        .events.some((e) => e.event_name === "flash_replayed")
    ).toBe(true);

    // Hết thời gian flash lần 2 -> không còn lượt xem lại, entity cloche-plate biến mất
    session.update(SAMPLE_LEVEL_1.difficulty_params.flash_ms + 50);
    expect(session.isFlashVisible()).toBe(false);
    expect(session.canReplay()).toBe(false);
    expect(
      session.getView().entities.find((e) => e.id === "cloche-plate")
    ).toBeUndefined();

    const plate2 = session.plateRect;
    if (plate2) {
      const actionAfterUsed = session.toAction({
        type: "tap",
        x: plate2.x + plate2.w / 2,
        y: plate2.y + plate2.h / 2,
        timeMs: 4000,
      });
      expect(actionAfterUsed).toBeNull();
    }
    expect(
      session.validateAction({ type: "replay_flash", data: null }).valid
    ).toBe(false);
  });

  it("2. render() thuần 100% (BR-ERC-02) và mở nắp mượt kể cả khi timeMs = 50_000", () => {
    const session = makePreparedSession();
    const rs = new RenderSystem();
    const stage = session.stageRect;
    if (!stage) {
      throw new Error("Thiếu stageRect");
    }

    // Render ở pha chờ bấm với timeMs lớn không làm đổi state
    findDrawsOutsideStage(stage, (ctx) => {
      session.render(ctx, rs, 50_000);
      session.render(ctx, rs, 75_000);
    });
    expect(session.isAwaitingStart()).toBe(true);
    expect(session.getTelemetry().events).toHaveLength(1);

    // Bấm bắt đầu ở timeMs = 50_000 (trình duyệt đã chạy lâu)
    const p = session.plateRect;
    if (!p) {
      throw new Error("Thiếu plateRect");
    }
    session.dispatch({
      type: "tap",
      x: p.x + p.w / 2,
      y: p.y + p.h / 2,
      timeMs: 50_000,
    });
    expect(session.isFlashVisible()).toBe(true);

    // Hết loé -> chọn sai -> gọi render với timeMs rất lớn không xoá selectedValue
    session.update(SAMPLE_LEVEL_1.difficulty_params.flash_ms + 20);
    const wrongOpt = session.getOptions().find((o) => !o.is_correct);
    if (!wrongOpt) {
      throw new Error("Thiếu phương án sai");
    }
    session.selectValue(wrongOpt.value);
    expect(session.getSelectedValue()).toBe(wrongOpt.value);

    const viewBefore = session.getView();
    const telemetryLenBefore = session.getTelemetry().events.length;
    findDrawsOutsideStage(stage, (ctx) => {
      session.render(ctx, rs, 999_999);
      session.render(ctx, rs, 1_500_000);
    });
    expect(session.getSelectedValue()).toBe(wrongOpt.value);
    expect(session.getView()).toEqual(viewBefore);
    expect(session.getTelemetry().events).toHaveLength(telemetryLenBefore);
  });

  it("3. allow_retry = false: chọn sai đóng lượt ngay và mở nắp đối chiếu (§5 Nhánh 2)", () => {
    const session = makePreparedSession({ allow_retry: false });
    const stageCx =
      (session.stageRect?.x ?? 0) + (session.stageRect?.w ?? 0) / 2;
    session.startFlash();
    session.update(SAMPLE_LEVEL_1.difficulty_params.flash_ms + 50);

    const wrongOpt = session.getOptions().find((o) => !o.is_correct);
    const rightOpt = session.getOptions().find((o) => o.is_correct);
    if (!(wrongOpt && rightOpt)) {
      throw new Error("Thiếu phương án");
    }

    expect(session.selectValue(wrongOpt.value)).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.isRecapShown()).toBe(false);
    expect(session.isRevealShown()).toBe(true);
    expect(session.mascotMood()).toBeNull();
    expect(session.getTelemetry().end_time_ms).toBeDefined();

    // Đĩa dời về giữa sân khấu và hiện lại các vật đom đóm đối chiếu
    const plate = session.plateRect;
    expect(plate).not.toBeNull();
    if (plate) {
      expect(plate.x + plate.w / 2).toBeCloseTo(stageCx, 0);
    }
    expect(session.getView().entities.map((e) => e.id)).toEqual(
      session.getFlashItems().map((i) => i.item_id)
    );

    // Mọi thao tác tiếp theo bị từ chối
    const slot0 = session.slots[0];
    if (slot0) {
      expect(
        session.toAction({ type: "tap", x: slot0.x, y: slot0.y, timeMs: 3000 })
      ).toBeNull();
    }
    expect(
      session.validateAction({ type: "select_value", data: rightOpt.value })
        .valid
    ).toBe(false);
    expect(session.selectValue(rightOpt.value)).toBe(false);
  });

  it("4. allow_retry = true: chọn sai không lộ đom đóm (BR-E012-07), hết WRONG_FLASH_MS tự xoá và re-tap kích lại", () => {
    const session = makePreparedSession({ allow_retry: true });
    session.startFlash();
    session.update(SAMPLE_LEVEL_1.difficulty_params.flash_ms + 50);

    const wrongOpt = session.getOptions().find((o) => !o.is_correct);
    if (!wrongOpt) {
      throw new Error("Thiếu phương án sai");
    }
    const optEntityId = `opt-${wrongOpt.value}`;

    session.selectValue(wrongOpt.value);
    expect(session.isRevealShown()).toBe(false);
    expect(
      session.getView().entities.find((e) => e.id === optEntityId)?.state
    ).toBe("incorrect");

    // Sau WRONG_FLASH_MS, lựa chọn sai tự về idle
    session.update(WRONG_FLASH_MS + 10);
    expect(session.getSelectedValue()).toBeNull();
    expect(
      session.getView().entities.find((e) => e.id === optEntityId)?.state
    ).toBe("idle");

    // Chạm lại chính phương án sai đó vẫn kích hoạt lại wrongFlash
    session.selectValue(wrongOpt.value);
    expect(session.getSelectedValue()).toBe(wrongOpt.value);
    expect(
      session.getView().entities.find((e) => e.id === optEntityId)?.state
    ).toBe("incorrect");
  });

  it("5. layoutSeed !== 0: xáo trộn tất định options (derangement) và đổi arrangement (N7)", () => {
    const seed0 = makePreparedSession({}, 0, SAMPLE_LEVEL_3);
    const seedA1 = makePreparedSession({}, 42, SAMPLE_LEVEL_3);
    const seedA2 = makePreparedSession({}, 42, SAMPLE_LEVEL_3);

    expect(seed0.getOptions()).toEqual(SAMPLE_LEVEL_3.content_pack.options);
    expect(seed0.getArrangement()).toBe(
      SAMPLE_LEVEL_3.content_pack.arrangement
    );

    expect(seedA1.getOptions()).toEqual(seedA2.getOptions());
    expect(seedA1.getArrangement()).toBe(seedA2.getArrangement());
    expect(seedA1.getOptions().map((o) => o.value)).not.toEqual(
      SAMPLE_LEVEL_3.content_pack.options.map((o) => o.value)
    );
    expect(seedA1.getArrangement()).not.toBe(
      SAMPLE_LEVEL_3.content_pack.arrangement
    );
    expect(seedA1.getFlashSlots().map((s) => `${s.x},${s.y}`)).not.toEqual(
      seed0.getFlashSlots().map((s) => `${s.x},${s.y}`)
    );

    const plate = { x: 100, y: 100, w: 220, h: 220 };
    const arrangements = [
      "dice",
      "line",
      "triangle",
      "hand",
      "random",
    ] as const;
    for (const count of [3, 4]) {
      const signatures = arrangements.map((arr) =>
        computeFlashSlots(plate, count, arr)
          .map((s) => `${s.x},${s.y}`)
          .join("|")
      );
      expect(new Set(signatures).size).toBe(arrangements.length);
    }
  });

  it("6. Thang gợi ý L1 / L2 / L3: L1 replay hoặc fallback options, L2 thu hẹp 2 phương án, L3 trỏ slot đúng", () => {
    const session = makePreparedSession(
      { allow_replay: true },
      99,
      SAMPLE_LEVEL_3
    );

    // Lúc chờ bấm: mọi mức gợi ý đều chỉ vào cloche-plate
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["cloche-plate"],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["cloche-plate"],
    });
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "region",
      ids: ["cloche-plate"],
    });

    session.startFlash();
    session.update(SAMPLE_LEVEL_3.difficulty_params.flash_ms + 50);

    // Đang còn lượt xem lại -> L1 khoanh cloche-plate
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["cloche-plate"],
    });

    // Sau khi dùng hết lượt xem lại -> L1 fallback khoanh toàn bộ phương án
    session.replayFlash();
    session.update(SAMPLE_LEVEL_3.difficulty_params.flash_ms + 50);
    expect(session.canReplay()).toBe(false);
    const l1Fallback = session.getHintTargetForLevel(1);
    expect(l1Fallback).toEqual({
      kind: "region",
      ids: session.getOptions().map((o) => `opt-${o.value}`),
    });

    // L2 thu hẹp còn đúng 2 phương án: đáp án đúng (4) + 1 nhiễu gần nhất (3 hoặc 5)
    const l2 = session.getHintTargetForLevel(2);
    expect(l2?.kind).toBe("region");
    if (l2?.kind === "region") {
      expect(l2.ids).toHaveLength(2);
      expect(l2.ids).toContain("opt-4");
      expect(l2.ids.some((id) => id === "opt-3" || id === "opt-5")).toBe(true);
    }

    // L3 trỏ đúng slot của phương án đúng trong displayOptions đã xáo trộn
    const l3 = session.getHintTargetForLevel(3);
    const expectedIdx = session.getOptions().findIndex((o) => o.is_correct);
    expect(l3).toEqual({ kind: "slot", index: expectedIdx });
  });

  it("7. onPointerDown / setPointerOver, reducedMotion, degradation và vẽ nằm gọn trong stageRect", () => {
    const session = makePreparedSession({}, 7, SAMPLE_LEVEL_3);
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    session.degradation = new DegradationManager().updateFps(30);

    const stage = session.stageRect;
    expect(stage).not.toBeNull();
    if (!stage) {
      return;
    }

    const p0 = session.plateRect;
    if (p0) {
      session.onPointerDown(p0.x + p0.w / 2, p0.y + p0.h / 2);
      expect(
        session.getView().entities.find((e) => e.id === "cloche-plate")?.state
      ).toBe("selected");
    }
    expect(
      findDrawsOutsideStage(stage, (ctx) => session.render(ctx, rs, 100))
    ).toEqual([]);

    session.startFlash(100);
    expect(
      findDrawsOutsideStage(stage, (ctx) => session.render(ctx, rs, 300))
    ).toEqual([]);

    session.update(SAMPLE_LEVEL_3.difficulty_params.flash_ms + 50);
    session.onScaffoldEscalated(2, "timer");
    const slot0 = session.slots[0];
    if (slot0) {
      session.onPointerDown(slot0.x, slot0.y);
      expect(
        session.getView().entities.find((e) => e.slotIndex === 0)?.state
      ).toBe("selected");
      session.update(TOUCH_PULSE_MS + 10);
      session.setPointerOver(slot0.x, slot0.y);
      expect(
        session.getView().entities.find((e) => e.slotIndex === 0)?.state
      ).toBe("selected");
      session.setPointerOver(-100, -100);
    }
    expect(
      findDrawsOutsideStage(stage, (ctx) => session.render(ctx, rs, 2000))
    ).toEqual([]);
  });
});
