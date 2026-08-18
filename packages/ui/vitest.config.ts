import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@mindkid/game-engine": path.resolve(
        import.meta.dirname,
        "../game-engine/src/index.ts"
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
