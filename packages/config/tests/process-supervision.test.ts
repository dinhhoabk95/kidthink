import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENV_REGISTRY, validateEnvFile } from "#src/env-contract";
import { repoPath } from "#src/repo-paths";

interface Pm2AppConfig {
  name: string;
  script: string;
  cwd: string;
  uid: string;
  gid: string;
  instances: number | string;
  exec_mode: "cluster" | "fork";
  env_file: string;
  env: Record<string, string>;
  out_file: string;
  error_file: string;
  max_memory_restart: string;
  max_restarts: number;
  exp_backoff_restart_delay: number;
  kill_timeout: number;
}

interface ClusterPoolOptions {
  cpuCount?: number;
  dbPoolMax?: number;
  maxConnections?: number;
}

interface ClusterPoolValidation {
  valid: boolean;
  totalConnections: number;
  maxConnections: number;
  reason?: string;
}

interface EcosystemModule {
  apps: readonly Pm2AppConfig[];
  DB_POOL_MAX: number;
  DB_MAX_CONNECTIONS: number;
  MIN_WEB_INSTANCES: number;
  WORKER_INSTANCES: number;
  resolveWebInstances: (options?: ClusterPoolOptions) => number;
  validateClusterPoolBudget: (
    config: { apps: readonly Pm2AppConfig[] },
    options?: ClusterPoolOptions
  ) => ClusterPoolValidation;
}

const require = createRequire(import.meta.url);
const ecosystemPath = repoPath("infra/pm2/ecosystem.config.cjs");
const FIRST_RELEASE_DIR_REGEX = /^\d{8}T\d{6}Z-a1b2c3d$/;
const SECOND_RELEASE_DIR_REGEX = /^\d{8}T\d{6}Z-a1b2c3d(-2)?$/;

function loadEcosystem(): EcosystemModule {
  delete require.cache[ecosystemPath];
  return require(ecosystemPath) as EcosystemModule;
}

function seedValidReleaseTree(releaseDir: string): void {
  const webServer = join(releaseDir, "apps/web/.output/server");
  const webNuxt = join(releaseDir, "apps/web/.output/public/_nuxt");
  const adminPublic = join(releaseDir, "apps/admin/.output/public");
  const adminNuxt = join(adminPublic, "_nuxt");
  const workerDist = join(releaseDir, "apps/worker/dist");

  mkdirSync(webServer, { recursive: true });
  mkdirSync(webNuxt, { recursive: true });
  mkdirSync(adminNuxt, { recursive: true });
  mkdirSync(workerDist, { recursive: true });

  writeFileSync(join(webServer, "index.mjs"), "export const ok = true;\n");
  writeFileSync(join(webNuxt, "entry.js"), "export const web = 1;\n");
  writeFileSync(
    join(adminPublic, "index.html"),
    '<!doctype html><html><head><link rel="stylesheet" href="/_nuxt/entry.test.css"></head><body></body></html>\n'
  );
  writeFileSync(join(adminNuxt, "entry.test.css"), "a".repeat(105_000));
  writeFileSync(join(adminNuxt, "entry.test.js"), "export const admin = 1;\n");
  writeFileSync(join(workerDist, "index.js"), "export const worker = 1;\n");
}

