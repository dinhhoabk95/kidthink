import { describe, expect, it } from "vitest";
import { runKidSurfaceGate, scanKidSurfaceRules } from "#src/lint-kid-surface";
import type { FileItem } from "#src/lint-lib/codebase-files";

const RE_HPL_05 = /BR-HPL-05/;
const RE_PGT_05 = /BR-PGT-05/;
const RE_SCO_02 = /BR-SCO-02/;
const RE_FBK_01 = /BR-FBK-01/;
const RE_FBK_08 = /BR-FBK-08/;
const RE_PEN_03 = /BR-PEN-03/;
const RE_PEN_04 = /BR-PEN-04/;

describe("Task 3 — Cổng quét 'cấm trên bề mặt trẻ' (D-GQ)", () => {
  it("passes clean kid surface files", () => {
    const cleanFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: `
          <template>
            <div class="game-container">
              <GameCanvas />
            </div>
          </template>
        `,
      },
    ];

    expect(() => scanKidSurfaceRules(cleanFiles)).not.toThrow();
  });

  it("RED fixture: fails on prohibited 'chơi thêm' button (BR-HPL-05)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: "<button>Nút chơi thêm</button>",
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_HPL_05);
  });

  it("RED fixture: fails on forced streak pressure (BR-HPL-05)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: "const streak_bonus = 10;",
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_HPL_05);
  });

  it("RED fixture: fails on countdown pressure timer (BR-HPL-05)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: "let countdown_ms = 30000;",
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_HPL_05);
  });

  it("RED fixture: fails on return-bait notification text (BR-HPL-05)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: "<span>quay lại chơi ngay nhé</span>",
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_HPL_05);
  });

  it("RED fixture: fails on payment/pricing data on play surface (BR-PGT-05)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: "<div>package_price: 500000</div>",
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_PGT_05);
  });

  it("RED fixture: fails on numeric score display on play surface (BR-SCO-02)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: "<div>display_numeric_score</div>",
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_SCO_02);
  });

  it("RED fixture: fails on danger token / red color on canvas (BR-FBK-01)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: 'const tokenColor = "danger";',
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_FBK_01);
  });

  it("RED fixture: fails on reprimanding phrase (BR-FBK-08)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/[code].vue",
        content: "const msg = 'Sai rồi';",
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_FBK_08);
  });

  it("RED fixture: fails on text search input in kid catalog (BR-PEN-03)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/index.vue",
        content: '<input v-model="search_input_text" />',
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_PEN_03);
  });

  it("RED fixture: fails on filter dropdown in kid catalog (BR-PEN-03)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/index.vue",
        content: '<select name="filter_dropdown_text">',
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_PEN_03);
  });

  it("RED fixture: fails on upgrade plan button on kid surface (BR-PEN-04)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/index.vue",
        content: '<button class="upgrade_plan_button">Nâng cấp</button>',
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_PEN_04);
  });

  it("RED fixture: fails on price tag on kid surface (BR-PEN-04)", () => {
    const dirtyFiles: FileItem[] = [
      {
        filePath: "apps/web/app/pages/play/index.vue",
        content: '<span class="plan_price_tag">50.000đ</span>',
      },
    ];
    expect(() => scanKidSurfaceRules(dirtyFiles)).toThrowError(RE_PEN_04);
  });
});

describe("Cổng lint:kid-surface trên repo thật", () => {
  it("bề mặt trẻ em không vi phạm điều cấm nào", () => {
    expect(() => runKidSurfaceGate()).not.toThrow();
  });
});
