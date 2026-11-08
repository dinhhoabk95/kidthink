import { designTokens } from "#src/systems/designTokens";
import { alpha } from "./color-utils.js";

export function drawScenicCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number
): void {
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.68);
  ctx.beginPath();
  ctx.arc(cx, cy, 20 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 18 * scale, cy - 8 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 36 * scale, cy, 19 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 18 * scale, cy + 6 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fill();
}

export function drawScenicBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.55);
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

export function drawScenicStars(
  ctx: CanvasRenderingContext2D,
  stars: readonly [number, number, number][]
): void {
  for (const s of stars) {
    if (!s) {
      continue;
    }
    const [sx, sy, sr] = s;
    ctx.fillStyle = alpha(designTokens.colors.semantic.warning[200], 0.65);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawScenicFlowerDots(
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

/** Buổi trong ngày của cảnh (`BR-E016-06`). */
export type SkyTimeOfDay = "morning" | "noon" | "afternoon" | "night";

/** Hộp cảnh mà lớp bầu trời phủ lên. */
export interface SkyBox {
  readonly h: number;
  readonly w: number;
  readonly x: number;
  readonly y: number;
}

/** Tâm và bán kính lõi của mặt trời/trăng trong một khung. */
export interface SkyBodyPlacement {
  readonly r: number;
  readonly x: number;
  readonly y: number;
}

interface SkyLook {
  readonly core: string;
  readonly halo: string | null;
  readonly sky: string;
  readonly stars: boolean;
}

const SKY_ALPHA = 0.55;
/** Lõi mặt trời/trăng, tỉ lệ cạnh ngắn của hộp. */
const SKY_BODY_RADIUS = 0.07;
/**
 * Tâm mặt trời/trăng cách góc trên-trái của hộp một đoạn bằng tỉ lệ này của
 * cạnh ngắn. 0.1 giữ lõi ngoài mặt đồng hồ cả ở sân khấu vuông (mặt đồng hồ
 * bán kính 0.46 cạnh, tâm giữa hộp: khe chéo ở góc còn ~0.106 > 0.07).
 */
const SKY_BODY_INSET = 0.1;
/**
 * Quầng mặt trời, bội của bán kính lõi. Giữ `SKY_BODY_RADIUS * SKY_HALO` <
 * `SKY_BODY_INSET` để quầng nằm gọn trong hộp (`BR-PSZ-01`).
 */
const SKY_HALO = 1.4;
/** Đĩa "cắn" tạo trăng khuyết: lệch tâm và bán kính, bội của bán kính trăng. */
const MOON_BITE_DX = 0.45;
const MOON_BITE_DY = -0.2;
const MOON_BITE_R = 0.85;
/** Quãng mặt trời đi lên (tỉ lệ cạnh ngắn) trước khi đứng ở chỗ. */
const SKY_RISE = 0.12;
const SKY_STARS: readonly (readonly [number, number, number])[] = [
  [0.3, 0.06, 0.009],
  [0.5, 0.12, 0.011],
  [0.66, 0.05, 0.009],
  [0.92, 0.1, 0.012],
  [0.94, 0.3, 0.01],
  [0.06, 0.32, 0.008],
];

function skyLook(timeOfDay: SkyTimeOfDay): SkyLook {
  const { cta, scene, semantic } = designTokens.colors;
  switch (timeOfDay) {
    case "morning":
      return {
        sky: semantic.warning[100],
        core: semantic.warning[300],
        halo: semantic.warning[200],
        stars: false,
      };
    case "noon":
      return {
        sky: scene.sky[200],
        core: semantic.warning[300],
        halo: semantic.warning[200],
        stars: false,
      };
    case "afternoon":
      return {
        sky: cta[200],
        core: cta[400],
        halo: cta[300],
        stars: false,
      };
    default:
      return {
        sky: scene.night[900],
        core: scene.mist,
        halo: null,
        stars: true,
      };
  }
}

function easeOut(p: number): number {
  const t = Math.min(1, Math.max(0, p));
  return 1 - (1 - t) * (1 - t);
}

/**
 * Vị trí mặt trời/trăng (`BR-E016-06`). Trạng thái cuối **như nhau với cả bốn
 * buổi**: góc trên-trái của hộp. Vị trí đổi theo buổi sẽ thành mũi tên chỉ kim
 * giờ — giờ sáng (6–11) nằm ở nửa trái mặt đồng hồ, giờ chiều (1–5) ở nửa phải,
 * trưa ở đỉnh — nên buổi chỉ được nói bằng màu trời, mặt trời hay trăng và sao.
 * Mặt trời đi lên `SKY_RISE` trong lúc `progress` 0→1; trăng đứng yên, hiện dần.
 */
export function skyBodyPlacement(
  box: SkyBox,
  timeOfDay: SkyTimeOfDay,
  progress: number
): SkyBodyPlacement {
  const side = Math.min(box.w, box.h);
  const rise = timeOfDay === "night" ? 0 : 1 - easeOut(progress);
  return {
    x: box.x + side * SKY_BODY_INSET,
    y: box.y + side * (SKY_BODY_INSET + SKY_RISE * rise),
    r: side * SKY_BODY_RADIUS,
  };
}

/**
 * Viền trăng khuyết = đĩa trăng trừ đĩa cắn, vẽ thẳng bằng hai cung nối nhau
 * thay vì tô màu trời đè lên: tô đè sẽ đậm hơn lớp trời trong suốt và lộ một
 * vệt tối ngoài mép trăng.
 */
function traceCrescent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
): void {
  const bx = x + r * MOON_BITE_DX;
  const by = y + r * MOON_BITE_DY;
  const br = r * MOON_BITE_R;
  const d = Math.hypot(bx - x, by - y);
  const toward = Math.atan2(by - y, bx - x);
  // Hai giao điểm nhìn từ tâm trăng nằm ở `toward ± spread`.
  const spread = Math.acos((d * d + r * r - br * br) / (2 * d * r));
  const startAngle = toward + spread;
  const endAngle = toward - spread;
  // Cung ngoài: phía trăng xa đĩa cắn.
  ctx.arc(x, y, r, startAngle, endAngle + Math.PI * 2);
  // Cung trong: phần đĩa cắn nằm trong trăng, đi ngược về giao điểm đầu.
  const fromBite = Math.atan2(
    y + r * Math.sin(endAngle) - by,
    x + r * Math.cos(endAngle) - bx
  );
  const toBite = Math.atan2(
    y + r * Math.sin(startAngle) - by,
    x + r * Math.cos(startAngle) - bx
  );
  ctx.arc(bx, by, br, fromBite, toBite, true);
  ctx.closePath();
}

/**
 * Lớp bầu trời theo giờ trong ngày, phủ lên nền cảnh (`BR-E016-06`): sáng /
 * trưa / chiều / trăng sao. `progress` 0..1 là đà của chuyển động (mặt trời lên
 * chỗ, trăng và sao hiện dần); 1 là trạng thái cuối. Màu lấy từ `designTokens`,
 * toạ độ theo tỉ lệ của `box`, mọi nét nằm gọn trong `box`.
 */
export function drawTimeOfDaySky(
  ctx: CanvasRenderingContext2D,
  box: SkyBox,
  timeOfDay: SkyTimeOfDay,
  progress: number
): void {
  const look = skyLook(timeOfDay);
  const p = easeOut(progress);
  const side = Math.min(box.w, box.h);
  const { x, y, r } = skyBodyPlacement(box, timeOfDay, progress);

  ctx.save();
  ctx.globalAlpha = SKY_ALPHA;
  ctx.fillStyle = look.sky;
  ctx.fillRect(box.x, box.y, box.w, box.h);

  if (look.stars) {
    ctx.globalAlpha = p;
    ctx.fillStyle = designTokens.colors.semantic.warning[200];
    for (const [sx, sy, sr] of SKY_STARS) {
      ctx.beginPath();
      ctx.arc(
        box.x + box.w * sx,
        box.y + box.h * sy,
        side * sr,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.globalAlpha = look.stars ? p : 1;
  if (look.halo) {
    ctx.fillStyle = alpha(look.halo, 0.5);
    ctx.beginPath();
    ctx.arc(x, y, r * SKY_HALO, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = look.core;
  ctx.beginPath();
  if (look.stars) {
    traceCrescent(ctx, x, y, r);
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}
