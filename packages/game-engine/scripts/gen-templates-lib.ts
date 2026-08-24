import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface DiscoveredTemplate {
  readonly code: string;
  readonly dirPath: string;
  readonly templateFile: string;
  readonly sessionFile: string;
  readonly fixturesFile: string;
}

export interface GenerationResult {
  readonly templates: readonly DiscoveredTemplate[];
  readonly files: ReadonlyMap<string, string>;
}

export const GENERATED_BANNER =
  "/** @generated from TEMPLATES@a1b2c3d4 — DO NOT EDIT MANUALLY (BR-TAK-03) */\n\n";

const GT_CODE_REGEX = /^GT-\d{3}$/;

/**
 * Scan templates directory and discover valid GT-* template folders.
 */
export function discoverTemplates(templatesDir: string): DiscoveredTemplate[] {
  if (!existsSync(templatesDir)) {
    return [];
  }

  const entries = readdirSync(templatesDir);
  const discovered: DiscoveredTemplate[] = [];

  for (const entry of entries) {
    if (!GT_CODE_REGEX.test(entry)) {
      continue;
    }
    const dirPath = join(templatesDir, entry);
    if (!statSync(dirPath).isDirectory()) {
      continue;
    }

    const templateFile = join(dirPath, "template.ts");
    const sessionFile = join(dirPath, "session.ts");
    const fixturesFile = join(dirPath, "fixtures.ts");

    if (existsSync(templateFile) && existsSync(sessionFile)) {
      discovered.push({
        code: entry,
        dirPath,
        templateFile,
        sessionFile,
        fixturesFile,
      });
    }
  }

  return discovered.sort((a, b) => a.code.localeCompare(b.code));
}

export function generateTemplateRegistryCode(
  templates: readonly DiscoveredTemplate[]
): string {
  const imports: string[] = [
    'import { zodToJsonSchema } from "zod-to-json-schema";',
    'import type { AgeBand, GameTemplate } from "#src/contracts/types";',
  ];

  for (const t of templates) {
    const importName = `${t.code.replace("-", "")}Template`;
    imports.push(
      `import ${importName} from "#src/templates/${t.code}/template";`
    );
  }

  const entries = templates
    .map((t) => `  "${t.code}": ${t.code.replace("-", "")}Template,`)
    .join("\n");

  return `${GENERATED_BANNER + imports.join("\n")}\n\nexport const ALL_TEMPLATES: Record<string, GameTemplate> = {\n${entries}\n};\n\nexport const MVP_TEMPLATES = ALL_TEMPLATES;\n\nexport function getGameTemplate(code: string): GameTemplate | undefined {
  return ALL_TEMPLATES[code];
}

export function exportTemplateContracts(code: string) {
  const template = getGameTemplate(code);
  if (!template) {
    throw new Error(\`TEMPLATE_NOT_SUPPORTED: Template \${code} not found\`);
  }
  return {
    code: template.code,
    content_contract_json_schema: zodToJsonSchema(template.content_contract, {
      name: \`\${code.replace("-", "")}Content\`,
    }),
    difficulty_contract_json_schema: zodToJsonSchema(
      template.difficulty_contract,
      {
        name: \`\${code.replace("-", "")}Difficulty\`,
      }
    ),
    limits: template.limits,
    ui_hints: {
      mechanic: template.mechanic,
      layouts: template.layouts,
      requires_tap_fallback: template.requires_tap_fallback,
    },
  };
}

export function validateContentPack(code: string, contentPack: unknown) {
  const template = getGameTemplate(code);
  if (!template) {
    return {
      success: false,
      error: {
        code: "TEMPLATE_NOT_SUPPORTED",
        message: \`Template \${code} is not supported\`,
      },
    };
  }

  const result = template.content_contract.safeParse(contentPack);
  if (!result.success) {
    return {
      success: false,
      error: {
        code: "CONTENT_PACK_INVALID",
        message: \`Content pack invalid for \${code}\`,
        details: {
          issues: result.error.issues,
        },
      },
    };
  }

  return { success: true, data: result.data };
}

export function validateAgeBandForTemplate(
  template: GameTemplate,
  targetAge: number
): boolean {
  if (targetAge < template.age_min || targetAge > template.age_max) {
    return false;
  }
  if (template.banned_age_bands) {
    let ageBand: AgeBand = "5-6";
    if (targetAge <= 3) {
      ageBand = "3-4";
    } else if (targetAge <= 4) {
      ageBand = "4-5";
    }
    if (template.banned_age_bands.includes(ageBand)) {
      return false;
    }
  }
  return true;
}
`;
}

export function generateTemplateExportsCode(
  templates: readonly DiscoveredTemplate[]
): string {
  const imports: string[] = [];
  const exports: string[] = [];

  for (const t of templates) {
    const codeNum = t.code.replace("-", "");
    imports.push(
      `import ${codeNum}Template, { type ${codeNum}Content, type ${codeNum}Difficulty } from "#src/templates/${t.code}/template";`
    );
    imports.push(
      `import { ${codeNum}Session } from "#src/templates/${t.code}/session";`
    );
    exports.push(
      `export { ${codeNum}Template, ${codeNum}Session, type ${codeNum}Content, type ${codeNum}Difficulty };`
    );
  }

  return `${GENERATED_BANNER + imports.join("\n")}\n\n${exports.join("\n")}\n`;
}

