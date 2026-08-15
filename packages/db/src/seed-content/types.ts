import type {
  ActivityInstruction,
  ActivityKind,
  LessonGuide,
} from "@kidthink/shared";

export type SeedOrigin = "human" | "ai_assisted";
export type SeedAuthoredIn = "repo_seed" | "studio";

export interface ContentSeedHeader {
  code: string;
  content_version: number;
  template_code: string;
  title_vi: string;
  instruction_vi: string;
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
}

export interface ContentSeed<TPack = unknown, TParams = unknown> {
  kind?: "game_level";
  header: ContentSeedHeader;
  content_pack: TPack;
  difficulty_params: TParams;
}

export interface ActivitySeedHeader {
  code: string;
  content_version: number;
  activity_kind: ActivityKind;
  title_vi: string;
  instruction: ActivityInstruction;
  materials_vi?: string;
  estimated_minutes: number;
  access_tier: "free" | "login" | "standard" | "premium";
  skill_codes: string[];
  learning_objective_codes: string[];
  what_tags: string[];
  thinking_tags: string[];
  theme_tag?: string;
  origin: SeedOrigin;
  authored_in: SeedAuthoredIn;
  ref_type?: string;
  ref_id?: number;
}

export interface ActivitySeed {
  kind: "activity";
  header: ActivitySeedHeader;
}

export interface LessonSeedHeader {
  code: string;
  content_version: number;
  title_vi: string;
  guide: LessonGuide;
  target_age_min: number;
  target_age_max: number;
  estimated_minutes: number;
  materials_vi?: string;
  warm_up_vi?: string;
  reflection_vi?: string;
  assessment_vi?: string;
  extension_vi?: string;
  access_tier: "free" | "login" | "standard" | "premium";
  skill_codes: string[];
  learning_objective_codes: string[];
  activity_codes: string[];
  what_tags: string[];
  thinking_tags: string[];
  theme_tag?: string;
  origin: SeedOrigin;
  authored_in: SeedAuthoredIn;
}

export interface LessonSeed {
  kind: "lesson";
  header: LessonSeedHeader;
}

export type AnyContentSeed =
  | ContentSeed<unknown, unknown>
  | ActivitySeed
  | LessonSeed;

export interface GateIssue {
  file?: string;
  line?: number;
  code: string;
  message: string;
}

export interface GateResult {
  gate: number;
  name: string;
  kind: "xác định" | "heuristic";
  passed: boolean;
  issues: GateIssue[];
}

export interface BatchCheckReport {
  totalFiles: number;
  passedFiles: number;
  failedFiles: number;
  gateResults: GateResult[];
  drift?: Array<{ code: string; reason: string }>;
}