function runReleaseScriptSnippet(
  snippet: string,
  envOverrides: Record<string, string> = {}
): { status: number | null; stdout: string; stderr: string } {
  const scriptsRoot = repoPath("infra/scripts/lib");
  const script = `
    set -uo pipefail
    source "${scriptsRoot}/paths.sh"
    source "${scriptsRoot}/log.sh"
    source "${scriptsRoot}/atomic.sh"
    source "${scriptsRoot}/releases.sh"
    source "${scriptsRoot}/smoke.sh"
    source "${scriptsRoot}/build.sh"
    ${snippet}
  `;
  const res = spawnSync("bash", ["-c", script], {
    encoding: "utf8",
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
  return {
    status: res.status,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

describe("PROCESS-SUPERVISION — ecosystem.config.cjs (BR-SUP-03, BR-SUP-04, BR-SUP-07, BR-SUP-08)", () => {
  it("BR-SUP-08: web instances is a bounded integer calculated with DB_POOL_MAX, never 'max'", () => {
    const eco = loadEcosystem();
    const webApp = eco.apps.find((a) => a.name === "mindkid-web");
    const workerApp = eco.apps.find((a) => a.name === "mindkid-worker");

    expect(webApp).toBeDefined();
    expect(workerApp).toBeDefined();
    expect(webApp?.instances).not.toBe("max");
    expect(typeof webApp?.instances).toBe("number");
    expect(Number.isInteger(webApp?.instances)).toBe(true);
    expect(Number(webApp?.instances)).toBeGreaterThanOrEqual(
      eco.MIN_WEB_INSTANCES
    );

    const totalConnections =
      (Number(webApp?.instances) + Number(workerApp?.instances)) *
      eco.DB_POOL_MAX;
    expect(totalConnections).toBeLessThanOrEqual(eco.DB_MAX_CONNECTIONS);
  });

  it("BR-SUP-08 (negative case): config with instances: 'max' on a 16-core machine exceeds DB pool budget and fails validation", () => {
    const eco = loadEcosystem();
    const brokenConfig: { apps: readonly Pm2AppConfig[] } = {
      apps: eco.apps.map((app) =>
        app.name === "mindkid-web" ? { ...app, instances: "max" } : app
      ),
    };

    const validation = eco.validateClusterPoolBudget(brokenConfig, {
      cpuCount: 16,
    });

    expect(validation.valid).toBe(false);
    expect(validation.totalConnections).toBeGreaterThan(
      validation.maxConnections
    );
    expect(validation.reason).toContain("BR-SUP-08");
  });

  it("BR-SUP-08: resolveWebInstances clamps 16-core and 32-core hosts so (instances + worker) * DB_POOL_MAX <= DB_MAX_CONNECTIONS", () => {
    const eco = loadEcosystem();

    for (const cpuCount of [1, 2, 4, 8, 16, 32]) {
      const webInstances = eco.resolveWebInstances({ cpuCount });
      expect(webInstances).toBeGreaterThanOrEqual(eco.MIN_WEB_INSTANCES);
      expect(
        (webInstances + eco.WORKER_INSTANCES) * eco.DB_POOL_MAX
      ).toBeLessThanOrEqual(eco.DB_MAX_CONNECTIONS);
    }
  });

  it("BR-SUP-03 & BR-SUP-04: worker runs a single fork instance and each app uses its own isolated env_file", () => {
    const eco = loadEcosystem();
    const webApp = eco.apps.find((a) => a.name === "mindkid-web");
    const workerApp = eco.apps.find((a) => a.name === "mindkid-worker");

    expect(workerApp?.instances).toBe(1);
    expect(workerApp?.exec_mode).toBe("fork");
    expect(webApp?.exec_mode).toBe("cluster");
    expect(webApp?.env_file).toBe("/etc/mindkid/env/web.env");
    expect(workerApp?.env_file).toBe("/etc/mindkid/env/worker.env");
    expect(webApp?.env_file).not.toBe(workerApp?.env_file);
  });

  it("BR-SUP-07: inline PM2 env never contains any secret variable from ENV_REGISTRY", () => {
    const eco = loadEcosystem();
    const secretNames = new Set(
      ENV_REGISTRY.filter((def) => def.secret).map((def) => def.name)
    );

    for (const app of eco.apps) {
      for (const envKey of Object.keys(app.env)) {
        expect(secretNames.has(envKey)).toBe(false);
      }
      expect(app.out_file).toBe(
        `/var/log/mindkid/${app.name.replace("mindkid-", "")}/out.log`
      );
      expect(app.error_file).toBe(
        `/var/log/mindkid/${app.name.replace("mindkid-", "")}/error.log`
      );
    }
  });

  it("BR-SUP-07: process startup env validation never includes secret values in error messages written to process logs", () => {
    const secretLeak = "super-sensitive-secret-value-leak-check";
    const parsed = new Map<string, string>([
      ["NODE_ENV", "production"],
      ["PORT", "3000"],
      ["SITE_URL", "https://mindkid.vn"],
      ["NUXT_ALLOWED_ORIGINS", "https://mindkid.vn"],
      ["DATABASE_URL", `invalid-scheme://${secretLeak}@localhost:5432/mindkid`],
      ["DATABASE_URL_APP", `https://user:${secretLeak}@localhost:5432/mindkid`],
      ["VALKEY_URL", `http://:${secretLeak}@localhost:6379`],
      ["NUXT_SESSION_PASSWORD", "short-secret-value"],
    ]);

    const result = validateEnvFile("web", parsed, true);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    for (const err of result.errors) {
      expect(err.issue).not.toContain(secretLeak);
      expect(err.issue).not.toContain("short-secret-value");
    }

    const serializedConfig = JSON.stringify(loadEcosystem().apps);
    expect(serializedConfig).not.toContain(secretLeak);
  });
});

describe("RELEASE-DEPLOY — release directories, active release guard, and artifact smoke (BR-DEP-12, BR-DEP-13, BR-DEP-15)", () => {
  it("BR-DEP-12: deploying the same commit SHA twice produces distinct release directory names without overwriting", () => {
    const root = mkdtempSync(join(tmpdir(), "mk-dep12-"));
    try {
      const releasesDir = join(root, "releases");
      mkdirSync(releasesDir, { recursive: true });

      const res = runReleaseScriptSnippet(
        `
        first="$(release_dir_name "a1b2c3d4e5f60718")"
        mkdir -p "${releasesDir}/\${first}"
        second="$(release_dir_name "a1b2c3d4e5f60718")"
        printf '%s\\n%s\\n' "\${first}" "\${second}"
        `,
        {
          MK_ROOT: root,
          MK_RELEASES_DIR: releasesDir,
          MK_LOG_DIR: join(root, "log"),
        }
      );

      expect(res.status).toBe(0);
      const lines = res.stdout.trim().split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).not.toBe(lines[1]);
      expect(lines[0]).toMatch(FIRST_RELEASE_DIR_REGEX);
      expect(lines[1]).toMatch(SECOND_RELEASE_DIR_REGEX);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("BR-DEP-13: build_release refuses to run inside the currently active release directory", () => {
    const root = mkdtempSync(join(tmpdir(), "mk-dep13-"));
    try {
      const releasesDir = join(root, "releases");
      const activeDir = join(releasesDir, "20261018T120000Z-a1b2c3d");
      const currentLink = join(root, "current");
      mkdirSync(activeDir, { recursive: true });
      symlinkSync(activeDir, currentLink);

      const res = runReleaseScriptSnippet(`build_release "${activeDir}"`, {
        MK_ROOT: root,
        MK_RELEASES_DIR: releasesDir,
        MK_CURRENT_LINK: currentLink,
        MK_LOG_DIR: join(root, "log"),
      });

      expect(res.status).toBe(1);
      expect(`${res.stdout}\n${res.stderr}`).toContain("BR-DEP-13");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("BR-DEP-15: smoke_release_artifacts passes on a healthy release and fails when admin CSS is <= 100 KB or bundles leak server-only tokens", () => {
    const root = mkdtempSync(join(tmpdir(), "mk-dep15-"));
    try {
      const releaseDir = join(root, "release");
      seedValidReleaseTree(releaseDir);

      const env = {
        MK_ROOT: root,
        MK_LOG_DIR: join(root, "log"),
      };

      const healthy = runReleaseScriptSnippet(
        `smoke_release_artifacts "${releaseDir}"`,
        env
      );
      expect(healthy.status).toBe(0);

      writeFileSync(
        join(releaseDir, "apps/admin/.output/public/_nuxt/entry.test.css"),
        "body{margin:0}"
      );
      const smallCss = runReleaseScriptSnippet(
        `smoke_release_artifacts "${releaseDir}"`,
        env
      );
      expect(smallCss.status).toBe(1);
      expect(`${smallCss.stdout}\n${smallCss.stderr}`).toContain("BR-DEP-15");

      seedValidReleaseTree(releaseDir);
      writeFileSync(
        join(releaseDir, "apps/admin/.output/public/_nuxt/leak.js"),
        "import gyp from 'node-gyp-build'; export default gyp;\n"
      );
      const clientLeak = runReleaseScriptSnippet(
        `smoke_release_artifacts "${releaseDir}"`,
        env
      );
      expect(clientLeak.status).toBe(1);
      expect(`${clientLeak.stdout}\n${clientLeak.stderr}`).toContain(
        "BR-DEP-15"
      );

      seedValidReleaseTree(releaseDir);
      writeFileSync(
        join(releaseDir, "apps/web/.output/server/index.mjs"),
        "export const p = __dirname;\n"
      );
      const serverLeak = runReleaseScriptSnippet(
        `smoke_release_artifacts "${releaseDir}"`,
        env
      );
      expect(serverLeak.status).toBe(1);
      expect(`${serverLeak.stdout}\n${serverLeak.stderr}`).toContain(
        "BR-DEP-15"
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
