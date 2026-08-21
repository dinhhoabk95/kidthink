import { defineWorkspaceTest } from "@mindkid/config/vitest";

export default defineWorkspaceTest({
  test: { include: ["src/**/*.test.ts"] },
});
