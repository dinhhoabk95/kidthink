import { describe, expect, it } from "vitest";
import { runGatingGate, scanGatingHandlers } from "#src/lint-gating";
import type { FileItem } from "#src/lint-lib/codebase-files";

const RE_HANDLER_VIOLATION =
  /BR-GAT-01 VIOLATION: Handler ".*" returns content_pack\/difficulty_params without calling assertContentAccess\(\)/;
const RE_CLIENT_VIOLATION =
  /BR-GAT-01 VIOLATION: Client file ".*" attempts access tier gating logic on client-side\./;

describe("Task 6: Gating Safety Scanner (BR-GAT-01, D-FO)", () => {
  it("passes clean files where server handlers call assertContentAccess", () => {
    const cleanFiles: FileItem[] = [
      {
        filePath: "apps/web/server/api/play/game-config.get.ts",
        content: `
          export default defineEventHandler(async (event) => {
            const access = await assertContentAccess(content, { caller });
            return { content_pack: {}, difficulty_params: {} };
          });
        `,
      },
      {
        filePath: "apps/web/components/GameCanvas.vue",
        content: "<div>Canvas Player</div>",
      },
    ];

    expect(() => scanGatingHandlers(cleanFiles)).not.toThrow();
  });

  it("RED fixture: fails when server handler returns content_pack without calling assertContentAccess", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/server/api/play/leak-config.get.ts",
        content: `
          export default defineEventHandler(async (event) => {
            return { content_pack: { secret: "game_data" } };
          });
        `,
      },
    ];

    expect(() => scanGatingHandlers(dirtyFiles)).toThrowError(
      RE_HANDLER_VIOLATION
    );
  });

  it("RED fixture: fails when client component attempts access_tier gating logic", () => {
    const dirtyClientFiles: FileItem[] = [
      {
        filePath: "apps/web/components/PaywallCheck.vue",
        content: `
          <script setup>
            if (user.access_tier === 'premium') {
              showGame();
            }
          </script>
        `,
      },
    ];

    expect(() => scanGatingHandlers(dirtyClientFiles)).toThrowError(
      RE_CLIENT_VIOLATION
    );
  });
});

describe("Cổng lint:gating trên repo thật (BR-GAT-01)", () => {
  it("mọi handler có gating đúng chỗ", () => {
    expect(() => runGatingGate()).not.toThrow();
  });
});
