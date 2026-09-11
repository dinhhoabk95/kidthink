import { createEvent, type H3Event } from "h3";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { defineApiRoute } from "../../server/utils/define-api-route.js";

const mockRequireWebUserSession = vi.fn();
const mockRequireManagerSession = vi.fn();
const mockRequireSuperAdminSession = vi.fn();

vi.mock("../../server/utils/auth-runtime.js", () => ({
  requireWebUserSession: (event: H3Event) => mockRequireWebUserSession(event),
}));

vi.mock("../../server/utils/admin-auth-runtime.js", () => ({
  requireManagerSession: (event: H3Event) => mockRequireManagerSession(event),
  requireSuperAdminSession: (event: H3Event) =>
    mockRequireSuperAdminSession(event),
}));

function makeEvent(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, string | number | boolean | null>;
}): H3Event {
  const req = {
    method: options.method ?? "GET",
    url: options.url ?? "/api/test",
    headers: { host: "mindkid.test", ...options.headers },
    socket: { remoteAddress: "127.0.0.1" },
  };
  let statusCode = 200;
  const res = {
    getHeader: () => undefined,
    setHeader: () => undefined,
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
  };
  const event = createEvent(req as never, res as never);
  if (options.body) {
    event.context.body = options.body;
  }
  return event;
}

describe("defineApiRoute", () => {
  describe("auth modes", () => {
    it("guest mode does not call any session guard", async () => {
      const handler = defineApiRoute({
        auth: "guest",
        handler: ({ auth }) => ({ auth }),
      });
      const event = makeEvent({});
      const result = await handler(event);
      expect(result).toEqual({ auth: null });
      expect(mockRequireWebUserSession).not.toHaveBeenCalled();
      expect(mockRequireManagerSession).not.toHaveBeenCalled();
      expect(mockRequireSuperAdminSession).not.toHaveBeenCalled();
    });

    it("user mode calls requireWebUserSession", async () => {
      const mockUser = {
        user_id: 10,
        display_name: "Test",
        session_id: "s1",
      };
      mockRequireWebUserSession.mockResolvedValueOnce(mockUser);

      const handler = defineApiRoute({
        auth: "user",
        handler: ({ auth }) => ({ userId: auth.user_id }),
      });
      const event = makeEvent({});
      const result = await handler(event);
      expect(mockRequireWebUserSession).toHaveBeenCalledWith(event);
      expect(result).toEqual({ userId: 10 });
    });

    it("manager mode calls requireManagerSession", async () => {
      const mockManager = {
        manager_id: 5,
        display_name: "Admin",
        session_id: "s2",
        role: "content_reviewer" as const,
      };
      mockRequireManagerSession.mockResolvedValueOnce(mockManager);

      const handler = defineApiRoute({
        auth: "manager",
        handler: ({ auth }) => ({ managerId: auth.manager_id }),
      });
      const event = makeEvent({});
      const result = await handler(event);
      expect(mockRequireManagerSession).toHaveBeenCalledWith(event);
      expect(result).toEqual({ managerId: 5 });
    });

    it("super_admin mode calls requireSuperAdminSession", async () => {
      const mockSuperAdmin = {
        manager_id: 1,
        display_name: "Root",
        session_id: "s3",
        role: "super_admin" as const,
      };
      mockRequireSuperAdminSession.mockResolvedValueOnce(mockSuperAdmin);

      const handler = defineApiRoute({
        auth: "super_admin",
        handler: ({ auth }) => ({ role: auth.role }),
      });
      const event = makeEvent({});
      const result = await handler(event);
      expect(mockRequireSuperAdminSession).toHaveBeenCalledWith(event);
      expect(result).toEqual({ role: "super_admin" });
    });
  });

  describe("query & body validation", () => {
    it("parses valid query and passes to handler", async () => {
      const querySchema = z.object({
        page: z.coerce.number().default(1),
        search: z.string().optional(),
      });
      const handler = defineApiRoute({
        auth: "guest",
        query: querySchema,
        handler: ({ query }) => ({ query }),
      });
      const event = makeEvent({ url: "/api/test?page=3&search=hello" });
      const result = await handler(event);
      expect(result).toEqual({ query: { page: 3, search: "hello" } });
    });

    it("throws 422 ValidationError when query is invalid", async () => {
      const querySchema = z.object({
        page: z.coerce.number().min(1),
      });
      const handler = defineApiRoute({
        auth: "guest",
        query: querySchema,
        handler: () => ({ ok: true }),
      });
      const event = makeEvent({ url: "/api/test?page=0" });
      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it("parses valid body and passes to handler", async () => {
      const bodySchema = z.object({
        title: z.string().min(1),
      });
      const handler = defineApiRoute({
        auth: "guest",
        body: bodySchema,
        handler: ({ body }) => ({ title: body.title }),
      });
      const event = makeEvent({
        method: "POST",
        body: { title: "Test Title" },
      });
      const result = await handler(event);
      expect(result).toEqual({ title: "Test Title" });
    });

    it("throws 422 ValidationError when body is invalid", async () => {
      const bodySchema = z.object({
        title: z.string().min(3),
      });
      const handler = defineApiRoute({
        auth: "guest",
        body: bodySchema,
        handler: () => ({ ok: true }),
      });
      const event = makeEvent({
        method: "POST",
        body: { title: "a" },
      });
      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 422,
      });
    });
  });

  describe("maxBodyBytes option (C5)", () => {
    it("throws 413 PayloadTooLargeError when body exceeds maxBodyBytes", async () => {
      const handler = defineApiRoute({
        auth: "guest",
        body: z.object({ note: z.string().optional() }),
        maxBodyBytes: 1024,
        handler: () => ({ ok: true }),
      });
      const event = makeEvent({
        method: "POST",
        headers: { "content-length": "2048" },
      });
      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 413,
      });
    });
  });

  describe("status option", () => {
    it("sets custom response status code on success", async () => {
      const handler = defineApiRoute({
        auth: "guest",
        status: 201,
        handler: () => ({ created: true }),
      });
      const event = makeEvent({});
      const result = await handler(event);
      expect(result).toEqual({ created: true });
      expect(event.node.res.statusCode).toBe(201);
    });

    it("does not set custom status when handler throws (I11)", async () => {
      const handler = defineApiRoute({
        auth: "guest",
        status: 201,
        handler: () => {
          throw new Error("handler failed");
        },
      });
      const event = makeEvent({});
      await expect(handler(event)).rejects.toThrow("handler failed");
      expect(event.node.res.statusCode).toBe(200);
    });
  });
});
