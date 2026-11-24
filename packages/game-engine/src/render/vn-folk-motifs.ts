/**
 * Họa tiết "Tuổi thơ Việt × Giấy Gỗ Mộc" bằng Canvas 2D thuần (không cấp phát
 * bộ nhớ trong vòng lặp RAF, không tạo gradient mới).
 *
 * Chuyển động nền chỉ chạy khi `timeMs > 0` (`ambient_motion_enabled` bật và
 * không bật `prefers-reduced-motion`); khi FPS < 42 (`DegradationManager` tắt
 * `ambientMotionEnabled`), toàn bộ họa tiết tự đứng tĩnh êm ả.
 */

import { designTokens } from "#src/systems/designTokens";
import { alpha } from "./color-utils.js";

const VN = designTokens.colors.vnMaterials;

// Tiền tính chuỗi màu có alpha ở cấp module để 0 cấp phát chuỗi mỗi khung hình.
const BAMBOO_STALK_FILL = alpha(VN.bamboo.stalk, 0.42);
const BAMBOO_JOINT_STROKE = alpha(VN.bamboo.joint, 0.55);
const BAMBOO_LEAF_FILL = alpha(VN.bamboo.leaf, 0.34);
const BAMBOO_LEAF_SOFT_FILL = alpha(VN.bamboo.leafSoft, 0.38);

const BAMBOO_ACCENT_STROKE = alpha(VN.bamboo.stalk, 0.55);
const BAMBOO_ACCENT_NODE = alpha(VN.bamboo.joint, 0.62);

const SEDGE_BASE_FILL = alpha(VN.sedgeMat.base, 0.46);
const SEDGE_WEFT_STROKE = alpha(VN.sedgeMat.weft, 0.28);
const SEDGE_WARP_STROKE = alpha(VN.sedgeMat.warp, 0.32);
const SEDGE_TRIM_FILL = alpha(VN.sedgeMat.trim, 0.22);

const KITE_BODY_FILL = alpha(VN.doPaper.sheet, 0.82);
const KITE_WING_ACCENT = alpha(VN.terracotta.clay, 0.48);
const KITE_SPAR_STROKE = alpha(VN.bamboo.joint, 0.65);
const KITE_TAIL_STROKE = alpha(VN.lotus.bloom, 0.5);

const LANTERN_CORD_STROKE = alpha(VN.bamboo.deep, 0.48);
const LANTERN_CAP_FILL = alpha(VN.woodGrain.bark, 0.58);
const LANTERN_AMBER_FILL = alpha(designTokens.colors.retry[300], 0.56);
const LANTERN_LOTUS_FILL = alpha(VN.lotus.petal, 0.56);
const LANTERN_RIB_STROKE = alpha(VN.terracotta.fired, 0.34);
const LANTERN_TASSEL_STROKE = alpha(VN.terracotta.clay, 0.52);

const LOTUS_PAD_FILL = alpha(VN.lotus.pad, 0.28);
const LOTUS_PAD_VEIN = alpha(VN.bamboo.light, 0.35);
const LOTUS_OUTER_PETAL = alpha(VN.lotus.petal, 0.62);
const LOTUS_INNER_PETAL = alpha(VN.lotus.bloom, 0.58);
const LOTUS_PISTIL_FILL = alpha(VN.lotus.pistil, 0.72);

const DRUM_HANDLE_STROKE = alpha(VN.bamboo.joint, 0.68);
const DRUM_RIM_STROKE = alpha(VN.terracotta.fired, 0.56);
const DRUM_FACE_FILL = alpha(VN.doPaper.warm, 0.82);
const DRUM_CORD_STROKE = alpha(VN.bamboo.deep, 0.45);
const DRUM_BEAD_FILL = alpha(VN.terracotta.clay, 0.7);

const DO_PAPER_FIBER_STROKE = alpha(VN.doPaper.fiber, 0.42);

const BAMBOO_STALK_OFFSETS: readonly (readonly [number, number, number])[] =
  Object.freeze([
    [-10, 0.86, -0.05],
    [0, 1.0, 0.02],
    [11, 0.78, 0.07],
  ]);

const LOTUS_PETAL_ANGLES: readonly number[] = Object.freeze([
  -0.85, -0.42, 0, 0.42, 0.85,
]);

export type FolkLanternVariant = "amber" | "lotus";

/**
 * Khóm tre ngà (`luỹ tre`) bên rìa cảnh nền: thân chia đốt rõ mấu và tán lá tre
 * non đung đưa nhẹ khi `timeMs > 0`.
 */
