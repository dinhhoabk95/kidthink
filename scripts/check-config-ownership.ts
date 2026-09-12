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

const RAW_UNION_REGEX = /["']3-4["']\s*\|\s*["']4-5["']\s*\|\s*["']5-6["']/;
const RAW_ARRAY_REGEX =
  /\[\s*["']3-4["']\s*,\s*["']4-5["']\s*,\s*["']5-6["']\s*\]/;
// `[{ id: "3-4" }, { id: "4-5" }, { id: "5-6" }]` — cùng bộ band, bọc trong object.
// Chỉ tính khi trọn bộ band nằm trong MỘT mảng: `[{ id: "3-4" }, … "5-6" }]`.
// `case "3-4":` hay `return "3-4"` là tiêu thụ union, không phải khai báo bộ.
const RAW_OBJECT_LIST_REGEX =
  /\[[\s\S]{0,200}?["']3-4["'][\s\S]{0,200}?["']4-5["'][\s\S]{0,200}?["']5-6["'][\s\S]{0,200}?\]/;
/** Import thật từ nguồn chuẩn — khác hẳn việc chỉ có chuỗi "AGE_BANDS" đâu đó. */
const AGE_BANDS_IMPORT_REGEX =
  /import[\s\S]{0,300}?from\s+["'][^"']*(?:age-bands(?:\.js)?|@mindkid\/shared(?:\/[a-z-]+)?)["']/;

/**
 * Hằng số có đúng MỘT chủ sở hữu. Mọi khai báo khác trong `packages/` hoặc
 * `apps/` là vi phạm `BR-CFO-01`.
 *
 * Bản cũ chỉ đọc hai đường dẫn đóng cứng (`packages/storage/src/index.ts` và
 * `packages/shared/src/ai-assistant.ts`), nên khai lại hằng ở package thứ BA
 * đi qua cổng im lặng — đúng thứ luật này tồn tại để chặn.
 */
const OWNED_CONSTANTS: ReadonlyArray<{ name: string; owner: string }> = [
  {
    name: "PROOF_SIGNED_URL_TTL_MINUTES",
    owner: "packages/config/src/constants.ts",
  },
  { name: "DEFAULT_EMBEDDING_DIMENSION", owner: "packages/shared/src/ai.ts" },
];

/**
 * Sàn chạm `BR-A11-04`. Chủ sở hữu duy nhất là `packages/shared/src/touch-floors.ts`;
 * `packages/ui` re-export lại, `game-engine` import.
 *
 * Bản cũ chỉ tìm ĐỊNH DANH `MIN_TOUCH_PX` trong đúng một file, nên một file mới
 * khai `{ kidPrimary: 96, kidSecondary: 76, adult: 64 }` không bị thấy.
 */
const TOUCH_FLOOR_OWNER = "packages/shared/src/touch-floors.ts";
const TOUCH_FLOOR_VALUES = [96, 76, 64] as const;

const CSS_TOKENS_PATH = "packages/ui/assets/css/tailwind.css";
const TS_TOKENS_PATH = "packages/game-engine/src/systems/designTokens.ts";
const NUXT_CONFIG_PATH = "packages/ui/nuxt.config.ts";
const LOW_MASTERY_LITERAL_REGEX = /p_learn\s*<\s*0\.4\b/;
const HIGH_MASTERY_LITERAL_REGEX = /p_learn\s*>=\s*0\.8\b/;
const ENGINE_GATES_NAME_REGEX = /name:\s*engine-gates[\s\S]*?glob:/m;
const BLIND_SPOT_REGEX = /Điểm mù|điểm mù/;
const PUBLIC_CONFIG_REGEX = /runtimeConfig\s*:\s*\{[\s\S]*?public\s*:\s*\{/;
const LINE_COMMENT_REGEX = /\/\/.*$/;
const COLORS_BLOCK_OPENER_REGEX = /colors\s*[:=]\s*\{/;
const FONTS_BLOCK_OPENER_REGEX = /fonts\s*[:=]\s*\{/;
const COMMENT_PREFIX_REGEX = /^#+\s?/;
const TOUCH_DECL_REGEX =
  /(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_]*(?:touch|floor)[A-Za-z0-9_]*)\s*[:=]([^;]{0,400})/gi;
const ASSIGNMENT_TOUCH_REGEX =
  /\b[A-Za-z0-9_]*(?:min|floor|touch|target)[A-Za-z0-9_]*\s*=\s*(\d{2,3})\b/gi;

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

const SOURCE_SKIP_DIRS = new Set([
  "node_modules",
  ".nuxt",
  ".output",
  ".git",
  "dist",
  "coverage",
  "tests",
]);

/** Duyệt mọi `.ts` / `.vue` thật của repo (bỏ test, build output, node_modules). */
function* walkSourceFiles(dirPath: string): Generator<string> {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!SOURCE_SKIP_DIRS.has(entry.name)) {
        yield* walkSourceFiles(fullPath);
      }
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".vue")) &&
      !(entry.name.includes(".test.") || entry.name.includes(".spec."))
    ) {
      yield fullPath;
    }
  }
}

