import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import { scanVerbDeclarations } from "./verb-declaration.ts";

const gameEngineDir = resolve(REPO_ROOT, "packages", "game-engine");

describe("Gate verb-declaration (BR-EIC-08)", () => {
  it("input.verbs của mọi template khớp verb session đọc", () => {
    const templatesDir = resolve(gameEngineDir, "src", "templates");
    expect(scanVerbDeclarations(templatesDir)).toEqual([]);
  });

  it("ca âm: session đọc drop mà template không khai thì đỏ", () => {
    const fixtureDir = resolve(
      gameEngineDir,
      "tests",
      "gates",
      "fixtures",
      "verb-drift"
    );
    expect(scanVerbDeclarations(fixtureDir)).toEqual([
      { code: "GT-900", verb: "drop", kind: "handled_not_declared" },
    ]);
  });
});
