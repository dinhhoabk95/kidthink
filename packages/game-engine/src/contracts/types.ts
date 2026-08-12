import type { z } from "zod";

export type AgeBand = "3-4" | "4-5" | "5-6";
export type ContentStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived";

export interface GameTemplateLimits {
  item_count: [min: number, max: number];
  distractor_count: [min: number, max: number];
  target_count: [min: number, max: number];
}

export interface ScoringSchema {
  max_score: number;
  pass_threshold: number;
  star_thresholds: [star1: number, star2: number, star3: number];
}

export interface GameTemplate<
  C extends z.ZodType = z.ZodType,
  D extends z.ZodType = z.ZodType,
> {
  code: `GT-${string}`;
  name_vi: string;
  mechanic: string;
  layouts: string[];
  content_contract: C;
  difficulty_contract: D;
  limits: GameTemplateLimits;
  age_min: 3 | 4 | 5 | 6;
  age_max: 3 | 4 | 5 | 6;
  banned_age_bands?: AgeBand[];
  requires_tap_fallback: boolean;
  asset_kinds: ("emoji" | "image" | "audio")[];
  scoring: ScoringSchema;
  events: string[];
  engine_session: string;
  status: ContentStatus;
  version: number;
}
