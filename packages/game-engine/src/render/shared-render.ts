import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
  setContextGeneration,
} from "./cache.js";

/**
 * Nguyên thuỷ vẽ dùng chung cho `render()` của mọi engine.
 *
 * Mọi kích thước lấy từ `RenderSystem.LOGIC_WIDTH/LOGIC_HEIGHT` chứ ❌ NEVER
 * viết `960`/`540` vào thân hàm: bản trước hằng số hoá cả khung nền lẫn vị trí
 * câu lệnh, nên đổi độ phân giải logic là vỡ bố cục mà không cổng nào thấy.
 *
 * Toạ độ **item** luôn tới từ `Slot` do `resolveLayout()` sinh (`BR-ERC-03`).
 * Hàm ở đây chỉ nhận `Slot`, ❌ NEVER tự chế toạ độ cho item.
 */

export type ItemVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "correct"
  | "wrong"
  | "locked";

/** Asset như contract khai — `emoji` mang ký tự UTF-8 thật, `image` mang đường dẫn, `text` mang chữ hiển thị. */
export type RenderAsset =
  | { readonly kind: "emoji"; readonly ref: string }
  | { readonly kind: "image"; readonly path: string }
  | { readonly kind: "text"; readonly text: string };

/** Một vật thể vẽ được, đã tách khỏi hình dạng `content_pack` của từng engine. */
export interface RenderItem {
  readonly id: string;
  readonly asset?: RenderAsset | null;
  /** Nhãn chữ vẽ dưới vật thể — số đếm, tên nhóm, giá trị phương án. */
  readonly label?: string;
  /** Chữ vẽ THAY cho asset khi engine không có asset (ví dụ ô số của GT-010). */
  readonly text?: string;
  readonly state?: ItemVisualState;
}

export interface SceneBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const PROMPT_FONT_PX = 24;
const PROMPT_TOP_RATIO = 0.045;
const LABEL_FONT_RATIO = 0.16;
const LABEL_MIN_FONT_PX = 11;
const GLYPH_FILL_RATIO = 0.52;

export function getColorsForState(state: ItemVisualState): {
  fill: string;
  border: string;
} {
  switch (state) {
    case "correct":
      return {
        fill: designTokens.colors.semantic.success[100],
        border: designTokens.colors.semantic.success[600],
      };
    case "wrong":
      return {
        fill: designTokens.colors.retry[100],
        border: designTokens.colors.retry[600],
      };
    case "touching":
      return {
        fill: designTokens.colors.montessori.amberLight,
        border: designTokens.colors.montessori.amberDark,
      };
    case "selected":
      return {
        fill: designTokens.colors.montessori.amberLight,
        border: designTokens.colors.montessori.amber,
      };
    case "locked":
      return {
        fill: designTokens.colors.surface[100],
        border: designTokens.colors.surface[400],
      };
    default:
      return {
        fill: designTokens.colors.surface[0],
        border: designTokens.colors.surface[300],
      };
  }
}

export type EmojiResolver = (code: string) => string | null;
let customEmojiResolver: EmojiResolver | null = null;

export function setEmojiResolver(resolver: EmojiResolver | null): void {
  customEmojiResolver = resolver;
}

/**
 * Tra cứu glyph emoji theo `asset.ref` (Task #202 D-EE).
 * Ref chính là glyph UTF-8 thật.
 */
export function resolveEmojiGlyph(ref: string): string | null {
  if (customEmojiResolver) {
    const resolved = customEmojiResolver(ref);
    if (resolved) {
      return resolved;
    }
  }
  if (ref && ref.length > 0) {
    return ref;
  }
  return null;
}

