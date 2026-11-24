import {
  ACTOR_TYPE,
  CHILD_STATUS,
  CONSENT_ACTION,
  CONSENT_ACTION_CODEC,
  CONSENT_TYPE,
  CONSENT_TYPE_CODEC,
  type ConsentLogEntity,
  type ConsentRequirementEntity,
  type MindKidRepositories,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { ConsentRequirementChangedError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import { CONSENT_POLICY_MAP, type ConsentType } from "@mindkid/shared";
import {
  bumpGlobalConsentEpoch,
  invalidateUserConsentCache,
} from "#server/utils/consent-guard";
import {
  useOwnerRepositories,
  useRepositories,
} from "#server/utils/repositories";

const CONSENT_TYPES: readonly ConsentType[] = [
  "terms",
  "privacy",
  "child_data",
];

export interface GuestConsentRequirementsResult {
  readonly terms: { readonly requirement_at: string | null };
  readonly privacy: { readonly requirement_at: string | null };
}

export interface UserConsentItem {
  readonly consent_type: ConsentType;
  readonly title: string;
  readonly document_url: string;
  readonly accepted_at: string | null;
  readonly requirement_at: string | null;
  readonly notice: string | null;
  readonly status: "active" | "required" | "withdrawn";
}

export interface UserConsentsListResult {
  readonly consents: readonly UserConsentItem[];
}

export interface SubmitUserConsentInput {
  readonly userId: number;
  readonly consentType: ConsentType;
  readonly requirementAt?: string | null;
  readonly ipAddress: string;
  readonly userAgent: string;
}

export interface SubmitUserConsentResult {
  readonly consent_type: ConsentType;
  readonly accepted_at: string;
  readonly status: "active";
}

export interface WithdrawUserConsentInput {
  readonly userId: number;
  readonly consentType: ConsentType;
  readonly ipAddress: string;
  readonly userAgent: string;
}

export type WithdrawUserConsentResult =
  | {
      readonly consent_type: "child_data";
      readonly status: "withdrawn";
      readonly consequence: string;
      readonly archived_children_count: number;
      readonly grace_period_days: 30;
      readonly purge_at: string;
      readonly shouldClearActiveChildCookie: true;
    }
  | {
      readonly consent_type: ConsentType;
      readonly status: "withdrawn";
      readonly consequence: string;
      readonly deletion_url: string;
      readonly shouldClearActiveChildCookie: false;
    };

export interface ManagerLegalConsentItem {
  readonly consent_type: ConsentType;
  readonly title: string;
  readonly document_url: string;
  readonly last_updated_on: string;
  readonly requirement_at: string | null;
  readonly reconsent_required_at: string | null;
  readonly notice: string | null;
  readonly updated_at: string | null;
  readonly affected_user_count: number;
  readonly affected_users_count: number;
}

export interface ManagerLegalConsentsResult {
  readonly items: readonly ManagerLegalConsentItem[];
  readonly requirements: readonly ManagerLegalConsentItem[];
}

export interface ForceManagerReconsentInput {
  readonly managerId: number;
  readonly consentType: ConsentType;
  readonly notice: string;
  readonly reason: string;
  readonly expectedRequirementAt?: string | null;
  readonly ipAddress: string;
  readonly userAgent: string;
}

export interface ForceManagerReconsentResult {
  readonly consent_type: ConsentType;
  readonly requirement_at: string;
  readonly reconsent_required_at: string;
  readonly affected_user_count: number;
  readonly notice: string;
}

function computeConsentState(
  latestLog: ConsentLogEntity | undefined,
  req: ConsentRequirementEntity | undefined
): { status: "active" | "required" | "withdrawn"; acceptedAt: string | null } {
  if (!latestLog) {
    return { status: "required", acceptedAt: null };
  }
  const parsedAction = CONSENT_ACTION_CODEC.parseCode(latestLog.action);
  if (parsedAction === CONSENT_ACTION.WITHDRAWN) {
    return { status: "withdrawn", acceptedAt: null };
  }
  if (parsedAction !== CONSENT_ACTION.ACCEPTED) {
    return { status: "required", acceptedAt: null };
  }
  const acceptedAt = latestLog.createdAt.toISOString();
  if (!req?.reconsentRequiredAt) {
    return { status: "active", acceptedAt };
  }
  const isActive =
    latestLog.createdAt.getTime() >= req.reconsentRequiredAt.getTime();
  return {
    status: isActive ? "active" : "required",
    acceptedAt,
  };
}

async function restoreArchivedChildrenOnConsent(
  txRepos: MindKidRepositories,
  userId: number,
  now: Date
): Promise<void> {
  const activeEntitlements = await txRepos.entitlements.listActiveForUser(
    userId,
    now
  );
  const keys = new Set(activeEntitlements.map((row) => row.entitlementKey));

  let maxAllowedChildren = 1;
  if (keys.has("play_premium_games")) {
    maxAllowedChildren = 5;
  } else if (keys.has("play_standard_games")) {
    maxAllowedChildren = 3;
  }

  const [nonArchivedCount, allChildren] = await Promise.all([
    txRepos.childProfiles.countNonArchivedByUser(userId),
    txRepos.childProfiles.listAllByUser(userId),
  ]);
  const remainingSlots = Math.max(0, maxAllowedChildren - nonArchivedCount);
  if (remainingSlots <= 0) {
    return;
  }

  const archivedChildren = allChildren
    .filter(
      (c) =>
        c.status === CHILD_STATUS.ARCHIVED &&
        (c.purgeAt === null || c.purgeAt.getTime() > now.getTime())
    )
    .sort((a, b) => {
      const aHasPurge = a.purgeAt === null ? 1 : 0;
      const bHasPurge = b.purgeAt === null ? 1 : 0;
      if (aHasPurge !== bHasPurge) {
        return aHasPurge - bHasPurge;
      }
      return a.id - b.id;
    })
    .slice(0, remainingSlots);

  for (const child of archivedChildren) {
    await txRepos.childProfiles.restore(child.id, userId, now);
  }
}

export async function getGuestConsentRequirements(): Promise<GuestConsentRequirementsResult> {
  const repos = useRepositories();
  const reqs = await repos.consents.getRequirements();
  const terms = reqs.find((r) => r.consentType === CONSENT_TYPE.TERMS);
  const privacy = reqs.find((r) => r.consentType === CONSENT_TYPE.PRIVACY);

  return {
    terms: {
      requirement_at: terms?.reconsentRequiredAt
        ? terms.reconsentRequiredAt.toISOString()
        : null,
    },
    privacy: {
      requirement_at: privacy?.reconsentRequiredAt
        ? privacy.reconsentRequiredAt.toISOString()
        : null,
    },
  };
}

export async function listUserConsents(
  userId: number
): Promise<UserConsentsListResult> {
  const repos = useOwnerRepositories();
  const [logs, reqs] = await Promise.all([
    repos.consents.listByUser(userId),
    repos.consents.getRequirements(),
  ]);

  const consents = CONSENT_TYPES.map((type) => {
    const typeCode = CONSENT_TYPE_CODEC.toCode(type);
    const meta = CONSENT_POLICY_MAP[type];
    const req = reqs.find((r) => r.consentType === typeCode);
    const latestLog = logs.find((l) => l.consentType === typeCode);
    const { status, acceptedAt } = computeConsentState(latestLog, req);

    return {
      consent_type: type,
      title: meta.title,
      document_url: `/${meta.slug}`,
      accepted_at: acceptedAt,
      requirement_at: req?.reconsentRequiredAt
        ? req.reconsentRequiredAt.toISOString()
        : null,
      notice: req?.notice ?? null,
      status,
    };
  });

  return { consents };
}

export async function submitUserConsent(
  input: SubmitUserConsentInput
): Promise<SubmitUserConsentResult> {
  const repos = useOwnerRepositories();
  const now = new Date();

  const consentCode = CONSENT_TYPE_CODEC.toCode(input.consentType);
  const result = await repos.consents.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const reqRows = await txRepos.consents.getRequirements([consentCode]);
    const req = reqRows[0];

    const dbMarker = req?.reconsentRequiredAt
      ? req.reconsentRequiredAt.toISOString()
      : null;
    const clientMarkerNorm = input.requirementAt
      ? new Date(input.requirementAt).toISOString()
      : null;

    if (dbMarker !== clientMarkerNorm) {
      throw new ConsentRequirementChangedError();
    }

    const inserted = await txRepos.consents.recordConsent({
      userId: input.userId,
      consentType: consentCode,
      action: CONSENT_ACTION.ACCEPTED,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      createdAt: now,
    });

    if (input.consentType === "child_data") {
      await restoreArchivedChildrenOnConsent(txRepos, input.userId, now);
    }

    return {
      consent_type: input.consentType,
      accepted_at: inserted.createdAt.toISOString(),
      status: "active" as const,
    };
  });

  await invalidateUserConsentCache(input.userId);
  return result;
}

