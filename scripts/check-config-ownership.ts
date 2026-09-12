/**
 * Cổng kiểm tra sở hữu cấu hình — Task #270 (BR-CFO-01..12).
 *
 * Kiểm tra 7 trục ratchet cấu hình và các luật bất biến về cấu hình:
 *   pnpm check:config-ownership             # Kiểm tra đối chiếu ratchet baseline
 *   pnpm check:config-ownership:update      # Cập nhật baseline khi nợ giảm
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";

export interface ConfigOwnershipStats {
  duplicate_config_files: number;
  duplicate_constant_values: number;
  age_band_declarations: number;
  touch_floor_declarations: number;
  token_source_count: number;
  orphan_check_scripts: number;
  commented_lefthook_blocks: number;
}

export interface ConfigViolation {
  rule: string;
  target: string;
  message: string;
}

export interface ScanConfigOwnershipOptions {
  repoRoot?: string;
  baselinePath?: string;
}

const PROOF_TTL_REGEX =
  /(?:const|let|var)\s+PROOF_SIGNED_URL_TTL_MINUTES\s*=\s*\d+/;
const EMBEDDING_DIM_REGEX =
  /(?:const|let|var)\s+DEFAULT_EMBEDDING_DIMENSION\s*=\s*\d+/;
const RAW_UNION_REGEX = /["']3-4["']\s*\|\s*["']4-5["']\s*\|\s*["']5-6["']/;
const RAW_ARRAY_REGEX =
  /\[\s*["']3-4["']\s*,\s*["']4-5["']\s*,\s*["']5-6["']\s*\]/;
const MIN_TOUCH_REGEX = /\bMIN_TOUCH_PX\b/;
const SURFACE_500_DRIFT_REGEX = /surface\s*:\s*\{[^}]*500:\s*["']#827660["']/m;
const FONTS_DRIFT_QUICKSAND_REGEX = /["']Quicksand["']/;
const FONTS_DRIFT_FREDOKA_REGEX = /["']Fredoka["']/;
const LOW_MASTERY_LITERAL_REGEX = /p_learn\s*<\s*0\.4\b/;
const HIGH_MASTERY_LITERAL_REGEX = /p_learn\s*>=\s*0\.8\b/;
const ENGINE_GATES_NAME_REGEX = /name:\s*engine-gates[\s\S]*?glob:/m;
const BLIND_SPOT_REGEX = /Điểm mù|điểm mù/;
const PUBLIC_CONFIG_REGEX = /runtimeConfig\s*:\s*\{[\s\S]*?public\s*:\s*\{/;

function getMd5(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(content).digest("hex");
}

function checkDuplicateConfigFiles(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 0;
  const dbConfigDir = path.join(root, "packages/db/config");
  const contentBuildThresholdsDir = path.join(
    root,
    "packages/content-build/src/thresholds"
  );

  if (
    !(fs.existsSync(dbConfigDir) && fs.existsSync(contentBuildThresholdsDir))
  ) {
    return 0;
  }

  const dbFiles = fs.readdirSync(dbConfigDir);
  for (const fileName of dbFiles) {
    const dbFilePath = path.join(dbConfigDir, fileName);
    const contentFilePath = path.join(contentBuildThresholdsDir, fileName);

    if (!fs.existsSync(contentFilePath)) {
      continue;
    }

    const isDbSymlink = fs.lstatSync(dbFilePath).isSymbolicLink();
    const isContentSymlink = fs.lstatSync(contentFilePath).isSymbolicLink();

    if (
      !(isDbSymlink || isContentSymlink) &&
      getMd5(dbFilePath) === getMd5(contentFilePath)
    ) {
      count++;
      violations.push({
        rule: "BR-CFO-02",
        target: `packages/db/config/${fileName}`,
        message: `Trùng byte với packages/content-build/src/thresholds/${fileName} nhưng không dùng symlink`,
      });
    }
  }

  return count;
}

function checkDuplicateConstantValues(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 0;
  const storageIndexPath = path.join(root, "packages/storage/src/index.ts");
  if (fs.existsSync(storageIndexPath)) {
    const content = fs.readFileSync(storageIndexPath, "utf-8");
    if (PROOF_TTL_REGEX.test(content)) {
      count++;
      violations.push({
        rule: "BR-CFO-01",
        target: "packages/storage/src/index.ts",
        message:
          "Khai báo lại PROOF_SIGNED_URL_TTL_MINUTES thay vì import từ @mindkid/config",
      });
    }
  }

  const aiAssistantPath = path.join(
    root,
    "packages/shared/src/ai-assistant.ts"
  );
  if (fs.existsSync(aiAssistantPath)) {
    const content = fs.readFileSync(aiAssistantPath, "utf-8");
    if (EMBEDDING_DIM_REGEX.test(content)) {
      count++;
      violations.push({
        rule: "BR-CFO-01",
        target: "packages/shared/src/ai-assistant.ts",
        message:
          "Khai báo lại DEFAULT_EMBEDDING_DIMENSION thay vì import từ ./ai.js",
      });
    }
  }

  return count;
}

function isExcludedPath(fullPath: string): boolean {
  return (
    fullPath.endsWith("packages/shared/src/age-bands.ts") ||
    fullPath.endsWith("scripts/check-config-ownership.ts") ||
    fullPath.endsWith("scripts/check-config-ownership.test.ts")
  );
}

function checkAgeBandFile(
  fullPath: string,
  root: string,
  violations: ConfigViolation[]
): boolean {
  if (isExcludedPath(fullPath)) {
    return false;
  }
  const content = fs.readFileSync(fullPath, "utf-8");
  const hasRawUnion = RAW_UNION_REGEX.test(content);
  const hasRawArray =
    RAW_ARRAY_REGEX.test(content) && !content.includes("AGE_BANDS");

  if (hasRawUnion || hasRawArray) {
    const relPath = path.relative(root, fullPath);
    violations.push({
      rule: "BR-CFO-06",
      target: relPath,
      message:
        "Khai báo band tuổi độc lập thay vì dùng AGE_BANDS từ @mindkid/shared",
    });
    return true;
  }
  return false;
}

function scanAgeBandsInDir(
  dirPath: string,
  root: string,
  violations: ConfigViolation[]
): number {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".nuxt" ||
        entry.name === ".output" ||
        entry.name === "dist" ||
        entry.name === "tests"
      ) {
        continue;
      }
      count += scanAgeBandsInDir(fullPath, root, violations);
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".vue")) &&
      !entry.name.includes(".test.") &&
      !entry.name.includes(".spec.") &&
      checkAgeBandFile(fullPath, root, violations)
    ) {
      count++;
    }
  }
  return count;
}

function checkAgeBandDeclarations(
  root: string,
  violations: ConfigViolation[]
): number {
  let declarations = 1; // 1 canonical declaration
  declarations += scanAgeBandsInDir(
    path.join(root, "packages"),
    root,
    violations
  );
  declarations += scanAgeBandsInDir(path.join(root, "apps"), root, violations);
  return declarations;
}

function checkTouchFloorDeclarations(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 1; // 1 canonical declaration
  const interactionPath = path.join(
    root,
    "packages/game-engine/src/interaction.ts"
  );
  if (fs.existsSync(interactionPath)) {
    const content = fs.readFileSync(interactionPath, "utf-8");
    if (MIN_TOUCH_REGEX.test(content)) {
      count++;
      violations.push({
        rule: "BR-CFO-07",
        target: "packages/game-engine/src/interaction.ts",
        message:
          "Khai báo MIN_TOUCH_PX độc lập thay vì dùng TOUCH_FLOORS từ @mindkid/shared",
      });
    }
  }
  return count;
}

function checkTokenSources(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 1;
  const designTokensPath = path.join(
    root,
    "packages/game-engine/src/systems/designTokens.ts"
  );
  if (fs.existsSync(designTokensPath)) {
    const content = fs.readFileSync(designTokensPath, "utf-8");
    if (SURFACE_500_DRIFT_REGEX.test(content)) {
      count = 2;
      violations.push({
        rule: "BR-CFO-08",
        target: "packages/game-engine/src/systems/designTokens.ts",
        message:
          "Màu surface-500 lệch so với tailwind.css (#827660 thay vì #78716c)",
      });
    }
    if (
      FONTS_DRIFT_QUICKSAND_REGEX.test(content) ||
      FONTS_DRIFT_FREDOKA_REGEX.test(content)
    ) {
      count = 2;
      violations.push({
        rule: "BR-CFO-08",
        target: "packages/game-engine/src/systems/designTokens.ts",
        message: "Phông khai mà không được nạp trong app (Quicksand / Fredoka)",
      });
    }
  }
  return count;
}

function isSpecialCheckScript(name: string): boolean {
  return (
    name.endsWith(":update") ||
    name === "check:fast" ||
    name === "check:ratchets" ||
    name === "check:engine-gates"
  );
}

function checkOrphanCheckScripts(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 0;
  const packageJsonPath = path.join(root, "package.json");
  const checkShPath = path.join(root, "scripts/check.sh");
  const lefthookPath = path.join(root, "lefthook.yml");

  if (
    !(
      fs.existsSync(packageJsonPath) &&
      fs.existsSync(checkShPath) &&
      fs.existsSync(lefthookPath)
    )
  ) {
    return 0;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
    scripts?: Record<string, string>;
  };
  const checkShContent = fs.readFileSync(checkShPath, "utf-8");
  const lefthookContent = fs.readFileSync(lefthookPath, "utf-8");

  const scripts = pkg.scripts ?? {};
  for (const scriptName of Object.keys(scripts)) {
    if (!scriptName.startsWith("check:") || isSpecialCheckScript(scriptName)) {
      continue;
    }

    const scriptCmd = scripts[scriptName] ?? "";
    const inCheckSh =
      checkShContent.includes(scriptName) ||
      (scriptCmd.length > 0 && checkShContent.includes(scriptCmd));
    const inLefthook =
      lefthookContent.includes(scriptName) ||
      (scriptCmd.length > 0 && lefthookContent.includes(scriptCmd));

    if (!(inCheckSh || inLefthook)) {
      count++;
      violations.push({
        rule: "BR-CFO-09",
        target: `package.json -> scripts["${scriptName}"]`,
        message: `Script ${scriptName} không có call site trong scripts/check.sh hoặc lefthook.yml`,
      });
    }
  }

  return count;
}

function checkCommentedLefthookBlocks(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 0;
  const lefthookPath = path.join(root, "lefthook.yml");
  if (!fs.existsSync(lefthookPath)) {
    return 0;
  }

  const content = fs.readFileSync(lefthookPath, "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? "";
    if (line.startsWith("# pre-push:")) {
      const nextLines = lines.slice(i, i + 10).map((l) => l.trim());
      const hasCommentedJobs = nextLines.some(
        (l) => l.startsWith("#   jobs:") || l.startsWith("#     - name:")
      );
      if (hasCommentedJobs) {
        count++;
        violations.push({
          rule: "BR-CFO-11",
          target: `lefthook.yml:${i + 1}`,
          message: "Khối pre-push bị comment hoàn toàn",
        });
      }
    }
  }

  return count;
}

function checkAdditionalRules(
  root: string,
  violations: ConfigViolation[]
): void {
  const levelParamsPath = path.join(
    root,
    "packages/adaptive/src/level-params.ts"
  );
  if (fs.existsSync(levelParamsPath)) {
    const content = fs.readFileSync(levelParamsPath, "utf-8");
    if (
      LOW_MASTERY_LITERAL_REGEX.test(content) ||
      HIGH_MASTERY_LITERAL_REGEX.test(content)
    ) {
      violations.push({
        rule: "BR-CFO-04",
        target: "packages/adaptive/src/level-params.ts",
        message:
          "Số trần (0.4 / 0.8) so sánh trực tiếp trong thân hàm thay vì dùng hằng số có tên",
      });
    }
  }

  const configIndexPath = path.join(root, "packages/config/src/index.ts");
  if (fs.existsSync(configIndexPath)) {
    const content = fs.readFileSync(configIndexPath, "utf-8");
    if (!(content.includes("backup") && content.includes("repo-paths"))) {
      violations.push({
        rule: "BR-CFO-05",
        target: "packages/config/src/index.ts",
        message:
          "Barrel packages/config/src/index.ts thiếu export backup.js hoặc repo-paths.js",
      });
    }
  }

  const lefthookPath = path.join(root, "lefthook.yml");
  if (fs.existsSync(lefthookPath)) {
    const content = fs.readFileSync(lefthookPath, "utf-8");
    if (
      ENGINE_GATES_NAME_REGEX.test(content) &&
      !BLIND_SPOT_REGEX.test(content)
    ) {
      violations.push({
        rule: "BR-CFO-10",
        target: "lefthook.yml",
        message:
          "Job engine-gates thiếu chú thích điểm mù về các commit bị bỏ qua",
      });
    }
  }

  const webNuxtConfigPath = path.join(root, "apps/web/nuxt.config.ts");
  if (fs.existsSync(webNuxtConfigPath)) {
    const content = fs.readFileSync(webNuxtConfigPath, "utf-8");
    if (!PUBLIC_CONFIG_REGEX.test(content)) {
      violations.push({
        rule: "BR-CFO-12",
        target: "apps/web/nuxt.config.ts",
        message:
          "Thiếu khai báo runtimeConfig.public để phân định ranh giới public/private",
      });
    }
  }
}

export function scanConfigOwnership(options?: ScanConfigOwnershipOptions): {
  stats: ConfigOwnershipStats;
  violations: ConfigViolation[];
  baseline: ConfigOwnershipStats;
} {
  const root = options?.repoRoot ?? repoPath();
  const baselineFile =
    options?.baselinePath ??
    path.join(root, "scripts/config-ownership-baseline.json");

  const violations: ConfigViolation[] = [];

  const currentStats: ConfigOwnershipStats = {
    duplicate_config_files: checkDuplicateConfigFiles(root, violations),
    duplicate_constant_values: checkDuplicateConstantValues(root, violations),
    age_band_declarations: checkAgeBandDeclarations(root, violations),
    touch_floor_declarations: checkTouchFloorDeclarations(root, violations),
    token_source_count: checkTokenSources(root, violations),
    orphan_check_scripts: checkOrphanCheckScripts(root, violations),
    commented_lefthook_blocks: checkCommentedLefthookBlocks(root, violations),
  };

  checkAdditionalRules(root, violations);

  let baseline: ConfigOwnershipStats = {
    duplicate_config_files: 0,
    duplicate_constant_values: 0,
    age_band_declarations: 1,
    touch_floor_declarations: 1,
    token_source_count: 1,
    orphan_check_scripts: 0,
    commented_lefthook_blocks: 0,
  };

  if (fs.existsSync(baselineFile)) {
    try {
      baseline = JSON.parse(
        fs.readFileSync(baselineFile, "utf-8")
      ) as ConfigOwnershipStats;
    } catch {
      // ignore parse error
    }
  }

  return {
    stats: currentStats,
    violations,
    baseline,
  };
}

// CLI runner
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const isUpdate = process.argv.includes("--update");
  const { stats, violations, baseline } = scanConfigOwnership();

  if (isUpdate) {
    const baselineFile = path.join(
      repoPath(),
      "scripts/config-ownership-baseline.json"
    );
    fs.writeFileSync(
      baselineFile,
      `${JSON.stringify(stats, null, 2)}\n`,
      "utf-8"
    );
    console.log("✓ Đã cập nhật scripts/config-ownership-baseline.json");
    process.exit(0);
  }

  let hasRegression = false;
  const regressionKeys: Array<keyof ConfigOwnershipStats> = [];

  for (const key of Object.keys(stats) as Array<keyof ConfigOwnershipStats>) {
    if (stats[key] > baseline[key]) {
      hasRegression = true;
      regressionKeys.push(key);
    }
  }

  if (hasRegression || violations.length > 0) {
    console.error("✗ Cổng check:config-ownership thất bại!");
    if (hasRegression) {
      console.error(
        `Nợ ratchet tăng vượt baseline ở các trục: ${regressionKeys
          .map((k) => `${String(k)} (${stats[k]} > ${baseline[k]})`)
          .join(", ")}`
      );
    }
    if (violations.length > 0) {
      console.error("\nChi tiết các vi phạm quy tắc sở hữu cấu hình:");
      for (const v of violations) {
        console.error(`  - [${v.rule}] ${v.target}: ${v.message}`);
      }
    }
    process.exit(1);
  }

  console.log("✓ check:config-ownership đạt chuẩn (7/7 trục khớp baseline)");
  process.exit(0);
}
