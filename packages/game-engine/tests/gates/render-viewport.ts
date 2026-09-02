/**
 * Cổng hình học khung vẽ — `BR-ENG` §7.1 của `game-engine-runtime.md`.
 *
 * Luật: "Logic cố định 960x540, scale theo DPR. Mọi toạ độ trong Session class
 * là toạ độ logic — cấm dùng pixel thiết bị."
 *
 * Mã từng vi phạm chính luật này: `setupCanvas` tính hệ số scale rồi trả về mà
 * không áp dụng, nơi gọi thì vứt giá trị trả về. Đo ngày 2026-09-01 bằng trình
 * duyệt thật: cảnh lấp 67%x60% khung ở `1440x900`, tràn 246% ở `390x844`.
 * Không test nào chạm đường vẽ nên lỗi lọt qua mọi cổng.
 *
 * `vitest` chạy `environment: "node"`. Cấm — NEVER đổi env cho cả project chỉ
 * vì một cổng; dùng canvas giả ghi lại lời gọi `setTransform`.
 */

export interface FakeMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface FakeContext {
  canvas: { height: number; width: number };
  clearRect(x: number, y: number, w: number, h: number): void;
  readonly clears: Array<{ h: number; w: number; x: number; y: number }>;
  restore(): void;
  save(): void;
  setTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): void;
  readonly transform: FakeMatrix;
}

export interface FakeCanvas {
  getBoundingClientRect(): { height: number; width: number };
  getContext(kind: string): FakeContext | null;
  height: number;
  width: number;
}

const IDENTITY: FakeMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

/**
 * Canvas giả theo đúng ngữ nghĩa thật ở hai điểm quan trọng:
 * gán `width`/`height` reset transform về identity, và `getContext` luôn trả
 * cùng một ngữ cảnh.
 */
export function createFakeCanvas(
  cssWidth: number,
  cssHeight: number
): FakeCanvas {
  const clears: Array<{ h: number; w: number; x: number; y: number }> = [];
  let matrix: FakeMatrix = { ...IDENTITY };
  const stack: FakeMatrix[] = [];

  const ctx: FakeContext = {
    canvas: { height: 150, width: 300 },
    clearRect(x, y, w, h) {
      clears.push({ h, w, x, y });
    },
    clears,
    restore() {
      matrix = stack.pop() ?? { ...IDENTITY };
      Object.assign(ctx.transform, matrix);
    },
    save() {
      stack.push({ ...matrix });
    },
    setTransform(a, b, c, d, e, f) {
      matrix = { a, b, c, d, e, f };
      Object.assign(ctx.transform, matrix);
    },
    transform: { ...IDENTITY },
  };

  let width = 300;
  let height = 150;

  return {
    getBoundingClientRect: () => ({ height: cssHeight, width: cssWidth }),
    getContext: () => ctx,
    get height() {
      return height;
    },
    set height(value: number) {
      height = value;
      ctx.canvas.height = value;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    get width() {
      return width;
    },
    set width(value: number) {
      width = value;
      ctx.canvas.width = value;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}

export interface ViewportProbe {
  /** Phần hộp mà cảnh logic lấp được, theo mỗi chiều. 1 là vừa khít. */
  fillX: number;
  fillY: number;
  /** Góc phải-dưới của cảnh, tính bằng pixel thiết bị. */
  farX: number;
  farY: number;
  /** Góc trái-trên của cảnh, tính bằng pixel thiết bị. */
  originX: number;
  originY: number;
}

/**
 * Đưa hai góc của không gian logic qua ma trận transform, rồi so với hộp thật.
 * Đây là phép đo, không phải đọc lại hằng số của mã đang kiểm.
 */
export function probeViewport(
  matrix: FakeMatrix,
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  logicWidth = 960,
  logicHeight = 540
): ViewportProbe {
  const originX = matrix.e;
  const originY = matrix.f;
  const farX = matrix.a * logicWidth + matrix.e;
  const farY = matrix.d * logicHeight + matrix.f;
  return {
    farX,
    farY,
    fillX: (farX - originX) / (cssWidth * dpr),
    fillY: (farY - originY) / (cssHeight * dpr),
    originX,
    originY,
  };
}
