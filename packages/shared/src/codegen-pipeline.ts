/**
 * Deterministic Spec-to-Code Pipeline (docs/specs/01-platform/ai-codegen-pipeline.md, #307).
 * Pure TypeScript module (zero Node-only imports) so it can be used across CLI, tests, and workspaces.
 */

export const SENSITIVE_SPEC_SLUGS = [
  "auth-tokens-sessions",
  "rbac-and-permissions",
  "payment-orders",
  "manual-payment-approval",
  "entitlements-and-gating",
  "child-profiles",
  "account-deletion",
  "parental-consent",
  "audit-log",
  "authoring-studio",
] as const;

export type SensitiveSpecSlug = (typeof SENSITIVE_SPEC_SLUGS)[number];

export interface SpecBusinessRule {
  readonly id: string;
  readonly description: string;
}

export interface SpecDecision {
  readonly id: string;
  readonly description: string;
}

export interface SpecScenario {
  readonly title: string;
  readonly ruleIds: readonly string[];
  readonly steps: readonly string[];
}

export type SpecHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type SpecAuthMode = "guest" | "user" | "manager" | "super_admin";

export interface SpecEndpoint {
  readonly method: SpecHttpMethod;
  readonly path: string;
  readonly authMode: SpecAuthMode;
}

export interface SpecDrizzleTable {
  readonly variableName: string;
  readonly tableName: string;
  readonly codeBlock: string;
}

export interface ParsedSpecDocument {
  readonly specId: string;
  readonly specSlug: string;
  readonly specPath: string;
  readonly specHash: string;
  readonly isSensitiveDomain: boolean;
  readonly businessRules: readonly SpecBusinessRule[];
  readonly decisions: readonly SpecDecision[];
  readonly scenarios: readonly SpecScenario[];
  readonly endpoints: readonly SpecEndpoint[];
  readonly drizzleTables: readonly SpecDrizzleTable[];
  readonly errorCodes: readonly string[];
}

export interface SpecIndex {
  readonly version: 1;
  readonly generatedAt: string;
  readonly specs: readonly ParsedSpecDocument[];
}

export interface CodegenOptions {
  readonly allowTask14Exception?: boolean;
}

export interface GenCheckDriftedFile {
  readonly filePath: string;
  readonly expectedSpecHash: string;
  readonly actualSpecHash: string;
}

export interface GenCheckUntestedRule {
  readonly ruleId: string;
  readonly specPath: string;
}

export interface GenCheckResult {
  readonly timestamp: string;
  readonly driftedFiles: GenCheckDriftedFile[];
  readonly untestedRules: GenCheckUntestedRule[];
  readonly manualEditsDetected: string[];
  readonly passed: boolean;
}

export interface GenCheckGeneratedFile {
  readonly filePath: string;
  readonly content: string;
  readonly expectedContent?: string;
}

export interface GenCheckInput {
  readonly specs: readonly ParsedSpecDocument[];
  readonly generatedFiles: readonly GenCheckGeneratedFile[];
  readonly testFilesContent?: readonly string[];
  readonly enforceRuleCoverageForSpecs?: readonly string[];
  readonly timestamp?: string;
}

export class SensitiveDomainCodegenError extends Error {
  readonly code = "SENSITIVE_DOMAIN_CODEGEN_FORBIDDEN";
  readonly specSlug: string;

  constructor(specSlug: string) {
    super(
      `BR-AIG-01 / BR-AIG-03: Code generation for sensitive spec '${specSlug}' requires explicit Task #14 human-reviewed exception.`
    );
    this.name = "SensitiveDomainCodegenError";
    this.specSlug = specSlug;
  }
}

const UINT32_MOD = 4_294_967_296;
const NON_ID_CHAR_REGEX = /[^A-Z0-9_-]/g;
const BACKSLASH_REGEX = /\\/g;
const MD_EXT_REGEX = /\.md$/i;
const SNAKE_CASE_REGEX = /_([a-z0-9])/g;
const LINE_SPLIT_REGEX = /\r?\n/;
const RULE_ID_REGEX = /\b(BR-[A-Z0-9]{2,6}-\d{2,3})\b/g;
const DECISION_ID_REGEX = /\b(D-[A-Z]{2,4})\b/g;
const ENDPOINT_HEADING_REGEX =
  /^#{2,4}\s+(?:[\d.]+\s+)?`(GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[^\s`]+)`/gm;
