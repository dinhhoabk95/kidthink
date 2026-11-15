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
  stars: readonly [number, number, number][],
  timeMs = 0
): void {
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    if (!s) {
      continue;
    }
    const [sx, sy, sr] = s;
    const twinkle =
      timeMs > 0
        ? 1 + Math.sin((timeMs / 3200) * Math.PI * 2 + i * 0.9) * 0.18
        : 1;
    ctx.fillStyle = alpha(designTokens.colors.semantic.warning[200], 0.65);
    ctx.beginPath();
    ctx.arc(sx, sy, sr * twinkle, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawScenicFlowerDots(
  ctx: CanvasRenderingContext2D,
  dots: readonly [number, number, string][],
  timeMs = 0
): void {
  for (let i = 0; i < dots.length; i++) {
    const d = dots[i];
    if (!d) {
      continue;
    }
    const [dx, dy, color] = d;
    const sway =
      timeMs > 0 ? Math.sin((timeMs / 4500) * Math.PI * 2 + i * 0.7) * 2.4 : 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dx + sway, dy, 4, 0, Math.PI * 2);
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

// ── Con vật cần đo (GT-030, `BR-E030-11`) ────────────────────────────

/** Con vật dài, nằm ngang được, dùng làm vật đo. Tập đóng (`BR-E030-11`). */
export const MEASURED_ANIMALS = [
  "caterpillar",
  "snake",
  "worm",
  "crocodile",
] as const;

export type MeasuredAnimal = (typeof MEASURED_ANIMALS)[number];

/**
 * Số lớn nhất trong các nhóm chi tiết lặp của từng con vật (đốt, đốm, vòng, gờ
 * lưng, chân). Là **hằng số**, không đổi theo chiều dài vẽ, và dưới ngưỡng 4 mà
 * mục 14 của phiếu coi là "nhìn là đếm xong", nên không đếm chi tiết nào ra
 * được số đơn vị (`BR-E030-11`).
 */
export const MEASURED_ANIMAL_REPEAT_COUNT: Readonly<
  Record<MeasuredAnimal, number>
> = {
  caterpillar: 3,
  snake: 3,
  worm: 2,
  crocodile: 3,
};

/** Khung của vật đo mà con vật phải khớp hai mép trái/phải. */
export interface AnimalRect {
  readonly h: number;
  readonly w: number;
  readonly x: number;
  readonly y: number;
}

/** Cao thân tối đa so với chiều dài: vật đo ngắn thì thân mảnh lại, không phình. */
const ANIMAL_MAX_BODY_RATIO = 0.45;
/** Biên độ ngọ nguậy dọc, tỉ lệ nửa cao thân. */
const ANIMAL_WIGGLE = 0.08;
/** Bề dày nét viền (px logic); hình học thụt vào nửa nét để mép mực khớp khung. */
const ANIMAL_LINE_WIDTH = 2;
/** Số mẫu dọc thân của rắn và giun: cố định, không theo chiều dài. */
const ANIMAL_SAMPLES = 24;

interface AnimalFrame {
  /** Mép trái và mép phải: đầu và đuôi chạm đúng hai chỗ này. */
  readonly left: number;
  readonly right: number;
  readonly cy: number;
  /** Nửa cao thân. */
  readonly half: number;
  readonly w: number;
}

type Painter = (
  ctx: CanvasRenderingContext2D,
  f: AnimalFrame,
  phase: number
) => void;

function paintShape(
  ctx: CanvasRenderingContext2D,
  fill: string,
  stroke: string
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.fill();
  ctx.stroke();
}

function paintEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  stroke: string
): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  paintShape(ctx, fill, stroke);
}

function paintEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
): void {
  const m = designTokens.colors.montessori;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = m.paper;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.2, y, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = m.amberDark;
  ctx.fill();
}