export function generateSessionLoaderCode(
  templates: readonly DiscoveredTemplate[]
): string {
  const switchBranches = templates
    .map((t) => {
      const codeNum = t.code.replace("-", "");
      return `    case "${t.code}": {
      const mod = await import("#src/templates/${t.code}/session");
      return mod.${codeNum}Session;
    }`;
    })
    .join("\n");

  const syncImports = templates
    .map(
      (t) =>
        `import { ${t.code.replace("-", "")}Session } from "#src/templates/${t.code}/session";`
    )
    .join("\n");

  const syncCases = templates
    .map(
      (t) => `    case "${t.code}":
      return Reflect.construct(${t.code.replace("-", "")}Session, [cfg.content_pack, cfg.difficulty_params]);`
    )
    .join("\n");

  return `${GENERATED_BANNER}import type { EngineConfig } from "#src/core";
import type { GameSession } from "#src/game-session";
${syncImports}

/**
 * Dynamic lazy loader for GameSession classes by template code (BR-TAK-08).
 * Ensures play surfaces only download the code for the active game template.
 */
export async function loadGameSession(templateCode: string): Promise<new (...args: any[]) => GameSession> {
  switch (templateCode) {
${switchBranches}
    default:
      throw new Error(\`TEMPLATE_NOT_SUPPORTED: \${templateCode}\`);
  }
}

/**
 * Synchronous session creator using preloaded session classes.
 */
export function createGameSessionSync(templateCode: string, cfg: EngineConfig): GameSession {
  switch (templateCode) {
${syncCases}
    default:
      throw new Error(\`TEMPLATE_NOT_SUPPORTED: \${templateCode}\`);
  }
}
`;
}

export function generateTemplateCodesCode(
  templates: readonly DiscoveredTemplate[]
): string {
  const codes = templates.map((t) => `  "${t.code}",`).join("\n");

  return `${GENERATED_BANNER}export const ALL_TEMPLATE_CODES = [
${codes}
] as const;

export type TemplateCode = (typeof ALL_TEMPLATE_CODES)[number];

export const CUSTOM_GAME_TEMPLATE_CODES = ALL_TEMPLATE_CODES;
`;
}

export function generateTemplateSeedCode(
  templates: readonly DiscoveredTemplate[]
): string {
  const imports: string[] = [];
  for (const t of templates) {
    const varName = `${t.code.replace("-", "")}Template`;
    imports.push(`import ${varName} from "#src/templates/${t.code}/template";`);
  }

  const entries = templates
    .map((t) => {
      const varName = `${t.code.replace("-", "")}Template`;
      return `  {
    templateCode: ${varName}.code,
    nameVi: ${varName}.name,
    mechanic: ${varName}.mechanic,
    layouts: ${varName}.layouts,
    limits: ${varName}.limits,
    ageMin: ${varName}.age_min,
    ageMax: ${varName}.age_max,
    bannedAgeBands: ${varName}.banned_age_bands ?? [],
    requiresTapFallback: ${varName}.requires_tap_fallback,
    assetKinds: ${varName}.asset_kinds,
    scoring: ${varName}.scoring,
    events: ${varName}.events,
    engineSession: ${varName}.engine_session,
    status: ${varName}.status,
    version: ${varName}.version,
  },`;
    })
    .join("\n");

  return `${GENERATED_BANNER + imports.join("\n")}\n\nexport const TEMPLATE_SEED_ENTRIES = [\n${entries}\n];\n`;
}

export function generateStudioOptionsCode(
  templates: readonly DiscoveredTemplate[]
): string {
  const imports: string[] = [];
  for (const t of templates) {
    const varName = `${t.code.replace("-", "")}Template`;
    imports.push(`import ${varName} from "#src/templates/${t.code}/template";`);
  }

  const entries = templates
    .map((t) => {
      const varName = `${t.code.replace("-", "")}Template`;
      return `  {
    value: ${varName}.code,
    label: \`\${${varName}.code}: \${${varName}.name}\`,
    mechanic: ${varName}.mechanic,
    ageRange: \`\${${varName}.age_min}-\${${varName}.age_max}\`,
  },`;
    })
    .join("\n");

  return `${GENERATED_BANNER + imports.join("\n")}\n\nexport const STUDIO_TEMPLATE_OPTIONS = [\n${entries}\n];\n`;
}

export function generateAllTemplateArtifacts(
  gameEngineDir: string
): Map<string, string> {
  const templatesDir = join(gameEngineDir, "src", "templates");
  const generatedDir = join(gameEngineDir, "src", "generated");
  const templates = discoverTemplates(templatesDir);

  const files = new Map<string, string>();
  files.set(
    join(generatedDir, "template-registry.ts"),
    generateTemplateRegistryCode(templates)
  );
  files.set(
    join(generatedDir, "template-exports.ts"),
    generateTemplateExportsCode(templates)
  );
  files.set(
    join(generatedDir, "session-loader.ts"),
    generateSessionLoaderCode(templates)
  );
  files.set(
    join(generatedDir, "template-codes.ts"),
    generateTemplateCodesCode(templates)
  );
  files.set(
    join(generatedDir, "template-seed.ts"),
    generateTemplateSeedCode(templates)
  );
  files.set(
    join(generatedDir, "studio-options.ts"),
    generateStudioOptionsCode(templates)
  );

  return files;
}
