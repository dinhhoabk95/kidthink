import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ENV_REGISTRY } from "@mindkid/config";
import { REPO_ROOT } from "@mindkid/config/paths";
import { createEvent } from "h3";
import { describe, expect, it } from "vitest";
import errorHandler from "#server/error";
import corsMiddleware from "#server/middleware/00-cors";
import securityHeaders from "#server/middleware/security-headers";
import { createWebEnv } from "#server/utils/env";

function createResponse() {
  const headers = new Map<string, string | string[]>();
  const res = {
    statusCode: 200,
    headersSent: false,
    writableEnded: false,
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    setHeader: (name: string, value: string | string[]) => {
      if (res.headersSent) {
        throw new Error("Cannot set headers after they are sent to the client");
      }
      headers.set(name.toLowerCase(), value);
    },
    removeHeader: (name: string) => headers.delete(name.toLowerCase()),
    getHeaders: () => Object.fromEntries(headers),
    writeHead: (code: number) => {
      res.statusCode = code;
      res.headersSent = true;
    },
    end: () => {
      res.headersSent = true;
      res.writableEnded = true;
    },
  };
  return res;
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
  );
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

  it("BR-LPV-01 — allows frame-ancestors from allowedOrigins only on /play/preview-sandbox while keeping global frame-ancestors 'self'", () => {
    expect(config).toContain(`"frame-ancestors": ["'self'"]`);
    expect(config).toContain(`"/play/preview-sandbox"`);
    expect(config).toContain(
      `"frame-ancestors": ["'self'", ...allowedOrigins]`
    );
    expect(config).toContain("xFrameOptions: false");

    const nginxSiteConf = readFileSync(
      join(REPO_ROOT, "infra/nginx/mindkid-site.conf.tmpl"),
      "utf8"
    );
    expect(nginxSiteConf).toContain("location = /play/preview-sandbox");
    const sandboxLocationBlock =
      nginxSiteConf
        .split("location = /play/preview-sandbox")[1]
        ?.split("}")[0] ?? "";
    expect(sandboxLocationBlock).not.toContain("X-Frame-Options");
  });

  it("BR-SEC-10 — nuxt.config.ts aligns security.headers with middleware and disables built-in rateLimiter, csrf, and xssValidator", () => {
    expect(config).toContain("nonce: true");
    expect(config).toContain("sri: true");
    expect(config).toContain("hidePoweredBy: true");
    expect(config).toContain('xFrameOptions: "DENY"');
    expect(config).toContain(
      'referrerPolicy: "strict-origin-when-cross-origin"'
    );
    expect(config).toContain("maxAge: 31_536_000");
    expect(config).toContain("includeSubdomains: true");
    expect(config).toContain("preload: true");
    expect(config).toContain("rateLimiter: false");
    expect(config).toContain("csrf: false");
    expect(config).toContain("xssValidator: false");
    expect(config).toContain("corsHandler: false");
  });
});

