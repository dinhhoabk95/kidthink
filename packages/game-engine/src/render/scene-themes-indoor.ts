import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { drawScenicCloud, drawScenicFlowerDots } from "./scene-decor.js";

export function drawSchoolScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_SCHOOL,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.semantic.warning[50]);
    grad.addColorStop(0.55, designTokens.colors.semantic.warning[100]);
    grad.addColorStop(1, designTokens.colors.cta[200]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_SCHOOL,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Blackboard banner at top
  ctx.fillStyle = alpha(designTokens.colors.scene.slate, 0.85);
  ctx.fillRect(0, 0, w, 24);
  ctx.fillStyle = alpha(designTokens.colors.scene.wood.light, 0.5);
  ctx.fillRect(0, 24, w, 4);

  // Chalk dots
  drawScenicFlowerDots(ctx, [
    [60, 12, alpha(designTokens.colors.surface[0], 0.6)],
    [140, 12, alpha(designTokens.colors.semantic.warning[200], 0.6)],
    [820, 12, alpha(designTokens.colors.semantic.success[300], 0.6)],
    [900, 12, alpha(designTokens.colors.scene.pink, 0.6)],
  ]);

  // Wooden classroom floor
  ctx.fillStyle = alpha(designTokens.colors.retry[600], 0.15);
  ctx.fillRect(0, 480, w, 60);
  ctx.strokeStyle = alpha(designTokens.colors.scene.wood.light, 0.15);
  ctx.lineWidth = 2;
  for (let x = 160; x < w; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, 480);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

export function drawHomeScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_HOME,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.cta[50]);
    grad.addColorStop(0.5, designTokens.colors.cta[100]);
    grad.addColorStop(1, designTokens.colors.cta[200]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_HOME,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Sunbeam through window
  ctx.fillStyle = alpha(designTokens.colors.semantic.warning[200], 0.14);
  ctx.beginPath();
  ctx.moveTo(60, 0);
  ctx.lineTo(190, 0);
  ctx.lineTo(390, h);
  ctx.lineTo(160, h);
  ctx.closePath();
  ctx.fill();

  // Wooden toy shelf baseboard
  ctx.fillStyle = alpha(designTokens.colors.scene.wood.deep, 0.18);
  ctx.fillRect(0, 480, w, 60);
  ctx.strokeStyle = alpha(designTokens.colors.scene.wood.deep, 0.3);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.lineTo(w, 480);
  ctx.stroke();
}

export function drawFoodScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_FOOD,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.semantic.danger[50]);
    grad.addColorStop(0.5, designTokens.colors.retry[100]);
    grad.addColorStop(1, designTokens.colors.semantic.success[50]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_FOOD,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Picnic cloth strip along bottom
  ctx.fillStyle = alpha(designTokens.colors.semantic.danger[500], 0.14);
  ctx.fillRect(0, 485, w, 55);
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.25);
  for (let x = 0; x < w; x += 40) {
    ctx.fillRect(x, 485, 20, 55);
  }

  // Gentle berry dots in background
  drawScenicFlowerDots(ctx, [
    [90, 200, alpha(designTokens.colors.semantic.danger[400], 0.2)],
    [860, 220, alpha(designTokens.colors.semantic.danger[400], 0.2)],
    [140, 360, alpha(designTokens.colors.retry[400], 0.2)],
    [820, 350, alpha(designTokens.colors.retry[400], 0.2)],
  ]);
}

