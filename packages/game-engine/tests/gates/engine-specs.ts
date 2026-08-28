import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface EngineSpecViolation {
  readonly templateCode?: string;
  readonly file?: string;
  readonly rule: string;
  readonly message: string;
}

export interface EngineSpecGateResult {
  readonly totalTemplates: number;
  readonly totalSpecs: number;
  readonly readyCount: number;
  readonly readyCodes: readonly string[];
  readonly violations: readonly EngineSpecViolation[];
}

const GT_CODE_REGEX = /^GT-\d{3}$/;
const SPEC_FILE_REGEX = /^GT-\d{3}\.md$/;
const MD_EXTENSION_REGEX = /\.md$/;
const ZOD_OBJECT_REGEX = /z\.object\s*\(/;
const SKILL_REF_REGEX = /\bskill_id\b|\bcompetency_id\b/;
const SECTION_12_REGEX = /##\s*12\.\s*Hợp đồng vẽ/i;
const SECTION_13_REGEX = /##\s*13\.\s*Ma trận seed/i;
const SECTION_14_REGEX = /##\s*14\.\s*Ca sai/i;
const QUOTE_WRAPPER_REGEX = /^["'](.*)["']$/;

const BATCH_OWNED_TERMS = [
  "vòng lặp",
  "vòng lặp game engine",
  "hạ tầng vẽ",
  "cơ chế tính điểm chuẩn",
  "game-template-contract",
  "bốn lớp vẽ",
];

const REQUIRED_FRONTMATTER_FIELDS = [
  "spec",
  "title",
  "area",
  "status",
  "mvp",
  "phase",
  "reviewed",
  "owns",
  "depends_on",
];

function cleanValue(val: string): unknown {
  if (val === "" || val === "[]") {
    return val === "[]" ? [] : "";
  }
  if (val === "true") {
    return true;
  }
  if (val === "false") {
    return false;
  }
  return val.replace(QUOTE_WRAPPER_REGEX, "$1");
}

export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  if (!content.startsWith("---")) {
    return { frontmatter: {}, body: content };
  }

  const endIndex = content.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const rawYaml = content.slice(3, endIndex).trim();
  const body = content.slice(endIndex + 4).trim();
  const frontmatter: Record<string, unknown> = {};

  const lines = rawYaml.split("\n");
  let currentKey = "";
  let currentArray: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed.startsWith("- ") && currentKey) {
      if (!currentArray) {
        currentArray = [];
        frontmatter[currentKey] = currentArray;
      }
      currentArray.push(trimmed.slice(2).trim());
      continue;
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      currentKey = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim();
      currentArray = null;
      frontmatter[currentKey] = cleanValue(val);
    }
  }

  return { frontmatter, body };
}

function checkBasicInvariants(
  templateCode: string,
  specPath: string,
  content: string
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];

  if (ZOD_OBJECT_REGEX.test(content)) {
    violations.push({
      templateCode,
      file: specPath,
      rule: "BR-ESS-03",
      message:
        "Spec contains z.object schema definition. Schema must live in template.ts, not spec.",
    });
  }

  if (SKILL_REF_REGEX.test(content)) {
    violations.push({
      templateCode,
      file: specPath,
      rule: "BR-ESS-04",
      message:
        "Spec contains skill_id or competency_id reference. Template specs must not bind to skills.",
    });
  }

  return violations;
}

function checkOwnsAndDependsOn(
  templateCode: string,
  specPath: string,
  frontmatter: Record<string, unknown>
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];
  const owns = frontmatter.owns;

  if (!Array.isArray(owns) || owns.length === 0) {
    violations.push({
      templateCode,
      file: specPath,
      rule: "BR-ESS-11",
      message:
        'Frontmatter "owns" must be a non-empty list of owned responsibilities.',
    });
  } else {
    for (const item of owns) {
      const lower = String(item).toLowerCase();
      for (const term of BATCH_OWNED_TERMS) {
        if (lower.includes(term)) {
          violations.push({
            templateCode,
            file: specPath,
            rule: "BR-ESS-14",
            message: `Frontmatter owns contains "${item}" which overlaps with batch spec responsibilities.`,
          });
        }
      }
    }
  }

  const dependsOn = frontmatter.depends_on;
  if (!Array.isArray(dependsOn) || dependsOn.length === 0) {
    violations.push({
      templateCode,
      file: specPath,
      rule: "BR-ESS-11",
      message: 'Frontmatter "depends_on" must be a non-empty list.',
    });
  }

  return violations;
}

