import { and, eq, sql } from "drizzle-orm";
import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_ENDPOINT_STATUS,
  NOTIFICATION_STATUS,
  type NotificationChannel,
  type NotificationEndpointProvider,
  type NotificationStatus,
  RECIPIENT_TYPE,
  type RecipientType,
} from "#src/constants/billing-ops-enums";
import type { JsonRecord } from "#src/constants/json";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  NOTIFICATION_ENDPOINT_SENSITIVE_KEYS,
  omitKeys,
  PUBLIC_NOTIFICATION_ENDPOINT_COLUMNS,
  PUBLIC_USER_COLUMNS,
  type PublicNotificationEndpoint,
  type PublicUser,
} from "#src/repositories/sensitive";
import {
  ciContains,
  clampLimit,
  firstOrNull,
  requireFirst,
  toNullableDate,
  uniq,
} from "#src/repositories/utils";
import {
  notificationDeliveries,
  notificationEndpoints,
  notificationReads,
  notifications,
  type users,
} from "#src/schema/index";

function buildRecipientWhere(
  recipientTerm: string,
  hasNumericRecipient: boolean,
  numericRecipient: number
) {
  const emailFilter = {
    recipientType: RECIPIENT_TYPE.USER,
    userRecipient: {
      RAW: (u: typeof users) => ciContains(u.email, recipientTerm),
    },
  };
  if (hasNumericRecipient) {
    return {
      OR: [{ recipientId: numericRecipient }, emailFilter],
    };
  }
  return emailFilter;
}

function buildNotificationFilter(
  templateCode: string | undefined,
  recipientTerm: string | undefined,
  hasNumericRecipient: boolean,
  numericRecipient: number
) {
  if (!(templateCode || recipientTerm)) {
    return undefined;
  }
  return {
    ...(templateCode ? { templateCode } : {}),
    ...(recipientTerm
      ? buildRecipientWhere(
          recipientTerm,
          hasNumericRecipient,
          numericRecipient
        )
      : {}),
  };
}

export type NotificationEntity = typeof notifications.$inferSelect;
export type NotificationDeliveryEntity =
  typeof notificationDeliveries.$inferSelect;
export type NotificationReadEntity = typeof notificationReads.$inferSelect;
export type NotificationEndpointEntity = PublicNotificationEndpoint;
export type NotificationEndpointSecretEntity =
  typeof notificationEndpoints.$inferSelect;

export type NotificationWithDeliveries = NotificationEntity & {
  readonly deliveries: readonly NotificationDeliveryEntity[];
};

export type NotificationInboxItemEntity = NotificationEntity & {
  readonly read: NotificationReadEntity | null;
};

export interface UserNotificationInboxPage {
  readonly items: readonly NotificationInboxItemEntity[];
  readonly nextCursor: Date | null;
  readonly unreadCount: number;
}

export type NotificationDeliveryWithNotificationEntity =
  NotificationDeliveryEntity & {
    readonly notification: NotificationEntity & {
      readonly userRecipient: PublicUser | null;
    };
  };

export interface CreateNotificationWithEmailInput {
  readonly uuid?: string;
  readonly recipientType: RecipientType;
  readonly recipientId: number;
  readonly templateCode: string;
  readonly payload?: JsonRecord | null;
  readonly createdAt?: Date;
}

export interface RecordDeliveryOutcomeInput {
  readonly channel?: NotificationChannel;
  readonly status: NotificationStatus;
  readonly providerMessageId?: string | null;
  readonly suppressedReason?: string | null;
  readonly error?: string | null;
  readonly dispatchedAt?: Date;
}

export interface ListNotificationsFilter {
  readonly recipientType?: RecipientType;
  readonly recipientId?: number;
  readonly templateCode?: string;
  readonly q?: string;
  readonly limit?: number;
}

export interface ListDeliveryHistoryFilter {
  readonly templateCode?: string;
  readonly status?: NotificationStatus;
  readonly channel?: NotificationChannel;
  readonly recipient?: string;
  readonly from?: Date | string;
  readonly to?: Date | string;
  readonly limit?: number;
}

export interface UpsertNotificationEndpointInput {
  readonly userId: number;
  readonly provider: NotificationEndpointProvider;
  readonly clientInstallationId: string;
  readonly tokenEncrypted: string;
  readonly tokenFingerprint: string;
  readonly now?: Date;
}

function toPublicEndpoint(
  row: NotificationEndpointSecretEntity
): NotificationEndpointEntity {
  return omitKeys(row, NOTIFICATION_ENDPOINT_SENSITIVE_KEYS);
}

export class NotificationsRepository extends BaseRepository {
  async createInAppNotification(
    input: CreateNotificationWithEmailInput
  ): Promise<NotificationEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(notifications)
        .values({
          ...(input.uuid ? { uuid: input.uuid } : {}),
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          templateCode: input.templateCode,
          payload: input.payload ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      `Failed to insert notification '${input.templateCode}'`
    );
  }

