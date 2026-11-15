/**
 * RenderSystem — Canvas2D logic renderer ported & adapted from v1 tinimath game-engine.
 * Canvas resolution 960x540 logic space with DPR scaling (BR-ENG-14).
 * Clay-morphism entity drawing, container tracing, and particle burst effects.
 * Pure Vanilla TS — ZERO Vue / Pinia dependencies (BR-ENG-01).
 */

import {
  DEFAULT_LOGIC_SPACE,
  deriveLogicSpace,
  type LogicSpace,
} from "#src/layout/constants";
import { alpha } from "#src/render/color-utils.js";
import { designTokens } from "./designTokens";

/** Phần viền đậm lòi ra mỗi bên nét gợi ý. */
const HINT_OUTLINE_EXTRA_PX = 3;

const CLAY_SHADOW_COLOR = alpha(
  designTokens.colors.montessori.woodBorder,
  0.18
);
const CLAY_HIGHLIGHT_STROKE = alpha(designTokens.colors.surface[0], 0.76);
const CLAY_CONTAINER_SHADOW = alpha(
  designTokens.colors.montessori.woodBorder,
  0.16
);
const CLAY_CONTAINER_RIM = alpha(designTokens.colors.surface[0], 0.55);

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

/**
 * Hình học của một khung vẽ: cách đưa toạ độ logic về pixel CSS.
 *
 * Đây là **nguồn sự thật duy nhất** cho cả vẽ lẫn hit-test. Nơi nào cần đổi
 * toạ độ thì đọc ở đây; cấm — NEVER tự dựng lại công thức letterbox, vì hai
 * bản sao sẽ trôi khỏi nhau và điểm chạm lệch khỏi ô đang vẽ.
 */
export interface CanvasViewport {
  cssHeight: number;
  cssWidth: number;
  dpr: number;
  /** Lề letterbox theo pixel CSS. */
  offsetX: number;
  offsetY: number;
  /** Pixel CSS trên một đơn vị logic. */
  scale: number;
  logicSpace?: LogicSpace;
}

/**
 * Hình học khung vẽ suy từ hộp canvas theo px CSS: không gian logic, tỉ lệ và
 * lề letterbox. `setupCanvas` và các test bố cục đều đi qua đây (`BR-LAY-13`),
 * để số đo ở test đúng bằng số shell đưa cho engine.
 */
export function deriveCanvasViewport(
  width: number,
  height: number,
  dpr = 1
): CanvasViewport & { logicSpace: LogicSpace } {
  const space = deriveLogicSpace(width, height);
  const scale = Math.min(width / space.w, height / space.h);
  return {
    cssHeight: height,
    cssWidth: width,
    dpr,
    offsetX: (width - space.w * scale) / 2,
    offsetY: (height - space.h * scale) / 2,
    scale,
    logicSpace: space,
  };
}

export class RenderSystem {
  logicSpace: LogicSpace = DEFAULT_LOGIC_SPACE;

  get LOGIC_WIDTH(): number {
    return this.logicSpace.w;
  }

  get LOGIC_HEIGHT(): number {
    return this.logicSpace.h;
  }

  /** Global reduced-motion toggle — reduces particles, confetti, and float speed (BR-FBK-09, BR-SCF-06). */
  reducedMotion = false;

  /** Ambient background motion toggle — disabled by DegradationManager when FPS drops below 42 (BR-ERC-17). */
  ambientMotionEnabled = true;

  /** Soft shadows toggle — disabled by DegradationManager when FPS drops below 40 (BR-PRF-03 §7.3). */
  softShadowsEnabled = true;

  /** Current frame timestamp (ms) injected by GameEngine.renderFrame; 0 in static headless renders. */
  frameTimeMs = 0;

  /** Active theme ID for thematic rendering fallback. */
  themeId?: string;

  /** Đặt bởi `setupCanvas`. Chưa dựng khung thì chưa có. */
  viewport?: CanvasViewport;

  /**
   * Thế hệ dựng hình hiện tại. Tăng mỗi lần `setupCanvas` được gọi để vô
   * hiệu hoá cache gradient giữa các lần đổi kích thước hoặc đổi canvas.
   */
  paintGeneration = 0;

  bumpPaintGeneration(): void {
    this.paintGeneration++;
  }

