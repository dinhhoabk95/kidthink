import { describe, expect, it } from "vitest";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures.js";
import { GT031Session } from "#src/templates/GT-031/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const DIGITS = /^\d+$/;

function makeSession(): GT031Session {
  const fixture = GT031_FIXTURES.find((f) => f.content.item_to_buy);
  if (!fixture) {
    throw new Error("Thiếu fixture GT-031 có món cần mua");
  }
  return new GT031Session(fixture.content, fixture.difficulty);
}

describe("GT-031: không chữ phải đọc (BR-E031-07)", () => {
  it("canvas không vẽ chữ cái (kể cả đ) trước và sau khi bỏ xu", () => {
    const session = makeSession();
    expect(lettersOnly(collectRenderedText(session))).toEqual([]);
    const coin = session.content.coins[0];
    if (!coin) {
      throw new Error("Thiếu xu");
    }
    session.commit({ type: "deposit_coin", data: { coin_id: coin.coin_id } });
    expect(session.getCurrentTotal()).toBe(coin.value);
    const drawn = collectRenderedText(session, { prepare: false });
    expect(lettersOnly(drawn)).toEqual([]);
    expect(drawn).toContain(String(coin.value));
  });

  it("label trong view chỉ là chữ số, tên món vẫn nằm trong spokenLabel", () => {
    const session = makeSession();
    session.prepareRound("5-6");
    const { entities } = session.getView();
    expect(entities.length).toBeGreaterThan(1);
    for (const entity of entities) {
      expect(entity.label ?? "0").toMatch(DIGITS);
      expect(entity.spokenLabel).toBeTruthy();
    }
  });
});
