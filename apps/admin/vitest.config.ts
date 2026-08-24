import { defineWorkspaceTest, nuxtAppAliases } from "@mindkid/config/vitest";

export default defineWorkspaceTest({
  resolve: {
    alias: nuxtAppAliases(import.meta.dirname),
  },
  test: { include: ["tests/**/*.test.ts"] },
});
