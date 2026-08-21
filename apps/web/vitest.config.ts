import { defineWorkspaceTest } from "@mindkid/config/vitest";

export default defineWorkspaceTest({
  test: { setupFiles: ["./tests/setup.ts"] },
});
