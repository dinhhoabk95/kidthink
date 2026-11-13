import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { SAMPLE_LEVEL_1, SAMPLE_LEVEL_3 } from "#src/templates/GT-010/fixtures";
import { SubstitutionSession } from "#src/templates/GT-010/session";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

function buildSession(seed = 0, allowRetry = true): SubstitutionSession {
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "4-5",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: false,
  });
  const session = new SubstitutionSession(
    SAMPLE_LEVEL_1.content_pack,
    { ...SAMPLE_LEVEL_1.difficulty_params, allow_retry: allowRetry },
    seed
  );
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);
  return session;
}

describe("GT-010 — render() thuần 100% (BR-ERC-02) và đồng hồ đơn gốc logicClockMs", () => {
  it("gọi render() với timeMs = 999_999 không xóa wrongFlash hay selectedValue; chỉ update(deltaMs) mới đẩy đồng hồ", () => {
    const session = buildSession();
    const wrongIdx = session.getOptions().findIndex((o) => !o.is_correct);
    const wrongOpt = session.getOptions()[wrongIdx];
    if (!wrongOpt) {
      throw new Error("Missing wrong option");
    }

    session.selectValue(wrongOpt.value);
    expect(session.getSelectedValue()).toBe(wrongOpt.value);

    const rs = new RenderSystem();
    const stageBox = {
      x: 0,
      y: 0,
      w: DEFAULT_LOGIC_SPACE.w,
      h: DEFAULT_LOGIC_SPACE.h,
    };
    findDrawsOutsideStage(stageBox, (ctx) => {
      session.render(ctx, rs, 999_999);
    });

    expect(session.getSelectedValue()).toBe(wrongOpt.value);
    const optEntity = session
      .getView()
      .entities.find((e) => e.id === `opt-${wrongIdx}`);
    expect(optEntity?.state).toBe("incorrect");

    session.update(WRONG_FLASH_MS + 20);
    expect(session.getSelectedValue()).toBeNull();
    const afterEntity = session
      .getView()
      .entities.find((e) => e.id === `opt-${wrongIdx}`);
    expect(afterEntity?.state).toBe("idle");
  });

  it("re-tap liên tiếp vào cùng phương án sai vẫn kích lại nhịp hổ phách wrongFlash", () => {
    const session = buildSession();
    const wrongIdx = session.getOptions().findIndex((o) => !o.is_correct);
    const wrongOpt = session.getOptions()[wrongIdx];
    if (!wrongOpt) {
      throw new Error("Missing wrong option");
    }

    session.selectValue(wrongOpt.value);
    session.update(WRONG_FLASH_MS - 100);
    expect(
      session.getView().entities.find((e) => e.id === `opt-${wrongIdx}`)?.state
    ).toBe("incorrect");

    // Chạm lại chính phương án sai đó -> nạp lại trọn vẹn nhịp WRONG_FLASH_MS
    session.selectValue(wrongOpt.value);
    session.update(300);
    expect(
      session.getView().entities.find((e) => e.id === `opt-${wrongIdx}`)?.state
    ).toBe("incorrect");

    session.update(WRONG_FLASH_MS);
    expect(
      session.getView().entities.find((e) => e.id === `opt-${wrongIdx}`)?.state
    ).toBe("idle");
  });
});

