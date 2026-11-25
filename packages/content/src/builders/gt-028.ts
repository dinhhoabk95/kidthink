import type {
  DatasetAsset,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, pickSingleObjectToken, safeGetItem } from "./utils.js";

/** Vật đếm dự phòng khi dataset không có vật nào vẽ được thành một vật đơn. */
export const GT028_FALLBACK_TOKEN = { kind: "emoji", ref: "🍎" } as const;

export const projectGT028: Projection<"GT-028"> = {
  template: "GT-028",
  requires: { min_items: 1, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-028`
      );
    }

    const roundIdx = opts.round_index ?? 0;
    const step = 2; // đếm bước 2
    const totalSteps = Math.min(
      Math.max(2, opts.difficulty + 1 + (roundIdx % 2)),
      5
    );
    const target_total = totalSteps * step;
    const itemCount = Math.max(4, totalSteps + 1);

    const baseIdx = createRng(opts.seed).nextInt(dataset.items.length);
    const baseItem = safeGetItem(
      dataset.items,
      (baseIdx + roundIdx) % dataset.items.length
    );
    // Mỗi ô là **một** vật để chạm đếm (`BR-E028-13`): chữ số ("7") hay cụm
    // nhiều vật ("🌸🌸🌸") trên ô làm đề "đếm cách 2" vô nghĩa.
    const token = pickSingleObjectToken(dataset.items, baseItem);
    const tokenId = token?.item.id ?? baseItem.id;
    const tokenAsset: DatasetAsset = token?.asset ?? GT028_FALLBACK_TOKEN;
    const items = Array.from({ length: itemCount }, (_, i) => ({
      item_id: `${tokenId}_${i + 1}`,
      asset: tokenAsset,
    }));

    let rep: "tally" | "rekenrek" | "discrete-object" | undefined;
    if (opts.representation === "tally" || opts.representation === "rekenrek") {
      rep = opts.representation;
    } else if (opts.representation === "discrete-object") {
      rep = "discrete-object";
    }

    return {
      content_pack: {
        prompt: `Bé gom từng đôi đếm cách 2 tới ${target_total} nhé!`,
        step: 2 as const,
        items,
        target_total,
        ...(rep ? { representation: rep } : {}),
      },
      difficulty_params: {
        step: 2 as const,
        item_count: itemCount,
        allow_undo: true,
        hint_after_ms: 8000,
        shuffle_items: true,
      },
    };
  },
};
