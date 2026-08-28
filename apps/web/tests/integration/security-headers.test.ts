import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import securityHeaders from "#server/middleware/security-headers";

function createResponse() {
  const headers = new Map<string, string | string[]>();
  return {
    headersSent: false,
    writableEnded: false,
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    setHeader: (name: string, value: string | string[]) => {
      headers.set(name.toLowerCase(), value);
    },
    removeHeader: (name: string) => headers.delete(name.toLowerCase()),
    getHeaders: () => Object.fromEntries(headers),
    end: () => undefined,
  };
}

function runMiddleware(path: string): Map<string, string> {
  const res = createResponse();
  const event = createEvent(
    {
      method: "GET",
      url: path,
      headers: { host: "mindkid.test" },
      socket: { remoteAddress: "127.0.0.1" },
    } as never,
    res as never
  ) as unknown as H3Event;
  securityHeaders(event);
  return new Map(
    Object.entries(res.getHeaders()).map(([k, v]) => [k, String(v)])
  );
}

describe("security-headers middleware", () => {
  it("sets the frame, sniffing, referrer and permissions headers everywhere", () => {
    for (const path of ["/", "/api/guest/health"]) {
      const headers = runMiddleware(path);
      expect(headers.get("x-content-type-options")).toBe("nosniff");
      expect(headers.get("x-frame-options")).toBe("DENY");
      expect(headers.get("referrer-policy")).toBe(
        "strict-origin-when-cross-origin"
      );
      expect(headers.get("permissions-policy")).toContain("camera=()");
    }
  });

  it("locks JSON responses down to default-src 'none'", () => {
    const headers = runMiddleware("/api/guest/health");
    expect(headers.get("content-security-policy")).toBe(
      "default-src 'none'; base-uri 'none'; frame-ancestors 'none'"
    );
  });

  it("negative — never ships 'unsafe-inline' for scripts", () => {
    // Bản trước đặt `script-src 'self' 'unsafe-inline'` cho **mọi** response.
    for (const path of ["/", "/api/guest/health", "/play"]) {
      const csp = runMiddleware(path).get("content-security-policy") ?? "";
      expect(csp).not.toContain("unsafe-inline");
    }
  });

  it("leaves the page CSP to nuxt-security instead of racing it", () => {
    // Đo 2026-08-28 trên dev server: hook `render:response` của nuxt-security
    // ghi đè mọi header ở đây cho response trang. Đặt CSP thứ hai chỉ tạo ra
    // một chính sách chết mà người đọc tưởng là chính sách thật.
    expect(runMiddleware("/").has("content-security-policy")).toBe(false);
    expect(runMiddleware("/levels/abc").has("content-security-policy")).toBe(
      false
    );
  });
});

const SCRIPT_SRC = /"script-src":\s*\[([\s\S]*?)\]/;

describe("nuxt.config CSP — nonce placeholder is required", () => {
  const config = readFileSync(
    join(REPO_ROOT, "apps/web/nuxt.config.ts"),
    "utf8"
  );

  function scriptSrcOf(source: string): string {
    return SCRIPT_SRC.exec(source)?.[1] ?? "";
  }

  it("declares 'nonce-{{nonce}}' so the header carries a real nonce", () => {
    // `defuReplaceArray` **thay** mảng mặc định của nuxt-security. Thiếu chuỗi
    // này thì trang vẫn gắn nonce vào <script> nhưng header không liệt kê nonce
    // nào — hai khối script inline của Nuxt bị chặn và trang không hydrate.
    expect(scriptSrcOf(config)).toContain("'nonce-{{nonce}}'");
    expect(scriptSrcOf(config)).toContain("'strict-dynamic'");
  });

  it("negative — a policy without the placeholder is detected", () => {
    const broken = `"script-src": ["'self'", "'wasm-unsafe-eval'"],`;
    expect(scriptSrcOf(broken)).not.toContain("'nonce-{{nonce}}'");
  });
});
