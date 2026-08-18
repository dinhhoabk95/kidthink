import path from "node:path";
import { defineConfig } from "vitest/config";

// D-BX: dọn dữ liệu integration test đúng một lần trước mỗi `vitest run`, không cộng
// dồn qua các lần chạy. Chi tiết và lý do: tests/global-setup.ts.
export default defineConfig({
  resolve: {
    alias: {
      "@mindkid/shared": path.resolve(
        import.meta.dirname,
        "../shared/src/index.ts"
      ),
      "@mindkid/taxonomy": path.resolve(
        import.meta.dirname,
        "../taxonomy/src/index.ts"
      ),
      "@mindkid/emoji": path.resolve(
        import.meta.dirname,
        "../emoji/src/index.ts"
      ),
      "@mindkid/db": path.resolve(import.meta.dirname, "./src/index.ts"),
    },
  },
  test: {
    globalSetup: [path.resolve(import.meta.dirname, "./tests/global-setup.ts")],
    testTimeout: 30_000,
    fileParallelism: false,
    maxWorkers: 1,
    sequence: {
      concurrent: false,
    },
  },
});
