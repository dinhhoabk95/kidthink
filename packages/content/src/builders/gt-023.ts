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
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    const anchors = [
      {
        anchor_id: "a1",
        x: 300,
        y: 270,
        accepted_part_id: "p1",
        label: "Trái",
      },
      {
        anchor_id: "a2",
        x: 660,
        y: 270,
        accepted_part_id: "p2",
        label: "Phải",
      },
    ];

    const parts = [
      {
        part_id: "p1",
        target_anchor_id: "a1",
        asset: resolveItemAsset(baseItem, true),
        name: "Mảnh 1",
      },
      {
        part_id: "p2",
        target_anchor_id: "a2",
        asset: resolveItemAsset(baseItem, true),
        name: "Mảnh 2",
      },
    ];

    return {
      content_pack: {
        prompt: `Bé hãy ghép các mảnh để tạo thành hình ${baseItem.label} nhé!`,
        target_model: {
          name: baseItem.label,
          asset: resolveItemAsset(baseItem, true),
        },
        anchors,
        parts: shuffleDeterministic(parts, rng),
      },
      difficulty_params: {
        snap_radius_px: 60,
        show_anchor_outline: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
