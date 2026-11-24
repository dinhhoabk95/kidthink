import { and, eq, sql } from "drizzle-orm";
import {
  MFA_RECOVERY_STATUS,
  type MfaRecoveryStatus,
} from "#src/constants/identity-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  ACCOUNT_SENSITIVE_KEYS,
  MFA_RECOVERY_SENSITIVE_KEYS,
  omitKeys,
  PUBLIC_MANAGER_ACCOUNT_COLUMNS,
  PUBLIC_MFA_RECOVERY_COLUMNS,
  PUBLIC_TWO_FACTOR_COLUMNS,
  PUBLIC_USER_ACCOUNT_COLUMNS,
  type PublicManagerAccount,
  type PublicManagerTwoFactor,
  type PublicMfaRecoveryRequest,
  type PublicUserAccount,
  type PublicUserTwoFactor,
} from "#src/repositories/sensitive";
import {
  clampLimit,
  escapeLike,
  requireFirst,
  toDate,
  toNullableDate,
} from "#src/repositories/utils";
import {
  type managerAccounts,
  type managerTwoFactors,
  mfaRecoveryRequests,
  userAccounts,
  userPasskeys,
  userTwoFactors,
  userVerifications,
} from "#src/schema/index";

export type UserAccountEntity = PublicUserAccount;
export type UserAccountAuthEntity = typeof userAccounts.$inferSelect;
export type ManagerAccountEntity = PublicManagerAccount;
export type ManagerAccountAuthEntity = typeof managerAccounts.$inferSelect;
export type UserVerificationEntity = typeof userVerifications.$inferSelect;
export type UserTwoFactorEntity = PublicUserTwoFactor;
export type UserTwoFactorAuthEntity = typeof userTwoFactors.$inferSelect;
export type ManagerTwoFactorEntity = PublicManagerTwoFactor;
export type ManagerTwoFactorAuthEntity = typeof managerTwoFactors.$inferSelect;
export type UserPasskeyEntity = typeof userPasskeys.$inferSelect;
export type MfaRecoveryRequestEntity = PublicMfaRecoveryRequest;
export type MfaRecoveryRequestAuthEntity =
  typeof mfaRecoveryRequests.$inferSelect;

export interface CreateUserVerificationInput {
  readonly identifier: string;
  readonly value: string;
  readonly expiresAt: Date;
  readonly createdAt?: Date;
}

export interface CreateMfaRecoveryInput {
  readonly uuid?: string;
  readonly userId: number;
  readonly requestedByManagerId: number;
  readonly reason: string;
  readonly verificationTokenHash?: string | null;
  readonly verificationTokenExpiresAt?: Date | string | null;
  readonly eligibleAt: Date | string;
  readonly status?: MfaRecoveryStatus;
  readonly createdAt?: Date;
}

export class AuthAccountsRepository extends BaseRepository {
  async listUserAccounts(userId: number): Promise<UserAccountEntity[]> {
    return await this.db.query.userAccounts.findMany({
      columns: PUBLIC_USER_ACCOUNT_COLUMNS,
      where: { userId },
      orderBy: { id: "asc" },
    });
  }

  async listSocialAccountsForUser(
    userId: number,
    providers: readonly string[] = ["google", "facebook"]
  ): Promise<UserAccountEntity[]> {
    if (providers.length === 0) {
      return [];
    }
    return await this.db.query.userAccounts.findMany({
      columns: PUBLIC_USER_ACCOUNT_COLUMNS,
      where: { userId, providerId: { in: [...providers] } },
      orderBy: { id: "asc" },
    });
  }

  async findUserCredentialAccount(
    userId: number
  ): Promise<UserAccountEntity | null> {
    return (
      (await this.db.query.userAccounts.findFirst({
        columns: PUBLIC_USER_ACCOUNT_COLUMNS,
        where: { userId, providerId: "credential" },
      })) ?? null
    );
  }

  async findUserCredentialAccountForAuth(
    userId: number
  ): Promise<UserAccountAuthEntity | null> {
    return (
      (await this.db.query.userAccounts.findFirst({
        where: { userId, providerId: "credential" },
      })) ?? null
    );
  }

  async countUserPasskeys(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(userPasskeys)
      .where(eq(userPasskeys.userId, userId));
    return Number(row?.total ?? 0);
  }

  async countUserLoginMethods(userId: number): Promise<number> {
    const [accRow, pkCount] = await Promise.all([
      this.db
        .select({ total: sql<number>`COUNT(*)` })
        .from(userAccounts)
        .where(eq(userAccounts.userId, userId)),
      this.countUserPasskeys(userId),
    ]);
    return Number(accRow[0]?.total ?? 0) + pkCount;
  }

