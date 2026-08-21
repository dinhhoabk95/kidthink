import path from "node:path";
import { defineConfig } from "vitest/config";
import { workspaceAliases } from "./packages/config/vitest/base.ts";

// Gom test của mọi workspace project vào một lần chạy `pnpm test`.
// Mỗi package giữ vitest.config.ts riêng cho environment của nó, và tất cả
// đi qua `defineWorkspaceTest` của @mindkid/config để dùng chung một bảng alias.
export default defineConfig({
  resolve: { alias: workspaceAliases() },
  test: {
    projects: [
      path.resolve(import.meta.dirname, "apps/*"),
      path.resolve(import.meta.dirname, "packages/*"),
    ],
    fileParallelism: false,
    maxWorkers: 1,
    maxConcurrency: 1,
    sequence: { concurrent: false },
  },
});
