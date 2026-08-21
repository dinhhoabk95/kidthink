import path from "node:path";
import { defineWorkspaceTest } from "@mindkid/config/vitest";

// D-BX: dọn dữ liệu integration test đúng một lần trước mỗi `vitest run`, không cộng
// dồn qua các lần chạy. Chi tiết và lý do: tests/global-setup.ts.
export default defineWorkspaceTest({
  test: {
    globalSetup: [path.resolve(import.meta.dirname, "./tests/global-setup.ts")],
    setupFiles: [path.resolve(import.meta.dirname, "./tests/setup.ts")],
  },
});
