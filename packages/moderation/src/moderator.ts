import { CHILD_CONTENT_BLOCKLIST } from "./child-content-blocklist.js";
import type {
  ModerationIssue,
  ModerationOptions,
  ModerationResult,
} from "./types.js";

const DEFAULT_MAX_CHARS = 500;
const INVISIBLE_FORMAT_RE = /(?:\p{Cf}|\u034F|[\uFE00-\uFE0F])/gu;
const CURLY_QUOTES_RE = /[“”‘’«»„‟‹›]/g;
const INTRA_WORD_PUNCT_RE =
  /(?<=\p{L})[.,/#!$%^&*;:{}=\-_`~()?"'<>|\\+]+(?=\p{L})/gu;
const WORD_SPLIT_PUNCT_RE = /[.,/#!$%^&*;:{}=\-_`~()?"'<>|\\+]/g;

function canonicalizeUnicode(input: string): string {
  return input
    .normalize("NFKC")
    .replace(INVISIBLE_FORMAT_RE, "")
    .toLowerCase()
    .normalize("NFC")
    .replace(CURLY_QUOTES_RE, " ");
}

/**
 * Normalizes input text for moderation checking, collapsing punctuation inserted
 * between letters of the same word without merging space-separated words.
 */
function normalizeText(input: string): string {
  return canonicalizeUnicode(input)
    .replace(INTRA_WORD_PUNCT_RE, "")
    .replace(WORD_SPLIT_PUNCT_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes punctuation as word separators so hyphenated/dotted phrases still match.
 */
function normalizeSpacedText(input: string): string {
  return canonicalizeUnicode(input)
    .replace(WORD_SPLIT_PUNCT_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a blocklist term is present in the normalized text with word boundary considerations.
 */
function containsTerm(normalizedText: string, term: string): boolean {
  const normTerm = term.toLowerCase().normalize("NFC").trim();
  if (!normTerm) {
    return false;
  }

  // Single word boundary or phrase boundary check
  const paddedText = ` ${normalizedText} `;
  const paddedTerm = ` ${normTerm} `;

  return paddedText.includes(paddedTerm);
}

/**
 * Moderates a text input against the closed Vietnamese child content safety blocklist.
 * Complies with BR-CGB-09, BR-GLM-05, and D-P4S.
 */
export function moderateText(
  rawInput: string,
  options: ModerationOptions = {}
): ModerationResult {
  const maxChars = options.maxInputChars ?? DEFAULT_MAX_CHARS;
  const input = typeof rawInput === "string" ? rawInput : "";

  if (input.length > maxChars) {
    return {
      passed: false,
      scannedChars: input.length,
      flaggedTerms: ["INPUT_TOO_LONG"],
      issues: [
        {
          category: "profanity",
          term: "EXCESSIVE_LENGTH",
          severity: "block",
          message: `Nội dung quá dài (tối đa ${maxChars} ký tự).`,
        },
      ],
    };
  }

  const normalized = normalizeText(input);
  const normalizedSpaced = normalizeSpacedText(input);
  const issues: ModerationIssue[] = [];
  const flaggedTerms: string[] = [];

  for (const entry of CHILD_CONTENT_BLOCKLIST) {
    // Skip negative assertion check if explicitly disabled
    if (
      entry.category === "negative_assertion" &&
      options.allowNegativeAssertions
    ) {
      continue;
    }

    if (
      containsTerm(normalized, entry.term) ||
      (normalizedSpaced !== normalized &&
        containsTerm(normalizedSpaced, entry.term))
    ) {
      flaggedTerms.push(entry.term);
      issues.push({
        category: entry.category,
        term: entry.term,
        severity: entry.severity,
        message: entry.message,
      });
    }
  }

  const hasBlockingIssue = issues.some((i) => i.severity === "block");

  return {
    passed: !hasBlockingIssue,
    scannedChars: input.length,
    flaggedTerms,
    issues,
  };
}

/**
 * Validates custom game title and instruction together.
 */
export function moderateCustomGameMetadata(
  title: string,
  instruction: string,
  options: ModerationOptions = {}
): ModerationResult {
  const titleResult = moderateText(title, {
    ...options,
    allowNegativeAssertions: true, // Title does not need negative assertion check
  });

  const instructionResult = moderateText(instruction, {
    ...options,
    allowNegativeAssertions: false, // Instructions strictly forbid negative assertions (BR-GLM-05)
  });

  const passed = titleResult.passed && instructionResult.passed;
  const combinedFlagged = [
    ...titleResult.flaggedTerms,
    ...instructionResult.flaggedTerms,
  ];
  const combinedIssues = [...titleResult.issues, ...instructionResult.issues];

  return {
    passed,
    scannedChars: titleResult.scannedChars + instructionResult.scannedChars,
    flaggedTerms: [...new Set(combinedFlagged)],
    issues: combinedIssues,
  };
}
