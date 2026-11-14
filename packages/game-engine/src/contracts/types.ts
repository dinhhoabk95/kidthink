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
  | "single-focus"
  | "scatter-board";

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

import type { PlayVerb } from "#src/interaction";

export interface EngineInputConfig {
  readonly family: string;
  readonly verbs: readonly PlayVerb[];
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
  /** `text` có trong union của `assetSchema()` nên phải khai được ở đây. */
  asset_kinds: ("emoji" | "image" | "audio" | "text")[];
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
  session?: () => Promise<object>;
}

export function defineTemplate<
  C extends z.ZodType = z.ZodType,
  D extends z.ZodType = z.ZodType,
>(def: TemplateDefinition<C, D>): TemplateDefinition<C, D> {
  return def;
}

export type FeedbackKind =
  | "none"
  | "amber_soft"
  | "pop_celebrate"
  | "level_celebrate";

export type GameActionValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | object;

export type TelemetryEventData = Record<string, GameActionValue>;

/** A player interaction handed to `validateAction`. */
export interface GameAction {
  type: string;
  data: GameActionValue;
}

/** Verdict of `validateAction` — pure, no side effects (BR-ENG-13). */
export interface ActionResult {
  valid: boolean;
  feedback: FeedbackKind;
}

/** Action the session does not handle — no feedback owed. */
export const ACTION_IGNORED: ActionResult = Object.freeze({
  valid: false,
  feedback: "none",
});

/** Correct answer — small pop at the touch point (BR-ENG-08). */
export const ACTION_CORRECT: ActionResult = Object.freeze({
  valid: true,
  feedback: "pop_celebrate",
});

/** Wrong answer — amber nudge, never punitive, never silent (BR-ENG-07). */
export const ACTION_RETRY: ActionResult = Object.freeze({
  valid: false,
  feedback: "amber_soft",
});
