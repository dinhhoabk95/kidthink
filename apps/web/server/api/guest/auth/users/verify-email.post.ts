import { hashSecureToken } from "@mindkid/auth";
import { getAppDb, users, verificationTokens } from "@mindkid/db";
import { TokenExpiredError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, type H3Event, readBody } from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  assertSameOriginRequest,
} from "#server/utils/auth-runtime";

const VerifyEmailSchema = z
  .object({ token: z.string().trim().min(1).max(512) })
  .strict();

export async function handleVerifyEmail(event: H3Event, testBody?: unknown) {
  assertSameOriginRequest(event);
  assertRequestBodySize(event, 16 * 1024);
  const rawBody =
    testBody ??
    event.context?.body ??
    (await readBody(event).catch(() => null));

  if (!rawBody || typeof rawBody !== "object") {
    throw new ValidationError({
      reason: "Dữ liệu yêu cầu không hợp lệ.",
    });
  }

  const parsed = VerifyEmailSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError();
  }
  const token = parsed.data.token;

  const db = getAppDb();
  const tokenHash = hashSecureToken(token);

  const tokenRows = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, tokenHash),
        eq(verificationTokens.accountType, "user"),
        eq(verificationTokens.purpose, "email_verify")
      )
    );

  if (tokenRows.length === 0) {
    // BR-EVF-05: Generic NOT_FOUND error, never leak token or email
    throw new NotFoundError();
  }

  const vToken = tokenRows[0];
  if (!vToken) {
    throw new NotFoundError();
  }
  const now = new Date();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, vToken.accountId));

  if (!user) {
    throw new NotFoundError();
  }

  // BR-EVF-04: If token already used BUT user is active, return active smoothly
  if (vToken.usedAt !== null) {
    if (user.status === "active") {
      return { status: "active" };
    }
    throw new TokenExpiredError();
  }

  // Check expiration
  if (vToken.expiresAt <= now) {
    throw new TokenExpiredError();
  }

  await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(verificationTokens.id, vToken.id),
          eq(verificationTokens.accountType, "user"),
          eq(verificationTokens.purpose, "email_verify"),
          isNull(verificationTokens.usedAt)
        )
      )
      .returning({ id: verificationTokens.id });
    if (!claimed) {
      if (user.status === "active") {
        return;
      }
      throw new TokenExpiredError();
    }

    await tx
      .update(users)
      .set({
        status: "active",
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));
  });

  return { status: "active" };
}

export default defineEventHandler((event) => handleVerifyEmail(event));
