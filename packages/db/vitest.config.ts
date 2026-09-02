import path from "node:path";
import { defineWorkspaceTest } from "@mindkid/config/vitest";

// `globalSetup` (dựng + dọn database test) đã nằm trong `defineWorkspaceTest`
// để không workspace nào chạy trên database dev vì quên khai. Chi tiết và lý
// do: tests/global-setup.ts.
export default defineWorkspaceTest({
  test: {
    setupFiles: [path.resolve(import.meta.dirname, "./tests/setup.ts")],
    fileParallelism: false,
    maxConcurrency: 1,
    sequence: {
      concurrent: false,
    },
  },
});
