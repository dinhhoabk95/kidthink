import path from "node:path";
import { defineConfig } from "vitest/config";
import {
  SEQUENTIAL_DEFAULTS,
  workspaceAliases,
} from "./packages/config/vitest/base.ts";

export default defineConfig({
  resolve: { alias: workspaceAliases() },
  test: {
    projects: [
      path.resolve(import.meta.dirname, "apps/*"),
      path.resolve(import.meta.dirname, "packages/*"),
    ],
    ...SEQUENTIAL_DEFAULTS,
  },
});
