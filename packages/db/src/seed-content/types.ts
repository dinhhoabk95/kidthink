import type {
  ActivityInstruction,
  ActivityKind,
  LessonGuide,
} from "@mindkid/shared";

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
  /**
   * Mã dạng bài trong lô Montessori, ví dụ `WB01-D1`.
   *
   * Trước đây nằm trong comment `// WB01-D1 Level 2 …` và
   * `tests/gates/montessori-corpus.ts` đếm bằng cách quét văn bản file. Một
   * codemod phát lại literal đã xoá sạch comment và cổng tụt từ 24 xuống 14 mà
   * nội dung không mất gì — con số có cổng canh thì phải là dữ liệu.
   */
  montessori_ref?: string;
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
  title: string;
  instruction: ActivityInstruction;
  materials?: string;
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
  ref_code?: string;
  ref_id?: number;
}

export interface ActivitySeed {
  kind: "activity";
  header: ActivitySeedHeader;
}

export interface LessonSeedHeader {
  code: string;
  content_version: number;
  title: string;
  guide: LessonGuide;
  target_age_min: number;
  target_age_max: number;
  estimated_minutes: number;
  materials?: string;
  warm_up?: string;
  reflection?: string;
  assessment?: string;
  extension?: string;
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