describe("GT-010 — allow_retry: false, layoutSeed shuffle, question-row & thang gợi ý L1/L2/L3", () => {
  it("allow_retry: false đóng lượt ngay sau 1 lần chọn sai và khóa mọi thao tác kế tiếp", () => {
    const session = buildSession(0, false);
    const wrongOpt = session.getOptions().find((o) => !o.is_correct);
    const correctOpt = session.getOptions().find((o) => o.is_correct);
    const correctIdx = session.getOptions().findIndex((o) => o.is_correct);
    const correctSlot =
      session.slots[session.getEquations().length + 1 + correctIdx];
    if (!(wrongOpt && correctOpt && correctSlot)) {
      throw new Error("Missing options or slot");
    }

    expect(session.selectValue(wrongOpt.value)).toBe(false);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTargetForLevel(1)).toBeNull();
    expect(session.getHintTargetForLevel(3)).toBeNull();

    const ignored = session.dispatch({
      type: "tap",
      x: correctSlot.x,
      y: correctSlot.y,
      timeMs: 20,
    });
    expect(ignored?.feedback).toBe("none");
    expect(ignored?.valid).toBe(false);
    expect(session.checkWinCondition()).toBe(false);

    // Render trạng thái đóng lượt (tự thay ký hiệu một lượt) nằm gọn trong stageRect
    const rs = new RenderSystem();
    const out = findDrawsOutsideStage(
      session.stageRect ?? { x: 0, y: 0, w: 960, h: 540 },
      (ctx) => session.render(ctx, rs, 120)
    );
    expect(out).toEqual([]);
  });

  it("layoutSeed !== 0 xáo trộn tất định displayOptions khác thứ tự gốc (layoutSeed === 0 giữ nguyên)", () => {
    const s0 = buildSession(0);
    const s1 = buildSession(7);
    const s1Repeat = buildSession(7);

    const origValues = SAMPLE_LEVEL_1.content_pack.options.map((o) => o.value);
    expect(s0.getOptions().map((o) => o.value)).toEqual(origValues);

    const shuffledValues = s1.getOptions().map((o) => o.value);
    expect(shuffledValues).toEqual(s1Repeat.getOptions().map((o) => o.value));
    expect(shuffledValues).not.toEqual(origValues);

    // Bấm vào slot của phương án đúng ở vị trí mới vẫn thắng chuẩn
    const correctIdx = s1.getOptions().findIndex((o) => o.is_correct);
    const correctEntity = s1
      .getView()
      .entities.find((e) => e.id === `opt-${correctIdx}`);
    if (!correctEntity) {
      throw new Error("Missing correct option entity");
    }
    const res = s1.dispatch({
      type: "tap",
      x: correctEntity.x,
      y: correctEntity.y,
      timeMs: 10,
    });
    expect(res?.valid).toBe(true);
    expect(s1.checkWinCondition()).toBe(true);
  });

  it("getView() chứa question-row chuẩn hình học chạm; L1/L2/L3 khớp entities thật", () => {
    const session = buildSession(0);
    const view = session.getView();
    const entityIds = new Set(view.entities.map((e) => e.id));

    const qRow = view.entities.find((e) => e.id === "question-row");
    expect(qRow).toBeDefined();
    expect(qRow?.role).toBe("neutral");
    expect(qRow?.hitShape).toBe("square");
    expect(qRow?.spokenLabel).toContain("bằng mấy");

    for (const entity of view.entities) {
      const slot = session.slots[entity.slotIndex ?? -1];
      if (slot) {
        expect(entity.w).toBeGreaterThanOrEqual(slot.hitW);
        expect(entity.h).toBeGreaterThanOrEqual(slot.hitH);
      }
      expect(entity.hitShape).toBe(
        entity.role === "source" ? "circle" : "square"
      );
    }

    // Chạm vào question-row không sinh action chấm điểm
    if (!qRow) {
      throw new Error("Missing question-row");
    }
    expect(
      session.toAction({ type: "tap", x: qRow.x, y: qRow.y, timeMs: 5 })
    ).toBeNull();

    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);
    expect(l1?.kind).toBe("region");
    expect(l2?.kind).toBe("region");
    expect(l3?.kind).toBe("slot");
    if (l1?.kind === "region") {
      for (const id of l1.ids) {
        expect(entityIds.has(id)).toBe(true);
      }
    }
    if (l2?.kind === "region") {
      expect(l2.ids).toContain("question-row");
      for (const id of l2.ids) {
        expect(entityIds.has(id)).toBe(true);
      }
    }
    if (l3?.kind === "slot") {
      expect(l3.index).toBe(session.getHintTargetIndex());
    }
  });

  it("reducedMotion, degradation.particles_enabled = false, touching/hover và cầu sáng L2 render sạch trong stageRect", () => {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "5-6",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    const session = new SubstitutionSession(
      SAMPLE_LEVEL_3.content_pack,
      SAMPLE_LEVEL_3.difficulty_params,
      2
    );
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, zones.stage);

    const firstSlot = session.slots[0];
    if (!firstSlot) {
      throw new Error("Missing first slot");
    }
    session.setTouchingSlot(0);
    expect(session.getTouchingSlot()).toBe(0);
    session.setPointerOver(firstSlot.x, firstSlot.y);
    expect(session.getHoveredSlot()).toBe(0);
    session.onScaffoldEscalated(2, "timer");

    const rs = new RenderSystem();
    rs.reducedMotion = true;
    const drawParticlesSpy = vi.spyOn(rs, "drawParticles");

    const out = findDrawsOutsideStage(zones.stage, (ctx) => {
      session.render(ctx, rs, 250);
    });
    expect(out).toEqual([]);
    expect(drawParticlesSpy).not.toHaveBeenCalled();

    session.onHintCleared();
    session.clearPointerOver();
    expect(session.getTouchingSlot()).toBeNull();
    expect(session.getHoveredSlot()).toBeNull();
  });
});
