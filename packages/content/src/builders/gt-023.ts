import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

function getAnchorPositions(count: number): Array<{ x: number; y: number }> {
  if (count <= 4) {
    const spacing = 720 / (count + 1);
    return Array.from({ length: count }, (_, i) => ({
      x: Math.round(120 + spacing * (i + 1)),
      y: 270,
    }));
  }
  const cols = Math.ceil(count / 2);
  const spacing = 720 / (cols + 1);
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      x: Math.round(120 + spacing * (col + 1)),
      y: row === 0 ? 190 : 350,
    };
  });
}

export const projectGT023: Projection<"GT-023"> = {
  template: "GT-023",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-023`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-023", opts.difficulty);
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    const positions = getAnchorPositions(params.item_count);
    const anchors = positions.map((pos, i) => ({
      anchor_id: `a${i + 1}`,
      x: pos.x,
      y: pos.y,
      accepted_part_id: `p${i + 1}`,
      label: `Mảnh ${i + 1}`,
    }));

    const parts = positions.map((_, i) => ({
      part_id: `p${i + 1}`,
      target_anchor_id: `a${i + 1}`,
      asset: resolveItemAsset(baseItem, true),
      name: `Mảnh ${i + 1}`,
    }));

    return {
      content_pack: {
        prompt: `Bé hãy ghép các mảnh thành ${baseItem.label} nhé!`,
        target_model: {
          name: baseItem.label,
          asset: resolveItemAsset(baseItem, true),
        },
        anchors,
        parts: shuffleDeterministic(parts, rng),
      },
      difficulty_params: {
        item_count: params.item_count,
        snap_radius_px: params.snap_radius_px ?? 40,
        show_anchor_outline: params.show_anchor_outline ?? true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
