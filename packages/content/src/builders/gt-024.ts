import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

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
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    // Triangle shape waypoints: top, bottom-right, bottom-left
    const waypoints = [
      { id: "wp1", x: 480, y: 120, order: 0, label: "1" },
      { id: "wp2", x: 680, y: 420, order: 1, label: "2" },
      { id: "wp3", x: 280, y: 420, order: 2, label: "3" },
    ];

    return {
      content_pack: {
        prompt: `Bé hãy vẽ theo các điểm nối để tạo thành hình ${baseItem.label} nhé!`,
        shape_name: baseItem.label,
        guide_asset: resolveItemAsset(baseItem, true),
        waypoints,
      },
      difficulty_params: {
        tolerance_px: 40,
        show_numbered_dots: true,
        show_guide_lines: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
