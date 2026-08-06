import { defineConfig } from "vitest/config";

// Gom test của mọi workspace project vào một lần chạy `pnpm test`.
// Mỗi package giữ vitest.config.ts riêng cho environment của nó
// (packages/game-engine sẽ cần happy-dom, packages/db cần PG thật).
export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*", "scripts"],
  },
});