  private async createWithChannelDelivery(
    input: CreateNotificationWithEmailInput,
    channel: NotificationChannel,
    status: NotificationStatus,
    dispatchedAt?: Date
  ): Promise<{
    readonly notification: NotificationEntity;
    readonly delivery: NotificationDeliveryEntity;
  }> {
    const now = input.createdAt ?? new Date();
    return await this.transaction(async (tx) => {
      const notification = await requireFirst(
        tx
          .insert(notifications)
          .values({
            ...(input.uuid ? { uuid: input.uuid } : {}),
            recipientType: input.recipientType,
            recipientId: input.recipientId,
            templateCode: input.templateCode,
            payload: input.payload ?? null,
            createdAt: now,
            updatedAt: now,
          })
          .returning(),
        `Không tạo được bản ghi notification cho mã '${input.templateCode}'.`
      );

      const delivery = await requireFirst(
        tx
          .insert(notificationDeliveries)
          .values({
            notificationId: notification.id,
            channel,
            status,
            ...(dispatchedAt ? { dispatchedAt } : {}),
            createdAt: now,
            updatedAt: now,
          })
          .returning(),
        "Failed to insert notification delivery row"
      );

      return { notification, delivery };
    });
  }

  async createWithEmailDelivery(
    input: CreateNotificationWithEmailInput
  ): Promise<{
    readonly notification: NotificationEntity;
    readonly delivery: NotificationDeliveryEntity;
  }> {
    return await this.createWithChannelDelivery(
      input,
      NOTIFICATION_CHANNEL.EMAIL,
      NOTIFICATION_STATUS.QUEUED
    );
  }

  async createInAppWithDelivery(
    input: CreateNotificationWithEmailInput
  ): Promise<{
    readonly notification: NotificationEntity;
    readonly delivery: NotificationDeliveryEntity;
  }> {
    return await this.createWithChannelDelivery(
      input,
      NOTIFICATION_CHANNEL.IN_APP,
      NOTIFICATION_STATUS.DISPATCHED,
      input.createdAt ?? new Date()
    );
  }

  async findById(id: number): Promise<NotificationEntity | null> {
    return (
      (await this.db.query.notifications.findFirst({ where: { id } })) ?? null
    );
  }

  async findByUuidForUser(
    uuid: string,
    userId: number
  ): Promise<NotificationEntity | null> {
    return (
      (await this.db.query.notifications.findFirst({
        where: {
          uuid,
          recipientType: RECIPIENT_TYPE.USER,
          recipientId: userId,
        },
      })) ?? null
    );
  }

  async isDeliveryDispatched(
    notificationId: number,
    channel: NotificationChannel = NOTIFICATION_CHANNEL.EMAIL
  ): Promise<boolean> {
    const row = await this.db.query.notificationDeliveries.findFirst({
      columns: { status: true },
      where: { notificationId, channel },
    });
    return row?.status === NOTIFICATION_STATUS.DISPATCHED;
  }

  async recordDeliveryOutcome(
    notificationId: number,
    outcome: RecordDeliveryOutcomeInput
  ): Promise<NotificationDeliveryEntity | null> {
    const now = new Date();
    const channel = outcome.channel ?? NOTIFICATION_CHANNEL.EMAIL;
    const dispatchedAt =
      outcome.status === NOTIFICATION_STATUS.DISPATCHED
        ? (outcome.dispatchedAt ?? now)
        : null;

    return await firstOrNull(
      this.db
        .update(notificationDeliveries)
        .set({
          status: outcome.status,
          providerMessageId: outcome.providerMessageId ?? null,
          suppressedReason: outcome.suppressedReason ?? null,
          error: outcome.error ?? null,
          dispatchedAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(notificationDeliveries.notificationId, notificationId),
            eq(notificationDeliveries.channel, channel)
          )
        )
        .returning()
    );
  }

  async updateDeliveryByProviderMessageId(
    providerMessageId: string,
    patch: {
      readonly status: NotificationStatus;
      readonly error?: string | null;
      readonly suppressedReason?: string | null;
      readonly dispatchedAt?: Date | null;
    }
  ): Promise<number> {
    const updated = await this.db
      .update(notificationDeliveries)
      .set({
        status: patch.status,
        ...(patch.error === undefined ? {} : { error: patch.error }),
        ...(patch.suppressedReason === undefined
          ? {}
          : { suppressedReason: patch.suppressedReason }),
        ...(patch.dispatchedAt === undefined
          ? {}
          : { dispatchedAt: patch.dispatchedAt }),
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.providerMessageId, providerMessageId))
      .returning({ id: notificationDeliveries.id });
    return updated.length;
  }

