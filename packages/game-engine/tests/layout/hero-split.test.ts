import { describe, expect, it } from "vitest";
import { SLOT_GAP_PX } from "#src/layout/constants";
import { splitHeroStage } from "#src/layout/hero-split";
import type { ZoneRect } from "#src/layout/stage-zones";

/**
 * Task #321: vùng chính 55% cao là mặc định, không phải luật. Điện thoại dọc
 * 360 px band 3-4 (sân khấu 508x438, sàn chạm 154 logic) mà giữ 55% thì phần
 * lựa chọn chỉ còn 182 logic, không chứa nổi một hàng ô — ô rơi dưới đáy canvas.
 */
const PHONE_STAGE: ZoneRect = { x: 16, y: 186, w: 508, h: 438 };
const FLOOR = 154;

/** Chiều cao cần cho `rows` hàng ô sàn chạm cộng đệm trong của lưới. */
function rowsHeight(rows: number): number {
  return rows * FLOOR + (rows - 1) * SLOT_GAP_PX + 2 * SLOT_GAP_PX;
}

describe("splitHeroStage — vùng chính nhường chỗ cho lựa chọn (Task #321)", () => {
  it("2 lựa chọn ở 508x438: phần lựa chọn đủ 1 hàng ô sàn chạm (55% chỉ chừa 182)", () => {
    const { hero, rest } = splitHeroStage(PHONE_STAGE, true, {
      count: 2,
      touchFloor: FLOOR,
    });
    expect(rest.h).toBeGreaterThanOrEqual(rowsHeight(1));
    expect(rest.w).toBe(PHONE_STAGE.w);
    expect(hero.y + hero.h + SLOT_GAP_PX).toBe(rest.y);
    expect(rest.y + rest.h).toBe(PHONE_STAGE.y + PHONE_STAGE.h);
  });

  it("vùng chính không co dưới một cạnh sàn chạm", () => {
    const { hero } = splitHeroStage(PHONE_STAGE, true, {
      count: 4,
      touchFloor: FLOOR,
    });
    expect(hero.h).toBe(FLOOR);
  });

  it("sân khấu rộng hơn cao mà xếp dọc đã đủ: không chuyển sang chia ngang", () => {
    const { hero, rest } = splitHeroStage(PHONE_STAGE, true, {
      count: 3,
      touchFloor: FLOOR,
    });
    expect(hero.w).toBe(PHONE_STAGE.w);
    expect(rest.w).toBe(PHONE_STAGE.w);
  });

  it("lựa chọn vừa sẵn thì giữ tỉ lệ 55% mặc định", () => {
    const tall: ZoneRect = { x: 16, y: 150, w: 508, h: 900 };
    const { hero } = splitHeroStage(tall, true, { count: 2, touchFloor: 96 });
    expect(hero.h).toBe(Math.floor(tall.h * 0.55));
  });

  it("không có `fit` thì giữ cách chia cũ", () => {
    const { hero } = splitHeroStage(PHONE_STAGE, true);
    expect(hero.h).toBe(Math.floor(PHONE_STAGE.h * 0.55));
  });
});
