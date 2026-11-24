import type {
  GT000Content,
  GT000Difficulty,
  GT000SceneBoardMode,
} from "@mindkid/game-engine/contracts";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import {
  buildLevelsForSkill,
  GENERATED_LEVEL_CONTENT_VERSION,
} from "#src/builders/build-levels";
import { projectGT000 } from "#src/builders/gt-000";
import {
  ALL_SKILL_SEEDS,
  getSkillDataset,
  getSkillSeed,
} from "#src/skills/index";

const PHASE4_ROOT_SKILLS: readonly string[] = [
  "C1.ADD.01",
  "C1.SUB.01",
  "C1.PROB.03",
  "C1.PROB.04",
  "C1.CNT.03",
  "C1.CNT.08",
  "C1.CNT.11",
  "C1.MEAS.02",
  "C1.MEAS.04",
  "C1.MEAS.07",
  "C1.MEAS.08",
  "C1.MEAS.10",
  "C2.ORI.04",
  "C2.ORI.08",
  "C2.SOL.02",
  "C2.SOL.03",
  "C2.DIR.01",
  "C2.DIR.02",
  "C2.DIR.05",
  "C3.SEQ.01",
  "C3.SEQ.02",
  "C3.SEQ.03",
  "C3.SEQ.04",
  "C3.CLS.03",
  "C3.CLS.05",
  "C3.SRT.03",
  "C4.MAT.01",
  "C4.MAT.02",
  "C4.MAT.03",
  "C4.MAT.04",
  "C4.MAT.05",
  "C4.CAU.01",
  "C4.CAU.02",
  "C4.EXP.02",
  "C5.TON.03",
  "C5.TON.04",
  "C5.PHO.03",
  "C5.PHO.06",
  "C5.WRD.03",
  "C6.FLX.01",
  "C6.INH.04",
  "C6.WM.02",
  "C6.WM.04",
];

function parseProjected(
  skillCode: string,
  band: "3-4" | "4-5" | "5-6" = "4-5",
  theme = "farm"
): { content: GT000Content; difficulty: GT000Difficulty } {
  const dataset = getSkillDataset(skillCode);
  if (!dataset) {
    throw new Error(`Missing dataset for ${skillCode}`);
  }
  const projected = projectGT000.project(dataset, {
    band,
    difficulty: 1,
    theme,
    seed: 101,
  });
  const tmpl = ALL_TEMPLATES["GT-000"];
  if (!tmpl) {
    throw new Error("Missing GT-000 template");
  }
  const content = tmpl.content_contract.parse(
    projected.content_pack
  ) as GT000Content;
  const difficulty = tmpl.difficulty_contract.parse(
    projected.difficulty_params
  ) as GT000Difficulty;
  return { content, difficulty };
}

