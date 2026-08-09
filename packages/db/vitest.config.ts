import { defineConfig } from "vitest/config";

// D-BX: dọn dữ liệu integration test đúng một lần trước mỗi `vitest run`, không cộng
// dồn qua các lần chạy. Chi tiết và lý do: tests/global-setup.ts.
export default defineConfig({
  test: {
    globalSetup: ["./tests/global-setup.ts"],
  },
});
