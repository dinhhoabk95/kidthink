import { defineWorkspaceTest } from "@mindkid/config/vitest";

export default defineWorkspaceTest({
  test: { include: ["tests/**/*.test.ts"] },
});
