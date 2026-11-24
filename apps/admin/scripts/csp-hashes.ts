// BR-SEC-10: admin là static SPA; Nuxt chèn inline <script> (importmap, runtime config, color-mode)
// nên `script-src 'self'` một mình sẽ chặn chúng. Script này chạy sau `nuxt generate`:
// tính sha256 mọi inline script thực thi được trong `.output/public/*.html` và thay
// placeholder trong `.output/public/_headers` (nguồn: `public/_headers`).
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const HASH_PLACEHOLDER = "{{SCRIPT_HASHES}}";

const SRC_ATTR_RE = /\ssrc\s*=/;
const SCRIPT_RE = /<script([^>]*)>([\s\S]*?)<\/script>/g;
/** Loại JSON dữ liệu không được trình duyệt thực thi → không cần hash. */
const DATA_TYPE_RE = /type\s*=\s*["']application\/(?:json|ld\+json)["']/i;

export function sha256Source(content: string): string {
  return `'sha256-${createHash("sha256").update(content, "utf8").digest("base64")}'`;
}

/** Trả về danh sách nguồn `'sha256-…'` (đã khử trùng, có thứ tự) cho inline script trong HTML. */
export function collectInlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>();
  for (const match of html.matchAll(SCRIPT_RE)) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";
    if (
      SRC_ATTR_RE.test(attrs) ||
      body.trim() === "" ||
      DATA_TYPE_RE.test(attrs)
    ) {
      continue;
    }
    hashes.add(sha256Source(body));
  }
  return [...hashes];
}

export function applyHashes(
  headers: string,
  hashes: readonly string[]
): string {
  if (!headers.includes(HASH_PLACEHOLDER)) {
    throw new Error(`_headers thiếu placeholder ${HASH_PLACEHOLDER}`);
  }
  return headers
    .replace(HASH_PLACEHOLDER, hashes.join(" "))
    .replace("'self' ;", "'self';");
}

function listHtml(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listHtml(full));
    } else if (entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

export function injectCspHashes(publicDir: string): string[] {
  const hashes = new Set<string>();
  for (const file of listHtml(publicDir)) {
    for (const h of collectInlineScriptHashes(fs.readFileSync(file, "utf8"))) {
      hashes.add(h);
    }
  }
  const headersPath = path.join(publicDir, "_headers");
  fs.writeFileSync(
    headersPath,
    applyHashes(fs.readFileSync(headersPath, "utf8"), [...hashes])
  );
  return [...hashes];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const publicDir = path.resolve(import.meta.dirname, "../.output/public");
  const hashes = injectCspHashes(publicDir);
  console.log(
    `[csp-hashes] ${hashes.length} inline script hash -> .output/public/_headers`
  );
}
