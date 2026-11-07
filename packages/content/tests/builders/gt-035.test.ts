import {
  type GT035Content,
  GT035ContentSchema,
  GT035DifficultySchema,
  isGT035SolvableWithinMaxCommands,
} from "@mindkid/game-engine";
import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  GT035_ABSOLUTE_MAX_DIFFICULTY,
  projectGT035,
} from "../../src/builders/gt-035.js";

const DATASET: SkillDataset = {
  skill_code: "C2.TEST.035",
  concept_label: "Lập trình đường đi",
  surface: "game",
  ladder: [{ rung: 1, dimension: "test", description: "test rung" }],
  phrasing: { prompt_template: "Bé dẫn robot nhé!" },
  items: [{ id: "star", label: "Ngôi sao", glyph: "⭐" }],
};

const ABSOLUTE: ReadonlySet<string> = new Set([
  "go_up",
  "go_right",
  "go_down",
  "go_left",
]);

interface ProjectedLevel {
  readonly content: GT035Content;
  readonly maxCommands: number;
  readonly allowLoop: boolean;
}

function project(difficulty: number): ProjectedLevel {
  const pack = projectGT035.project(DATASET, {
    band: "5-6",
    difficulty,
    theme: "space",
    seed: 1,
  });
  const content = GT035ContentSchema.parse(pack.content_pack);
  const params = GT035DifficultySchema.parse(pack.difficulty_params);
  return {
    content,
    maxCommands: params.max_commands,
    allowLoop: params.allow_loop,
  };
}

describe("projectGT035 — hệ lệnh theo bậc (BR-E035-15)", () => {
  it("bậc dễ dùng mũi tên tuyệt đối, không loop, giải được và phải đổi hướng", () => {
    for (let d = 1; d <= GT035_ABSOLUTE_MAX_DIFFICULTY; d++) {
      const { content, maxCommands, allowLoop } = project(d);
      expect(content.allowed_commands.every((c) => ABSOLUTE.has(c))).toBe(true);
      expect(allowLoop).toBe(false);
      expect(content.goal.row).not.toBe(content.start.row);
      expect(isGT035SolvableWithinMaxCommands(content, maxCommands)).toBe(true);
    }
  });

  it("bậc khó giữ lệnh tương đối", () => {
    for (let d = GT035_ABSOLUTE_MAX_DIFFICULTY + 1; d <= 5; d++) {
      const { content } = project(d);
      expect(content.allowed_commands.some((c) => ABSOLUTE.has(c))).toBe(false);
      expect(content.allowed_commands).toContain("turn_left");
    }
  });
});
