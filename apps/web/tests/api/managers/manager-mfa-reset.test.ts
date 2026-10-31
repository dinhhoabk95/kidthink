import {
  encryptTotpSecret,
  generateTotpSecret,
  getBrowserSessionService,
  hashPassword,
  hashRecoveryCode,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  auditLogs,
  getOwnerDb,
  managers,
  mfaRecoveryCodes,
  mfaSettings,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import resetMfaHandler from "#server/api/managers/managers/[uuid]/reset-mfa.post";

// UC-010: Super Admin đặt lại xác thực hai lớp của Manager khác. Cần Postgres.
const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

interface Actor {
  id: number;
  uuid: string;
}

let admin: Actor = { id: 0, uuid: "" };
let reviewer: Actor = { id: 0, uuid: "" };
let target: Actor = { id: 0, uuid: "" };
let plain: Actor = { id: 0, uuid: "" };

async function createManager(tag: string, mfaEnabled: boolean): Promise<Actor> {
  const db = getOwnerDb();
  const [row] = await db
    .insert(managers)
    .values({
      email: `mfa-reset-${tag}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@mindkid.vn`,
      passwordHash: await hashPassword("AdminPassword123!"),
      displayName: tag,
      role: "super_admin",
      isActive: true,
      mfaEnabled,
    })
    .returning({ id: managers.id, uuid: managers.uuid });
  return row;
}

beforeAll(async () => {
  admin = await createManager("admin", true);
  reviewer = await createManager("reviewer", true);
  target = await createManager("target", true);
  plain = await createManager("plain", false);

  const db = getOwnerDb();
  await db.insert(mfaSettings).values({
    accountType: "manager",
    accountId: target.id,
    secretEncrypted: encryptTotpSecret(
      generateTotpSecret(),
      requireEnv("MFA_ENCRYPTION_KEY")
    ),
    confirmedAt: new Date(),
  });
  await db.insert(mfaRecoveryCodes).values({
    accountType: "manager",
    accountId: target.id,
    codeHash: hashRecoveryCode("AAAA-BBBB"),
  });
});

afterAll(async () => {
  const db = getOwnerDb();
  for (const m of [admin, reviewer, target, plain]) {
    await db
      .delete(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "manager"),
          eq(mfaSettings.accountId, m.id)
        )
      )
      .catch(() => undefined);
    await db
      .delete(managers)
      .where(eq(managers.id, m.id))
      .catch(() => undefined);
  }
});

function eventFor(
  actor: Actor,
  role: "super_admin" | "content_reviewer",
  targetUuid: string,
  reauthAt: Date | null
) {
  return {
    method: "POST",
    node: {
      req: {
        method: "POST",
        url: "/api/managers/managers/x/reset-mfa",
        headers: {
          "user-agent": "VitestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
      },
      res: { statusCode: 200, setHeader: () => undefined },
    },
    context: {
      manager: {
        manager_id: actor.id,
        display_name: "x",
        role,
        session_id: `sess_${actor.id}`,
        reauth_at: reauthAt ?? undefined,
      },
      params: { uuid: targetUuid },
    },
  } as never;
}

async function statusOf(code: () => Promise<unknown>): Promise<number> {
  try {
    await code();
  } catch (err) {
    const e = err as { statusCode?: number; status?: number };
    return e.statusCode ?? e.status ?? 0;
  }
  return 200;
}

describe("UC-010 Super Admin đặt lại MFA của Manager", () => {
  it("A1/BR-002: vai trò khác Super Admin bị từ chối, MFA không đổi", async () => {
    const status = await statusOf(() =>
      resetMfaHandler(
        eventFor(reviewer, "content_reviewer", target.uuid, new Date())
      )
    );
    expect(status).toBe(403);
    const [row] = await getOwnerDb()
      .select()
      .from(managers)
      .where(eq(managers.id, target.id));
    expect(row.mfaEnabled).toBe(true);
  });

  it("A2/BR-003: quá 5 phút xác minh lại thì 428 và MFA không đổi", async () => {
    const stale = new Date(Date.now() - 10 * 60 * 1000);
    expect(
      await statusOf(() =>
        resetMfaHandler(eventFor(admin, "super_admin", target.uuid, stale))
      )
    ).toBe(428);
    expect(
      await statusOf(() =>
        resetMfaHandler(eventFor(admin, "super_admin", target.uuid, null))
      )
    ).toBe(428);
  });

  it("không tự đặt lại chính mình và không đặt lại Manager chưa bật MFA", async () => {
    expect(
      await statusOf(() =>
        resetMfaHandler(eventFor(admin, "super_admin", admin.uuid, new Date()))
      )
    ).toBeGreaterThanOrEqual(400);
    expect(
      await statusOf(() =>
        resetMfaHandler(eventFor(admin, "super_admin", plain.uuid, new Date()))
      )
    ).toBeGreaterThanOrEqual(400);
  });

  it("BR-001: đặt lại xoá MFA và mã khôi phục, thu hồi phiên, ghi audit ai-cho-ai", async () => {
    const db = getOwnerDb();
    const sessions = getBrowserSessionService();
    const old = await sessions.create({
      namespace: "manager",
      accountId: target.id,
      displayName: "target",
      role: "content_reviewer",
      rememberMe: true,
    });

    const res = (await resetMfaHandler(
      eventFor(admin, "super_admin", target.uuid, new Date())
    )) as { success: boolean };
    expect(res.success).toBe(true);

    const [row] = await db
      .select()
      .from(managers)
      .where(eq(managers.id, target.id));
    expect(row.mfaEnabled).toBe(false);

    const settings = await db
      .select()
      .from(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "manager"),
          eq(mfaSettings.accountId, target.id)
        )
      );
    expect(settings).toHaveLength(0);
    const codes = await db
      .select()
      .from(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.accountType, "manager"),
          eq(mfaRecoveryCodes.accountId, target.id)
        )
      );
    expect(codes).toHaveLength(0);

    expect(await sessions.resolve("manager", old.sessionToken)).toBeNull();

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "manager_mfa_reset"));
    expect(
      logs.some(
        (l) => l.actorId === admin.id && l.entityId === target.id.toString()
      )
    ).toBe(true);
  });
});
