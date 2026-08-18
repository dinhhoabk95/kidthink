import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@mindkid/adaptive": path.resolve(
        import.meta.dirname,
        "../packages/adaptive/src/index.ts"
      ),
      "@mindkid/db": path.resolve(
        import.meta.dirname,
        "../packages/db/src/index.ts"
      ),
      "@mindkid/shared": path.resolve(
        import.meta.dirname,
        "../packages/shared/src/index.ts"
      ),
      "@mindkid/config": path.resolve(
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
