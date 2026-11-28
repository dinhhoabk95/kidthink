import { describe, expect, it } from "vitest";
import { ACTION_IGNORED, ACTION_RETRY } from "#src/game-session";
import { GT019Generator } from "#src/generators/gt019";
import type { ThemeVocabulary } from "#src/generators/types";
import { touchFloorOf } from "#src/layout/touch-floor";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures";
import {
  getGT019Clock,
  resolveGT019VisualTransform,
} from "#src/templates/GT-019/layout";
import { GT019Session } from "#src/templates/GT-019/session";
import type {
  GT019Content,
  GT019Difficulty,
} from "#src/templates/GT-019/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { solveWithWebGestures } from "#tests/gates/web-gesture-solver";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";
import {
  canvasBoxOf,
  placeRound,
  SHELL_VIEWPORTS,
} from "#tests/layout/helpers/shell-frame";

const ANGLE_SPEECH = /\d+\s*độ/;

type GT019Piece = GT019Content["pieces"][number];

const TWO_PIECE_CONTENT: GT019Content = {
  prompt: "Bé hãy xoay và lật mảnh ghép cho khớp bóng trên tường nhé!",
  target_slots: [
    {
      slot_id: "slot-hand",
      target_rotation: 180,
      target_flip: "horizontal",
      asset: { kind: "emoji", ref: "✋" },
    },
    {
      slot_id: "slot-star",
      target_rotation: 270,
      target_flip: "none",
      asset: { kind: "emoji", ref: "⭐" },
    },
  ],
  pieces: [
    {
      piece_id: "piece-hand",
      initial_rotation: 0,
      initial_flip: "none",
      target_slot_id: "slot-hand",
      asset: { kind: "emoji", ref: "✋" },
    },
    {
      piece_id: "piece-star",
      initial_rotation: 90,
      initial_flip: "none",
      target_slot_id: "slot-star",
      asset: { kind: "emoji", ref: "⭐" },
    },
  ],
};

const FLIP_DIFFICULTY: GT019Difficulty = {
  allow_flip: true,
  rotation_step: 90,
  hint_after_ms: 8000,
  allow_retry: true,
};

const SAMPLE_VOCAB: ThemeVocabulary = {
  theme: "home",
  nouns: [
    { emoji_ref: "🏠", label_vi: "ngôi nhà" },
    { emoji_ref: "🔑", label_vi: "chìa khoá" },
    { emoji_ref: "🪑", label_vi: "cái ghế" },
    { emoji_ref: "🧸", label_vi: "gấu bông" },
    { emoji_ref: "⏰", label_vi: "đồng hồ" },
    { emoji_ref: "🔦", label_vi: "đèn pin" },
  ],
};

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function renderSessionFrame(
  session: GT019Session,
  opts: { reducedMotion?: boolean; timeMs?: number } = {}
): void {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Không lấy được context 2D");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = opts.reducedMotion ?? false;
  session.render(ctx, rs, opts.timeMs ?? 0);
}

