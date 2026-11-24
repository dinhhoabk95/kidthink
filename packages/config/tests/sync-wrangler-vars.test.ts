import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { syncWranglerVars } from "../../../scripts/deploy/sync-wrangler-ids.ts";

interface WranglerFile {
  vars: Record<string, string>;
}

const BASE = `{
  "name": "x",
  "vars": {
    "MINDKID_RUNTIME": "cloudflare"
  }
}`;

function readVars(root: string, rel: string): Record<string, string> {
  const parsed: WranglerFile = JSON.parse(
    fs.readFileSync(path.join(root, rel), "utf8")
  );
  return parsed.vars;
}

describe("BR-ENV-18 — syncWranglerVars ghi vars vào wrangler.jsonc", () => {
  let root = "";

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "sync-wrangler-"));
    for (const rel of ["apps/web", "apps/worker"]) {
      fs.mkdirSync(path.join(root, rel), { recursive: true });
      fs.writeFileSync(path.join(root, rel, "wrangler.jsonc"), BASE);
    }
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("ghi biến runtime, bỏ INITIAL_ADMIN_EMAIL, AWS_ACCESS_KEY_ID và secret", () => {
    syncWranglerVars(root, {
      SITE_URL: "https://mindkid.vn",
      NUXT_ALLOWED_ORIGINS: "https://mindkid.vn",
      INITIAL_ADMIN_EMAIL: "admin@mindkid.vn",
      AWS_ACCESS_KEY_ID: "AKIA",
      NUXT_SESSION_PASSWORD: "leak",
    });
    for (const rel of ["apps/web", "apps/worker"]) {
      const vars = readVars(root, `${rel}/wrangler.jsonc`);
      expect(vars.SITE_URL).toBe("https://mindkid.vn");
      expect(vars.MINDKID_RUNTIME).toBe("cloudflare");
      expect(vars).not.toHaveProperty("INITIAL_ADMIN_EMAIL");
      expect(vars).not.toHaveProperty("AWS_ACCESS_KEY_ID");
      expect(vars).not.toHaveProperty("NUXT_SESSION_PASSWORD");
    }
  });
});
