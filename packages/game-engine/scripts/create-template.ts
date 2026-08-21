#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

const GT_CODE_REGEX = /^GT-\d{3}$/;

function printUsage(): void {
  console.log(
    "Usage: tsx packages/game-engine/scripts/create-template.ts <GT-XXX> <name> <mechanic>"
  );
  console.log(
    "Example: tsx packages/game-engine/scripts/create-template.ts GT-007 'Tìm điểm khác biệt' spot-difference"
  );
}

const args = process.argv.slice(2);
if (args.length < 3) {
  printUsage();
  process.exit(1);
}

const [code, name, mechanic] = args as [string, string, string];

if (!GT_CODE_REGEX.test(code)) {
  console.error(`❌ Template code must match format ^GT-\\d{3}$, got: ${code}`);
  process.exit(1);
}

const rootDir = REPO_ROOT;
const templateDir = resolve(
  rootDir,
  "packages",
  "game-engine",
  "src",
  "templates",
  code
);

if (existsSync(templateDir)) {
  console.error(`❌ Template directory already exists: ${templateDir}`);
  process.exit(1);
}

mkdirSync(templateDir, { recursive: true });

const codeNum = code.replace("-", "");

const templateContent = `import { z } from "zod";
import { promptFields } from "../../contracts/shared-fields.js";
import { defineTemplate, STANDARD_SCORING } from "../../contracts/types.js";

export const ${codeNum}ContentSchema = z.object({
  ...promptFields(),
  items: z.array(z.object({
    item_id: z.string(),
    is_correct: z.boolean(),
  })).min(2).max(8),
});

export const ${codeNum}DifficultySchema = z.object({
  hint_after_ms: z.number().int().min(5000).max(30_000),
  allow_retry: z.boolean(),
});

export type ${codeNum}Content = z.infer<typeof ${codeNum}ContentSchema>;
export type ${codeNum}Difficulty = z.infer<typeof ${codeNum}DifficultySchema>;

export default defineTemplate({
  code: "${code}",
  name: "${name}",
  mechanic: "${mechanic}",
  layouts: ["grid", "flex-wrap"],
  content_contract: ${codeNum}ContentSchema,
  difficulty_contract: ${codeNum}DifficultySchema,
  limits: {
    item_count: [2, 8],
    distractor_count: [1, 4],
    target_count: [1, 4],
  },
  age_min: 4,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: ["game_started", "item_selected", "game_completed"],
  engine_session: "${codeNum}Session",
  status: "draft",
  version: 1,
});

`;

const sessionContent = `import type { ${codeNum}Content, ${codeNum}Difficulty } from "./template.js";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";

export class ${codeNum}Session extends TemplateGameSession<
  ${codeNum}Content,
  ${codeNum}Difficulty
> {
  setupEntities(): void {
    this.isWon = false;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type !== "tap_item") {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  checkWinCondition(): boolean {
    return this.isWon;
  }
}

export default ${codeNum}Session;
`;

const fixturesContent = `import type { ${codeNum}Content, ${codeNum}Difficulty } from "./template.js";

export const ${codeNum}_FIXTURES: {
  content: ${codeNum}Content;
  difficulty: ${codeNum}Difficulty;
}[] = [
  {
    content: {
      prompt: "Sample level 1",
      items: [
        { item_id: "i1", is_correct: true },
        { item_id: "i2", is_correct: false },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Sample level 2",
      items: [
        { item_id: "i1", is_correct: true },
        { item_id: "i2", is_correct: false },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Sample level 3",
      items: [
        { item_id: "i1", is_correct: true },
        { item_id: "i2", is_correct: false },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
];
`;

const testContent = `import { describe, expect, it } from "vitest";
import { ${codeNum}Session } from "./session.js";
import { ${codeNum}_FIXTURES } from "./fixtures.js";

describe("${code} Session", () => {
  it("initializes entities properly", () => {
    const session = new ${codeNum}Session(
      ${codeNum}_FIXTURES[0]!.content,
      ${codeNum}_FIXTURES[0]!.difficulty
    );
    session.setupEntities();
    expect(session.checkWinCondition()).toBe(false);
  });
});
`;

writeFileSync(join(templateDir, "template.ts"), templateContent, "utf8");
writeFileSync(join(templateDir, "session.ts"), sessionContent, "utf8");
writeFileSync(join(templateDir, "fixtures.ts"), fixturesContent, "utf8");
writeFileSync(join(templateDir, "session.test.ts"), testContent, "utf8");

console.log(
  `✅ [create:template] Created skeleton for ${code} in ${templateDir}`
);
console.log(
  "ℹ️  Note: Newly created template is not automatically registered. Run `pnpm gen:templates` once ready (BR-TAK-09)."
);