describe("00-cors middleware & preflight handling", () => {
  it("completes OPTIONS preflight with 204 and returns undefined so h3 does not write headers twice", () => {
    const originalOrigins = process.env.NUXT_ALLOWED_ORIGINS;
    process.env.NUXT_ALLOWED_ORIGINS =
      "http://localhost:3000,http://localhost:3001";
    try {
      const res = createResponse();
      const event = createEvent(
        {
          method: "OPTIONS",
          url: "/api/guest/auth/managers/login",
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3001",
            "access-control-request-method": "POST",
            "access-control-request-headers": "content-type,x-csrf-token",
          },
          socket: { remoteAddress: "127.0.0.1" },
        } as never,
        res as never
      );

      const result = corsMiddleware(event);
      expect(result).toBeUndefined();
      expect(res.statusCode).toBe(204);
      expect(res.writableEnded).toBe(true);
      expect(res.getHeader("access-control-allow-origin")).toBe(
        "http://localhost:3001"
      );
      expect(res.getHeader("access-control-allow-credentials")).toBe("true");
    } finally {
      process.env.NUXT_ALLOWED_ORIGINS = originalOrigins;
    }
  });

  it("does not emit Access-Control-Allow-Origin for disallowed origin or missing Origin header", () => {
    const originalOrigins = process.env.NUXT_ALLOWED_ORIGINS;
    process.env.NUXT_ALLOWED_ORIGINS =
      "http://localhost:3000,http://localhost:3001";
    try {
      const noOriginRes = createResponse();
      const noOriginEvent = createEvent(
        {
          method: "GET",
          url: "/api/guest/health",
          headers: { host: "localhost:3000" },
          socket: { remoteAddress: "127.0.0.1" },
        } as never,
        noOriginRes as never
      );
      corsMiddleware(noOriginEvent);
      expect(
        noOriginRes.getHeader("access-control-allow-origin")
      ).toBeUndefined();

      const evilRes = createResponse();
      const evilEvent = createEvent(
        {
          method: "OPTIONS",
          url: "/api/guest/auth/managers/login",
          headers: {
            host: "localhost:3000",
            origin: "https://evil.example",
            "access-control-request-method": "POST",
          },
          socket: { remoteAddress: "127.0.0.1" },
        } as never,
        evilRes as never
      );
      corsMiddleware(evilEvent);
      expect(evilRes.getHeader("access-control-allow-origin")).toBeUndefined();
    } finally {
      process.env.NUXT_ALLOWED_ORIGINS = originalOrigins;
    }
  });

  it("errorHandler does not throw ERR_HTTP_HEADERS_SENT if response was already ended", () => {
    const res = createResponse();
    res.end();
    const event = createEvent(
      {
        method: "OPTIONS",
        url: "/api/guest/auth/managers/login",
        headers: { host: "localhost:3000" },
        socket: { remoteAddress: "127.0.0.1" },
      } as never,
      res as never
    );
    expect(() =>
      errorHandler(new Error("Simulated post-send error") as never, event)
    ).not.toThrow();
  });
});

describe("@t3-oss/env-nuxt schema synchronization (BR-ENV-01, BR-ENV-08, BR-ENV-11, BR-ENV-13, BR-CFO-12)", () => {
  it("covers every web variable declared in ENV_REGISTRY", () => {
    const envSource = readFileSync(
      join(REPO_ROOT, "apps/web/server/utils/env.ts"),
      "utf8"
    );
    const webVars = ENV_REGISTRY.filter((def) => def.apps.includes("web")).map(
      (def) => def.name
    );
    for (const varName of webVars) {
      expect(
        envSource,
        `Biến ${varName} trong ENV_REGISTRY phải được khai trong apps/web/server/utils/env.ts`
      ).toContain(`${varName}:`);
    }
  });

  it("validates current test environment and blocks client-side access to server variables (BR-CFO-12)", () => {
    const validatedServer = createWebEnv({
      isProduction: false,
      isServer: true,
    });
    expect(validatedServer.SITE_URL).toContain("http");

    const validatedClient = createWebEnv({
      isProduction: false,
      isServer: false,
    });
    expect(() => validatedClient.NUXT_SESSION_PASSWORD).toThrow(
      'Cấm truy cập biến môi trường máy chủ "NUXT_SESSION_PASSWORD" từ trình duyệt (BR-CFO-12)'
    );
  });

  it("BR-ENV-08 & BR-ENV-11 — rejects short secrets without leaking the secret value", () => {
    const original = process.env.NUXT_SESSION_PASSWORD;
    const leakedSecret = "short-secret-value-123";
    process.env.NUXT_SESSION_PASSWORD = leakedSecret;
    try {
      expect(() =>
        createWebEnv({ isProduction: false, isServer: true })
      ).toThrow("NUXT_SESSION_PASSWORD");
      try {
        createWebEnv({ isProduction: false, isServer: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        expect(message).not.toContain(leakedSecret);
      }
    } finally {
      process.env.NUXT_SESSION_PASSWORD = original;
    }
  });

  it("BR-ENV-13 — rejects invalid URL protocol on DATABASE_URL_APP", () => {
    const original = process.env.DATABASE_URL_APP;
    process.env.DATABASE_URL_APP = "https://example.com/not-postgres";
    try {
      expect(() =>
        createWebEnv({ isProduction: false, isServer: true })
      ).toThrow("DATABASE_URL_APP");
    } finally {
      process.env.DATABASE_URL_APP = original;
    }
  });
});
