import type { AgeBand } from "@mindkid/shared/age-bands";

export type RoadmapBand = AgeBand;

export type RoadmapSessionRole =
  | "introduce"
  | "practice"
  | "review"
  | "offscreen";

export interface RoadmapSession {
  readonly session_no: number;
  readonly role: RoadmapSessionRole;
  readonly skill_code: string;
  readonly topics?: readonly string[];
}

export interface RoadmapWeek {
  readonly week_no: number;
  readonly goal: string;
  readonly target_skills: readonly string[];
  readonly sessions: readonly RoadmapSession[];
}

export type RoadmapAccessTier = "free" | "login" | "standard" | "premium";

export interface RoadmapSeed {
  readonly code: string;
  readonly version: number;
  readonly band: RoadmapBand;
  readonly title: string;
  readonly description: string;
  readonly access_tier: RoadmapAccessTier;
  readonly sessions_per_week: number;
  readonly duration_weeks: number;
  readonly weeks: readonly RoadmapWeek[];
}
