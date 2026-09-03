import path from "node:path";
import { defineConfig } from "vitest/config";
import {
  PARALLEL_DEFAULTS,
  SEQUENTIAL_DEFAULTS,
  workspaceAliases,
} from "./packages/config/vitest/base.ts";

// Gom test của mọi workspace project vào một lần chạy `pnpm test`.
// Mỗi package giữ vitest.config.ts riêng cho environment của nó, và tất cả
// đi qua `defineWorkspaceTest` của @mindkid/config để dùng chung một bảng alias.
//
// ❌ NEVER khai lại `fileParallelism`/`maxWorkers`/... ở đây: chúng phải khớp
// mặc định của `defineWorkspaceTest`, và hai bản sao thì một bản sẽ lệch.
export default defineConfig({
  resolve: { alias: workspaceAliases() },
  test: {
    projects: [
      path.resolve(import.meta.dirname, "apps/*"),
      path.resolve(import.meta.dirname, "packages/*"),
      // `scripts/` được typecheck bởi project `root` nhưng trước đây KHÔNG
      // thuộc project vitest nào — nên cổng bậc thang typecheck, thứ mọi cổng
      // khác dựa vào, là mã duy nhất trong repo không có phép thử nào chạy.
      {
        test: {
          name: "scripts",
          root: path.resolve(import.meta.dirname, "scripts"),
          include: ["**/*.{test,spec}.ts"],
          ...PARALLEL_DEFAULTS,
        },
      },
    ],
    ...SEQUENTIAL_DEFAULTS,
  },
});
