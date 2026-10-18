import type { AgeBand } from "#src/contracts/types";
import type { Rng } from "#src/rng/types";

export interface VocabularyEntry {
  emoji_ref: string;
  label_vi: string;
}

/** Chủ đề khác nhóm emoji, cấp vật nhiễu cho engine phân loại (`level-generator-kit.md` §7.2). */
export interface ContrastVocabulary {
  theme: string;
  label_vi: string;
  icon_emoji_ref: string;
  nouns: VocabularyEntry[];
}

export interface ThemeVocabulary {
  theme: string;
  label_vi?: string;
  icon_emoji_ref?: string;
  nouns: VocabularyEntry[];
  containers?: VocabularyEntry[];
  contrast?: ContrastVocabulary;
}

export interface GeneratorInput {
  rng: Rng;
  age_band: AgeBand;
  what?: string;
  theme: string;
  vocabulary: ThemeVocabulary;
  escalation_step?: number;
}

export interface GeneratedLevel<TContent = object, TDifficulty = object> {
  content_pack: TContent;
  difficulty_params: TDifficulty;
}

export interface LevelGenerator<TContent = object, TDifficulty = object> {
  engine: `GT-${string}`;
  axes: {
    age_band: AgeBand[];
    what: string[];
    theme: string[];
  };
  generate(input: GeneratorInput): GeneratedLevel<TContent, TDifficulty>;
}
