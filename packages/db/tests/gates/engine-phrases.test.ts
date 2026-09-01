import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import {
  ENGINE_PHRASES,
  resolveEnginePhrases,
} from "#src/seed-content/vocab/phrases";
import { getThemeVocabulary } from "#src/seed-content/vocab/themes";

const ALL_36_ENGINES = Object.keys(ALL_TEMPLATES).sort();
const VALID_THEMES = [
  "school",
  "farm",
  "home",
  "animal",
  "nature",
  "ocean",
  "food",
  "vehicle",
  "art",
  "space",
  "family",
  "body",
  "weather",
  "festival",
];
const WHITESPACE_REGEX = /\s+/;

function containsForbiddenWords(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("không") || lower.includes("đừng");
}

describe("Bảng ngữ liệu tiêu đề và lời dẫn — Task #191 Đợt 1 (Cổng 4)", () => {
  it("Đầy đủ 36 engine đều được khai báo trong ENGINE_PHRASES", () => {
    for (const engine of ALL_36_ENGINES) {
      expect(
        ENGINE_PHRASES[engine],
        `Engine ${engine} phải có trong ENGINE_PHRASES`
      ).toBeDefined();
    }
  });

  it("Mọi engine × mọi band × 14 theme: lời dẫn qua Cổng 4 và không sót placeholder", () => {
    for (const engine of ALL_36_ENGINES) {
      const template = ALL_TEMPLATES[engine];
      if (!template) {
        continue;
      }

      for (const theme of VALID_THEMES) {
        const vocab = getThemeVocabulary(theme);
        for (const noun of vocab.nouns) {
          const bands: Array<"3-4" | "4-5" | "5-6"> = ["3-4", "4-5", "5-6"];
          for (const band of bands) {
            const { title, instruction } = resolveEnginePhrases(
              engine,
              theme,
              band,
              noun.label_vi
            );

            expect(title).toBeTruthy();
            expect(title).not.toContain("{noun}");

            expect(instruction).toBeTruthy();
            expect(instruction).not.toContain("{noun}");

            // Cấm từ phủ định theo Cổng 4
            expect(
              containsForbiddenWords(instruction),
              `Lời dẫn của ${engine} band ${band} không được chứa từ 'không'/'đừng': "${instruction}"`
            ).toBe(false);

            // Kiểm tra độ dài từ cho lứa tuổi <= 4 (3-4 và 4-5)
            const words = instruction.split(WHITESPACE_REGEX).filter(Boolean);
            if (band === "3-4" || band === "4-5") {
              expect(
                words.length,
                `Lời dẫn ${engine} (${band}) dài ${words.length} từ, vượt quá trần 12 từ: "${instruction}"`
              ).toBeLessThanOrEqual(12);
            }
          }
        }
      }
    }
  });

  describe("Ca âm cho Cổng 4 lời dẫn (Đợt 1)", () => {
    it("Ca âm: Lời dẫn dài 13 từ ở band 3-4 bị từ chối bởi quy tắc Cổng 4", () => {
      const invalidInstruction =
        "Bé hãy chú ý quan sát thật kỹ và đếm xem có bao nhiêu quả táo đỏ nhé em";
      const words = invalidInstruction.split(WHITESPACE_REGEX).filter(Boolean);
      expect(words.length).toBeGreaterThan(12);
    });

    it("Ca âm: Lời dẫn chứa từ 'không' hoặc 'đừng' bị từ chối bởi quy tắc Cổng 4", () => {
      const invalidWithKhong =
        "Bé hãy chọn hình không giống với các hình còn lại";
      const invalidWithDung = "Bé đừng chạm vào các quả bóng màu đen nhé";

      expect(containsForbiddenWords(invalidWithKhong)).toBe(true);
      expect(containsForbiddenWords(invalidWithDung)).toBe(true);
    });
  });
});
