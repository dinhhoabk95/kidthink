import { beforeAll, describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { ALL_TEMPLATE_CODES, preloadGameSession } from "#src/index";
import {
  ROUND_BELOW_CANVAS,
  ROUND_INSIDE,
  ROUND_ON_ACTION,
  ROUND_PAST_RIGHT_EDGE,
} from "./fixtures/shell-overflow-rounds.ts";
import {
  bandsOf,
  canvasBoxOf,
  casesFor,
  measureOverflow,
  overflowReasons,
  SHELL_VIEWPORTS,
  type ShellSurface,
} from "./helpers/shell-frame.ts";

/**
 * Phase 26 (`BR-LAY-13`): sức chứa đo ở **khung thật của shell**, hai bề mặt,
 * hai viewport điện thoại dọc, mọi band không bị cấm, mọi mẫu và level seed.
 *
 * Bậc thang đếm theo engine **và theo khung** (`band@viewport`): engine không
 * có trong sổ phải 0 ca tràn; có trong sổ thì đếm từng khung phải **đúng bằng**
 * số ghi (tăng là nợ mới, giảm là nợ đã gỡ: hạ số xuống). Sổ `preview` là
 * bề mặt Studio/QA chụp ảnh (canvas lấp viewport). Sổ `play` là trang chơi thật, hộp canvas nhỏ hơn viewport vì HUD,
 * đệm và khung gỗ — nợ ở đây lớn vì ô ở sàn chạm 96/76/64 px CSS không vừa hộp
 * ~300 px; cần quyết định sản phẩm (giảm ô hoặc phân trang) cho từng engine
 * trước khi gỡ, nên chỉ đóng băng, không nới.
 */
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
const SURFACES: readonly ShellSurface[] = ["preview", "play"];

/** Khoá của sổ nợ: `band@viewport`, ví dụ `3-4@360x640`. */
type FrameKey = string;

const KNOWN_SHELL_OVERFLOW: Readonly<
  Record<
    ShellSurface,
    Readonly<Record<string, Readonly<Record<FrameKey, number>>>>
  >
> = {
  // Ô ở sàn chạm tràn mép ngang/dọc hoặc đè nút. GT-001: 5 vật nguồn một hàng
  // (5×96 + 4×16 > 508 logic) ở band 3-4/4-5 và 360 px. Chưa có quyết định sản
  // phẩm cho từng engine; chỉ đóng băng, không nới. Số đếm gồm từng vòng của
  // level seed (`rounds[]`), không chỉ `content_pack` cấp level.
  preview: {
    "GT-005": { "3-4@360x640": 110 },
    "GT-011": { "3-4@360x640": 1 },
    "GT-015": { "3-4@360x640": 12, "3-4@390x844": 12 },
    "GT-021": { "3-4@360x640": 12, "3-4@390x844": 12 },
  },
  // Hộp canvas đo trên Chromium (360x640: 300x473/493/505 CSS theo band
  // 3-4/4-5/5-6): bước ô 96/76/64 px CSS chỉ chứa 2-3 cột và 3-5 hàng. GT-013
  // band 3-4 ở 360 px: ba cột 96 px cộng khe vẫn rộng hơn 300 px. GT-035 cần
  // lưới 3 hàng + hàng lệnh + khay lệnh, quá 4 hàng của hộp 300x505.
  play: {
    "GT-005": { "3-4@360x640": 205, "4-5@360x640": 110 },
    "GT-007": { "3-4@360x640": 240 },
    "GT-008": { "3-4@360x640": 12 },
    "GT-009": { "3-4@360x640": 96 },
    "GT-010": { "3-4@360x640": 40 },
    "GT-011": { "3-4@360x640": 66, "4-5@360x640": 1 },
    "GT-013": { "3-4@360x640": 72 },
    "GT-015": {
      "3-4@360x640": 54,
      "3-4@390x844": 12,
      "4-5@360x640": 12,
      "4-5@390x844": 12,
    },
    "GT-016": { "3-4@360x640": 6 },
    "GT-017": { "3-4@360x640": 24, "3-4@390x844": 3 },
    "GT-021": { "3-4@360x640": 12, "3-4@390x844": 12, "4-5@360x640": 12 },
    "GT-025": { "3-4@360x640": 2 },
    "GT-029": { "4-5@360x640": 1 },
    "GT-035": { "5-6@360x640": 41 },
    "GT-036": { "5-6@360x640": 18 },
    "GT-037": { "4-5@360x640": 3 },
  },
};

function overflowByFrame(
  code: string,
  surface: ShellSurface
): Record<FrameKey, number> {
  const counts: Record<FrameKey, number> = {};
  for (const band of bandsOf(code, BANDS)) {
    for (const viewport of SHELL_VIEWPORTS) {
      const box = canvasBoxOf(viewport, band, surface);
      for (const { config } of casesFor(code, band)) {
        if (measureOverflow(code, config, band, box).length > 0) {
          const key = `${band}@${viewport.name}`;
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
    }
  }
  return counts;
}

describe("khung thật của shell (BR-LAY-13)", () => {
  // Đo trên Chromium, trang `/play/<code>` thật (Phase 26): HUD một hàng cao
  // 115/95/83 px theo sàn 96/76/64, arena đệm 8/16/16, khay gỗ đệm 10 + viền 4.
  it.each([
    ["360x640", "3-4", { w: 300, h: 473 }],
    ["360x640", "4-5", { w: 300, h: 493 }],
    ["360x640", "5-6", { w: 300, h: 505 }],
    ["390x844", "3-4", { w: 330, h: 677 }],
    ["390x844", "4-5", { w: 330, h: 697 }],
    ["390x844", "5-6", { w: 330, h: 709 }],
  ] as const)(
    "hộp canvas play %s band %s khớp số đo trình duyệt",
    (name, band, box) => {
      const viewport = SHELL_VIEWPORTS.find((v) => v.name === name);
      if (!viewport) {
        throw new Error(`Thiếu viewport ${name}`);
      }
      expect(canvasBoxOf(viewport, band, "play")).toEqual(box);
      expect(canvasBoxOf(viewport, band, "preview")).toEqual({
        w: viewport.w,
        h: viewport.h,
      });
    }
  );
});

describe("ca âm: overflowReasons bắt từng kiểu tràn (BR-LAY-13)", () => {
  it("ô gọn trong sân khấu thì không tràn", () => {
    expect(overflowReasons(ROUND_INSIDE, true)).toEqual([]);
  });

  it("ô thò dưới đáy canvas là tràn, kể cả khi không đè nút", () => {
    expect(overflowReasons(ROUND_BELOW_CANVAS, true)).toEqual(["ngoài canvas"]);
    expect(overflowReasons(ROUND_BELOW_CANVAS, false)).toEqual([
      "ngoài canvas",
    ]);
  });

  it("ô thò mép phải canvas là tràn", () => {
    expect(overflowReasons(ROUND_PAST_RIGHT_EDGE, false)).toEqual([
      "ngoài canvas",
    ]);
  });

  it("ô đè nút hành động là tràn khi engine có nút, không khi không có", () => {
    expect(overflowReasons(ROUND_ON_ACTION, true)).toEqual([
      "đè nút hành động",
    ]);
    expect(overflowReasons(ROUND_ON_ACTION, false)).toEqual([]);
  });
});

describe.each(ALL_TEMPLATE_CODES)("%s — vừa khung thật", (code) => {
  beforeAll(async () => {
    await preloadGameSession(code);
  });

  it.each(SURFACES)("bề mặt %s: số ca tràn khớp sổ nợ", (surface) => {
    // Khớp đúng từng khung: tăng là nợ mới, giảm là phải hạ sổ. Đếm gộp cả
    // engine thì lành một band và hỏng band khác vẫn xanh.
    const known = KNOWN_SHELL_OVERFLOW[surface][code] ?? {};
    expect(overflowByFrame(code, surface)).toEqual(known);
  });
});
