import { describe, expect, it } from "vitest";
import { buildLevelsForSkill } from "#src/builders/build-levels";
import { ALL_SKILL_SEEDS } from "#src/skills/index";

const NUMERAL = /^\d{1,2}$/;

const CELL_GLYPH_REGEX = /(^|[^\p{L}])ô\s+\S/iu;
const TECHNICAL_ID_REGEX = /item_|GL-|GT-|[a-z]+_[a-z]+/;
/** Con số duy nhất được phép xuất hiện là tên lá cờ đích: "lá cờ số N". */
const ANY_DIGIT_REGEX = /\d/;
const NUMBERED_FLAG_REGEX = /lá cờ số (\d{1,2})(?!\d)/u;

interface Gt013Text {
  readonly code: string;
  readonly texts: readonly string[];
  readonly goalGlyph: string | null;
  readonly datasetHasNumeral: boolean;
}

function collectGt013Texts(): Gt013Text[] {
  const found: Gt013Text[] = [];
  for (const skill of ALL_SKILL_SEEDS) {
    for (const level of buildLevelsForSkill(skill)) {
      if (level.header.template_code !== "GT-013") {
        continue;
      }
      const pack = level.content_pack;
      const texts: string[] = [level.header.instruction];
      let goalGlyph: string | null = null;
      if (
        typeof pack === "object" &&
        pack !== null &&
        "goal_glyph" in pack &&
        typeof pack.goal_glyph === "string"
      ) {
        goalGlyph = pack.goal_glyph;
      }
      if (
        typeof pack === "object" &&
        pack !== null &&
        "prompt" in pack &&
        typeof pack.prompt === "string"
      ) {
        texts.push(pack.prompt);
      }
      for (const round of level.rounds ?? []) {
        texts.push(round.instruction);
      }
      const datasetHasNumeral = skill.dataset.items.some(
        (item) => typeof item.glyph === "string" && NUMERAL.test(item.glyph)
      );
      found.push({
        code: level.header.code,
        texts,
        goalGlyph,
        datasetHasNumeral,
      });
    }
  }
  return found;
}

describe("GT-013 builder — lời đề gọi đích là lá cờ (BR-E013-11)", () => {
  const levels = collectGt013Texts();

  it("có seed GT-013 để kiểm", () => {
    expect(levels.length).toBeGreaterThan(0);
  });

  it("không lời đề nào nhắc 'ô <glyph>'", () => {
    for (const { code, texts } of levels) {
      for (const text of texts) {
        expect(text, `${code}: ${text}`).not.toMatch(CELL_GLYPH_REGEX);
      }
    }
  });

  it("chữ số chỉ xuất hiện trong 'lá cờ số <glyph>', không id kỹ thuật", () => {
    for (const { code, texts } of levels) {
      for (const text of texts) {
        expect(text, `${code}: ${text}`).not.toMatch(TECHNICAL_ID_REGEX);
        const withoutFlagName = text.replace(NUMBERED_FLAG_REGEX, "lá cờ");
        expect(withoutFlagName, `${code}: ${text}`).not.toMatch(
          ANY_DIGIT_REGEX
        );
      }
    }
  });

  it("lời đề nói đích là lá cờ, khớp đích vẽ ở BR-E013-10", () => {
    for (const { code, texts } of levels) {
      const prompt = texts[1] ?? "";
      expect(prompt, code).toContain("lá cờ");
    }
  });

  it("level có con số: đề gọi 'lá cờ số <glyph>' và cờ vẽ đúng số đó (BR-SDS-03)", () => {
    const numbered = levels.filter((l) => l.datasetHasNumeral);
    expect(numbered.length).toBeGreaterThan(0);
    for (const { code, texts, goalGlyph } of numbered) {
      expect(goalGlyph, code).toMatch(NUMERAL);
      expect(texts[1] ?? "", code).toContain(`lá cờ số ${goalGlyph}`);
    }
  });

  it("level không có con số: đề trung tính, cờ không mang số", () => {
    for (const { code, texts, goalGlyph, datasetHasNumeral } of levels) {
      if (datasetHasNumeral) {
        continue;
      }
      expect(goalGlyph, code).toBeNull();
      expect(texts[1] ?? "", code).not.toMatch(NUMBERED_FLAG_REGEX);
    }
  });
});
