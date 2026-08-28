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
import { promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

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

const sessionContent = `import type { CanvasRenderingContext2D } from "node:canvas";
import type { ${codeNum}Content, ${codeNum}Difficulty } from "./template.js";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { RenderSystem } from "#src/systems/render-system";

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

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem, _timeMs: number): void {
    const slots = this.slots;
    this.drawScene(ctx, rs);
    this.drawStatic(ctx, rs, slots);
    this.drawInteractive(ctx, rs, slots);
    this.drawFeedback(ctx, rs, slots, _timeMs);
  }

  private drawScene(_ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    rs.clear("cream");
  }

  private drawStatic(_ctx: CanvasRenderingContext2D, _rs: RenderSystem, _slots: unknown): void {}

  private drawInteractive(_ctx: CanvasRenderingContext2D, _rs: RenderSystem, _slots: unknown): void {}

  private drawFeedback(_ctx: CanvasRenderingContext2D, _rs: RenderSystem, _slots: unknown, _timeMs: number): void {}
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

const specFile = resolve(
  rootDir,
  "docs",
  "specs",
  "01-platform",
  "engines",
  `${code}.md`
);

const specContent = `---
spec: ENGINE-${code}
title: ${name} — cơ chế ${mechanic}
area: platform
status: draft
mvp: false
phase: P4
reviewed: ${new Date().toISOString().slice(0, 10)}
engine: ${mechanic}
batch: mvp
owns:
  - Hợp đồng nội dung của engine ${code}
  - Hợp đồng vẽ của engine ${code}
  - Ma trận seed mục tiêu của engine ${code}
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-LAYOUT-ENGINE
  - ENGINE-RENDER-CONTRACT
  - ENGINE-SPEC-SHEET
---

# ${code} — ${name}

## 1. Objective

<!-- Engine này dạy trẻ tiến trình tư duy nào, và khác engine gần nhất ở một điểm quyết định. -->

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | — | Trực tiếp tương tác theo cơ chế của engine |
| Người soạn nội dung | \`content_reviewer\` | Soạn \`content_pack\` và \`difficulty_params\` theo hợp đồng |
| Bộ sinh level | — | Sinh level tự động theo ma trận và tham số độ khó |
| Cổng | — | Kiểm tra tính hợp lệ của seed, contract và hợp đồng vẽ |

## 3. Entry points

- Thư mục engine: \`packages/game-engine/src/templates/${code}/\`
- \`content_contract\`: \`${codeNum}ContentSchema\`
- Layout: \`grid\` · \`flex-wrap\`
- File spec: \`docs/specs/01-platform/engines/${code}.md\`

## 4. Main flow

<!-- Một lượt chơi đúng: từ content_pack tới thắng. -->

## 5. Alternative flows

<!-- Sai, hết giờ, gợi ý, thiết bị yếu, asset hỏng. -->

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| \`BR-E${code.slice(3)}-01\` | <Luật nghiệp vụ riêng của engine> | <Lý do sư phạm hoặc kỹ thuật bắt buộc> |

## 7. Data

<!-- Hình dạng content_pack và difficulty_params, band hợp lệ, limits. -->
<!-- Cấm — NEVER chép lại toàn bộ Zod schema (BR-ESS-03). -->

## 8. API contract

Không có. Engine chạy trong tiến trình frontend/canvas runtime.

## 9. Acceptance criteria

\`\`\`gherkin
Scenario: BR-E${code.slice(3)}-01 — Hoàn thành màn chơi đúng
  Given level ${code} hợp lệ
  When trẻ thực hiện đúng yêu cầu
  Then checkWinCondition trả về true
\`\`\`

## 10. Boundaries

**Always**
- Tuân thủ hợp đồng vẽ 4 lớp và 5 trạng thái thị giác.

**Ask first**
- Thay đổi layouts hoặc limits của engine.

**Never**
- Vẽ tay thô bằng canvas API trực tiếp ngoài RenderSystem (BR-ERC-05).

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Câu hỏi mở của engine | Triển khai level | P4 | Backend |

## 12. Hợp đồng vẽ

Hợp đồng chung: [\`engine-render-contract.md\`](../engine-render-contract.md).

**Slot dùng:** \`grid\`

| Lớp | Engine này vẽ gì |
|---|---|
| 1. Nền cảnh | Nền phẳng theo token |
| 2. Phần tử tĩnh | Câu lệnh câu hỏi tĩnh |
| 3. Phần tử tương tác | Các phần tử thao tác vẽ bằng nguyên thuỷ của \`RenderSystem\` |
| 4. Lớp phản hồi | Hạt mừng khi đúng, rung nhẹ khi thử lại |

## 13. Ma trận seed mục tiêu

| Band | \`observe\` | \`count\` | Tổng mục tiêu |
|---|:--:|:--:|:--:|
| \`3-4\` | ≥1 | ≥1 | ≥2 |
| \`4-5\` | ≥1 | ≥1 | ≥2 |
| \`5-6\` | ≥1 | ≥1 | ≥2 |

Trục \`what\` mục tiêu: \`number\` · \`quantity\`
Trục \`theme\` mục tiêu: ≥3 giá trị khác nhau.

## 14. Ca sai không bắt được bằng schema

<!-- Ít nhất một trường hợp content_pack parse sạch Zod schema nhưng sai về mặt sư phạm cho band tuổi. -->

## 15. Trường trích từ registry

Trích từ [\`${code}/template.ts\`](${code}/template.ts).

| Trường | Giá trị |
|---|---|
| \`mechanic\` | \`${mechanic}\` |
| \`layouts\` | \`grid\` · \`flex-wrap\` |
| \`age_min\` · \`age_max\` | \`4\` · \`6\` |
| \`banned_age_bands\` | không có |
| \`requires_tap_fallback\` | \`false\` |
| \`limits\` | \`item_count\` [2, 8] · \`distractor_count\` [1, 4] · \`target_count\` [1, 4] |
| \`asset_kinds\` | \`emoji\` · \`image\` |
| \`engine_session\` | \`${codeNum}Session\` |

## 16. Chiều sâu nội dung

Sáu số đo hiện tại và mục tiêu bậc 1 (\`BR-ECD-01\`…\`-06\`):
- \`level_count\`: hiện có 0, mục tiêu ≥6
- \`min_band_count\`: hiện có 0, mục tiêu ≥1
- \`thinking_span\`: hiện có 0, mục tiêu ≥2
- \`what_span\`: hiện có 0, mục tiêu ≥2
- \`theme_span\`: hiện có 0, mục tiêu ≥2
- \`access_tier\`: ≥1 level \`free\` hoặc \`login\`
`;

writeFileSync(join(templateDir, "template.ts"), templateContent, "utf8");
writeFileSync(join(templateDir, "session.ts"), sessionContent, "utf8");
writeFileSync(join(templateDir, "fixtures.ts"), fixturesContent, "utf8");
writeFileSync(join(templateDir, "session.test.ts"), testContent, "utf8");
if (!existsSync(specFile)) {
  writeFileSync(specFile, specContent, "utf8");
}

console.log(
  `✅ [create:template] Created skeleton for ${code} in ${templateDir} and spec in ${specFile}`
);
console.log(
  "ℹ️  Note: Newly created template is not automatically registered. Run `pnpm gen:templates` once ready (BR-TAK-09)."
);
