import { defineWorkspaceTest } from "@mindkid/config/vitest";

export default defineWorkspaceTest(
  {
    test: {
      pool: "forks",
    },
  },
  { database: false }
);