function checkFrontmatterFields(
  templateCode: string,
  specPath: string,
  frontmatter: Record<string, unknown>
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];

  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (frontmatter[field] === undefined || frontmatter[field] === "") {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-11",
        message: `Missing or empty required frontmatter field: ${field}`,
      });
    }
  }

  violations.push(
    ...checkOwnsAndDependsOn(templateCode, specPath, frontmatter)
  );
  return violations;
}

function checkBusinessRules(
  templateCode: string,
  specPath: string,
  body: string
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];
  const numPart = templateCode.slice(3);
  const expectedRulePrefix = `BR-E${numPart}-`;
  const ruleRegex = new RegExp(`\\b${expectedRulePrefix}\\d+\\b`, "g");
  const brMatches = body.match(ruleRegex) || [];

  if (brMatches.length === 0) {
    violations.push({
      templateCode,
      file: specPath,
      rule: "BR-ESS-12",
      message: `Section 6 must contain at least one business rule with prefix ${expectedRulePrefix}`,
    });
    return violations;
  }

  const uniqueRules = Array.from(new Set(brMatches));
  for (const rule of uniqueRules) {
    const scenarioRegex = new RegExp(`Scenario:.*${rule}`);
    const hasScenario =
      body.includes(`Scenario: ${rule}`) || scenarioRegex.test(body);
    if (!(body.includes(rule) && hasScenario)) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-13",
        message: `Business rule ${rule} does not have a corresponding Gherkin Scenario in Section 9.`,
      });
    }
  }

  return violations;
}

function checkSectionsAndMatrix(
  templateCode: string,
  specPath: string,
  body: string
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];

  if (!SECTION_12_REGEX.test(body)) {
    violations.push({
      templateCode,
      file: specPath,
      rule: "BR-ESS-10",
      message: "Spec is missing Section 12: Hợp đồng vẽ.",
    });
  }

  if (SECTION_13_REGEX.test(body)) {
    const section13 = body.slice(body.indexOf("13."));
    const endSection13 = section13.indexOf("## 14.");
    const section13Content =
      endSection13 === -1 ? section13 : section13.slice(0, endSection13);
    if (section13Content.includes("đa dạng")) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-05",
        message:
          'Section 13 seed matrix contains generic text "đa dạng" instead of specific numeric target.',
      });
    }
  } else {
    violations.push({
      templateCode,
      file: specPath,
      rule: "BR-ESS-05",
      message: "Spec is missing Section 13: Ma trận seed mục tiêu.",
    });
  }

  if (!SECTION_14_REGEX.test(body)) {
    violations.push({
      templateCode,
      file: specPath,
      rule: "BR-ESS-06",
      message: "Spec is missing Section 14: Ca sai không bắt được bằng schema.",
    });
  }

  return violations;
}

function checkLimits(
  templateCode: string,
  specPath: string,
  body: string,
  expectedLimits?: Record<string, [number, number]>
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];
  if (!expectedLimits) {
    return violations;
  }

  for (const [limitKey, expectedVal] of Object.entries(expectedLimits)) {
    const limitRegex = new RegExp(`\`${limitKey}\`\\s*\\[(\\d+),\\s*(\\d+)\\]`);
    const match = limitRegex.exec(body);
    if (match?.[1] && match[2]) {
      const actualMin = Number(match[1]);
      const actualMax = Number(match[2]);
      if (actualMin !== expectedVal[0] || actualMax !== expectedVal[1]) {
        violations.push({
          templateCode,
          file: specPath,
          rule: "BR-ESS-02",
          message: `limits.${limitKey} spec ghi [${actualMin}, ${actualMax}], registry [${expectedVal[0]}, ${expectedVal[1]}]   LỆCH`,
        });
      }
    }
  }

  return violations;
}

