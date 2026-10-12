import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import {
  drawScenicBubble,
  drawScenicCloud,
  drawScenicFlowerDots,
  drawScenicStars,
} from "./scene-decor.js";

export function drawNatureScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_NATURE,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.scene.sky[100]);
    grad.addColorStop(0.55, designTokens.colors.semantic.success[50]);
    grad.addColorStop(1, designTokens.colors.semantic.success[200]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_NATURE,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Clouds
  drawScenicCloud(ctx, 140, 75, 1.0);
  drawScenicCloud(ctx, 810, 85, 0.85);

  // Far rolling hill
  ctx.fillStyle = alpha(designTokens.colors.semantic.success[300], 0.35);
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(240, 420, 600, 490, w, 450);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Near green hill
  ctx.fillStyle = alpha(designTokens.colors.semantic.success[400], 0.25);
  ctx.beginPath();
  ctx.moveTo(0, 500);
  ctx.bezierCurveTo(400, 520, 700, 460, w, 490);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Wildflower dots
  drawScenicFlowerDots(ctx, [
    [80, 495, alpha(designTokens.colors.semantic.warning[300], 0.5)],
    [220, 480, alpha(designTokens.colors.surface[0], 0.6)],
    [450, 505, alpha(designTokens.colors.cta[400], 0.5)],
    [720, 475, alpha(designTokens.colors.semantic.warning[300], 0.5)],
    [880, 490, alpha(designTokens.colors.surface[0], 0.6)],
  ]);
}

export function drawFarmScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_FARM,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.retry[100]);
    grad.addColorStop(0.5, designTokens.colors.semantic.warning[100]);
    grad.addColorStop(1, designTokens.colors.semantic.success[100]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_FARM,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Morning Sun
  ctx.fillStyle = alpha(designTokens.colors.semantic.warning[200], 0.25);
  ctx.beginPath();
  ctx.arc(860, 65, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = alpha(designTokens.colors.semantic.warning[300], 0.4);
  ctx.beginPath();
  ctx.arc(860, 65, 36, 0, Math.PI * 2);
  ctx.fill();

  // Rolling pasture
  ctx.fillStyle = alpha(designTokens.colors.semantic.success[200], 0.42);
  ctx.beginPath();
  ctx.moveTo(0, 470);
  ctx.bezierCurveTo(300, 430, 650, 490, w, 460);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Rustic wooden fence rails & pickets along bottom
  ctx.strokeStyle = alpha(designTokens.colors.scene.wood.light, 0.25);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 495);
  ctx.lineTo(w, 495);
  ctx.stroke();

  ctx.fillStyle = alpha(designTokens.colors.scene.wood.light, 0.22);
  for (let x = 60; x < w; x += 130) {
    ctx.fillRect(x, 480, 8, 32);
  }
}

export function drawOceanScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let seaGrad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_OCEAN,
    0
  );
  if (!seaGrad) {
    seaGrad = ctx.createLinearGradient(0, 0, 0, h);
    seaGrad.addColorStop(0, designTokens.colors.scene.sky[200]);
    seaGrad.addColorStop(0.5, designTokens.colors.scene.sky[300]);
    seaGrad.addColorStop(1, designTokens.colors.scene.sky[400]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_OCEAN,
      0,
      seaGrad
    );
  }
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, 0, w, h);

  // Underwater light rays
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.08);
  ctx.beginPath();
  ctx.moveTo(180, 0);
  ctx.lineTo(260, 0);
  ctx.lineTo(380, h);
  ctx.lineTo(220, h);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(680, 0);
  ctx.lineTo(760, 0);
  ctx.lineTo(890, h);
  ctx.lineTo(730, h);
  ctx.closePath();
  ctx.fill();

  // Sandy seabed at bottom
  ctx.fillStyle = alpha(designTokens.colors.semantic.warning[200], 0.32);
  ctx.beginPath();
  ctx.moveTo(0, 485);
  ctx.bezierCurveTo(320, 470, 680, 500, w, 480);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Coral silhouettes at corners
  ctx.fillStyle = alpha(designTokens.colors.semantic.danger[400], 0.28);
  ctx.beginPath();
  ctx.arc(60, 490, 24, 0, Math.PI * 2);
  ctx.arc(80, 480, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = alpha(designTokens.colors.scene.teal, 0.28);
  ctx.beginPath();
  ctx.arc(900, 490, 24, 0, Math.PI * 2);
  ctx.arc(880, 480, 18, 0, Math.PI * 2);
  ctx.fill();

  // Translucent bubbles
  drawScenicBubble(ctx, 120, 320, 12);
  drawScenicBubble(ctx, 280, 200, 16);
  drawScenicBubble(ctx, 450, 120, 10);
  drawScenicBubble(ctx, 660, 280, 14);
  drawScenicBubble(ctx, 840, 160, 18);
}

