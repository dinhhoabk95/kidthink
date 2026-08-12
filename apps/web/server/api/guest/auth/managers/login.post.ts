import {
  appError,
  createMfaChallengeToken,
  verifyPassword,
} from "@kidthink/auth";
import { getOwnerDb, managers, writeAudit } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import {
  getAdminJwtSecret,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event).catch(() => null)) || event._body || {};
    const { email, password } = body;

    if (
      !(email && password) ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      throw appError("INVALID_CREDENTIALS");
    }

    const db = getOwnerDb();
    const [manager] = await db
      .select()
      .from(managers)
      .where(eq(managers.email, email.trim().toLowerCase()));

    if (!manager?.passwordHash) {
      // Record audit for failed login
      await db.transaction(async (tx) => {
        await writeAudit(tx, {
          actor_type: "system",
          action: "manager_login_failed",
          entity_type: "manager",
          entity_id: "0",
          reason: "Unknown manager or invalid password",
        });
      });
      throw appError("INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(password, manager.passwordHash);
    if (!isValid) {
      await db.transaction(async (tx) => {
        await writeAudit(tx, {
          actor_type: "manager",
          actor_id: manager.id,
          action: "manager_login_failed",
          entity_type: "manager",
          entity_id: manager.id.toString(),
          reason: "Invalid password",
        });
      });
      throw appError("INVALID_CREDENTIALS");
    }

    if (!manager.isActive) {
      throw appError("INSUFFICIENT_ROLE");
    }

    // Password valid! Create 5-minute single-purpose MFA challenge token
    const challenge = await createMfaChallengeToken({
      managerId: manager.id,
      email: manager.email,
      secret: getAdminJwtSecret(event),
    });

    if (
      event?.node?.res?.setHeader ||
      event?.node?.res?.statusCode !== undefined
    ) {
      setResponseStatus(event, 428);
    }

    return {
      status: "MFA_REQUIRED",
      challenge,
      mfa_enabled: manager.mfaEnabled,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