export async function withdrawUserConsent(
  input: WithdrawUserConsentInput
): Promise<WithdrawUserConsentResult> {
  const repos = useOwnerRepositories();
  const now = new Date();
  const consentCode = CONSENT_TYPE_CODEC.toCode(input.consentType);

  if (input.consentType === "child_data") {
    const purgeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const archivedCount = await repos.consents.transaction(async (tx) => {
      const txRepos = createRepositories(tx);
      await txRepos.consents.recordConsent({
        userId: input.userId,
        consentType: consentCode,
        action: CONSENT_ACTION.WITHDRAWN,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        createdAt: now,
      });
      return await txRepos.childProfiles.tombstoneAllUnscheduledChildren(
        input.userId,
        purgeAt,
        now
      );
    });

    await invalidateUserConsentCache(input.userId);

    return {
      consent_type: "child_data",
      status: "withdrawn",
      consequence: `Đã rút đồng ý thu thập dữ liệu trẻ em. ${archivedCount} hồ sơ trẻ đã được chuyển sang trạng thái lưu trữ trong 30 ngày.`,
      archived_children_count: archivedCount,
      grace_period_days: 30,
      purge_at: purgeAt.toISOString(),
      shouldClearActiveChildCookie: true,
    };
  }

  await repos.consents.recordConsent({
    userId: input.userId,
    consentType: consentCode,
    action: CONSENT_ACTION.WITHDRAWN,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    createdAt: now,
  });

  await invalidateUserConsentCache(input.userId);

  return {
    consent_type: input.consentType,
    status: "withdrawn",
    consequence:
      "Từ chối điều khoản yêu cầu xoá tài khoản. Vui lòng hoàn tất tại trang Xoá tài khoản.",
    deletion_url: "/me/settings/delete",
    shouldClearActiveChildCookie: false,
  };
}

