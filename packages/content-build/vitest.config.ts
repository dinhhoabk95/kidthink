import {
  defineWorkspaceTest,
  WORKSPACE_TEST_EXCLUDE,
  WORKSPACE_TEST_INCLUDE,
} from "@mindkid/config/vitest";
import { defineConfig } from "vitest/config";

/**
 * Ba file integration ghi vào database thật nên chạy tuần tự; phần còn lại
 * (gate đọc nguồn, không mở kết nối) chạy song song với `database: false`.
 */
const DB_TESTS = [
  "tests/integration/game.test.ts",
  "tests/integration/roadmap-curricula.test.ts",
  "tests/integration/taxonomy-master.test.ts",
] as const;

const TIMEOUTS = { testTimeout: 60_000, hookTimeout: 60_000 } as const;

export default defineConfig({
  test: {
    projects: [
      defineWorkspaceTest(
        { test: { name: "content-build:db", ...TIMEOUTS } },
        { include: DB_TESTS }
      ),
      defineWorkspaceTest(
        { test: { name: "content-build:pure", ...TIMEOUTS } },
        {
          database: false,
          include: WORKSPACE_TEST_INCLUDE,
          exclude: [...WORKSPACE_TEST_EXCLUDE, ...DB_TESTS],
        }
      ),
    ],
  },
});
