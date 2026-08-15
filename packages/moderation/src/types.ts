/**
 * Moderation Categories for Child Content (BR-CGB-09, BR-GLM-05, Spec §7.5)
 */
export type ModerationCategory =
  | "violence"
  | "fear"
  | "death"
  | "disease"
  | "discrimination"
  | "trademark"
  | "politics_religion"
  | "shaming_punishment"
  | "profanity"
  | "negative_assertion";

export interface ModerationIssue {
  category: ModerationCategory;
  term: string;
  severity: "block" | "warn";
  message: string;
  position?: number;
}

export interface ModerationResult {
  passed: boolean;
  scannedChars: number;
  flaggedTerms: string[];
  issues: ModerationIssue[];
}

export interface ModerationOptions {
  timeoutMs?: number;
  maxInputChars?: number;
  allowNegativeAssertions?: boolean;
  failClosed?: boolean;
}
