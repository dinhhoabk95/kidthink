import { formatDisplayLabel } from "@mindkid/shared/preschool-terminology";
import type { ZoneRect } from "#src/layout/stage-zones";
import {
  drawGT000CauseEffectShowcase,
  drawGT000CpaBridgeShowcase,
  drawGT000PartWholeShowcase,
  drawGT000SequenceStripShowcase,
  drawGT000SortingBasketsShowcase,
  type GT000ResolvedVisual,
} from "#src/render/gt-000-scene-shapes.js";
import {
  drawGT000RuleMemoryShowcase,
  drawGT000SpatialStageShowcase,
  drawGT000WordPhonicsShowcase,
} from "#src/render/gt-000-scene-spatial-lang.js";
import { GT000_EXPLORE_BOUNCE_MS } from "#src/render/gt-000-shapes.js";
import type { RenderAsset } from "#src/render/types.js";
import type { RenderSystem } from "#src/systems/render-system";
import type {
  GT000SceneBoard,
  GT000SortingBasket,
} from "./scene-board-schema.js";
import type { GT000Asset, GT000Step } from "./template.js";

function toRenderAsset(asset: GT000Asset): RenderAsset | null {
  if (!asset.image_ref) {
    return null;
  }
  if (asset.image_ref.kind === "emoji") {
    return { kind: "emoji", ref: asset.image_ref.ref };
  }
  if (asset.image_ref.kind === "text") {
    return { kind: "text", text: asset.image_ref.text };
  }
  return { kind: "image", path: asset.image_ref.path };
}

export function buildResolvedVisualMap(
  assets: readonly GT000Asset[]
): ReadonlyMap<string, GT000ResolvedVisual> {
  const map = new Map<string, GT000ResolvedVisual>();
  for (const a of assets) {
    const emojiRef =
      a.image_ref?.kind === "emoji" ? a.image_ref.ref : undefined;
    map.set(a.asset_id, {
      id: a.asset_id,
      label: formatDisplayLabel(a.label, { value: a.value, glyph: a.glyph }),
      glyph: a.glyph ?? emojiRef ?? a.text,
      asset: toRenderAsset(a),
    });
  }
  return map;
}

export interface GT000PrecomputedShowcase {
  readonly targetVisual: GT000ResolvedVisual | undefined;
  readonly sequenceItems: readonly (GT000ResolvedVisual | undefined)[];
  readonly sortingBaskets:
    | readonly [
        {
          readonly spec: GT000SortingBasket;
          readonly samples: readonly GT000ResolvedVisual[];
        },
        {
          readonly spec: GT000SortingBasket;
          readonly samples: readonly GT000ResolvedVisual[];
        },
      ]
    | null;
  readonly beforeVisual: GT000ResolvedVisual | undefined;
  readonly afterVisual: GT000ResolvedVisual | undefined;
  readonly meaningVisual: GT000ResolvedVisual | undefined;
}

const EMPTY_SEQUENCE_ITEMS: readonly (GT000ResolvedVisual | undefined)[] =
  Object.freeze([]);

export const EMPTY_PRECOMPUTED_SHOWCASE: GT000PrecomputedShowcase =
  Object.freeze({
    targetVisual: undefined,
    sequenceItems: EMPTY_SEQUENCE_ITEMS,
    sortingBaskets: null,
    beforeVisual: undefined,
    afterVisual: undefined,
    meaningVisual: undefined,
  });

/**
 * Dựng sẵn mọi mảng hình ảnh của `scene_board` lúc mở bước để `render()` hoàn
 * toàn 0 cấp phát mảng/object mỗi khung (`BR-ENG-15`).
 */
export function precomputeGT000Showcase(
  board: GT000SceneBoard,
  step: GT000Step,
  visualMap: ReadonlyMap<string, GT000ResolvedVisual>
): GT000PrecomputedShowcase {
  const targetVisual = visualMap.get(step.target_asset_id);
  if (board.mode === "sequence_strip") {
    return {
      ...EMPTY_PRECOMPUTED_SHOWCASE,
      targetVisual,
      sequenceItems: board.strip_asset_ids.map((id) => visualMap.get(id)),
    };
  }
  if (board.mode === "sorting_baskets") {
    const b0 = board.baskets[0];
    const b1 = board.baskets[1];
    return {
      ...EMPTY_PRECOMPUTED_SHOWCASE,
      targetVisual,
      sortingBaskets:
        b0 && b1
          ? [
              {
                spec: b0,
                samples: b0.sample_asset_ids
                  .map((id) => visualMap.get(id))
                  .filter((v): v is GT000ResolvedVisual => v !== undefined),
              },
              {
                spec: b1,
                samples: b1.sample_asset_ids
                  .map((id) => visualMap.get(id))
                  .filter((v): v is GT000ResolvedVisual => v !== undefined),
              },
            ]
          : null,
    };
  }
  if (board.mode === "cause_effect") {
    return {
      ...EMPTY_PRECOMPUTED_SHOWCASE,
      targetVisual,
      beforeVisual: visualMap.get(board.before_asset_id),
      afterVisual: visualMap.get(board.after_asset_id),
    };
  }
  if (board.mode === "word_phonics_box") {
    return {
      ...EMPTY_PRECOMPUTED_SHOWCASE,
      targetVisual,
      meaningVisual: board.meaning_asset_id
        ? visualMap.get(board.meaning_asset_id)
        : targetVisual,
    };
  }
  return {
    ...EMPTY_PRECOMPUTED_SHOWCASE,
    targetVisual,
  };
}

