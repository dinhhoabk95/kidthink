import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it, vi } from "vitest";
import { getOptionCount } from "#src/generators/gt001";
import { DEFAULT_LOGIC_SPACE, deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";
import {
  GT001ContentSchema,
  validateGT001BandLimits,
} from "#src/templates/GT-001/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import {
  findDrawsOutsideStage,
  findHitPairViolations,
  findSlotsOutsideStage,
} from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return {
    ...actual,
    drawSceneBackground: vi.fn(),
  };
});

/**
 * `GT-001/template.ts` khai `input.tolerance_px: 24` — dung sai chạm hợp
 * đồng của cả 37 engine tap. `toAction()` phải dùng đúng số này, không phải
 * một hằng số khác tự chọn (Task #273 — chạm bị nuốt oan khi dung sai co lại).
 */
describe("GT-001 — dung sai chạm (BR-E001, tolerance_px hợp đồng)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }
  const { content, difficulty } = fixture;

  function buildSession(): GT001Session {
    const session = new GT001Session(content, difficulty, 1);
    session.prepareRound("4-5");
    return session;
  }

  it("chạm đúng tâm thẻ luôn trúng", () => {
    const session = buildSession();
    const slot = session.slots[0];
    if (!slot) {
      throw new Error("Thiếu slot đầu tiên");
    }

    const action = session.toAction({
      type: "tap",
      x: slot.x,
      y: slot.y,
      timeMs: 0,
    });

    expect(action).not.toBeNull();
  });

  it("chạm lệch tâm 68px theo chiều dọc (trong dung sai 24px) vẫn trúng", () => {
    const session = buildSession();
    const slot = session.slots[0];
    if (!slot) {
      throw new Error("Thiếu slot đầu tiên");
    }
    const radius = Math.min(slot.hitW, slot.hitH) / 2;

    // Lệch theo TRỤC DỌC (không lệch x) để không vô tình lại gần thẻ bên
    // cạnh — các thẻ nằm cùng hàng ngang. 68px = bán kính thẻ (52px) + 16px,
    // nằm trong dung sai 24px của hợp đồng nhưng NGOÀI dung sai 8px cũ.
    const offset = radius + 16;
    const action = session.toAction({
      type: "tap",
      x: slot.x,
      y: slot.y + offset,
      timeMs: 0,
    });

    expect(action).not.toBeNull();
  });

  it("chạm ra ngoài mọi thẻ, quá xa mọi dung sai, không trúng slot nào", () => {
    const session = buildSession();

    const action = session.toAction({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });

    expect(action).toBeNull();
  });

  it("chạm ra ngoài slot bị nuốt, Cấm — NEVER tính là chạm sai (BR-ETS-02)", () => {
    const session = buildSession();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });

    expect(verdict?.feedback).toBe("none");
    expect(verdict?.valid).toBe(false);
  });
});

/**
 * Chạm lại vào hình minh hoạ (thẻ đề giữa màn) phải đọc lại được từ khoá —
 * yêu cầu trực tiếp của người đặt việc (Task #273). Thẻ đề không phải một
 * lựa chọn để chấm đúng/sai, nên nó là một `ViewEntity` role `neutral`,
 * không nằm trong `this.slots` (danh sách chấm điểm).
 */
describe("GT-001 — chạm lại thẻ đề để nghe lại từ khoá (Task #273)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }
  const { content, difficulty } = fixture;

  function buildSession(): GT001Session {
    const session = new GT001Session(content, difficulty, 1);
    session.prepareRound("4-5");
    return session;
  }

  it("getView() có entity cho thẻ đề, role neutral, spokenLabel đúng từ khoá", () => {
    const session = buildSession();
    const view = session.getView();

    const targetEntity = view.entities.find((e) => e.role === "neutral");
    expect(targetEntity).toBeDefined();
    expect(targetEntity?.id).toBe(`prompt:${content.target_item.item_id}`);

    const expected =
      content.target_item.asset.kind === "emoji"
        ? getByGlyph(content.target_item.asset.ref)?.name
        : undefined;
    expect(targetEntity?.spokenLabel).toBe(expected);
  });

  it("id thẻ đề Cấm — NEVER trùng id lựa chọn, kể cả khi content dùng chung item_id (Task #274, E1)", () => {
    // Dạng của 2.976/2.976 vòng GT-001 trong DB (đo 2026-09-19): bộ sinh
    // level đặt `target_item.item_id` bằng đúng id của lựa chọn đúng.
    const correct = content.options.find((o) => o.is_correct);
    if (!correct) {
      throw new Error("Fixture thiếu lựa chọn đúng");
    }
    const session = new GT001Session(
      {
        ...content,
        target_item: { ...content.target_item, item_id: correct.item_id },
      },
      difficulty,
      1
    );
    session.prepareRound("4-5");

    const ids = session.getView().entities.map((e) => e.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(correct.item_id);
  });

  it("chạm vào thẻ đề Cấm — NEVER tính là lượt trả lời (nằm ngoài this.slots)", () => {
    const session = buildSession();
    const view = session.getView();
    const targetEntity = view.entities.find((e) => e.role === "neutral");
    if (!targetEntity) {
      throw new Error("Thiếu entity thẻ đề");
    }

    const action = session.toAction({
      type: "tap",
      x: targetEntity.x,
      y: targetEntity.y,
      timeMs: 0,
    });

    expect(action).toBeNull();
  });
});

