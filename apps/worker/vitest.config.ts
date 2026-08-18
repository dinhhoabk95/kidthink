import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@mindkid/storage": path.resolve(
        import.meta.dirname,
        "../../packages/storage/src/index.ts"
      ),
      "@mindkid/db": path.resolve(
        import.meta.dirname,
        "../../packages/db/src/index.ts"
      ),
      "@mindkid/queue": path.resolve(
        import.meta.dirname,
        "../../packages/queue/src/index.ts"
      ),
      "@mindkid/shared": path.resolve(
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
