import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_DIR = resolve(import.meta.dirname, "../../src/schema");

describe("schema architecture", () => {
  it("BR-DM-11: every domain schema file stays at or below 400 lines", () => {
    const oversized = readdirSync(SCHEMA_DIR)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => ({
        file,
        lines: readFileSync(resolve(SCHEMA_DIR, file), "utf8").split("\n")
          .length,
      }))
      .filter(({ lines }) => lines > 400);

    expect(oversized).toEqual([]);
  });
});
