import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BANNED_TERMS } from "#src/index";

const ROOT = resolve(import.meta.dirname, "../../..");
const MindKid_SCOPE_PATTERN = /^@mindkid\//;

describe("P0 foundation contracts", () => {
  it("BR-RBS-02: every workspace package uses the @mindkid scope", () => {
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
      expect(packageJson.name, manifest).toMatch(MindKid_SCOPE_PATTERN);
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
    expect(config).toContain("nodemailer");
    expect(config).toContain("mjml");
    expect(config).toContain("rate-limiter-flexible");
    expect(config).toContain("otpauth");
  });

  it("Task #83: pnpm-workspace.yaml pins all required core packages in catalog", () => {
    const workspace = readFileSync(
      resolve(ROOT, "pnpm-workspace.yaml"),
      "utf8"
    );
    expect(workspace).toContain("nodemailer: ^6.10.0");
    expect(workspace).toContain("mjml: ^5.4.0");
    expect(workspace).toContain("rate-limiter-flexible: ^11.2.0");
    expect(workspace).toContain("nuxt-security: ^2.6.0");
    expect(workspace).toContain("otpauth: ^9.5.0");
    expect(workspace).toContain("openid-client: ^6.8.0");
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