function paintCaterpillar(
  ctx: CanvasRenderingContext2D,
  f: AnimalFrame,
  phase: number
): void {
  const m = designTokens.colors.montessori;
  // Ba đốt thân to dần và chồng nhau; tâm đốt (kể cả đầu) cách nhau 0,17 ·
  // 0,26 · 0,31 chiều dài — **không đều**, nên ở chiều dài nào các đốt cũng
  // không xếp thành "một đốt một đơn vị". Mỗi đốt bập bênh lệch pha.
  const segments: readonly (readonly [number, number, number])[] = [
    [0.12, 0.12, 0.6],
    [0.29, 0.15, 0.76],
    [0.55, 0.2, 0.9],
  ];
  segments.forEach(([cx, rx, ry], i) => {
    const bob = Math.sin(phase + i * 1.4) * f.half * ANIMAL_WIGGLE;
    paintEllipse(
      ctx,
      f.left + cx * f.w,
      f.cy + bob,
      rx * f.w,
      ry * f.half,
      m.emeraldBright,
      m.emerald
    );
  });
  const hx = f.right - 0.14 * f.w;
  const headRy = f.half * 0.8;
  ctx.strokeStyle = m.amberDark;
  for (const dx of [-0.03, 0.05]) {
    ctx.beginPath();
    ctx.moveTo(hx + dx * f.w, f.cy - headRy * 0.9);
    ctx.lineTo(hx + (dx + 0.02) * f.w, f.cy - f.half);
    ctx.stroke();
  }
  paintEllipse(ctx, hx, f.cy, 0.14 * f.w, headRy, m.amber, m.amberDark);
  const eye = Math.min(f.half * 0.2, 0.025 * f.w);
  paintEye(ctx, hx - 0.02 * f.w, f.cy - headRy * 0.2, eye);
  paintEye(ctx, hx + 0.06 * f.w, f.cy - headRy * 0.2, eye);
}

