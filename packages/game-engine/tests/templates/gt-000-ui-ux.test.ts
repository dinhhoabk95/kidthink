import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { ACTION_CORRECT, ACTION_RETRY } from "#src/game-session";
import { deriveLogicSpace, resolveTouchFloor } from "#src/layout/constants";
import { resolveGT000FlashcardRect } from "#src/render/gt-000-shapes.js";
import { drawFlashcard } from "#src/render/index.js";
import { RenderSystem } from "#src/systems/render-system";
import { GT000_FIXTURES } from "#src/templates/GT-000/fixtures";
import { GT000Session } from "#src/templates/GT-000/session";
import type {
  GT000Content,
  GT000Difficulty,
} from "#src/templates/GT-000/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

const baseFixture = GT000_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Fixture GT-000 not found");
}

function isCanvas2D(
  ctx: Partial<CanvasRenderingContext2D> | null
): ctx is CanvasRenderingContext2D {
  return ctx !== null;
}

function createQuietSession(
  content: GT000Content = baseFixture.content,
  difficulty: GT000Difficulty = baseFixture.difficulty
): GT000Session {
  const session = new GT000Session(content, difficulty, 42);
  vi.spyOn(session.audio, "speakPrompt").mockImplementation((_text, onEnd) => {
    onEnd?.();
    return true;
  });
  vi.spyOn(session.audio, "playPromptAudio").mockImplementation((_r, onEnd) => {
    onEnd?.();
  });
  return session;
}

function makeRenderHarness(
  w = 960,
  h = 540,
  opts?: { reducedMotion?: boolean; softShadowsEnabled?: boolean }
): {
  ctx: CanvasRenderingContext2D;
  rs: RenderSystem;
  calls: { method: string; args: readonly (string | number)[] }[];
} {
  const calls: { method: string; args: readonly (string | number)[] }[] = [];
  const rawCtx = createFakeCanvas(w, h).getContext("2d");
  if (!isCanvas2D(rawCtx)) {
    throw new Error("2d context unavailable");
  }
  vi.spyOn(rawCtx, "fillRect").mockImplementation((x, y, rw, rh) => {
    calls.push({ method: "fillRect", args: [x, y, rw, rh] });
  });
  vi.spyOn(rawCtx, "roundRect").mockImplementation((x, y, rw, rh) => {
    calls.push({ method: "roundRect", args: [x, y, rw, rh] });
  });
  vi.spyOn(rawCtx, "arc").mockImplementation((x, y, r) => {
    calls.push({ method: "arc", args: [x, y, r] });
  });
  vi.spyOn(rawCtx, "quadraticCurveTo").mockImplementation(
    (cpx, cpy, tx, ty) => {
      calls.push({ method: "quadraticCurveTo", args: [cpx, cpy, tx, ty] });
    }
  );
  vi.spyOn(rawCtx, "fillText").mockImplementation((text, x, y) => {
    calls.push({ method: "fillText", args: [text, x, y] });
  });
  const rs = new RenderSystem();
  rs.logicSpace = { w, h };
  rs.reducedMotion = opts?.reducedMotion ?? false;
  rs.softShadowsEnabled = opts?.softShadowsEnabled ?? true;
  return { ctx: rawCtx, rs, calls };
}

