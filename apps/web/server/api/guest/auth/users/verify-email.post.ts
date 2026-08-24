import { appError, hashSecureToken } from "@mindkid/auth";
import { getAppDb, users, verificationTokens } from "@mindkid/db";
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
    throw appError("VALIDATION_FAILED", {
      reason: "Dữ liệu yêu cầu không hợp lệ.",
    });
  }

  const parsed = VerifyEmailSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw appError("VALIDATION_FAILED");
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
    throw appError("NOT_FOUND");
  }

  const vToken = tokenRows[0];
  const now = new Date();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, vToken.accountId));

  if (!user) {
    throw appError("NOT_FOUND");
  }

  // BR-EVF-04: If token already used BUT user is active, return active smoothly
  if (vToken.usedAt !== null) {
    if (user.status === "active") {
      return { status: "active" };
    }
    throw appError("TOKEN_EXPIRED");
  }

  // Check expiration
  if (vToken.expiresAt <= now) {
    throw appError("TOKEN_EXPIRED");
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
      throw appError("TOKEN_EXPIRED");
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
