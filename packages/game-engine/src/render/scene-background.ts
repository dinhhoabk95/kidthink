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
  paint(ctx, rs, w, h);

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
