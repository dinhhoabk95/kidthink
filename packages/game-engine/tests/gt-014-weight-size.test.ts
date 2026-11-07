import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { describe, expect, it } from "vitest";
import { GT014_FIXTURES } from "#src/templates/GT-014/fixtures.js";
import { BalanceScaleSession } from "#src/templates/GT-014/session.js";
import {
  layoutPanItems,
  maxItemWeight,
  weightSizeFraction,
} from "#src/templates/GT-014/weight-size.js";
import { collectRenderedText } from "./helpers/rendered-text.ts";

const KEYCAP = /[0-9]️?⃣|\u{1F51F}/u;
const HAS_DIGIT = /\d/;
const PAN = { x: 100, y: 300, w: 180, h: 40 } as const;
const BALANCE_FIXTURES = GT014_FIXTURES.filter(
  (f) => f.content.goal === "balance"
);

function emojiAssetRefs(content: unknown): string[] {
  return JSON.stringify(content)
    .split('"ref":"')
    .slice(1)
    .map((chunk) => chunk.split('"')[0] ?? "");
}

describe("GT-014: cỡ vật theo khối lượng, không in số (BR-E014-03, BR-E014-06)", () => {
  it("diện tích tỉ lệ khối lượng: cạnh tỉ lệ căn bậc hai, trong [0,4; 1]", () => {
    expect(weightSizeFraction(8, 8)).toBe(1);
    expect(weightSizeFraction(2, 8)).toBeCloseTo(0.5, 5);
    expect(weightSizeFraction(1, 10)).toBeGreaterThanOrEqual(0.4);
    for (let w = 1; w < 10; w++) {
      expect(weightSizeFraction(w + 1, 10)).toBeGreaterThan(
        weightSizeFraction(w, 10)
      );
    }
  });

  it("vật cùng khối lượng cùng cỡ dù đĩa có bao nhiêu vật", () => {
    const item = (id: string, weight: number) => ({ item_id: id, weight });
    const alone = layoutPanItems(PAN, [item("a", 4)], 8);
    const crowded = layoutPanItems(
      PAN,
      [item("a", 4), item("b", 8), item("c", 4), item("d", 1), item("e", 4)],
      8
    );

    const sizeOf = (id: string) =>
      crowded.find((p) => p.item.item_id === id)?.size;
    expect(alone[0]?.size).toBe(sizeOf("a"));
    expect(sizeOf("a")).toBe(sizeOf("c"));
    expect(sizeOf("b")).toBeGreaterThan(sizeOf("a") ?? 0);
    expect(sizeOf("d")).toBeLessThan(sizeOf("a") ?? 0);
  });

  it("vật xếp trên đĩa không chồng nhau theo hàng và nằm trên mặt đĩa", () => {
    const items = [3, 3, 3, 3, 3, 3].map((weight, i) => ({
      item_id: `i${i}`,
      weight,
    }));
    const placed = layoutPanItems(PAN, items, 3);

    for (const p of placed) {
      expect(p.y + p.size / 2).toBeLessThanOrEqual(PAN.y);
      expect(p.x - p.size / 2).toBeGreaterThanOrEqual(PAN.x - 1);
      expect(p.x + p.size / 2).toBeLessThanOrEqual(PAN.x + PAN.w + 1);
    }
    expect(new Set(placed.map((p) => `${p.x},${p.y}`)).size).toBe(
      placed.length
    );
  });

  it("maxItemWeight lấy khối lượng lớn nhất qua mọi nhóm", () => {
    expect(
      maxItemWeight([[{ weight: 2 }], [{ weight: 7 }, { weight: 3 }]])
    ).toBe(7);
    expect(maxItemWeight([])).toBe(0);
  });

  it.each(BALANCE_FIXTURES.map((f, i) => [i, f] as const))(
    "level balance mẫu %i: không chữ số lên canvas, spokenLabel vật khay không đọc khối lượng",
    (_i, fixture) => {
      const session = new BalanceScaleSession(
        fixture.content,
        fixture.difficulty,
        0
      );
      session.prepareRound("5-6");

      const drawn = collectRenderedText(session, { prepare: false });
      const trayViews = session
        .getView()
        .entities.filter((e) => e.role === "source");

      expect(drawn.filter((t) => HAS_DIGIT.test(t))).toEqual([]);
      expect(trayViews.length).toBeGreaterThan(0);
      for (const view of trayViews) {
        expect(view.label ?? "").not.toMatch(HAS_DIGIT);
        expect(view.spokenLabel ?? "").not.toMatch(HAS_DIGIT);
        expect(view.spokenLabel ?? "").not.toContain("nặng");
      }
    }
  );

  it("khay không chừa dải nhãn dưới vật", () => {
    const fixture = BALANCE_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture balance");
    }
    const session = new BalanceScaleSession(
      fixture.content,
      fixture.difficulty,
      0
    );

    expect(session.trayHasLabels).toBe(false);
  });

  it("asset của mọi level mẫu và level đã seed không phải emoji số", () => {
    const sampled = GT014_FIXTURES.flatMap((f) => emojiAssetRefs(f.content));
    const seeded = ALL_SEED_LEVELS.filter(
      (l) => l.header.template_code === "GT-014"
    ).flatMap((l) => emojiAssetRefs(l.content_pack));

    expect([...sampled, ...seeded].filter((ref) => KEYCAP.test(ref))).toEqual(
      []
    );
  });
});
