import { defineWorkspaceTest, nuxtAppAliases } from "@mindkid/config/vitest";

export default defineWorkspaceTest({
  resolve: {
    alias: nuxtAppAliases(import.meta.dirname),
  },
  test: { setupFiles: ["./tests/setup.ts"] },
});