  async deleteUserAccountById(
    accountId: number,
    userId: number
  ): Promise<boolean> {
    const deleted = await this.db
      .delete(userAccounts)
      .where(
        and(eq(userAccounts.id, accountId), eq(userAccounts.userId, userId))
      )
      .returning({ id: userAccounts.id });
    return deleted.length > 0;
  }

  async deleteUserTwoFactors(userId: number): Promise<number> {
    const deleted = await this.db
      .delete(userTwoFactors)
      .where(eq(userTwoFactors.userId, userId))
      .returning({ id: userTwoFactors.id });
    return deleted.length;
  }

  async findLatestUserVerification(
    identifier: string
  ): Promise<UserVerificationEntity | null> {
    return (
      (await this.db.query.userVerifications.findFirst({
        where: { identifier },
        orderBy: { createdAt: "desc", id: "desc" },
      })) ?? null
    );
  }

  async deleteUserVerificationsByIdentifier(
    identifier: string
  ): Promise<number> {
    const deleted = await this.db
      .delete(userVerifications)
      .where(eq(userVerifications.identifier, identifier))
      .returning({ id: userVerifications.id });
    return deleted.length;
  }

  async findUserTwoFactor(userId: number): Promise<UserTwoFactorEntity | null> {
    return (
      (await this.db.query.userTwoFactors.findFirst({
        columns: PUBLIC_TWO_FACTOR_COLUMNS,
        where: { userId },
      })) ?? null
    );
  }

  async findUserTwoFactorForAuth(
    userId: number
  ): Promise<UserTwoFactorAuthEntity | null> {
    return (
      (await this.db.query.userTwoFactors.findFirst({
        where: { userId },
      })) ?? null
    );
  }

  async findManagerTwoFactor(
    managerId: number
  ): Promise<ManagerTwoFactorEntity | null> {
    return (
      (await this.db.query.managerTwoFactors.findFirst({
        columns: PUBLIC_TWO_FACTOR_COLUMNS,
        where: { userId: managerId },
      })) ?? null
    );
  }

  async findManagerTwoFactorForAuth(
    managerId: number
  ): Promise<ManagerTwoFactorAuthEntity | null> {
    return (
      (await this.db.query.managerTwoFactors.findFirst({
        where: { userId: managerId },
      })) ?? null
    );
  }

  async findManagerCredentialAccount(
    managerId: number
  ): Promise<ManagerAccountEntity | null> {
    return (
      (await this.db.query.managerAccounts.findFirst({
        columns: PUBLIC_MANAGER_ACCOUNT_COLUMNS,
        where: { userId: managerId, providerId: "credential" },
      })) ?? null
    );
  }

  async findManagerCredentialAccountForAuth(
    managerId: number
  ): Promise<ManagerAccountAuthEntity | null> {
    return (
      (await this.db.query.managerAccounts.findFirst({
        where: { userId: managerId, providerId: "credential" },
      })) ?? null
    );
  }

  async createUserVerification(
    input: CreateUserVerificationInput
  ): Promise<UserVerificationEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(userVerifications)
        .values({
          identifier: input.identifier,
          value: input.value,
          expiresAt: input.expiresAt,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to insert user verification"
    );
  }

  async findActiveUserVerification(
    identifier: string,
    now: Date = new Date()
  ): Promise<UserVerificationEntity | null> {
    return (
      (await this.db.query.userVerifications.findFirst({
        where: { identifier, expiresAt: { gt: now } },
        orderBy: { createdAt: "desc", id: "desc" },
      })) ?? null
    );
  }

  async listActiveUserVerificationsByPrefix(
    prefix: string,
    now: Date = new Date(),
    limit = 50
  ): Promise<UserVerificationEntity[]> {
    const clamped = clampLimit(limit, 50, 200);
    const pattern = `${escapeLike(prefix)}%`;
    return await this.db.query.userVerifications.findMany({
      where: {
        expiresAt: { gt: now },
        RAW: (v) => sql`${v.identifier} LIKE ${pattern} ESCAPE '\\'`,
      },
      orderBy: { createdAt: "desc", id: "desc" },
      limit: clamped,
    });
  }

  async deleteUserVerificationById(id: number): Promise<boolean> {
    const deleted = await this.db
      .delete(userVerifications)
      .where(eq(userVerifications.id, id))
      .returning({ id: userVerifications.id });
    return deleted.length > 0;
  }

