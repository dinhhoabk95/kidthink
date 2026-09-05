import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export interface RenderLintViolation {
  readonly templateCode?: string;
  readonly file?: string;
  readonly rule: string;
  readonly message: string;
}

export interface RenderGateResult {
  readonly activeCount: number;
  readonly implementedCount: number;
  readonly missingCount: number;
  readonly implementedCodes: readonly string[];
  readonly violations: readonly RenderLintViolation[];
}

const GT_CODE_REGEX = /^GT-\d{3}$/;
const RENDER_METHOD_REGEX =
  /\brender\s*\(\s*ctx\s*:\s*CanvasRenderingContext2D/m;
/**
 * Mọi lối vẽ thô trên context, không chỉ sáu tên cũ. `ctx.` theo sau bất kỳ
 * phương thức Canvas2D nào đều là vi phạm trong file engine.
 */
const RAW_CANVAS_METHOD_REGEX =
  /\bctx\.(fillRect|fillText|strokeRect|strokeText|clearRect|arc|arcTo|ellipse|rect|roundRect|beginPath|closePath|moveTo|lineTo|quadraticCurveTo|bezierCurveTo|fill|stroke|clip|drawImage|putImageData|setLineDash|createLinearGradient|createRadialGradient|createPattern)\b/;

/**
 * Toạ độ cứng trong lời gọi vẽ — **bất kỳ** hàm `draw*` nào nhận hai số liền
 * nhau ở vị trí x, y, chứ không phải danh sách ba tên như bản trước.
 *
 * Bản cũ chỉ khớp `drawClayBody|drawClayContainer|drawScaffoldingHighlight`.
 * Khi thư viện nguyên thuỷ đổi sang `drawSlotItem`/`drawGlyphInSlot`/…, không
 * tên nào trong ba tên đó còn tồn tại, nên `BR-ERC-03` khớp **0 dòng** trong
 * repo thật — luật còn trong mã nhưng không đo gì.
 */
const HARDCODED_COORD_DRAW_REGEX =
  /\b(?:rs\.)?draw[A-Z]\w*\s*\(\s*ctx\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\b/;

/**
 * Thư viện nguyên thuỷ dùng chung — chỗ **được phép** chạm `ctx` trực tiếp.
 *
 * Danh sách này là ngoại lệ **tường minh và có ca âm**. Không có nó, `BR-ERC-05`
 * bị đi vòng bằng cách dời lời gọi `ctx.*` sang một file cạnh bên: cổng chỉ quét
 * `session.ts` nên một `shared-render.ts` chứa toàn bộ lời gọi thô vẫn xanh.
 * Giờ cổng quét **mọi** file trong `templates/`, và chỉ hai file dưới đây được
 * miễn — thêm file vào đây là một quyết định phải review, không phải mặc định.
 */
const PRIMITIVE_MODULES: readonly string[] = [
  "systems/render-system.ts",
  "render/shared-render.ts",
  "render/shared-render-shapes.ts",
];

function checkSessionDrawLines(
  templateCode: string,
  sessionFile: string,
  lines: string[]
): RenderLintViolation[] {
  const violations: RenderLintViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? "";
    if (
      line.startsWith("//") ||
      line.startsWith("*") ||
      line.startsWith("/*")
    ) {
      continue;
    }

    const rawMatch = RAW_CANVAS_METHOD_REGEX.exec(line);
    if (rawMatch) {
      violations.push({
        templateCode,
        file: sessionFile,
        rule: "BR-ERC-05",
        message: `Direct canvas drawing method "${rawMatch[0]}" called on line ${i + 1}. Must use RenderSystem primitives.`,
      });
    }

    const coordMatch = HARDCODED_COORD_DRAW_REGEX.exec(line);
    if (coordMatch) {
      violations.push({
        templateCode,
        file: sessionFile,
        rule: "BR-ERC-03",
        message: `Hardcoded coordinate literal in draw call "${coordMatch[0]}" on line ${i + 1}. Coordinates must come from layout slots.`,
      });
    }
  }

  return violations;
}

export function lintSingleSessionFile(
  templateCode: string,
  sessionFile: string,
  mustHaveRender: boolean
): RenderLintViolation[] {
  const violations: RenderLintViolation[] = [];

  if (!existsSync(sessionFile)) {
    if (mustHaveRender) {
      violations.push({
        templateCode,
        file: sessionFile,
        rule: "BR-ERC-01",
        message: `Template ${templateCode} is marked as implemented in render-implemented.json but session.ts does not exist`,
      });
    }
    return violations;
  }

  const content = readFileSync(sessionFile, "utf-8");

  // ❌ NEVER thêm lại nhánh `content.includes("render(")`: nó nhận mọi chuỗi
  // chứa `render(` — kể cả `this.renderSystem.render(` hay một comment — nên
  // phép kiểm "có render()" thoả bằng chuỗi con thay vì bằng chữ ký thật.
  if (mustHaveRender && !RENDER_METHOD_REGEX.test(content)) {
    violations.push({
      templateCode,
      file: sessionFile,
      rule: "BR-ERC-01",
      message: `Template ${templateCode} is marked as implemented in render-implemented.json but Session class has no render() method`,
    });
  }

  const lines = content.split("\n");
  violations.push(...checkSessionDrawLines(templateCode, sessionFile, lines));

  return violations;
}

/**
 * File phụ trong `templates/` — không cần có `render()`, nhưng vẫn cấm chạm
 * `ctx` thô và cấm toạ độ cứng trong lời gọi vẽ.
 */
export function lintAuxiliaryFile(
  templateCode: string | undefined,
  file: string
): RenderLintViolation[] {
  if (!existsSync(file)) {
    return [];
  }
  const lines = readFileSync(file, "utf-8").split("\n");
  return checkSessionDrawLines(templateCode ?? "", file, lines);
}

function loadImplementedCodes(
  renderImplementedConfigPath: string | undefined,
  violations: RenderLintViolation[]
): string[] {
  if (
    !(renderImplementedConfigPath && existsSync(renderImplementedConfigPath))
  ) {
    return [];
  }
  try {
    const raw = readFileSync(renderImplementedConfigPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    violations.push({
      file: renderImplementedConfigPath,
      rule: "BR-ERC-01",
      message: `Failed to parse render implemented config: ${renderImplementedConfigPath}`,
    });
    return [];
  }
}

function lintTemplateDirectory(
  templatesDir: string,
  entry: string,
  isImplemented: boolean
): RenderLintViolation[] {
  const violations: RenderLintViolation[] = [];
  const sessionFile = join(templatesDir, entry, "session.ts");
  violations.push(...lintSingleSessionFile(entry, sessionFile, isImplemented));

  for (const sibling of readdirSync(join(templatesDir, entry))) {
    if (sibling.endsWith(".ts") && sibling !== "session.ts") {
      violations.push(
        ...lintAuxiliaryFile(entry, join(templatesDir, entry, sibling))
      );
    }
  }
  return violations;
}

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function lintNonTemplateFiles(
  srcDir: string,
  templatesDir: string
): RenderLintViolation[] {
  const violations: RenderLintViolation[] = [];
  const allFiles = collectTsFiles(srcDir);

  for (const file of allFiles) {
    const relToSrc = relative(srcDir, file).replace(/\\/g, "/");
    const relToTemplates = relative(templatesDir, file).replace(/\\/g, "/");

    if (
      relToTemplates.startsWith("GT-") ||
      relToSrc.startsWith("templates/GT-")
    ) {
      continue;
    }

    if (
      PRIMITIVE_MODULES.includes(relToSrc) ||
      PRIMITIVE_MODULES.includes(relToTemplates)
    ) {
      continue;
    }

    violations.push(...lintAuxiliaryFile(undefined, file));
  }

  return violations;
}

export function scanRenderGate(
  srcOrTemplatesDir: string,
  renderImplementedConfigPath?: string
): RenderGateResult {
  const violations: RenderLintViolation[] = [];

  if (!existsSync(srcOrTemplatesDir)) {
    return {
      activeCount: 0,
      implementedCount: 0,
      missingCount: 0,
      implementedCodes: [],
      violations: [
        {
          rule: "BR-ERC-01",
          message: `Templates directory does not exist: ${srcOrTemplatesDir}`,
        },
      ],
    };
  }

  const templatesDir = existsSync(join(srcOrTemplatesDir, "templates"))
    ? join(srcOrTemplatesDir, "templates")
    : srcOrTemplatesDir;

  const implementedCodes = loadImplementedCodes(
    renderImplementedConfigPath,
    violations
  );

  const entries = readdirSync(templatesDir)
    .filter((e) => GT_CODE_REGEX.test(e))
    .sort();

  if (entries.length === 0) {
    violations.push({
      rule: "BR-ERC-01",
      message: `No active templates found in ${templatesDir}`,
    });
  }

  const implementedSet = new Set(implementedCodes);

  for (const code of implementedCodes) {
    if (!entries.includes(code)) {
      violations.push({
        templateCode: code,
        rule: "BR-ERC-01",
        message: `Template ${code} in render-implemented.json does not exist in ${templatesDir}`,
      });
    }
  }

  for (const entry of entries) {
    const isImplemented = implementedSet.has(entry);
    violations.push(
      ...lintTemplateDirectory(templatesDir, entry, isImplemented)
    );
  }

  violations.push(...lintNonTemplateFiles(srcOrTemplatesDir, templatesDir));

  const activeCount = entries.length;
  const implementedCount = implementedCodes.length;
  const missingCount = Math.max(0, activeCount - implementedCount);

  return {
    activeCount,
    implementedCount,
    missingCount,
    implementedCodes,
    violations,
  };
}

export function formatRenderReport(result: RenderGateResult): string {
  const lines: string[] = [
    `${result.activeCount} engine active, ${result.implementedCount} cài render, ${result.missingCount} thiếu`,
  ];

  for (const v of result.violations) {
    const target = v.templateCode ? `${v.templateCode}: ` : "";
    lines.push(`  ${target}${v.message} [${v.rule}]`);
  }

  return lines.join("\n");
}
