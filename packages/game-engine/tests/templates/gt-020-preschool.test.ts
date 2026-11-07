import { describe, expect, it } from "vitest";
import { AGE_BANDS } from "#src/contracts/types";
import { GT020Generator } from "#src/generators/gt020";
import { createRng } from "#src/rng/mulberry32";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures";
import { GT020Session } from "#src/templates/GT-020/session";
import {
  type GT020Content,
  PAIR_CAP_BY_BAND,
} from "#src/templates/GT-020/template";

const VOCAB = {
  theme: "animals",
  nouns: Array.from({ length: 8 }, (_, i) => ({
    emoji_ref: ["🐱", "🐶", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"][i] ?? "🐱",
    label_vi: `con ${i}`,
  })),
};

/**
 * Task #313 Phase 3 — GT-020: lật cặp lệch không phải lỗi (`BR-E020-04`),
 * `peek_all_initial_ms` có tác dụng (`BR-E020-05`), số cặp theo band (`BR-E020-06`).
 */
function build(fixtureIndex: number): GT020Session {
  const f = GT020_FIXTURES[fixtureIndex];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT020Session(f.content, f.difficulty, 1);
  session.prepareRound("4-5");
  return session;
}

describe("GT-020 — lật lệch không phải lỗi (BR-E020-04)", () => {
  it("thẻ thứ hai lệch cặp vẫn được chấp nhận, không RETRY", () => {
    const session = build(2);
    const first = session.displayCards[0];
    const other = session.displayCards.find(
      (c) => c.pairKey !== first?.pairKey
    );
    if (!(first && other)) {
      throw new Error("Thiếu thẻ");
    }
    session.update(10_000);
    session.commit({ type: "tap_card", data: { card_id: first.cardId } });
    const verdict = session.validateAction({
      type: "tap_card",
      data: { card_id: other.cardId },
    });
    expect(verdict.valid).toBe(true);
  });
});

describe("GT-020 — xem trước toàn bàn (BR-E020-05)", () => {
  it("peek_all_initial_ms > 0: thẻ ngửa, chưa nhận chạm, hết giờ thì úp", () => {
    const session = build(0);
    const peekMs = GT020_FIXTURES[0]?.difficulty.peek_all_initial_ms ?? 0;
    expect(peekMs).toBeGreaterThan(0);
    expect(session.isPeeking()).toBe(true);
    const peekView = session.getView();
    expect(peekView.entities.every((e) => e.spokenLabel !== undefined)).toBe(
      true
    );
    const card = session.displayCards[0];
    if (!card) {
      throw new Error("Thiếu thẻ");
    }
    expect(
      session.validateAction({
        type: "tap_card",
        data: { card_id: card.cardId },
      }).valid
    ).toBe(false);

    session.update(peekMs - 1);
    expect(session.isPeeking()).toBe(true);
    session.update(2);
    expect(session.isPeeking()).toBe(false);
    expect(
      session.getView().entities.every((e) => e.spokenLabel === undefined)
    ).toBe(true);
    expect(
      session.validateAction({
        type: "tap_card",
        data: { card_id: card.cardId },
      }).valid
    ).toBe(true);
  });

  it("peek_all_initial_ms = 0: nhận chạm ngay", () => {
    const session = build(2);
    expect(session.isPeeking()).toBe(false);
  });
});

describe("GT-020 — trần số cặp theo band (BR-E020-06)", () => {
  it("3-4 tối đa 3 cặp; bộ sinh và fixture không vượt trần", () => {
    expect(PAIR_CAP_BY_BAND["3-4"]).toBe(3);
    for (const band of AGE_BANDS) {
      const out = GT020Generator.generate({
        rng: createRng(7),
        age_band: band,
        theme: "animals",
        vocabulary: VOCAB,
      }) as { content_pack: GT020Content };
      expect(out.content_pack.pairs.length).toBeLessThanOrEqual(
        PAIR_CAP_BY_BAND[band]
      );
    }
    const bands = ["3-4", "4-5", "5-6"] as const;
    GT020_FIXTURES.forEach((f, i) => {
      const band = bands[i];
      if (band) {
        expect(f.content.pairs.length).toBeLessThanOrEqual(
          PAIR_CAP_BY_BAND[band]
        );
      }
    });
  });
});
