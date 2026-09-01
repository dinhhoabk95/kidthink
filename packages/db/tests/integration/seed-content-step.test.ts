import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { gameLevels } from "#src/schema/game";
import { seed } from "#src/seed";
import { SHIPPABLE_SEED_LEVELS } from "#src/seed-content/index";

/**
 * `pnpm db:seed` phải gieo cả nội dung, không chỉ master data.
 *
 * Trước 2026-08-30 nội dung nằm sau một lệnh riêng `db:seed:content` mà không
 * script nào gọi, nên một máy mới chạy `pnpm db:seed` xong vẫn có **0** trò
 * chơi và trang `/games` phải dựng từ một mảng hằng số 9 phần tử.
 */
describe.sequential("db:seed gieo cả nội dung", () => {
  it("ca âm: MINDKID_SEED_MASTER_ONLY=1 thì bỏ qua bước nội dung", async () => {
    const previous = process.env.MINDKID_SEED_MASTER_ONLY;
    process.env.MINDKID_SEED_MASTER_ONLY = "1";
    const startedAt = Date.now();
    try {
      await seed();
    } finally {
      if (previous === undefined) {
        delete process.env.MINDKID_SEED_MASTER_ONLY;
      } else {
        process.env.MINDKID_SEED_MASTER_ONLY = previous;
      }
    }

    // Bước nội dung là phần chậm nhất của seed; bỏ qua nó thì lượt chạy phải
    // ngắn hơn hẳn. Ngưỡng rộng để không phụ thuộc tốc độ máy.
    expect(Date.now() - startedAt).toBeLessThan(120_000);
  }, 180_000);

  it("sau seed(), số game level trong DB ít nhất bằng corpus gieo được", async () => {
    await seed();

    const db = getOwnerDb();
    const [row] = await db.select({ total: count() }).from(gameLevels);

    expect(SHIPPABLE_SEED_LEVELS.length).toBeGreaterThan(0);
    expect(row?.total ?? 0).toBeGreaterThanOrEqual(
      SHIPPABLE_SEED_LEVELS.length
    );
  }, 300_000);
});
