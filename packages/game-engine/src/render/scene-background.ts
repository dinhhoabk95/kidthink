import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
  setContextGeneration,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { SCENE_PAINTERS } from "./scene-themes.js";
import { drawDefaultScene } from "./scene-themes-indoor.js";

/** Khung thiết kế của họa sĩ nền theo chủ đề (`scene-themes*.ts`). */
const SCENE_DESIGN_W = 960;
const SCENE_DESIGN_H = 540;

export function drawSceneBackground(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  themeId?: string
): void {
  setContextGeneration(ctx, rs.paintGeneration);
  ctx.save();

  const w = rs.LOGIC_WIDTH;
  const h = rs.LOGIC_HEIGHT;
  const activeTheme = themeId ?? rs.themeId;

  const paint = SCENE_PAINTERS.get(activeTheme ?? "") ?? drawDefaultScene;
  if (h > w) {
    // Họa sĩ nền vẽ theo toạ độ thiết kế 960×540 (mặt trời x=860, sàn y≈480).
    // Máy dọc (540×~1168) mà vẽ thẳng thì mặt trời ra ngoài màn, sàn nằm giữa
    // màn. Phủ kín theo chiều cao với tỉ lệ đều, cắt hai bên — như
    // `background-size: cover` — để sàn luôn ở đáy và hình tròn không méo.
    const scale = h / SCENE_DESIGN_H;
    ctx.save();
    ctx.translate((w - SCENE_DESIGN_W * scale) / 2, 0);
    ctx.scale(scale, scale);
    paint(ctx, rs, SCENE_DESIGN_W, SCENE_DESIGN_H);
    ctx.restore();
  } else {
    paint(ctx, rs, w, h);
  }

  // Soft subtle corner accents (Kinder-Tactile Montessori vignette)
  let vignette = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.BG_VIGNETTE,
    0
  );
  if (!vignette) {
    vignette = ctx.createRadialGradient(
      w / 2,
      h / 2,
      h * 0.4,
      w / 2,
      h / 2,
      w * 0.65
    );
    vignette.addColorStop(0, alpha(designTokens.colors.surface[0], 0));
    vignette.addColorStop(
      1,
      alpha(designTokens.colors.montessori.woodBevel, 0.12)
    );
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_VIGNETTE,
      0,
      vignette
    );
  }
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}
