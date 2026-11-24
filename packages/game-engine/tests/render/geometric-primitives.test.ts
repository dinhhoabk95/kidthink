import { describe, expect, it } from "vitest";
import type { Slot } from "#src/layout/types";
import {
  drawGeometricSpecInSlot,
  GEOMETRIC_2D_FORMS,
  GEOMETRIC_3D_FORMS,
  GEOMETRIC_COLOR_TOKENS,
  GEOMETRIC_RECTANGLE_ASPECT,
  GEOMETRIC_SHAPE_FORMS,
  GEOMETRIC_SIZE_TIER_RATIOS,
  GEOMETRIC_SIZE_TIERS,
  type GeometricRenderSpec,
  is3DGeometricForm,
  resolveGeometricTokenColor,
} from "#src/render/geometric-primitives";
import type { RenderItem } from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas, type FakeContext } from "#tests/gates/fake-canvas";

const BASE_SLOT: Slot = {
  index: 0,
  x: 160,
  y: 140,
  w: 110,
  h: 110,
  hitW: 110,
  hitH: 110,
  page: 0,
  role: "neutral",
};

interface RecordedRoundRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface RecordedArc {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

interface RecordedEllipse {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
}

interface InstrumentedCanvas {
  readonly ctx: CanvasRenderingContext2D;
  readonly raw: FakeContext;
  readonly fills: string[];
  readonly strokes: string[];
  readonly roundRects: RecordedRoundRect[];
  readonly arcs: RecordedArc[];
  readonly ellipses: RecordedEllipse[];
  readonly rotations: number[];
  readonly lineDashes: number[][];
  readonly getSaveDepth: () => number;
}

function createInstrumentedCanvas(): InstrumentedCanvas {
  const fake = createFakeCanvas(960, 540);
  const raw = fake.getContext("2d");
  if (!raw) {
    throw new Error("Missing fake 2d context");
  }
  const fills: string[] = [];
  const strokes: string[] = [];
  const roundRects: RecordedRoundRect[] = [];
  const arcs: RecordedArc[] = [];
  const ellipses: RecordedEllipse[] = [];
  const rotations: number[] = [];
  const lineDashes: number[][] = [];
  let saveDepth = 0;

  const origSave = raw.save.bind(raw);
  const origRestore = raw.restore.bind(raw);
  raw.save = () => {
    saveDepth += 1;
    origSave();
  };
  raw.restore = () => {
    saveDepth -= 1;
    origRestore();
  };
  raw.fill = () => {
    if (typeof raw.fillStyle === "string") {
      fills.push(raw.fillStyle);
    }
  };
  raw.stroke = () => {
    if (typeof raw.strokeStyle === "string") {
      strokes.push(raw.strokeStyle);
    }
  };
  raw.roundRect = (x, y, w, h) => {
    roundRects.push({ x, y, w, h });
  };
  raw.arc = (x, y, r) => {
    arcs.push({ x, y, r });
  };
  raw.ellipse = (x, y, rx, ry) => {
    ellipses.push({ x, y, rx, ry });
  };
  raw.rotate = (angle) => {
    rotations.push(angle);
  };
  raw.setLineDash = (segments) => {
    lineDashes.push([...segments]);
  };

  return {
    ctx: raw as CanvasRenderingContext2D,
    raw,
    fills,
    strokes,
    roundRects,
    arcs,
    ellipses,
    rotations,
    lineDashes,
    getSaveDepth: () => saveDepth,
  };
}

function relativeLuminance(hex: string): number {
  const channel = (offset: number): number => {
    const v = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return v <= 0.039_28 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

describe("Geometric Vector 2D/3D Primitives (Task #318 / GT-002)", () => {
  it("resolves all 8 color tokens from designTokens with WCAG contrast >= 3:1 on doPaper & cream plate", () => {
    expect(GEOMETRIC_COLOR_TOKENS).toHaveLength(8);
    const paperBg = designTokens.colors.vnMaterials.doPaper.sheet;
    const plateBg = designTokens.colors.montessori.plateInner;
    const dangerHexes = new Set<string>(
      Object.values(designTokens.colors.semantic.danger)
    );

    for (const token of GEOMETRIC_COLOR_TOKENS) {
      const palette = resolveGeometricTokenColor(token);
      expect(dangerHexes.has(palette.fill)).toBe(false);
      expect(dangerHexes.has(palette.stroke)).toBe(false);
      expect(dangerHexes.has(palette.shade)).toBe(false);
      expect(dangerHexes.has(palette.highlight)).toBe(false);

      expect(contrastRatio(palette.fill, paperBg)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(palette.fill, plateBg)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(palette.stroke, paperBg)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(palette.shade, paperBg)).toBeGreaterThanOrEqual(3);
    }
  });

  it("renders every 2D and 3D shape form across all 8 color tokens with balanced save/restore and 0 per-frame gradients", () => {
    const rs = new RenderSystem();
    expect(GEOMETRIC_2D_FORMS).toHaveLength(9);
    expect(GEOMETRIC_3D_FORMS).toHaveLength(6);
    expect(GEOMETRIC_SHAPE_FORMS).toHaveLength(15);

    for (const form of GEOMETRIC_SHAPE_FORMS) {
      for (const colorToken of GEOMETRIC_COLOR_TOKENS) {
        const rec = createInstrumentedCanvas();
        const drawn = drawGeometricSpecInSlot(rec.ctx, rs, BASE_SLOT, {
          form,
          color_token: colorToken,
        });
        expect(drawn).toBe(true);
        expect(rec.getSaveDepth()).toBe(0);
        expect(rec.fills.length).toBeGreaterThan(0);
        expect(rec.strokes.length).toBeGreaterThan(0);
        expect(rec.raw.gradientCalls).toHaveLength(0);
      }
    }
  });

  it("separates rectangle from square with 1.65:1 aspect ratio", () => {
    const rs = new RenderSystem();
    const sqRec = createInstrumentedCanvas();
    drawGeometricSpecInSlot(sqRec.ctx, rs, BASE_SLOT, {
      form: "square",
      color_token: "indigo",
    });
    const sq = sqRec.roundRects[0];
    expect(sq).toBeDefined();
    expect((sq?.w ?? 0) / (sq?.h ?? 1)).toBeCloseTo(1, 5);

    const rectRec = createInstrumentedCanvas();
    drawGeometricSpecInSlot(rectRec.ctx, rs, BASE_SLOT, {
      form: "rectangle",
      color_token: "coral",
    });
    const rect = rectRec.roundRects[0];
    expect(rect).toBeDefined();
    expect((rect?.w ?? 0) / (rect?.h ?? 1)).toBeCloseTo(
      GEOMETRIC_RECTANGLE_ASPECT,
      5
    );
  });

  it("renders 3D Montessori solids with 3 shading tones (highlight, fill, shade) and base ellipse shadow", () => {
    const rs = new RenderSystem();
    for (const form of GEOMETRIC_3D_FORMS) {
      expect(is3DGeometricForm(form)).toBe(true);
      const rec = createInstrumentedCanvas();
      const palette = resolveGeometricTokenColor("terracotta");
      drawGeometricSpecInSlot(rec.ctx, rs, BASE_SLOT, {
        form,
        color_token: "terracotta",
      });
      expect(rec.ellipses.length).toBeGreaterThanOrEqual(1);
      expect(rec.fills).toContain(palette.fill);
      expect(rec.fills).toContain(palette.shade);
      expect(
        rec.fills.some((f) => f === palette.highlight || f.startsWith("rgba("))
      ).toBe(true);
    }
    for (const form2d of GEOMETRIC_2D_FORMS) {
      expect(is3DGeometricForm(form2d)).toBe(false);
    }
  });

  it("draws Weber size_tier scaling (0.54, 0.76, 0.96) plus dashed reference ring in surface[300]", () => {
    expect(GEOMETRIC_SIZE_TIER_RATIOS).toEqual({
      small: 0.54,
      medium: 0.76,
      large: 0.96,
    });
    const rs = new RenderSystem();
    const shapeRadii: Record<string, number> = {};

    for (const tier of GEOMETRIC_SIZE_TIERS) {
      const rec = createInstrumentedCanvas();
      drawGeometricSpecInSlot(rec.ctx, rs, BASE_SLOT, {
        form: "circle",
        color_token: "emerald",
        size_tier: tier,
      });
      expect(rec.lineDashes.some((d) => d.length === 2)).toBe(true);
      expect(rec.arcs).toHaveLength(2);
      const refArc = rec.arcs[0];
      const shapeArc = rec.arcs[1];
      expect(refArc?.r).toBeGreaterThan(0);
      shapeRadii[tier] = shapeArc?.r ?? 0;
    }

    expect(shapeRadii.small).toBeLessThan(shapeRadii.medium ?? 0);
    expect(shapeRadii.medium).toBeLessThan(shapeRadii.large ?? 0);
  });

  it("applies rotation_deg around slot center and renders show_orientation_pin", () => {
    const rs = new RenderSystem();
    const rec = createInstrumentedCanvas();
    drawGeometricSpecInSlot(rec.ctx, rs, BASE_SLOT, {
      form: "pentagon",
      color_token: "amber",
      rotation_deg: 90,
      show_orientation_pin: true,
    });
    expect(rec.rotations).toHaveLength(1);
    expect(rec.rotations[0]).toBeCloseTo(Math.PI / 2, 5);
    expect(rec.arcs).toHaveLength(1);
    expect(rec.fills).toContain(designTokens.colors.vnMaterials.doPaper.sheet);
  });

  it("returns false cleanly on degenerate slot dimensions and supports extended RenderItem fields", () => {
    const rs = new RenderSystem();
    const rec = createInstrumentedCanvas();
    const emptySlot: Slot = { ...BASE_SLOT, w: 0, h: 0 };
    const spec: GeometricRenderSpec = {
      form: "square",
      color_token: "wood",
    };
    expect(drawGeometricSpecInSlot(rec.ctx, rs, emptySlot, spec)).toBe(false);

    const item: RenderItem = {
      id: "item-geom-1",
      geometricSpec: spec,
      secondaryAsset: { kind: "emoji", ref: "🍎" },
      plateVariant: "wood_tile",
      isSoftDimmed: true,
      isSpeakingPulse: false,
    };
    expect(item.plateVariant).toBe("wood_tile");
    expect(item.isSoftDimmed).toBe(true);
  });
});