export interface GT000ShowcaseDrawInput {
  readonly board: GT000SceneBoard;
  readonly step: GT000Step;
  readonly showcaseZone: ZoneRect;
  readonly targetAsset?: GT000Asset;
  readonly precomputed: GT000PrecomputedShowcase;
  readonly exploredCount: number;
  readonly lastExploredAtMs: number;
}

/**
 * Điều phối vẽ trang Trái/Trên cho 8 chế độ `scene_board` giàu trực quan (`BR-E000-17`).
 * Không gọi `ctx.*` trực tiếp trong thư mục `templates/` (`BR-ERC-05`).
 */
export function renderGT000SceneBoardShowcase(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  input: GT000ShowcaseDrawInput
): void {
  const { board, step, showcaseZone, targetAsset, precomputed } = input;
  const isQuestionStep =
    step.action === "recognise" ||
    step.action === "link" ||
    step.action === "recall";
  const exploreProgress =
    input.lastExploredAtMs > 0
      ? Math.max(
          0,
          Math.min(1, 1 - input.lastExploredAtMs / GT000_EXPLORE_BOUNCE_MS)
        )
      : 0;

  switch (board.mode) {
    case "single_card":
      return;
    case "cpa_bridge": {
      const emojiRef =
        targetAsset?.image_ref?.kind === "emoji"
          ? targetAsset.image_ref.ref
          : undefined;
      drawGT000CpaBridgeShowcase(ctx, rs, showcaseZone, {
        count: board.count,
        repKind: board.rep_kind,
        concreteGlyph: board.concrete_glyph || emojiRef || "🍎",
        exploredCount: input.exploredCount,
        exploreProgress,
      });
      return;
    }
    case "part_whole":
      drawGT000PartWholeShowcase(ctx, rs, showcaseZone, {
        wholeCount: board.whole_count,
        partACount: board.part_a_count,
        partBCount: board.part_b_count,
        itemGlyph: board.item_glyph,
        operation: board.operation,
      });
      return;
    case "spatial_stage":
      drawGT000SpatialStageShowcase(ctx, showcaseZone, {
        anchorProp: board.anchor_prop,
        relation: board.relation,
        targetVisual: precomputed.targetVisual,
      });
      return;
    case "sequence_strip":
      drawGT000SequenceStripShowcase(ctx, rs, showcaseZone, {
        items: precomputed.sequenceItems,
        focusSlotIndex: board.focus_slot_index,
        maskFocusAsMystery: isQuestionStep,
        rhythmLabels: board.rhythm_labels,
      });
      return;
    case "sorting_baskets":
      if (precomputed.sortingBaskets) {
        drawGT000SortingBasketsShowcase(
          ctx,
          rs,
          showcaseZone,
          precomputed.sortingBaskets
        );
      }
      return;
    case "cause_effect":
      drawGT000CauseEffectShowcase(ctx, showcaseZone, {
        beforeVisual: precomputed.beforeVisual,
        triggerGlyph: board.trigger_glyph || "✨",
        afterVisual: precomputed.afterVisual,
        maskAfterAsMystery:
          isQuestionStep && board.after_asset_id === step.target_asset_id,
      });
      return;
    case "word_phonics_box":
      drawGT000WordPhonicsShowcase(ctx, rs, showcaseZone, {
        meaningVisual: precomputed.meaningVisual,
        parts: board.parts,
        toneMark: board.tone_mark,
        exploredCount: input.exploredCount,
      });
      return;
    case "rule_memory_stage":
      drawGT000RuleMemoryShowcase(ctx, rs, showcaseZone, {
        variant: board.variant,
        targetVisual: precomputed.targetVisual,
        ruleBadgeGlyph: board.rule_badge_glyph,
        ruleLabel: board.rule_label,
        exploredCount: input.exploredCount,
      });
      return;
    default: {
      const _exhaustive: never = board;
      void _exhaustive;
    }
  }
}
