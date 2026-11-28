import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPromptLabel } from "@mindkid/shared";
import { goRatioViolations, nogoCountFor } from "./content-rules.js";
import {
  countPromptWords,
  createRng,
  resolveItemAsset,
  safeGetItem,
  sanitizeChildPrompt,
  shuffleDeterministic,
} from "./utils.js";

function buildGT026Prompt(goLabel: string, nogoLabel: string): string {
  const full = `Tinh mắt chạm ${goLabel}, bỏ qua ${nogoLabel} nhé!`;
  if (countPromptWords(full) <= 12) {
    return sanitizeChildPrompt(full, "Tinh mắt chạm đúng hình mục tiêu nhé!");
  }
  const compact = `Chạm ${goLabel}, bỏ qua ${nogoLabel} nhé!`;
  if (countPromptWords(compact) <= 12) {
    return sanitizeChildPrompt(
      compact,
      "Tinh mắt chạm đúng hình mục tiêu nhé!"
    );
  }
  return sanitizeChildPrompt(
    `Bé chạm vào ${goLabel} nhé!`,
    "Tinh mắt chạm đúng hình mục tiêu nhé!"
  );
}

/**
 * Nhóm `contrast_group` mang vai `go` của từng kỹ năng (BR-E026-13): go = việc an toàn/tốt/
 * tín hiệu đi; nhóm còn lại là `nogo`. Vai gắn với nội dung, không đổi theo hạt giống.
 */
export const GT026_GO_GROUP_BY_SKILL: Readonly<Record<string, string>> = {
  "C4.ECO.03": "recyclable",
  "C4.ECO.04": "save",
  "C4.EXP.06": "initial",
  "C4.HOM.04": "nature",
  "C4.LIV.06": "needed",
  "C4.MEM.03": "fruit",
  "C4.SAF.02": "go",
  "C4.SAF.05": "safe",
  "C4.SAF.06": "family",
  "C5.PRA.02": "primary",
  "C6.ATT.03": "vehicles",
  "C6.FLX.02": "toys",
  "C6.INH.01": "go",
  "C6.INH.03": "go",
  "C6.INH.04": "go",
  "C6.INI.02": "vehicles",
  "C6.MON.01": "instruments",
  "C6.MON.02": "toys",
  "C6.PER.02": "wild_animals",
  "C6.PER.03": "go",
  "C6.PLN.01": "study_step",
};

type Rng = ReturnType<typeof createRng>;
type GT026Item = SkillDataset["items"][number];

function pickRoles(
  dataset: SkillDataset,
  rng: Rng
): { goItem: GT026Item; nogoItem: GT026Item } {
  const goGroup = GT026_GO_GROUP_BY_SKILL[dataset.skill_code];
  if (goGroup === undefined) {
    const shuffled = shuffleDeterministic(dataset.items, rng);
    return {
      goItem: safeGetItem(shuffled, 0),
      nogoItem: safeGetItem(shuffled, 1),
    };
  }
  const goPool = dataset.items.filter((i) => i.contrast_group === goGroup);
  const nogoPool = dataset.items.filter(
    (i) => i.contrast_group !== undefined && i.contrast_group !== goGroup
  );
  if (goPool.length === 0 || nogoPool.length === 0) {
    throw new Error(
      `[BR-E026-13] Dataset ${dataset.skill_code} thiếu vật cho vai go (nhóm "${goGroup}") hoặc nogo`
    );
  }
  return {
    goItem: safeGetItem(shuffleDeterministic(goPool, rng), 0),
    nogoItem: safeGetItem(shuffleDeterministic(nogoPool, rng), 0),
  };
}

function buildTrials(count: number, rng: Rng) {
  let total = count;
  let nogoCount = nogoCountFor(total);
  while (nogoCount === undefined && total < count + 6) {
    total += 1;
    nogoCount = nogoCountFor(total);
  }
  if (nogoCount === undefined) {
    throw new Error(
      `[BR-E026-14] Không có số lượt nogo nào cho ${count} lượt để tỉ lệ go thuộc 0,70–0,80`
    );
  }
  const rawTrials: Array<{ id: string; kind: "go" | "nogo" }> = [];
  for (let i = 0; i < total; i++) {
    rawTrials.push({
      id: `t${i + 1}`,
      kind: i < nogoCount ? "nogo" : "go",
    });
  }
  const shuffled = shuffleDeterministic(rawTrials, rng);
  return shuffled.map((t, idx) => ({ ...t, id: `t${idx + 1}` }));
}

export const projectGT026: Projection<"GT-026"> = {
  template: "GT-026",
  requires: { min_items: 2, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-026 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-026", opts.difficulty);
    const { goItem, nogoItem } = pickRoles(dataset, rng);

    const trials = buildTrials(params.item_count, rng);
    const violations = goRatioViolations(dataset.skill_code, trials);
    if (violations.length > 0) {
      throw new Error(violations.join("; "));
    }

    return {
      content_pack: {
        prompt: buildGT026Prompt(
          formatPromptLabel(goItem.label),
          formatPromptLabel(nogoItem.label)
        ),
        go_stimulus: {
          label: goItem.label,
          asset: resolveItemAsset(goItem, true),
        },
        nogo_stimulus: {
          label: nogoItem.label,
          asset: resolveItemAsset(nogoItem, true),
        },
        trials,
      },
      difficulty_params: {
        item_count: trials.length,
        stimulus_window_ms: params.stimulus_window_ms ?? 1800,
        isi_ms: params.isi_ms ?? 600,
        hint_after_ms: 8000,
        allow_retry: true,
        untimed: opts.band === "4-5",
      },
    };
  },
};