  async listUserInbox(
    userId: number,
    options: {
      readonly unreadOnly?: boolean;
      readonly cursorDate?: Date;
      readonly snapshotDate?: Date;
      readonly limit?: number;
    } = {}
  ): Promise<UserNotificationInboxPage> {
    const limit = clampLimit(options.limit, 20, 50);
    const snapshotDate = options.snapshotDate ?? new Date(Date.now() + 60_000);
    const upperBound =
      options.cursorDate &&
      options.cursorDate.getTime() < snapshotDate.getTime()
        ? options.cursorDate
        : snapshotDate;

    const [rows, unreadCount] = await Promise.all([
      this.db.query.notifications.findMany({
        where: {
          recipientType: RECIPIENT_TYPE.USER,
          recipientId: userId,
          createdAt: { lte: upperBound },
          ...(options.unreadOnly ? { read: false } : {}),
        },
        with: { read: true },
        orderBy: { createdAt: "desc", id: "desc" },
        limit: limit + 1,
      }),
      this.countUnreadForUser(userId),
    ]);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0 ? (items.at(-1)?.createdAt ?? null) : null;

    return { items, nextCursor, unreadCount };
  }

  async countUnreadForUser(userId: number): Promise<number> {
    const unreadRows = await this.db.query.notifications.findMany({
      columns: { id: true },
      where: {
        recipientType: RECIPIENT_TYPE.USER,
        recipientId: userId,
        read: false,
      },
    });
    return unreadRows.length;
  }

  async markRead(
    notificationId: number,
    readAt: Date = new Date()
  ): Promise<void> {
    await this.db
      .insert(notificationReads)
      .values({
        notificationId,
        readAt,
        createdAt: readAt,
        updatedAt: readAt,
      })
      .onConflictDoNothing();
  }

  async markAllReadForUser(
    userId: number,
    beforeDate: Date = new Date()
  ): Promise<number> {
    const unreadRows = await this.db.query.notifications.findMany({
      columns: { id: true },
      where: {
        recipientType: RECIPIENT_TYPE.USER,
        recipientId: userId,
        createdAt: { lte: beforeDate },
        read: false,
      },
    });
    if (unreadRows.length === 0) {
      return 0;
    }
    const inserted = await this.db
      .insert(notificationReads)
      .values(
        unreadRows.map((row) => ({
          notificationId: row.id,
          readAt: beforeDate,
          createdAt: beforeDate,
          updatedAt: beforeDate,
        }))
      )
      .onConflictDoNothing()
      .returning({ notificationId: notificationReads.notificationId });
    return inserted.length;
  }

  async listByUsersAndTemplate(
    userIds: readonly number[],
    templateCode: string
  ): Promise<NotificationEntity[]> {
    const uniqueIds = uniq(userIds);
    if (uniqueIds.length === 0) {
      return [];
    }
    return await this.db.query.notifications.findMany({
      where: {
        recipientType: RECIPIENT_TYPE.USER,
        recipientId: { in: uniqueIds },
        templateCode,
      },
    });
  }

  async listForManager(
    filter: ListNotificationsFilter = {}
  ): Promise<NotificationWithDeliveries[]> {
    const searchTerm = filter.q?.trim();
    return await this.db.query.notifications.findMany({
      where: {
        ...(filter.recipientType === undefined
          ? {}
          : { recipientType: filter.recipientType }),
        ...(filter.recipientId === undefined
          ? {}
          : { recipientId: filter.recipientId }),
        ...(filter.templateCode ? { templateCode: filter.templateCode } : {}),
        ...(searchTerm
          ? { RAW: (n) => ciContains(n.templateCode, searchTerm) }
          : {}),
      },
      with: { deliveries: true },
      orderBy: { createdAt: "desc", id: "desc" },
      limit: clampLimit(filter.limit, 50, 200),
    });
  }

