import { describe, expect, it } from "vitest";
import { drawCommitButton } from "#src/render/commit-button";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";

/**
 * Task #313 Phase 2 — hint và retry phải tách được bằng mắt trẻ 3–6 tuổi:
 * hint là vòng hai lớp (viền đậm `amberDark` + nét `amber`), nét đứt, nhấp
 * nháy; retry là một nét liền `retry[500]`, mờ dần (`BR-FBK-06`: màu không
 * phải kênh duy nhất; tương phản nét ≥ 3:1 trên nền sáng nhờ viền đậm).
 */
interface StrokeRecord {
  readonly style: string;
  readonly width: number;
  readonly dash: readonly number[];
}

function recordingCtx(): {
  ctx: CanvasRenderingContext2D;
  strokes: StrokeRecord[];
} {
  const strokes: StrokeRecord[] = [];
  const state: { strokeStyle: string; lineWidth: number; dash: number[] } = {
    strokeStyle: "",
    lineWidth: 1,
    dash: [],
  };
  const noop = () => undefined;
  const ctx = new Proxy(
    {},
    {
      get: (_t, prop: string) => {
        if (prop === "stroke") {
          return () => {
            strokes.push({
              style: state.strokeStyle,
              width: state.lineWidth,
              dash: [...state.dash],
            });
          };
        }
        if (prop === "setLineDash") {
          return (d: number[]) => {
            state.dash = d;
          };
        }
        if (prop === "measureText") {
          return () => ({ width: 10 });
        }
        if (prop === "strokeStyle") {
          return state.strokeStyle;
        }
        if (prop === "lineWidth") {
          return state.lineWidth;
        }
        return noop;
      },
      set: (_t, prop: string, value: string | number) => {
        if (prop === "strokeStyle") {
          state.strokeStyle = String(value);
        }
        if (prop === "lineWidth") {
          state.lineWidth = Number(value);
        }
        return true;
      },
    }
  ) as CanvasRenderingContext2D;
  return { ctx, strokes };
}

const { amber, amberDark } = designTokens.colors.montessori;
const retry500 = designTokens.colors.retry[500];

interface HintSummary {
  readonly styles: readonly string[];
  readonly underlayWider: boolean;
  readonly dashed: boolean;
  readonly sameDash: boolean;
}

function summarizeHint(strokes: readonly StrokeRecord[]): HintSummary {
  const [under, over] = strokes;
  return {
    styles: strokes.map((s) => s.style),
    underlayWider: (under?.width ?? 0) > (over?.width ?? 0),
    dashed: (over?.dash.length ?? 0) > 0,
    sameDash: JSON.stringify(under?.dash) === JSON.stringify(over?.dash),
  };
}

const TWO_LAYERS = [amberDark, amber];

describe("hint vs retry — tách màu và tăng tương phản", () => {
  it("vòng gợi ý L1: hai lớp (viền đậm + amber), nét đứt", () => {
    const { ctx, strokes } = recordingCtx();
    new RenderSystem().renderScaffoldingAura(ctx, 100, 100, 40, 0.25);
    expect(summarizeHint(strokes)).toEqual({
      styles: TWO_LAYERS,
      underlayWider: true,
      dashed: true,
      sameDash: true,
    });
  });

  it("khung gợi ý vùng: hai lớp (viền đậm + amber), nét đứt", () => {
    const { ctx, strokes } = recordingCtx();
    new RenderSystem().renderScaffoldingRegion(ctx, 100, 100, 80, 60, 0.25);
    expect(summarizeHint(strokes)).toEqual({
      styles: TWO_LAYERS,
      underlayWider: true,
      dashed: true,
      sameDash: true,
    });
  });

  it("vòng gợi ý quanh nút hành động: hai lớp như vòng gợi ý", () => {
    const { ctx, strokes } = recordingCtx();
    drawCommitButton(
      ctx,
      new RenderSystem(),
      { x: 10, y: 10, w: 120, h: 60 },
      {
        enabled: true,
        origin: "top-left",
        hint: { timeMs: 100, reducedMotion: false },
      }
    );
    const ring = strokes.filter(
      (s) => s.style === amber || s.style === amberDark
    );
    // Vòng quanh nút liền nét (nút không phải slot chọn); vẫn hai lớp.
    expect(summarizeHint(ring)).toEqual({
      styles: TWO_LAYERS,
      underlayWider: true,
      dashed: false,
      sameDash: true,
    });
  });

  it("vòng retry: một nét liền retry[500], không nét đứt", () => {
    const { ctx, strokes } = recordingCtx();
    new RenderSystem().drawRetryRing(ctx, 100, 100, 40, 0.2);
    expect(strokes).toHaveLength(1);
    expect(strokes[0]?.style).toBe(retry500);
    expect(strokes[0]?.dash ?? []).toHaveLength(0);
  });

  it("màu hint không trùng màu retry ở bất kỳ lớp nào", () => {
    expect(amber).not.toBe(retry500);
    expect(amberDark).not.toBe(retry500);
  });
});
