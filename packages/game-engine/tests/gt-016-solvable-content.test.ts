import { describe, expect, it } from "vitest";
import { GT016_FIXTURES } from "#src/templates/GT-016/fixtures";
import { GT016ContentSchema } from "#src/templates/GT-016/template";

const RE_SET_INITIAL = /initial_time/;
const RE_MATCH_CARD = /activity_cards/;

const PROMPT = "Bé hãy xoay kim đồng hồ nhé!";

describe("GT-016: level phải giải được (không bị giải sẵn / vô nghiệm)", () => {
  it("mode set thiếu initial_time bị từ chối (đồng hồ sẽ bắt đầu đúng đích)", () => {
    const result = GT016ContentSchema.safeParse({
      prompt: PROMPT,
      mode: "set",
      target_time: { hour: 4, minute: 30 },
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(RE_SET_INITIAL);
  });

  it("mode set có initial_time trùng target_time bị từ chối", () => {
    const result = GT016ContentSchema.safeParse({
      prompt: PROMPT,
      mode: "set",
      target_time: { hour: 4, minute: 30 },
      initial_time: { hour: 4, minute: 30 },
    });
    expect(result.success).toBe(false);
  });

  it("mode set có initial_time khác target_time được chấp nhận", () => {
    const result = GT016ContentSchema.safeParse({
      prompt: PROMPT,
      mode: "set",
      target_time: { hour: 4, minute: 30 },
      initial_time: { hour: 12, minute: 0 },
    });
    expect(result.success).toBe(true);
  });

  it("mode match không có thẻ nào khớp giờ đồng hồ hiển thị bị từ chối", () => {
    const result = GT016ContentSchema.safeParse({
      prompt: PROMPT,
      mode: "match",
      target_time: { hour: 7, minute: 0 },
      activity_cards: [
        {
          card_id: "a",
          asset: { kind: "emoji", ref: "🍳" },
          hour: 8,
          minute: 0,
        },
        {
          card_id: "b",
          asset: { kind: "emoji", ref: "🛏️" },
          hour: 9,
          minute: 0,
        },
      ],
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(RE_MATCH_CARD);
  });

  it("mode match dùng initial_time làm giờ hiển thị khi có", () => {
    const base = {
      prompt: PROMPT,
      mode: "match",
      target_time: { hour: 7, minute: 0 },
      initial_time: { hour: 9, minute: 0 },
      activity_cards: [
        {
          card_id: "a",
          asset: { kind: "emoji", ref: "🍳" },
          hour: 7,
          minute: 0,
        },
        {
          card_id: "b",
          asset: { kind: "emoji", ref: "🛏️" },
          hour: 8,
          minute: 0,
        },
      ],
    };
    expect(GT016ContentSchema.safeParse(base).success).toBe(false);
  });

  it("mọi fixture có sẵn vẫn hợp lệ", () => {
    for (const fixture of GT016_FIXTURES) {
      expect(GT016ContentSchema.safeParse(fixture.content).success).toBe(true);
    }
  });
});
