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

export const projectGT034: Projection<"GT-034"> = {
  template: "GT-034",
  requires: { min_items: 2, max_items: 4 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-034 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-034", opts.difficulty);
    const shuffled = shuffleDeterministic(dataset.items, rng);

    const instCount = Math.min(params.item_count, Math.max(2, shuffled.length));
    const instruments = Array.from({ length: instCount }, (_, i) => {
      const item = safeGetItem(shuffled, i % shuffled.length);
      return {
        instrument_id: `inst_${item.id}_${i + 1}`,
        asset: resolveItemAsset(item, true),
        freq: 220 * (i + 1),
        name_vi: item.label,
      };
    });

    const patternLength = params.pattern_length ?? 4;
    const instrumentCount = params.instrument_count ?? params.item_count;
    const tempoBpm = params.tempo_bpm ?? 80;

    // Tạo motif lặp chu kỳ 2 hoặc 3
    const motifLen = instCount >= 3 && patternLength >= 6 ? 3 : 2;
    const motif = instruments
      .slice(0, motifLen)
      .map((inst) => inst.instrument_id);

    // Mẫu nhịp lặp lại motif để thoả mãn BR-E034-01 hasRepeatingMotif
    const target_pattern = Array.from({ length: patternLength }, (_, i) => {
      return (
        motif[i % motif.length] ?? instruments[0]?.instrument_id ?? "inst_1"
      );
    });

    return {
      content_pack: {
        prompt: "Bé hãy hoàn thành chuỗi âm thanh lặp lại nhé!",
        instruments,
        target_pattern,
        tempo_bpm: tempoBpm,
      },
      difficulty_params: {
        item_count: params.item_count,
        pattern_length: patternLength,
        instrument_count: instrumentCount,
        tempo_bpm: tempoBpm,
        allow_replay: true,
        replay_limit: 3,
        hint_after_ms: 8000,
      },
    };
  },
};
