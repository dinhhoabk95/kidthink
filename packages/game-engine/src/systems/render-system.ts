/**
 * RenderSystem — Canvas2D logic renderer ported & adapted from v1 tinimath game-engine.
 * Canvas resolution 960x540 logic space with DPR scaling (BR-ENG-14).
 * Clay-morphism entity drawing, container tracing, and particle burst effects.
 * Pure Vanilla TS — ZERO Vue / Pinia dependencies (BR-ENG-01).
 */

import { designTokens } from "./designTokens";

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
 * Hình học của một khung vẽ: cách đưa toạ độ logic 960x540 về pixel CSS.
 *
 * Đây là **nguồn sự thật duy nhất** cho cả vẽ lẫn hit-test. Nơi nào cần đổi
 * toạ độ thì đọc ở đây; cấm — NEVER tự dựng lại công thức letterbox, vì hai
 * bản sao sẽ trôi khỏi nhau và điểm chạm lệch khỏi ô đang vẽ.
 */
export interface CanvasViewport {
  cssHeight: number;
  cssWidth: number;
  dpr: number;
  /** Lề letterbox theo pixel CSS, do khung không đúng tỉ lệ 16:9. */
  offsetX: number;
  offsetY: number;
  /** Pixel CSS trên một đơn vị logic. */
  scale: number;
}

export class RenderSystem {
  readonly LOGIC_WIDTH = 960;
  readonly LOGIC_HEIGHT = 540;

  /** Đặt bởi `setupCanvas`. Chưa dựng khung thì chưa có. */
  viewport?: CanvasViewport;

  /**
   * Thế hệ dựng hình hiện tại. Tăng mỗi lần `setupCanvas` được gọi để vô
   * hiệu hoá cache gradient giữa các lần đổi kích thước hoặc đổi canvas.
   */
  paintGeneration = 0;

  /**
   * Đặt canvas về không gian logic 960x540 (`game-engine-runtime.md` §7.1).
   *
   * Trước đây hàm này tính `scale` rồi trả về mà không áp dụng, và nơi gọi thì
   * vứt giá trị trả về đi — ngữ cảnh ở lại không gian pixel CSS trong khi mọi
   * `render()` vẽ theo toạ độ logic. Hậu quả đo được ngày 2026-09-01: cảnh chỉ
   * lấp 67%x60% khung ở `1440x900`, và tràn 246% chiều ngang ở `390x844`.
   */
  setupCanvas(canvas: HTMLCanvasElement): CanvasViewport {
    const dpr =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || this.LOGIC_WIDTH;
    const height = rect.height || this.LOGIC_HEIGHT;

    // Gán width/height reset luôn transform của ngữ cảnh về identity.
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const scaleX = width / this.LOGIC_WIDTH;
    const scaleY = height / this.LOGIC_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (width - this.LOGIC_WIDTH * scale) / 2;
    const offsetY = (height - this.LOGIC_HEIGHT * scale) / 2;

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

    const viewport: CanvasViewport = {
      cssHeight: height,
      cssWidth: width,
      dpr,
      offsetX,
      offsetY,
      scale,
    };
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

    // 1. Warm ambient drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(130, 118, 96, 0.18)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = border;
    this.traceRoundShape(ctx, r, shape);
    ctx.fill();
    ctx.restore();

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
    ctx.strokeStyle = "rgba(255, 255, 255, 0.76)";
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

    // Warm ambient shadow
    ctx.save();
    ctx.shadowColor = "rgba(130, 118, 96, 0.16)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = border;
    this.traceContainerBody(ctx, w, h, 6);
    ctx.fill();
    ctx.restore();

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
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.18);
    ctx.lineTo(w * 0.42, -h * 0.18);
    ctx.stroke();

    ctx.restore();
  }

  /** Montessori Scaffolding golden pulse ring animation for hints (BR-ENG-05) */
  drawScaffoldingHighlight(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    pulsePhase: number
  ): void {
    const pulseScale = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.12;
    const currentRadius = radius * pulseScale;

    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = designTokens.colors.montessori.amber; // Honey Amber hint pulse
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /** Confetti & star particle burst celebration renderer */
  drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    ctx.save();
    for (const p of particles) {
      if (p.life <= 0) {
        continue;
      }
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