describe("GT-000 — 7 Render Gates & Pure Render Contract (BR-ERC-02..09)", () => {
  it("BR-ERC-02: gọi render() 100 lần cùng timeMs giữ nguyên 100% state của session", () => {
    const session = createQuietSession();
    session.prepareRound("3-4");
    const { ctx, rs } = makeRenderHarness(960, 540);
    const beforeEntries = Object.entries(session);
    const beforeView = session.getView();
    const beforeEvents = session.getTelemetry().events.length;
    for (let i = 0; i < 100; i++) {
      session.render(ctx, rs, 1234);
    }
    expect(session.getView()).toEqual(beforeView);
    expect(session.getTelemetry().events.length).toBe(beforeEvents);
    expect(Object.entries(session)).toEqual(beforeEntries);
  });

  it("BR-ERC-04: sàn chạm 3 band tuổi + cssPerLogic luôn đạt chuẩn trên mọi bước", () => {
    for (const band of [
      "3-4",
      "4-5",
      "5-6",
    ] as const satisfies readonly AgeBand[]) {
      for (const ratio of [1, 0.55] as const) {
        const session = createQuietSession();
        session.cssPerLogic = ratio;
        session.prepareRound(band);
        while (
          session.steps[session.currentStepIndex]?.action !== "recognise"
        ) {
          session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
        }
        const floor = resolveTouchFloor(band, ratio);
        for (const slot of session.slots) {
          expect(slot.hitW).toBeGreaterThanOrEqual(floor);
          expect(slot.hitH).toBeGreaterThanOrEqual(floor);
        }
      }
    }
  });

  it("BR-ERC-07: asset image / text / emoji rỗng vẽ an toàn (có drawPlaceholderBox cho image), không throw và không để thẻ trống", () => {
    const customContent: GT000Content = {
      ...baseFixture.content,
      assets: [
        {
          asset_id: "img_broken",
          kind: "image",
          label: "Con mèo",
          image_ref: { kind: "image", path: "/missing/cat.png" },
          contrast_group: "animals",
        },
        {
          asset_id: "txt_word",
          kind: "word",
          label: "Quả cam",
          image_ref: { kind: "text", text: "CAM" },
          contrast_group: "fruits",
        },
        {
          asset_id: "emoji_empty",
          kind: "glyph",
          label: "Ngôi sao",
          glyph: " ",
          image_ref: { kind: "emoji", ref: "" },
          contrast_group: "shapes",
        },
      ],
      steps: [
        { action: "present", target_asset_id: "img_broken" },
        { action: "present", target_asset_id: "txt_word" },
        { action: "present", target_asset_id: "emoji_empty" },
        {
          action: "recall",
          target_asset_id: "img_broken",
          option_asset_ids: ["img_broken", "txt_word"],
        },
      ],
    };
    const session = createQuietSession(customContent);
    session.prepareRound("3-4");
    const { ctx, rs, calls } = makeRenderHarness(960, 540);
    for (let stepIdx = 0; stepIdx < 3; stepIdx++) {
      calls.length = 0;
      expect(() => session.render(ctx, rs, 300)).not.toThrow();
      if (stepIdx === 0) {
        expect(
          calls.filter((c) => c.method === "fillRect").length
        ).toBeGreaterThanOrEqual(2);
      }
      expect(
        calls.filter((c) => c.method === "fillText").length
      ).toBeGreaterThanOrEqual(3);
      session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    }
  });

  it("BR-ERC-09: degradation.particles_enabled = false tắt hạt; softShadowsEnabled = false tắt shadowBlur; reducedMotion = true tắt sóng âm động", () => {
    const session = createQuietSession(baseFixture.content, {
      ...baseFixture.difficulty,
      speak_along: "tap",
    });
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.prepareRound("3-4");
    while (session.steps[session.currentStepIndex]?.action !== "echo") {
      session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    }
    const { ctx, rs, calls } = makeRenderHarness(960, 540, {
      reducedMotion: true,
      softShadowsEnabled: false,
    });
    const shadowSpy = vi.spyOn(ctx, "shadowBlur", "set");
    session.update(200);
    session.render(ctx, rs, 200);
    const callsAt200 = JSON.stringify(calls);
    calls.length = 0;
    session.update(600);
    session.render(ctx, rs, 800);
    expect(JSON.stringify(calls)).toBe(callsAt200);
    expect(shadowSpy).not.toHaveBeenCalledWith(18);
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    const recStep = session.steps[session.currentStepIndex];
    const target = session
      .getView()
      .entities.find((e) => e.id === recStep?.target_asset_id);
    session.dispatch({
      type: "tap",
      x: target?.x ?? 0,
      y: target?.y ?? 0,
      timeMs: 900,
    });
    expect(session.particles).toHaveLength(0);
  });
});

