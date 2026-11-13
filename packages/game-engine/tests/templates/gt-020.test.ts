import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it } from "vitest";
import { ACTION_IGNORED } from "#src/game-session";
import { GT020Generator } from "#src/generators/gt020";
import type { ThemeVocabulary } from "#src/generators/types";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures";
import { getGT020Clock } from "#src/templates/GT-020/layout";
import { GT020Session } from "#src/templates/GT-020/session";
import template, {
  type GT020Content,
  type GT020Difficulty,
  PAIR_CAP_BY_BAND,
} from "#src/templates/GT-020/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";

const VOCAB: ThemeVocabulary = {
  theme: "animals",
  nouns: [
    { emoji_ref: "🐱", label_vi: "mèo" },
    { emoji_ref: "🐶", label_vi: "cún" },
    { emoji_ref: "🐭", label_vi: "chuột" },
    { emoji_ref: "🐹", label_vi: "hamster" },
    { emoji_ref: "🐰", label_vi: "thỏ" },
    { emoji_ref: "🦊", label_vi: "cáo" },
    { emoji_ref: "🐻", label_vi: "gấu" },
    { emoji_ref: "🐼", label_vi: "gấu trúc" },
  ],
};

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function renderSessionFrame(
  session: GT020Session,
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

describe("GT-020 — dung sai chạm và tự động úp cặp lệch (BR-E020)", () => {
  const fixture = GT020_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-020 not found");
  }
  const { content, difficulty } = fixture;

  function buildSession(): GT020Session {
    const session = new GT020Session(content, difficulty, 1);
    session.prepareRound("4-5");
    session.update(difficulty.peek_all_initial_ms + 1);
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
    expect(action?.type).toBe("tap_card");
  });

  it("chạm lệch tâm trong dung sai 24px (TAP_TOLERANCE_PX) vẫn trúng thẻ gần nhất", () => {
    const session = buildSession();
    const slot = session.slots[0];
    if (!slot) {
      throw new Error("Thiếu slot đầu tiên");
    }
    const offset = slot.hitH / 2 + TAP_TOLERANCE_PX - 4;

    const action = session.toAction({
      type: "tap",
      x: slot.x,
      y: slot.y - offset,
      timeMs: 0,
    });

    expect(action).toEqual({
      type: "tap_card",
      data: { card_id: session.displayCards[0]?.cardId },
    });
  });

  it("chạm ra ngoài mọi thẻ bị nuốt, không tính là chạm sai (BR-ETS-02)", () => {
    const session = buildSession();

    const action = session.toAction({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(action).toBeNull();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });

  it("BR-E020-02: hai thẻ lệch cặp tự động úp lại sau flip_back_delay_ms qua update(deltaMs)", () => {
    const session = buildSession();
    const firstCard = session.displayCards[0];
    const mismatchCard = session.displayCards.find(
      (c) => c.pairKey !== firstCard?.pairKey
    );
    if (!(firstCard && mismatchCard)) {
      throw new Error("Thiếu cặp thẻ lệch");
    }

    session.onTapCard(firstCard.cardId);
    const res = session.onTapCard(mismatchCard.cardId);
    expect(res?.isSecondFlip).toBe(true);
    expect(res?.isMatch).toBe(false);
    expect(session.cardSystem.getCard(firstCard.cardId)?.state).toBe("face_up");
    expect(session.cardSystem.getCard(mismatchCard.cardId)?.state).toBe(
      "face_up"
    );

    session.update(difficulty.flip_back_delay_ms - 100);
    expect(session.cardSystem.getCard(firstCard.cardId)?.state).toBe("face_up");

    session.update(150);
    expect(session.cardSystem.getCard(firstCard.cardId)?.state).toBe(
      "face_down"
    );
    expect(session.cardSystem.getCard(mismatchCard.cardId)?.state).toBe(
      "face_down"
    );
  });

  it("chạm thẻ thứ 3 khi đang có 2 thẻ lệch mở sẽ tự đóng cặp lệch trước khi mở thẻ mới", () => {
    const session = buildSession();
    const firstCard = session.displayCards[0];
    const mismatchCard = session.displayCards.find(
      (c) => c.pairKey !== firstCard?.pairKey
    );
    const thirdCard = session.displayCards.find(
      (c) => c.cardId !== firstCard?.cardId && c.cardId !== mismatchCard?.cardId
    );
    if (!(firstCard && mismatchCard && thirdCard)) {
      throw new Error("Thiếu thẻ để kiểm tra");
    }

    session.onTapCard(firstCard.cardId);
    session.onTapCard(mismatchCard.cardId);
    const res3 = session.onTapCard(thirdCard.cardId);

    expect(res3?.state).toBe("face_up");
    expect(session.cardSystem.getCard(firstCard.cardId)?.state).toBe(
      "face_down"
    );
    expect(session.cardSystem.getCard(mismatchCard.cardId)?.state).toBe(
      "face_down"
    );
    expect(session.cardSystem.getCard(thirdCard.cardId)?.state).toBe("face_up");
  });

  it("getView() ẩn nhãn khi thẻ đang úp và gắn spokenLabel/spokenAudioPath khi thẻ ngửa", () => {
    const audioPath = "/audio/voice/fixture/meo.mp3";
    const pair0 = content.pairs[0];
    if (!pair0) {
      throw new Error("Thiếu pair 0");
    }
    const customContent: GT020Content = {
      ...content,
      pairs: [
        {
          ...pair0,
          card_a: {
            ...pair0.card_a,
            asset: { kind: "emoji", ref: "🐱", audio_path: audioPath },
          },
        },
        ...content.pairs.slice(1),
      ],
    };
    expect(template.content_contract.safeParse(customContent).success).toBe(
      true
    );

    const session = new GT020Session(customContent, difficulty, 1);
    session.prepareRound("4-5");
    session.update(difficulty.peek_all_initial_ms + 1);

    const viewBefore = session.getView();
    const ids = viewBefore.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const cardEntityBefore = viewBefore.entities.find(
      (e) => e.id === pair0.card_a.card_id
    );
    expect(cardEntityBefore?.spokenLabel).toBeUndefined();
    expect(cardEntityBefore?.spokenAudioPath).toBeUndefined();
    expect(cardEntityBefore?.hitShape).toBe("square");

    session.onTapCard(pair0.card_a.card_id);
    const cardEntityAfter = session
      .getView()
      .entities.find((e) => e.id === pair0.card_a.card_id);
    expect(cardEntityAfter?.spokenLabel).toBe(getByGlyph("🐱")?.name);
    expect(cardEntityAfter?.spokenAudioPath).toBe(audioPath);
  });

  it("1. Thang gợi ý L1/L2/L3, getHintDemoSequence(3), ưu tiên cặp đã thấy (seenCardIds) và hé mở L2", () => {
    const f2 = GT020_FIXTURES[2];
    if (!f2) {
      throw new Error("Thiếu fixture 2");
    }
    const session = new GT020Session(f2.content, f2.difficulty, 11);
    session.prepareRound("5-6");

    // Khi có 2 thẻ của một cặp từng được trẻ lật thấy rồi úp lại, hint phải ưu tiên cặp đó
    const targetPairKey = session.displayCards[2]?.pairKey;
    const seenPair = session.displayCards.filter(
      (c) => c.pairKey === targetPairKey
    );
    const unrelated = session.displayCards.find(
      (c) => c.pairKey !== targetPairKey
    );
    if (seenPair.length !== 2 || !seenPair[0] || !seenPair[1] || !unrelated) {
      throw new Error("Thiếu cặp thẻ để kiểm thử seenCardIds");
    }

    session.onTapCard(seenPair[0].cardId);
    session.onTapCard(unrelated.cardId);
    session.closeMismatch();
    session.onTapCard(seenPair[1].cardId);
    session.onTapCard(unrelated.cardId);
    session.closeMismatch();

    const l1 = session.getHintTargetForLevel(1);
    expect(l1).toEqual({
      kind: "region",
      ids: [seenPair[0].cardId],
    });

    const l2 = session.getHintTargetForLevel(2);
    expect(l2).toEqual({
      kind: "region",
      ids: [seenPair[0].cardId, seenPair[1].cardId],
    });

    session.onScaffoldEscalated(2);
    const clock = getGT020Clock(session);
    expect(clock.l2PeekCardId).toBe(seenPair[0].cardId);
    expect(clock.l2PeekRemainingMs).toBe(900);
    // Dù đang nháy L2, getView() của thẻ face_down vẫn không được lộ spokenLabel
    const peekEntity = session
      .getView()
      .entities.find((e) => e.id === seenPair[0]?.cardId);
    expect(peekEntity?.spokenLabel).toBeUndefined();

    session.update(1000);
    expect(clock.l2PeekCardId).toBeNull();
    expect(clock.l2PeekRemainingMs).toBe(0);

    const idx0 = session.displayCards.findIndex(
      (c) => c.cardId === seenPair[0]?.cardId
    );
    const idx1 = session.displayCards.findIndex(
      (c) => c.cardId === seenPair[1]?.cardId
    );
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: idx0,
    });
    expect(session.getHintDemoSequence(3)).toEqual([
      { from: idx0 },
      { from: idx1 },
    ]);
    expect(session.getHintDemoSequence(2)).toBeNull();

    // Khi trẻ đã mở 1 thẻ chờ cặp, gợi ý trỏ thẳng sang thẻ bạn còn lại
    session.onTapCard(seenPair[0].cardId);
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: [seenPair[1].cardId],
    });
    expect(session.getHintDemoSequence(3)).toEqual([{ from: idx1 }]);

    session.onHintCleared();
    expect(clock.activeHintLevel).toBe(0);
  });

  it("2. isAcceptingInput() là false trong lúc peek_all_initial_ms và chuyển thành true khi hết peek", () => {
    const session = new GT020Session(content, difficulty, 1);
    session.prepareRound("3-4");
    expect(session.isPeeking()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);

    session.update(difficulty.peek_all_initial_ms);
    expect(session.isPeeking()).toBe(false);
    expect(session.isAcceptingInput()).toBe(true);
  });

  it("3. allow_retry === false: lật lệch cặp đóng lượt, khoá input tiếp và mở minh hoạ các cặp", () => {
    const strictDiff: GT020Difficulty = {
      ...difficulty,
      peek_all_initial_ms: 0,
      allow_retry: false,
    };
    const session = new GT020Session(content, strictDiff, 3);
    session.prepareRound("4-5");

    const c0 = session.displayCards[0];
    const cMismatch = session.displayCards.find(
      (c) => c.pairKey !== c0?.pairKey
    );
    const cThird = session.displayCards.find(
      (c) => c.cardId !== c0?.cardId && c.cardId !== cMismatch?.cardId
    );
    if (!(c0 && cMismatch && cThird)) {
      throw new Error("Thiếu thẻ kiểm thử allow_retry=false");
    }

    session.onTapCard(c0.cardId);
    session.onTapCard(cMismatch.cardId);

    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(session.mascotMood()).toBeNull();
    expect(
      session.validateAction({
        type: "tap_card",
        data: { card_id: cThird.cardId },
      })
    ).toBe(ACTION_IGNORED);
    expect(session.onTapCard(cThird.cardId)).toBeNull();

    renderSessionFrame(session, { timeMs: 100 });
    session.update(1500);
    renderSessionFrame(session, { timeMs: 1600 });
  });

  it("4. Chơi lại vòng 2+ (prepareRound lần 2 với cùng layoutSeed) đổi sang bố trí mới (N7)", () => {
    const session = new GT020Session(content, difficulty, 42);
    session.prepareRound("4-5");
    const round1Ids = session.displayCards.map((c) => c.cardId);

    session.prepareRound("4-5");
    const round2Ids = session.displayCards.map((c) => c.cardId);

    expect(round2Ids).not.toEqual(round1Ids);
    expect([...round2Ids].sort()).toEqual([...round1Ids].sort());
  });

  it("5. getView().entities có đủ hitW/hitH đạt sàn chạm và setPointerOver/clearPointerOver hoạt động chuẩn", () => {
    const session = buildSession();
    const view = session.getView();
    for (const entity of view.entities) {
      const hitW = Number(Reflect.get(entity, "hitW"));
      const hitH = Number(Reflect.get(entity, "hitH"));
      expect(hitW).toBeGreaterThanOrEqual(entity.w);
      expect(hitH).toBeGreaterThanOrEqual(entity.h);
      expect(entity.role).toBe("target");
    }

    const slot0 = session.slots[0];
    if (!slot0) {
      throw new Error("Thiếu slot 0");
    }
    session.setPointerOver(slot0.x, slot0.y);
    expect(session.getView().entities[0]?.state).toBe("active");
    renderSessionFrame(session, { timeMs: 200 });

    session.clearPointerOver();
    expect(session.getView().entities[0]?.state).toBe("idle");
  });

  it("6. Fallback hình giữ chỗ vector khi 2 cặp có asset rỗng/ảnh chưa nạp: 0 crash, 0 lộ mã chữ", () => {
    const brokenContent: GT020Content = {
      prompt: "Tìm cặp",
      pairs: [
        {
          pair_key: "p1",
          card_a: { card_id: "p1a", asset: { kind: "emoji", ref: "   " } },
          card_b: { card_id: "p1b", asset: { kind: "emoji", ref: "   " } },
        },
        {
          pair_key: "p2",
          card_a: {
            card_id: "p2a",
            asset: { kind: "image", path: "/missing/img.png" },
          },
          card_b: {
            card_id: "p2b",
            asset: { kind: "image", path: "/missing/img.png" },
          },
        },
      ],
    };
    const session = new GT020Session(brokenContent, difficulty, 5);
    session.prepareRound("3-4");

    const texts = collectRenderedText(session);
    expect(lettersOnly(texts)).toEqual([]);
  });

  it("7. Bất biến BR-ERC-02: Object.entries(session) trùng khít sau 100 frame render() + reducedMotion & degradation", () => {
    const session = buildSession();
    const c0 = session.displayCards[0];
    if (!c0) {
      throw new Error("Thiếu thẻ 0");
    }
    session.onTapCard(c0.cardId);

    const beforeEntries = JSON.stringify(Object.entries(session));
    for (let f = 0; f < 100; f++) {
      renderSessionFrame(session, { timeMs: 2000 + f * 16.67 });
    }
    const afterEntries = JSON.stringify(Object.entries(session));
    expect(afterEntries).toBe(beforeEntries);

    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    const partner = session.displayCards.find(
      (c) => c.pairKey === c0.pairKey && c.cardId !== c0.cardId
    );
    if (partner) {
      session.onTapCard(partner.cardId);
    }
    renderSessionFrame(session, { reducedMotion: true, timeMs: 4000 });
    renderSessionFrame(session, { reducedMotion: false, timeMs: 4100 });
    session.destroy();
  });

  it("8. GT020Generator: band 3-4 luôn sinh peek_all_initial_ms > 0, pairs <= 3, flip_back_delay_ms giảm dần theo band", () => {
    const out34 = GT020Generator.generate({
      rng: createRng(10),
      age_band: "3-4",
      theme: "animals",
      vocabulary: VOCAB,
      escalation_step: 3,
    });
    const out45 = GT020Generator.generate({
      rng: createRng(10),
      age_band: "4-5",
      theme: "animals",
      vocabulary: VOCAB,
      escalation_step: 3,
    });
    const out56 = GT020Generator.generate({
      rng: createRng(10),
      age_band: "5-6",
      theme: "animals",
      vocabulary: VOCAB,
      escalation_step: 3,
    });

    expect(out34.difficulty_params.peek_all_initial_ms).toBeGreaterThan(0);
    expect(out34.content_pack.pairs.length).toBeLessThanOrEqual(
      PAIR_CAP_BY_BAND["3-4"]
    );
    expect(out45.content_pack.pairs.length).toBeLessThanOrEqual(
      PAIR_CAP_BY_BAND["4-5"]
    );
    expect(out56.content_pack.pairs.length).toBeLessThanOrEqual(
      PAIR_CAP_BY_BAND["5-6"]
    );
    expect(out34.difficulty_params.flip_back_delay_ms).toBeGreaterThan(
      out45.difficulty_params.flip_back_delay_ms
    );
    expect(out45.difficulty_params.flip_back_delay_ms).toBeGreaterThan(
      out56.difficulty_params.flip_back_delay_ms
    );
  });
});
