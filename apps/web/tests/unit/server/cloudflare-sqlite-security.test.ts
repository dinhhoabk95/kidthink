import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { canonicalizeRequestPath } from "@mindkid/shared";
import { createEvent, type H3Event } from "h3";
import { afterEach, describe, expect, it, vi } from "vitest";
import managersAuthCatchAll from "#server/api/auth/managers/[...all]";
import usersAuthCatchAll from "#server/api/auth/users/[...all]";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { getManagerAuth, getUserAuth } from "#server/utils/better-auth";

function buildHttpEvent(options: {
  readonly url: string;
  readonly remoteAddress?: string;
  readonly headers?: Record<string, string>;
}): H3Event {
  const socket = new Socket();
  if (options.remoteAddress !== undefined) {
    Object.defineProperty(socket, "remoteAddress", {
      value: options.remoteAddress,
    });
  }
  const req = new IncomingMessage(socket);
  req.method = "GET";
  req.url = options.url;
  req.headers = {
    host: "localhost:3000",
    ...(options.headers ?? {}),
  };
  const res = new ServerResponse(req);
  return createEvent(req, res);
}

function restoreEnv(key: string, prev: string | undefined): void {
  if (prev === undefined) {
    Reflect.deleteProperty(process.env, key);
  } else {
    process.env[key] = prev;
  }
}

describe("Cloudflare, SQLite DO & Path Canonicalization Security (NEW-1, NEW-6, #24)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("NEW-1: Cloudflare IP verification & Better Auth catch-all header sanitization", () => {
    it("reads cf-connecting-ip when MINDKID_RUNTIME=cloudflare and restores env in finally", () => {
      const prevRuntime = process.env.MINDKID_RUNTIME;
      try {
        process.env.MINDKID_RUNTIME = "cloudflare";

        const cfEvent = buildHttpEvent({
          url: "/api/guest/health",
          remoteAddress: "198.51.100.2",
          headers: {
            "cf-connecting-ip": " 203.0.113.45 ",
            "x-forwarded-for": "198.51.100.99",
            "x-real-ip": "198.51.100.98",
          },
        });
        expect(getVerifiedRemoteIp(cfEvent)).toBe("203.0.113.45");

        const mappedCfEvent = buildHttpEvent({
          url: "/api/guest/health",
          headers: {
            "cf-connecting-ip": "::ffff:203.0.113.46",
          },
        });
        expect(getVerifiedRemoteIp(mappedCfEvent)).toBe("203.0.113.46");

        const missingCfHeaderEvent = buildHttpEvent({
          url: "/api/guest/health",
          remoteAddress: "198.51.100.2",
          headers: {
            "x-forwarded-for": "198.51.100.99",
            "x-real-ip": "198.51.100.98",
          },
        });
        expect(getVerifiedRemoteIp(missingCfHeaderEvent)).toBe("unknown");
      } finally {
        restoreEnv("MINDKID_RUNTIME", prevRuntime);
      }
    });

    it("strips x-forwarded-for and cf-connecting-ip and overwrites x-real-ip in users and managers auth catch-all handlers", async () => {
      const prevRuntime = process.env.MINDKID_RUNTIME;
      let capturedUserReq: Request | undefined;
      let capturedManagerReq: Request | undefined;

      vi.spyOn(getUserAuth(), "handler").mockImplementation((req) => {
        capturedUserReq = req;
        return Promise.resolve(new Response("ok", { status: 200 }));
      });
      vi.spyOn(getManagerAuth(), "handler").mockImplementation((req) => {
        capturedManagerReq = req;
        return Promise.resolve(new Response("ok", { status: 200 }));
      });

      try {
        process.env.MINDKID_RUNTIME = "vps";
        await usersAuthCatchAll(
          buildHttpEvent({
            url: "/api/auth/users/get-session",
            remoteAddress: "198.51.100.22",
            headers: {
              "x-forwarded-for": "1.2.3.4, 10.0.0.1",
              "cf-connecting-ip": "5.6.7.8",
              "x-real-ip": "9.9.9.9",
            },
          })
        );
        expect(capturedUserReq?.headers.get("x-forwarded-for")).toBeNull();
        expect(capturedUserReq?.headers.get("cf-connecting-ip")).toBeNull();
        expect(capturedUserReq?.headers.get("x-real-ip")).toBe("198.51.100.22");

        process.env.MINDKID_RUNTIME = "cloudflare";
        await managersAuthCatchAll(
          buildHttpEvent({
            url: "/api/auth/managers/get-session",
            remoteAddress: "198.51.100.22",
            headers: {
              "x-forwarded-for": "1.2.3.4",
              "cf-connecting-ip": "203.0.113.88",
              "x-real-ip": "9.9.9.9",
            },
          })
        );
        expect(capturedManagerReq?.headers.get("x-forwarded-for")).toBeNull();
        expect(capturedManagerReq?.headers.get("cf-connecting-ip")).toBeNull();
        expect(capturedManagerReq?.headers.get("x-real-ip")).toBe(
          "203.0.113.88"
        );

        await usersAuthCatchAll(
          buildHttpEvent({
            url: "/api/auth/users/get-session",
            headers: {
              "x-forwarded-for": "1.2.3.4",
              "x-real-ip": "9.9.9.9",
            },
          })
        );
        expect(capturedUserReq?.headers.get("x-forwarded-for")).toBeNull();
        expect(capturedUserReq?.headers.get("cf-connecting-ip")).toBeNull();
        expect(capturedUserReq?.headers.get("x-real-ip")).toBeNull();
      } finally {
        restoreEnv("MINDKID_RUNTIME", prevRuntime);
      }
    });
  });

  describe("#24: canonicalizeRequestPath percent-decoding & normalization", () => {
    it("decodes percent-encoded path segments while preserving %25 and %2F/%2f", () => {
      expect(canonicalizeRequestPath("/api/%75sers/children")).toBe(
        "/api/users/children"
      );
      expect(canonicalizeRequestPath("/api/users/%65xports")).toBe(
        "/api/users/exports"
      );
      expect(canonicalizeRequestPath("/api/users/%2565xports")).toBe(
        "/api/users/%2565xports"
      );
      expect(canonicalizeRequestPath("/api/users/a%2Fb")).toBe(
        "/api/users/a%2Fb"
      );
      expect(canonicalizeRequestPath("/api/users/a%2fb")).toBe(
        "/api/users/a%2fb"
      );
      expect(
        canonicalizeRequestPath("/api//%75sers/children/?foo=1#fragment")
      ).toBe("/api/users/children");
    });
  });
});
