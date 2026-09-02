import { describe, expect, it } from "vitest";
import type { InlineConfig } from "vitest/node";
import {
  defineWorkspaceTest,
  PARALLEL_DEFAULTS,
  SEQUENTIAL_DEFAULTS,
} from "../vitest/base.ts";

/**
 * Cổng cho cờ `database` của `defineWorkspaceTest` (Task #204, đợt 1).
 *
 * Bài quan trọng nhất ở đây là **ca âm mặc định**: gọi `defineWorkspaceTest()`
 * không tham số phải ra cấu hình TUẦN TỰ và CÓ `globalSetup`. Nếu một lần sửa
 * nào đó lật mặc định sang song song, mọi workspace quên khai cờ sẽ lặng lẽ
 * chạy song song trên cùng một database thật — đúng dạng hỏng mà
 * `AGENTS.md` mô tả: "chạy riêng từng workspace thì xanh; chạy gộp ở gốc thì
 * test tích hợp DB timeout 30 s".
 *
 * Cấm — NEVER thay bài này bằng phép so sánh cả object: nó phải đỏ vì đúng
 * thuộc tính đã đổi, chứ không đỏ vì ai đó thêm một khoá vô hại.
 */

/** `test` của config trả về — tách ra để không rải optional-chaining khắp bài. */
function testConfigOf(config: { test?: InlineConfig }): InlineConfig {
  const { test } = config;
  if (test === undefined) {
    throw new Error(
      "defineWorkspaceTest trả về config không có khối `test` — hợp đồng đã vỡ."
    );
  }
  return test;
}

const DEV_DATABASE_NAME = "mindkid";

describe("defineWorkspaceTest — cờ database (Task #204)", () => {
  describe("mặc định (không khai cờ) — chiều fail-safe", () => {
    const config = testConfigOf(defineWorkspaceTest());

    it("giữ globalSetup: workspace quên khai vẫn được dựng + dọn database", () => {
      expect(config.globalSetup).toBeDefined();
      expect(config.globalSetup).toHaveLength(1);
    });

    it("giữ chạy tuần tự: fileParallelism tắt, đúng một worker, pool forks", () => {
      expect(config.fileParallelism).toBe(SEQUENTIAL_DEFAULTS.fileParallelism);
      expect(config.fileParallelism).toBe(false);
      expect(config.maxWorkers).toBe(1);
      expect(config.pool).toBe("forks");
    });

    it("trỏ vào database test, Cấm — NEVER trỏ vào database dev", () => {
      const { env } = config;
      expect(env?.DATABASE_URL).toContain("_test");
      expect(new URL(String(env?.DATABASE_URL)).pathname).not.toBe(
        `/${DEV_DATABASE_NAME}`
      );
    });
  });

  describe("database: true khai tường minh — giống hệt mặc định", () => {
    it("cho cùng pool và cùng số worker", () => {
      const explicit = testConfigOf(
        defineWorkspaceTest({}, { database: true })
      );
      const implicit = testConfigOf(defineWorkspaceTest());
      expect(explicit.pool).toBe(implicit.pool);
      expect(explicit.maxWorkers).toBe(implicit.maxWorkers);
      expect(explicit.globalSetup).toEqual(implicit.globalSetup);
    });
  });

  describe("database: false — nhóm thuần", () => {
    const config = testConfigOf(defineWorkspaceTest({}, { database: false }));

    it("bỏ globalSetup — đó là ~11 s thuế cố định mỗi lần gọi vitest", () => {
      expect(config.globalSetup).toBeUndefined();
    });

    it("chạy song song giữa các file bằng pool threads", () => {
      expect(config.fileParallelism).toBe(true);
      expect(config.pool).toBe("threads");
      expect(config.maxWorkers).toBe(PARALLEL_DEFAULTS.maxWorkers);
      expect(config.maxWorkers).toBeGreaterThan(1);
    });

    it("giữ isolate:true — đổi nó là đổi ngữ nghĩa, không phải chỉnh tốc độ", () => {
      // `isolate:false` đo được NHANH HƠN (9,0 s vs 16,3 s trên game-engine),
      // nên sức ép bật nó là có thật. Bài này chặn việc bật vì con số: tắt
      // isolate là bỏ ranh giới module giữa các file test, và một lượt xanh
      // không chứng minh được không có rò state — lỗi đó phụ thuộc thứ tự chạy.
      expect(PARALLEL_DEFAULTS.isolate).toBe(true);
      expect(config.isolate).toBe(true);
    });

    it("giữ test trong cùng một file chạy nối đuôi", () => {
      expect(config.sequence?.concurrent).toBe(false);
    });

    it("trỏ DATABASE_URL vào database KHÔNG tồn tại, không phải database dev", () => {
      const { env } = config;
      const url = new URL(String(env?.DATABASE_URL));
      // Kết nối lỡ mở ra phải ĐỎ, chứ Cấm — NEVER âm thầm ghi vào dev.
      expect(url.pathname).not.toBe(`/${DEV_DATABASE_NAME}`);
      expect(url.pathname).not.toBe(`/${DEV_DATABASE_NAME}_test`);
      // Loopback để guard BR-TST-05 vẫn đúng nếu có đường mã nào chạm tới.
      expect(url.hostname).toBe("127.0.0.1");
      expect(env?.DATABASE_URL_APP).toBe(env?.DATABASE_URL);
    });
  });

  describe("Cấm — NEVER khoá cấu hình chết của vitest 3", () => {
    /**
     * Ca âm cho một dạng xanh giả đã đo: spread một object `as const` vào `test:`
     * KHÔNG kích hoạt excess property check, nên `minWorkers` và
     * `forks: { singleFork: true }` sống sót qua lần nâng lên vitest 4 mà không
     * cổng nào báo — vitest chỉ lặng lẽ bỏ qua chúng.
     */
    const REMOVED_IN_VITEST_4 = [
      "minWorkers",
      "forks",
      "threads",
      "poolOptions",
    ] as const;

    it("SEQUENTIAL_DEFAULTS không còn khoá nào bị vitest 4 bỏ qua", () => {
      const keys: readonly string[] = Object.keys(SEQUENTIAL_DEFAULTS);
      for (const dead of REMOVED_IN_VITEST_4) {
        expect(keys).not.toContain(dead);
      }
    });

    it("PARALLEL_DEFAULTS không còn khoá nào bị vitest 4 bỏ qua", () => {
      const keys: readonly string[] = Object.keys(PARALLEL_DEFAULTS);
      for (const dead of REMOVED_IN_VITEST_4) {
        expect(keys).not.toContain(dead);
      }
    });

    it("thứ thật sự ép tuần tự là fileParallelism, không phải singleFork", () => {
      // `singleFork` đã chết; nếu ai đó gỡ dòng dưới thì nhóm DB chạy song song
      // trên cùng một database thật mà không có gì báo.
      expect(SEQUENTIAL_DEFAULTS.fileParallelism).toBe(false);
    });
  });

  describe("overrides của workspace vẫn thắng", () => {
    it("workspace ép fileParallelism:false thì cờ database:false không lấn", () => {
      const config = testConfigOf(
        defineWorkspaceTest(
          { test: { fileParallelism: false } },
          { database: false }
        )
      );
      expect(config.fileParallelism).toBe(false);
    });
  });
});