describe("GT-000 — Đồng bộ hình học Flashcard, Tách biệt không đè hình & ViewEntity.role", () => {
  it("đồng bộ 100% kích thước Flashcard và không giao cắt giữa subPrompt, Flashcard (+34px sóng âm) và dải chấm tiến độ trên 960x540 & 540x960", () => {
    for (const [cssW, cssH] of [
      [960, 540],
      [540, 960],
    ] as const) {
      const space = deriveLogicSpace(cssW, cssH);
      const session = createQuietSession();
      session.setLogicSpace(space);
      session.prepareRound("3-4");
      const slot = session.slots[0];
      const entity = session.getView().entities[0];
      const asset = baseFixture.content.assets[0];
      if (!(slot && entity && asset)) {
        throw new Error("Missing slot, entity or asset");
      }
      const rect = resolveGT000FlashcardRect(space, slot);
      expect([entity.w, entity.h, entity.role]).toEqual([
        rect.w,
        rect.h,
        "neutral",
      ]);

      const subPromptBottom = 79.2 + space.h * 0.04;
      const cardEchoTop = rect.top - 34;
      const cardEchoBottom = rect.top + rect.h + 34;
      const progressDotsTop = space.h - 20 - 8.5;
      expect(cardEchoTop).toBeGreaterThan(subPromptBottom);
      expect(cardEchoBottom).toBeLessThan(progressDotsTop);

      expect(
        session.toAction({
          type: "tap",
          x: rect.x + rect.w / 2 - 2,
          y: rect.y,
          timeMs: 10,
        })
      ).toEqual({ type: "tap_item", data: { intent: "replay" } });
      expect(
        session.toAction({
          type: "tap",
          x: rect.x + rect.w / 2 + 30,
          y: rect.y,
          timeMs: 10,
        })
      ).toBeNull();
      const { ctx, rs, calls } = makeRenderHarness(space.w, space.h);
      drawFlashcard(ctx, rs, slot, asset);
      expect(
        calls.some(
          (c) =>
            c.method === "roundRect" &&
            c.args[2] === rect.w &&
            c.args[3] === rect.h
        )
      ).toBe(true);
    }
  });

  it("ViewEntity.role là 'neutral' ở present/echo và 'source' ở recognise/link/recall", () => {
    const linkContent: GT000Content = {
      ...baseFixture.content,
      steps: [
        { action: "present", target_asset_id: "num_1" },
        { action: "echo", target_asset_id: "num_1", repeat_count: 1 },
        {
          action: "recognise",
          target_asset_id: "num_1",
          distractor_asset_ids: ["num_2"],
        },
        { action: "link", source_asset_id: "num_1", target_asset_id: "num_2" },
        {
          action: "recall",
          target_asset_id: "num_1",
          option_asset_ids: ["num_1", "num_2"],
        },
      ],
    };
    const session = createQuietSession(linkContent);
    session.prepareRound("3-4");
    const assertRole = (role: "neutral" | "source"): void => {
      expect(session.getView().entities.every((e) => e.role === role)).toBe(
        true
      );
    };
    assertRole("neutral");
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    assertRole("neutral");
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    assertRole("source");
    const recTarget = session.getView().entities.find((e) => e.id === "num_1");
    session.dispatch({
      type: "tap",
      x: recTarget?.x ?? 0,
      y: recTarget?.y ?? 0,
      timeMs: 0,
    });
    assertRole("source");
    session.commit({
      type: "tap_item",
      data: { source_id: "num_1", target_id: "num_2" },
    });
    assertRole("source");
  });
});