export function drawSpaceScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let spaceGrad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_SPACE,
    0
  );
  if (!spaceGrad) {
    spaceGrad = ctx.createLinearGradient(0, 0, 0, h);
    spaceGrad.addColorStop(0, designTokens.colors.scene.night[950]);
    spaceGrad.addColorStop(0.5, designTokens.colors.scene.night[900]);
    spaceGrad.addColorStop(1, designTokens.colors.scene.night[800]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_SPACE,
      0,
      spaceGrad
    );
  }
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, w, h);

  // Crescent moon (upper left)
  ctx.fillStyle = alpha(designTokens.colors.semantic.warning[200], 0.7);
  ctx.beginPath();
  ctx.arc(120, 75, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = spaceGrad;
  ctx.beginPath();
  ctx.arc(128, 70, 18, 0, Math.PI * 2);
  ctx.fill();

  // Ringed planet (upper right)
  ctx.fillStyle = alpha(designTokens.colors.retry[400], 0.65);
  ctx.beginPath();
  ctx.arc(820, 80, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = alpha(designTokens.colors.semantic.warning[200], 0.45);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(820, 80, 38, 10, -0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Stars
  drawScenicStars(ctx, [
    [240, 60, 3],
    [350, 110, 2],
    [490, 70, 3],
    [630, 130, 2],
    [720, 60, 3],
    [180, 180, 2],
    [880, 180, 2],
    [320, 230, 3],
    [680, 220, 2],
    [140, 380, 3],
    [840, 360, 3],
  ]);

  // Cosmic horizon crest
  ctx.fillStyle = alpha(designTokens.colors.scene.night[800], 0.45);
  ctx.beginPath();
  ctx.moveTo(0, 490);
  ctx.bezierCurveTo(320, 460, 640, 510, w, 480);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}

export function drawAnimalScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_ANIMAL,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.cta[100]);
    grad.addColorStop(0.45, designTokens.colors.semantic.warning[200]);
    grad.addColorStop(1, designTokens.colors.semantic.success[100]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_ANIMAL,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Golden savanna sun on horizon
  ctx.fillStyle = alpha(designTokens.colors.retry[400], 0.2);
  ctx.beginPath();
  ctx.arc(480, 380, 80, 0, Math.PI * 2);
  ctx.fill();

  // Savanna hill
  ctx.fillStyle = alpha(designTokens.colors.retry[600], 0.16);
  ctx.beginPath();
  ctx.moveTo(0, 470);
  ctx.bezierCurveTo(280, 420, 680, 480, w, 450);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Tropical leaves in corners
  ctx.fillStyle = alpha(designTokens.colors.semantic.success[500], 0.18);
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w, 0, 90, Math.PI / 2, Math.PI);
  ctx.fill();
}

export function drawVehicleScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_VEHICLE,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.scene.sky[100]);
    grad.addColorStop(0.5, designTokens.colors.scene.sky[200]);
    grad.addColorStop(1, designTokens.colors.scene.mist);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_VEHICLE,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Travel clouds
  drawScenicCloud(ctx, 160, 65, 1.0);
  drawScenicCloud(ctx, 750, 90, 0.85);

  // Winding paved travel road
  ctx.fillStyle = alpha(designTokens.colors.surface[600], 0.18);
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(340, 460, 620, 510, w, 475);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Road dash line
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.45);
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.moveTo(0, 510);
  ctx.bezierCurveTo(340, 490, 620, 540, w, 505);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawWeatherScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_WEATHER,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.scene.sky[100]);
    grad.addColorStop(0.5, designTokens.colors.scene.sky[200]);
    grad.addColorStop(1, designTokens.colors.semantic.warning[100]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_WEATHER,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Rainbow arc
  ctx.lineWidth = 14;
  ctx.strokeStyle = alpha(designTokens.colors.semantic.danger[400], 0.12);
  ctx.beginPath();
  ctx.arc(480, 540, 420, Math.PI, 0);
  ctx.stroke();

  ctx.strokeStyle = alpha(designTokens.colors.semantic.warning[400], 0.12);
  ctx.beginPath();
  ctx.arc(480, 540, 440, Math.PI, 0);
  ctx.stroke();

  ctx.strokeStyle = alpha(designTokens.colors.scene.blue[400], 0.12);
  ctx.beginPath();
  ctx.arc(480, 540, 460, Math.PI, 0);
  ctx.stroke();

  // Cheerful sun in upper left
  ctx.fillStyle = alpha(designTokens.colors.retry[400], 0.35);
  ctx.beginPath();
  ctx.arc(120, 70, 34, 0, Math.PI * 2);
  ctx.fill();

  // Puffy clouds
  drawScenicCloud(ctx, 160, 80, 0.9);
  drawScenicCloud(ctx, 780, 85, 0.95);
}
