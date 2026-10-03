import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Task #277 Checkpoint 1 — lỗi QA 844x390 (2026-10-03). Trình duyệt thật
 * cho thấy ba nguyên nhân CSS: HUD cao cố định 5.5rem (88 px) trong khi nút là
 * 96 px nên bị cắt mép trên; `.game-canvas` chặn `85vh - 20px` (311 px) cao hơn
 * chỗ còn lại (250 px) nên canvas tràn đáy; `.main-arena` thiếu `min-height: 0`
 * nên phần flex không co dưới cao nội dung. happy-dom không dựng layout, nên
 * test đọc luật CSS; hộp thật đo bằng Playwright (README QA).
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const SURFACE_CSS = resolve(HERE, "../../app/assets/css/play-surface.css");
const LEGACY_FIXTURE = resolve(HERE, "fixtures/play-surface-legacy-arena.css");

const AUTO_HEIGHT = /(^|[\s;])height:\s*auto/;
const ZERO_MIN_HEIGHT = /min-height:\s*0\s*;/;
const VH_MAX_HEIGHT = /max-height:[^;]*vh/;

/** Khai báo của luật không nằm trong `@media` (cấp cao nhất của file). */
function topLevelDeclarations(css: string, selector: string): string {
  const withoutMedia = css.replace(
    /@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g,
    ""
  );
  const escaped = selector.replace(/\./g, "\\.");
  const match = new RegExp(
    `(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`,
    "m"
  ).exec(withoutMedia);
  return match?.[1] ?? "";
}

function findArenaViolations(css: string): string[] {
  const violations: string[] = [];
  const hud = topLevelDeclarations(css, ".top-hud-bar");
  if (!AUTO_HEIGHT.test(hud)) {
    violations.push("HUD cao cố định, nút 96px bị cắt");
  }
  if (!ZERO_MIN_HEIGHT.test(topLevelDeclarations(css, ".main-arena"))) {
    violations.push(".main-arena thiếu min-height: 0");
  }
  if (VH_MAX_HEIGHT.test(topLevelDeclarations(css, ".game-canvas"))) {
    violations.push(".game-canvas chặn theo vh, tràn đáy khung");
  }
  return violations;
}

describe("play-surface.css — điện thoại ngang 844x390", () => {
  it("HUD theo nút, arena co được, canvas không chặn theo vh", () => {
    expect(findArenaViolations(readFileSync(SURFACE_CSS, "utf8"))).toEqual([]);
  });

  it("ca âm: CSS cũ bị báo cả ba lỗi", () => {
    expect(findArenaViolations(readFileSync(LEGACY_FIXTURE, "utf8"))).toEqual([
      "HUD cao cố định, nút 96px bị cắt",
      ".main-arena thiếu min-height: 0",
      ".game-canvas chặn theo vh, tràn đáy khung",
    ]);
  });
});
