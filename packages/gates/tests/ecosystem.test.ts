import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const config = require(
  resolve(import.meta.dirname, "../../../infra/pm2/ecosystem.config.cjs")
);

interface PmApp {
  name: string;
  script: string;
  cwd: string;
  uid: string;
  gid: string;
  instances: number | string;
  exec_mode: string;
  env_file: string;
  env: Record<string, string>;
  max_memory_restart: string;
  max_restarts: number;
  kill_timeout: number;
  exp_backoff_restart_delay: number;
  out_file: string;
  error_file: string;
}

const TS_SCRIPT = /\.ts$/;
const BUILT_SCRIPT = /\.(mjs|js)$/;

const apps: PmApp[] = config.apps;
const byName = (name: string) => apps.find((a) => a.name === name) as PmApp;

describe("Process supervision (BR-SUP-01..10, BR-SRV-02)", () => {
  it("declares exactly the three applications", () => {
    expect(apps.map((a) => a.name)).toEqual([
      "mindkid-web",
      "mindkid-admin",
      "mindkid-worker",
    ]);
  });

  it("BR-SUP-03: the worker is one fork, never a cluster", () => {
    const worker = byName("mindkid-worker");
    expect(worker.instances).toBe(1);
    expect(worker.exec_mode).toBe("fork");
    expect(worker.script).toBe("./apps/worker/dist/index.js");
  });

  it("BR-SUP-09: every script points at built output, not TypeScript", () => {
    for (const app of apps) {
      expect(app.script).not.toMatch(TS_SCRIPT);
      expect(app.script).toMatch(BUILT_SCRIPT);
    }
  });

  it("resolves relative scripts against the release, not against this file", () => {
    // Without cwd, pm2 resolves "./apps/web/..." relative to infra/pm2/,
    // which is why nothing started.
    for (const app of apps) {
      expect(app.cwd).toBe("/opt/mindkid/current");
    }
  });

  it("BR-SRV-02: applications run as the unprivileged system user", () => {
    for (const app of apps) {
      expect(app.uid).toBe("mindkid");
      expect(app.gid).toBe("mindkid");
    }
  });

  it("BR-SUP-04: each application loads only its own env file", () => {
    expect(byName("mindkid-web").env_file).toBe("/etc/mindkid/env/web.env");
    expect(byName("mindkid-admin").env_file).toBe("/etc/mindkid/env/admin.env");
    expect(byName("mindkid-worker").env_file).toBe(
      "/etc/mindkid/env/worker.env"
    );
    expect(new Set(apps.map((a) => a.env_file)).size).toBe(3);
  });

  it("uses the loopback ports from server-provisioning.md §7.3", () => {
    expect(byName("mindkid-web").env.PORT).toBe("3000");
    expect(byName("mindkid-admin").env.PORT).toBe("3002");
    expect(byName("mindkid-worker").env.PORT).toBe("3099");
  });

  it("applies the thresholds from process-supervision.md §7.2", () => {
    for (const app of apps) {
      expect(app.max_memory_restart).toBe("700M");
      expect(app.max_restarts).toBe(5);
      expect(app.kill_timeout).toBe(10_000);
    }
  });

  it("BR-SUP-05: restart delay grows instead of looping at a fixed interval", () => {
    for (const app of apps) {
      expect(app.exp_backoff_restart_delay).toBeGreaterThan(0);
    }
  });

  it("BR-SUP-06: logs go to the per-application directory", () => {
    for (const app of apps) {
      const name = app.name.replace("mindkid-", "");
      expect(app.out_file).toBe(`/var/log/mindkid/${name}/out.log`);
      expect(app.error_file).toBe(`/var/log/mindkid/${name}/error.log`);
    }
  });
});