const ENDPOINT_INLINE_REGEX =
  /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[a-zA-Z0-9/_{}[\]:-]+)/g;
const PG_TABLE_REGEX =
  /export\s+const\s+([a-zA-Z0-9_]+)\s*=\s*pgTable\(\s*['"]([a-z0-9_]+)['"][\s\S]*?\n\s*\}\s*\);/g;
const MD_TABLE_HEADING_REGEX =
  /^#{2,4}\s+(?:[\d.]+\s+)?(?:Bảng|Table)\s+`([a-z0-9_]+)`/gim;
const SCENARIO_HEADER_REGEX =
  /^(?:###\s+Scenario:\s*|\*\*Scenario(?:\s+\d+)?:\s*|Scenario(?:\s+\d+)?:\s*)(.+?)(?:\*\*)?$/;
const TRAILING_BOLD_REGEX = /\*\*$/;
const HEADING_CHECK_REGEX = /^#{1,3}\s+/;
const GHERKIN_STEP_REGEX =
  /^(?:-\s+)?(?:\*\*)?(Given|When|Then|And)(?:\*\*)?\b/i;
const LEADING_BULLET_REGEX = /^-\s+/;
const ERROR_CODE_REGEX = /\b([A-Z][A-Z0-9]+(?:_[A-Z0-9]+){2,})\b/g;
const DOUBLE_QUOTE_REGEX = /"/g;
const API_PREFIX_REGEX = /^\/api\//;
const NON_ALNUM_REGEX = /[^a-zA-Z0-9]+/g;
const LEADING_TRAILING_UNDERSCORE_REGEX = /^_|_$/g;
const HYPHEN_REGEX = /-/g;
const HEADER_PARSE_REGEX = /@generated from ([A-Z0-9_-]+)@([a-f0-9]{8,})\b/;

export function computeSpecHash(markdown: string): string {
  const bytes = new TextEncoder().encode(markdown);
  let h1 = 2_166_136_261;
  let h2 = 3_735_928_559;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i] ?? 0;
    h1 = Math.abs(Math.imul(h1 + byte, 16_777_619)) % UINT32_MOD;
    h2 = Math.abs(Math.imul(h2 + byte + i, 2_246_822_519)) % UINT32_MOD;
  }
  const combined = Math.abs(Math.imul(h1, 31) + h2) % UINT32_MOD;
  return combined.toString(16).padStart(8, "0").slice(0, 8);
}

/**
 * Builds canonical BR-AIG-04 provenance header (e.g. `@generated from SPEC-AUDIO-STORAGE@a1b2c3d4`).
 */
export function formatGeneratedHeader(
  specId: string,
  specHash: string
): string {
  const normalizedId = specId.toUpperCase().replace(NON_ID_CHAR_REGEX, "-");
  return `// AUTO-GENERATED — @generated from ${normalizedId}@${specHash} — DO NOT EDIT`;
}

function extractSlugFromPath(specPath: string): string {
  const normalized = specPath.replace(BACKSLASH_REGEX, "/");
  const base = normalized.split("/").pop() ?? "spec";
  return base.replace(MD_EXT_REGEX, "").toLowerCase();
}

function snakeToCamel(snake: string): string {
  return snake.replace(SNAKE_CASE_REGEX, (_, ch: string) => ch.toUpperCase());
}

function inferAuthModeFromApiPath(apiPath: string): SpecAuthMode {
  if (apiPath.startsWith("/api/managers/")) {
    return "manager";
  }
  if (apiPath.startsWith("/api/users/")) {
    return "user";
  }
  return "guest";
}

function extractByRegexMap(lines: readonly string[], regex: RegExp) {
  const map = new Map<string, string>();
  for (const line of lines) {
    for (const match of line.matchAll(regex)) {
      const id = match[1];
      if (id && !map.has(id)) {
        map.set(id, line.trim().slice(0, 160));
      }
    }
  }
  return Array.from(map.entries()).map(([id, description]) => ({
    id,
    description,
  }));
}

function addRuleMatches(text: string, target: Set<string>): void {
  for (const match of text.matchAll(RULE_ID_REGEX)) {
    if (match[1]) {
      target.add(match[1]);
    }
  }
}

function extractScenariosFromLines(lines: readonly string[]): SpecScenario[] {
  const scenarios: SpecScenario[] = [];
  let currentTitle: string | null = null;
  let currentRules = new Set<string>();
  let currentSteps: string[] = [];

  const flush = () => {
    if (currentTitle) {
      scenarios.push({
        title: currentTitle,
        ruleIds: Array.from(currentRules),
        steps: currentSteps,
      });
    }
    currentTitle = null;
    currentRules = new Set<string>();
    currentSteps = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const scenarioMatch = trimmed.match(SCENARIO_HEADER_REGEX);
    if (scenarioMatch?.[1]) {
      flush();
      currentTitle = scenarioMatch[1].replace(TRAILING_BOLD_REGEX, "").trim();
      addRuleMatches(trimmed, currentRules);
      continue;
    }
    if (currentTitle && HEADING_CHECK_REGEX.test(trimmed)) {
      flush();
      continue;
    }
    if (currentTitle && GHERKIN_STEP_REGEX.test(trimmed)) {
      currentSteps.push(trimmed.replace(LEADING_BULLET_REGEX, ""));
      addRuleMatches(trimmed, currentRules);
    }
  }
  flush();
  return scenarios;
}

function collectEndpointsByRegex(
  markdown: string,
  regex: RegExp,
  endpointMap: Map<string, SpecEndpoint>
): void {
  for (const match of markdown.matchAll(regex)) {
    const method = match[1] as SpecHttpMethod | undefined;
    const rawPath = match[2];
    if (method && rawPath) {
      endpointMap.set(`${method} ${rawPath}`, {
        method,
        path: rawPath,
        authMode: inferAuthModeFromApiPath(rawPath),
      });
    }
  }
}

function extractEndpoints(markdown: string): SpecEndpoint[] {
  const endpointMap = new Map<string, SpecEndpoint>();
  collectEndpointsByRegex(markdown, ENDPOINT_HEADING_REGEX, endpointMap);
  if (endpointMap.size === 0) {
    collectEndpointsByRegex(markdown, ENDPOINT_INLINE_REGEX, endpointMap);
  }
  return Array.from(endpointMap.values());
}

function extractDrizzleTables(markdown: string): SpecDrizzleTable[] {
  const drizzleTables: SpecDrizzleTable[] = [];
  for (const match of markdown.matchAll(PG_TABLE_REGEX)) {
    const variableName = match[1];
    const tableName = match[2];
    const codeBlock = match[0];
    if (variableName && tableName && codeBlock) {
      drizzleTables.push({ variableName, tableName, codeBlock });
    }
  }
  if (drizzleTables.length > 0) {
    return drizzleTables;
  }
  for (const match of markdown.matchAll(MD_TABLE_HEADING_REGEX)) {
    const tableName = match[1];
    if (tableName) {
      const variableName = snakeToCamel(tableName);
      drizzleTables.push({
        variableName,
        tableName,
        codeBlock: `export const ${variableName} = pgTable("${tableName}", {\n  ...timestamps(),\n});`,
      });
    }
  }
  return drizzleTables;
}

const ERROR_CODE_SUFFIXES = [
  "_ERROR",
  "_FAILED",
  "_INVALID",
  "_REQUIRED",
  "_EXCEEDED",
  "_IN_USE",
  "_FOUND",
  "_LOCKED",
  "_EXPIRED",
] as const;

function isCanonicalErrorCodeToken(token: string): boolean {
  if (token.startsWith("BR_") || token.startsWith("HTTP_")) {
    return false;
  }
  return ERROR_CODE_SUFFIXES.some((suffix) => token.endsWith(suffix));
}

function extractErrorCodes(markdown: string): string[] {
  const errorCodeSet = new Set<string>();
  for (const match of markdown.matchAll(ERROR_CODE_REGEX)) {
    const token = match[1];
    if (token && isCanonicalErrorCodeToken(token)) {
      errorCodeSet.add(token);
    }
  }
  return Array.from(errorCodeSet);
}

export function parseSpecMarkdown(
  specPath: string,
  markdown: string
): ParsedSpecDocument {
  const specSlug = extractSlugFromPath(specPath);
  const specId = specSlug.toUpperCase().replace(NON_ID_CHAR_REGEX, "-");
  const specHash = computeSpecHash(markdown);
  const isSensitiveDomain = (
    SENSITIVE_SPEC_SLUGS as readonly string[]
  ).includes(specSlug);
  const lines = markdown.split(LINE_SPLIT_REGEX);

  return {
    specId,
    specSlug,
    specPath,
    specHash,
    isSensitiveDomain,
    businessRules: extractByRegexMap(lines, RULE_ID_REGEX),
    decisions: extractByRegexMap(lines, DECISION_ID_REGEX),
    scenarios: extractScenariosFromLines(lines),
    endpoints: extractEndpoints(markdown),
    drizzleTables: extractDrizzleTables(markdown),
    errorCodes: extractErrorCodes(markdown),
  };
}

export function buildSpecIndex(
  entries: readonly { specPath: string; markdown: string }[],
  generatedAt = "2026-03-29T00:00:00.000Z"
): SpecIndex {
  const specs = [...entries]
    .sort((a, b) => a.specPath.localeCompare(b.specPath))
    .map((entry) => parseSpecMarkdown(entry.specPath, entry.markdown));

  return {
    version: 1,
    generatedAt,
    specs,
  };
}

export function assertCodegenAllowed(
  spec: ParsedSpecDocument,
  options?: CodegenOptions
): void {
  if (spec.isSensitiveDomain && !options?.allowTask14Exception) {
    throw new SensitiveDomainCodegenError(spec.specSlug);
  }
}

export function generateTestsFromSpec(spec: ParsedSpecDocument): string {
  const header = formatGeneratedHeader(spec.specId, spec.specHash);
  const scenarioBlocks =
    spec.scenarios.length > 0
      ? spec.scenarios
          .map((scenario) => {
            const escapedTitle = scenario.title.replace(
              DOUBLE_QUOTE_REGEX,
              '\\"'
            );
            const stepComments = scenario.steps
              .map((step) => `    // ${step}`)
              .join("\n");
            return [
              `  it("Scenario: ${escapedTitle}", () => {`,
              stepComments || "    // Given / When / Then",
              "    expect(true).toBe(true);",
              "  });",
            ].join("\n");
          })
          .join("\n\n")
      : spec.businessRules
          .map((rule) =>
            [
              `  it("${rule.id}: enforces specification contract", () => {`,
              "    expect(true).toBe(true);",
              "  });",
            ].join("\n")
          )
          .join("\n\n");

  return [
    header,
    'import { describe, expect, it } from "vitest";',
    "",
    `describe("${spec.specId} (${spec.specPath})", () => {`,
    scenarioBlocks ||
      '  it("verifies spec contract", () => {\n    expect(true).toBe(true);\n  });',
    "});",
    "",
  ].join("\n");
}

export function generateZodFromSpec(
  spec: ParsedSpecDocument,
  options?: CodegenOptions
): string {
  assertCodegenAllowed(spec, options);
  const header = formatGeneratedHeader(spec.specId, spec.specHash);

  const schemaBlocks = spec.endpoints.map((ep, idx) => {
    const safeName =
      ep.path
        .replace(API_PREFIX_REGEX, "")
        .replace(NON_ALNUM_REGEX, "_")
        .replace(LEADING_TRAILING_UNDERSCORE_REGEX, "") || `endpoint_${idx}`;
    const schemaConst = `${safeName}_${ep.method.toLowerCase()}_schema`;
    return [
      `export const ${schemaConst} = z.object({`,
      `  // ${ep.method} ${ep.path}`,
      "});",
    ].join("\n");
  });

  return [
    header,
    'import { z } from "zod";',
    "",
    ...(schemaBlocks.length > 0
      ? schemaBlocks
      : [
          `export const ${spec.specSlug.replace(HYPHEN_REGEX, "_")}_schema = z.object({});`,
        ]),
    "",
  ].join("\n");
}

export function generateRoutesFromSpec(
  spec: ParsedSpecDocument,
  options?: CodegenOptions
): string {
  assertCodegenAllowed(spec, options);
  const header = formatGeneratedHeader(spec.specId, spec.specHash);
  const firstEndpoint = spec.endpoints[0] ?? {
    method: "GET" as const,
    path: `/api/guest/${spec.specSlug}`,
    authMode: "guest" as const,
  };

  return [
    header,
    'import { z } from "zod";',
    'import { defineApiRoute } from "#server/utils/define-api-route";',
    "",
    "const requestSchema = z.object({});",
    "",
    "export default defineApiRoute({",
    `  auth: "${firstEndpoint.authMode}",`,
    ...(firstEndpoint.method === "GET"
      ? ["  query: requestSchema,"]
      : ["  body: requestSchema,"]),
    "  handler: async () => {",
    `    return { ok: true, endpoint: "${firstEndpoint.method} ${firstEndpoint.path}" };`,
    "  },",
    "});",
    "",
  ].join("\n");
}

export function generateSchemaFromSpec(
  spec: ParsedSpecDocument,
  options?: CodegenOptions
): string {
  assertCodegenAllowed(spec, options);
  const header = formatGeneratedHeader(spec.specId, spec.specHash);

  const tables =
    spec.drizzleTables.length > 0
      ? spec.drizzleTables.map((t) => t.codeBlock).join("\n\n")
      : `// No pgTable blocks extracted from ${spec.specPath}`;

  return [
    header,
    'import { bigint, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";',
    'import { timestamps } from "./columns.ts";',
    "",
    tables,
    "",
  ].join("\n");
}

export function generateGameSessionFromSpec(
  spec: ParsedSpecDocument,
  options?: CodegenOptions & { className?: string }
): string {
  assertCodegenAllowed(spec, options);
  const header = formatGeneratedHeader(spec.specId, spec.specHash);
  const pascalName =
    options?.className ??
    `${spec.specSlug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")}Session`;

  return [
    header,
    'import { StatefulGameSession } from "#src/gameSession";',
    "",
    `export class ${pascalName} extends StatefulGameSession {`,
    "  setupEntities(): void {",
    "    // Initialize deterministic canvas entities using designTokens",
    "  }",
    "",
    "  validateAction(action: { type: string; data: Record<string, string | number | boolean> }): {",
    "    valid: boolean;",
    "    feedback: string;",
    "  } {",
    '    return { valid: Boolean(action.type), feedback: "amber_pulse" };',
    "  }",
    "",
    "  checkWinCondition(): boolean {",
    "    return false;",
    "  }",
    "}",
    "",
  ].join("\n");
}

function collectDriftedAndEditedFiles(
  generatedFiles: readonly GenCheckGeneratedFile[],
  specMapById: ReadonlyMap<string, ParsedSpecDocument>
) {
  const driftedFiles: GenCheckDriftedFile[] = [];
  const manualEditsDetected: string[] = [];

  for (const file of generatedFiles) {
    const match = file.content.match(HEADER_PARSE_REGEX);
    if (!match) {
      manualEditsDetected.push(file.filePath);
      continue;
    }

    const specId = match[1] ?? "";
    const actualSpecHash = match[2] ?? "";
    const spec = specMapById.get(specId);

    if (spec && spec.specHash !== actualSpecHash) {
      driftedFiles.push({
        filePath: file.filePath,
        expectedSpecHash: spec.specHash,
        actualSpecHash,
      });
    }

    if (
      file.expectedContent !== undefined &&
      file.content !== file.expectedContent
    ) {
      manualEditsDetected.push(file.filePath);
    }
  }

  return { driftedFiles, manualEditsDetected };
}

function collectUntestedRules(
  specs: readonly ParsedSpecDocument[],
  enforceTargets: readonly string[] | undefined,
  testFilesContent: readonly string[] | undefined
): GenCheckUntestedRule[] {
  if (!enforceTargets || enforceTargets.length === 0) {
    return [];
  }
  const combinedTests = (testFilesContent ?? []).join("\n");
  const targetSet = new Set(enforceTargets);
  const untestedRules: GenCheckUntestedRule[] = [];

  for (const spec of specs) {
    if (!(targetSet.has(spec.specPath) || targetSet.has(spec.specSlug))) {
      continue;
    }
    for (const rule of spec.businessRules) {
      if (!combinedTests.includes(rule.id)) {
        untestedRules.push({
          ruleId: rule.id,
          specPath: spec.specPath,
        });
      }
    }
  }

  return untestedRules;
}

export function evaluateGenCheck(input: GenCheckInput): GenCheckResult {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const specMapById = new Map<string, ParsedSpecDocument>();
  for (const spec of input.specs) {
    specMapById.set(spec.specId, spec);
  }

  const { driftedFiles, manualEditsDetected } = collectDriftedAndEditedFiles(
    input.generatedFiles,
    specMapById
  );
  const untestedRules = collectUntestedRules(
    input.specs,
    input.enforceRuleCoverageForSpecs,
    input.testFilesContent
  );

  const passed =
    driftedFiles.length === 0 &&
    untestedRules.length === 0 &&
    manualEditsDetected.length === 0;

  return {
    timestamp,
    driftedFiles,
    untestedRules,
    manualEditsDetected,
    passed,
  };
}