describe("Phase 3: projectGT000 Pedagogical Archetype Router (9 modes scene_board)", () => {
  it("cpa_bridge: C1.CNT.01 (3-4), C1.CNT.11 (4-5), C1.CNT.08 (5-6) ánh xạ đúng thang CPA và interactive_count", () => {
    const mam = parseProjected("C1.CNT.01", "3-4", "farm");
    expect(mam.content.story_context?.guide_character).toBe("co_cu");
    expect(mam.content.story_context?.hook_line?.length).toBeGreaterThan(5);
    expect(mam.content.story_context?.resolution_line?.length).toBeGreaterThan(
      5
    );

    const firstPresent = mam.content.segments?.[0]?.steps.find(
      (s) => s.action === "present"
    );
    expect(firstPresent?.action).toBe("present");
    if (firstPresent?.action === "present") {
      expect(firstPresent.interaction_hint).toBe("tap_to_count");
      expect(firstPresent.scene_board?.mode).toBe("cpa_bridge");
      if (firstPresent.scene_board?.mode === "cpa_bridge") {
        expect(["discrete-object", "number-rod"]).toContain(
          firstPresent.scene_board.rep_kind
        );
        expect(firstPresent.scene_board.interactive_count).toBe(true);
      }
    }

    const choi = parseProjected("C1.CNT.11", "4-5", "school");
    const choiStep = choi.content.segments?.[0]?.steps[0];
    expect(choiStep?.scene_board?.mode).toBe("cpa_bridge");
    if (choiStep?.scene_board?.mode === "cpa_bridge") {
      expect(["dot-pattern", "ten-frame"]).toContain(
        choiStep.scene_board.rep_kind
      );
    }

    const la = parseProjected("C1.CNT.08", "5-6", "nature");
    const laStep = la.content.segments?.[0]?.steps[0];
    expect(laStep?.scene_board?.mode).toBe("cpa_bridge");
    if (laStep?.scene_board?.mode === "cpa_bridge") {
      expect(laStep.scene_board.rep_kind).toBe("number-line");
    }
  });

  it("part_whole: C1.NCOMP.01 (Tách số 2) loại bỏ mồi nhử n3 khỏi bài dạy và gắn operation 'split'", () => {
    const { content } = parseProjected("C1.NCOMP.01", "4-5", "nature");
    const assetIds = content.assets.map((a) => a.asset_id);
    expect(assetIds).not.toContain("asset_n3");
    expect(content.concept.values).not.toContain("n3");

    const presentStep = content.segments?.[0]?.steps.find(
      (s) => s.action === "present"
    );
    expect(presentStep?.scene_board?.mode).toBe("part_whole");
    if (
      presentStep?.action === "present" &&
      presentStep.scene_board?.mode === "part_whole"
    ) {
      expect(presentStep.interaction_hint).toBe("tap_to_split");
      expect(presentStep.scene_board.operation).toBe("split");
      expect(presentStep.scene_board.whole_count).toBe(2);
    }
  });

  it("spatial_stage: C2.ORI.01 (Trái) ghép cặp đối lập left/right trong cùng segment (BR-CIM-05)", () => {
    const { content } = parseProjected("C2.ORI.01", "3-4", "body");
    const assetById = new Map(content.assets.map((a) => [a.asset_id, a]));
    const firstTeachingSeg = content.segments?.[0];
    expect(firstTeachingSeg).toBeDefined();

    const groupsInFirstSeg = new Set(
      (firstTeachingSeg?.asset_ids ?? []).map(
        (id) => assetById.get(id)?.contrast_group
      )
    );
    expect(groupsInFirstSeg.size).toBeGreaterThanOrEqual(2);

    const step0 = firstTeachingSeg?.steps[0];
    expect(step0?.scene_board?.mode).toBe("spatial_stage");
    if (step0?.scene_board?.mode === "spatial_stage") {
      expect(["left_of", "right_of"]).toContain(step0.scene_board.relation);
    }
  });

  it("sequence_strip: C1.PAT.01 dựng dãy quy luật lặp hợp lệ trỏ đúng assets[]", () => {
    const { content } = parseProjected("C1.PAT.01", "3-4", "food");
    const validIds = new Set(content.assets.map((a) => a.asset_id));
    const step0 = content.segments?.[0]?.steps[0];
    expect(step0?.scene_board?.mode).toBe("sequence_strip");
    if (step0?.scene_board?.mode === "sequence_strip") {
      expect(step0.scene_board.strip_asset_ids.length).toBeGreaterThanOrEqual(
        3
      );
      for (const id of step0.scene_board.strip_asset_ids) {
        expect(validIds.has(id)).toBe(true);
      }
    }
  });

  it("sorting_baskets: C3.CLS.01 dựng 2 rổ tiêu chí kèm shape_badge đôi và ghép 2 nhóm màu mỗi segment", () => {
    const { content } = parseProjected("C3.CLS.01", "3-4", "food");
    const assetById = new Map(content.assets.map((a) => [a.asset_id, a]));
    const firstSeg = content.segments?.[0];
    const groups = new Set(
      (firstSeg?.asset_ids ?? []).map((id) => assetById.get(id)?.contrast_group)
    );
    expect(groups.size).toBeGreaterThanOrEqual(2);

    const step0 = firstSeg?.steps[0];
    expect(step0?.scene_board?.mode).toBe("sorting_baskets");
    if (step0?.scene_board?.mode === "sorting_baskets") {
      expect(step0.scene_board.baskets).toHaveLength(2);
      expect(step0.scene_board.baskets[0]?.shape_badge).not.toBe(
        step0.scene_board.baskets[1]?.shape_badge
      );
    }
  });

  it("cause_effect + link: C4.CAU.03 dựng quan hệ nhân quả và sinh bước action 'link'", () => {
    const { content } = parseProjected("C4.CAU.03", "5-6", "nature");
    const allSteps = (content.segments ?? []).flatMap((seg) => seg.steps);
    const linkStep = allSteps.find((s) => s.action === "link");
    expect(linkStep).toBeDefined();
    expect(linkStep?.scene_board?.mode).toBe("cause_effect");
  });

  it("word_phonics_box: C5.TON.01 và C5.PHO.01 điền syllables, bật speak_along 'tap' và sinh bước 'echo'", () => {
    const { content, difficulty } = parseProjected(
      "C5.TON.01",
      "4-5",
      "family"
    );
    expect(difficulty.speak_along).toBe("tap");
    expect(content.assets.some((a) => (a.syllables?.length ?? 0) >= 1)).toBe(
      true
    );

    const seg0Steps = content.segments?.[0]?.steps ?? [];
    expect(seg0Steps.some((s) => s.action === "echo")).toBe(true);
    expect(seg0Steps[0]?.scene_board?.mode).toBe("word_phonics_box");
  });

  it("rule_memory_stage: C6.WM.01 dùng peekaboo_cover và C6.INH.01 dùng rule_signal", () => {
    const wm = parseProjected("C6.WM.01", "3-4", "school");
    const wmBoard = wm.content.segments?.[0]?.steps[0]?.scene_board;
    expect(wmBoard?.mode).toBe("rule_memory_stage");
    if (wmBoard?.mode === "rule_memory_stage") {
      expect(wmBoard.variant).toBe("peekaboo_cover");
    }

    const inh = parseProjected("C6.INH.01", "4-5", "vehicle");
    const inhBoard = inh.content.segments?.[0]?.steps[0]?.scene_board;
    expect(inhBoard?.mode).toBe("rule_memory_stage");
    if (inhBoard?.mode === "rule_memory_stage") {
      expect(inhBoard.variant).toBe("rule_signal");
    }
  });

  it("single_card: C5.VOC.01 giữ fallback single_card kèm story_context và scene_cue", () => {
    const voc = parseProjected("C5.VOC.01", "3-4", "animal");
    const step0 = voc.content.segments?.[0]?.steps[0];
    expect(step0?.scene_board?.mode).toBe("single_card");
    expect(voc.content.segments?.[0]?.scene_cue?.length).toBeGreaterThan(4);
    expect(voc.content.segments?.[0]?.milestone_line?.length).toBeGreaterThan(
      4
    );
  });
});

