import { describe, expect, it } from "vitest";
import { requiresVersionBump } from "../src/versioning.ts";

const UNKNOWN_FIELD_REGEX = /BR-VER-08: Unknown field/;

describe("P0.6 Task 4 — Phân loại field bump version §7.2 & §7.3", () => {
  it("BR-VER-07: Sửa description không bump version", () => {
    const bump = requiresVersionBump("game_level", ["description"]);
    expect(bump).toBe(false);
  });

  it("BR-VER-08: Sửa content_pack bắt buộc bump version", () => {
    const bump = requiresVersionBump("game_level", ["content_pack"]);
    expect(bump).toBe(true);
  });

  it("Sửa kết hợp (description + content_pack) -> bắt buộc bump version", () => {
    const bump = requiresVersionBump("game_level", [
      "description",
      "content_pack",
    ]);
    expect(bump).toBe(true);
  });

  it("Field lạ không nằm trong danh sách -> quăng lỗi (mặc định đóng)", () => {
    expect(() =>
      requiresVersionBump("game_level", ["unknown_field_xyz"])
    ).toThrow(UNKNOWN_FIELD_REGEX);
  });

  it("Lesson & Curriculum: bump vs no-bump phân loại đúng", () => {
    expect(requiresVersionBump("lesson", ["title"])).toBe(false);
    expect(requiresVersionBump("lesson", ["activities"])).toBe(true);

    expect(requiresVersionBump("curriculum", ["description"])).toBe(false);
    expect(requiresVersionBump("curriculum", ["curriculum_items"])).toBe(true);
  });
});