  /**
   * Đặt canvas về không gian logic đáp ứng theo kích thước khung nhìn (BR-A11-04 & Task #259).
   */
  setupCanvas(canvas: HTMLCanvasElement): CanvasViewport {
    const dpr =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 960;
    const height = rect.height || 540;

    const viewport = deriveCanvasViewport(width, height, dpr);
    const { logicSpace: space, scale, offsetX, offsetY } = viewport;
    this.logicSpace = space;

    // Gán width/height reset luôn transform của ngữ cảnh về identity.
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Một phép biến đổi tuyệt đối, không cộng dồn: logic -> CSS -> thiết bị.
      ctx.setTransform(
        dpr * scale,
        0,
        0,
        dpr * scale,
        dpr * offsetX,
        dpr * offsetY
      );
    }

    this.paintGeneration++;

    this.viewport = viewport;
    return viewport;
  }

  /** Đổi một điểm trong hộp canvas (pixel CSS) sang toạ độ logic. */
  toLogicPoint(clientX: number, clientY: number): { x: number; y: number } {
    const vp = this.viewport;
    if (!vp || vp.scale === 0) {
      return { x: clientX, y: clientY };
    }
    return {
      x: (clientX - vp.offsetX) / vp.scale,
      y: (clientY - vp.offsetY) / vp.scale,
    };
  }

  /**
   * Xoá **toàn bộ** backing store, không phải hình chữ nhật 960x540.
   *
   * Ngữ cảnh đang mang transform logic, nên `clearRect(0,0,960,540)` chỉ chạm
   * đúng vùng cảnh và để nguyên phần lề — pixel cũ ở lề không bao giờ được xoá.
   */
  clear(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  /** Ported from v1: Clay-morphism 3D body with drop shadow, fill, and top highlight */
  drawClayBody(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    fill: string,
    border: string,
    shape: "circle" | "square" = "circle"
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // 1. Warm ambient drop shadow (skipped when degraded under low FPS — BR-PRF-03 §7.3)
    if (this.softShadowsEnabled) {
      ctx.save();
      ctx.shadowColor = CLAY_SHADOW_COLOR;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = border;
      this.traceRoundShape(ctx, r, shape);
      ctx.fill();
      ctx.restore();
    }

    // 2. Bottom 3D slab offset
    ctx.save();
    ctx.translate(0, 5);
    ctx.fillStyle = border;
    this.traceRoundShape(ctx, r, shape);
    ctx.fill();
    ctx.restore();

    // 3. Main fill body
    ctx.fillStyle = fill;
    this.traceRoundShape(ctx, r, shape);
    ctx.fill();

    // 4. Thick tactile outline
    ctx.strokeStyle = border;
    ctx.lineWidth = 4;
    this.traceRoundShape(ctx, r, shape);
    ctx.stroke();

    // 5. White top specular highlight
    ctx.strokeStyle = CLAY_HIGHLIGHT_STROKE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (shape === "square") {
      ctx.moveTo(-r * 0.55, -r * 0.52);
      ctx.lineTo(r * 0.55, -r * 0.52);
    } else {
      ctx.arc(0, 0, r * 0.62, Math.PI * 1.13, Math.PI * 1.87);
    }
    ctx.stroke();

    ctx.restore();
  }

  /** Montessori wooden tray/basket container for dropzones */
  drawClayContainer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    border: string
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Warm ambient shadow (skipped when degraded under low FPS — BR-PRF-03 §7.3)
    if (this.softShadowsEnabled) {
      ctx.save();
      ctx.shadowColor = CLAY_CONTAINER_SHADOW;
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = border;
      this.traceContainerBody(ctx, w, h, 6);
      ctx.fill();
      ctx.restore();
    }

    // Drop shadow slab
    ctx.fillStyle = border;
    this.traceContainerBody(ctx, w, h, 6);
    ctx.fill();

    // Main container body
    ctx.fillStyle = fill;
    ctx.strokeStyle = border;
    ctx.lineWidth = Math.max(4, w * 0.025);
    this.traceContainerBody(ctx, w, h, 0);
    ctx.fill();
    ctx.stroke();

    // Top rim highlight
    ctx.strokeStyle = CLAY_CONTAINER_RIM;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.18);
    ctx.lineTo(w * 0.42, -h * 0.18);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Tô đường dẫn hiện hành bằng nét gợi ý hai lớp (Task #313 Phase 2): viền đậm
   * `amberDark` bên dưới, nét `amber` bên trên. Amber một mình chỉ ~1.6:1 trên
   * nền sáng và gần trùng vòng retry (`retry[500]`); viền đậm kéo tương phản nét
   * lên trên 3:1 và làm vòng gợi ý khác hẳn vòng retry một nét (`BR-FBK-06`).
   * Người gọi tự đặt `setLineDash` và `beginPath` trước.
   */
  strokeHintPath(ctx: CanvasRenderingContext2D, lineWidth: number): void {
    ctx.strokeStyle = designTokens.colors.montessori.amberDark;
    ctx.lineWidth = lineWidth + HINT_OUTLINE_EXTRA_PX * 2;
    ctx.stroke();
    ctx.strokeStyle = designTokens.colors.montessori.amber;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  /** Montessori Scaffolding golden pulse ring animation for hints (BR-ENG-05) */
  drawScaffoldingHighlight(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    pulsePhase: number
  ): void {
    const pulseScale = this.reducedMotion
      ? 1
      : 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.12;
    const currentRadius = radius * pulseScale;

    ctx.save();
    ctx.translate(x, y);
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    this.strokeHintPath(ctx, 4); // Honey Amber hint pulse, hai lớp để đủ tương phản
    ctx.restore();
  }

  /**
   * Vòng "chưa đúng" (`BR-FBK-02`, `BR-FBK-03`): nét liền, màu hổ phách
   * `retry`, mờ dần theo `progress` 0→1, không nhấp nháy. Khác hẳn vòng gợi ý
   * nét đứt — cùng một hình cho "sai" và "chạm vào đây" thì trẻ chạm lại vật sai.
   */
  drawRetryRing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    progress: number
  ): void {
    const fade = 1 - Math.min(1, Math.max(0, progress));
    if (fade <= 0) {
      return;
    }
    ctx.save();
    ctx.globalAlpha *= fade;
    ctx.strokeStyle = designTokens.colors.retry[500];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private sampleQuadraticPoint(
    from: { readonly x: number; readonly y: number },
    ctrlX: number,
    ctrlY: number,
    end: { readonly x: number; readonly y: number },
    t: number,
    archLift: number
  ): { x: number; y: number } {
    if (archLift <= 0) {
      return {
        x: from.x + (end.x - from.x) * t,
        y: from.y + (end.y - from.y) * t,
      };
    }
    const inv = 1 - t;
    return {
      x: inv * inv * from.x + 2 * inv * t * ctrlX + t * t * end.x,
      y: inv * inv * from.y + 2 * inv * t * ctrlY + t * t * end.y,
    };
  }

  private drawGhostHandTrail(
    ctx: CanvasRenderingContext2D,
    from: { readonly x: number; readonly y: number },
    ctrlX: number,
    ctrlY: number,
    end: { readonly x: number; readonly y: number },
    t: number
  ): void {
    ctx.save();
    ctx.strokeStyle = alpha(designTokens.colors.montessori.amber, 0.72);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(ctrlX, ctrlY, end.x, end.y);
    ctx.stroke();
    ctx.restore();

    for (let i = 1; i <= 3; i += 1) {
      const st = Math.max(0, t - i * 0.14);
      const spark = this.sampleQuadraticPoint(from, ctrlX, ctrlY, end, st, 1);
      ctx.fillStyle = alpha(
        designTokens.colors.montessori.amberGlow,
        0.75 - i * 0.18
      );
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, Math.max(3, 7 - i * 1.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private isFinitePoint(pt: {
    readonly x: number;
    readonly y: number;
  }): boolean {
    return Number.isFinite(pt.x) && Number.isFinite(pt.y);
  }

  private drawGhostHandCushion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    clamped: number,
    showRipple: boolean
  ): void {
    if (showRipple) {
      const ripple = 22 + Math.sin(clamped * Math.PI * 2) * 5;
      ctx.strokeStyle = alpha(designTokens.colors.montessori.amber, 0.65);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, ripple, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha *= 0.92;
    ctx.fillStyle = designTokens.colors.montessori.pawCream;
    ctx.strokeStyle = designTokens.colors.montessori.amberDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y + 22, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = alpha(designTokens.colors.montessori.pawPad, 0.35);
    ctx.beginPath();
    ctx.arc(x, y + 24, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `44px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("\u{1F446}", x, y);
  }

  /**
   * Bàn tay dẫn đường 2.5D của Gấu Con (L2/L3):
   * - Khi kéo từ `from` tới `to`, vẽ đường cong bụi sao hổ phách (`quadraticCurveTo`)
   *   và các hạt sáng dẫn hướng để bé hiểu rõ thao tác kéo-thả.
   * - Ở đầu tay có vòng gợn chạm êm + đệm kem 2.5D và bàn tay chỉ hướng.
   * - Bỏ qua khi toạ độ không hợp lệ — cấm sinh `NaN` ra canvas.
   * - `reducedMotion`: đứng yên ở đích, bỏ đường vệt động.
   */
  renderGhostHand(
    ctx: CanvasRenderingContext2D,
    from: { readonly x: number; readonly y: number },
    to: { readonly x: number; readonly y: number } | null,
    progress: number
  ): void {
    const end = to ?? from;
    if (!(this.isFinitePoint(from) && this.isFinitePoint(end))) {
      return;
    }
    const clamped = Math.min(1, Math.max(0, progress));
    const hasDragPath = Boolean(to) && !this.reducedMotion;
    let t = 0;
    if (this.reducedMotion) {
      t = 1;
    } else if (to) {
      t = clamped;
    }
    const dist = Math.hypot(end.x - from.x, end.y - from.y);
    const archLift = hasDragPath && dist > 12 ? Math.min(34, dist * 0.16) : 0;
    const ctrlX = (from.x + end.x) / 2;
    const ctrlY = (from.y + end.y) / 2 - archLift;
    const { x, y } = this.sampleQuadraticPoint(
      from,
      ctrlX,
      ctrlY,
      end,
      t,
      archLift
    );

    ctx.save();
    if (hasDragPath && dist > 8) {
      this.drawGhostHandTrail(ctx, from, ctrlX, ctrlY, end, t);
    }
    const isPressing = !to || t > 0.78 || t < 0.15;
    this.drawGhostHandCushion(
      ctx,
      x,
      y,
      clamped,
      isPressing && !this.reducedMotion
    );
    ctx.restore();
  }

  /** Renders golden amber scaffolding aura around the target (or nothing if target is invalid). */
  renderScaffoldingAura(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    pulsePhase: number
  ): void {
    if (!(Number.isFinite(x) && Number.isFinite(y)) || radius <= 0) {
      return;
    }
    this.drawScaffoldingHighlight(ctx, x, y, radius, pulsePhase);
  }

  /**
   * Vẽ khung sáng nét đứt màu hổ phách cho vùng chú ý (`region`) ở L1/L2 (Task #301 S2).
   * Dùng token `designTokens.colors.montessori.amber` — Cấm hex literal.
   */
  renderScaffoldingRegion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    pulsePhase: number
  ): void {
    if (!(Number.isFinite(x) && Number.isFinite(y)) || w <= 0 || h <= 0) {
      return;
    }
    const pulseScale = this.reducedMotion
      ? 1
      : 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.06;
    const rw = (w + 12) * pulseScale;
    const rh = (h + 12) * pulseScale;

    ctx.save();
    ctx.translate(x, y);
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.roundRect(-rw / 2, -rh / 2, rw, rh, 12);
    this.strokeHintPath(ctx, 4);
    ctx.restore();
  }

  /**
   * Vẽ hạt ăn mừng. Khi `reducedMotion`, hạt mờ hơn và nhỏ hơn; số lượng đã
   * được giảm từ `spawnParticlesAtSlot` (BR-FBK-09) chứ không giảm ở đây.
   */
  drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    ctx.save();
    for (const p of particles) {
      if (!p || p.life <= 0) {
        continue;
      }
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = this.reducedMotion ? alpha * 0.7 : alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(
        p.x,
        p.y,
        this.reducedMotion ? p.size * 0.8 : p.size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  /** Trace (never paints) — caller picks fill or stroke. Matches traceContainerBody. */
  private traceRoundShape(
    ctx: CanvasRenderingContext2D,
    r: number,
    shape: "circle" | "square"
  ): void {
    ctx.beginPath();
    if (shape === "square") {
      ctx.roundRect(-r, -r, r * 2, r * 2, Math.max(10, r * 0.22));
    } else {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
  }

  private traceContainerBody(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    yOffset = 0
  ): void {
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h * 0.2 + yOffset);
    ctx.lineTo(-w * 0.36, h * 0.44 + yOffset);
    ctx.quadraticCurveTo(0, h * 0.52 + yOffset, w * 0.36, h * 0.44 + yOffset);
    ctx.lineTo(w / 2, -h * 0.2 + yOffset);
    ctx.closePath();
  }
}