describe("Phase 3 & Phase 4: Vá lỗi dữ liệu hiện hữu, phủ 43 Root Skills C1-C6 & Content Version 15", () => {
  it("BR-CIM-20: 3 bài GT-000 của C1.NREC.01 có sequence_no duy nhất liên tục [1, 2, 3]", () => {
    const seed = getSkillSeed("C1.NREC.01");
    expect(seed).toBeDefined();
    const introSeqs = (seed?.levels ?? [])
      .filter((l) => l.template === "GT-000")
      .map((l) => l.sequence_no);
    expect(introSeqs).toEqual([1, 2, 3]);
  });

  it("BR-CIM-11: bài GT-000 của C1.NCOMP.01 có access_tier 'free' (không cao hơn bài chơi)", () => {
    const seed = getSkillSeed("C1.NCOMP.01");
    expect(seed).toBeDefined();
    const introTiers = (seed?.levels ?? [])
      .filter((l) => l.template === "GT-000")
      .map((l) => l.access_tier);
    expect(introTiers.every((t) => t === "free")).toBe(true);
  });

  it("GENERATED_LEVEL_CONTENT_VERSION nâng lên 15 và phủ đủ 43 kỹ năng gốc C1-C6 cùng đủ 9 modes trong corpus", () => {
    expect(GENERATED_LEVEL_CONTENT_VERSION).toBe(15);

    const taughtSkills = new Set<string>();
    const modeCounts = new Map<GT000SceneBoardMode, number>();
    const tmpl = ALL_TEMPLATES["GT-000"];

    for (const skill of ALL_SKILL_SEEDS) {
      const built = buildLevelsForSkill(skill);
      for (const lvl of built) {
        if (lvl.header.template_code !== "GT-000") {
          continue;
        }
        for (const sc of lvl.header.skill_codes) {
          taughtSkills.add(sc);
        }
        const parsed = tmpl?.content_contract.parse(
          lvl.content_pack
        ) as GT000Content;
        expect(parsed.requires_reintro).toBe(false);
        const firstStep = parsed.segments?.[0]?.steps[0];
        const mode = firstStep?.scene_board?.mode ?? "single_card";
        modeCounts.set(mode, (modeCounts.get(mode) ?? 0) + 1);
      }
    }

    for (const rootCode of PHASE4_ROOT_SKILLS) {
      expect(
        taughtSkills.has(rootCode),
        `Thiếu bài dạy GT-000 cho kỹ năng gốc ${rootCode}`
      ).toBe(true);
    }

    const allNineModes: readonly GT000SceneBoardMode[] = [
      "single_card",
      "cpa_bridge",
      "part_whole",
      "spatial_stage",
      "sequence_strip",
      "sorting_baskets",
      "cause_effect",
      "word_phonics_box",
      "rule_memory_stage",
    ];
    for (const m of allNineModes) {
      expect(
        modeCounts.get(m) ?? 0,
        `Mode ${m} chưa xuất hiện trong corpus GT-000`
      ).toBeGreaterThan(0);
    }
  });
});
