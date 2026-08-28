import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateEnvExample, TARGETS } from "#scripts/generate-env-example";
import { ENV_REGISTRY } from "#src/env-contract";
import { repoPath } from "#src/repo-paths";

/**
 * BR-ENV-09 — `.env.example` là **file sinh ra** từ `ENV_REGISTRY`; ai sửa tay
 * thì nó lệch ngay. Trước đây cổng là `pnpm lint:env-example`
 * (`generate-env-example.ts --check`), và không có test nào phủ.
 *
 * Từ 2026-08-29 registry sinh **bốn** file: bản gốc cho máy trạm và ba bản mẫu
 * `apps/<app>/.env.example` cho file runtime `/etc/mindkid/env/<app>.env`.
 */
describe("Cổng .env.example (BR-ENV-09)", () => {
  it.each([...TARGETS])("$path khớp đúng registry", ({ path, app }) => {
    const onDisk = readFileSync(repoPath(path), "utf8");

    expect(onDisk).toBe(generateEnvExample(app));
  });

  it("thật sự sinh từ registry — không xanh vì chuỗi rỗng", () => {
    const generated = generateEnvExample();

    expect(ENV_REGISTRY.length).toBeGreaterThan(0);
    for (const item of ENV_REGISTRY) {
      expect(generated).toContain(item.name);
    }
  });

  /**
   * Ca âm của việc lọc: một bản app chứa thừa biến của tiến trình khác là đúng
   * cái `BR-ENV-04` cấm — người vận hành chép nó lên máy chủ là worker cầm khoá
   * session, web cầm khoá mã hoá backup.
   */
  it("BR-ENV-04: bản của mỗi app chỉ chứa biến app đó đọc", () => {
    for (const target of TARGETS) {
      const app = target.app;
      if (app === undefined) {
        continue;
      }

      const generated = generateEnvExample(app);
      for (const item of ENV_REGISTRY) {
        expect(generated.includes(`\n${item.name}=`)).toBe(
          item.apps.includes(app)
        );
      }
    }
  });
});
