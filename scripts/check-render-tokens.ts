/**
 * Cổng RENDER TOKENS RATCHET — Quét hằng hex thô trong tầng render của game-engine
 * ngoài designTokens.ts (Task #268 / BR-DSC-26 / T5.1..T5.5).
 *
 *   pnpm check:render-tokens             # Chạy kiểm tra đối chiếu baseline
 *   pnpm check:render-tokens --update    # Cập nhật baseline khi nợ giảm
 *
 * Nợ chỉ được giảm, NEVER tăng. `--update` từ chối ghi khi nợ tăng.
 */

import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

export interface RenderTokensBaseline {
  max_hex_tokens: number;
}

export interface HexTokenViolation {
  readonly file: string;
  readonly line: number;
  readonly hex: string;
  readonly snippet: string;
}

const BASELINE_PATH = path.join(
  REPO_ROOT,
  "scripts/render-tokens-baseline.json"
);

const RENDER_DIR = path.join(REPO_ROOT, "packages/game-engine/src/render");

const HEX_COLOR_REGEX = /["'`](#(?:[0-9a-fA-F]{3}){1,2}|#[0-9a-fA-F]{8})["'`]/g;

export function scanFileHexTokens(filePath: string): HexTokenViolation[] {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const violations: HexTokenViolation[] = [];
  const relPath = path.relative(REPO_ROOT, filePath);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (!line) {
      continue;
    }
    // Bỏ qua dòng comment thuần tuý
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) {
      continue;
    }

    HEX_COLOR_REGEX.lastIndex = 0;
    let match = HEX_COLOR_REGEX.exec(line);
    while (match) {
      const hex = match[1];
      if (hex) {
        violations.push({
          file: relPath,
          line: lineIndex + 1,
          hex,
          snippet: line.trim(),
        });
      }
      match = HEX_COLOR_REGEX.exec(line);
    }
  }

  return violations;
}

export function scanRenderTokens(dir = RENDER_DIR): HexTokenViolation[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const allViolations: HexTokenViolation[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      allViolations.push(...scanRenderTokens(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      entry.name !== "designTokens.ts"
    ) {
      allViolations.push(...scanFileHexTokens(fullPath));
    }
  }

  return allViolations;
}

export function readBaseline(): RenderTokensBaseline {
  if (!fs.existsSync(BASELINE_PATH)) {
    return { max_hex_tokens: 59 };
  }
  const raw = fs.readFileSync(BASELINE_PATH, "utf8");
  const parsed = JSON.parse(raw) as { max_hex_tokens?: number };
  return {
    max_hex_tokens: parsed.max_hex_tokens ?? 59,
  };
}

export function writeBaseline(baseline: RenderTokensBaseline): void {
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(baseline, null, 2)}\n`,
    "utf8"
  );
}

export function runCheck(isUpdate = false): {
  success: boolean;
  total: number;
  baseline: number;
} {
  const violations = scanRenderTokens();
  const total = violations.length;
  const currentBaseline = readBaseline();

  if (isUpdate) {
    if (total > currentBaseline.max_hex_tokens) {
      console.error(
        `❌ check:render-tokens --update TỪ CHỐI: số hex tokens tăng từ ${currentBaseline.max_hex_tokens} lên ${total}.`
      );
      return {
        success: false,
        total,
        baseline: currentBaseline.max_hex_tokens,
      };
    }
    writeBaseline({ max_hex_tokens: total });
    console.log(
      `✅ check:render-tokens: Đã cập nhật baseline từ ${currentBaseline.max_hex_tokens} xuống ${total}.`
    );
    return { success: true, total, baseline: total };
  }

  if (total > currentBaseline.max_hex_tokens) {
    console.error(
      `❌ check:render-tokens THẤT BẠI: Phát hiện ${total} hex tokens thô (trần baseline: ${currentBaseline.max_hex_tokens}).`
    );
    console.error("Danh sách vi phạm (BR-DSC-26):");
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} [${v.hex}]: ${v.snippet}`);
    }
    return { success: false, total, baseline: currentBaseline.max_hex_tokens };
  }

  console.log(
    `✅ check:render-tokens: ${total}/${currentBaseline.max_hex_tokens} hex tokens thô (đạt trần).`
  );
  return { success: true, total, baseline: currentBaseline.max_hex_tokens };
}

// Chạy trực tiếp qua CLI
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("check-render-tokens.ts") ||
    process.argv[1].endsWith("check-render-tokens.js"));

if (isDirectRun) {
  const isUpdate = process.argv.includes("--update");
  const result = runCheck(isUpdate);
  if (!result.success) {
    process.exit(1);
  }
}