  async listDeliveryHistoryForManager(
    filter: ListDeliveryHistoryFilter = {}
  ): Promise<NotificationDeliveryWithNotificationEntity[]> {
    const limit = clampLimit(filter.limit, 50, 100);
    const fromDate = toNullableDate(filter.from);
    const toDateVal = toNullableDate(filter.to);
    const recipientTerm = filter.recipient?.trim();
    const numericRecipient = recipientTerm ? Number(recipientTerm) : Number.NaN;
    const hasNumericRecipient =
      !Number.isNaN(numericRecipient) && numericRecipient > 0;

    const rows = await this.db.query.notificationDeliveries.findMany({
      where: {
        ...(filter.status === undefined ? {} : { status: filter.status }),
        ...(filter.channel === undefined ? {} : { channel: filter.channel }),
        ...(fromDate !== null || toDateVal !== null
          ? {
              createdAt: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDateVal ? { lte: toDateVal } : {}),
              },
            }
          : {}),
        ...(filter.templateCode || recipientTerm
          ? {
              notification: buildNotificationFilter(
                filter.templateCode,
                recipientTerm,
                hasNumericRecipient,
                numericRecipient
              ),
            }
          : {}),
      },
      with: { notification: true },
      orderBy: { createdAt: "desc", id: "desc" },
      limit,
    });

    const userIds = uniq(
      rows
        .filter((r) => r.notification.recipientType === RECIPIENT_TYPE.USER)
        .map((r) => r.notification.recipientId)
    );
    const userRows =
      userIds.length > 0
        ? await this.db.query.users.findMany({
            columns: PUBLIC_USER_COLUMNS,
            where: { id: { in: userIds } },
          })
        : [];
    const userMap = new Map<number, PublicUser>(userRows.map((u) => [u.id, u]));

    return rows.map((row) => ({
      ...row,
      notification: {
        ...row.notification,
        userRecipient:
          row.notification.recipientType === RECIPIENT_TYPE.USER
            ? (userMap.get(row.notification.recipientId) ?? null)
            : null,
      },
    }));
  }

  async countEndpointsByUser(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(notificationEndpoints)
      .where(eq(notificationEndpoints.userId, userId));
    return Number(row?.total ?? 0);
  }

  async listActiveEndpointsByUser(
    userId: number
  ): Promise<NotificationEndpointEntity[]> {
    return await this.db.query.notificationEndpoints.findMany({
      columns: PUBLIC_NOTIFICATION_ENDPOINT_COLUMNS,
      where: {
        userId,
        status: NOTIFICATION_ENDPOINT_STATUS.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listActiveEndpointsForDispatch(
    userId: number
  ): Promise<NotificationEndpointSecretEntity[]> {
    return await this.db.query.notificationEndpoints.findMany({
      where: {
        userId,
        status: NOTIFICATION_ENDPOINT_STATUS.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async upsertEndpoint(
    input: UpsertNotificationEndpointInput
  ): Promise<NotificationEndpointEntity> {
    const now = input.now ?? new Date();
    const existing = await this.db.query.notificationEndpoints.findFirst({
      columns: { id: true },
      where: {
        userId: input.userId,
        clientInstallationId: input.clientInstallationId,
      },
    });

    if (existing) {
      const updated = await requireFirst(
        this.db
          .update(notificationEndpoints)
          .set({
            tokenEncrypted: input.tokenEncrypted,
            tokenFingerprint: input.tokenFingerprint,
            status: NOTIFICATION_ENDPOINT_STATUS.ACTIVE,
            lastSeenAt: now,
            invalidatedAt: null,
            updatedAt: now,
          })
          .where(eq(notificationEndpoints.id, existing.id))
          .returning(),
        "Failed to update notification endpoint"
      );
      return toPublicEndpoint(updated);
    }

    const created = await requireFirst(
      this.db
        .insert(notificationEndpoints)
        .values({
          userId: input.userId,
          provider: input.provider,
          clientInstallationId: input.clientInstallationId,
          tokenEncrypted: input.tokenEncrypted,
          tokenFingerprint: input.tokenFingerprint,
          status: NOTIFICATION_ENDPOINT_STATUS.ACTIVE,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to create notification endpoint"
    );
    return toPublicEndpoint(created);
  }

  async revokeEndpointForUser(
    uuid: string,
    userId: number,
    now: Date = new Date()
  ): Promise<NotificationEndpointEntity | null> {
    const row = await firstOrNull(
      this.db
        .update(notificationEndpoints)
        .set({
          status: NOTIFICATION_ENDPOINT_STATUS.REVOKED,
          invalidatedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(notificationEndpoints.uuid, uuid),
            eq(notificationEndpoints.userId, userId)
          )
        )
        .returning()
    );
    return row ? toPublicEndpoint(row) : null;
  }

  async markReadIfUnread(
    notificationId: number,
    now: Date = new Date()
  ): Promise<Date> {
    const existing = await this.db.query.notificationReads.findFirst({
      columns: { readAt: true },
      where: { notificationId },
    });
    if (existing) {
      return existing.readAt;
    }

    await this.db
      .insert(notificationReads)
      .values({
        notificationId,
        readAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: notificationReads.notificationId });

    const after = await this.db.query.notificationReads.findFirst({
      columns: { readAt: true },
      where: { notificationId },
    });
    return after ? after.readAt : now;
  }

  async findLatestDelivery(
    notificationId: number
  ): Promise<NotificationDeliveryEntity | null> {
    return (
      (await this.db.query.notificationDeliveries.findFirst({
        where: { notificationId },
        orderBy: { id: "desc" },
      })) ?? null
    );
  }
}
