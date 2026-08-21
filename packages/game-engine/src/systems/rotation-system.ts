/**
 * `rotationSystem` — tính toán góc quay kim giờ, kim phút, nhảy nấc (snap)
 * và chuyển đổi giữa góc quay và thời gian { hour, minute }.
 * Mục 7.4 của [`montessori-template-batch.md`](../../../../docs/specs/01-platform/montessori-template-batch.md).
 *
 * System này **độc lập với khuôn** (`BR-MTB-15`): không phụ thuộc vào Zod
 * hay bất kỳ file nào trong `templates/`.
 *
 * Kim nhảy theo nấc, không dừng được giữa hai nấc, và kim giờ gắn với kim phút (D-RO).
 */

export interface ClockTime {
  readonly hour: number; // 1..12
  readonly minute: number; // 0..59 (mầm non: 0 hoặc 30)
}

export interface ClockAngles {
  readonly hourAngleDeg: number; // 0..360 (0° = 12h, 90° = 3h, 180° = 6h, 270° = 9h)
  readonly minuteAngleDeg: number; // 0..360 (0° = 0p, 180° = 30p)
}

/** Chuyển { hour, minute } thành góc quay kim (độ). */
export function timeToAngles(time: ClockTime): ClockAngles {
  const normalizedHour = time.hour % 12;
  const minuteAngleDeg = (time.minute / 60) * 360;
  // Kim giờ quay 30° mỗi giờ + 0.5° mỗi phút
  const hourAngleDeg = normalizedHour * 30 + (time.minute / 60) * 30;

  return {
    hourAngleDeg: (hourAngleDeg + 360) % 360,
    minuteAngleDeg: (minuteAngleDeg + 360) % 360,
  };
}

/**
 * Làm tròn góc quay về nấc gần nhất theo bước phút (minuteStep = 30 hoặc 60).
 */
export function snapMinuteAngle(
  rawAngleDeg: number,
  minuteStep: 30 | 60 = 30
): number {
  const stepAngle = minuteStep === 60 ? 360 : 180;
  const normalized = ((rawAngleDeg % 360) + 360) % 360;
  const nearest = Math.round(normalized / stepAngle) * stepAngle;
  return nearest % 360;
}

/**
 * Chuyển góc quay kim phút (đã snap) thành số phút (0 hoặc 30).
 */
export function minuteAngleToMinute(minuteAngleDeg: number): number {
  const normalized = ((minuteAngleDeg % 360) + 360) % 360;
  // 0° -> 0, 180° -> 30
  return normalized >= 90 && normalized < 270 ? 30 : 0;
}

/**
 * Làm tròn góc quay về nấc kim giờ gần nhất (bước 30° hoặc 15° nếu có nửa giờ).
 */
export function snapHourAngle(rawAngleDeg: number, minute = 0): number {
  const normalized = ((rawAngleDeg % 360) + 360) % 360;
  // Mỗi giờ 30 độ
  const baseHour = Math.round(normalized / 30) % 12;
  const offset = minute === 30 ? 15 : 0;
  return (baseHour * 30 + offset) % 360;
}

/**
 * Chuyển góc quay kim giờ thành số giờ (1..12).
 */
export function hourAngleToHour(hourAngleDeg: number): number {
  const normalized = ((hourAngleDeg % 360) + 360) % 360;
  const rawHour = Math.floor(normalized / 30);
  const hour = rawHour === 0 ? 12 : rawHour;
  return hour;
}

/** So sánh 2 thời điểm có khớp nhau không. */
export function isSameTime(a: ClockTime, b: ClockTime): boolean {
  const hourA = a.hour === 0 ? 12 : a.hour;
  const hourB = b.hour === 0 ? 12 : b.hour;
  return hourA === hourB && a.minute === b.minute;
}

/** Format chuỗi hiển thị: "08:00", "08:30". */
export function formatClockTime(time: ClockTime): string {
  const hStr = String(time.hour).padStart(2, "0");
  const mStr = String(time.minute).padStart(2, "0");
  return `${hStr}:${mStr}`;
}

// ─── GT-019 / Discrete 90° Piece Rotation & Flip Transformation ───

export type RotationAngle90 = 0 | 90 | 180 | 270;
export type FlipAxis = "none" | "horizontal" | "vertical";

export interface PieceTransform {
  readonly rotation: RotationAngle90;
  readonly flip: FlipAxis;
}

/**
 * Xoay mảnh ghép góc 90° (bằng nút bấm rời, cấm cử chỉ 2 ngón — BR-LVB-02, BR-ENG-12).
 */
export function rotatePiece90(
  current: RotationAngle90,
  direction: "cw" | "ccw" = "cw"
): RotationAngle90 {
  if (direction === "cw") {
    switch (current) {
      case 0:
        return 90;
      case 90:
        return 180;
      case 180:
        return 270;
      case 270:
        return 0;
      default:
        return 0;
    }
  }
  switch (current) {
    case 0:
      return 270;
    case 90:
      return 0;
    case 180:
      return 90;
    case 270:
      return 180;
    default:
      return 0;
  }
}

/**
 * Lật mảnh ghép theo trục ngang/dọc (nút bấm).
 */
export function togglePieceFlip(
  current: FlipAxis,
  axis: "horizontal" | "vertical"
): FlipAxis {
  if (current === axis) {
    return "none";
  }
  return axis;
}

/**
 * So khớp trạng thái transform của mảnh ghép với đích.
 */
export function isPieceTransformMatch(
  current: PieceTransform,
  target: PieceTransform
): boolean {
  return current.rotation === target.rotation && current.flip === target.flip;
}