export function sceneBox(rs: RenderSystem): SceneBox {
  return { x: 0, y: 0, w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: multi-theme background visual renderer
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

  if (activeTheme === "nature") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_NATURE,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#e0f2fe");
      grad.addColorStop(0.55, "#f0fdf4");
      grad.addColorStop(1, "#bbf7d0");
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
    ctx.fillStyle = "rgba(134, 239, 172, 0.35)";
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.bezierCurveTo(240, 420, 600, 490, w, 450);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Near green hill
    ctx.fillStyle = "rgba(74, 222, 128, 0.25)";
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.bezierCurveTo(400, 520, 700, 460, w, 490);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Wildflower dots
    drawScenicFlowerDots(ctx, [
      [80, 495, "rgba(253, 224, 71, 0.5)"],
      [220, 480, "rgba(255, 255, 255, 0.6)"],
      [450, 505, "rgba(251, 146, 60, 0.5)"],
      [720, 475, "rgba(253, 224, 71, 0.5)"],
      [880, 490, "rgba(255, 255, 255, 0.6)"],
    ]);
  } else if (activeTheme === "farm") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_FARM,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fef3c7");
      grad.addColorStop(0.5, "#fef9c3");
      grad.addColorStop(1, "#dcfce7");
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
    ctx.fillStyle = "rgba(254, 240, 138, 0.25)";
    ctx.beginPath();
    ctx.arc(860, 65, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(253, 224, 71, 0.4)";
    ctx.beginPath();
    ctx.arc(860, 65, 36, 0, Math.PI * 2);
    ctx.fill();

    // Rolling pasture
    ctx.fillStyle = "rgba(187, 247, 208, 0.42)";
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.bezierCurveTo(300, 430, 650, 490, w, 460);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Rustic wooden fence rails & pickets along bottom
    ctx.strokeStyle = "rgba(180, 130, 80, 0.25)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 495);
    ctx.lineTo(w, 495);
    ctx.stroke();

    ctx.fillStyle = "rgba(180, 130, 80, 0.22)";
    for (let x = 60; x < w; x += 130) {
      ctx.fillRect(x, 480, 8, 32);
    }
  } else if (activeTheme === "ocean") {
    let seaGrad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_OCEAN,
      0
    );
    if (!seaGrad) {
      seaGrad = ctx.createLinearGradient(0, 0, 0, h);
      seaGrad.addColorStop(0, "#bae6fd");
      seaGrad.addColorStop(0.5, "#7dd3fc");
      seaGrad.addColorStop(1, "#38bdf8");
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
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
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
    ctx.fillStyle = "rgba(254, 240, 138, 0.32)";
    ctx.beginPath();
    ctx.moveTo(0, 485);
    ctx.bezierCurveTo(320, 470, 680, 500, w, 480);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Coral silhouettes at corners
    ctx.fillStyle = "rgba(251, 113, 133, 0.28)";
    ctx.beginPath();
    ctx.arc(60, 490, 24, 0, Math.PI * 2);
    ctx.arc(80, 480, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(20, 184, 166, 0.28)";
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
  } else if (activeTheme === "space") {
    let spaceGrad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_SPACE,
      0
    );
    if (!spaceGrad) {
      spaceGrad = ctx.createLinearGradient(0, 0, 0, h);
      spaceGrad.addColorStop(0, "#0f172a");
      spaceGrad.addColorStop(0.5, "#1e1b4b");
      spaceGrad.addColorStop(1, "#312e81");
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
    ctx.fillStyle = "rgba(254, 240, 138, 0.7)";
    ctx.beginPath();
    ctx.arc(120, 75, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spaceGrad;
    ctx.beginPath();
    ctx.arc(128, 70, 18, 0, Math.PI * 2);
    ctx.fill();

    // Ringed planet (upper right)
    ctx.fillStyle = "rgba(251, 191, 36, 0.65)";
    ctx.beginPath();
    ctx.arc(820, 80, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(253, 230, 138, 0.45)";
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
    ctx.fillStyle = "rgba(49, 46, 129, 0.45)";
    ctx.beginPath();
    ctx.moveTo(0, 490);
    ctx.bezierCurveTo(320, 460, 640, 510, w, 480);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  } else if (activeTheme === "school") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_SCHOOL,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fefce8");
      grad.addColorStop(0.55, "#fef9c3");
      grad.addColorStop(1, "#fed7aa");
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
    ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
    ctx.fillRect(0, 0, w, 24);
    ctx.fillStyle = "rgba(180, 130, 80, 0.5)";
    ctx.fillRect(0, 24, w, 4);

    // Chalk dots
    drawScenicFlowerDots(ctx, [
      [60, 12, "rgba(255, 255, 255, 0.6)"],
      [140, 12, "rgba(254, 240, 138, 0.6)"],
      [820, 12, "rgba(110, 231, 183, 0.6)"],
      [900, 12, "rgba(244, 114, 182, 0.6)"],
    ]);

    // Wooden classroom floor
    ctx.fillStyle = "rgba(217, 119, 6, 0.15)";
    ctx.fillRect(0, 480, w, 60);
    ctx.strokeStyle = "rgba(180, 130, 80, 0.15)";
    ctx.lineWidth = 2;
    for (let x = 160; x < w; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 480);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  } else if (activeTheme === "home") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_HOME,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fff7ed");
      grad.addColorStop(0.5, "#ffedd5");
      grad.addColorStop(1, "#fed7aa");
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
    ctx.fillStyle = "rgba(254, 240, 138, 0.14)";
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(190, 0);
    ctx.lineTo(390, h);
    ctx.lineTo(160, h);
    ctx.closePath();
    ctx.fill();

    // Wooden toy shelf baseboard
    ctx.fillStyle = "rgba(180, 110, 60, 0.18)";
    ctx.fillRect(0, 480, w, 60);
    ctx.strokeStyle = "rgba(180, 110, 60, 0.3)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(w, 480);
    ctx.stroke();
  } else if (activeTheme === "animal") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_ANIMAL,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#ffedd5");
      grad.addColorStop(0.45, "#fef08a");
      grad.addColorStop(1, "#dcfce7");
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
    ctx.fillStyle = "rgba(251, 191, 36, 0.2)";
    ctx.beginPath();
    ctx.arc(480, 380, 80, 0, Math.PI * 2);
    ctx.fill();

    // Savanna hill
    ctx.fillStyle = "rgba(217, 119, 6, 0.16)";
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.bezierCurveTo(280, 420, 680, 480, w, 450);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Tropical leaves in corners
    ctx.fillStyle = "rgba(34, 197, 94, 0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, 90, 0, Math.PI / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w, 0, 90, Math.PI / 2, Math.PI);
    ctx.fill();
  } else if (activeTheme === "food") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_FOOD,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fff1f2");
      grad.addColorStop(0.5, "#fef3c7");
      grad.addColorStop(1, "#ecfdf5");
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
    ctx.fillStyle = "rgba(244, 63, 94, 0.14)";
    ctx.fillRect(0, 485, w, 55);
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    for (let x = 0; x < w; x += 40) {
      ctx.fillRect(x, 485, 20, 55);
    }

    // Gentle berry dots in background
    drawScenicFlowerDots(ctx, [
      [90, 200, "rgba(251, 113, 133, 0.2)"],
      [860, 220, "rgba(251, 113, 133, 0.2)"],
      [140, 360, "rgba(251, 191, 36, 0.2)"],
      [820, 350, "rgba(251, 191, 36, 0.2)"],
    ]);
  } else if (activeTheme === "vehicle") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_VEHICLE,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#e0f2fe");
      grad.addColorStop(0.5, "#bae6fd");
      grad.addColorStop(1, "#f1f5f9");
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
    ctx.fillStyle = "rgba(71, 85, 105, 0.18)";
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.bezierCurveTo(340, 460, 620, 510, w, 475);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Road dash line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(0, 510);
    ctx.bezierCurveTo(340, 490, 620, 540, w, 505);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (activeTheme === "art") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_ART,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fdf4ff");
      grad.addColorStop(0.4, "#fae8ff");
      grad.addColorStop(1, "#e0e7ff");
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
    ctx.fillStyle = "rgba(192, 132, 252, 0.16)";
    ctx.beginPath();
    ctx.arc(80, 80, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
    ctx.beginPath();
    ctx.arc(880, 90, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(250, 204, 21, 0.16)";
    ctx.beginPath();
    ctx.arc(840, 470, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(244, 114, 182, 0.16)";
    ctx.beginPath();
    ctx.arc(100, 480, 65, 0, Math.PI * 2);
    ctx.fill();
  } else if (activeTheme === "family") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_FAMILY,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fff7ed");
      grad.addColorStop(0.5, "#ffe4e6");
      grad.addColorStop(1, "#fed7aa");
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
    ctx.fillStyle = "rgba(251, 146, 60, 0.14)";
    ctx.beginPath();
    ctx.arc(480, 180, 110, 0, Math.PI * 2);
    ctx.fill();

    // Garden terrace strip at bottom
    ctx.fillStyle = "rgba(180, 120, 80, 0.16)";
    ctx.fillRect(0, 485, w, 55);
    ctx.strokeStyle = "rgba(180, 120, 80, 0.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 485);
    ctx.lineTo(w, 485);
    ctx.stroke();
  } else if (activeTheme === "body") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_BODY,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#f0fdfa");
      grad.addColorStop(0.5, "#ccfbf1");
      grad.addColorStop(1, "#dcfce7");
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
    ctx.strokeStyle = "rgba(253, 224, 71, 0.22)";
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.arc(480, 0, 220, 0, Math.PI);
    ctx.stroke();

    // Active park lawn
    ctx.fillStyle = "rgba(52, 211, 153, 0.22)";
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.bezierCurveTo(340, 460, 620, 505, w, 475);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  } else if (activeTheme === "weather") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_WEATHER,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#e0f2fe");
      grad.addColorStop(0.5, "#bae6fd");
      grad.addColorStop(1, "#fef9c3");
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
    ctx.strokeStyle = "rgba(248, 113, 113, 0.12)";
    ctx.beginPath();
    ctx.arc(480, 540, 420, Math.PI, 0);
    ctx.stroke();

    ctx.strokeStyle = "rgba(250, 204, 21, 0.12)";
    ctx.beginPath();
    ctx.arc(480, 540, 440, Math.PI, 0);
    ctx.stroke();

    ctx.strokeStyle = "rgba(96, 165, 250, 0.12)";
    ctx.beginPath();
    ctx.arc(480, 540, 460, Math.PI, 0);
    ctx.stroke();

    // Cheerful sun in upper left
    ctx.fillStyle = "rgba(251, 191, 36, 0.35)";
    ctx.beginPath();
    ctx.arc(120, 70, 34, 0, Math.PI * 2);
    ctx.fill();

    // Puffy clouds
    drawScenicCloud(ctx, 160, 80, 0.9);
    drawScenicCloud(ctx, 780, 85, 0.95);
  } else if (activeTheme === "festival") {
    let grad = getCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.BG_FESTIVAL,
      0
    );
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fff1f2");
      grad.addColorStop(0.5, "#fefce8");
      grad.addColorStop(1, "#e0f2fe");
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
    ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(240, 28, 720, 28, w, 12);
    ctx.stroke();

    // Pennant flags along bunting
    const flagColors = [
      "rgba(244, 63, 94, 0.45)",
      "rgba(251, 191, 36, 0.45)",
      "rgba(52, 211, 153, 0.45)",
      "rgba(59, 130, 246, 0.45)",
      "rgba(168, 85, 247, 0.45)",
    ];
    for (let i = 0; i < 9; i++) {
      const fx = 60 + i * 100;
      const fy = 14 + Math.sin((i / 8) * Math.PI) * 10;
      const color =
        flagColors[i % flagColors.length] ?? "rgba(244, 63, 94, 0.45)";
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
      [120, 180, "rgba(244, 63, 94, 0.3)"],
      [220, 280, "rgba(59, 130, 246, 0.3)"],
      [780, 240, "rgba(234, 179, 8, 0.3)"],
      [860, 160, "rgba(168, 85, 247, 0.3)"],
      [100, 390, "rgba(52, 211, 153, 0.3)"],
      [880, 390, "rgba(244, 63, 94, 0.3)"],
    ]);
  } else {
    // Default / general / classroom: Warm oatmeal paper base
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
      grad.addColorStop(0, "rgba(255, 250, 240, 0.65)");
      grad.addColorStop(1, "rgba(251, 249, 245, 0)");
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
    vignette.addColorStop(0, "rgba(255, 255, 255, 0)");
    vignette.addColorStop(1, "rgba(212, 197, 171, 0.12)");
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

function drawScenicCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number
): void {
  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  ctx.beginPath();
  ctx.arc(cx, cy, 20 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 18 * scale, cy - 8 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 36 * scale, cy, 19 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 18 * scale, cy + 6 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawScenicBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.beginPath();
  ctx.arc(
    cx - radius * 0.35,
    cy - radius * 0.35,
    radius * 0.28,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawScenicStars(
  ctx: CanvasRenderingContext2D,
  stars: readonly [number, number, number][]
): void {
  for (const s of stars) {
    if (!s) {
      continue;
    }
    const [sx, sy, sr] = s;
    ctx.fillStyle = "rgba(254, 240, 138, 0.65)";
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScenicFlowerDots(
  ctx: CanvasRenderingContext2D,
  dots: readonly [number, number, string][]
): void {
  for (const d of dots) {
    if (!d) {
      continue;
    }
    const [dx, dy, color] = d;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Hào quang màu hổ phách khi kéo vật phẩm qua ô đích */
export function drawTargetHoverAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  phase = 0
): void {
  ctx.save();
  const pulse = 1 + Math.sin(phase * Math.PI * 2) * 0.08;
  const r = radius * pulse;
  const auraGrad = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.3);
  auraGrad.addColorStop(0, "rgba(255, 191, 0, 0.45)");
  auraGrad.addColorStop(0.7, "rgba(255, 223, 160, 0.2)");
  auraGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPromptText(
  ctx: CanvasRenderingContext2D,
  rsOrPrompt: RenderSystem | string,
  promptMaybe?: string
): void {
  const prompt =
    typeof rsOrPrompt === "string" ? rsOrPrompt : (promptMaybe ?? "");
  const rs = typeof rsOrPrompt === "object" ? rsOrPrompt : undefined;
  const width = rs?.LOGIC_WIDTH ?? 960;
  const height = rs?.LOGIC_HEIGHT ?? 540;

  if (!prompt) {
    return;
  }

  ctx.save();
  ctx.font = `bold ${PROMPT_FONT_PX}px ${designTokens.fonts.sans}`;
  const textMetrics = ctx.measureText(prompt);
  const cardW = Math.max(360, Math.min(860, textMetrics.width + 100));
  const cardH = 54;
  const cardX = (width - cardW) / 2;
  const cardY = height * PROMPT_TOP_RATIO;
  const radius = 27;

  // Ambient card shadow
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.16)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.restore();

  // Floating claymorphic card body
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.stroke();

  // Honey Amber Speaker Icon Badge at left
  const badgeRadius = 18;
  const badgeX = cardX + 28;
  const badgeY = cardY + cardH / 2;
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Speaker symbol inside badge
  ctx.font =
    '18px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔊", badgeX, badgeY);

  // Prompt text
  ctx.fillStyle = designTokens.colors.surface[900];
  ctx.font = `bold 22px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(prompt, cardX + cardW / 2 + 14, cardY + cardH / 2);

  ctx.restore();
}

export function drawEmojiContent(
  ctx: CanvasRenderingContext2D,
  emojiRef: string,
  slot: Slot
): boolean {
  return drawAssetInSlot(ctx, { kind: "emoji", ref: emojiRef }, slot);
}

/** Thẻ gỗ trung tâm hiển thị vật thể / câu đố lớn cho trẻ (GT-001, GT-009, GT-026...) */
export function drawCentralTargetCard(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  asset?: RenderAsset | null,
  text?: string
): void {
  const cardW = 180;
  const cardH = 180;
  const cardX = (rs.LOGIC_WIDTH - cardW) / 2;
  const cardY = rs.LOGIC_HEIGHT * 0.22;
  const slot: Slot = {
    index: 0,
    x: cardX + cardW / 2,
    y: cardY + cardH / 2,
    w: cardW,
    h: cardH,
    hitW: cardW,
    hitH: cardH,
    page: 0,
    role: "target",
  };

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.2)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 2. 3D Bottom Wood Slab
  ctx.save();
  ctx.translate(0, 6);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 3. Card Body & Wooden Bevel Border
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  // 4. Specular White Highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardX + 28, cardY + 6);
  ctx.lineTo(cardX + cardW - 28, cardY + 6);
  ctx.stroke();

  // 5. Draw Asset or Text
  if (text) {
    drawTextInSlot(ctx, text, slot, designTokens.colors.montessori.amberDark);
  } else if (asset) {
    drawAssetInSlot(ctx, asset, slot);
  }

  ctx.restore();
}

/** Dock khay gỗ phía dưới cho các token lựa chọn */
export function drawWoodenTokenDock(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem
): void {
  const dockW = rs.LOGIC_WIDTH * 0.9;
  const dockH = 136;
  const dockX = (rs.LOGIC_WIDTH - dockW) / 2;
  const dockY = rs.LOGIC_HEIGHT - dockH - 12;
  const radius = 32;

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.16)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, radius);
  ctx.fill();
  ctx.restore();

  // 2. 3D Bottom Wood Slab
  ctx.save();
  ctx.translate(0, 4);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, radius);
  ctx.fill();
  ctx.restore();

  // 3. Dock Surface & Bevel
  ctx.fillStyle = designTokens.colors.surface[50];
  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, radius);
  ctx.fill();
  ctx.stroke();

  // 4. Specular highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dockX + radius, dockY + 4);
  ctx.lineTo(dockX + dockW - radius, dockY + 4);
  ctx.stroke();

  ctx.restore();
}

/** Dòng phụ dưới câu lệnh — tiêu chí lọc, tên mô hình đích, luật đang hiệu lực. */
export function drawSubPromptText(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  text: string
): void {
  if (!text) {
    return;
  }
  ctx.save();
  ctx.font = `16px ${designTokens.fonts.sans}`;
  const metrics = ctx.measureText(text);
  const pillW = Math.max(160, metrics.width + 36);
  const pillH = 32;
  const pillX = (rs.LOGIC_WIDTH - pillW) / 2;
  const pillY = rs.LOGIC_HEIGHT * PROMPT_TOP_RATIO + 56;

  // Sub-prompt pill background
  ctx.fillStyle = designTokens.colors.montessori.amberLight;
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = designTokens.colors.montessori.amberDark;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, rs.LOGIC_WIDTH / 2, pillY + pillH / 2);
  ctx.restore();
}

export function drawPlaceholderBox(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 2;
  const w = slot.w / 2;
  const h = slot.h / 2;
  ctx.fillRect(slot.x - w / 2, slot.y - h / 2, w, h);
  ctx.strokeRect(slot.x - w / 2, slot.y - h / 2, w, h);
  ctx.restore();
}

/** Vẽ nội dung asset vào tâm slot. Trả `false` khi không vẽ được gì. */
export function drawAssetInSlot(
  ctx: CanvasRenderingContext2D,
  asset: RenderAsset | null | undefined,
  slot: Slot
): boolean {
  if (!asset) {
    return false;
  }
  if (asset.kind === "text") {
    drawTextInSlot(ctx, asset.text, slot);
    return true;
  }
  if (asset.kind === "image") {
    // Ảnh bitmap chưa có đường nạp trong engine — ô thay thế trung tính
    // (`BR-ENG-09`: asset hỏng ❌ NEVER làm trống màn).
    drawPlaceholderBox(ctx, slot);
    return true;
  }
  const glyph = resolveEmojiGlyph(asset.ref);
  if (!glyph) {
    drawPlaceholderBox(ctx, slot);
    return true;
  }
  drawGlyphInSlot(ctx, glyph, slot);
  return true;
}

/** Mã tham chiếu emoji, ví dụ `🍎`. */
const EMOJI_CODE_REGEX = /^EMJ-[a-z0-9-]+$/i;

/**
 * Vẽ một glyph vào ô.
 *
 * Nhận cả **mã** `EMJ-*` lẫn ký tự thật, vì nơi gọi không phải lúc nào cũng
 * phân giải trước: `GT-004` truyền thẳng `group.label_emoji`, và ngày
 * 2026-09-01 chụp thật thấy chuỗi `⚽` / `👦` hiện **to bằng nửa
 * màn** cho trẻ 3-6 đọc. Mã không phân giải được thì vẽ ô thay thế, đúng ý đã
 * ghi ở `resolveEmojiGlyph()`: cấm — NEVER in mã ra màn hình cho trẻ.
 */
export function drawGlyphInSlot(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  slot: Slot
): void {
  let drawable = glyph;
  if (EMOJI_CODE_REGEX.test(drawable)) {
    const resolved = resolveEmojiGlyph(drawable);
    // Sau Task #202, `resolveEmojiGlyph` coi ref chính là glyph và trả nguyên
    // chuỗi vào. Nên mã `EMJ-*` còn sót lại trong corpus sẽ quay về y hệt —
    // cấm — NEVER vẽ nó, và cấm gọi đệ quy vì nó không bao giờ hội tụ.
    if (!resolved || EMOJI_CODE_REGEX.test(resolved)) {
      drawPlaceholderBox(ctx, slot);
      return;
    }
    drawable = resolved;
  }
  const size = Math.floor(Math.min(slot.w, slot.h) * GLYPH_FILL_RATIO);
  ctx.save();
  ctx.font = `${size}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(drawable, slot.x, slot.y);
  ctx.restore();
}

/** Chữ vẽ thay asset — số, dấu, giá trị phương án. */
export function drawTextInSlot(
  ctx: CanvasRenderingContext2D,
  text: string,
  slot: Slot,
  color: string = designTokens.colors.surface[800]
): void {
  const size = Math.floor(Math.min(slot.w, slot.h) * 0.42);
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px ${designTokens.fonts.heading}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, slot.x, slot.y);
  ctx.restore();
}

export function drawSlotLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  slot: Slot
): void {
  const size = Math.max(
    LABEL_MIN_FONT_PX,
    Math.floor(Math.min(slot.w, slot.h) * LABEL_FONT_RATIO)
  );
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[600];
  ctx.font = `${size}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(text, slot.x, slot.y + slot.h / 2 + 4);
  ctx.restore();
}

/**
 * Một vật thể hoàn chỉnh trong một slot: thân clay, nội dung, nhãn, dấu đúng.
 *
 * Đây là đường vẽ mà **mọi** engine dùng cho danh sách item của nó. Không engine
 * nào tự đặt toạ độ: `slot` tới từ `resolveLayout()`, nên vùng chạm theo band
 * tuổi được giữ nguyên (`BR-ERC-02`).
 */
export function drawSlotItem(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: RenderItem,
  shape: "circle" | "square" = "circle"
): void {
  const state = item.state ?? "idle";
  const { fill, border } = getColorsForState(state);
  const radius = Math.min(slot.w, slot.h) / 2;

  rs.drawClayBody(ctx, slot.x, slot.y, radius, fill, border, shape);

  if (item.text !== undefined) {
    drawTextInSlot(ctx, item.text, slot);
  } else if (!drawAssetInSlot(ctx, item.asset, slot)) {
    drawPlaceholderBox(ctx, slot);
  }

  if (item.label) {
    drawSlotLabel(ctx, item.label, slot);
  }
  if (state === "correct") {
    drawCheckMark(ctx, slot);
  }
}

/** Ghép danh sách item với danh sách slot theo chỉ số, bỏ qua phần thừa. */
export function drawSlotItems(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slots: readonly Slot[],
  items: readonly RenderItem[],
  shape: "circle" | "square" = "circle"
): void {
  const count = Math.min(slots.length, items.length);
  for (let i = 0; i < count; i++) {
    const slot = slots[i];
    const item = items[i];
    if (slot && item) {
      drawSlotItem(ctx, rs, slot, item, shape);
    }
  }
}

export function drawCheckMark(ctx: CanvasRenderingContext2D, slot: Slot): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const badgeR = Math.max(12, r * 0.32);
  const cx = slot.x + r * 0.55;
  const cy = slot.y - r * 0.55;
  const arm = badgeR * 0.55;

  ctx.save();
  // Emerald circle badge
  ctx.fillStyle = designTokens.colors.montessori.emeraldBright;
  ctx.strokeStyle = designTokens.colors.montessori.emerald;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crisp white checkmark
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = Math.max(2.5, badgeR * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - arm * 0.7, cy);
  ctx.lineTo(cx - arm * 0.1, cy + arm * 0.6);
  ctx.lineTo(cx + arm * 0.7, cy - arm * 0.5);
  ctx.stroke();
  ctx.restore();
}

/** Ô đích rỗng — viền đứt, hốc chìm chờ trẻ thả vật vào. */
export function drawEmptyTargetSlot(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  ctx.save();
  const r = Math.min(slot.w, slot.h) / 2;
  const radius = Math.max(12, r * 0.25);

  // 1. Soft recessed inner shadow (sunken wooden socket)
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(slot.x - r, slot.y - r, r * 2, r * 2, radius);
  ctx.fill();

  // Inset rim shadow
  ctx.strokeStyle = "rgba(130, 118, 96, 0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 2. Dashed warm honey amber guide border
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.roundRect(
    slot.x - r + 3,
    slot.y - r + 3,
    (r - 3) * 2,
    (r - 3) * 2,
    Math.max(10, r * 0.2)
  );
  ctx.stroke();
  ctx.restore();
}

export function drawSlotOutline(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  color: string,
  lineWidth: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(
    slot.x - slot.hitW / 2,
    slot.y - slot.hitH / 2,
    slot.hitW,
    slot.hitH
  );
  ctx.restore();
}

export function drawLabelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color = designTokens.colors.surface[700]
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawCounterBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  current: number,
  total: number
): void {
  ctx.save();
  ctx.fillStyle = designTokens.colors.brand[600];
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.font = `14px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${current}/${total}`, x, y);
  ctx.restore();
}

/** Đồng hồ tiến độ ở góc trên phải — vị trí suy từ khung logic, không hằng số. */
export function drawProgressBadge(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  current: number,
  total: number
): void {
  drawCounterBadge(ctx, rs.LOGIC_WIDTH - 44, 40, current, total);
}

export function drawDividerLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.save();
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawMatchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = designTokens.colors.semantic.success[500]
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawGridCell(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  fill: string,
  border: string
): void {
  ctx.save();
  ctx.fillStyle = fill;
  const rx = slot.x - slot.hitW / 2;
  const ry = slot.y - slot.hitH / 2;
  ctx.fillRect(rx, ry, slot.hitW, slot.hitH);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(rx, ry, slot.hitW, slot.hitH);
  ctx.restore();
}

const PARTICLE_COLORS = [
  designTokens.colors.semantic.success[400],
  designTokens.colors.cta[400],
  designTokens.colors.brand[400],
] as const;

export function spawnParticlesAtSlot(slot: Slot, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const spread = 1.5 + ((i * 7 + 3) % 5) * 0.4;
    particles.push({
      x: slot.x,
      y: slot.y,
      vx: Math.cos(angle) * spread,
      vy: Math.sin(angle) * spread,
      color:
        PARTICLE_COLORS[i % PARTICLE_COLORS.length] ??
        designTokens.colors.semantic.success[400],
      size: 3 + ((i * 3 + 1) % 4),
      life: 1,
      maxLife: 1,
    });
  }
  return particles;
}

const PARTICLE_GRAVITY = 0.05;
const PARTICLE_DECAY = 0.02;

/**
 * Bước một khung hạt — trả mảng MỚI, ❌ NEVER sửa hạt tại chỗ.
 *
 * Bản trước cộng dồn thẳng vào `p.x`/`p.life` rồi mới lọc, nên cùng một mảng bị
 * chia sẻ giữa `renderParticles` của session và bất kỳ ai còn giữ tham chiếu —
 * replay và snapshot test đọc phải trạng thái đã trôi.
 */
export function updateParticles(particles: readonly Particle[]): Particle[] {
  const next: Particle[] = [];
  for (const p of particles) {
    const life = p.life - PARTICLE_DECAY;
    if (life <= 0) {
      continue;
    }
    next.push({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + PARTICLE_GRAVITY,
      life,
    });
  }
  return next;
}

export interface LiquidCupParams {
  readonly cupId: string;
  readonly shape: "standard" | "narrow_tall" | "wide_short" | "fluted";
  readonly capacityUnits: number;
  readonly fillUnits: number;
  readonly color?: string;
  readonly isSelected?: boolean;
  readonly showHintMarks?: boolean;
}

export function drawLiquidCup(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  params: LiquidCupParams
): void {
  const baseW = slot.w * 0.8;
  const baseH = slot.h * 0.85;

  let wFactor = 1.0;
  let hFactor = 1.0;

  if (params.shape === "narrow_tall") {
    wFactor = 0.7;
    hFactor = 1.25;
  } else if (params.shape === "wide_short") {
    wFactor = 1.35;
    hFactor = 0.75;
  } else if (params.shape === "fluted") {
    wFactor = 1.1;
    hFactor = 1.0;
  }

  const cupW = baseW * wFactor;
  const cupH = baseH * hFactor;
  const x = slot.x - cupW / 2;
  const y = slot.y - cupH / 2 + (baseH - cupH) / 2;

  ctx.save();

  // Glass Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(x, y, cupW, cupH, [6, 6, 16, 16]);
  ctx.fill();
  ctx.stroke();

  // Liquid fill calculation (BR-E032-03)
  const fillRatio =
    params.capacityUnits > 0
      ? Math.min(1, Math.max(0, params.fillUnits / params.capacityUnits))
      : 0;

  const liquidH = cupH * fillRatio;
  const liquidY = y + cupH - liquidH;

  if (liquidH > 0) {
    ctx.save();
    // Clip inside cup
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, cupW - 4, cupH - 4, [4, 4, 14, 14]);
    ctx.clip();

    // Draw liquid
    ctx.fillStyle = designTokens.colors.brand[500];
    if (params.color === "mint") {
      ctx.fillStyle = designTokens.colors.semantic.success[500];
    } else if (params.color === "berry") {
      ctx.fillStyle = designTokens.colors.semantic.danger[400];
    } else if (params.color === "amber") {
      ctx.fillStyle = designTokens.colors.retry[500];
    }

    ctx.fillRect(x, liquidY, cupW, liquidH);

    // Meniscus / surface highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillRect(x, liquidY, cupW, Math.min(6, liquidH));
    ctx.restore();
  }

  // Hint Marks (tick marks)
  if (params.showHintMarks) {
    ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
    ctx.lineWidth = 2;
    for (let step = 1; step < params.capacityUnits; step++) {
      const stepY = y + cupH - (cupH * step) / params.capacityUnits;
      ctx.beginPath();
      ctx.moveTo(x + 4, stepY);
      ctx.lineTo(x + 14, stepY);
      ctx.stroke();
    }
  }

  // Selected highlight
  if (params.isSelected) {
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, cupW + 8, cupH + 8, [10, 10, 20, 20]);
    ctx.stroke();
  }

  ctx.restore();
}

export interface WeaveCellParams {
  readonly cellIndex: number;
  readonly colorId: string | null;
  readonly isOriginal: boolean;
  readonly isSelected?: boolean;
  readonly isBrokenRow?: boolean;
  readonly isBrokenCol?: boolean;
}

export function drawWeaveCell(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  params: WeaveCellParams
): void {
  const w = slot.w;
  const h = slot.h;
  const x = slot.x - w / 2;
  const y = slot.y - h / 2;

  ctx.save();

  // Cell base background
  ctx.fillStyle = params.colorId
    ? getColorForYarn(params.colorId)
    : designTokens.colors.surface[100];
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = 2;

  if (params.isBrokenRow || params.isBrokenCol) {
    ctx.strokeStyle = designTokens.colors.retry[500];
    ctx.lineWidth = 4;
  }

  if (params.isSelected) {
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 4;
  }

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Weave texture lines if color is present
  if (params.colorId) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Horizontal yarn line
    ctx.moveTo(x + 4, y + h / 2);
    ctx.lineTo(x + w - 4, y + h / 2);
    // Vertical yarn line
    ctx.moveTo(x + w / 2, y + 4);
    ctx.lineTo(x + w / 2, y + h - 4);
    ctx.stroke();
  } else {
    // Empty dashed border indicator
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = designTokens.colors.surface[400];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 4);
    ctx.stroke();
  }

  ctx.restore();
}

function getColorForYarn(colorId: string): string {
  switch (colorId.toLowerCase()) {
    case "red":
    case "berry":
      return designTokens.colors.semantic.danger[400];
    case "blue":
    case "sky":
      return designTokens.colors.brand[500];
    case "yellow":
    case "amber":
      return designTokens.colors.montessori.amber;
    case "green":
    case "mint":
      return designTokens.colors.semantic.success[500];
    case "purple":
    case "indigo":
      return designTokens.colors.montessori.indigo;
    case "orange":
      return designTokens.colors.cta[500];
    default:
      return designTokens.colors.brand[400];
  }
}

const DIGIT_REGEX = /^\d+$/;

export function drawFlashcardFrame(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cardW: number,
  cardH: number
): void {
  // 1. Warm ambient drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(30, 27, 75, 0.12)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.beginPath();
  ctx.roundRect(left, top, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 2. 3D bottom slab
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.beginPath();
  ctx.roundRect(left, top + 5, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 3. Main card white body
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(left, top, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  // 4. White top specular highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left + 28, top + 4);
  ctx.lineTo(left + cardW - 28, top + 4);
  ctx.stroke();
  ctx.restore();
}

function drawFlashcardNonNumberContent(
  ctx: CanvasRenderingContext2D,
  asset: {
    asset_id: string;
    label: string;
    value?: number;
    glyph?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  x: number,
  y: number,
  labelToDraw: string
): void {
  if (asset.image_ref?.kind === "emoji" && asset.image_ref.ref) {
    ctx.save();
    ctx.font = `84px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(asset.image_ref.ref, x, y - 25);
    ctx.restore();
  } else if (asset.glyph) {
    ctx.save();
    ctx.font = `bold 100px ${designTokens.fonts.heading}`;
    ctx.fillStyle = designTokens.colors.brand[600];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(asset.glyph, x, y - 25);
    ctx.restore();
  }

  ctx.save();
  ctx.font = `bold 24px ${designTokens.fonts.sans}`;
  ctx.fillStyle = designTokens.colors.surface[800];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelToDraw, x, y + 80);
  ctx.restore();
}

function drawFlashcardCounterItems(
  ctx: CanvasRenderingContext2D,
  itemEmoji: string,
  val: number,
  cardW: number,
  x: number,
  y: number
): void {
  const maxCount = Math.min(val, 10);
  const gap = Math.min(60, (cardW - 60) / maxCount);
  const startX = x - ((maxCount - 1) * gap) / 2;

  ctx.save();
  ctx.font = `44px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < maxCount; i++) {
    ctx.fillText(itemEmoji, startX + i * gap, y + 55);
  }
  ctx.restore();
}

function drawFlashcardNumberContent(
  ctx: CanvasRenderingContext2D,
  asset: {
    asset_id: string;
    label: string;
    value?: number;
    glyph?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  val: number,
  cardW: number,
  x: number,
  y: number,
  labelToDraw: string
): void {
  // Large orange numeral
  ctx.save();
  ctx.font = `bold 100px ${designTokens.fonts.heading}`;
  ctx.fillStyle = designTokens.colors.cta[500];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(val), x, y - 50);
  ctx.restore();

  if (val === 0) {
    ctx.save();
    ctx.font = `18px ${designTokens.fonts.sans}`;
    ctx.fillStyle = designTokens.colors.surface[500];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("(Không có đồ vật nào)", x, y + 55);
    ctx.restore();
  } else {
    const itemEmoji =
      asset.image_ref?.kind === "emoji" &&
      asset.image_ref.ref &&
      !asset.image_ref.ref.includes("️⃣")
        ? asset.image_ref.ref
        : "⚽";
    drawFlashcardCounterItems(ctx, itemEmoji, val, cardW, x, y);
  }

  // Label at bottom
  ctx.save();
  ctx.font = `bold 22px ${designTokens.fonts.sans}`;
  ctx.fillStyle = designTokens.colors.surface[700];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelToDraw, x, y + 115);
  ctx.restore();
}

export function drawFlashcard(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  asset: {
    asset_id: string;
    label: string;
    value?: number;
    glyph?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  displayLabel?: string
): void {
  const cardW = 350;
  const cardH = 320;
  const x = slot.x;
  const y = slot.y;
  const left = x - cardW / 2;
  const top = y - cardH / 2;

  drawFlashcardFrame(ctx, left, top, cardW, cardH);

  const hasDigit = Boolean(asset.glyph && DIGIT_REGEX.test(asset.glyph));
  const val =
    asset.value ??
    (hasDigit ? Number.parseInt(asset.glyph as string, 10) : undefined);

  const labelToDraw = displayLabel ?? asset.label;

  if (val === undefined) {
    drawFlashcardNonNumberContent(ctx, asset, x, y, labelToDraw);
  } else {
    drawFlashcardNumberContent(ctx, asset, val, cardW, x, y, labelToDraw);
  }
}