describe("GT-000 — Audio Fallback, PointerHover (x, y) & Bước Link", () => {
  it("audio_path lỗi ở present, echo và replayTargetThenAsk đều rơi xuống TTS speakPrompt, không treo cổng và không gọi đúp ask()", () => {
    const audioContent: GT000Content = {
      ...baseFixture.content,
      assets: baseFixture.content.assets.map((a) => ({
        ...a,
        audio_path: `/audio/${a.asset_id}.mp3`,
      })),
      steps: [
        { action: "present", target_asset_id: "num_1" },
        { action: "echo", target_asset_id: "num_1", repeat_count: 1 },
        {
          action: "recognise",
          target_asset_id: "num_1",
          distractor_asset_ids: ["num_2"],
          prompt_line: "Chỉ cho cô số một!",
        },
        {
          action: "recall",
          target_asset_id: "num_1",
          option_asset_ids: ["num_1", "num_2"],
        },
      ],
    };
    const session = new GT000Session(audioContent, baseFixture.difficulty);
    const spokenTexts: string[] = [];
    vi.spyOn(session.audio, "playPromptAudio").mockImplementation(
      (_ref, onEnd, onError) => {
        onError?.();
        onEnd?.();
      }
    );
    vi.spyOn(session.audio, "speakPrompt").mockImplementation((text, onEnd) => {
      spokenTexts.push(text);
      onEnd?.();
      return true;
    });

    session.prepareRound("3-4");
    expect([spokenTexts.length, session.lastTtsUsed]).toEqual([1, true]);

    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    expect([spokenTexts.length, session.lastTtsUsed]).toEqual([2, true]);

    spokenTexts.length = 0;
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    expect(spokenTexts).toEqual(["Chỉ cho cô số một!"]);

    spokenTexts.length = 0;
    const wrongEntity = session
      .getView()
      .entities.find((e) => e.id === "num_2");
    session.dispatch({
      type: "tap",
      x: wrongEntity?.x ?? 0,
      y: wrongEntity?.y ?? 0,
      timeMs: 10,
    });
    expect(spokenTexts).toHaveLength(2);
    expect(spokenTexts[0]).toContain("số một");
    expect(spokenTexts[1]).toBe("Chỉ cho cô số một!");
    expect(session.isAcceptingInput()).toBe(true);
  });

  it("setPointerOver(x, y), clearPointerOver(), dây nối link bám toạ độ kéo và chạm nhầm nhiều lần không bao giờ wrong", () => {
    const linkContent: GT000Content = {
      ...baseFixture.content,
      steps: [
        { action: "present", target_asset_id: "num_1" },
        {
          action: "link",
          source_asset_id: "num_1",
          target_asset_id: "num_2",
          prompt_line: "Nối hai thẻ nhé!",
        },
        {
          action: "recall",
          target_asset_id: "num_1",
          option_asset_ids: ["num_1", "num_2"],
        },
      ],
    };
    const session = createQuietSession(linkContent);
    session.prepareRound("3-4");
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    const entities = session.getView().entities;
    const sourceIdx = entities.findIndex((e) => e.id === "num_1");
    const targetIdx = entities.findIndex((e) => e.id === "num_2");
    const sourceEnt = entities[sourceIdx];
    const targetEnt = entities[targetIdx];
    if (!(sourceEnt && targetEnt)) {
      throw new Error("Missing link entities");
    }
    expect([
      session.getHintTargetIndex(),
      session.getHintDestinationIndex(),
    ]).toEqual([sourceIdx, targetIdx]);

    const { ctx, rs, calls } = makeRenderHarness(960, 540);
    session.render(ctx, rs, 100);
    const idleArcs = calls.filter((c) => c.method === "arc").length;

    calls.length = 0;
    session.setPointerOver(sourceEnt.x, sourceEnt.y);
    session.render(ctx, rs, 100);
    const touchingArcs = calls.filter((c) => c.method === "arc").length;
    expect(touchingArcs).toBeGreaterThan(idleArcs);

    calls.length = 0;
    session.setPointerOver(-100, -100);
    session.render(ctx, rs, 100);
    expect(calls.filter((c) => c.method === "arc").length).toBe(idleArcs);

    session.dispatch({
      type: "tap",
      x: sourceEnt.x,
      y: sourceEnt.y,
      timeMs: 10,
    });
    expect([session.selectedAssetId, session.getHintTargetIndex()]).toEqual([
      "num_1",
      targetIdx,
    ]);

    calls.length = 0;
    session.setPointerOver(512, 333);
    session.render(ctx, rs, 120);
    expect(
      calls.some(
        (c) =>
          c.method === "quadraticCurveTo" &&
          c.args[2] === 512 &&
          c.args[3] === 333
      )
    ).toBe(true);
    session.clearPointerOver();

    const dropGesture = {
      type: "drop" as const,
      fromX: sourceEnt.x,
      fromY: sourceEnt.y,
      toX: targetEnt.x,
      toY: targetEnt.y,
      timeMs: 20,
    };
    expect(session.toAction(dropGesture)).toEqual({
      type: "tap_item",
      data: {
        source_id: "num_1",
        target_id: "num_2",
        item_id: "num_2",
        asset_id: "num_2",
      },
    });
    expect(session.selectedAssetId).toBe("num_1");
    const badAction = {
      type: "tap_item",
      data: { source_id: "num_1", target_id: "num_3" },
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      expect(session.validateAction(badAction)).toEqual(ACTION_RETRY);
      session.commit(badAction);
      expect(
        session.getView().entities.every((e) => e.state !== "incorrect")
      ).toBe(true);
    }
    expect(session.dispatch(dropGesture)).toEqual(ACTION_CORRECT);
    expect([session.selectedAssetId, session.currentStepIndex]).toEqual([
      null,
      2,
    ]);
  });
});
