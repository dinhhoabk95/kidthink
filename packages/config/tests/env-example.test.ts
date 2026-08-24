import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateEnvExample } from "#scripts/generate-env-example";
import { ENV_REGISTRY } from "#src/env-contract";
import { repoPath } from "#src/repo-paths";

/**
 * BR-ENV-09 — `.env.example` là **file sinh ra** từ `ENV_REGISTRY`; ai sửa tay
 * thì nó lệch ngay. Trước đây cổng là `pnpm lint:env-example`
 * (`generate-env-example.ts --check`), và không có test nào phủ.
 */
describe("Cổng .env.example (BR-ENV-09)", () => {
  it(".env.example trong repo khớp đúng registry", () => {
    const onDisk = readFileSync(repoPath(".env.example"), "utf8");

    expect(onDisk).toBe(generateEnvExample());
  });

  it("thật sự sinh từ registry — không xanh vì chuỗi rỗng", () => {
    const generated = generateEnvExample();

    expect(ENV_REGISTRY.length).toBeGreaterThan(0);
    for (const item of ENV_REGISTRY) {
      expect(generated).toContain(item.name);
    }
  });
});