/**
 * Từ khoá có mp3 riêng thì đọc bằng mp3 trước TTS (`play-narration.md` §7,
 * Task #274 S7b): `audio_path` tuỳ chọn trên asset `emoji`/`text`.
 */
describe("GT-001 — mp3 của từ khoá (Task #274 S7b)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }
  const KEYWORD_MP3 = "/audio/voice/fixture/qua-tao.mp3";

  it("hợp đồng nhận audio_path tuỳ chọn trên asset, từ chối chuỗi rỗng", () => {
    const withAudio = {
      ...fixture.content,
      target_item: {
        ...fixture.content.target_item,
        asset: { kind: "emoji", ref: "🍎", audio_path: KEYWORD_MP3 },
      },
    };
    expect(GT001ContentSchema.safeParse(withAudio).success).toBe(true);

    const emptyAudio = {
      ...withAudio,
      target_item: {
        ...withAudio.target_item,
        asset: { kind: "emoji", ref: "🍎", audio_path: "" },
      },
    };
    expect(GT001ContentSchema.safeParse(emptyAudio).success).toBe(false);
  });

  it("getView() mang spokenAudioPath của thẻ đề và của lựa chọn", () => {
    const session = new GT001Session(
      {
        ...fixture.content,
        target_item: {
          ...fixture.content.target_item,
          asset: { kind: "emoji", ref: "🍎", audio_path: KEYWORD_MP3 },
        },
      },
      fixture.difficulty,
      1
    );
    session.prepareRound("4-5");

    const promptCard = session
      .getView()
      .entities.find((e) => e.role === "neutral");
    expect(promptCard?.spokenAudioPath).toBe(KEYWORD_MP3);
    const options = session
      .getView()
      .entities.filter((e) => e.role !== "neutral");
    expect(options.every((e) => e.spokenAudioPath === undefined)).toBe(true);
  });
});

