import { defineWorkspaceTest } from "./vitest/base.ts";

export default defineWorkspaceTest({
  test: { include: ["tests/**/*.test.ts"] },
});
