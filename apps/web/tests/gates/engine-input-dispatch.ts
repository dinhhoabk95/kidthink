import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

export const PLAY_PAGE_PATH = resolve(
  REPO_ROOT,
  "apps",
  "web",
  "app",
  "pages",
  "play",
  "[code].vue"
);

export const ENGINE_INPUT_READY_CONFIG_PATH = resolve(
  REPO_ROOT,
  "packages",
  "game-engine",
  "config",
  "engine-input-ready.json"
);

/**
 * Baseline ratchet: currently 8 duck-typing typeof session.* branches exist in play/[code].vue.
 * This number must never increase; as templates migrate to input contracts, it will decrease.
 */
export const MAX_TYPEOF_SESSION_BRANCHES = 8;

const TYPEOF_SESSION_REGEX = /typeof\s+session\.\w+/;
const HANDLE_TAP_OPTION_FN_REGEX =
  /function\s+handleTapOptionOrToggle\s*\([^)]*\)\s*:\s*boolean\s*\{([\s\S]*?)\n\s*\}/;
const ON_ITEM_LOCKED_REGEX = /typeof\s+session\.onItemLocked/;

export interface EngineInputDispatchScanResult {
  readonly totalTypeOfSessionCount: number;
  readonly occurrences: readonly { line: number; text: string }[];
  readonly readyCodes: readonly string[];
  readonly hasOnItemLockedInTapOptions: boolean;
}

export function scanEngineInputDispatch(
  playPagePath: string = PLAY_PAGE_PATH,
  readyConfigPath: string = ENGINE_INPUT_READY_CONFIG_PATH
): EngineInputDispatchScanResult {
  if (!existsSync(playPagePath)) {
    throw new Error(`File not found: ${playPagePath}`);
  }

  const content = readFileSync(playPagePath, "utf8");
  const lines = content.split("\n");
  const occurrences: { line: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i] ?? "";
    if (TYPEOF_SESSION_REGEX.test(lineText)) {
      occurrences.push({ line: i + 1, text: lineText.trim() });
    }
  }

  let readyCodes: string[] = [];
  if (existsSync(readyConfigPath)) {
    const raw = readFileSync(readyConfigPath, "utf8");
    readyCodes = JSON.parse(raw) as string[];
  }

  // Check if handleTapOptionOrToggle still has typeof session.onItemLocked
  const handleTapOptionMatch = content.match(HANDLE_TAP_OPTION_FN_REGEX);
  const hasOnItemLockedInTapOptions = handleTapOptionMatch
    ? ON_ITEM_LOCKED_REGEX.test(handleTapOptionMatch[1] ?? "")
    : false;

  return {
    totalTypeOfSessionCount: occurrences.length,
    occurrences,
    readyCodes,
    hasOnItemLockedInTapOptions,
  };
}
