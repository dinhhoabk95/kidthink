export type RoadmapBand = "3-4" | "4-5" | "5-6";

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

export interface RoadmapSeed {
  readonly code: string;
  readonly version: number;
  readonly band: RoadmapBand;
  readonly title: string;
  readonly sessions_per_week: number;
  readonly duration_weeks: number;
  readonly weeks: readonly RoadmapWeek[];
}
