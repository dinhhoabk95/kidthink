import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * QA 2026-10-03 (#280): màn thưởng ở 844x390 bị cắt sao/Gấu ở trên và hàng
 * nút ở dưới. happy-dom không dựng layout nên test đọc luật CSS; hộp thật đo
 * bằng Playwright (`docs/qa/engine-captures/2026-10-03/after-modal-album-fix/`).
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const MODAL_VUE = resolve(HERE, "../../app/components/kid/victory-modal.vue");
const LEGACY_FIXTURE = resolve(HERE, "fixtures/victory-modal-legacy.css");

const MEDIA_HEAD = "@media (max-height: 500px) and (orientation: landscape)";
const TOUCH_FLOOR_PX = 96;
const PX_VALUE = /(\d+)px/;
const MIN_HEIGHT = /min-height:\s*([^;]*);/;
const DVH = /100dvh/;
const OVERFLOW_AUTO = /overflow-y:\s*auto/;
const MARGIN_TOP_ZERO = /margin-top:\s*0\s*;/;
const POSITION_STATIC = /position:\s*static/;
const GRID_COLUMNS = /grid-template-columns/;
const MISSING_BLOCK = `thiếu ${MEDIA_HEAD}`;

/** Thân khối `@media` ngang thấp (đếm ngoặc vì bên trong có luật lồng). */
function shortLandscapeBlock(css: string): string {
  const start = css.indexOf(MEDIA_HEAD);
  if (start === -1) {
    return "";
  }
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") {
      depth += 1;
    } else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(open + 1, i);
      }
    }
  }
  return "";
}

function rule(block: string, selector: string): string {
  const escaped = selector.replace(/\./g, "\\.");
  // Chấp nhận selector đứng một mình hoặc trong danh sách `a,\n b {`.
  const pattern = new RegExp(
    `(?:^|[},])\\s*${escaped}\\s*(?:,[^{}]*)?\\{([^}]*)\\}`,
    "m"
  );
  return pattern.exec(block)?.[1] ?? "";
}

function floorPx(declarations: string): number {
  const value = MIN_HEIGHT.exec(declarations)?.[1] ?? "";
  const match = PX_VALUE.exec(value);
  return match ? Number(match[1]) : 0;
}

function findShortLandscapeViolations(css: string): string[] {
  const block = shortLandscapeBlock(css);
  if (!block) {
    return [MISSING_BLOCK];
  }
  const violations: string[] = [];
  const overlay = rule(block, ".victory-overlay");
  if (!(DVH.test(overlay) && OVERFLOW_AUTO.test(overlay))) {
    violations.push("overlay thiếu 100dvh hoặc cuộn dự phòng");
  }
  if (!MARGIN_TOP_ZERO.test(rule(block, ".modal-wrapper"))) {
    violations.push("wrapper còn chừa 3.5rem cho Gấu thò lên");
  }
  if (!POSITION_STATIC.test(rule(block, ".mascot-container"))) {
    violations.push("Gấu vẫn absolute, thò ra ngoài khung");
  }
  if (!GRID_COLUMNS.test(rule(block, ".clay-card"))) {
    violations.push("thẻ chưa chia hai cột (nút bên phải)");
  }
  for (const selector of [".btn-continue", ".btn-replay"]) {
    if (floorPx(rule(block, selector)) < TOUCH_FLOOR_PX) {
      violations.push(`${selector} nhỏ hơn sàn chạm 96px`);
    }
  }
  return violations;
}

describe("victory-modal.vue — điện thoại ngang 844x390", () => {
  it("bố cục hai cột, nút giữ sàn chạm 96px, cuộn dự phòng", () => {
    expect(
      findShortLandscapeViolations(readFileSync(MODAL_VUE, "utf8"))
    ).toEqual([]);
  });

  it("ca âm: CSS cũ chỉ có bố cục dọc bị báo thiếu khối ngang thấp", () => {
    expect(
      findShortLandscapeViolations(readFileSync(LEGACY_FIXTURE, "utf8"))
    ).toEqual([MISSING_BLOCK]);
  });

  it("ca âm: khối ngang thấp co nút dưới 96px thì bị bắt", () => {
    const shrunk = `${MEDIA_HEAD} {
      .victory-overlay { height: 100dvh; overflow-y: auto; }
      .modal-wrapper { margin-top: 0; }
      .mascot-container { position: static; }
      .clay-card { display: grid; grid-template-columns: 1fr auto; }
      .btn-continue { min-height: 96px; }
      .btn-replay { min-height: 56px; }
    }`;
    expect(findShortLandscapeViolations(shrunk)).toEqual([
      ".btn-replay nhỏ hơn sàn chạm 96px",
    ]);
  });
});
