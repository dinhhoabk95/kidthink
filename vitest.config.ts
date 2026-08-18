import path from "node:path";
import { defineConfig } from "vitest/config";

// Gom test của mọi workspace project vào một lần chạy `pnpm test`.
// Mỗi package giữ vitest.config.ts riêng cho environment của nó
// (packages/game-engine sẽ cần happy-dom, packages/db cần PG thật).
export default defineConfig({
  resolve: {
    alias: {
      "@mindkid/config": path.resolve(
        import.meta.dirname,
        "./packages/config/src/index.ts"
      ),
      "@mindkid/shared": path.resolve(
        import.meta.dirname,
        "./packages/shared/src/index.ts"
      ),
      "@mindkid/taxonomy": path.resolve(
        import.meta.dirname,
        "./packages/taxonomy/src/index.ts"
      ),
      "@mindkid/emoji": path.resolve(
        import.meta.dirname,
        "./packages/emoji/src/index.ts"
      ),
      "@mindkid/db": path.resolve(
        import.meta.dirname,
        "./packages/db/src/index.ts"
      ),
      "@mindkid/game-engine": path.resolve(
        import.meta.dirname,
        "./packages/game-engine/src/index.ts"
      ),
      "@mindkid/notification": path.resolve(
        import.meta.dirname,
        "./packages/notification/src/index.ts"
      ),
      "@mindkid/storage": path.resolve(
        import.meta.dirname,
        "./packages/storage/src/index.ts"
      ),
      "@mindkid/adaptive": path.resolve(
        import.meta.dirname,
        "./packages/adaptive/src/index.ts"
      ),
      "@mindkid/ui": path.resolve(
        import.meta.dirname,
        "./packages/ui/src/index.ts"
      ),
      "#imports": path.resolve(
        import.meta.dirname,
        "./apps/web/tests/mock-imports.ts"
      ),
    },
  },
  test: {
    projects: [
      path.resolve(import.meta.dirname, "apps/*"),
      path.resolve(import.meta.dirname, "packages/*"),
      path.resolve(import.meta.dirname, "scripts"),
    ],
    fileParallelism: false,
    maxWorkers: 1,
    maxConcurrency: 1,
    sequence: {
      concurrent: false,
    },
  },
});