export function drawBambooGrove(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  height: number,
  scale = 1,
  timeMs = 0
): void {
  if (height <= 0 || scale <= 0) {
    return;
  }
  const breeze =
    timeMs > 0 ? Math.sin((timeMs / 5600) * Math.PI * 2) * 3.5 * scale : 0;

  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < BAMBOO_STALK_OFFSETS.length; i++) {
    const entry = BAMBOO_STALK_OFFSETS[i];
    if (!entry) {
      continue;
    }
    const [dx, hRatio, lean] = entry;
    const stalkH = height * hRatio * scale;
    const x0 = baseX + dx * scale;
    const topX = x0 + lean * stalkH + breeze * (0.6 + i * 0.2);
    const topY = baseY - stalkH;
    const stalkW = Math.max(3, 5.5 * scale);

    ctx.strokeStyle = BAMBOO_STALK_FILL;
    ctx.lineWidth = stalkW;
    ctx.beginPath();
    ctx.moveTo(x0, baseY);
    ctx.quadraticCurveTo((x0 + topX) * 0.5, baseY - stalkH * 0.52, topX, topY);
    ctx.stroke();

    // Đốt mấu tre ngà (3 mấu cách đều tự nhiên)
    ctx.strokeStyle = BAMBOO_JOINT_STROKE;
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    for (let j = 1; j <= 3; j++) {
      const t = j * 0.25;
      const jx = x0 + (topX - x0) * t;
      const jy = baseY - stalkH * t;
      ctx.beginPath();
      ctx.moveTo(jx - stalkW * 0.65, jy);
      ctx.lineTo(jx + stalkW * 0.65, jy);
      ctx.stroke();
    }

    // Chùm hai lá tre mảnh ở ngọn
    const leafSway =
      timeMs > 0 ? Math.sin((timeMs / 3800) * Math.PI * 2 + i) * 0.09 : 0;
    ctx.fillStyle = i % 2 === 0 ? BAMBOO_LEAF_FILL : BAMBOO_LEAF_SOFT_FILL;
    ctx.beginPath();
    ctx.ellipse(
      topX + 9 * scale,
      topY + 6 * scale,
      10 * scale,
      3.2 * scale,
      0.35 + leafSway,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(
      topX - 8 * scale,
      topY + 12 * scale,
      9 * scale,
      3 * scale,
      -0.42 - leafSway,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Nét đốt tre ngà trang trí dọc theo mép khay gỗ / rổ tre (chỉ dùng `moveTo`,
 * `lineTo`, `arc` — không gọi `roundRect` để bảo toàn hình học bao ngoài).
 */
export function drawBambooJointAccent(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  jointCount = 3
): void {
  const count = Math.max(1, Math.min(6, Math.floor(jointCount)));
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = BAMBOO_ACCENT_STROKE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len > 12) {
    const nx = (-dy / len) * 3;
    const ny = (dx / len) * 3;
    ctx.strokeStyle = BAMBOO_ACCENT_NODE;
    ctx.lineWidth = 2;
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const jx = x1 + dx * t;
      const jy = y1 + dy * t;
      ctx.beginPath();
      ctx.moveTo(jx - nx, jy - ny);
      ctx.lineTo(jx + nx, jy + ny);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Dải chiếu cói đan nan ấm (`chiếu cói`) trải chân cảnh trong nhà / sân đình,
 * có mép viền gốm cam mộc truyền thống.
 */
export function drawWovenSedgeStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (w <= 0 || h <= 0) {
    return;
  }
  ctx.save();
  ctx.fillStyle = SEDGE_BASE_FILL;
  ctx.fillRect(x, y, w, h);

  // Mép chiếu cói màu gốm ấm truyền thống ở rìa trên
  const trimH = Math.min(5, h * 0.14);
  ctx.fillStyle = SEDGE_TRIM_FILL;
  ctx.fillRect(x, y, w, trimH);

  // Đường nan ngang mảnh
  ctx.strokeStyle = SEDGE_WARP_STROKE;
  ctx.lineWidth = 1;
  const rowStep = Math.max(8, Math.round(h / 4));
  ctx.beginPath();
  for (let ry = y + trimH + rowStep; ry < y + h; ry += rowStep) {
    ctx.moveTo(x, ry);
    ctx.lineTo(x + w, ry);
  }
  ctx.stroke();

  // Mắt đan chéo xen kẽ (thưa để nền luôn thoáng, không rối mắt trẻ)
  ctx.strokeStyle = SEDGE_WEFT_STROKE;
  ctx.lineWidth = 1.5;
  const colStep = 36;
  ctx.beginPath();
  let toggle = 0;
  for (let cx = x + 18; cx < x + w - 10; cx += colStep) {
    const cy = y + trimH + ((toggle % 2) + 0.7) * rowStep;
    if (cy + 5 < y + h) {
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx + 5, cy);
    }
    toggle++;
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Cánh diều giấy dó (`cánh diều`) no gió trên bầu trời quê, nghiêng nhẹ khi
 * `timeMs > 0` và đứng cân bằng khi tĩnh.
 */
export function drawPaperKite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1,
  timeMs = 0
): void {
  if (scale <= 0) {
    return;
  }
  const bobY =
    timeMs > 0 ? Math.sin((timeMs / 4600) * Math.PI * 2) * 4.5 * scale : 0;
  const tilt =
    timeMs > 0 ? Math.sin((timeMs / 6200) * Math.PI * 2) * 0.08 : -0.06;
  const tailWave =
    timeMs > 0
      ? Math.cos((timeMs / 2800) * Math.PI * 2) * 6 * scale
      : 3 * scale;

  ctx.save();
  ctx.translate(cx, cy + bobY);
  ctx.rotate(tilt);

  const halfW = 18 * scale;
  const topH = 14 * scale;
  const botH = 22 * scale;

  // Thân diều giấy dó hình thoi bầu
  ctx.fillStyle = KITE_BODY_FILL;
  ctx.beginPath();
  ctx.moveTo(0, -topH);
  ctx.quadraticCurveTo(halfW, -topH * 0.15, halfW, 0);
  ctx.quadraticCurveTo(halfW * 0.45, botH * 0.65, 0, botH);
  ctx.quadraticCurveTo(-halfW * 0.45, botH * 0.65, -halfW, 0);
  ctx.quadraticCurveTo(-halfW, -topH * 0.15, 0, -topH);
  ctx.closePath();
  ctx.fill();

  // Hoa văn cánh trên màu gốm ấm
  ctx.fillStyle = KITE_WING_ACCENT;
  ctx.beginPath();
  ctx.moveTo(0, -topH);
  ctx.lineTo(halfW * 0.72, -topH * 0.05);
  ctx.lineTo(0, topH * 0.25);
  ctx.lineTo(-halfW * 0.72, -topH * 0.05);
  ctx.closePath();
  ctx.fill();

  // Nan tre dọc và nan cánh cung
  ctx.strokeStyle = KITE_SPAR_STROKE;
  ctx.lineWidth = Math.max(1.2, 1.6 * scale);
  ctx.beginPath();
  ctx.moveTo(0, -topH);
  ctx.lineTo(0, botH);
  ctx.moveTo(-halfW, 0);
  ctx.quadraticCurveTo(0, -topH * 0.45, halfW, 0);
  ctx.stroke();

  // Đuôi diều lụa mềm
  ctx.strokeStyle = KITE_TAIL_STROKE;
  ctx.lineWidth = Math.max(1.5, 2 * scale);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, botH);
  ctx.bezierCurveTo(
    tailWave,
    botH + 10 * scale,
    -tailWave,
    botH + 20 * scale,
    tailWave * 0.6,
    botH + 30 * scale
  );
  ctx.stroke();

  ctx.restore();
}

/**
 * Đèn lồng giấy / lụa Hội An (`đèn lồng`) treo đầu hiên hoặc ngày hội.
 */
export function drawFolkLantern(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  scale = 1,
  variant: FolkLanternVariant = "amber",
  timeMs = 0
): void {
  if (scale <= 0) {
    return;
  }
  const sway =
    timeMs > 0 ? Math.sin((timeMs / 4800) * Math.PI * 2 + cx * 0.01) * 0.06 : 0;
  const cordLen = 12 * scale;
  const rx = 14 * scale;
  const ry = 12 * scale;

  ctx.save();
  ctx.translate(cx, topY);
  ctx.rotate(sway);

  // Dây treo tre mộc
  ctx.strokeStyle = LANTERN_CORD_STROKE;
  ctx.lineWidth = Math.max(1.2, 1.5 * scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, cordLen);
  ctx.stroke();

  const bodyCy = cordLen + ry;
  ctx.fillStyle = variant === "lotus" ? LANTERN_LOTUS_FILL : LANTERN_AMBER_FILL;
  ctx.beginPath();
  ctx.ellipse(0, bodyCy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nan đèn lồng cong dọc
  ctx.strokeStyle = LANTERN_RIB_STROKE;
  ctx.lineWidth = Math.max(1, 1.2 * scale);
  ctx.beginPath();
  ctx.ellipse(0, bodyCy, rx * 0.48, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Vành gỗ đầu & đáy đèn
  const capW = rx * 0.9;
  const capH = Math.max(2.5, 3 * scale);
  ctx.fillStyle = LANTERN_CAP_FILL;
  ctx.fillRect(-capW * 0.5, cordLen - capH * 0.4, capW, capH);
  ctx.fillRect(-capW * 0.5, bodyCy + ry - capH * 0.6, capW, capH);

  // Tua rua mềm bên dưới
  ctx.strokeStyle = LANTERN_TASSEL_STROKE;
  ctx.lineWidth = Math.max(1.2, 1.6 * scale);
  ctx.beginPath();
  ctx.moveTo(0, bodyCy + ry + capH * 0.4);
  ctx.lineTo(0, bodyCy + ry + 10 * scale);
  ctx.stroke();

  ctx.restore();
}

/**
 * Bông hoa sen hồng (`hoa sen`) nở trên mặt lá sen xanh dịu.
 */
export function drawLotusBlossom(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1,
  timeMs = 0
): void {
  if (scale <= 0) {
    return;
  }
  const breath =
    timeMs > 0 ? 1 + Math.sin((timeMs / 5200) * Math.PI * 2) * 0.04 : 1;
  const s = scale * breath;

  ctx.save();
  ctx.translate(cx, cy);

  // Tán lá sen nằm ngang bên dưới
  ctx.fillStyle = LOTUS_PAD_FILL;
  ctx.beginPath();
  ctx.ellipse(0, 6 * s, 22 * s, 6.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = LOTUS_PAD_VEIN;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-14 * s, 6 * s);
  ctx.lineTo(14 * s, 6 * s);
  ctx.stroke();

  // Năm cánh sen hồng xếp quạt
  for (const angle of LOTUS_PETAL_ANGLES) {
    const isInner = Math.abs(angle) < 0.5;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = isInner ? LOTUS_INNER_PETAL : LOTUS_OUTER_PETAL;
    ctx.beginPath();
    ctx.moveTo(0, 3 * s);
    ctx.quadraticCurveTo(6.5 * s, -6 * s, 0, -15 * s);
    ctx.quadraticCurveTo(-6.5 * s, -6 * s, 0, 3 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Nhụy sen vàng ấm
  ctx.fillStyle = LOTUS_PISTIL_FILL;
  ctx.beginPath();
  ctx.arc(0, -2 * s, 3.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Trống bỏi dân gian (`trống bỏi`) nhỏ xinh: mặt giấy dó, vành gốm, cán tre
 * và hai hạt gỗ lắc khẽ khi `timeMs > 0`.
 */
export function drawRattleDrumMotif(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1,
  timeMs = 0
): void {
  if (scale <= 0) {
    return;
  }
  const rock =
    timeMs > 0 ? Math.sin((timeMs / 3600) * Math.PI * 2) * 0.1 : -0.05;
  const r = 11 * scale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rock);

  // Cán tre
  ctx.strokeStyle = DRUM_HANDLE_STROKE;
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.lineTo(0, r + 15 * scale);
  ctx.stroke();

  // Dây gai + hai hạt gỗ hai bên
  ctx.strokeStyle = DRUM_CORD_STROKE;
  ctx.lineWidth = Math.max(1, 1.3 * scale);
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(-r - 6 * scale, 4 * scale, -r - 7 * scale, 8 * scale);
  ctx.moveTo(r, 0);
  ctx.quadraticCurveTo(r + 6 * scale, 4 * scale, r + 7 * scale, 8 * scale);
  ctx.stroke();

  ctx.fillStyle = DRUM_BEAD_FILL;
  ctx.beginPath();
  ctx.arc(-r - 7 * scale, 8 * scale, 2.4 * scale, 0, Math.PI * 2);
  ctx.arc(r + 7 * scale, 8 * scale, 2.4 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Mặt trống giấy dó + vành gốm nung
  ctx.fillStyle = DRUM_FACE_FILL;
  ctx.strokeStyle = DRUM_RIM_STROKE;
  ctx.lineWidth = Math.max(1.8, 2.4 * scale);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chấm tâm xoáy dân gian
  ctx.fillStyle = DRUM_BEAD_FILL;
  ctx.beginPath();
  ctx.arc(0, 0, 2.6 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Vài sợi xơ giấy dó mảnh tinh tế trên góc thẻ lớn (`drawCentralTargetCard`,
 * `drawPromptZone`) tạo cảm giác mặt giấy thủ công Việt Nam ấm áp.
 */
export function drawDoPaperFiberMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (w < 96 || h < 48) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = DO_PAPER_FIBER_STROKE;
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.14, y + h * 0.22);
  ctx.quadraticCurveTo(x + w * 0.19, y + h * 0.19, x + w * 0.24, y + h * 0.23);
  ctx.moveTo(x + w * 0.76, y + h * 0.78);
  ctx.quadraticCurveTo(x + w * 0.81, y + h * 0.81, x + w * 0.86, y + h * 0.77);
  ctx.stroke();
  ctx.restore();
}
