import { describe, expect, it } from "vitest";
import GT037Template, {
  GT037ContentSchema,
  GT037DifficultySchema,
  getNormalizedSymbolKey,
} from "#src/templates/GT-037/template";

describe("GT-037 Template & Schema (Task #278 S2)", () => {
  const validSymbols = [
    { id: "sym-1", asset: { kind: "text" as const, text: "3" } },
    { id: "sym-2", asset: { kind: "text" as const, text: "8" } },
    { id: "sym-3", asset: { kind: "text" as const, text: "5" } },
    { id: "sym-4", asset: { kind: "text" as const, text: "9" } },
    { id: "sym-5", asset: { kind: "text" as const, text: "6" } },
    { id: "sym-6", asset: { kind: "emoji" as const, ref: "🍎" } },
  ];

  const validContent = {
    prompt: "Con tìm hết số 3 nhé",
    symbols: validSymbols,
    target_ids: ["sym-1"],
    target_copies: 4,
    item_count: 16,
    confusable_ids: ["sym-2", "sym-3"],
  };

  describe("GT037ContentSchema — Ca dương", () => {
    it("parse thành công content pack hợp lệ", () => {
      const res = GT037ContentSchema.safeParse(validContent);
      expect(res.success).toBe(true);
    });

    it("cho phép orientation_free: true trên emoji hoặc hình ảnh", () => {
      const symbolsWithFreeEmoji = [
        ...validSymbols.slice(0, 5),
        {
          id: "sym-star",
          asset: { kind: "emoji" as const, ref: "⭐" },
          orientation_free: true,
        },
      ];
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        symbols: symbolsWithFreeEmoji,
      });
      expect(res.success).toBe(true);
    });
  });

  describe("GT037ContentSchema — Ca âm cơ bản và quan hệ tập hợp", () => {
    it("từ chối khi symbols có ít hơn 2 phần tử", () => {
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        symbols: validSymbols.slice(0, 1),
      });
      expect(res.success).toBe(false);
    });

    it("từ chối khi symbols có ID trùng lặp", () => {
      const duplicateIdSymbols = [
        ...validSymbols.slice(0, 5),
        { id: "sym-1", asset: { kind: "text" as const, text: "X" } },
      ];
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        symbols: duplicateIdSymbols,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) => i.message.includes("trùng lặp"))
        ).toBe(true);
      }
    });

    it("từ chối khi target_ids chứa ID không có trong symbols", () => {
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        target_ids: ["unknown-id"],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) =>
            i.message.includes("không tồn tại trong danh sách symbols")
          )
        ).toBe(true);
      }
    });

    it("từ chối khi target_ids bị trùng lặp", () => {
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        target_ids: ["sym-1", "sym-1"],
      });
      expect(res.success).toBe(false);
    });

    it("từ chối khi confusable_ids chứa ID không có trong symbols", () => {
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        confusable_ids: ["not-exist"],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) =>
            i.message.includes("không tồn tại trong danh sách symbols")
          )
        ).toBe(true);
      }
    });

    it("từ chối khi confusable_ids giao với target_ids", () => {
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        confusable_ids: ["sym-1"],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) =>
            i.message.includes("trùng với ký hiệu đích")
          )
        ).toBe(true);
      }
    });

    it("từ chối khi item_count không đủ chỗ cho target_copies và confusable_ids", () => {
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        item_count: 12,
        target_copies: 8,
        confusable_ids: validSymbols.slice(1, 5).map((s) => s.id),
      });
      expect(res.success).toBe(false);
    });
  });

  describe("GT037ContentSchema — BR-E037-06 (Chữ số và chữ cái cấm xoay)", () => {
    it("từ chối khi chữ số mang orientation_free: true", () => {
      const symbolsWithRotatedDigit = [
        {
          id: "sym-1",
          asset: { kind: "text" as const, text: "6" },
          orientation_free: true,
        },
        ...validSymbols.slice(1),
      ];
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        symbols: symbolsWithRotatedDigit,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) => i.message.includes("BR-E037-06"))
        ).toBe(true);
      }
    });

    it("từ chối khi chữ cái mang orientation_free: true", () => {
      const symbolsWithRotatedLetter = [
        {
          id: "sym-1",
          asset: { kind: "text" as const, text: "b" },
          orientation_free: true,
        },
        ...validSymbols.slice(1),
      ];
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        symbols: symbolsWithRotatedLetter,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) => i.message.includes("BR-E037-06"))
        ).toBe(true);
      }
    });
  });

  describe("GT037ContentSchema — BR-E037-07 (Chuẩn hoá NFC & Không trùng ký hiệu đích)", () => {
    it("từ chối khi ký hiệu gây nhiễu trùng text với ký hiệu đích khác id", () => {
      const symbolsWithDuplicateTargetGlyph = [
        { id: "target", asset: { kind: "text" as const, text: "3" } },
        { id: "distractor-dup", asset: { kind: "text" as const, text: "3" } },
        ...validSymbols.slice(2),
      ];
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        symbols: symbolsWithDuplicateTargetGlyph,
        target_ids: ["target"],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) => i.message.includes("BR-E037-07"))
        ).toBe(true);
      }
    });

    it("từ chối khi ký hiệu gây nhiễu trùng ký hiệu đích sau khi trim khoảng trắng", () => {
      const symbolsWithSpaceGlyph = [
        { id: "target", asset: { kind: "text" as const, text: "3" } },
        {
          id: "distractor-space",
          asset: { kind: "text" as const, text: " 3 " },
        },
        ...validSymbols.slice(2),
      ];
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        symbols: symbolsWithSpaceGlyph,
        target_ids: ["target"],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) => i.message.includes("BR-E037-07"))
        ).toBe(true);
      }
    });

    it("từ chối khi 2 ký hiệu bất kỳ trong symbols trùng glyph sau chuẩn hoá NFC", () => {
      const decomposedE = "e\u0301"; // e + combining acute
      const composedE = "\u00e9"; // é NFC
      const symbolsWithNfcDup = [
        ...validSymbols.slice(0, 1),
        { id: "sym-e1", asset: { kind: "text" as const, text: decomposedE } },
        { id: "sym-e2", asset: { kind: "text" as const, text: composedE } },
        ...validSymbols.slice(3),
      ];
      const res = GT037ContentSchema.safeParse({
        ...validContent,
        symbols: symbolsWithNfcDup,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) => i.message.includes("BR-E037-07"))
        ).toBe(true);
      }
    });
  });

  describe("GT037DifficultySchema", () => {
    it("parse thành công với object rỗng (toàn bộ options optional)", () => {
      const res = GT037DifficultySchema.safeParse({});
      expect(res.success).toBe(true);
    });

    it("parse thành công với các tuỳ chọn hợp lệ", () => {
      const res = GT037DifficultySchema.safeParse({
        hint_after_ms: 10_000,
        allow_retry: true,
        show_target_counter: false,
        finish_mode: "declare",
      });
      expect(res.success).toBe(true);
    });

    it("từ chối finish_mode không hợp lệ", () => {
      const res = GT037DifficultySchema.safeParse({
        finish_mode: "invalid_mode",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("GT037Template Metadata & Ràng buộc", () => {
    it("khai báo đúng mã và cơ chế theo hợp đồng", () => {
      expect(GT037Template.code).toBe("GT-037");
      expect(GT037Template.mechanic).toBe("symbol-hunt");
      expect(GT037Template.status).toBe("published");
      expect(GT037Template.layouts).toEqual(["scatter-board"]);
      expect(GT037Template.age_min).toBe(4);
      expect(GT037Template.age_max).toBe(6);
      expect(GT037Template.banned_age_bands).toEqual(["3-4"]);
      expect(GT037Template.requires_tap_fallback).toBe(false);
      expect(GT037Template.engine_session).toBe("GT037Session");
    });

    it("khai báo limits khớp Mục 15", () => {
      expect(GT037Template.limits).toEqual({
        item_count: [12, 30],
        distractor_count: [8, 26],
        target_count: [2, 8],
      });
    });

    it("khai báo asset_kinds đầy đủ emoji, text, image", () => {
      expect(GT037Template.asset_kinds).toEqual(["emoji", "text", "image"]);
    });
  });

  describe("getNormalizedSymbolKey helper", () => {
    it("chuẩn hoá emoji, text và image đúng định dạng", () => {
      expect(getNormalizedSymbolKey({ kind: "emoji", ref: " 🍎 " })).toBe(
        "emoji:🍎"
      );
      expect(getNormalizedSymbolKey({ kind: "text", text: " A " })).toBe(
        "text:A"
      );
      expect(
        getNormalizedSymbolKey({ kind: "image", path: "/img/star.png " })
      ).toBe("image:/img/star.png");
    });
  });
});
