import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@kidthink/storage": path.resolve(
        import.meta.dirname,
        "../../packages/storage/src/index.ts"
      ),
      "@kidthink/db": path.resolve(
        import.meta.dirname,
        "../../packages/db/src/index.ts"
      ),
      "@kidthink/queue": path.resolve(
        import.meta.dirname,
        "../../packages/queue/src/index.ts"
      ),
      "@kidthink/shared": path.resolve(
        import.meta.dirname,
        "../../packages/shared/src/index.ts"
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
