import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it } from "vitest";
import { ALL_TEMPLATES } from "#src/generated/template-registry";
import {
  type LabelledVocabulary,
  pickContrast,
} from "#src/generators/contrast";
import { ALL_LEVEL_GENERATORS } from "#src/generators/index";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";
import { GT002ContentSchema } from "#src/templates/GT-002/template";
import { GT003ContentSchema } from "#src/templates/GT-003/template";
import { GT004ContentSchema } from "#src/templates/GT-004/template";
import { GT005ContentSchema } from "#src/templates/GT-005/template";
import { GT007ContentSchema } from "#src/templates/GT-007/template";
import { GT010ContentSchema } from "#src/templates/GT-010/template";
import { GT011ContentSchema } from "#src/templates/GT-011/template";
import { GT012ContentSchema } from "#src/templates/GT-012/template";
import { GT016ContentSchema } from "#src/templates/GT-016/template";
import { GT017ContentSchema } from "#src/templates/GT-017/template";
import { GT018ContentSchema } from "#src/templates/GT-018/template";
import { GT022ContentSchema } from "#src/templates/GT-022/template";
import { GT025ContentSchema } from "#src/templates/GT-025/template";

/**
 * Bất biến nội dung sinh máy, đo trên vốn từ chủ đề thật. Mỗi lỗi ở đây từng
 * lọt vào corpus: đáp án luôn ở ô 1, GT-017 hiện danh từ thay vì con số, vật
 * đúng và vật nhiễu cùng một chủ đề.
 */

const SEEDS = Array.from({ length: 24 }, (_, i) => 1000 + i * 7919);

function toVocabulary(
  theme: (typeof CONTENT_THEMES)[number]
): LabelledVocabulary {
  return {
    theme: theme.code,
    label_vi: theme.label_vi,
    icon_emoji_ref: theme.icon_emoji_ref,
    nouns: theme.nouns.map((n) => ({
      emoji_ref: n.emoji_ref,
      label_vi: n.text_vi,
    })),
  };
}

const ALL_VOCAB: LabelledVocabulary[] = CONTENT_THEMES.map(toVocabulary);

function vocabularyFor(code: string): ThemeVocabulary {
  const base = ALL_VOCAB.find((v) => v.theme === code);
  if (!base) {
    throw new Error(`Không có chủ đề ${code}`);
  }
  return { ...base, contrast: pickContrast(base, ALL_VOCAB) };
}

function generate(engine: string, seed: number, theme = "school"): unknown {
  const gen = ALL_LEVEL_GENERATORS[engine];
  if (!gen) {
    throw new Error(`Không có generator ${engine}`);
  }
  const age_band = gen.axes.age_band[0] ?? "5-6";
  return gen.generate({
    rng: createRng(seed),
    age_band,
    theme,
    vocabulary: vocabularyFor(theme),
  }).content_pack;
}

const CONTRAST_RE = /tương phản/;

/** Vị trí đáp án đúng qua nhiều seed phải đổi — không thì trẻ học vị trí, không học bài. */
function isVaried(positions: readonly number[]): boolean {
  return positions.every((p) => p >= 0) && new Set(positions).size > 1;
}

type Asset =
  | { kind: "emoji"; ref: string }
  | { kind: "image"; path: string }
  | { kind: "text"; text: string };

function refOf(asset: Asset): string {
  return asset.kind === "emoji" ? asset.ref : "";
}

describe("bộ sinh × vốn từ thật: mọi ứng viên parse qua content_contract", () => {
  for (const [engine, gen] of Object.entries(ALL_LEVEL_GENERATORS)) {
    it(engine, () => {
      const template = ALL_TEMPLATES[engine];
      expect(template).toBeDefined();
      for (const band of gen.axes.age_band) {
        for (const theme of gen.axes.theme) {
          for (const seed of SEEDS.slice(0, 3)) {
            const level = gen.generate({
              rng: createRng(seed),
              age_band: band,
              theme,
              vocabulary: vocabularyFor(theme),
            });
            const parsed = template?.content_contract.safeParse(
              level.content_pack
            );
            expect(
              parsed?.success,
              `${engine} band=${band} theme=${theme} seed=${seed}: ${parsed?.error?.message ?? ""}`
            ).toBe(true);
          }
        }
      }
    });
  }
});