describe("GT-019 Rotate Transform — Kiến trúc mới & Thang trợ giúp", () => {
  it("0. Giải thắng trọn vẹn cả 3 fixtures (#0, #1, #2) qua solveWithWebGestures", async () => {
    for (const [index, fixture] of GT019_FIXTURES.entries()) {
      const outcome = await solveWithWebGestures("GT-019", fixture, index);
      expect(outcome).toBe("won");
    }
  });

  it("1. Xáo trộn tất định theo layoutSeed: seed=0 giữ nguyên, seed!=0 đổi góc/thứ tự và không mở màn khớp sẵn", () => {
    const f1 = GT019_FIXTURES[1];
    if (!f1) {
      throw new Error("Thiếu fixture #1");
    }
    const s0 = new GT019Session(f1.content, f1.difficulty, 0);
    s0.prepareRound("4-5");
    const v0 = s0.getView().entities.filter((e) => e.role === "source");
    expect(v0[0]?.id).toBe("piece-triangle");
    expect(s0.getPieceTransform("piece-triangle")?.rotation).toBe(270);

    const seenSignatures = new Set<string>();
    for (let seed = 1; seed <= 8; seed++) {
      const s = new GT019Session(f1.content, f1.difficulty, seed);
      s.prepareRound("4-5");
      const sources = s.getView().entities.filter((e) => e.role === "source");
      const sig = sources
        .map((e) => `${e.id}:${s.getPieceTransform(e.id)?.rotation}`)
        .join("|");
      seenSignatures.add(sig);
      for (const piece of f1.content.pieces) {
        const target = f1.content.target_slots.find(
          (t) => t.slot_id === piece.target_slot_id
        );
        const tf = s.getPieceTransform(piece.piece_id);
        expect(tf?.rotation).not.toBe(target?.target_rotation);
      }
    }
    expect(seenSignatures.size).toBeGreaterThan(1);

    const replaySession = new GT019Session(f1.content, f1.difficulty, 7);
    replaySession.prepareRound("4-5");
    const r1Rot = replaySession.getPieceTransform("piece-triangle")?.rotation;
    replaySession.prepareRound("4-5");
    const r2Rot = replaySession.getPieceTransform("piece-triangle")?.rotation;
    expect(r2Rot).not.toBe(r1Rot);
  });

  it("2. Thang gợi ý L1 / L2 / L3 và chuỗi bàn tay ma getHintDemoSequence(3)", () => {
    const session = new GT019Session(TWO_PIECE_CONTENT, FLIP_DIFFICULTY, 0);
    session.prepareRound("5-6");

    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["slot-hand"],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["piece-hand", "slot-hand"],
    });

    const p1Slot = session.sourceSlots[0];
    const flipSlot = session.sourceSlots[2];
    const s1Slot = session.targetSlots[0];
    const p1Idx = p1Slot ? session.slots.indexOf(p1Slot) : -1;
    const flipIdx = flipSlot ? session.slots.indexOf(flipSlot) : -1;
    const s1Idx = s1Slot ? session.slots.indexOf(s1Slot) : -1;

    expect(session.getHintTargetIndex()).toBe(flipIdx);
    expect(session.getHintDestinationIndex()).toBeNull();
    expect(session.getHintDemoSequence(1)).toBeNull();
    expect(session.getHintDemoSequence(2)).toBeNull();

    const seqBefore = session.getHintDemoSequence(3);
    expect(seqBefore).not.toBeNull();
    expect(seqBefore?.length).toBeGreaterThanOrEqual(3);
    expect(seqBefore?.[0]).toEqual({ from: flipIdx });
    expect(seqBefore?.[seqBefore.length - 1]).toEqual({
      from: p1Idx,
      to: s1Idx,
    });

    session.onFlipPiece("piece-hand", "horizontal");
    expect(session.getHintTargetIndex()).toBe(p1Idx);
    session.onRotatePiece("piece-hand", "cw");
    session.onRotatePiece("piece-hand", "cw");

    expect(session.getHintDestinationIndex()).toBe(s1Idx);
    expect(session.getHintDemoSequence(3)).toBeNull();
  });

  it("3. Thực thi allow_retry = false: thả sai đóng vòng, chặn input và tự xoay minh hoạ", () => {
    const strictDiff: GT019Difficulty = {
      ...FLIP_DIFFICULTY,
      allow_retry: false,
    };
    const session = new GT019Session(TWO_PIECE_CONTENT, strictDiff, 0);
    session.prepareRound("5-6");

    const wrongRes = session.onPlacePiece("piece-hand", "slot-hand");
    expect(wrongRes).toBe(ACTION_RETRY);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTargetForLevel(1)).toBeNull();
    expect(session.getHintDemoSequence(3)).toBeNull();

    const p1Slot = session.sourceSlots[0];
    expect(
      session.toAction({
        type: "tap",
        x: p1Slot?.x ?? 100,
        y: p1Slot?.y ?? 100,
        timeMs: 10,
      })
    ).toBeNull();
    expect(
      session.validateAction({
        type: "rotate_piece",
        data: { piece_id: "piece-hand" },
      })
    ).toBe(ACTION_IGNORED);

    session.update(450);
    renderSessionFrame(session, { timeMs: 450 });
    session.update(450);
    renderSessionFrame(session, { timeMs: 900 });
    renderSessionFrame(session, { reducedMotion: true, timeMs: 900 });

    const retrySession = new GT019Session(
      TWO_PIECE_CONTENT,
      FLIP_DIFFICULTY,
      0
    );
    retrySession.prepareRound("5-6");
    expect(retrySession.onPlacePiece("piece-hand", "slot-star")).toBe(
      ACTION_RETRY
    );
    expect(retrySession.mascotMood()).toBe("wonder");
    expect(retrySession.getPieceTransform("piece-hand")?.rotation).toBe(0);
    retrySession.update(200);
    expect(retrySession.onPlacePiece("piece-hand", "slot-star")).toBe(
      ACTION_RETRY
    );
    expect(retrySession.mascotMood()).toBe("wonder");
    expect(retrySession.getPieceTransform("piece-hand")?.rotation).toBe(0);
    const retryClock = getGT019Clock(retrySession);
    expect(
      retryClock.pieceWrongFlashes.isActive("piece-hand", retryClock.logicMs)
    ).toBe(true);
    expect(
      retryClock.slotWrongFlashes.isActive("slot-star", retryClock.logicMs)
    ).toBe(true);
  });

  it("4. Nội suy mượt góc xoay & lật gương 3D theo update(deltaMs) và render() thuần 100%", () => {
    const session = new GT019Session(TWO_PIECE_CONTENT, FLIP_DIFFICULTY, 0);
    session.prepareRound("5-6");

    session.update(9000);
    session.onRotatePiece("piece-hand", "cw");
    session.onFlipPiece("piece-hand", "horizontal");

    session.update(110);
    const mid = resolveGT019VisualTransform(
      session,
      "piece-hand",
      { rotation: 90, flip: "horizontal" },
      false
    );
    expect(mid.visualRotDeg).toBeGreaterThan(10);
    expect(mid.visualRotDeg).toBeLessThan(89);
    expect(Math.abs(mid.flipScaleX)).toBeLessThan(0.25);

    session.onRotatePiece("piece-hand", "cw");
    const chained = resolveGT019VisualTransform(
      session,
      "piece-hand",
      { rotation: 180, flip: "horizontal" },
      false
    );
    expect(Math.abs(chained.visualRotDeg - mid.visualRotDeg)).toBeLessThan(1);

    const instant = resolveGT019VisualTransform(
      session,
      "piece-hand",
      { rotation: 180, flip: "horizontal" },
      true
    );
    expect(instant.visualRotDeg).toBe(180);
    expect(instant.flipScaleX).toBe(-1);

    session.update(250);
    const settled = resolveGT019VisualTransform(
      session,
      "piece-hand",
      { rotation: 180, flip: "horizontal" },
      false
    );
    expect(settled.visualRotDeg).toBe(180);
    expect(settled.flipScaleX).toBe(-1);

    session.onPlacePiece("piece-star", "slot-hand");
    const clock = getGT019Clock(session);
    expect(clock.pieceWrongFlashes.isActive("piece-star", clock.logicMs)).toBe(
      true
    );

    const beforeEntries = JSON.stringify(Object.entries(session));
    for (let f = 0; f < 100; f++) {
      renderSessionFrame(session, { timeMs: 50_000 + f * 16.67 });
    }
    const afterEntries = JSON.stringify(Object.entries(session));
    expect(afterEntries).toBe(beforeEntries);
    expect(clock.pieceWrongFlashes.isActive("piece-star", clock.logicMs)).toBe(
      true
    );

    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: true,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.onPlacePiece("piece-hand", "slot-hand");
    expect(clock.placedAt.get("slot-hand")?.anchorMs).toBeNull();
    renderSessionFrame(session, { timeMs: 50_000 });
    expect(clock.placedAt.get("slot-hand")?.anchorMs).toBe(50_000);
    renderSessionFrame(session, { timeMs: 50_225 });
    renderSessionFrame(session, { timeMs: 50_500 });
  });

  it("5. Tương tác hover setPointerOver / clearPointerOver và chuẩn getView() không chứa chữ", () => {
    const session = new GT019Session(TWO_PIECE_CONTENT, FLIP_DIFFICULTY, 0);
    session.prepareRound("5-6");

    const p1Slot = session.sourceSlots[0];
    const flipSlot = session.sourceSlots[2];
    session.setPointerOver(p1Slot?.x ?? 0, p1Slot?.y ?? 0);
    expect(
      session.getView().entities.find((e) => e.id === "piece-hand")?.state
    ).toBe("active");
    renderSessionFrame(session, { timeMs: 100 });

    session.setPointerOver({ x: flipSlot?.x ?? 0, y: flipSlot?.y ?? 0 });
    expect(
      session.getView().entities.find((e) => e.id === "btn_flip")?.state
    ).toBe("active");
    renderSessionFrame(session, { timeMs: 120 });

    session.clearPointerOver();
    expect(
      session.getView().entities.find((e) => e.id === "btn_flip")?.state
    ).toBe("idle");

    expect(lettersOnly(collectRenderedText(session))).toEqual([]);

    for (const ent of session.getView().entities) {
      expect(ent.label).toBeUndefined();
      expect(ent.spokenLabel?.length).toBeGreaterThan(3);
      if (ent.role === "source" || ent.id === "btn_flip") {
        expect(ent.hitShape).toBe("circle");
      }
    }
  });

  it("6. Type-safe commit() & validateAction() từ chối an toàn các payload sai kiểu", () => {
    const session = new GT019Session(TWO_PIECE_CONTENT, FLIP_DIFFICULTY, 0);
    session.prepareRound("5-6");

    expect(
      session.validateAction({ type: "rotate_piece", data: { piece_id: 99 } })
    ).toBe(ACTION_IGNORED);
    expect(
      session.validateAction({ type: "flip_piece", data: "invalid" })
    ).toBe(ACTION_IGNORED);
    expect(
      session.validateAction({
        type: "place_item",
        data: { piece_id: "piece-hand" },
      })
    ).toBe(ACTION_IGNORED);
    expect(session.validateAction({ type: "unknown_action", data: {} })).toBe(
      ACTION_IGNORED
    );

    session.commit({ type: "rotate_piece", data: { piece_id: 99 } });
    session.commit({ type: "flip_piece", data: null });
    session.commit({ type: "place_item", data: {} });
    expect(session.getPieceTransform("piece-hand")?.rotation).toBe(0);
  });

  it("7. Generator GT019Generator sinh bài tất định theo age_band và không bật allow_flip cho emoji danh từ", () => {
    const lvl45A = GT019Generator.generate({
      rng: createRng(42),
      age_band: "4-5",
      theme: "home",
      vocabulary: SAMPLE_VOCAB,
    });
    const lvl45B = GT019Generator.generate({
      rng: createRng(42),
      age_band: "4-5",
      theme: "home",
      vocabulary: SAMPLE_VOCAB,
    });
    expect(lvl45A).toEqual(lvl45B);
    expect(lvl45A.difficulty_params.allow_flip).toBe(false);
    expect(lvl45A.content_pack.pieces.length).toBeGreaterThanOrEqual(1);
    expect(lvl45A.content_pack.pieces.length).toBeLessThanOrEqual(2);

    const targetRotations = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) {
      const lvl56 = GT019Generator.generate({
        rng: createRng(seed),
        age_band: "5-6",
        theme: "home",
        vocabulary: SAMPLE_VOCAB,
      });
      expect(lvl56.difficulty_params.allow_flip).toBe(false);
      expect(lvl56.content_pack.pieces.length).toBeGreaterThanOrEqual(2);
      expect(lvl56.content_pack.pieces.length).toBeLessThanOrEqual(3);
      for (const slot of lvl56.content_pack.target_slots) {
        expect(slot.target_flip).toBe("none");
        targetRotations.add(slot.target_rotation ?? 0);
      }
      for (const piece of lvl56.content_pack.pieces) {
        expect(piece.initial_flip).toBe("none");
        const target = lvl56.content_pack.target_slots.find(
          (s) => s.slot_id === piece.target_slot_id
        );
        expect(piece.initial_rotation).not.toBe(target?.target_rotation);
      }
    }
    expect(targetRotations.size).toBe(4);
  });
});

