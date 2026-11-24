import { eq, sql } from "drizzle-orm";
import type { ManagerRole } from "#src/constants/identity-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  MANAGER_SENSITIVE_KEYS,
  omitKeys,
  PUBLIC_MANAGER_COLUMNS,
  type PublicManager,
} from "#src/repositories/sensitive";
import { ciEquals, requireFirst } from "#src/repositories/utils";
import { managers, managerTwoFactors } from "#src/schema/index";

export type ManagerEntity = PublicManager;
export type ManagerAuthEntity = typeof managers.$inferSelect;

export interface CreateManagerInput {
  readonly uuid?: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly displayName: string;
  readonly emailVerified?: boolean;
  readonly image?: string | null;
  readonly role: ManagerRole;
  readonly mfaEnabled?: boolean;
  readonly isActive?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface ManagerStatusSnapshot {
  readonly id: number;
  readonly uuid: string;
  readonly isActive: boolean;
  readonly role: ManagerRole;
  readonly sessionVersion: number;
}

function toPublicManager(row: ManagerAuthEntity): ManagerEntity {
  return omitKeys(row, MANAGER_SENSITIVE_KEYS);
}

export class ManagersRepository extends BaseRepository {
  async findById(id: number): Promise<ManagerEntity | null> {
    return (
      (await this.db.query.managers.findFirst({
        columns: PUBLIC_MANAGER_COLUMNS,
        where: { id },
      })) ?? null
    );
  }

  async findForAuthById(id: number): Promise<ManagerAuthEntity | null> {
    return (
      (await this.db.query.managers.findFirst({
        where: { id },
      })) ?? null
    );
  }

  async findByUuid(uuid: string): Promise<ManagerEntity | null> {
    return (
      (await this.db.query.managers.findFirst({
        columns: PUBLIC_MANAGER_COLUMNS,
        where: { uuid },
      })) ?? null
    );
  }

  async findByEmail(email: string): Promise<ManagerEntity | null> {
    return (
      (await this.db.query.managers.findFirst({
        columns: PUBLIC_MANAGER_COLUMNS,
        where: { RAW: (m) => ciEquals(m.email, email) },
      })) ?? null
    );
  }

  async findForAuthByEmail(email: string): Promise<ManagerAuthEntity | null> {
    return (
      (await this.db.query.managers.findFirst({
        where: { RAW: (m) => ciEquals(m.email, email) },
      })) ?? null
    );
  }

  async findStatusByEmail(
    email: string
  ): Promise<ManagerStatusSnapshot | null> {
    return (
      (await this.db.query.managers.findFirst({
        columns: {
          id: true,
          uuid: true,
          isActive: true,
          role: true,
          sessionVersion: true,
        },
        where: { RAW: (m) => ciEquals(m.email, email) },
      })) ?? null
    );
  }

  async findStatusById(
    managerId: number
  ): Promise<ManagerStatusSnapshot | null> {
    return (
      (await this.db.query.managers.findFirst({
        columns: {
          id: true,
          uuid: true,
          isActive: true,
          role: true,
          sessionVersion: true,
        },
        where: { id: managerId },
      })) ?? null
    );
  }

  async getSessionReauthAt(sessionId: number): Promise<Date | null> {
    const row = await this.db.query.managerSessions.findFirst({
      columns: { reauthAt: true },
      where: { id: sessionId },
    });
    return row?.reauthAt ?? null;
  }

  async create(input: CreateManagerInput): Promise<ManagerEntity> {
    const now = input.createdAt ?? new Date();
    const row = await requireFirst(
      this.db
        .insert(managers)
        .values({
          ...(input.uuid ? { uuid: input.uuid } : {}),
          email: input.email.trim(),
          passwordHash: input.passwordHash,
          displayName: input.displayName,
          emailVerified: input.emailVerified ?? true,
          image: input.image ?? null,
          role: input.role,
          mfaEnabled: input.mfaEnabled ?? false,
          isActive: input.isActive ?? true,
          createdAt: now,
          updatedAt: input.updatedAt ?? now,
        })
        .returning(),
      "Failed to insert manager record"
    );
    return toPublicManager(row);
  }

  async updatePasswordHash(
    managerId: number,
    passwordHash: string,
    updatedAt: Date = new Date()
  ): Promise<void> {
    await this.db
      .update(managers)
      .set({ passwordHash, updatedAt })
      .where(eq(managers.id, managerId));
  }

  async resetMfa(managerId: number): Promise<ManagerEntity | null> {
    return await this.transaction(async (tx) => {
      await tx
        .delete(managerTwoFactors)
        .where(eq(managerTwoFactors.userId, managerId));

      const [row] = await tx
        .update(managers)
        .set({
          mfaEnabled: false,
          sessionVersion: sql`${managers.sessionVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(managers.id, managerId))
        .returning();
      return row ? toPublicManager(row) : null;
    });
  }

  async incrementSessionVersion(
    managerId: number
  ): Promise<ManagerEntity | null> {
    const [row] = await this.db
      .update(managers)
      .set({
        sessionVersion: sql`${managers.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(managers.id, managerId))
      .returning();
    return row ? toPublicManager(row) : null;
  }

  async listAll(): Promise<ManagerEntity[]> {
    return await this.db.query.managers.findMany({
      columns: PUBLIC_MANAGER_COLUMNS,
      orderBy: { id: "asc" },
    });
  }
}
