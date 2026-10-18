import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  scanAppDirectoriesForRawFetchCalls,
  scanFilesForRawFetchCalls,
} from "./api-error-client.ts";

const ERR_RAW_FETCH_VIOLATION = /BR-AEC-02 VIOLATION/;

describe("API Error Client Gate Suite (BR-AEC-02)", () => {
  it("BR-AEC-02: phát hiện và chặn khi file .vue hoặc .ts gọi trực tiếp $fetch hoặc globalThis.$fetch ngoài wrapper cho phép", () => {
    const cleanFiles = [
      {
        filePath: "apps/web/app/pages/me/index.vue",
        content: `
          const apiFetch = useApi();
          await apiFetch("/api/users/me");
        `,
      },
      {
        filePath: "apps/web/app/composables/use-api.ts",
        content: `
          export function useApi() {
            return $fetch.create({ credentials: "include" });
          }
        `,
      },
      {
        filePath: "apps/admin/app/composables/use-api-client.ts",
        content: `
          export function useApiClient() {
            return $fetch("/api/managers/me");
          }
        `,
      },
    ];

    expect(() => scanFilesForRawFetchCalls(cleanFiles)).not.toThrow();

    const dirtyVueFile = [
      {
        filePath: "apps/web/app/pages/me/index.vue",
        content: `
          <script setup lang="ts">
          const data = await $fetch("/api/users/me");
          </script>
        `,
      },
    ];

    expect(() => scanFilesForRawFetchCalls(dirtyVueFile)).toThrowError(
      ERR_RAW_FETCH_VIOLATION
    );

    const dirtyGenericFetchFile = [
      {
        filePath: "apps/web/app/pages/games/index.vue",
        content: `const res = await $fetch<{ ok: boolean }>("/api/guest/levels");`,
      },
    ];

    expect(() => scanFilesForRawFetchCalls(dirtyGenericFetchFile)).toThrowError(
      ERR_RAW_FETCH_VIOLATION
    );

    const dirtyGlobalFetchFile = [
      {
        filePath: "apps/web/app/components/kid/play-limit-modal.vue",
        content: `await globalThis.$fetch("/api/users/children/play-limit/unlock");`,
      },
    ];

    expect(() => scanFilesForRawFetchCalls(dirtyGlobalFetchFile)).toThrowError(
      ERR_RAW_FETCH_VIOLATION
    );
  });

  it("BR-AEC-02: toàn bộ apps/web/app và apps/admin/app không còn lời gọi $fetch trần ngoài wrapper chuẩn", () => {
    const webAppDir = path.resolve(import.meta.dirname, "../../app");
    const adminAppDir = path.resolve(import.meta.dirname, "../../../admin/app");

    expect(() =>
      scanAppDirectoriesForRawFetchCalls([webAppDir, adminAppDir])
    ).not.toThrow();
  });
});
