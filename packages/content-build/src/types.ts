export type {
  ActivitySeed,
  ActivitySeedHeader,
  AnyContentSeed,
  ContentSeed,
  ContentSeedHeader,
  ContentSeedRound,
  LessonSeed,
  LessonSeedHeader,
  SeedAuthoredIn,
  SeedOrigin,
} from "@mindkid/content";
export type {
  ActivityInstruction,
  ActivityKind,
  LessonGuide,
} from "@mindkid/shared";

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
