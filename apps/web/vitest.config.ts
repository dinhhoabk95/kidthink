import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "#imports": path.resolve(import.meta.dirname, "./tests/mock-imports.ts"),
    },
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    sequence: {
      concurrent: false,
    },
  },
});
