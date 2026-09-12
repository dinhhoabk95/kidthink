import type { GameMechanic } from "@mindkid/shared/taxonomy-types";
import type { z } from "zod";

export type LayoutId =
  | "grid"
  | "horizontal-row"
  | "grid-2x4"
  | "flex-wrap"
  | "top-source-bottom-target"
  | "left-source-right-target"
  | "multi-bucket-bottom"
  | "split-columns"
  | "two-column-matching"
  | "card-flip-grid"
  | "horizontal-track"
  | "step-ladder"
  | "number-bond-tree"
  | "ten-frame-split"
  | "horizontal-slot-track"
  | "matrix-slot-grid"
  | "clue-board"
  | "matrix-3x3"
  | "equation-rows"
  | "mirror-axis-split"
  | "free-scene"
  | "measure-strip"
  | "weave-grid"
  | "single-focus";

import type { AgeBand } from "@mindkid/shared/age-bands";

// biome-ignore lint/performance/noBarrelFile: Canonical types re-exported for game engine
export { AGE_BANDS, type AgeBand } from "@mindkid/shared/age-bands";
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

export const STANDARD_SCORING: ScoringSchema = {
  max_score: 100,
  pass_threshold: 60,
  star_thresholds: [60, 80, 100],
};

export interface EngineInputConfig {
  readonly family: string;
  readonly verbs: readonly string[];
  readonly tolerance_px?: number;
}

export interface GameTemplate<
  C extends z.ZodType = z.ZodType,
  D extends z.ZodType = z.ZodType,
> {
  code: `GT-${string}`;
  name: string;
  mechanic: GameMechanic;
  layouts: LayoutId[];
  content_contract: C;
  difficulty_contract: D;
  limits: GameTemplateLimits;
  age_min: 3 | 4 | 5 | 6;
  age_max: 3 | 4 | 5 | 6;
  banned_age_bands?: AgeBand[];
  requires_tap_fallback: boolean;
  asset_kinds: ("emoji" | "image" | "audio")[];
  kind?: "assess" | "teach";
  scoring: ScoringSchema;
  events: string[];
  engine_session: string;
  status: ContentStatus;
  version: number;
  input?: EngineInputConfig;
}

export interface TemplateDefinition<
  C extends z.ZodType = z.ZodType,
  D extends z.ZodType = z.ZodType,
> extends GameTemplate<C, D> {
  session?: () => Promise<unknown>;
}

export function defineTemplate<
  C extends z.ZodType = z.ZodType,
  D extends z.ZodType = z.ZodType,
>(def: TemplateDefinition<C, D>): TemplateDefinition<C, D> {
  return def;
}