  async upsertUserCredentialAccount(
    userId: number,
    passwordHash: string,
    now: Date = new Date()
  ): Promise<UserAccountEntity> {
    const row = await requireFirst(
      this.db
        .insert(userAccounts)
        .values({
          accountId: String(userId),
          providerId: "credential",
          userId,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [userAccounts.userId, userAccounts.providerId],
          set: { password: passwordHash, updatedAt: now },
        })
        .returning(),
      "Failed to upsert user credential account"
    );
    return omitKeys(row, ACCOUNT_SENSITIVE_KEYS);
  }
}

function toPublicMfaRecovery(
  row: MfaRecoveryRequestAuthEntity
): MfaRecoveryRequestEntity {
  return omitKeys(row, MFA_RECOVERY_SENSITIVE_KEYS);
}

export class MfaRecoveryRepository extends BaseRepository {
  async createRequest(
    input: CreateMfaRecoveryInput
  ): Promise<MfaRecoveryRequestEntity> {
    const now = input.createdAt ?? new Date();
    const row = await requireFirst(
      this.db
        .insert(mfaRecoveryRequests)
        .values({
          ...(input.uuid ? { uuid: input.uuid } : {}),
          userId: input.userId,
          status: input.status ?? MFA_RECOVERY_STATUS.PENDING_VERIFICATION,
          requestedByManagerId: input.requestedByManagerId,
          reason: input.reason,
          verificationTokenHash: input.verificationTokenHash ?? null,
          verificationTokenExpiresAt: toNullableDate(
            input.verificationTokenExpiresAt
          ),
          eligibleAt: toDate(input.eligibleAt),
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to insert MFA recovery request"
    );
    return toPublicMfaRecovery(row);
  }

  async findByUuid(uuid: string): Promise<MfaRecoveryRequestEntity | null> {
    return (
      (await this.db.query.mfaRecoveryRequests.findFirst({
        columns: PUBLIC_MFA_RECOVERY_COLUMNS,
        where: { uuid },
      })) ?? null
    );
  }

  async findByUuidForUser(
    uuid: string,
    userId: number
  ): Promise<MfaRecoveryRequestEntity | null> {
    return (
      (await this.db.query.mfaRecoveryRequests.findFirst({
        columns: PUBLIC_MFA_RECOVERY_COLUMNS,
        where: { uuid, userId },
      })) ?? null
    );
  }

  async findByTokenHash(
    tokenHash: string
  ): Promise<MfaRecoveryRequestEntity | null> {
    return (
      (await this.db.query.mfaRecoveryRequests.findFirst({
        columns: PUBLIC_MFA_RECOVERY_COLUMNS,
        where: { verificationTokenHash: tokenHash },
      })) ?? null
    );
  }

  async findByTokenHashForAuth(
    tokenHash: string
  ): Promise<MfaRecoveryRequestAuthEntity | null> {
    return (
      (await this.db.query.mfaRecoveryRequests.findFirst({
        where: { verificationTokenHash: tokenHash },
      })) ?? null
    );
  }

  async listByUser(userId: number): Promise<MfaRecoveryRequestEntity[]> {
    return await this.db.query.mfaRecoveryRequests.findMany({
      columns: PUBLIC_MFA_RECOVERY_COLUMNS,
      where: { userId },
      orderBy: { createdAt: "desc", id: "desc" },
    });
  }

  async markEmailVerified(
    id: number,
    now: Date = new Date()
  ): Promise<MfaRecoveryRequestEntity | null> {
    const [row] = await this.db
      .update(mfaRecoveryRequests)
      .set({
        status: MFA_RECOVERY_STATUS.WAITING,
        emailVerifiedAt: now,
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
        updatedAt: now,
      })
      .where(eq(mfaRecoveryRequests.id, id))
      .returning();
    return row ? toPublicMfaRecovery(row) : null;
  }

  async markCompleted(
    id: number,
    managerId: number,
    now: Date = new Date()
  ): Promise<MfaRecoveryRequestEntity | null> {
    const [row] = await this.db
      .update(mfaRecoveryRequests)
      .set({
        status: MFA_RECOVERY_STATUS.COMPLETED,
        completedAt: now,
        completedByManagerId: managerId,
        updatedAt: now,
      })
      .where(eq(mfaRecoveryRequests.id, id))
      .returning();
    return row ? toPublicMfaRecovery(row) : null;
  }

  async markCancelled(
    id: number,
    now: Date = new Date()
  ): Promise<MfaRecoveryRequestEntity | null> {
    const [row] = await this.db
      .update(mfaRecoveryRequests)
      .set({
        status: MFA_RECOVERY_STATUS.CANCELLED,
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(mfaRecoveryRequests.id, id))
      .returning();
    return row ? toPublicMfaRecovery(row) : null;
  }
}
