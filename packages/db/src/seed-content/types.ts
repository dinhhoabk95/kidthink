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
  header: ContentSeedHeader;
  content_pack: TPack;
  difficulty_params: TParams;
}

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
