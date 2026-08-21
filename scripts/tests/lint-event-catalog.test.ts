import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  scanEventCatalogGates,
  scanEventCatalogSources,
} from "../lint-event-catalog-lib.js";

const rootDir = process.cwd();
const REPO_PATHS = {
  specFile: resolve(rootDir, "docs/specs/00-foundation/event-catalog.md"),
  playSessionFile: resolve(rootDir, "packages/db/src/services/play-session.ts"),
  templatesDir: resolve(rootDir, "packages/game-engine/src/templates"),
};

const CATALOG = `
## 7. Data — catalog

### 7.1 Vòng đời phiên

| Event | Payload |
|---|---|
| \`game_started\` | \`{ template_code }\` |

### 7.2 Vòng chơi

| Event | Payload |
|---|---|
| \`item_selected\` | \`{ item_id, is_correct }\` |

### 7.5 Field bị cấm trong mọi payload

\`display_name\` · \`email\`
`;

const PLAY_SESSION = `
export const ALLOWED_EVENT_NAMES = new Set(["game_started", "item_selected"]);

const EVENT_PAYLOAD_FIELDS: Readonly<Record<string, ReadonlySet<string>>> = {
  game_started: new Set(["template_code"]),
  item_selected: new Set(["item_id", "is_correct"]),
};

const EVENT_PAYLOAD_SCHEMAS: Readonly<Record<string, z.AnyZodObject>> = {
  game_started: z.object({ template_code: z.string() }),
  item_selected: z.object({ item_id: z.string() }),
};
`;

describe("Cổng catalog event (BR-EVT-01, BR-EVT-02, BR-EVT-07)", () => {
  it("xanh trên chính repo", () => {
    expect(scanEventCatalogGates(REPO_PATHS)).toEqual([]);
  });

  it("xanh khi ba nguồn khớp nhau", () => {
    const violations = scanEventCatalogSources({
      catalogMarkdown: CATALOG,
      playSessionSource: PLAY_SESSION,
      templates: [
        {
          templateCode: "GT-900",
          declared: ["game_started", "item_selected"],
          recorded: ["item_selected"],
        },
      ],
    });
    expect(violations).toEqual([]);
  });

  it("ca âm: khuôn khai event vắng trong catalog và trong allowlist", () => {
    const violations = scanEventCatalogSources({
      catalogMarkdown: CATALOG,
      playSessionSource: PLAY_SESSION,
      templates: [
        {
          templateCode: "GT-900",
          declared: ["game_started", "clue_revealed"],
          recorded: [],
        },
      ],
    });
    expect(violations).toHaveLength(2);
    expect(violations.map((v) => v.rule).sort()).toEqual([
      "BR-EVT-01",
      "BR-EVT-07",
    ]);
    expect(violations.every((v) => v.eventName === "clue_revealed")).toBe(true);
  });

  it("ca âm: session phát event mà khuôn không khai", () => {
    const violations = scanEventCatalogSources({
      catalogMarkdown: CATALOG,
      playSessionSource: PLAY_SESSION,
      templates: [
        {
          templateCode: "GT-900",
          declared: ["game_started"],
          recorded: ["item_selected"],
        },
      ],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("BR-EVT-07");
    expect(violations[0].message).toContain("trường events của khuôn");
  });

  it("ca âm: server nhận tên mà catalog không khai", () => {
    const violations = scanEventCatalogSources({
      catalogMarkdown: CATALOG,
      playSessionSource: PLAY_SESSION.replace(
        '"game_started", "item_selected"]',
        '"game_started", "item_selected", "ghost_event"]'
      ),
      templates: [],
    });
    expect(violations.map((v) => v.eventName)).toEqual([
      "ghost_event",
      "ghost_event",
      "ghost_event",
    ]);
  });

  it("ca âm: event trong allowlist thiếu schema payload", () => {
    const violations = scanEventCatalogSources({
      catalogMarkdown: CATALOG,
      playSessionSource: PLAY_SESSION.replace(
        "  item_selected: z.object({ item_id: z.string() }),\n",
        ""
      ),
      templates: [],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].source).toBe("EVENT_PAYLOAD_SCHEMAS");
    expect(violations[0].eventName).toBe("item_selected");
  });
});