describe("đáp án đúng không cố định một ô", () => {
  const cases: [string, (seed: number) => number][] = [
    [
      "GT-007",
      (s) =>
        GT007ContentSchema.parse(generate("GT-007", s)).options.findIndex(
          (o) => o.is_correct
        ),
    ],
    [
      "GT-010",
      (s) =>
        GT010ContentSchema.parse(generate("GT-010", s)).options.findIndex(
          (o) => o.is_correct
        ),
    ],
    [
      "GT-011",
      (s) =>
        GT011ContentSchema.parse(generate("GT-011", s)).options.findIndex(
          (o) => o.is_correct
        ),
    ],
    [
      "GT-012",
      (s) =>
        GT012ContentSchema.parse(generate("GT-012", s)).options.findIndex(
          (o) => o.is_correct
        ),
    ],
    [
      "GT-016",
      (s) =>
        GT016ContentSchema.parse(generate("GT-016", s)).options.findIndex(
          (o) => o.is_correct
        ),
    ],
    [
      "GT-017",
      (s) =>
        GT017ContentSchema.parse(generate("GT-017", s)).options.findIndex(
          (o) => o.is_correct
        ),
    ],
    [
      "GT-018",
      (s) =>
        GT018ContentSchema.parse(generate("GT-018", s)).options.findIndex(
          (o) => o.is_correct
        ),
    ],
    [
      "GT-002",
      (s) =>
        GT002ContentSchema.parse(generate("GT-002", s)).items.findIndex(
          (o) => o.is_correct
        ),
    ],
    [
      "GT-022",
      (s) =>
        GT022ContentSchema.parse(generate("GT-022", s)).scene_objects.findIndex(
          (o) => o.is_target
        ),
    ],
    [
      "GT-025",
      (s) => {
        const content = GT025ContentSchema.parse(generate("GT-025", s));
        const leftId = content.differences[0]?.left_id;
        return content.left_objects.findIndex((o) => o.id === leftId);
      },
    ],
  ];

  for (const [engine, correctIndex] of cases) {
    it(engine, () => {
      expect(isVaried(SEEDS.map(correctIndex))).toBe(true);
    });
  }

  it("GT-003: đáp án không luôn nằm ở hai ô đầu", () => {
    const firstCorrect = SEEDS.map((s) =>
      GT003ContentSchema.parse(generate("GT-003", s)).items.findIndex(
        (o) => o.is_correct
      )
    );
    expect(isVaried(firstCorrect)).toBe(true);
  });
});

describe("GT-017: phương án là con số bé đếm được", () => {
  it("phương án đúng hiện đúng số khối, prompt không lộ đáp án", () => {
    for (const seed of SEEDS) {
      const content = GT017ContentSchema.parse(generate("GT-017", seed));
      const correct = content.options.find((o) => o.is_correct);
      const count = content.model.length;
      const keycap = count === 10 ? "🔟" : `${count}️⃣`;
      expect(correct ? refOf(correct.asset) : "").toBe(keycap);
      expect(new Set(content.options.map((o) => refOf(o.asset))).size).toBe(
        content.options.length
      );
      expect(content.prompt).not.toContain(String(count));
    }
  });
});

describe("engine phân loại: tiêu chí nhị phân (GT-002.md §14)", () => {
  const school = vocabularyFor("school");
  const own = new Set(school.nouns.map((n) => n.emoji_ref));
  const foils = new Set(school.contrast?.nouns.map((n) => n.emoji_ref));

  it("GT-002: vật đúng thuộc chủ đề, vật nhiễu thuộc chủ đề tương phản", () => {
    for (const seed of SEEDS) {
      const content = GT002ContentSchema.parse(generate("GT-002", seed));
      for (const item of content.items) {
        const ref = refOf(item.asset);
        expect(item.is_correct ? own.has(ref) : foils.has(ref)).toBe(true);
      }
    }
  });

  it("GT-003: chỉ vật thuộc chủ đề vào được giỏ", () => {
    for (const seed of SEEDS) {
      const content = GT003ContentSchema.parse(generate("GT-003", seed));
      for (const item of content.items) {
        const ref = refOf(item.asset);
        expect(item.is_correct ? own.has(ref) : foils.has(ref)).toBe(true);
      }
    }
  });

  it("GT-004: hai nhóm là hai chủ đề, mỗi vật về đúng chủ đề của nó", () => {
    for (const seed of SEEDS) {
      const content = GT004ContentSchema.parse(generate("GT-004", seed));
      for (const item of content.items) {
        const ref = refOf(item.asset);
        expect(
          item.correct_group_id === "g1" ? own.has(ref) : foils.has(ref)
        ).toBe(true);
      }
    }
  });

  it("GT-005: hai đầu mỗi cặp là cùng một hình", () => {
    for (const seed of SEEDS) {
      const content = GT005ContentSchema.parse(generate("GT-005", seed));
      for (const pair of content.pairs) {
        expect(refOf(pair.left.asset)).toBe(refOf(pair.right.asset));
      }
    }
  });

  it("mọi chủ đề đều có chủ đề tương phản", () => {
    for (const theme of ALL_VOCAB) {
      expect(pickContrast(theme, ALL_VOCAB), theme.theme).toBeDefined();
    }
  });

  it("thiếu vốn từ tương phản thì ném thay vì sinh tiêu chí mập mờ", () => {
    const gen = ALL_LEVEL_GENERATORS["GT-002"];
    const base = ALL_VOCAB[0];
    expect(gen && base).toBeTruthy();
    if (!(gen && base)) {
      return;
    }
    expect(() =>
      gen.generate({
        rng: createRng(1),
        age_band: "5-6",
        theme: base.theme,
        vocabulary: { ...base, contrast: undefined },
      })
    ).toThrow(CONTRAST_RE);
  });
});