describe("GT-019 — lời đọc không lộ góc, ô đích đủ to (Task #321 C-03, C-04)", () => {
  const EMOJIS = ["✋", "⭐", "🏠", "🔑"] as const;

  function contentOf(count: number, unnamed = false): GT019Content {
    const idx = Array.from({ length: count }, (_, i) => i);
    const asset = (i: number): GT019Piece["asset"] =>
      unnamed
        ? { kind: "image", path: "/img/x.png" }
        : { kind: "emoji", ref: EMOJIS[i] ?? "⭐" };
    return {
      prompt: "Bé hãy xoay hình cho khớp bóng nhé!",
      target_slots: idx.map((i) => ({
        slot_id: `slot-${i}`,
        target_rotation: 180,
        target_flip: "none" as const,
        asset: asset(i),
      })),
      pieces: idx.map((i) => ({
        piece_id: `piece-${i}`,
        initial_rotation: 90,
        initial_flip: "none" as const,
        target_slot_id: `slot-${i}`,
        asset: asset(i),
      })),
    };
  }

  function placed(count: number, unnamed = false) {
    const session = new GT019Session(
      contentOf(count, unnamed),
      FLIP_DIFFICULTY,
      0
    );
    const vp = SHELL_VIEWPORTS[0];
    if (!vp) {
      throw new Error("Thiếu viewport 360x640");
    }
    const round = placeRound(session, "5-6", canvasBoxOf(vp, "5-6", "play"));
    return { session, round };
  }

  it("không spokenLabel nào chứa số độ (mảnh lẫn ô đích)", () => {
    for (const count of [1, 2, 4]) {
      const { session } = placed(count);
      for (const e of session.getView().entities) {
        expect(e.spokenLabel ?? "").not.toMatch(ANGLE_SPEECH);
      }
    }
  });

  it("asset không có tên: mảnh đọc 'Mảnh N', ô đích đọc 'Cái bóng của Mảnh N', không số độ", () => {
    const { session } = placed(1, true);
    const ents = session.getView().entities;
    const piece = ents.find((e) => e.role === "source");
    const target = ents.find((e) => e.role === "target");
    expect(piece?.spokenLabel).toBe("Mảnh 1");
    expect(target?.spokenLabel).toBe("Cái bóng của Mảnh 1");
  });

  it("ô đích đọc 'Cái bóng của {tên}' khi asset có tên", () => {
    const { session } = placed(1);
    const ents = session.getView().entities;
    const piece = ents.find((e) => e.role === "source");
    const target = ents.find((e) => e.role === "target");
    expect(target?.spokenLabel).toBe(`Cái bóng của ${piece?.spokenLabel}`);
  });

  it("level 1 mảnh: ô đích cạnh >= 140 logic ở khung portrait 360x640", () => {
    const { round } = placed(1);
    const target = round.slots.find((s) => s.role === "target");
    expect(target?.w ?? 0).toBeGreaterThanOrEqual(140);
    expect(target?.h ?? 0).toBeGreaterThanOrEqual(140);
  });

  it("4 đích: vẫn >= sàn chạm, không chồng vùng chạm", () => {
    const { round } = placed(4);
    const floor = touchFloorOf("5-6");
    const targets = round.slots.filter((s) => s.role === "target");
    expect(targets).toHaveLength(4);
    for (const t of targets) {
      expect(t.hitW * round.scale).toBeGreaterThanOrEqual(floor - 0.5);
      expect(t.hitH * round.scale).toBeGreaterThanOrEqual(floor - 0.5);
    }
    for (const [i, a] of targets.entries()) {
      for (const b of targets.slice(i + 1)) {
        const apart =
          Math.abs(a.x - b.x) >= (a.hitW + b.hitW) / 2 ||
          Math.abs(a.y - b.y) >= (a.hitH + b.hitH) / 2;
        expect(apart).toBe(true);
      }
    }
  });
});
