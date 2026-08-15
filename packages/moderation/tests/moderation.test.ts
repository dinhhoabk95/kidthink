import { describe, expect, it } from "vitest";
import {
  CHILD_CONTENT_BLOCKLIST,
  moderateCustomGameMetadata,
  moderateText,
} from "../src/index.js";

describe("@kidthink/moderation", () => {
  it("passes clean and friendly content for children", () => {
    const text = "Bé hãy tìm và chọn quả táo màu đỏ nhé!";
    const result = moderateText(text);
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.flaggedTerms).toHaveLength(0);
  });

  it("blocks violence content (BR-CGB-09)", () => {
    const text = "Bé hãy bắn súng để tiêu diệt mục tiêu";
    const result = moderateText(text);
    expect(result.passed).toBe(false);
    expect(result.flaggedTerms).toContain("bắn súng");
    expect(result.issues.some((i) => i.category === "violence")).toBe(true);
  });

  it("blocks fear and spooky content for young children", () => {
    const text = "Tìm con ma trong ngôi nhà rùng rợn";
    const result = moderateText(text);
    expect(result.passed).toBe(false);
    expect(result.flaggedTerms).toContain("con ma");
    expect(result.issues.some((i) => i.category === "fear")).toBe(true);
  });

  it("blocks death and funeral topics", () => {
    const text = "Chiếc quan tài màu nâu";
    const result = moderateText(text);
    expect(result.passed).toBe(false);
    expect(result.flaggedTerms).toContain("quan tài");
    expect(result.issues.some((i) => i.category === "death")).toBe(true);
  });

  it("blocks third-party trademark/copyrighted names", () => {
    const text = "Hãy chọn hình công chúa elsa và spiderman";
    const result = moderateText(text);
    expect(result.passed).toBe(false);
    expect(result.flaggedTerms).toContain("elsa");
    expect(result.flaggedTerms).toContain("spiderman");
  });

  it("blocks shaming and punishment words (dốt, sai rồi, thua cuộc)", () => {
    const text = "Bé chọn sai rồi, dốt quá!";
    const result = moderateText(text);
    expect(result.passed).toBe(false);
    expect(result.flaggedTerms).toContain("sai rồi");
    expect(result.flaggedTerms).toContain("dốt");
  });

  it("blocks negative instruction assertions (BR-GLM-05, BR-CGB-10)", () => {
    const text = "Bé đừng chọn quả màu xanh nhé";
    const result = moderateText(text, { allowNegativeAssertions: false });
    expect(result.passed).toBe(false);
    expect(result.flaggedTerms).toContain("đừng");
    expect(result.issues.some((i) => i.category === "negative_assertion")).toBe(
      true
    );
  });

  it("allows negative assertions in title when allowNegativeAssertions is true", () => {
    const text = "Trò chơi đừng để bóng rơi";
    const result = moderateText(text, { allowNegativeAssertions: true });
    expect(result.passed).toBe(true);
  });

  it("rejects input that exceeds maxInputChars limit", () => {
    const longText = "a".repeat(600);
    const result = moderateText(longText, { maxInputChars: 500 });
    expect(result.passed).toBe(false);
    expect(result.flaggedTerms).toContain("INPUT_TOO_LONG");
  });

  it("validates custom game title and instruction together with proper category policies", () => {
    const title = "Đếm số bông hoa";
    const instruction = "Bé hãy chạm vào 3 bông hoa màu vàng";
    const result = moderateCustomGameMetadata(title, instruction);
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);

    const badResult = moderateCustomGameMetadata(
      "Game phép thuật",
      "Đừng chọn quả táo"
    );
    expect(badResult.passed).toBe(false);
    expect(badResult.flaggedTerms).toContain("đừng");
  });

  it("contains all required blocklist entries from specification", () => {
    expect(CHILD_CONTENT_BLOCKLIST.length).toBeGreaterThan(30);
    const categories = new Set(CHILD_CONTENT_BLOCKLIST.map((b) => b.category));
    expect(categories.has("violence")).toBe(true);
    expect(categories.has("fear")).toBe(true);
    expect(categories.has("death")).toBe(true);
    expect(categories.has("shaming_punishment")).toBe(true);
    expect(categories.has("trademark")).toBe(true);
  });
});