describe("GT-001 — vẽ nằm trọn trong zones.stage (BR-PSZ-01)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }

  it("mọi lệnh vẽ của session khi có stageRect đều nằm trong zones.stage", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    const zones = computeStageZones({
      logicW: 960,
      logicH: 540,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);

    const rs = new RenderSystem();
    const violations = findDrawsOutsideStage(zones.stage, (ctx) =>
      session.render(ctx, rs, 0)
    );
    expect(violations).toEqual([]);
  });

  it("ca âm: không truyền stageRect thì vẽ ra ngoài zones.stage (lời dẫn và thẻ đề cũ)", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    const zones = computeStageZones({
      logicW: 960,
      logicH: 540,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);

    const rs = new RenderSystem();
    const violations = findDrawsOutsideStage(zones.stage, (ctx) =>
      session.render(ctx, rs, 0)
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe("GT-001 — Business Rules (BR-E001-01..04)", () => {
  const baseFixture = GT001_FIXTURES[0];
  if (!baseFixture) {
    throw new Error("Fixture GT-001 not found");
  }

  it("BR-E001-01: enforces option and distractor caps per age band (3-4 <= 3, 4-5 <= 4, 5-6 <= 6)", () => {
    expect(getOptionCount("3-4", 0)).toBeLessThanOrEqual(3);
    expect(getOptionCount("3-4", 3)).toBeLessThanOrEqual(3);
    expect(getOptionCount("4-5", 0)).toBeLessThanOrEqual(4);
    expect(getOptionCount("4-5", 3)).toBeLessThanOrEqual(4);
    expect(getOptionCount("5-6", 3)).toBeLessThanOrEqual(6);

    expect(
      validateGT001BandLimits(
        baseFixture.content,
        baseFixture.difficulty,
        "3-4"
      )
    ).toBe(true);

    const fourOptionsContent = {
      ...baseFixture.content,
      options: [
        ...baseFixture.content.options,
        {
          item_id: "grape_opt",
          asset: { kind: "emoji" as const, ref: "🍇" },
          is_correct: false,
        },
      ],
    };
    const threeDistractorsDiff = {
      ...baseFixture.difficulty,
      distractor_count: 3,
    };

    expect(
      validateGT001BandLimits(fourOptionsContent, threeDistractorsDiff, "3-4")
    ).toBe(false);
    expect(
      validateGT001BandLimits(fourOptionsContent, threeDistractorsDiff, "4-5")
    ).toBe(true);
  });

  it("BR-E001-02: rejects compound two-criteria prompts in GT001ContentSchema", () => {
    const compoundPromptContent = {
      ...baseFixture.content,
      prompt: "Tìm quả táo màu đỏ và to nhất",
    };
    const parsed = GT001ContentSchema.safeParse(compoundPromptContent);
    expect(parsed.success).toBe(false);
  });

  it("BR-E001-03: rejects distractors that duplicate the correct option visual asset", () => {
    const ambiguousDistractorContent = {
      ...baseFixture.content,
      options: [
        {
          item_id: "apple_opt_1",
          asset: { kind: "emoji" as const, ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "apple_opt_2",
          asset: { kind: "emoji" as const, ref: "🍎" },
          is_correct: false,
        },
      ],
    };
    const parsed = GT001ContentSchema.safeParse(ambiguousDistractorContent);
    expect(parsed.success).toBe(false);
  });

  it("BR-E001-04: requires exactly 1 option with is_correct === true", () => {
    const zeroCorrect = {
      ...baseFixture.content,
      options: baseFixture.content.options.map((o) => ({
        ...o,
        is_correct: false,
      })),
    };
    const twoCorrect = {
      ...baseFixture.content,
      options: baseFixture.content.options.map((o) => ({
        ...o,
        is_correct: true,
      })),
    };

    expect(GT001ContentSchema.safeParse(zeroCorrect).success).toBe(false);
    expect(GT001ContentSchema.safeParse(twoCorrect).success).toBe(false);
    expect(GT001ContentSchema.safeParse(baseFixture.content).success).toBe(
      true
    );
  });
});

interface RecordedContext {
  readonly ctx: CanvasRenderingContext2D;
  readonly calls: string[];
  readonly maxShadowBlur: () => number;
}

function createRecordingContext(): RecordedContext {
  const fake = createFakeCanvas(960, 540);
  const rawCtx = fake.getContext("2d");
  if (!rawCtx) {
    throw new Error("Fake canvas missing 2d context");
  }
  const calls: string[] = [];
  let maxBlur = 0;

  const trackBlur = (): void => {
    if (rawCtx.shadowBlur > maxBlur) {
      maxBlur = rawCtx.shadowBlur;
    }
  };

  vi.spyOn(rawCtx, "arc").mockImplementation((x, y, r, s, e) => {
    trackBlur();
    calls.push(
      `arc(${x.toFixed(2)},${y.toFixed(2)},${r.toFixed(2)},${s.toFixed(2)},${e.toFixed(2)})`
    );
  });
  vi.spyOn(rawCtx, "roundRect").mockImplementation((x, y, w, h) => {
    trackBlur();
    calls.push(
      `roundRect(${x.toFixed(2)},${y.toFixed(2)},${w.toFixed(2)},${h.toFixed(2)})`
    );
  });
  vi.spyOn(rawCtx, "fill").mockImplementation(() => {
    trackBlur();
    calls.push(`fill(${String(rawCtx.fillStyle)})`);
  });
  vi.spyOn(rawCtx, "stroke").mockImplementation(() => {
    trackBlur();
    calls.push(
      `stroke(${String(rawCtx.strokeStyle)},${rawCtx.lineWidth.toFixed(1)})`
    );
  });
  vi.spyOn(rawCtx, "fillText").mockImplementation((t, x, y) => {
    trackBlur();
    calls.push(`fillText(${t},${x.toFixed(2)},${y.toFixed(2)})`);
  });

  return {
    ctx: rawCtx as CanvasRenderingContext2D,
    calls,
    maxShadowBlur: () => maxBlur,
  };
}

describe("GT-001 — Regression & UI/UX Contract (BUG-01..05)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }

  it("BUG-01: chạm lại đúng ô sai sau WRONG_FLASH_MS vẫn nháy hổ phách, xếp wood_tap và ghi event", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    session.commit({ type: "select_item", data: { item_id: "banana_opt" } });
    expect(session.getItemState("banana_opt")).toBe("wrong");
    expect(session.takeSfxCues()).toEqual(["wood_tap"]);

    session.update(WRONG_FLASH_MS);
    expect(session.getItemState("banana_opt")).toBe("idle");

    session.commit({ type: "select_item", data: { item_id: "banana_opt" } });
    expect(session.getItemState("banana_opt")).toBe("wrong");
    expect(session.takeSfxCues()).toEqual(["wood_tap"]);
    const selectedEvents = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "item_selected");
    expect(selectedEvents).toHaveLength(2);
  });

  it("BUG-01: chạm lại ô sai ngay khi đang nháy (< WRONG_FLASH_MS) làm mới đồng hồ nháy", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    session.commit({ type: "select_item", data: { item_id: "banana_opt" } });
    session.takeSfxCues();

    session.update(250);
    expect(session.getItemState("banana_opt")).toBe("wrong");

    session.commit({ type: "select_item", data: { item_id: "banana_opt" } });
    expect(session.takeSfxCues()).toEqual([]);

    session.update(WRONG_FLASH_MS - 1);
    expect(session.getItemState("banana_opt")).toBe("wrong");

    session.update(2);
    expect(session.getItemState("banana_opt")).toBe("idle");
  });

  it("BUG-01 ca âm: sau khi chọn đúng (isWon), chạm tiếp bị bỏ qua hoàn toàn", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    const correctSlot =
      session.slots[
        session.displayOptions.findIndex((o) => o.item_id === "apple_opt")
      ];
    const wrongSlot =
      session.slots[
        session.displayOptions.findIndex((o) => o.item_id === "banana_opt")
      ];
    if (!(correctSlot && wrongSlot)) {
      throw new Error("Thiếu slot");
    }

    session.dispatch({
      type: "tap",
      x: correctSlot.x,
      y: correctSlot.y,
      timeMs: 0,
    });
    expect(session.checkWinCondition()).toBe(true);
    session.takeSfxCues();

    const afterWin = session.dispatch({
      type: "tap",
      x: wrongSlot.x,
      y: wrongSlot.y,
      timeMs: 50,
    });
    expect(afterWin?.valid).toBe(false);
    expect(afterWin?.feedback).toBe("none");
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.getItemState("banana_opt")).toBe("idle");
  });

  it("BUG-02 (BR-ERC-02): render() thuần 100% — Object.entries(session) bất biến và gọi 60 lần cùng timeMs không làm tiêu biến hạt", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    session.commit({ type: "select_item", data: { item_id: "apple_opt" } });

    const rs = new RenderSystem();
    const beforeEntries = Object.entries(session).map(([k, v]) => [
      k,
      structuredClone(v),
    ]);
    const first = createRecordingContext();
    session.render(first.ctx, rs, 100);
    expect(Object.entries(session)).toEqual(beforeEntries);

    let lastCalls: string[] = [];
    for (let i = 0; i < 60; i++) {
      const rec = createRecordingContext();
      session.render(rec.ctx, rs, 100);
      lastCalls = rec.calls;
    }
    expect(lastCalls).toEqual(first.calls);
    expect(Object.entries(session)).toEqual(beforeEntries);

    session.update(1000);
    const afterUpdate = createRecordingContext();
    session.render(afterUpdate.ctx, rs, 1100);
    expect(afterUpdate.calls).not.toEqual(first.calls);
  });

  it("BUG-04: allow_retry: false đóng vòng khi chọn sai, tiết lộ đáp án đúng (selected) và khoá hint", () => {
    const session = new GT001Session(
      fixture.content,
      { ...fixture.difficulty, allow_retry: false },
      1
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    const wrongIdx = session.displayOptions.findIndex((o) => !o.is_correct);
    const correctIdx = session.displayOptions.findIndex((o) => o.is_correct);
    const wrongOpt = session.displayOptions[wrongIdx];
    const correctOpt = session.displayOptions[correctIdx];
    const correctSlot = session.slots[correctIdx];
    if (!(wrongOpt && correctOpt && correctSlot)) {
      throw new Error("Thiếu option");
    }

    session.commit({
      type: "select_item",
      data: { item_id: wrongOpt.item_id },
    });
    expect(session.getItemState(wrongOpt.item_id)).toBe("wrong");
    expect(session.getItemState(correctOpt.item_id)).toBe("selected");
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.getHintTargetIndex()).toBeNull();

    const nextVerdict = session.dispatch({
      type: "tap",
      x: correctSlot.x,
      y: correctSlot.y,
      timeMs: 100,
    });
    expect(nextVerdict?.valid).toBe(false);
    expect(nextVerdict?.feedback).toBe("none");
  });

  it("BUG-04: khi isWon === true thì getHintTargetIndex() trả null", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    expect(session.getHintTargetIndex()).not.toBeNull();
    session.commit({ type: "select_item", data: { item_id: "apple_opt" } });
    expect(session.getHintTargetIndex()).toBeNull();
  });

  it("BUG-05: setTouchingItem kích hoạt trạng thái vẽ touching (≥3 kênh), trả null về lại idle", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    const firstOpt = session.displayOptions[0];
    if (!firstOpt) {
      throw new Error("Thiếu option 0");
    }
    const rs = new RenderSystem();
    rs.reducedMotion = true;

    const idleRec = createRecordingContext();
    session.render(idleRec.ctx, rs, 0);

    session.setTouchingItem(firstOpt.item_id);
    const touchingRec = createRecordingContext();
    session.render(touchingRec.ctx, rs, 0);
    expect(touchingRec.calls).not.toEqual(idleRec.calls);

    session.setTouchingItem(null);
    const releasedRec = createRecordingContext();
    session.render(releasedRec.ctx, rs, 0);
    expect(releasedRec.calls).toEqual(idleRec.calls);
  });

  it("Spec §5 Nhánh 5: target_item có asset hỏng vẫn vẽ hộp giữ chỗ an toàn và không in mã lỗi ra canvas", () => {
    const brokenContent = {
      ...fixture.content,
      target_item: {
        item_id: "broken_target",
        asset: {
          id: "broken_target_asset",
          kind: "emoji" as const,
          ref: "EMJ-BROKEN-999",
        },
      },
    };
    const session = new GT001Session(brokenContent, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    const rs = new RenderSystem();
    const rec = createRecordingContext();

    expect(() => session.render(rec.ctx, rs, 0)).not.toThrow();
    const fillTexts = rec.calls.filter((c) => c.startsWith("fillText("));
    for (const call of fillTexts) {
      expect(call).not.toContain("EMJ-BROKEN-999");
      expect(call).not.toContain("broken_target");
    }
  });

  it("BUG-05: tôn trọng softShadowsEnabled = false, particles_enabled = false và reducedMotion = true", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    const rs = new RenderSystem();
    rs.softShadowsEnabled = false;
    rs.reducedMotion = true;
    const spyParticles = vi.spyOn(rs, "drawParticles");

    const idle100 = createRecordingContext();
    const idle750 = createRecordingContext();
    session.render(idle100.ctx, rs, 100);
    session.render(idle750.ctx, rs, 750);
    expect(idle100.maxShadowBlur()).toBe(0);
    expect(idle100.calls).toEqual(idle750.calls);

    session.commit({ type: "select_item", data: { item_id: "banana_opt" } });
    const wrong120 = createRecordingContext();
    const wrong300 = createRecordingContext();
    session.render(wrong120.ctx, rs, 120);
    session.render(wrong300.ctx, rs, 300);
    expect(wrong120.calls).toEqual(wrong300.calls);

    session.commit({ type: "select_item", data: { item_id: "apple_opt" } });
    const win320 = createRecordingContext();
    const win900 = createRecordingContext();
    session.render(win320.ctx, rs, 320);
    session.render(win900.ctx, rs, 900);
    expect(win320.calls).toEqual(win900.calls);
    expect(spyParticles).not.toHaveBeenCalled();
  });

  it("BUG-03: với 4 và 6 lựa chọn trên hộp play 360x640, mọi slot đạt sàn chạm, không chồng vùng hit và nằm trọn trong sân khấu", () => {
    const box = { w: 300, h: 493 };
    const space = deriveLogicSpace(box.w, box.h);
    const cssPerLogic = Math.min(box.w / space.w, box.h / space.h);
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: false,
    });

    for (const count of [4, 6]) {
      const options = Array.from({ length: count }, (_, idx) => ({
        item_id: `opt_${idx}`,
        asset: {
          kind: "emoji" as const,
          ref: ["🍎", "🍌", "🍊", "🍇", "🍓", "🍉"][idx] ?? "🍎",
        },
        is_correct: idx === 0,
      }));
      const session = new GT001Session(
        {
          ...fixture.content,
          options,
        },
        {
          ...fixture.difficulty,
          distractor_count: count - 1,
        },
        1
      );
      session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);

      expect(findHitPairViolations(session.slots)).toEqual([]);
      expect(findSlotsOutsideStage(session.slots, zones.stage)).toEqual([]);

      const card = session.getView().entities.find((e) => e.role === "neutral");
      expect(card).toBeDefined();
      if (card) {
        const cardBottom = card.y + card.h / 2;
        for (const s of session.slots) {
          expect(s.y - s.hitH / 2).toBeGreaterThanOrEqual(cardBottom);
        }
      }
    }
  });
});
