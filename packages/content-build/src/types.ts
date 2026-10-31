export type {
  AnyContentSeed,
  ContentSeed,
  ContentSeedHeader,
  ContentSeedRound,
  SeedAuthoredIn,
  SeedOrigin,
} from "@mindkid/content";

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
