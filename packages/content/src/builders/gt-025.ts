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

interface SpotDiffObject {
  id: string;
  asset: ReturnType<typeof resolveItemAsset>;
  x: number;
  y: number;
}

interface SpotDiffDifference {
  id: string;
  left_id: string;
  right_id: string;
  description: string;
}

function buildSpotDiffObjects(
  itemCount: number,
  diffCount: number,
  shuffled: SkillDataset["items"]
) {
  const left_objects: SpotDiffObject[] = [];
  const right_objects: SpotDiffObject[] = [];
  const differences: SpotDiffDifference[] = [];

  for (let i = 0; i < itemCount; i++) {
    const isDiff = i >= itemCount - diffCount;
    const base = safeGetItem(shuffled, i);
    const xPos = 100 + i * 110;
    const yPos = 200;

    left_objects.push({
      id: `left_${i + 1}`,
      asset: resolveItemAsset(base, true),
      x: xPos,
      y: yPos,
    });

    if (isDiff) {
      const alt = safeGetItem(shuffled, (i + itemCount) % shuffled.length);
      right_objects.push({
        id: `right_${i + 1}`,
        asset: resolveItemAsset(alt, true),
        x: xPos,
        y: yPos,
      });
      differences.push({
        id: `diff_${i + 1}`,
        left_id: `left_${i + 1}`,
        right_id: `right_${i + 1}`,
        description: `Bên trái là ${base.label}, bên phải là ${alt.label}`,
      });
    } else {
      right_objects.push({
        id: `right_${i + 1}`,
        asset: resolveItemAsset(base, true),
        x: xPos,
        y: yPos,
      });
    }
  }

  return { left_objects, right_objects, differences };
}

export const projectGT025: Projection<"GT-025"> = {
  template: "GT-025",
  requires: { min_items: 2, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-025 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-025", opts.difficulty);
    const shuffled = shuffleDeterministic(dataset.items, rng);

    const { left_objects, right_objects, differences } = buildSpotDiffObjects(
      params.item_count,
      params.target_count,
      shuffled
    );

    return {
      content_pack: {
        prompt: "Bé hãy tìm điểm khác biệt giữa hai bức hình nhé!",
        target_count: params.target_count,
        left_objects,
        right_objects,
        differences,
      },
      difficulty_params: {
        item_count: params.item_count,
        target_count: params.target_count,
        distractor_count: params.distractor_count,
        difference_count: params.target_count,
        show_difference_counter: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