/** Đa giác thân ống: mép trên đi xuôi, mép dưới đi ngược, `count + 1` điểm mỗi mép. */
function tracedTube(
  ctx: CanvasRenderingContext2D,
  f: AnimalFrame,
  t1: number,
  centre: (t: number) => number,
  thickness: (t: number) => number
): void {
  ctx.beginPath();
  for (let i = 0; i <= ANIMAL_SAMPLES; i++) {
    const t = (i / ANIMAL_SAMPLES) * t1;
    const x = f.left + t * f.w;
    const y = centre(t) - thickness(t);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  for (let i = ANIMAL_SAMPLES; i >= 0; i--) {
    const t = (i / ANIMAL_SAMPLES) * t1;
    ctx.lineTo(f.left + t * f.w, centre(t) + thickness(t));
  }
  ctx.closePath();
}

function paintSnake(
  ctx: CanvasRenderingContext2D,
  f: AnimalFrame,
  phase: number
): void {
  const m = designTokens.colors.montessori;
  const amp = f.half * 0.34;
  const centre = (t: number): number =>
    f.cy + amp * Math.sin(Math.PI * 3 * t + phase);
  // Đuôi nhọn chạm mép trái, thân dày dần rồi giữ nguyên tới cổ.
  const thickness = (t: number): number => f.half * 0.6 * Math.min(1, t / 0.35);
  tracedTube(ctx, f, 0.92, centre, thickness);
  paintShape(ctx, m.indigoLight, m.indigo);
  // Ba đốm lưng, số đốm cố định, cách nhau không đều (0,13 · 0,21).
  for (const t of [0.34, 0.47, 0.68]) {
    paintEllipse(
      ctx,
      f.left + t * f.w,
      centre(t),
      0.03 * f.w,
      f.half * 0.22,
      m.indigo,
      m.indigo
    );
  }
  // Đầu bầu dục chạm mép phải.
  const hy = centre(0.92);
  paintEllipse(
    ctx,
    f.right - 0.08 * f.w,
    hy,
    0.08 * f.w,
    f.half * 0.55,
    m.indigoLight,
    m.indigo
  );
  paintEye(
    ctx,
    f.right - 0.06 * f.w,
    hy - f.half * 0.15,
    Math.min(f.half * 0.2, 0.025 * f.w)
  );
}

function paintWorm(
  ctx: CanvasRenderingContext2D,
  f: AnimalFrame,
  phase: number
): void {
  const m = designTokens.colors.montessori;
  const amp = f.half * 0.18;
  const centre = (t: number): number =>
    f.cy + amp * Math.sin(Math.PI * 2 * t + phase);
  // Hai đầu tròn: dày theo siêu elip, về 0 đúng ở hai mép.
  const thickness = (t: number): number =>
    f.half * 0.62 * (1 - Math.abs(2 * t - 1) ** 4) ** 0.25;
  tracedTube(ctx, f, 1, centre, thickness);
  paintShape(ctx, m.coralLight, m.coral);
  // Hai vòng đai.
  ctx.strokeStyle = m.coral;
  for (const t of [0.3, 0.37]) {
    ctx.beginPath();
    ctx.moveTo(f.left + t * f.w, centre(t) - thickness(t) * 0.9);
    ctx.lineTo(f.left + t * f.w, centre(t) + thickness(t) * 0.9);
    ctx.stroke();
  }
  paintEye(
    ctx,
    f.left + 0.88 * f.w,
    centre(0.88) - thickness(0.88) * 0.2,
    Math.min(f.half * 0.16, 0.02 * f.w)
  );
}

/** Viền thân cá sấu: (phần chiều dài, phần chiều cao thân tính từ trục). */
const CROCODILE_OUTLINE: readonly (readonly [number, number])[] = [
  [0, 0.1],
  [0.18, -0.12],
  [0.28, -0.22],
  [0.62, -0.22],
  [0.74, -0.14],
  [0.82, -0.12],
  [1, -0.06],
  [1, 0.06],
  [0.82, 0.1],
  [0.72, 0.2],
  [0.62, 0.24],
  [0.28, 0.24],
  [0.18, 0.14],
];

function paintCrocodile(ctx: CanvasRenderingContext2D, f: AnimalFrame): void {
  const m = designTokens.colors.montessori;
  const bodyH = f.half * 2;
  const px = (fx: number): number => f.left + fx * f.w;
  const py = (fy: number): number => f.cy + fy * bodyH;
  // Hai chân nhìn thấy (phía gần).
  for (const fx of [0.34, 0.7]) {
    paintEllipse(
      ctx,
      px(fx),
      py(0.3),
      0.045 * f.w,
      0.16 * bodyH,
      m.emerald,
      m.amberDark
    );
  }
  ctx.beginPath();
  CROCODILE_OUTLINE.forEach(([fx, fy], i) => {
    if (i === 0) {
      ctx.moveTo(px(fx), py(fy));
    } else {
      ctx.lineTo(px(fx), py(fy));
    }
  });
  ctx.closePath();
  paintShape(ctx, m.emerald, m.amberDark);
  // Ba gờ lưng, cách nhau không đều (0,11 · 0,17).
  for (const fx of [0.29, 0.4, 0.57]) {
    ctx.beginPath();
    ctx.moveTo(px(fx - 0.04), py(-0.22));
    ctx.lineTo(px(fx), py(-0.35));
    ctx.lineTo(px(fx + 0.04), py(-0.22));
    ctx.closePath();
    paintShape(ctx, m.emeraldBright, m.amberDark);
  }
  // Đường miệng dài từ mõm vào gần mắt: dấu hiệu cá sấu, không phải chi tiết lặp.
  ctx.strokeStyle = m.amberDark;
  ctx.beginPath();
  ctx.moveTo(px(0.99), py(0.01));
  ctx.lineTo(px(0.84), py(0.02));
  ctx.lineTo(px(0.8), py(-0.01));
  ctx.stroke();
  paintEye(ctx, px(0.8), py(-0.08), Math.min(0.07 * bodyH, 0.02 * f.w));
}

const ANIMAL_PAINTERS: Readonly<Record<MeasuredAnimal, Painter>> = {
  caterpillar: paintCaterpillar,
  snake: paintSnake,
  worm: paintWorm,
  crocodile: (ctx, f) => paintCrocodile(ctx, f),
};

/**
 * Vẽ con vật cần đo vào `rect` (`BR-E030-11`): **đầu và đuôi chạm đúng mép trái
 * và mép phải, tính cả nét viền** — hình học thụt vào nửa nét
 * (`ANIMAL_LINE_WIDTH / 2`) ở mọi phía nên mép mực ngoài cùng trùng mép `rect`,
 * và chiều dài nhìn thấy bằng đúng `rect.w` (chiều dài thật của vật đo). Hình
 * chỉ co giãn ngang theo `rect.w`; cấu trúc (số đốt, đốm, vòng, gờ, chân) cố
 * định và giãn cách không đều để không đếm hay ướm ra được số đơn vị. Thân
 * không cao quá `rect.h` và không quá `ANIMAL_MAX_BODY_RATIO × rect.w`. `phase`
 * (radian, 0 là trạng thái tĩnh) chỉ làm thân ngọ nguậy, không dời hai đầu.
 * Màu lấy từ `designTokens`.
 */
export function drawMeasuredAnimal(
  ctx: CanvasRenderingContext2D,
  animal: MeasuredAnimal,
  rect: AnimalRect,
  phase: number
): void {
  const inset = ANIMAL_LINE_WIDTH / 2;
  const innerW = rect.w - ANIMAL_LINE_WIDTH;
  const bodyH = Math.min(
    rect.h - ANIMAL_LINE_WIDTH,
    innerW * ANIMAL_MAX_BODY_RATIO
  );
  ctx.save();
  ctx.lineWidth = ANIMAL_LINE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ANIMAL_PAINTERS[animal](
    ctx,
    {
      left: rect.x + inset,
      right: rect.x + rect.w - inset,
      cy: rect.y + rect.h / 2,
      half: bodyH / 2,
      w: innerW,
    },
    phase
  );
  ctx.restore();
}
