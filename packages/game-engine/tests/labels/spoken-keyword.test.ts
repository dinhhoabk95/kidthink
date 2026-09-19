import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it } from "vitest";
import { spokenKeywordForAsset } from "#src/labels/spoken-keyword";

const APPLE_NAME = getByGlyph("🍎")?.name ?? "";
const apple = APPLE_NAME.toLowerCase();

/**
 * Từ khoá đọc được khi trẻ chạm lại một hình minh hoạ (Task #274 S7). Glyph
 * không có tên thì KHÔNG có từ khoá — Cấm — NEVER đưa glyph thô cho TTS: nó
 * đọc tên tiếng Anh hoặc im lặng.
 */
describe("spokenKeywordForAsset (Task #274 S7, BR-PNR-02)", () => {
  it("emoji có trong catalog: đọc tên tiếng Việt", () => {
    expect(APPLE_NAME).not.toBe("");
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🍎" })).toBe(
      APPLE_NAME
    );
  });

  it("glyph lặp của một emoji có tên: đọc thành cụm đếm", () => {
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🍎🍎🍎" })).toBe(
      `ba ${apple}`
    );
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🍎🍎🍎🍎🍎" })).toBe(
      `năm ${apple}`
    );
  });

  it("keycap nhiều chữ số: đọc thành số", () => {
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "1️⃣5️⃣" })).toBe(
      "Số mười lăm"
    );
  });

  it("chữ cái trong ô và chữ cái trần: đọc thành chữ", () => {
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🅰️" })).toBe("Chữ a");
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🆅" })).toBe("Chữ v");
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "b" })).toBe("Chữ b");
  });

  it("glyph nghề có giới tính (catalog cấm): tra sang bản trung tính", () => {
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "👨‍⚕️" })).toBe(
      spokenKeywordForAsset({ kind: "emoji", ref: "🧑‍⚕️" })
    );
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "👩‍🏫" })).toBeTruthy();
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "💂‍♂️" })).toBe(
      spokenKeywordForAsset({ kind: "emoji", ref: "💂" })
    );
  });

  it("chữ trên thẻ: đọc qua quy tắc thuật ngữ (số, chữ)", () => {
    expect(spokenKeywordForAsset({ kind: "text", text: "5" })).toBe("Số năm");
  });

  it("glyph không có tên: không có từ khoá, Cấm — NEVER trả glyph thô", () => {
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🜁" })).toBeUndefined();
  });

  it("ảnh: không có từ khoá", () => {
    expect(
      spokenKeywordForAsset({ kind: "image", path: "/img/x.png" })
    ).toBeUndefined();
  });
});
