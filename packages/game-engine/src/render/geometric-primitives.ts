import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import type * as RT from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

export type {
  Geometric2DForm,
  Geometric3DForm,
  GeometricColorPalette,
  GeometricColorToken,
  GeometricRenderSpec,
  GeometricShapeForm,
  GeometricSizeTier,
} from "#src/render/types";

const C_1 = ["coral", "amber", "emerald", "indigo"] as const;
const C_2 = ["sky", "lotus", "terracotta", "wood"] as const;
export const GEOMETRIC_COLOR_TOKENS = [...C_1, ...C_2] as const;

const F2_1 = ["circle", "square", "triangle", "rectangle", "rhombus"] as const;
const F2_2 = ["oval", "pentagon", "hexagon", "star"] as const;
export const GEOMETRIC_2D_FORMS = [...F2_1, ...F2_2] as const;

const F3_1 = ["cube", "rectangular_prism", "sphere"] as const;
const F3_2 = ["cylinder", "cone", "pyramid"] as const;
export const GEOMETRIC_3D_FORMS = [...F3_1, ...F3_2] as const;

export const GEOMETRIC_SHAPE_FORMS = [
  ...GEOMETRIC_2D_FORMS,
  ...GEOMETRIC_3D_FORMS,
] as const;

export const GEOMETRIC_SIZE_TIERS = ["small", "medium", "large"] as const;

export const GEOMETRIC_SIZE_TIER_RATIOS: Readonly<
  Record<RT.GeometricSizeTier, number>
> = { small: 0.54, medium: 0.76, large: 0.96 };

export const GEOMETRIC_RECTANGLE_ASPECT = 1.65;

const DEFAULT_SHAPE_SCALE = 0.78;
const REF_DIAMETER_RATIO = 0.84;

const c = designTokens.colors;
const m = c.montessori;
const vn = c.vnMaterials;
const tc = vn.terracotta;
const wg = vn.woodGrain;
const sem = c.semantic;
const sc = c.scene;

function pal(
  fill: string,
  stroke: string,
  shade: string,
  highlight: string
): RT.GeometricColorPalette {
  return { fill, stroke, shade, highlight };
}

const PALETTES: Readonly<
  Record<RT.GeometricColorToken, RT.GeometricColorPalette>
> = {
  coral: pal(m.coral, c.cta[900], c.cta[800], m.coralLight),
  amber: pal(sem.warning[700], sem.warning[900], m.amberDark, m.amber),
  emerald: pal(m.emerald, sem.success[900], sem.success[800], m.emeraldBright),
  indigo: pal(m.indigo, sc.night[900], sc.night[800], m.indigoLight),
  sky: pal(c.competency.c4, c.competency.c1, c.brand[800], sc.sky[300]),
  lotus: pal(c.competency.c5, vn.doPaper.ink, sc.night[800], vn.lotus.petal),
  terracotta: pal(tc.rim, c.cta[900], c.cta[800], tc.clay),
  wood: pal(wg.bark, c.surface[800], m.woodShadowDeep, wg.ring),
};

const FORM_3D_SET: ReadonlySet<string> = new Set<string>(GEOMETRIC_3D_FORMS);

export function is3DGeometricForm(
  form: RT.GeometricShapeForm
): form is RT.Geometric3DForm {
  return FORM_3D_SET.has(form);
}

export function resolveGeometricTokenColor(
  token: RT.GeometricColorToken
): RT.GeometricColorPalette {
  return PALETTES[token] ?? PALETTES.indigo;
}

interface DrawGeomContext {
  readonly ctx: CanvasRenderingContext2D;
  readonly r: number;
  readonly p: RT.GeometricColorPalette;
  readonly lw: number;
  readonly soft: boolean;
}

function paint(
  ctx: CanvasRenderingContext2D,
  fill: string,
  stroke: string,
  lw: number
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.fill();
  ctx.stroke();
}

function fillDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke?: string,
  lw = 2
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (stroke) {
    paint(ctx, fill, stroke, lw);
  } else {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function poly(
  g: DrawGeomContext,
  coords: readonly number[],
  fill = g.p.fill,
  withStroke = true
): void {
  g.ctx.beginPath();
  for (let i = 0; i + 1 < coords.length; i += 2) {
    const px = (coords[i] ?? 0) * g.r;
    const py = (coords[i + 1] ?? 0) * g.r;
    if (i === 0) {
      g.ctx.moveTo(px, py);
    } else {
      g.ctx.lineTo(px, py);
    }
  }
  g.ctx.closePath();
  if (withStroke) {
    paint(g.ctx, fill, g.p.stroke, g.lw);
  } else {
    g.ctx.fillStyle = fill;
    g.ctx.fill();
  }
}

function radialPoly(
  g: DrawGeomContext,
  vertices: number,
  outerRatio: number,
  innerRatio = outerRatio
): void {
  g.ctx.beginPath();
  for (let i = 0; i < vertices; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / vertices;
    const rad = g.r * (i % 2 === 0 ? outerRatio : innerRatio);
    if (i === 0) {
      g.ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    } else {
      g.ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
  }
  g.ctx.closePath();
  paint(g.ctx, g.p.fill, g.p.stroke, g.lw);
}

function roundBox(g: DrawGeomContext, w: number, h: number): void {
  g.ctx.beginPath();
  g.ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(4, Math.min(w, h) * 0.08));
  paint(g.ctx, g.p.fill, g.p.stroke, g.lw);
}

function dashed(
  ctx: CanvasRenderingContext2D,
  color: string,
  lw: number,
  seg: number[],
  fn: () => void
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.setLineDash(seg);
  ctx.beginPath();
  fn();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawBaseShadow(g: DrawGeomContext, rxFactor: number): void {
  g.ctx.save();
  g.ctx.fillStyle = alpha(m.woodShadowDeep, g.soft ? 0.24 : 0.16);
  g.ctx.beginPath();
  g.ctx.ellipse(0, g.r * 0.84, g.r * rxFactor, g.r * 0.16, 0, 0, Math.PI * 2);
  g.ctx.fill();
  g.ctx.restore();
}

const DRAW_2D: Readonly<
  Record<RT.Geometric2DForm, (g: DrawGeomContext) => void>
> = {
  circle: (g) => fillDisc(g.ctx, 0, 0, g.r * 0.88, g.p.fill, g.p.stroke, g.lw),
  square: (g) => roundBox(g, g.r * 1.54, g.r * 1.54),
  rectangle: (g) =>
    roundBox(g, g.r * 1.92, (g.r * 1.92) / GEOMETRIC_RECTANGLE_ASPECT),
  triangle: (g) => poly(g, [0, -0.92, 0.86, 0.64, -0.86, 0.64]),
  rhombus: (g) => poly(g, [0, -0.96, 0.62, 0, 0, 0.96, -0.62, 0]),
  oval: (g) => {
    g.ctx.beginPath();
    g.ctx.ellipse(0, 0, g.r * 0.96, g.r * 0.58, 0, 0, Math.PI * 2);
    paint(g.ctx, g.p.fill, g.p.stroke, g.lw);
  },
  pentagon: (g) => radialPoly(g, 5, 0.92),
  hexagon: (g) => radialPoly(g, 6, 0.92),
  star: (g) => radialPoly(g, 10, 0.96, 0.42),
};

function drawIsoBox(
  g: DrawGeomContext,
  b: readonly [number, number, number, number, number]
): void {
  const [dxL, dyL, dxR, dyR, h] = b;
  const cy = (h - dyL - dyR) * 0.15;
  drawBaseShadow(g, (dxL + dxR) * 0.62);
  const top = [dxR - dxL, cy - dyL - dyR, dxR, cy - dyR, 0, cy, -dxL, cy - dyL];
  poly(g, top, g.p.highlight);
  poly(g, [-dxL, cy - dyL, 0, cy, 0, cy + h, -dxL, cy - dyL + h], g.p.fill);
  poly(g, [0, cy, dxR, cy - dyR, dxR, cy - dyR + h, 0, cy + h], g.p.shade);
}

function drawCurvedBody(
  g: DrawGeomContext,
  dims: readonly [number, number, number, number, number],
  shadeCoords: readonly number[],
  hiCoords: readonly number[]
): void {
  const [uTop, uBot, uTy, uBy, uRy] = dims;
  const [topW, botW] = [uTop * g.r, uBot * g.r];
  const [ty, by, ry] = [uTy * g.r, uBy * g.r, uRy * g.r];
  g.ctx.save();
  g.ctx.beginPath();
  g.ctx.moveTo(-topW, ty);
  g.ctx.lineTo(topW, ty);
  g.ctx.lineTo(botW, by);
  g.ctx.ellipse(0, by, botW, ry, 0, 0, Math.PI);
  g.ctx.closePath();
  g.ctx.fillStyle = g.p.fill;
  g.ctx.fill();
  g.ctx.clip();
  poly(g, shadeCoords, g.p.shade, false);
  poly(g, hiCoords, g.p.highlight, false);
  g.ctx.restore();
  g.ctx.strokeStyle = g.p.stroke;
  g.ctx.lineWidth = g.lw;
  g.ctx.beginPath();
  g.ctx.moveTo(-topW, ty);
  g.ctx.lineTo(-botW, by);
  g.ctx.ellipse(0, by, botW, ry, 0, Math.PI, 0, true);
  g.ctx.lineTo(topW, ty);
  g.ctx.stroke();
}

const DRAW_3D: Readonly<
  Record<RT.Geometric3DForm, (g: DrawGeomContext) => void>
> = {
  cube: (g) => drawIsoBox(g, [0.67, 0.37, 0.67, 0.37, 0.67]),
  rectangular_prism: (g) => drawIsoBox(g, [0.94, 0.42, 0.5, 0.28, 0.68]),
  sphere: (g) => {
    const sr = g.r * 0.78;
    drawBaseShadow(g, 0.68);
    g.ctx.save();
    fillDisc(g.ctx, 0, 0, sr, g.p.shade);
    g.ctx.clip();
    fillDisc(g.ctx, -sr * 0.16, -sr * 0.16, sr * 0.94, g.p.fill);
    g.ctx.fillStyle = g.p.highlight;
    g.ctx.beginPath();
    const [ex, ey] = [-sr * 0.3, -sr * 0.32];
    g.ctx.ellipse(ex, ey, sr * 0.28, sr * 0.16, -0.55, 0, 6.29);
    g.ctx.fill();
    g.ctx.restore();
    const dw = Math.max(1.2, g.lw * 0.55);
    dashed(g.ctx, alpha(g.p.stroke, 0.36), dw, [3, 3], () =>
      g.ctx.ellipse(0, sr * 0.06, sr * 0.96, sr * 0.28, 0, 0, Math.PI)
    );
    fillDisc(g.ctx, 0, 0, sr, alpha(g.p.fill, 0), g.p.stroke, g.lw);
  },
  cylinder: (g) => {
    drawBaseShadow(g, 0.66);
    const sBand = [0.14, -0.73, 0.68, -0.73, 0.68, 0.96, 0.14, 0.96];
    const hBand = [-0.51, -0.73, -0.33, -0.73, -0.33, 0.96, -0.51, 0.96];
    drawCurvedBody(g, [0.62, 0.62, -0.52, 0.54, 0.21], sBand, hBand);
    g.ctx.beginPath();
    g.ctx.ellipse(0, -g.r * 0.52, g.r * 0.62, g.r * 0.21, 0, 0, Math.PI * 2);
    paint(g.ctx, g.p.highlight, g.p.stroke, g.lw);
  },
  cone: (g) => {
    drawBaseShadow(g, 0.75);
    const dw = Math.max(1.2, g.lw * 0.55);
    dashed(g.ctx, alpha(g.p.stroke, 0.35), dw, [3, 3], () =>
      g.ctx.ellipse(0, g.r * 0.52, g.r * 0.72, g.r * 0.22, 0, 0, Math.PI * 2)
    );
    const sCone = [0, -0.82, 0.79, 0.74, 0.12, 0.78];
    const hCone = [0, -0.82, -0.26, 0.76, -0.56, 0.74];
    drawCurvedBody(g, [0, 0.72, -0.82, 0.52, 0.22], sCone, hCone);
  },
  pyramid: (g) => {
    drawBaseShadow(g, 0.82);
    poly(g, [0, -0.84, -0.8, 0.34, 0.06, 0.7], g.p.fill, false);
    poly(g, [0, -0.84, -0.8, 0.34, -0.42, 0.5], g.p.highlight, false);
    poly(g, [0, -0.84, -0.8, 0.34, 0.06, 0.7], alpha(g.p.fill, 0));
    poly(g, [0, -0.84, 0.06, 0.7, 0.82, 0.3], g.p.shade);
  },
};

export function drawGeometricSpecInSlot(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  spec: RT.GeometricRenderSpec
): boolean {
  if (!(slot.w > 0 && slot.h > 0 && Number.isFinite(slot.x + slot.y))) {
    return false;
  }
  const is3D = is3DGeometricForm(spec.form);
  if (!(is3D || Object.hasOwn(DRAW_2D, spec.form))) {
    return false;
  }
  const refRadius = (Math.min(slot.w, slot.h) * REF_DIAMETER_RATIO) / 2;
  const ratio = spec.size_tier
    ? (GEOMETRIC_SIZE_TIER_RATIOS[spec.size_tier] ?? DEFAULT_SHAPE_SCALE)
    : DEFAULT_SHAPE_SCALE;
  const r = Math.max(8, refRadius * ratio);
  const p = resolveGeometricTokenColor(spec.color_token);
  const lw = Math.max(2, Math.min(3.4, r * 0.1));

  if (spec.size_tier !== undefined) {
    dashed(ctx, alpha(c.surface[300], 0.68), 1.5, [4, 4], () =>
      ctx.arc(slot.x, slot.y, refRadius, 0, Math.PI * 2)
    );
  }
  ctx.save();
  ctx.translate(slot.x, slot.y);
  if (spec.rotation_deg !== undefined && spec.rotation_deg !== 0) {
    ctx.rotate((spec.rotation_deg * Math.PI) / 180);
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const g: DrawGeomContext = { ctx, r, p, lw, soft: rs.softShadowsEnabled };
  if (is3D) {
    DRAW_3D[spec.form](g);
  } else {
    DRAW_2D[spec.form](g);
  }
  if (spec.show_orientation_pin) {
    const pinY =
      spec.form === "rectangle" || spec.form === "oval" ? -r * 0.34 : -r * 0.52;
    const pinR = Math.max(2.8, Math.min(5.5, r * 0.14));
    ctx.save();
    fillDisc(
      ctx,
      0,
      pinY,
      pinR,
      vn.doPaper.sheet,
      p.stroke,
      Math.max(1.6, pinR * 0.45)
    );
    ctx.restore();
  }
  ctx.restore();
  return true;
}
