export interface FakeMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface GradientCall {
  type: "linear" | "radial";
  args: number[];
}

export interface FakeGradient extends Partial<CanvasGradient> {
  addColorStop(offset: number, color: string): void;
}

export interface FakeContext extends Partial<CanvasRenderingContext2D> {
  canvas: HTMLCanvasElement;
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
  setTransform(transform?: DOMMatrix2DInit): void;
  transform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): void;
  readonly transformMatrix: FakeMatrix;
  createLinearGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): FakeGradient;
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): FakeGradient;
  readonly gradientCalls: GradientCall[];

  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(
    x: number,
    y: number,
    r: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void;
  rect(x: number, y: number, w: number, h: number): void;
  roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | number[]
  ): void;
  fill(): void;
  stroke(): void;
  clip(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  strokeText(text: string, x: number, y: number): void;
  measureText(text: string): TextMetrics;
  setLineDash(segments: number[]): void;
  getLineDash(): number[];
  scale(x: number, y: number): void;
  rotate(angle: number): void;
  translate(x: number, y: number): void;
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number
  ): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void;

  fillStyle: string | FakeGradient | CanvasPattern;
  strokeStyle: string | FakeGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  globalAlpha: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface FakeCanvas {
  getBoundingClientRect(): DOMRect;
  getContext(kind: string): FakeContext | null;
  height: number;
  width: number;
}

const IDENTITY: FakeMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

function resolveMatrix(
  a?: number | DOMMatrix2DInit,
  b?: number,
  c?: number,
  d?: number,
  e?: number,
  f?: number
): FakeMatrix {
  if (typeof a === "object" && a !== null) {
    return {
      a: a.a ?? 1,
      b: a.b ?? 0,
      c: a.c ?? 0,
      d: a.d ?? 1,
      e: a.e ?? 0,
      f: a.f ?? 0,
    };
  }
  return {
    a: typeof a === "number" ? a : 1,
    b: b ?? 0,
    c: c ?? 0,
    d: d ?? 1,
    e: e ?? 0,
    f: f ?? 0,
  };
}

export function createFakeCanvas(
  cssWidth: number,
  cssHeight: number
): FakeCanvas {
  const clears: Array<{ h: number; w: number; x: number; y: number }> = [];
  const gradientCalls: GradientCall[] = [];
  let matrix: FakeMatrix = { ...IDENTITY };
  const stack: FakeMatrix[] = [];

  let width = 300;
  let height = 150;
  let ctx: FakeContext;

  const fakeCanvas: FakeCanvas = {
    getBoundingClientRect: () =>
      ({
        bottom: cssHeight,
        height: cssHeight,
        left: 0,
        right: cssWidth,
        top: 0,
        width: cssWidth,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
    getContext: () => ctx,
    get height() {
      return height;
    },
    set height(value: number) {
      height = value;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    get width() {
      return width;
    },
    set width(value: number) {
      width = value;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };

  ctx = {
    canvas: fakeCanvas as HTMLCanvasElement,
    clearRect(x, y, w, h) {
      clears.push({ h, w, x, y });
    },
    clears,
    restore() {
      matrix = stack.pop() ?? { ...IDENTITY };
      Object.assign(ctx.transformMatrix, matrix);
    },
    save() {
      stack.push({ ...matrix });
    },
    setTransform(
      a?: number | DOMMatrix2DInit,
      b?: number,
      c?: number,
      d?: number,
      e?: number,
      f?: number
    ) {
      matrix = resolveMatrix(a, b, c, d, e, f);
      Object.assign(ctx.transformMatrix, matrix);
    },
    transform(a, b, c, d, e, f) {
      matrix = {
        a: matrix.a * a + matrix.c * b,
        b: matrix.b * a + matrix.d * b,
        c: matrix.a * c + matrix.c * d,
        d: matrix.b * c + matrix.d * d,
        e: matrix.a * e + matrix.c * f + matrix.e,
        f: matrix.b * e + matrix.d * f + matrix.f,
      };
      Object.assign(ctx.transformMatrix, matrix);
    },
    transformMatrix: { ...IDENTITY },
    createLinearGradient(x0, y0, x1, y1) {
      gradientCalls.push({ type: "linear", args: [x0, y0, x1, y1] });
      return {
        addColorStop() {
          // No-op for mock
        },
      };
    },
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      gradientCalls.push({
        type: "radial",
        args: [x0, y0, r0, x1, y1, r1],
      });
      return {
        addColorStop() {
          // No-op for mock
        },
      };
    },
    gradientCalls,

    beginPath() {
      // No-op for mock
    },
    closePath() {
      // No-op for mock
    },
    moveTo() {
      // No-op for mock
    },
    lineTo() {
      // No-op for mock
    },
    arc() {
      // No-op for mock
    },
    rect() {
      // No-op for mock
    },
    roundRect() {
      // No-op for mock
    },
    fill() {
      // No-op for mock
    },
    stroke() {
      // No-op for mock
    },
    clip() {
      // No-op for mock
    },
    fillRect() {
      // No-op for mock
    },
    strokeRect() {
      // No-op for mock
    },
    fillText() {
      // No-op for mock
    },
    strokeText() {
      // No-op for mock
    },
    measureText(text) {
      return {
        width: text.length * 10,
        actualBoundingBoxAscent: 0,
        actualBoundingBoxDescent: 0,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: 0,
        alphabeticBaseline: 0,
        emHeightAscent: 0,
        emHeightDescent: 0,
        fontBoundingBoxAscent: 0,
        fontBoundingBoxDescent: 0,
        hangingBaseline: 0,
        ideographicBaseline: 0,
      };
    },
    setLineDash() {
      // No-op for mock
    },
    getLineDash() {
      return [];
    },
    scale() {
      // No-op for mock
    },
    rotate() {
      // No-op for mock
    },
    translate() {
      // No-op for mock
    },
    drawImage() {
      // No-op for mock
    },
    quadraticCurveTo() {
      // No-op for mock
    },
    bezierCurveTo() {
      // No-op for mock
    },
    arcTo() {
      // No-op for mock
    },
    ellipse() {
      // No-op for mock
    },

    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    globalAlpha: 1,
    font: "16px sans-serif",
    textAlign: "left",
    textBaseline: "alphabetic",
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };

  return fakeCanvas;
}
