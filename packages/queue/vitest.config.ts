import {
  defineWorkspaceTest,
  LOCAL_RUNTIME_SETUP_FILE,
} from "@mindkid/config/vitest";

export default defineWorkspaceTest(
  { test: { setupFiles: [LOCAL_RUNTIME_SETUP_FILE] } },
  { database: false }
);
