import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it } from "vitest";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures";
import { GT020Session } from "#src/templates/GT-020/session";
import template from "#src/templates/GT-020/template";

describe("GT-020 — dung sai chạm và tự động úp cặp lệch (BR-E020)", () => {
  const fixture = GT020_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-020 not found");
  }
  const { content, difficulty } = fixture;

  function buildSession(): GT020Session {
    const session = new GT020Session(content, difficulty, 1);
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
    const customContent = {
      ...content,
      pairs: [
        {
          ...pair0,
          card_a: {
            ...pair0.card_a,
            asset: { kind: "emoji" as const, ref: "🐱", audio_path: audioPath },
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
    // Hết giờ xem trước thì thẻ mới úp (BR-E020-05).
    session.update(difficulty.peek_all_initial_ms);

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
});
