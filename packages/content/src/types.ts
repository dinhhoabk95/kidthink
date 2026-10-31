export type SeedOrigin = "human" | "ai_assisted";
export type SeedAuthoredIn = "repo_seed" | "studio";

export interface ContentSeedHeader {
  code: string;
  content_version: number;
  template_code: string;
  title: string;
  instruction: string;
  age_min: number;
  age_max: number;
  difficulty: number;
  access_tier: "free" | "login" | "standard" | "premium";
  skill_codes: string[];
  learning_objective_codes: string[];
  what_tags: string[];
  thinking_tags: string[];
  theme_tag?: string;
  origin: SeedOrigin;
  authored_in: SeedAuthoredIn;
  montessori_ref?: string;
}

export interface ContentSeedRound<TPack = unknown, TParams = unknown> {
  instruction: string;
  instruction_audio_path?: string;
  content_pack: TPack;
  difficulty_params: TParams;
  difficulty: number;
}

export interface ContentSeed<TPack = unknown, TParams = unknown> {
  kind?: "game_level";
  header: ContentSeedHeader;
  content_pack: TPack;
  difficulty_params: TParams;
  rounds?: ContentSeedRound<TPack, TParams>[];
}

export type AnyContentSeed = ContentSeed<unknown, unknown>;
