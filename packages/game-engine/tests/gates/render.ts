import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
const RAW_CANVAS_METHOD_REGEX =
  /\bctx\.(fillRect|arc|font|beginPath|strokeRect|clearRect)\b/;
const HARDCODED_COORD_DRAW_REGEX =
  /\b(drawClayBody|drawClayContainer|drawScaffoldingHighlight)\s*\(\s*[^,]+,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\b/;

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

  if (
    mustHaveRender &&
    !RENDER_METHOD_REGEX.test(content) &&
    !content.includes("render(")
  ) {
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

export function scanRenderGate(
  templatesDir: string,
  renderImplementedConfigPath?: string
): RenderGateResult {
  const violations: RenderLintViolation[] = [];

  if (!existsSync(templatesDir)) {
    return {
      activeCount: 0,
      implementedCount: 0,
      missingCount: 0,
      implementedCodes: [],
      violations: [
        {
          rule: "BR-ERC-01",
          message: `Templates directory does not exist: ${templatesDir}`,
        },
      ],
    };
  }

  let implementedCodes: string[] = [];
  if (renderImplementedConfigPath && existsSync(renderImplementedConfigPath)) {
    try {
      const raw = readFileSync(renderImplementedConfigPath, "utf-8");
      implementedCodes = JSON.parse(raw);
    } catch {
      violations.push({
        file: renderImplementedConfigPath,
        rule: "BR-ERC-01",
        message: `Failed to parse render implemented config: ${renderImplementedConfigPath}`,
      });
    }
  }

  const entries = readdirSync(templatesDir).filter((e) =>
    GT_CODE_REGEX.test(e)
  );
  entries.sort();

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
    const sessionFile = join(templatesDir, entry, "session.ts");
    const isImplemented = implementedSet.has(entry);
    violations.push(
      ...lintSingleSessionFile(entry, sessionFile, isImplemented)
    );
  }

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
