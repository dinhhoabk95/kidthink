import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_DIR = resolve(import.meta.dirname, "../../src/schema");

describe("schema architecture", () => {
  it("mọi file .ts trong schema/ (trừ index.ts) đều có trong schema/index.ts", () => {
    const indexContent = readFileSync(resolve(SCHEMA_DIR, "index.ts"), "utf8");
    const files = readdirSync(SCHEMA_DIR).filter(
      (file) => file.endsWith(".ts") && file !== "index.ts"
    );

    for (const file of files) {
      expect(indexContent).toContain(`./${file}`);
    }
  });
});
