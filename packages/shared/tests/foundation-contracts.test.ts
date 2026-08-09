import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BANNED_TERMS } from "../src/index.js";

const ROOT = resolve(import.meta.dirname, "../../..");
const KIDTHINK_SCOPE_PATTERN = /^@kidthink\//;

describe("P0 foundation contracts", () => {
  it("BR-RBS-02: every workspace package uses the @kidthink scope", () => {
    const workspace = readFileSync(
      resolve(ROOT, "pnpm-workspace.yaml"),
      "utf8"
    );
    expect(workspace).not.toContain("@tinimath/");

    const manifests = ["package.json"].concat(
      ["apps", "packages"].flatMap((group) =>
        readdirSync(resolve(ROOT, group), { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => `${group}/${entry.name}/package.json`)
      )
    );

    for (const manifest of manifests) {
      const packageJson = JSON.parse(
        readFileSync(resolve(ROOT, manifest), "utf8")
      ) as { name?: string };
      expect(packageJson.name, manifest).toMatch(KIDTHINK_SCOPE_PATTERN);
    }
  });

  it("BR-MPA-01, BR-MPA-06, BR-MPA-07: dependency gate keeps all three package boundaries", () => {
    const config = readFileSync(
      resolve(ROOT, ".dependency-cruiser.cjs"),
      "utf8"
    );

    expect(config).toContain("no-app-direct-base-lib");
    expect(config).toContain("no-packages-to-apps");
    expect(config).toContain("no-app-to-app");
  });

  it("BR-GLOS-03: the tooling glossary exposes every banned foundation term", () => {
    expect(BANNED_TERMS).toEqual(
      expect.arrayContaining([
        "tenant_id",
        "school_admin",
        "classroom",
        "persona",
        "student",
        "pupil",
      ])
    );
  });
});
