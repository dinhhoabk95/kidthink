import { readFileSync } from "node:fs";
import { build } from "esbuild";

/**
 * Gói worker thành một file `dist/index.js`.
 *
 * `tsc` không dùng được ở đây: các package workspace export TS thô
 * (`packages/queue/package.json` exports `./src/index.ts`), nên `tsc` hoặc
 * từ chối vì `rootDir`, hoặc rải output ra `dist/apps/worker/src/`. Ba nơi
 * đều đóng đinh đúng đường dẫn `apps/worker/dist/index.js`. Đường phát hành VPS
 * (PM2, `D14` đã gỡ) từng chạy đúng file này; giữ nguyên đường dẫn cho `pnpm start`
 * của worker ở dev.
 */

const manifest = JSON.parse(readFileSync("package.json", "utf8"));

/**
 * Để ngoài bundle đúng những package `apps/worker` tự khai — và chỉ chúng.
 *
 * Ranh giới này không tuỳ tiện, nó là ranh giới pnpm giải được lúc chạy: chỉ
 * dependency khai trong `package.json` mới được liên kết cạnh `dist/index.js`.
 * Hai chiều đều đã vấp phải khi dựng file này:
 *   - gói tất cả → một package native CJS (trước đây là `argon2`, nay đã gỡ) đọc `__dirname`, và `bullmq` gọi
 *     `require("child_process")` động, cả hai vỡ trong ES module;
 *   - để tất cả ra ngoài → `zod` không giải được, vì nó là dependency của
 *     `@mindkid/queue` chứ không phải của worker.
 *
 * Danh sách đọc từ `package.json` nên thêm một dependency là nó tự có hiệu lực.
 */
const external = Object.keys(manifest.dependencies ?? {}).filter(
  (name) => !name.startsWith("@mindkid/")
);

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  sourcemap: true,
  external,
  // Cho phép CJS đã gói vào gọi `require` động thay vì gặp shim ném lỗi.
  banner: {
    js: "import{createRequire as __nodeRequire}from'node:module';const require=__nodeRequire(import.meta.url);",
  },
  logLevel: "info",
});
