import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { resolveItemAsset, safeGetItem } from "./utils.js";

export const projectGT000: Projection<"GT-000"> = {
  template: "GT-000",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, _opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-000 đòi hỏi tối thiểu 2 vật`
      );
    }

    const item1 = safeGetItem(dataset.items, 0);
    const item2 = safeGetItem(dataset.items, 1);

    const assets = [
      {
        asset_id: `asset_${item1.id}`,
        kind: (item1.glyph ? "glyph" : "image") as "glyph" | "image",
        label: item1.label,
        glyph: item1.glyph,
        contrast_group: item1.contrast_group ?? "primary",
        image_ref: resolveItemAsset(item1, true),
      },
      {
        asset_id: `asset_${item2.id}`,
        kind: (item2.glyph ? "glyph" : "image") as "glyph" | "image",
        label: item2.label,
        glyph: item2.glyph,
        contrast_group: item2.contrast_group ?? "contrast",
        image_ref: resolveItemAsset(item2, true),
      },
    ];

    const steps = [
      {
        action: "present" as const,
        target_asset_id: `asset_${item1.id}`,
        narration_line: `Đây là ${item1.label}`,
      },
      {
        action: "recognise" as const,
        target_asset_id: `asset_${item1.id}`,
        distractor_asset_ids: [`asset_${item2.id}`],
        prompt_line: `Bé hãy chạm vào ${item1.label} nhé!`,
      },
      {
        action: "recall" as const,
        target_asset_id: `asset_${item1.id}`,
        option_asset_ids: [`asset_${item1.id}`, `asset_${item2.id}`],
        prompt_line: `Hình nào là ${item1.label}?`,
      },
    ];

    return {
      content_pack: {
        concept: {
          skill_code: dataset.skill_code,
          label: dataset.concept_label,
        },
        assets,
        steps,
        requires_reintro: false,
      },
      difficulty_params: {
        pacing: "standard" as const,
        max_errors_before_remediation: 2,
        interaction_timeout_ms: 15_000,
        show_scaffolding: true,
      },
    };
  },
};
