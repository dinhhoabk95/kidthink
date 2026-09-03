import { defineWorkspaceTest } from "@mindkid/config/vitest";

export default defineWorkspaceTest(
  {
    test: {
      testTimeout: 60_000,
      hookTimeout: 60_000,
    },
  },
  { database: false }
);