function* walkRepoSources(root: string): Generator<string> {
  yield* walkSourceFiles(path.join(root, "packages"));
  yield* walkSourceFiles(path.join(root, "apps"));
}

function buildDeclarationRegex(name: string): RegExp {
  return new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${name}\\s*[:=]`);
}

function checkDuplicateConstantValues(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 0;

  for (const { name, owner } of OWNED_CONSTANTS) {
    const declRegex = buildDeclarationRegex(name);
    for (const fullPath of walkRepoSources(root)) {
      const relPath = path.relative(root, fullPath);
      if (relPath === owner) {
        continue;
      }
      if (declRegex.test(fs.readFileSync(fullPath, "utf-8"))) {
        count++;
        violations.push({
          rule: "BR-CFO-01",
          target: relPath,
          message: `Khai báo lại ${name} thay vì import từ ${owner}`,
        });
      }
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

/** Bỏ chú thích `//`, `/* *\/` và `<!-- -->` trước khi đo khai báo. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .map((line) => line.replace(LINE_COMMENT_REGEX, ""))
    .join("\n");
}

function checkAgeBandFile(
  fullPath: string,
  root: string,
  violations: ConfigViolation[]
): boolean {
  if (isExcludedPath(fullPath)) {
    return false;
  }
  const rawContent = fs.readFileSync(fullPath, "utf-8");
  // Cấm — NEVER miễn trừ theo `content.includes("AGE_BANDS")`: một file đặt tên
  // hằng là `INDEXABLE_AGE_BANDS` rồi chép nguyên bộ band vẫn là khai báo thứ hai.
  // Một file DẪN XUẤT từ nguồn (có import thật) được phép nhắc tên band; một
  // file chép nguyên bộ mà không import là khai báo thứ hai.
  if (AGE_BANDS_IMPORT_REGEX.test(rawContent)) {
    return false;
  }
  // Bộ band nêu trong chú thích là tài liệu, không phải khai báo.
  const content = stripComments(rawContent);
  const hasRawUnion = RAW_UNION_REGEX.test(content);
  const hasRawArray = RAW_ARRAY_REGEX.test(content);
  const hasObjectWrapped = RAW_OBJECT_LIST_REGEX.test(content);

  if (hasRawUnion || hasRawArray || hasObjectWrapped) {
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

function extractTouchFloorLiterals(content: string): Set<number> {
  const literalsFound = new Set<number>();
  for (const m of content.matchAll(TOUCH_DECL_REGEX)) {
    for (const value of TOUCH_FLOOR_VALUES) {
      if (new RegExp(`\\b${value}\\b`).test(m[2] ?? "")) {
        literalsFound.add(value);
      }
    }
  }
  for (const m of content.matchAll(ASSIGNMENT_TOUCH_REGEX)) {
    const value = Number(m[1]);
    if ((TOUCH_FLOOR_VALUES as readonly number[]).includes(value)) {
      literalsFound.add(value);
    }
  }
  return literalsFound;
}

function checkTouchFloorDeclarations(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 0;

  for (const fullPath of walkRepoSources(root)) {
    const relPath = path.relative(root, fullPath);
    if (relPath === TOUCH_FLOOR_OWNER) {
      count++;
      continue;
    }

    const literalsFound = extractTouchFloorLiterals(
      fs.readFileSync(fullPath, "utf-8")
    );
    if (literalsFound.size >= 2) {
      count++;
      violations.push({
        rule: "BR-CFO-07",
        target: relPath,
        message: `Khai báo lại sàn chạm (${[...literalsFound].sort((a, b) => b - a).join(", ")}) thay vì dùng TOUCH_FLOORS từ @mindkid/shared`,
      });
    }
  }

  return count;
}

/**
 * Sàn chạm viết dưới dạng lớp Tailwind (`min-h-19` = 19 × 4px = 76px) là cùng
 * một con số, chỉ khác đơn vị — phép đếm theo số nguyên không thấy nó.
 */
function checkTailwindTouchFloorClasses(
  root: string,
  violations: ConfigViolation[]
): void {
  const appConfigPath = path.join(root, "packages/ui/app.config.ts");
  if (!fs.existsSync(appConfigPath)) {
    return;
  }
  const content = fs.readFileSync(appConfigPath, "utf-8");
  if (content.includes("TOUCH_FLOORS")) {
    return;
  }
  for (const m of content.matchAll(/min-h-(\d{1,2})\b/g)) {
    const px = Number(m[1]) * 4;
    if ((TOUCH_FLOOR_VALUES as readonly number[]).includes(px)) {
      violations.push({
        rule: "BR-CFO-07",
        target: "packages/ui/app.config.ts",
        message: `Lớp min-h-${m[1]} là sàn chạm ${px}px viết tay; phải sinh từ TOUCH_FLOORS`,
      });
    }
  }
}

/** `--color-surface-500: #78716c;` → `surface-500 => #78716c` */
function parseCssTokens(css: string): {
  colors: Map<string, string>;
  fonts: Map<string, string>;
} {
  const colors = new Map<string, string>();
  const fonts = new Map<string, string>();
  for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    colors.set(m[1] as string, (m[2] as string).trim().toLowerCase());
  }
  for (const m of css.matchAll(/--font-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    fonts.set(m[1] as string, normalizeFontStack(m[2] as string));
  }
  return { colors, fonts };
}

/** `surface: { 500: "#78716c" }` → `surface-500 => #78716c` */
function parseTsTokens(ts: string): {
  colors: Map<string, string>;
  fonts: Map<string, string>;
} {
  const colors = new Map<string, string>();
  const fonts = new Map<string, string>();

  const colorsBlock = extractBalancedBlock(ts, COLORS_BLOCK_OPENER_REGEX);
  if (colorsBlock) {
    for (const familyMatch of colorsBlock.matchAll(
      /([A-Za-z][A-Za-z0-9_]*)\s*:\s*\{([^}]*)\}/g
    )) {
      const family = familyMatch[1] as string;
      for (const stepMatch of (familyMatch[2] as string).matchAll(
        /["']?([A-Za-z0-9_]+)["']?\s*:\s*["'](#[0-9a-fA-F]{3,8})["']/g
      )) {
        colors.set(
          `${family}-${stepMatch[1]}`,
          (stepMatch[2] as string).toLowerCase()
        );
      }
    }
  }

  const fontsBlock = extractBalancedBlock(ts, FONTS_BLOCK_OPENER_REGEX);
  if (fontsBlock) {
    for (const m of fontsBlock.matchAll(
      /([A-Za-z][A-Za-z0-9_]*)\s*:\s*(['"`])([\s\S]*?)\2\s*,/g
    )) {
      fonts.set(m[1] as string, normalizeFontStack(m[3] as string));
    }
  }

  return { colors, fonts };
}

function extractBalancedBlock(source: string, opener: RegExp): string | null {
  const match = source.match(opener);
  if (match?.index === undefined) {
    return null;
  }
  const start = source.indexOf("{", match.index);
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === "{") {
      depth++;
    } else if (source[i] === "}") {
      depth--;
      if (depth === 0) {
        return source.slice(start + 1, i);
      }
    }
  }
  return null;
}

function normalizeFontStack(raw: string): string {
  return raw.replace(/["']/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * `BR-CFO-08` / `BR-DSC-24` — đối chiếu HAI CHIỀU giữa hai nguồn token.
 *
 * Bản cũ chỉ tìm ba chuỗi lịch sử (`#827660`, `Quicksand`, `Fredoka`) trong
 * `designTokens.ts` và Cấm — NEVER mở `tailwind.css`, nên mọi lệch MỚI đi qua
 * im lặng. Ở đây so từng bậc trùng tên của hai file và nêu cả hai giá trị.
 */
function checkTokenSources(
  root: string,
  violations: ConfigViolation[]
): number {
  const cssPath = path.join(root, CSS_TOKENS_PATH);
  const tsPath = path.join(root, TS_TOKENS_PATH);
  if (!(fs.existsSync(cssPath) && fs.existsSync(tsPath))) {
    return 1;
  }

  const css = parseCssTokens(fs.readFileSync(cssPath, "utf-8"));
  const ts = parseTsTokens(fs.readFileSync(tsPath, "utf-8"));
  let drift = 0;

  for (const [key, tsValue] of ts.colors) {
    const cssValue = css.colors.get(key);
    if (cssValue !== undefined && cssValue !== tsValue) {
      drift++;
      violations.push({
        rule: "BR-CFO-08",
        target: `${TS_TOKENS_PATH} :: ${key}`,
        message: `Token ${key} lệch giữa hai nguồn: tailwind.css=${cssValue} vs designTokens.ts=${tsValue}`,
      });
    }
  }

  for (const [key, tsStack] of ts.fonts) {
    const cssStack = css.fonts.get(key);
    if (cssStack !== undefined && cssStack !== tsStack) {
      drift++;
      violations.push({
        rule: "BR-CFO-08",
        target: `${TS_TOKENS_PATH} :: font-${key}`,
        message: `Họ phông ${key} lệch: tailwind.css="${cssStack}" vs designTokens.ts="${tsStack}"`,
      });
    }
  }

  drift += checkFontsAreLoaded(root, ts.fonts, violations);

  return drift > 0 ? 2 : 1;
}

/** Phông khai mà app không nạp → canvas rơi fallback im lặng, chữ vẫn hiện. */
function checkFontsAreLoaded(
  root: string,
  tsFonts: Map<string, string>,
  violations: ConfigViolation[]
): number {
  const nuxtConfigPath = path.join(root, NUXT_CONFIG_PATH);
  if (!fs.existsSync(nuxtConfigPath)) {
    return 0;
  }
  const nuxtConfig = fs.readFileSync(nuxtConfigPath, "utf-8").toLowerCase();

  const GENERIC_FAMILIES = new Set([
    "sans-serif",
    "serif",
    "cursive",
    "monospace",
    "system-ui",
    "-apple-system",
    "blinkmacsystemfont",
    "segoe ui",
    "roboto",
    "helvetica neue",
    "arial",
  ]);

  let missing = 0;
  for (const stack of tsFonts.values()) {
    for (const family of stack.split(",").map((f) => f.trim())) {
      if (family.length === 0 || GENERIC_FAMILIES.has(family)) {
        continue;
      }
      if (!nuxtConfig.includes(family)) {
        missing++;
        violations.push({
          rule: "BR-CFO-08",
          target: TS_TOKENS_PATH,
          message: `Phông "${family}" khai trong designTokens.ts nhưng không được nạp ở ${NUXT_CONFIG_PATH}`,
        });
      }
    }
  }
  return missing;
}

function isSpecialCheckScript(name: string): boolean {
  return (
    name.endsWith(":update") ||
    name === "check:fast" ||
    name === "check:ratchets" ||
    name === "check:engine-gates"
  );
}

/**
 * `check:engine-behavior` là TIỀN TỐ của `check:engine-behavior-corpus`.
 * `String.includes` nên coi cổng thứ nhất là đã nối khi chỉ cổng thứ hai được
 * gọi — cổng mồ côi thật lọt qua. Chặn bằng ranh giới bên phải.
 */
function hasCallSite(haystack: string, scriptName: string): boolean {
  const escaped = scriptName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Phải là lời GỌI thật. `echo "✗ check:foo failed"` nhắc đúng tên cổng nhưng
  // không chạy nó — bản cũ tính dòng đó là call site, nên gỡ lời gọi mà vẫn xanh.
  return new RegExp(
    `(?:pnpm|npm|yarn)\\s+(?:run\\s+)?(?:--filter\\s+\\S+\\s+)?${escaped}(?![A-Za-z0-9:_-])`
  ).test(haystack);
}

/** Tên cổng nằm trong một dòng comment KHÔNG phải call site. */
function stripCommentLines(content: string, marker: string): string {
  return content
    .split("\n")
    .filter((line) => !line.trim().startsWith(marker))
    .join("\n");
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
  const checkShLive = stripCommentLines(checkShContent, "#");
  const lefthookLive = stripCommentLines(lefthookContent, "#");

  for (const scriptName of Object.keys(scripts)) {
    if (!scriptName.startsWith("check:") || isSpecialCheckScript(scriptName)) {
      continue;
    }

    const scriptCmd = scripts[scriptName] ?? "";
    const inCheckSh =
      hasCallSite(checkShLive, scriptName) ||
      (scriptCmd.length > 0 && checkShLive.includes(scriptCmd));
    const inLefthook =
      hasCallSite(lefthookLive, scriptName) ||
      (scriptCmd.length > 0 && lefthookLive.includes(scriptCmd));

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

const GATE_FILES_FOR_COMMENT_SCAN = [
  { path: "lefthook.yml", kind: "yaml" as const },
  { path: "scripts/check.sh", kind: "shell" as const },
];

const SHELL_COMMAND_REGEX = /^(?:pnpm|npm|npx|bash|sh|node|tsx|yarn)\s/;
const SHELL_CONTROL_REGEX = /^(?:if\s|fi\b|else\b|elif\s|exit\s|then\b|done\b)/;
const YAML_GATE_REGEX =
  /^(?:-\s+name:|jobs:|run:|(?:pre-commit|pre-push|post-merge|post-checkout):)/;
const MIN_COMMENTED_SHELL_LINES = 5;
const MIN_COMMENTED_YAML_LINES = 3;

/**
 * `BR-CFO-11` — một khối cổng bị comment là cổng đã tắt mà vẫn trông như còn.
 *
 * Bản cũ chỉ khớp đúng chuỗi `# pre-push:` trong `lefthook.yml`, nên khối
 * `Phase 4` bị comment trong `scripts/check.sh` Cấm — NEVER bị thấy. Ở đây quét
 * cả hai file cổng và nhận diện theo HÌNH DẠNG.
 *
 * Ngưỡng khác nhau theo loại file có lý do: trong YAML, một dải comment chứa
 * `jobs:` hay `- name:` là cổng bị tắt, không thể là văn xuôi. Trong shell thì
 * `# bash scripts/check.sh --fast` là dòng HƯỚNG DẪN hợp lệ ở đầu file, nên
 * phải đòi thêm cấu trúc điều khiển (`if` / `fi` / `exit`) mới tính.
 */
function isCommentedGateCommand(body: string, kind: "yaml" | "shell"): boolean {
  return kind === "yaml"
    ? YAML_GATE_REGEX.test(body)
    : SHELL_COMMAND_REGEX.test(body);
}

interface CommentBlockState {
  blockStart: number;
  hasCommand: boolean;
  hasControl: boolean;
}

function updateCommentBlock(
  state: CommentBlockState,
  body: string,
  lineIndex: number,
  kind: "yaml" | "shell"
): void {
  if (state.blockStart < 0) {
    state.blockStart = lineIndex;
  }
  if (isCommentedGateCommand(body, kind)) {
    state.hasCommand = true;
  }
  if (SHELL_CONTROL_REGEX.test(body)) {
    state.hasControl = true;
  }
}

function isGateBlock(
  state: CommentBlockState,
  kind: "yaml" | "shell"
): boolean {
  return kind === "yaml"
    ? state.hasCommand
    : state.hasCommand && state.hasControl;
}

function flushCommentedBlock(
  relPath: string,
  blockStart: number,
  endIndex: number,
  minLines: number,
  looksLikeGate: boolean,
  violations: ConfigViolation[]
): number {
  if (blockStart >= 0 && looksLikeGate && endIndex - blockStart >= minLines) {
    violations.push({
      rule: "BR-CFO-11",
      target: `${relPath}:${blockStart + 1}-${endIndex}`,
      message: `Khối cổng bị comment (${endIndex - blockStart} dòng) — bật lại hoặc xoá hẳn, Cấm — NEVER để treo`,
    });
    return 1;
  }
  return 0;
}

function scanCommentedBlocksInFile(
  fullPath: string,
  relPath: string,
  kind: "yaml" | "shell",
  violations: ConfigViolation[]
): number {
  if (!fs.existsSync(fullPath)) {
    return 0;
  }
  const lines = fs.readFileSync(fullPath, "utf-8").split("\n");
  const minLines =
    kind === "yaml" ? MIN_COMMENTED_YAML_LINES : MIN_COMMENTED_SHELL_LINES;

  let count = 0;
  const state: CommentBlockState = {
    blockStart: -1,
    hasCommand: false,
    hasControl: false,
  };

  const resetState = (): void => {
    state.blockStart = -1;
    state.hasCommand = false;
    state.hasControl = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = (lines[i] ?? "").trim();
    if (raw.startsWith("#")) {
      const body = raw.replace(COMMENT_PREFIX_REGEX, "").trim();
      updateCommentBlock(state, body, i, kind);
    } else if (raw.length > 0) {
      count += flushCommentedBlock(
        relPath,
        state.blockStart,
        i,
        minLines,
        isGateBlock(state, kind),
        violations
      );
      resetState();
    }
  }

  count += flushCommentedBlock(
    relPath,
    state.blockStart,
    lines.length,
    minLines,
    isGateBlock(state, kind),
    violations
  );

  return count;
}

function checkCommentedLefthookBlocks(
  root: string,
  violations: ConfigViolation[]
): number {
  let count = 0;
  for (const { path: relPath, kind } of GATE_FILES_FOR_COMMENT_SCAN) {
    count += scanCommentedBlocksInFile(
      path.join(root, relPath),
      relPath,
      kind,
      violations
    );
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

  checkTailwindTouchFloorClasses(root, violations);

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
