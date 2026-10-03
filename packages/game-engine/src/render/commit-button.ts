/**
 * Nút **Xong** (dấu ✓, không chữ — `BR-FBK-12`) — đường `commit` trên canvas của các engine chấm theo tập chọn
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

/** Id entity của nút trong `getView()` — đường bàn phím và screen reader. */
export const COMMIT_ENTITY_ID = "commit:done";

/** Nhãn đọc được của nút — chỉ cho nút DOM trợ năng; canvas vẽ dấu ✓. */
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

/** Dấu ✓ chiếm tỉ lệ này của cạnh ngắn nút. */
const CHECK_ICON_RATIO = 0.5;

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

/**
 * Icon của nút hành động (`BR-PSZ-05`): ✓ nộp (mặc định), ▶ chạy chương trình
 * (GT-035), loa nghe mẫu (GT-034). Không chữ — trẻ chưa đọc (`BR-FBK-12`).
 */
export type CommitIcon = "check" | "play" | "listen";

export interface CommitButtonOptions {
  /** `false` khi chưa có vật nào được chọn — vẽ mờ, không nhận chạm. */
  readonly enabled: boolean;
  /** Toạ độ rect: "center" (mặc định) hoặc "top-left" (cho StageZones.action). */
  readonly origin?: "center" | "top-left";
  /** Bỏ trống là ✓. */
  readonly icon?: CommitIcon;
  /**
   * Gợi ý đang trỏ vào nút (`getHintTarget()` → `action`): vòng hổ phách nháy
   * quanh nút theo `timeMs`, vẽ tĩnh khi `reducedMotion`.
   */
  readonly hint?: { readonly timeMs: number; readonly reducedMotion: boolean };
}

const HINT_RING_WIDTH_PX = 5;
const HINT_RING_PAD_PX = 4;
const HINT_PULSE_PERIOD_MS = 1000;
const HINT_PULSE_MIN_ALPHA = 0.35;

/** Vòng hổ phách quanh nút khi gợi ý trỏ vào nút hành động. */
function drawHintRing(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  rect: { readonly w: number; readonly h: number },
  radius: number,
  hint: NonNullable<CommitButtonOptions["hint"]>
): void {
  const phase = (hint.timeMs % HINT_PULSE_PERIOD_MS) / HINT_PULSE_PERIOD_MS;
  const pulse = hint.reducedMotion
    ? 1
    : HINT_PULSE_MIN_ALPHA +
      (1 - HINT_PULSE_MIN_ALPHA) * (0.5 + 0.5 * Math.sin(phase * 2 * Math.PI));
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = HINT_RING_WIDTH_PX;
  ctx.beginPath();
  ctx.roundRect(
    left - HINT_RING_PAD_PX,
    top - HINT_RING_PAD_PX,
    rect.w + 2 * HINT_RING_PAD_PX,
    rect.h + 2 * HINT_RING_PAD_PX,
    radius + HINT_RING_PAD_PX
  );
  ctx.stroke();
  ctx.restore();
}

/** Dấu ✓ bằng nét tròn đầu, tâm `(cx, cy)`, cạnh `size`. */
function drawCheckIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const half = size / 2;
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - half, cy);
  ctx.lineTo(cx - half * 0.25, cy + half * 0.7);
  ctx.lineTo(cx + half, cy - half * 0.6);
  ctx.stroke();
}

/** Tam giác ▶ đặc, tâm `(cx, cy)`, cạnh `size`. */
function drawPlayIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const half = size / 2;
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.beginPath();
  ctx.moveTo(cx - half * 0.6, cy - half);
  ctx.lineTo(cx + half, cy);
  ctx.lineTo(cx - half * 0.6, cy + half);
  ctx.closePath();
  ctx.fill();
}

/** Loa: thân chữ nhật, phễu, một sóng âm — tâm `(cx, cy)`, cạnh `size`. */
function drawListenIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const half = size / 2;
  const left = cx - half;
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.beginPath();
  ctx.moveTo(left, cy - half * 0.3);
  ctx.lineTo(left + half * 0.4, cy - half * 0.3);
  ctx.lineTo(left + half, cy - half);
  ctx.lineTo(left + half, cy + half);
  ctx.lineTo(left + half * 0.4, cy + half * 0.3);
  ctx.lineTo(left, cy + half * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = Math.max(3, size * 0.1);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, half * 0.8, -Math.PI / 4, Math.PI / 4);
  ctx.stroke();
}

const ICON_PAINTERS: Record<
  CommitIcon,
  (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => void
> = {
  check: drawCheckIcon,
  play: drawPlayIcon,
  listen: drawListenIcon,
};

export function drawCommitButton(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  rect: CommitButtonRect | ZoneRect,
  options: CommitButtonOptions
): void {
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

  ICON_PAINTERS[options.icon ?? "check"](
    ctx,
    centerX,
    centerY,
    Math.min(rect.w, rect.h) * CHECK_ICON_RATIO
  );
  ctx.restore();
  if (options.hint) {
    drawHintRing(ctx, left, top, rect, radius, options.hint);
  }
}
