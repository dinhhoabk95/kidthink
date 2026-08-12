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

export class RenderSystem {
  readonly LOGIC_WIDTH = 960;
  readonly LOGIC_HEIGHT = 540;

  setupCanvas(canvas: HTMLCanvasElement): { scale: number; dpr: number } {
    const dpr =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || this.LOGIC_WIDTH;
    const height = rect.height || this.LOGIC_HEIGHT;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const scaleX = width / this.LOGIC_WIDTH;
    const scaleY = height / this.LOGIC_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    return { scale, dpr };
  }

  clear(
    ctx: CanvasRenderingContext2D,
    width = this.LOGIC_WIDTH,
    height = this.LOGIC_HEIGHT
  ): void {
    ctx.clearRect(0, 0, width, height);
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

    // 1. Drop shadow offset
    ctx.save();
    ctx.translate(0, 5);
    ctx.fillStyle = border;
    ctx.beginPath();
    this.drawRoundShape(ctx, r, shape);
    ctx.fill();
    ctx.restore();

    // 2. Main fill body
    ctx.fillStyle = fill;
    ctx.beginPath();
    this.drawRoundShape(ctx, r, shape);
    ctx.fill();

    // 3. Thick outline
    ctx.strokeStyle = border;
    ctx.lineWidth = 4;
    ctx.beginPath();
    this.drawRoundShape(ctx, r, shape);
    ctx.stroke();

    // 4. White top specular highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
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

  /** Ported from v1: Clay container basket for GT-003 and GT-004 sort dropzones */
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

    // Drop shadow
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

    ctx.restore();
  }

  /** Ported from v1: Scaffolding pulse ring animation for hints (BR-ENG-05) */
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
    ctx.strokeStyle = designTokens.colors.brand[600]; // Indigo hint pulse
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /** Ported from v1: Confetti particle burst celebration renderer */
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

  private drawRoundShape(
    ctx: CanvasRenderingContext2D,
    r: number,
    shape: "circle" | "square"
  ): void {
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
