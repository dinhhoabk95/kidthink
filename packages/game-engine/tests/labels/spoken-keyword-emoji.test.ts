import { describe, expect, it } from "vitest";
import { spokenKeywordForAsset } from "#src/labels/spoken-keyword";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures";
import { GT002Session } from "#src/templates/GT-002/session";
import type { GT002Content } from "#src/templates/GT-002/template";

/**
 * Asset `text` chỉ có emoji không có chữ để đọc: `spokenLabel` phải `undefined`
 * để caller rơi về `item.label` (stem hash8 không có file giọng → im lặng).
 */
describe("spokenKeywordForAsset — text không có chữ/số", () => {
  it("chuỗi chỉ có emoji → undefined", () => {
    expect(spokenKeywordForAsset({ kind: "text", text: "🍌🍌🍌" })).toBe(
      undefined
    );
    expect(spokenKeywordForAsset({ kind: "text", text: "🔑" })).toBe(undefined);
  });

  it("ca âm: số và chữ vẫn có từ khoá", () => {
    expect(spokenKeywordForAsset({ kind: "text", text: "5" })).toBeDefined();
    expect(
      spokenKeywordForAsset({ kind: "text", text: "quả táo" })
    ).toBeDefined();
  });
});

describe("GT-002 — asset text emoji + label rơi về item.label", () => {
  it("entity.spokenLabel === item.label", () => {
    const fixture = GT002_FIXTURES[0];
    if (!fixture) {
      throw new Error("Fixture GT-002 not found");
    }
    const [first, ...rest] = fixture.content.items;
    if (!first) {
      throw new Error("Fixture thiếu item");
    }
    const content: GT002Content = {
      ...fixture.content,
      items: [
        {
          ...first,
          asset: { kind: "text", text: "🍌🍌🍌" },
          label: "quả chuối",
        },
        ...rest,
      ],
    };
    const session = new GT002Session(content, fixture.difficulty, 1);
    session.prepareRound("4-5");
    const entity = session
      .getView()
      .entities.find((e) => e.id === first.item_id);
    expect(entity?.spokenLabel).toBe("quả chuối");
  });
});
