import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@kidthink/adaptive": path.resolve(
        import.meta.dirname,
        "../packages/adaptive/src/index.ts"
      ),
      "@kidthink/db": path.resolve(
        import.meta.dirname,
        "../packages/db/src/index.ts"
      ),
      "@kidthink/shared": path.resolve(
        import.meta.dirname,
        "../packages/shared/src/index.ts"
      ),
      "@kidthink/config": path.resolve(
        import.meta.dirname,
        "../packages/config/src/index.ts"
      ),
      "drizzle-orm": path.resolve(
        import.meta.dirname,
        "../packages/db/node_modules/drizzle-orm"
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
