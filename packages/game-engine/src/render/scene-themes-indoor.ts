import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { drawScenicCloud, drawScenicFlowerDots } from "./scene-decor.js";
import {
  drawBambooGrove,
  drawDoPaperFiberMarks,
  drawFolkLantern,
  drawLotusBlossom,
  drawPaperKite,
  drawRattleDrumMotif,
  drawWovenSedgeStrip,
} from "./vn-folk-motifs.js";

const SCHOOL_CHALK_DOTS: readonly [number, number, string][] = [
  [60, 12, alpha(designTokens.colors.surface[0], 0.6)],
  [140, 12, alpha(designTokens.colors.semantic.warning[200], 0.6)],
  [820, 12, alpha(designTokens.colors.semantic.success[300], 0.6)],
  [900, 12, alpha(designTokens.colors.scene.pink, 0.6)],
];

const FOOD_BERRY_DOTS: readonly [number, number, string][] = [
  [90, 200, alpha(designTokens.colors.montessori.coral, 0.2)],
  [860, 220, alpha(designTokens.colors.montessori.coral, 0.2)],
  [140, 360, alpha(designTokens.colors.retry[400], 0.2)],
  [820, 350, alpha(designTokens.colors.retry[400], 0.2)],
];

const FESTIVAL_FLAG_COLORS: readonly string[] = [
  alpha(designTokens.colors.montessori.coral, 0.45),
  alpha(designTokens.colors.retry[400], 0.45),
  alpha(designTokens.colors.semantic.success[400], 0.45),
  alpha(designTokens.colors.scene.blue[500], 0.45),
  alpha(designTokens.colors.scene.violet[500], 0.45),
];

const FESTIVAL_CONFETTI_DOTS: readonly [number, number, string][] = [
  [120, 180, alpha(designTokens.colors.montessori.coral, 0.3)],
  [220, 280, alpha(designTokens.colors.scene.blue[500], 0.3)],
  [780, 240, alpha(designTokens.colors.semantic.warning[500], 0.3)],
  [860, 160, alpha(designTokens.colors.scene.violet[500], 0.3)],
  [100, 390, alpha(designTokens.colors.semantic.success[400], 0.3)],
  [880, 390, alpha(designTokens.colors.montessori.coral, 0.3)],
];

const DEFAULT_FLOWER_DOTS: readonly [number, number, string][] = [
  [80, 505, alpha(designTokens.colors.retry[400], 0.45)],
  [140, 515, alpha(designTokens.colors.scene.pink, 0.4)],
  [220, 510, alpha(designTokens.colors.scene.blue[400], 0.4)],
  [740, 510, alpha(designTokens.colors.semantic.success[400], 0.45)],
  [820, 515, alpha(designTokens.colors.retry[400], 0.4)],
  [890, 505, alpha(designTokens.colors.scene.pink, 0.45)],
];

export function drawSchoolScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs = 0
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_SCHOOL,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.vnMaterials.doPaper.sheet);
    grad.addColorStop(0.55, designTokens.colors.semantic.warning[100]);
    grad.addColorStop(1, designTokens.colors.vnMaterials.bamboo.light);
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

  // Blackboard banner at top with warm bamboo rail
  ctx.fillStyle = alpha(designTokens.colors.scene.slate, 0.82);
  ctx.fillRect(0, 0, w, 24);
  ctx.fillStyle = alpha(designTokens.colors.vnMaterials.bamboo.joint, 0.6);
  ctx.fillRect(0, 24, w, 4);

  // Chalk dots
  drawScenicFlowerDots(ctx, SCHOOL_CHALK_DOTS);

  // Chiếu cói góc lớp mầm non & sàn gỗ ấm
  drawWovenSedgeStrip(ctx, 0, 482, w, 58);
  drawBambooGrove(ctx, 36, 484, 96, 0.72, timeMs);
  drawRattleDrumMotif(ctx, w - 48, 462, 0.85, timeMs);
}

export function drawHomeScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs = 0
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_HOME,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.vnMaterials.doPaper.sheet);
    grad.addColorStop(0.5, designTokens.colors.cta[100]);
    grad.addColorStop(1, designTokens.colors.vnMaterials.sedgeMat.base);
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

  // Đèn lồng giấy ấm bên hiên & chiếu cói trải sàn nhà
  drawFolkLantern(ctx, w - 72, 0, 0.9, "amber", timeMs);
  drawWovenSedgeStrip(ctx, 0, 480, w, 60);
}

export function drawFoodScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs = 0
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_FOOD,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.vnMaterials.doPaper.sheet);
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

  // Chiếu cói mâm quà quê dọc chân màn
  drawWovenSedgeStrip(ctx, 0, 485, w, 55);
  drawLotusBlossom(ctx, 56, 482, 0.82, timeMs);

  // Gentle berry dots in background
  drawScenicFlowerDots(ctx, FOOD_BERRY_DOTS, timeMs);
}

