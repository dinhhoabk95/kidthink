import { describe, expect, it } from "vitest";
import {
  isToyboxToolSlug,
  MASCOT_GEAR_CATALOG,
  MAX_DIORAMA_PLACEMENTS,
  resolveUnlockedMascotGear,
  TOYBOX_TOOLS,
} from "./constants/mascot-gear.ts";
import {
  MascotGearPutSchema,
  StickerDioramaPutSchema,
  StickerDioramaQuerySchema,
} from "./kid-world.ts";

describe("MASCOT_GEAR_CATALOG & TOYBOX_TOOLS", () => {
  it("BR-MPR-03: trẻ mới chưa có huy hiệu chỉ mở sẵn duy nhất phụ kiện khởi đầu flower_pin", () => {
    const unlocked = resolveUnlockedMascotGear([]);
    expect(unlocked.map((item) => item.code)).toEqual(["flower_pin"]);
  });

  it("BR-MPR-02: mở thêm phụ kiện tương ứng khi trẻ có huy hiệu cột mốc", () => {
    const unlocked = resolveUnlockedMascotGear([
      "STRAND_FIRST_COMPLETE",
      "PLAY_DAYS_5",
    ]);
    const codes = unlocked.map((item) => item.code);
    expect(codes).toContain("flower_pin");
    expect(codes).toContain("explorer_hat");
    expect(codes).toContain("rainbow_scarf");
    expect(codes).toContain("star_crown");
    expect(codes).toContain("honey_medal");
    expect(codes).not.toContain("leaf_crown");
    expect(MASCOT_GEAR_CATALOG.length).toBeLessThanOrEqual(12);
  });

  it("BR-TBX-02: danh mục Toybox có đúng 3 giáo cụ mở", () => {
    expect(TOYBOX_TOOLS.map((tool) => tool.slug)).toEqual([
      "balance-scale",
      "number-rods",
      "mirror-blocks",
    ]);
    expect(isToyboxToolSlug("balance-scale")).toBe(true);
    expect(isToyboxToolSlug("unknown-tool")).toBe(false);
  });
});

describe("Kid World Zod Schemas", () => {
  it("MascotGearPutSchema: cho phép null hoặc mã hợp lệ và từ chối mã ngoài danh mục", () => {
    expect(
      MascotGearPutSchema.safeParse({ equipped_gear_code: null }).success
    ).toBe(true);
    expect(
      MascotGearPutSchema.safeParse({ equipped_gear_code: "flower_pin" })
        .success
    ).toBe(true);
    expect(
      MascotGearPutSchema.safeParse({ equipped_gear_code: "fake_hat" }).success
    ).toBe(false);
  });

  it("StickerDioramaPutSchema: kiểm biên toạ độ [0.05, 0.95], trần 24 món và chống trùng lặp instance", () => {
    const valid = StickerDioramaPutSchema.safeParse({
      theme_code: "farm",
      placements: [
        { emoji: "🐮", instance_index: 0, norm_x: 0.3, norm_y: 0.6 },
        {
          emoji: "🐮",
          instance_index: 1,
          norm_x: 0.7,
          norm_y: 0.5,
          scale: 1.1,
        },
      ],
    });
    expect(valid.success).toBe(true);

    expect(
      StickerDioramaPutSchema.safeParse({
        theme_code: "invalid_theme",
        placements: [],
      }).success
    ).toBe(false);

    expect(
      StickerDioramaPutSchema.safeParse({
        theme_code: "farm",
        placements: [
          { emoji: "🐮", instance_index: 0, norm_x: 0.01, norm_y: 0.5 },
        ],
      }).success
    ).toBe(false);

    expect(
      StickerDioramaPutSchema.safeParse({
        theme_code: "farm",
        placements: [
          { emoji: "🐮", instance_index: 0, norm_x: 0.4, norm_y: 0.5 },
          { emoji: "🐮", instance_index: 0, norm_x: 0.6, norm_y: 0.5 },
        ],
      }).success
    ).toBe(false);

    const tooMany = Array.from(
      { length: MAX_DIORAMA_PLACEMENTS + 1 },
      (_, i) => ({
        emoji: `e${i}`,
        instance_index: 0,
        norm_x: 0.5,
        norm_y: 0.5,
      })
    );
    expect(
      StickerDioramaPutSchema.safeParse({
        theme_code: "farm",
        placements: tooMany,
      }).success
    ).toBe(false);
  });

  it("StickerDioramaQuerySchema: lọc tuỳ chọn theo mã chủ đề hợp lệ", () => {
    expect(StickerDioramaQuerySchema.safeParse({}).success).toBe(true);
    expect(
      StickerDioramaQuerySchema.safeParse({ theme: "ocean" }).success
    ).toBe(true);
    expect(StickerDioramaQuerySchema.safeParse({ theme: "mars" }).success).toBe(
      false
    );
  });
});
