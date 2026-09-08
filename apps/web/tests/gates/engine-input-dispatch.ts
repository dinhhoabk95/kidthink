import { existsSync, readdirSync, readFileSync } from "node:fs";
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
 * Cổng bậc thang duck-typing: nợ đã về 0 từ Task #259.
 * Số này Cấm — NEVER tăng. Mọi nhánh `typeof session.*` mới trên bề mặt chơi
 * phải đi qua hợp đồng `TemplateGameSession` thay vì đoán kiểu tại chỗ.
 */
export const MAX_TYPEOF_SESSION_BRANCHES = 0;

/**
 * Thư mục composable của bề mặt chơi — Task #260 rút logic từ `[code].vue` sang
 * đây, nên cổng phải quét cả hai chỗ; quét riêng trang là phép đo cho 0 giả.
 */
export const PLAY_COMPOSABLES_DIR = resolve(
  REPO_ROOT,
  "apps",
  "web",
  "app",
  "composables",
  "play"
);

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

function listScannedFiles(
  playPagePath: string,
  composablesDir: string
): string[] {
  const files = [playPagePath];
  if (!existsSync(composablesDir)) {
    return files;
  }
  for (const entry of readdirSync(composablesDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(resolve(composablesDir, entry.name));
    }
  }
  return files;
}

export function scanEngineInputDispatch(
  playPagePath: string = PLAY_PAGE_PATH,
  readyConfigPath: string = ENGINE_INPUT_READY_CONFIG_PATH,
  composablesDir: string = PLAY_COMPOSABLES_DIR
): EngineInputDispatchScanResult {
  if (!existsSync(playPagePath)) {
    throw new Error(`File not found: ${playPagePath}`);
  }

  const content = readFileSync(playPagePath, "utf8");
  const occurrences: { line: number; text: string }[] = [];

  for (const filePath of listScannedFiles(playPagePath, composablesDir)) {
    const lines = readFileSync(filePath, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i] ?? "";
      if (TYPEOF_SESSION_REGEX.test(lineText)) {
        occurrences.push({
          line: i + 1,
          text: `${filePath.replace(`${REPO_ROOT}/`, "")}:${i + 1} ${lineText.trim()}`,
        });
      }
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