export function drawArtScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs = 0
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_ART,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.vnMaterials.doPaper.sheet);
    grad.addColorStop(0.45, designTokens.colors.surface[50]);
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

  // Watercolor splash arcs on handmade Dó paper
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

  drawDoPaperFiberMarks(ctx, 24, 24, w - 48, h - 48);
  drawWovenSedgeStrip(ctx, 0, 488, w, 52);
  drawRattleDrumMotif(ctx, w - 52, 468, 0.82, timeMs);
}

export function drawFamilyScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs = 0
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_FAMILY,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.vnMaterials.doPaper.sheet);
    grad.addColorStop(0.5, designTokens.colors.cta[100]);
    grad.addColorStop(1, designTokens.colors.vnMaterials.sedgeMat.base);
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

  // Hiên nhà trải chiếu cói & luỹ tre ngà ấm cúng
  drawWovenSedgeStrip(ctx, 0, 485, w, 55);
  drawBambooGrove(ctx, w - 42, 486, 108, 0.78, timeMs);
  drawLotusBlossom(ctx, 64, 483, 0.85, timeMs);
}

export function drawBodyScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs = 0
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_BODY,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.vnMaterials.doPaper.sheet);
    grad.addColorStop(0.5, designTokens.colors.semantic.success[50]);
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

  // Active park lawn with morning bamboo & kite
  ctx.fillStyle = alpha(designTokens.colors.semantic.success[400], 0.22);
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(340, 460, 620, 505, w, 475);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  drawBambooGrove(ctx, 36, 486, 98, 0.74, timeMs);
  drawPaperKite(ctx, w - 78, 66, 0.72, timeMs);
}

export function drawFestivalScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs = 0
): void {
  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_FESTIVAL,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, designTokens.colors.vnMaterials.doPaper.sheet);
    grad.addColorStop(0.5, designTokens.colors.semantic.warning[50]);
    grad.addColorStop(1, designTokens.colors.vnMaterials.sedgeMat.base);
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
  ctx.strokeStyle = alpha(designTokens.colors.vnMaterials.bamboo.joint, 0.45);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.bezierCurveTo(240, 28, 720, 28, w, 12);
  ctx.stroke();

  // Pennant flags along bunting
  for (let i = 0; i < 9; i++) {
    const fx = 60 + i * 100;
    const fy = 14 + Math.sin((i / 8) * Math.PI) * 10;
    const color =
      FESTIVAL_FLAG_COLORS[i % FESTIVAL_FLAG_COLORS.length] ??
      alpha(designTokens.colors.vnMaterials.terracotta.clay, 0.45);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fx - 14, fy);
    ctx.lineTo(fx + 14, fy);
    ctx.lineTo(fx, fy + 22);
    ctx.closePath();
    ctx.fill();
  }

  // Đèn lồng Hội An / Trung Thu & trống bỏi dân gian hai góc hội làng
  drawFolkLantern(ctx, 56, 14, 0.92, "amber", timeMs);
  drawFolkLantern(ctx, w - 56, 14, 0.92, "lotus", timeMs);
  drawRattleDrumMotif(ctx, 54, 488, 0.88, timeMs);
  drawLotusBlossom(ctx, w - 62, 500, 0.85, timeMs);

  // Confetti dots
  drawScenicFlowerDots(ctx, FESTIVAL_CONFETTI_DOTS, timeMs);
}

export function drawDefaultScene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs = 0
): void {
  // Default "Tuổi thơ Việt × Giấy Gỗ Mộc": mặt giấy dó nắng ấm, khóm tre ngà,
  // cánh diều xa và dải chiếu cói mộc dịu mắt (giữ đúng 1 gradient BG_DEFAULT).
  ctx.fillStyle = designTokens.colors.vnMaterials.doPaper.sheet;
  ctx.fillRect(0, 0, w, h);

  let grad = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_DEFAULT,
    0
  );
  if (!grad) {
    grad = ctx.createLinearGradient(0, 0, 0, h * 0.48);
    grad.addColorStop(
      0,
      alpha(designTokens.colors.vnMaterials.bamboo.light, 0.62)
    );
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

  // Playful sunny clouds & distant paper kite
  const cloudDrift =
    timeMs > 0 ? Math.sin((timeMs / 9500) * Math.PI * 2) * 14 : 0;
  drawScenicCloud(ctx, 160 + cloudDrift, 68, 0.9);
  drawScenicCloud(ctx, 800 - cloudDrift * 0.75, 80, 0.75);
  drawPaperKite(ctx, w - 76, 62, 0.72, timeMs);

  // Dải chiếu cói mảnh ở chân trang & khóm tre ngà góc sân
  drawWovenSedgeStrip(ctx, 0, h - 24, w, 24);
  drawBambooGrove(ctx, 32, h - 22, 92, 0.68, timeMs);

  // Cheerful pastel flower dots along bottom
  drawScenicFlowerDots(ctx, DEFAULT_FLOWER_DOTS, timeMs);
}
