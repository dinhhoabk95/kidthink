import {
  defineWorkspaceTest,
  nuxtAppAliases,
  WORKSPACE_TEST_EXCLUDE,
  WORKSPACE_TEST_INCLUDE,
} from "@mindkid/config/vitest";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

/**
 * `tests/component/` và `tests/gates/` không đụng database (component mount,
 * gate quét nguồn) nên chạy song song với `database: false`; phần còn lại dùng
 * database thật và chạy tuần tự.
 */
const PARALLEL_TESTS = [
  "tests/component/**/*.{test,spec}.{ts,tsx}",
  "tests/gates/**/*.{test,spec}.{ts,tsx}",
] as const;

const shared = {
  // `tests/component/` mount component thật; không có plugin vue thì Vite coi
  // .vue là JS và vỡ ngay ở import.
  plugins: [vue()],
  resolve: {
    alias: nuxtAppAliases(import.meta.dirname),
  },
};

export default defineConfig({
  test: {
    projects: [
      defineWorkspaceTest(
        {
          ...shared,
          test: { name: "web:db", setupFiles: ["./tests/setup.ts"] },
        },
        {
          include: WORKSPACE_TEST_INCLUDE,
          exclude: [...WORKSPACE_TEST_EXCLUDE, ...PARALLEL_TESTS],
        }
      ),
      defineWorkspaceTest(
        {
          ...shared,
          test: { name: "web:parallel", setupFiles: ["./tests/setup.ts"] },
        },
        { database: false, include: PARALLEL_TESTS }
      ),
    ],
  },
});
