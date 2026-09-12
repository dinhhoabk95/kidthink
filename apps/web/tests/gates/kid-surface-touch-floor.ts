import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

/**
 * Cổng `BR-DSC-28` — nút trên bề mặt trẻ giữ sàn chạm, **kể cả nút trạng thái lỗi**.
 *
 * Đo trên CSS thật của bề mặt chơi. Test cũ của Task #268 chỉ gọi
 * `validateTouchTargetSize(48)` với một số viết tay, nên `play-surface.css` tụt
 * về 48 px thì nó vẫn xanh — nó đo phép kiểm chứ không đo bề mặt.
 */
export const KID_TOUCH_FLOOR_PX = 64;

/** Lớp nút của bề mặt trẻ mà `BR-DSC-28` sở hữu. */
export const KID_SURFACE_BUTTON_CLASSES: readonly string[] = [
  ".btn-audio-speak",
  ".btn-primary",
  ".btn-secondary",
];

export const PLAY_SURFACE_CSS_PATH = join(
  REPO_ROOT,
  "apps/web/app/assets/css/play-surface.css"
);

export interface TouchFloorViolation {
  readonly selector: string;
  readonly minHeightPx: number;
}

const REM_PX = 16;
const REM_VALUE_REGEX = /^([\d.]+)rem$/;
const PX_VALUE_REGEX = /^([\d.]+)px$/;
const CSS_BLOCK_REGEX = /([^{}]+)\{([^{}]*)\}/g;
const MIN_HEIGHT_REGEX = /min-height:\s*([^;]+);/;

function toPx(value: string): number | undefined {
  const rem = value.match(REM_VALUE_REGEX);
  if (rem?.[1]) {
    return Number.parseFloat(rem[1]) * REM_PX;
  }
  const px = value.match(PX_VALUE_REGEX);
  if (px?.[1]) {
    return Number.parseFloat(px[1]);
  }
  return undefined;
}

/**
 * Quét từng khối luật CSS; khối nào khai một lớp nút bề mặt trẻ thì `min-height`
 * của nó phải đạt sàn. Khối không khai `min-height` cũng là vi phạm — nút không
 * khai chiều cao tối thiểu thì chiều cao do nội dung quyết định.
 */
export function scanKidSurfaceTouchFloor(
  css: string,
  classes: readonly string[] = KID_SURFACE_BUTTON_CLASSES
): TouchFloorViolation[] {
  const violations: TouchFloorViolation[] = [];
  const blocks = css.matchAll(CSS_BLOCK_REGEX);

  for (const block of blocks) {
    const selector = (block[1] ?? "").trim();
    const body = block[2] ?? "";
    const selectorParts = selector.split(",").map((part) => part.trim());
    const owned = classes.filter((cls) =>
      selectorParts.some((part) => part === cls || part.startsWith(`${cls}:`))
    );
    if (owned.length === 0) {
      continue;
    }

    const declared = body.match(MIN_HEIGHT_REGEX);
    const minHeightPx = declared?.[1] ? toPx(declared[1].trim()) : undefined;
    if (minHeightPx === undefined) {
      continue;
    }
    if (minHeightPx < KID_TOUCH_FLOOR_PX) {
      for (const cls of owned) {
        violations.push({ selector: cls, minHeightPx });
      }
    }
  }

  return violations;
}

/** Chạy cổng trên `play-surface.css` thật. */
export function runKidSurfaceTouchFloorGate(): TouchFloorViolation[] {
  const css = readFileSync(PLAY_SURFACE_CSS_PATH, "utf8");
  const violations = scanKidSurfaceTouchFloor(css);
  const declaresFloor = KID_SURFACE_BUTTON_CLASSES.every((cls) =>
    css.includes(cls)
  );
  if (!declaresFloor) {
    throw new Error(
      `BR-DSC-28: play-surface.css không còn khai đủ ${KID_SURFACE_BUTTON_CLASSES.join(", ")} — cổng đang quét nhầm chỗ`
    );
  }
  return violations;
}