export async function listManagerLegalConsents(): Promise<ManagerLegalConsentsResult> {
  const repos = useOwnerRepositories();
  const reqs = await repos.consents.getRequirements();

  const requirements = await Promise.all(
    CONSENT_TYPES.map(async (type) => {
      const typeCode = CONSENT_TYPE_CODEC.toCode(type);
      const meta = CONSENT_POLICY_MAP[type];
      const req = reqs.find((r) => r.consentType === typeCode);
      const requirementAt = req?.reconsentRequiredAt
        ? req.reconsentRequiredAt.toISOString()
        : null;

      const affectedUserCount =
        await repos.consents.countUsersMissingActiveConsent(
          typeCode,
          req?.reconsentRequiredAt ?? null
        );

      return {
        consent_type: type,
        title: meta.title,
        document_url: `/${meta.slug}`,
        last_updated_on: meta.lastUpdatedOn,
        requirement_at: requirementAt,
        reconsent_required_at: requirementAt,
        notice: req?.notice ?? null,
        updated_at: req?.updatedAt ? req.updatedAt.toISOString() : null,
        affected_user_count: affectedUserCount,
        affected_users_count: affectedUserCount,
      };
    })
  );

  return {
    items: requirements,
    requirements,
  };
}

export async function forceManagerReconsent(
  input: ForceManagerReconsentInput
): Promise<ForceManagerReconsentResult> {
  let expectedDate: Date | null = null;
  if (
    typeof input.expectedRequirementAt === "string" &&
    input.expectedRequirementAt.trim().length > 0
  ) {
    const parsedExpectedDate = new Date(input.expectedRequirementAt);
    if (Number.isNaN(parsedExpectedDate.getTime())) {
      throw new ValidationError("Mốc yêu cầu dự kiến không hợp lệ.");
    }
    expectedDate = parsedExpectedDate;
  }

  const repos = useOwnerRepositories();
  const now = new Date();

  const consentCode = CONSENT_TYPE_CODEC.toCode(input.consentType);
  const result = await repos.consents.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const checked = await txRepos.consents.forceReconsentChecked({
      consentType: consentCode,
      expectedRequirementAt: expectedDate,
      notice: input.notice,
      now,
    });

    if (!checked.matched) {
      throw new ConsentRequirementChangedError();
    }

    const prevIso = checked.previousRequirementAt
      ? checked.previousRequirementAt.toISOString()
      : null;
    const newMarkerDate = checked.requirement.reconsentRequiredAt ?? now;
    const newMarkerIso = newMarkerDate.toISOString();

    await txRepos.auditLogs.insertLog({
      actorType: ACTOR_TYPE.MANAGER,
      actorId: input.managerId,
      action: "legal_reconsent_forced",
      entityType: "consent_requirement",
      entityId: input.consentType,
      beforeData: {
        consent_type: input.consentType,
        reconsent_required_at: prevIso,
        notice: checked.previousNotice,
      },
      afterData: {
        consent_type: input.consentType,
        reconsent_required_at: newMarkerIso,
        notice: input.notice,
      },
      reason: input.reason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      createdAt: checked.requirement.updatedAt,
    });

    const affectedUserCount =
      await txRepos.consents.countUsersMissingActiveConsent(
        consentCode,
        newMarkerDate
      );

    return {
      requirementAtIso: newMarkerIso,
      affectedUserCount,
    };
  });

  await bumpGlobalConsentEpoch();

  return {
    consent_type: input.consentType,
    requirement_at: result.requirementAtIso,
    reconsent_required_at: result.requirementAtIso,
    affected_user_count: result.affectedUserCount,
    notice: input.notice,
  };
}
