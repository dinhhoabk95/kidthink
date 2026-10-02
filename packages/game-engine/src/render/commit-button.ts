/**
 * Nút **Xong** — đường `commit` trên canvas của các engine chấm theo tập chọn
 * (`engine-render-contract.md` §12 lớp 2, nhịp `N1` của phiếu engine).
 *
 * Hình nút suy từ `LogicSpace` như mọi hình học khác, không hằng số màn hình:
 * ngồi dưới đáy cảnh, dưới vùng nội dung mà lưới slot dùng
 * (`CONTENT_TOP_PX` → `h - SAFE_MARGIN_PX`).
 */

import type { AgeBand } from "#src/contracts/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { getTouchFloor, type LogicSpace } from "../layout/constants.js";
import type { ZoneRect } from "../layout/stage-zones.js";
import { canvasFontPx } from "./type-scale.js";

/** Id entity của nút trong `getView()` — đường bàn phím và screen reader. */
export const COMMIT_ENTITY_ID = "commit:done";

/** Nhãn đọc được của nút, dùng cho cả canvas lẫn nút DOM trợ năng. */
export const COMMIT_BUTTON_LABEL = "Xong";

/**
 * Lề đáy của nút — hẹp hơn `SAFE_MARGIN_PX` (32) có chủ đích. Ở khung ngang
 * nhỏ nhất (960x540), đáy lưới `grid-2x4` hai hàng nằm ở 424 px; lề 32 sẽ đẩy
 * đỉnh nút lên 432 và chỉ chừa 8 px thở giữa vật và nút.
 */
const BUTTON_BOTTOM_MARGIN_PX = 16;

/** Bề ngang tối đa: nhãn ngắn, nút rộng quá thì át lưới vật. */
const BUTTON_MAX_WIDTH_PX = 176;

const BUTTON_SIDE_MARGIN_PX = 32;

const BUTTON_CORNER_RADIUS_PX = 18;

/** Nút mờ khi chưa chọn vật nào (`N1`) — vẫn thấy, nhưng rõ là chưa bấm được. */
const DISABLED_ALPHA = 0.45;

export interface CommitButtonRect {
  /** Tâm nút theo không gian logic. */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Hình chữ nhật nút Xong. Cao bằng đúng sàn chạm của band tuổi
 * (`BR-A11-04`, `BR-ENG-05`) — nút là đích chạm như mọi đích chạm khác.
 */
export function commitButtonRect(
  space: LogicSpace,
  ageBand: AgeBand
): CommitButtonRect {
  const h = getTouchFloor(ageBand);
  const w = Math.min(BUTTON_MAX_WIDTH_PX, space.w - 2 * BUTTON_SIDE_MARGIN_PX);
  return {
    x: space.w / 2,
    y: space.h - BUTTON_BOTTOM_MARGIN_PX - h / 2,
    w,
    h,
  };
}

export interface CommitButtonOptions {
  /** `false` khi chưa có vật nào được chọn — vẽ mờ, không nhận chạm. */
  readonly enabled: boolean;
  readonly label?: string;
  /** Toạ độ rect: "center" (mặc định) hoặc "top-left" (cho StageZones.action). */
  readonly origin?: "center" | "top-left";
}

export function drawCommitButton(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  rect: CommitButtonRect | ZoneRect,
  options: CommitButtonOptions
): void {
  const space: LogicSpace = { w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT };
  const fontPx = canvasFontPx(space, "label", rs.viewport?.scale);
  const isTopLeft = options.origin === "top-left";
  const left = isTopLeft ? rect.x : rect.x - rect.w / 2;
  const top = isTopLeft ? rect.y : rect.y - rect.h / 2;
  const centerX = isTopLeft ? rect.x + rect.w / 2 : rect.x;
  const centerY = isTopLeft ? rect.y + rect.h / 2 : rect.y;
  const radius = Math.min(BUTTON_CORNER_RADIUS_PX, Math.floor(rect.h / 2));

  ctx.save();
  ctx.globalAlpha = options.enabled ? 1 : DISABLED_ALPHA;
  ctx.fillStyle = options.enabled
    ? designTokens.colors.cta[500]
    : designTokens.colors.surface[300];
  ctx.beginPath();
  ctx.roundRect(left, top, rect.w, rect.h, radius);
  ctx.fill();

  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.font = `bold ${fontPx}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(options.label ?? COMMIT_BUTTON_LABEL, centerX, centerY);
  ctx.restore();
}
