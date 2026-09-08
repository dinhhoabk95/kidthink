import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPromptLabel } from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

function buildPolygonWaypoints(count: number) {
  const radius = 160;
  const centerX = 480;
  const centerY = 270;
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      id: `wp${i + 1}`,
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
      order: i,
      label: `${i + 1}`,
    };
  });
}

export const projectGT024: Projection<"GT-024"> = {
  template: "GT-024",
  requires: { min_items: 1, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-024`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-024", opts.difficulty);
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    const waypoints = buildPolygonWaypoints(params.item_count);

    return {
      content_pack: {
        prompt: `Bé hãy vẽ nối điểm để tạo ${formatPromptLabel(baseItem.label)} nhé!`,
        shape_name: baseItem.label,
        guide_asset: resolveItemAsset(baseItem, true),
        waypoints,
      },
      difficulty_params: {
        item_count: params.item_count,
        tolerance_px: params.tolerance_px,
        show_numbered_dots: params.show_numbered_dots,
        show_guide_lines: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
