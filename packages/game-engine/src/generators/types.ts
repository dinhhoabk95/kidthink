import type { AgeBand } from "#src/contracts/types";
import type { Rng } from "#src/rng/types";

export interface VocabularyEntry {
  emoji_ref: string;
  label_vi: string;
}

export interface ThemeVocabulary {
  theme: string;
  nouns: VocabularyEntry[];
  containers?: VocabularyEntry[];
}

export interface GeneratorInput {
  rng: Rng;
  age_band: AgeBand;
  what?: string;
  theme: string;
  vocabulary: ThemeVocabulary;
}

export interface GeneratedLevel<TContent = unknown, TDifficulty = unknown> {
  content_pack: TContent;
  difficulty_params: TDifficulty;
}

export interface LevelGenerator<TContent = unknown, TDifficulty = unknown> {
  engine: `GT-${string}`;
  axes: {
    age_band: AgeBand[];
    what: string[];
    theme: string[];
  };
  generate(input: GeneratorInput): GeneratedLevel<TContent, TDifficulty>;
}
