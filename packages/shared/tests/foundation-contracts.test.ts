import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BANNED_TERMS, TERM_REPLACEMENTS } from "#src/index";

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

  it("BR-MPA-01, BR-MPA-05, BR-MPA-06, BR-MPA-07, BR-MPA-08, BR-MPA-09: dependency gate and vitest base config keep all package boundaries and import alias rules", () => {
    const config = readFileSync(
      resolve(ROOT, ".dependency-cruiser.cjs"),
      "utf8"
    );
    const vitestBase = readFileSync(
      resolve(ROOT, "packages/config/vitest/base.ts"),
      "utf8"
    );

    expect(config).toContain("no-app-direct-base-lib");
    expect(config).toContain("no-packages-to-apps");
    expect(config).toContain("no-app-to-app");
    expect(config).toContain("no-content-package-forbidden-imports");
    expect(config).toContain("no-db-package-forbidden-imports");
    expect(config).toContain("no-domain-services-forbidden-imports");
    expect(config).toContain("no-unresolvable");
    expect(config).toContain("nodemailer");
    expect(config).toContain("mjml");
    expect(config).toContain("rate-limiter-flexible");
    expect(config).toContain("otpauth");

    expect(vitestBase).toContain("nuxtAppAliases");
    expect(vitestBase).toContain("workspaceAliases");
  });

  it("Task #83: workspace packages pin all required core packages with explicit versions", () => {
    const readDeps = (relPath: string): Record<string, string> => {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, relPath), "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      return { ...pkg.dependencies, ...pkg.devDependencies };
    };

    const notifDeps = readDeps("packages/notification/package.json");
    const cacheDeps = readDeps("packages/cache/package.json");
    const webDeps = readDeps("apps/web/package.json");
    const authDeps = readDeps("packages/auth/package.json");

    expect(notifDeps.nodemailer).toBe("^10.6.0");
    expect(notifDeps.mjml).toBe("^5.4.1");
    expect(cacheDeps["rate-limiter-flexible"]).toBe("^11.5.0");
    expect(webDeps["nuxt-security"]).toBe("^2.7.0");
    expect(webDeps["@t3-oss/env-nuxt"]).toBe("^0.13.11");
    expect(webDeps["nuxt-auth-utils"]).toBeUndefined();
    expect(authDeps["better-auth"]).toBe("1.7.27");
    expect(authDeps["@better-auth/drizzle-adapter"]).toBe("1.7.27");
    expect(authDeps["@better-auth/passkey"]).toBe("1.7.27");
    expect(authDeps.argon2).toBe("^0.45.2");
    expect(authDeps["nuxt-auth-utils"]).toBeUndefined();
    expect(authDeps.otpauth).toBeUndefined();
    expect(authDeps["openid-client"]).toBeUndefined();
  });

  it("BR-GLOS-03 & BR-GLOS-04: the tooling glossary exposes every banned foundation term and replacement", () => {
    expect(BANNED_TERMS).toEqual(
      expect.arrayContaining([
        "tenant",
        "tenant_id",
        "school",
        "school_admin",
        "classroom",
        "persona",
        "domain",
        "student",
        "pupil",
        "score",
        "native_mobile",
        "licensing",
        "marketplace",
        "phụ huynh",
        "giáo viên",
        "chậm phát triển",
        "IQ",
        "chẩn đoán",
      ])
    );
    expect(TERM_REPLACEMENTS["phụ huynh"]).toBe("User");
    expect(TERM_REPLACEMENTS["giáo viên"]).toBe("User");
    expect(TERM_REPLACEMENTS.persona).toBe("entitlement");
    expect(TERM_REPLACEMENTS.domain).toBe("strand");
  });

  it("BR-RBS-01, BR-RBS-06, BR-RBS-09: pnpm-workspace.yaml and package.json enforce explicit synchronized versions, engines, allowBuilds, and overrides", () => {
    const workspace = readFileSync(
      resolve(ROOT, "pnpm-workspace.yaml"),
      "utf8"
    );
    const rootPkg = JSON.parse(
      readFileSync(resolve(ROOT, "package.json"), "utf8")
    ) as {
      engines?: { node?: string; pnpm?: string };
      scripts?: Record<string, string>;
    };

    expect(workspace).toContain("apps/*");
    expect(workspace).toContain("packages/*");
    expect(workspace).not.toContain("catalog:");
    expect(workspace).toContain("lefthook: false");
    expect(workspace).toContain("unhead: 3.4.3");
    expect(workspace).toContain('"@unhead/vue": 3.4.3');
    expect(workspace).toContain("vue: 3.6.0-rc.15");

    const manifests = ["package.json"].concat(
      ["apps", "packages"].flatMap((group) =>
        readdirSync(resolve(ROOT, group), { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => `${group}/${entry.name}/package.json`)
      )
    );
    const seenVersions = new Map<string, string>();
    for (const manifest of manifests) {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, manifest), "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      for (const [dep, ver] of Object.entries({
        ...pkg.dependencies,
        ...pkg.devDependencies,
      })) {
        expect(ver, `${manifest} -> ${dep}`).not.toBe("catalog:");
        if (ver.startsWith("workspace:")) {
          continue;
        }
        const prev = seenVersions.get(dep);
        if (prev === undefined) {
          seenVersions.set(dep, ver);
        } else {
          expect(ver, `version drift on ${dep} in ${manifest}`).toBe(prev);
        }
      }
    }

    expect(rootPkg.engines?.node).toBe(">=26.13.1");
    expect(rootPkg.engines?.pnpm).toBe(">=12");
  });

  it("BR-RBS-03: lefthook.yml configures pre-commit (format, lint-and-deps) and pre-push (typecheck)", () => {
    const rootPkg = JSON.parse(
      readFileSync(resolve(ROOT, "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };
    expect(rootPkg.scripts?.prepare).toBe("lefthook install");

    const lefthook = readFileSync(resolve(ROOT, "lefthook.yml"), "utf8");
    expect(lefthook).toContain("pre-commit:");
    expect(lefthook).toContain("- name: format");
    expect(lefthook).toContain("- name: lint-and-deps");
    expect(lefthook).toContain("pre-push:");
    expect(lefthook).toContain("pnpm typecheck");
  });

  it("BR-RBS-07: docker-compose.yml uses pgvector/pgvector:pg18 and valkey/valkey:9-alpine", () => {
    const compose = readFileSync(resolve(ROOT, "docker-compose.yml"), "utf8");
    expect(compose).toContain("pgvector/pgvector:pg18");
    expect(compose).not.toContain("postgres:18-alpine");
    expect(compose).toContain("valkey/valkey:9-alpine");
  });

  it("BR-RBS-10: apps/web runs on port 3000 and apps/admin runs on port 3001 in dev", () => {
    const webPkg = JSON.parse(
      readFileSync(resolve(ROOT, "apps/web/package.json"), "utf8")
    ) as { scripts?: Record<string, string> };
    const adminPkg = JSON.parse(
      readFileSync(resolve(ROOT, "apps/admin/package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(webPkg.scripts?.dev).toContain("--port 3000");
    expect(adminPkg.scripts?.dev).toContain("--port 3001");
  });
});
