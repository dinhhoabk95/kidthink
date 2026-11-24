import type { ManagerTokenPayload } from "@mindkid/auth";
import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import {
  requireManagerSession,
  requireManagerSessionForEnrollment,
  requireSuperAdminSession,
} from "../../../server/utils/admin-auth-runtime.js";

function makeEvent(manager: ManagerTokenPayload): H3Event {
  const req = {
    method: "GET",
    url: "/api/managers/dashboard",
    headers: { host: "mindkid.test" },
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = { getHeader: () => undefined, setHeader: () => undefined };
  const event = createEvent(req as never, res as never);
  event.context.manager = manager;
  return event;
}

function makeManager(mfaEnabled: boolean): ManagerTokenPayload {
  return {
    manager_id: 1,
    uuid: "00000000-0000-4000-8000-000000000001",
    email: "root@mindkid.test",
    mfa_enabled: mfaEnabled,
    display_name: "Root",
    session_id: "s1",
    role: "super_admin",
  } as ManagerTokenPayload;
}

describe("BR-ADA-01 — server ép MFA cho Manager", () => {
  it("manager chưa bật MFA bị 403 MFA_ENROLLMENT_REQUIRED trên requireManagerSession", () => {
    const event = makeEvent(makeManager(false));
    expect(() => requireManagerSession(event)).toThrowError(
      expect.objectContaining({
        statusCode: 403,
        data: expect.objectContaining({ code: "MFA_ENROLLMENT_REQUIRED" }),
      })
    );
  });

  it("manager chưa bật MFA bị 403 trên route super_admin", () => {
    const event = makeEvent(makeManager(false));
    expect(() => requireSuperAdminSession(event)).toThrowError(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it("manager đã bật MFA qua", () => {
    const event = makeEvent(makeManager(true));
    expect(requireManagerSession(event).manager_id).toBe(1);
    expect(requireSuperAdminSession(event).manager_id).toBe(1);
  });

  it("route allowlist (reauth) vẫn qua khi chưa bật MFA", () => {
    const event = makeEvent(makeManager(false));
    expect(requireManagerSessionForEnrollment(event).manager_id).toBe(1);
  });
});
