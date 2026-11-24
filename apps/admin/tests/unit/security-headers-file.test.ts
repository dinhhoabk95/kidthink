import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyHashes,
  collectInlineScriptHashes,
  HASH_PLACEHOLDER,
  sha256Source,
} from "../../scripts/csp-hashes";

// BR-SEC-10 (D14): admin là static SPA trên Workers Static Assets, không có Nitro server;
// `apps/admin/public/_headers` là owner duy nhất của security header.
const SCRIPT_UNSAFE_INLINE_RE = /script-src[^;]*unsafe-inline/;
const SHA_SOURCE_RE = /^'sha256-[A-Za-z0-9+/]+=*'$/;
const HEADERS_PATH = path.resolve(import.meta.dirname, "../../public/_headers");

const REQUIRED_GLOBAL_HEADERS = [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Cross-Origin-Opener-Policy",
  "Permissions-Policy",
  "Content-Security-Policy",
] as const;

/** Trả về map `đường dẫn -> tên header` từ nội dung tệp `_headers`. */
function parseHeaderNames(content: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  let current: string | null = null;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }
    if (rawLine.startsWith(" ") || rawLine.startsWith("\t")) {
      const name = line.trim().split(":")[0] ?? "";
      if (current) {
        result.get(current)?.push(name);
      }
      continue;
    }
    current = line.trim();
    result.set(current, []);
  }
  return result;
}

function missingGlobalHeaders(content: string): string[] {
  const names = parseHeaderNames(content).get("/*") ?? [];
  return REQUIRED_GLOBAL_HEADERS.filter((h) => !names.includes(h));
}

describe("admin public/_headers (BR-SEC-10)", () => {
  const content = fs.readFileSync(HEADERS_PATH, "utf-8");

  it("khai đủ security header cho /*", () => {
    expect(missingGlobalHeaders(content)).toEqual([]);
  });

  it("CSP cấm nhúng khung và chỉ cho script cùng origin", () => {
    expect(content).toContain("frame-ancestors 'none'");
    // Inline script của Nuxt được cho phép bằng hash lúc build (placeholder), không `unsafe-inline`.
    expect(content).toContain(`script-src 'self' ${HASH_PLACEHOLDER};`);
    expect(content).not.toMatch(SCRIPT_UNSAFE_INLINE_RE);
    expect(content).toContain("X-Frame-Options: DENY");
  });

  it("cache immutable cho /_nuxt/*", () => {
    const names = parseHeaderNames(content).get("/_nuxt/*") ?? [];
    expect(names).toContain("Cache-Control");
    expect(content).toContain("max-age=31536000, immutable");
  });

  it("ca âm — thiếu CSP thì bị phát hiện", () => {
    const broken = "/*\n  X-Frame-Options: DENY\n";
    expect(missingGlobalHeaders(broken)).toContain("Content-Security-Policy");
  });

  it("hash inline script khớp sha256 thật, bỏ qua script src và JSON dữ liệu", () => {
    const body = "window.__NUXT__={};";
    const html = [
      '<script type="importmap">{"imports":{}}</script>',
      '<script type="module" src="/_nuxt/a.js"></script>',
      `<script>${body}</script>`,
      `<script>${body}</script>`,
      '<script type="application/json" id="d">[1]</script>',
    ].join("");
    const hashes = collectInlineScriptHashes(html);
    expect(hashes).toHaveLength(2);
    expect(hashes).toContain(sha256Source(body));
    expect(hashes).toContain(sha256Source('{"imports":{}}'));
    expect(hashes[0]).toMatch(SHA_SOURCE_RE);
  });

  it("applyHashes thay placeholder vào script-src và không còn placeholder", () => {
    const out = applyHashes(content, ["'sha256-AAA='", "'sha256-BBB='"]);
    expect(out).toContain("script-src 'self' 'sha256-AAA=' 'sha256-BBB=';");
    expect(out).not.toContain(HASH_PLACEHOLDER);
  });

  it("ca âm — thiếu placeholder thì build báo lỗi", () => {
    expect(() => applyHashes("/*\n  X: y\n", [])).toThrow();
  });
});
