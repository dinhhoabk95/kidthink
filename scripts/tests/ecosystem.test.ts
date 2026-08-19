import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("Task #90 — WP90.5 PM2 Process Supervision (BR-SUP-01..10)", () => {
  const configPath = resolve(
    import.meta.dirname,
    "../../infra/pm2/ecosystem.config.cjs"
  );
  const config = require(configPath);

  it("defines exactly 3 applications: web, admin, worker", () => {
    expect(config.apps).toBeDefined();
    expect(config.apps.length).toBe(3);
    const names = config.apps.map((a: { name: string }) => a.name);
    expect(names).toEqual(["mindkid-web", "mindkid-admin", "mindkid-worker"]);
  });

  it("BR-SUP-03: worker runs exactly 1 instance in fork mode", () => {
    const worker = config.apps.find(
      (a: { name: string }) => a.name === "mindkid-worker"
    );
    expect(worker).toBeDefined();
    expect(worker.instances).toBe(1);
    expect(worker.exec_mode).toBe("fork");
    expect(worker.script).toBe("./apps/worker/dist/index.js");
  });

  it("web runs in cluster mode with restart thresholds", () => {
    const web = config.apps.find(
      (a: { name: string }) => a.name === "mindkid-web"
    );
    expect(web).toBeDefined();
    expect(web.exec_mode).toBe("cluster");
    expect(web.max_memory_restart).toBe("700M");
    expect(web.max_restarts).toBe(5);
    expect(web.kill_timeout).toBe(10_000);
  });

  it("BR-SUP-04: each app points to its own dedicated env file in /etc/mindkid/env/", () => {
    const web = config.apps.find(
      (a: { name: string }) => a.name === "mindkid-web"
    );
    const admin = config.apps.find(
      (a: { name: string }) => a.name === "mindkid-admin"
    );
    const worker = config.apps.find(
      (a: { name: string }) => a.name === "mindkid-worker"
    );

    expect(web.env_file).toBe("/etc/mindkid/env/web.env");
    expect(admin.env_file).toBe("/etc/mindkid/env/admin.env");
    expect(worker.env_file).toBe("/etc/mindkid/env/worker.env");
  });
});
