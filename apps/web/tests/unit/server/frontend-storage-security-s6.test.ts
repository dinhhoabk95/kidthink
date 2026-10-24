import fs from "node:fs";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import path from "node:path";
import { H3Event } from "h3";
import { describe, expect, it, vi } from "vitest";

const ROOT_DIR = path.resolve(import.meta.dirname, "../../../../..");

vi.mock("@mindkid/db", () => {
  const selectChain = () => {
    const chain = {
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
      limit: vi.fn(async () => []),
    };
    return chain;
  };
  const mockDb = {
    select: vi.fn(() => selectChain()),
  };
  return {
    getOwnerDb: vi.fn(() => mockDb),
    getDb: vi.fn(() => mockDb),
    auditLogs: {
      id: "id",
      uuid: "uuid",
      actorType: "actor_type",
      actorId: "actor_id",
      action: "action",
      entityType: "entity_type",
      entityId: "entity_id",
      reason: "reason",
      beforeData: "before_data",
      afterData: "after_data",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
    },
  };
});

vi.mock("#server/utils/admin-auth-runtime", () => ({
  requireManagerSession: vi.fn(async () => ({
    manager_id: "1",
    role: "super_admin",
    session_id: "mgr-sess-1",
  })),
}));

function makeEvent(url: string): H3Event {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.method = "GET";
  req.url = url;
  const res = new ServerResponse(req);
  return new H3Event(req, res);
}

describe("Slice S6 Security Fixes ([M-07], [M-09], [M-10], [M-12], [L-05..L-07])", () => {
  it("[M-07] consent-required.vue uses sanitizeRedirectTarget from @mindkid/shared/client", () => {
    const source = fs.readFileSync(
      path.join(ROOT_DIR, "apps/web/app/pages/consent-required.vue"),
      "utf-8"
    );
    expect(source).toContain("sanitizeRedirectTarget");
  });

  it("[M-09] preview-sandbox.vue validates originUrl.protocol and port when matching baseDomain", () => {
    const source = fs.readFileSync(
      path.join(ROOT_DIR, "apps/web/app/pages/play/preview-sandbox.vue"),
      "utf-8"
    );
    expect(source).toContain("originUrl.protocol === window.location.protocol");
    expect(source).toContain("originUrl.port === window.location.port");
  });

  it("[M-10] parent-gate-modal.vue does not fallback to generateLocalChallenge when server challenge fails", () => {
    const source = fs.readFileSync(
      path.join(ROOT_DIR, "apps/web/app/components/parent-gate-modal.vue"),
      "utf-8"
    );
    const serverTryCatch =
      source
        .split('"/api/users/parent-gate/challenge"')[1]
        ?.split("function markVerified")[0] ?? "";
    expect(serverTryCatch).not.toContain("generateLocalChallenge()");
    expect(source).toContain(
      "props.clientOnly && localExpectedAnswer.value !== null"
    );
  });

  it("[M-12] GET /api/managers/audit-logs rejects invalid date range strings and enforces limit <= 200", async () => {
    const { default: auditLogsHandler } = await import(
      "#server/api/managers/audit-logs/index.get"
    );

    const invalidDateEvent = makeEvent(
      "/api/managers/audit-logs?from=not-a-valid-date"
    );
    await expect(auditLogsHandler(invalidDateEvent)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      statusCode: 422,
    });

    const invertedRangeEvent = makeEvent(
      "/api/managers/audit-logs?from=2026-10-20T00:00:00Z&to=2026-10-10T00:00:00Z"
    );
    await expect(auditLogsHandler(invertedRangeEvent)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      statusCode: 422,
    });

    const cappedLimitEvent = makeEvent("/api/managers/audit-logs?limit=999");
    const result = await auditLogsHandler(cappedLimitEvent);
    expect(result.limit).toBe(200);
  });

  it("[L-05 & L-07] mindkid-admin.conf.tmpl declares Content-Security-Policy and pnpm-workspace.yaml removes jose", () => {
    const nginxAdmin = fs.readFileSync(
      path.join(ROOT_DIR, "infra/nginx/mindkid-admin.conf.tmpl"),
      "utf-8"
    );
    expect(nginxAdmin).toContain("add_header Content-Security-Policy");

    const workspaceYaml = fs.readFileSync(
      path.join(ROOT_DIR, "pnpm-workspace.yaml"),
      "utf-8"
    );
    expect(workspaceYaml).not.toContain("jose:");
  });
});
