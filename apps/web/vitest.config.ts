import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "#imports": path.resolve(import.meta.dirname, "./tests/mock-imports.ts"),
      "@mindkid/config": path.resolve(
        import.meta.dirname,
        "../../packages/config/src/index.ts"
      ),
      "@mindkid/storage": path.resolve(
        import.meta.dirname,
        "../../packages/storage/src/index.ts"
      ),
    },
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30_000,
    sequence: {
      concurrent: false,
    },
  },
});