export function drawArtScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_ART,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.surface[50]);
    grad.addColorStop(0.4, designTokens.colors.surface[50]);
    grad.addColorStop(1, designTokens.colors.montessori.indigoLight);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_ART,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Watercolor splash arcs
  ctx.fillStyle = alpha(designTokens.colors.scene.violet[400], 0.16);
  ctx.beginPath();
  ctx.arc(80, 80, 65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = alpha(designTokens.colors.scene.sky[400], 0.16);
  ctx.beginPath();
  ctx.arc(880, 90, 75, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = alpha(designTokens.colors.semantic.warning[400], 0.16);
  ctx.beginPath();
  ctx.arc(840, 470, 70, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = alpha(designTokens.colors.scene.pink, 0.16);
  ctx.beginPath();
  ctx.arc(100, 480, 65, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFamilyScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_FAMILY,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.cta[50]);
    grad.addColorStop(0.5, designTokens.colors.semantic.danger[100]);
    grad.addColorStop(1, designTokens.colors.cta[200]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_FAMILY,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Warm sunset orb
  ctx.fillStyle = alpha(designTokens.colors.cta[400], 0.14);
  ctx.beginPath();
  ctx.arc(480, 180, 110, 0, Math.PI * 2);
  ctx.fill();

  // Garden terrace strip at bottom
  ctx.fillStyle = alpha(designTokens.colors.scene.wood.warm, 0.16);
  ctx.fillRect(0, 485, w, 55);
  ctx.strokeStyle = alpha(designTokens.colors.scene.wood.warm, 0.22);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 485);
  ctx.lineTo(w, 485);
  ctx.stroke();
}

export function drawBodyScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_BODY,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.semantic.success[50]);
    grad.addColorStop(0.5, designTokens.colors.semantic.success[100]);
    grad.addColorStop(1, designTokens.colors.semantic.success[100]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_BODY,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Energizing sunrise aura
  ctx.strokeStyle = alpha(designTokens.colors.semantic.warning[300], 0.22);
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(480, 0, 220, 0, Math.PI);
  ctx.stroke();

  // Active park lawn
  ctx.fillStyle = alpha(designTokens.colors.semantic.success[400], 0.22);
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(340, 460, 620, 505, w, 475);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}

export function drawFestivalScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_FESTIVAL,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.semantic.danger[50]);
    grad.addColorStop(0.5, designTokens.colors.semantic.warning[50]);
    grad.addColorStop(1, designTokens.colors.scene.sky[100]);
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_FESTIVAL,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Party bunting string across top
  ctx.strokeStyle = alpha(designTokens.colors.surface[400], 0.45);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.bezierCurveTo(240, 28, 720, 28, w, 12);
  ctx.stroke();

  // Pennant flags along bunting
  const flagColors = [
    alpha(designTokens.colors.semantic.danger[500], 0.45),
    alpha(designTokens.colors.retry[400], 0.45),
    alpha(designTokens.colors.semantic.success[400], 0.45),
    alpha(designTokens.colors.scene.blue[500], 0.45),
    alpha(designTokens.colors.scene.violet[500], 0.45),
  ];
  for (let i = 0; i < 9; i++) {
    const fx = 60 + i * 100;
    const fy = 14 + Math.sin((i / 8) * Math.PI) * 10;
    const color =
      flagColors[i % flagColors.length] ??
      alpha(designTokens.colors.semantic.danger[500], 0.45);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fx - 14, fy);
    ctx.lineTo(fx + 14, fy);
    ctx.lineTo(fx, fy + 22);
    ctx.closePath();
    ctx.fill();
  }

  // Confetti dots
  drawScenicFlowerDots(ctx, [
    [120, 180, alpha(designTokens.colors.semantic.danger[500], 0.3)],
    [220, 280, alpha(designTokens.colors.scene.blue[500], 0.3)],
    [780, 240, alpha(designTokens.colors.semantic.warning[500], 0.3)],
    [860, 160, alpha(designTokens.colors.scene.violet[500], 0.3)],
    [100, 390, alpha(designTokens.colors.semantic.success[400], 0.3)],
    [880, 390, alpha(designTokens.colors.semantic.danger[500], 0.3)],
  ]);
}

export function drawDefaultScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
): void {
  // Default / general / classroom: Cheerful sunny sky & paper base
  ctx.fillStyle = designTokens.colors.surface[50];
  ctx.fillRect(0, 0, w, h);

  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_DEFAULT,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    grad.addColorStop(0, alpha(designTokens.colors.surface[50], 0.65));
    grad.addColorStop(1, alpha(designTokens.colors.montessori.paper, 0));
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_DEFAULT,
      0,
      grad
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Playful sunny clouds
  drawScenicCloud(ctx, 160, 68, 0.9);
  drawScenicCloud(ctx, 800, 80, 0.75);

  // Cheerful pastel flower dots along bottom
  drawScenicFlowerDots(ctx, [
    [80, 505, alpha(designTokens.colors.retry[400], 0.45)],
    [140, 515, alpha(designTokens.colors.scene.pink, 0.4)],
    [220, 510, alpha(designTokens.colors.scene.blue[400], 0.4)],
    [740, 510, alpha(designTokens.colors.semantic.success[400], 0.45)],
    [820, 515, alpha(designTokens.colors.retry[400], 0.4)],
    [890, 505, alpha(designTokens.colors.scene.pink, 0.45)],
  ]);
}
