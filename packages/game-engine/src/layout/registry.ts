import {
  computeBipartiteLayout,
  computeGridLayout,
  computeHorizontalRowLayout,
  computeMultiBucketLayout,
  computeTrackLayout,
} from "./geometry.js";
import type { LayoutFn, LayoutId } from "./types.js";

export const LAYOUT_IDS: readonly LayoutId[] = [
  "grid",
  "horizontal-row",
  "grid-2x4",
  "flex-wrap",
  "top-source-bottom-target",
  "left-source-right-target",
  "multi-bucket-bottom",
  "split-columns",
  "two-column-matching",
  "card-flip-grid",
  "horizontal-track",
  "step-ladder",
] as const;

export const LAYOUT_REGISTRY: Record<LayoutId, LayoutFn> = {
  grid: (input) => computeGridLayout(input),
  "horizontal-row": (input) => computeHorizontalRowLayout(input),
  "grid-2x4": (input) =>
    computeGridLayout(input, { fixedCols: 4, fixedRows: 2 }),
  "flex-wrap": (input) => computeGridLayout(input),
  "top-source-bottom-target": (input) =>
    computeBipartiteLayout(input, { orientation: "vertical" }),
  "left-source-right-target": (input) =>
    computeBipartiteLayout(input, { orientation: "horizontal" }),
  "multi-bucket-bottom": (input) => computeMultiBucketLayout(input),
  "split-columns": (input) =>
    computeBipartiteLayout(input, {
      orientation: "horizontal",
      isTwoColumn: true,
    }),
  "two-column-matching": (input) =>
    computeBipartiteLayout(input, {
      orientation: "horizontal",
      isTwoColumn: true,
    }),
  "card-flip-grid": (input) => computeGridLayout(input, { fixedCols: 4 }),
  "horizontal-track": (input) => computeTrackLayout(input, { isLadder: false }),
  "step-ladder": (input) => computeTrackLayout(input, { isLadder: true }),
};

export function isLayoutId(val: unknown): val is LayoutId {
  return typeof val === "string" && LAYOUT_IDS.some((id) => id === val);
}

export function resolveLayout(id: LayoutId): LayoutFn {
  const fn = LAYOUT_REGISTRY[id];
  if (!fn) {
    throw new Error(
      `LAYOUT_NOT_SUPPORTED: Layout '${id}' không tồn tại trong registry (BR-LAY-02).`
    );
  }
  return fn;
}