export function lintSingleEngineSpec(
  templateCode: string,
  specPath: string,
  isReady: boolean,
  expectedLimits?: Record<string, [number, number]>
): EngineSpecViolation[] {
  if (!existsSync(specPath)) {
    return [
      {
        templateCode,
        file: specPath,
        rule: "BR-ESS-01",
        message: `Spec file does not exist for template ${templateCode}: ${specPath}`,
      },
    ];
  }

  const content = readFileSync(specPath, "utf-8");
  const violations = checkBasicInvariants(templateCode, specPath, content);

  if (!isReady) {
    return violations;
  }

  const { frontmatter, body } = parseFrontmatter(content);
  violations.push(
    ...checkFrontmatterFields(templateCode, specPath, frontmatter)
  );
  violations.push(...checkBusinessRules(templateCode, specPath, body));
  violations.push(...checkSectionsAndMatrix(templateCode, specPath, body));
  violations.push(...checkLimits(templateCode, specPath, body, expectedLimits));

  return violations;
}

export function scanEngineSpecsGate(
  specsDir: string,
  templatesDir: string,
  readyConfigPath?: string
): EngineSpecGateResult {
  const violations: EngineSpecViolation[] = [];

  if (!existsSync(specsDir)) {
    return {
      totalTemplates: 0,
      totalSpecs: 0,
      readyCount: 0,
      readyCodes: [],
      violations: [
        {
          rule: "BR-ESS-01",
          message: `Engine specs directory does not exist: ${specsDir}`,
        },
      ],
    };
  }

  if (!existsSync(templatesDir)) {
    return {
      totalTemplates: 0,
      totalSpecs: 0,
      readyCount: 0,
      readyCodes: [],
      violations: [
        {
          rule: "BR-ESS-01",
          message: `Templates directory does not exist: ${templatesDir}`,
        },
      ],
    };
  }

  let readyCodes: string[] = [];
  if (readyConfigPath && existsSync(readyConfigPath)) {
    try {
      const raw = readFileSync(readyConfigPath, "utf-8");
      readyCodes = JSON.parse(raw);
    } catch {
      violations.push({
        file: readyConfigPath,
        rule: "BR-ESS-01",
        message: `Failed to parse engine-spec-ready config: ${readyConfigPath}`,
      });
    }
  }

  const readySet = new Set(readyCodes);

  const templateEntries = readdirSync(templatesDir).filter((e) =>
    GT_CODE_REGEX.test(e)
  );
  templateEntries.sort();

  const specFiles = readdirSync(specsDir).filter((f) =>
    SPEC_FILE_REGEX.test(f)
  );
  specFiles.sort();
  const specCodes = specFiles.map((f) => f.replace(MD_EXTENSION_REGEX, ""));

  for (const templateCode of templateEntries) {
    if (!specCodes.includes(templateCode)) {
      violations.push({
        templateCode,
        rule: "BR-ESS-01",
        message: `Template ${templateCode} is in registry but missing spec in ${specsDir}`,
      });
    }
  }

  for (const specCode of specCodes) {
    if (!templateEntries.includes(specCode)) {
      violations.push({
        templateCode: specCode,
        file: join(specsDir, `${specCode}.md`),
        rule: "BR-ESS-01",
        message: `Spec ${specCode}.md exists but ${specCode} is not in templates registry (orphan spec).`,
      });
    }
  }

  for (const specCode of specCodes) {
    const specPath = join(specsDir, `${specCode}.md`);
    const isReady = readySet.has(specCode);
    violations.push(...lintSingleEngineSpec(specCode, specPath, isReady));
  }

  return {
    totalTemplates: templateEntries.length,
    totalSpecs: specCodes.length,
    readyCount: readyCodes.length,
    readyCodes,
    violations,
  };
}

export function formatEngineSpecsReport(result: EngineSpecGateResult): string {
  const lines: string[] = [
    `${result.totalTemplates} mã trong registry, ${result.totalSpecs} spec tồn tại, 0 mồ côi`,
    `Bậc thang engine-spec-ready.json: ${result.readyCount} spec sẵn sàng`,
  ];

  for (const v of result.violations) {
    const target = v.templateCode ? `${v.templateCode}: ` : "";
    lines.push(`  ${target}${v.message} [${v.rule}]`);
  }

  return lines.join("\n");
}
