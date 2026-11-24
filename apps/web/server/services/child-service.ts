import { writeAudit } from "@mindkid/audit";
import { isValidParentGateToken, verifyPassword } from "@mindkid/auth";
import {
  CHILD_RELATIONSHIP_CODEC,
  CHILD_STATUS,
  CHILD_STATUS_CODEC,
  type ChildProfileEntity,
  type ChildRelationshipLabel,
  type ChildStatusLabel,
  USER_STATUS,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import {
  AccountPurgedError,
  AdminNoteRequiredError,
} from "@mindkid/errors/account";
import {
  InvalidCredentialsError,
  ParentGateRequiredError,
  RestrictedModeError,
} from "@mindkid/errors/auth";
import { ChildLimitExceededError } from "@mindkid/errors/billing";
import {
  AvatarNotInPresetError,
  ChildAgeOutOfRangeError,
  ChildFieldNotAllowedError,
  ChildPendingDeletionError,
} from "@mindkid/errors/child";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
import {
  InvalidStatusTransitionError,
  ModerationBlockedError,
} from "@mindkid/errors/content";
import { moderateText } from "@mindkid/moderation";
import {
  type CreateChildProfileInput,
  deriveAgeBand,
  isValidAvatarPreset,
  parseChildProfileInput,
} from "@mindkid/shared";
import { z } from "zod";
import { executeArchiveChildProfile } from "#server/utils/child-archive-runtime";
import { requireCurrentConsent } from "#server/utils/consent-guard";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface ChildProfileSummaryItem {
  readonly uuid: string;
  readonly display_name: string;
  readonly birth_year: number;
  readonly age_band: ReturnType<typeof deriveAgeBand>;
  readonly avatar_id: string;
  readonly relationship: ChildRelationshipLabel;
  readonly status: ChildStatusLabel;
  readonly purge_at: string | null;
  readonly daily_play_cap_minutes: number;
}

export interface ChildProfilesListResult {
  readonly children: readonly ChildProfileSummaryItem[];
}

export type RawChildInputValue = string | number | boolean | null | undefined;
export type RawChildInputRecord = Record<string, RawChildInputValue>;

interface ValidationErrorShape {
  code?: string;
  message?: string;
}

export interface PatchChildBody {
  display_name?: string;
  birth_year?: number;
  avatar_id?: string;
  relationship?: "child" | "student" | "other";
}

const patchChildSchema = z
  .object({
    display_name: z.string().optional(),
    birth_year: z.number().int().optional(),
    avatar_id: z.string().optional(),
    relationship: z.enum(["child", "student", "other"]).optional(),
  })
  .strict();

export async function listChildrenForUser(
  userId: number,
  currentYear: number = new Date().getFullYear()
): Promise<ChildProfilesListResult> {
  const repos = useOwnerRepositories();
  const childrenList = await repos.childProfiles.listAllByUser(userId);

  return {
    children: childrenList.map((child) => ({
      uuid: child.uuid,
      display_name: child.displayName,
      birth_year: child.birthYear,
      age_band: deriveAgeBand(child.birthYear, currentYear),
      avatar_id: child.avatarId,
      relationship: child.relationship
        ? CHILD_RELATIONSHIP_CODEC.toLabel(child.relationship)
        : "child",
      status: CHILD_STATUS_CODEC.toLabel(child.status),
      purge_at: child.purgeAt ? child.purgeAt.toISOString() : null,
      daily_play_cap_minutes: child.dailyPlayCapMinutes,
    })),
  };
}

export async function getOwnedChild(
  uuid: string,
  userId: number
): Promise<ChildProfileEntity | null> {
  const repos = useOwnerRepositories();
  return await repos.childProfiles.findByUuidForUser(uuid, userId);
}

function parseCreateChildInput(
  rawBody: RawChildInputRecord | object | null | undefined,
  currentYear: number
): CreateChildProfileInput {
  try {
    return parseChildProfileInput(rawBody, currentYear);
  } catch (err) {
    const errorObj = err as ValidationErrorShape;
    if (errorObj?.code === "CHILD_FIELD_NOT_ALLOWED") {
      throw new ChildFieldNotAllowedError(
        "Form chỉ chấp nhận 4 trường: display_name, birth_year, avatar_id, relationship."
      );
    }
    if (errorObj?.message === "INVALID_BIRTH_YEAR") {
      throw new ChildAgeOutOfRangeError(
        "MindKid là sản phẩm dành riêng cho trẻ từ 3–6 tuổi. Vui lòng chọn năm sinh phù hợp."
      );
    }
    throw new ValidationError(errorObj?.message || "");
  }
}

async function resolveMaxAllowedChildren(
  repos: MindKidRepositories,
  userId: number,
  now: Date = new Date()
): Promise<number> {
  const activeEntitlements = await repos.entitlements.listActiveForUser(
    userId,
    now
  );
  const keys = new Set(activeEntitlements.map((row) => row.entitlementKey));
  if (keys.has("play_premium_games")) {
    return 5;
  }
  if (keys.has("play_standard_games")) {
    return 3;
  }
  return 1;
}

function assertDisplayNameModerated(displayName: string): void {
  const moderationResult = moderateText(displayName, {
    allowNegativeAssertions: true,
  });
  if (!moderationResult.passed) {
    throw new ModerationBlockedError(
      "Tên gọi chứa từ ngữ không phù hợp với môi trường giáo dục trẻ em."
    );
  }
}

export async function createChildProfileForUser(params: {
  userId: number;
  rawBody: RawChildInputRecord | object | null | undefined;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const currentYear = now.getFullYear();
  const repos = useOwnerRepositories();

  const account = await repos.users.findById(params.userId);
  if (account?.status !== USER_STATUS.ACTIVE) {
    throw new RestrictedModeError(
      "Tài khoản cần xác thực email trước khi tạo hồ sơ trẻ."
    );
  }

  const parsedInput = parseCreateChildInput(params.rawBody, currentYear);
  if (!isValidAvatarPreset(parsedInput.avatar_id)) {
    throw new AvatarNotInPresetError(
      "Hình đại diện phải thuộc bộ 12 preset minh hoạ có sẵn."
    );
  }

  const age = currentYear - parsedInput.birth_year;
  if (age < 3 || age > 6) {
    throw new ChildAgeOutOfRangeError(
      "MindKid là sản phẩm dành riêng cho trẻ từ 3–6 tuổi. Vui lòng chọn năm sinh phù hợp."
    );
  }

  assertDisplayNameModerated(parsedInput.display_name);
  await requireCurrentConsent(params.userId, "child_data");

  const [maxAllowedChildren, nonArchivedCount] = await Promise.all([
    resolveMaxAllowedChildren(repos, params.userId, now),
    repos.childProfiles.countNonArchivedByUser(params.userId),
  ]);

  if (nonArchivedCount >= maxAllowedChildren) {
    throw new ChildLimitExceededError(
      `Gói dịch vụ hiện tại cho phép tối đa ${maxAllowedChildren} hồ sơ trẻ. Nâng cấp gói để thêm hồ sơ mới.`
    );
  }

  const newChild = await repos.childProfiles.create({
    userId: params.userId,
    displayName: parsedInput.display_name,
    birthYear: parsedInput.birth_year,
    avatarId: parsedInput.avatar_id,
    relationship: CHILD_RELATIONSHIP_CODEC.toCode(
      parsedInput.relationship || "child"
    ),
    dailyPlayCapMinutes: 60,
    createdAt: now,
    updatedAt: now,
  });

  return {
    uuid: newChild.uuid,
    display_name: newChild.displayName,
    age_band: deriveAgeBand(parsedInput.birth_year, currentYear),
    avatar_id: newChild.avatarId,
  };
}

function validatePatchBirthYear(
  birthYear: number,
  currentYear: number,
  existingBirthYear?: number
): number {
  if (!Number.isInteger(birthYear)) {
    throw new ValidationError("VALIDATION_FAILED");
  }
  if (existingBirthYear !== undefined && birthYear === existingBirthYear) {
    return birthYear;
  }
  const age = currentYear - birthYear;
  if (age < 3 || age > 6) {
    throw new ChildAgeOutOfRangeError(
      "MindKid là sản phẩm dành riêng cho trẻ từ 3–6 tuổi."
    );
  }
  return birthYear;
}

export async function updateChildProfileForUser(params: {
  userId: number;
  childUuid: string;
  rawBody: PatchChildBody | object | null | undefined;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const currentYear = now.getFullYear();
  const repos = useOwnerRepositories();

  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (!child) {
    throw new NotFoundError("NOT_FOUND");
  }

  const parsedResult = patchChildSchema.safeParse(params.rawBody ?? {});
  if (!parsedResult.success) {
    throw new ChildFieldNotAllowedError(
      "Chỉ cho phép cập nhật: display_name, birth_year, avatar_id, relationship."
    );
  }

  const body = parsedResult.data;
  let displayName: string | undefined;
  if (typeof body.display_name === "string") {
    const trimmed = body.display_name.trim();
    if (trimmed.length < 1 || trimmed.length > 40) {
      throw new ValidationError("Tên gọi từ 1 đến 40 ký tự.");
    }
    assertDisplayNameModerated(trimmed);
    displayName = trimmed;
  }

  let avatarId: string | undefined;
  if (body.avatar_id !== undefined) {
    if (!isValidAvatarPreset(body.avatar_id)) {
      throw new AvatarNotInPresetError(
        "Hình đại diện phải thuộc bộ 12 preset minh hoạ có sẵn."
      );
    }
    avatarId = body.avatar_id;
  }

  const birthYear =
    body.birth_year === undefined
      ? undefined
      : validatePatchBirthYear(body.birth_year, currentYear, child.birthYear);

  const updated = await repos.childProfiles.update(child.id, params.userId, {
    displayName,
    avatarId,
    birthYear,
    relationship: body.relationship
      ? CHILD_RELATIONSHIP_CODEC.toCode(body.relationship)
      : undefined,
    updatedAt: now,
  });

  if (!updated) {
    throw new InternalError("Cập nhật thông tin trẻ thất bại");
  }

  return {
    uuid: updated.uuid,
    display_name: updated.displayName,
    birth_year: updated.birthYear,
    age_band: deriveAgeBand(updated.birthYear, currentYear),
    avatar_id: updated.avatarId,
    relationship: updated.relationship
      ? CHILD_RELATIONSHIP_CODEC.toLabel(updated.relationship)
      : "child",
  };
}

export async function deleteChildProfileForUser(params: {
  userId: number;
  childUuid: string;
  password: string;
  confirmName: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const repos = useOwnerRepositories();

  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (!child) {
    throw new NotFoundError("NOT_FOUND");
  }

  const userRecord = await repos.users.findForAuthById(params.userId);
  if (
    !(
      userRecord?.passwordHash &&
      (await verifyPassword(params.password, userRecord.passwordHash))
    )
  ) {
    throw new InvalidCredentialsError("Mật khẩu xác nhận không đúng.");
  }

  if (params.confirmName.trim() !== child.displayName) {
    throw new ValidationError(
      "Tên xác nhận không trùng khớp với tên hồ sơ trẻ."
    );
  }

  const purgeAt = new Date(now.getTime() + 30 * 86_400 * 1000);

  await repos.childProfiles.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    await txRepos.childProfiles.markForPurge(
      child.id,
      params.userId,
      purgeAt,
      now
    );

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: params.userId,
      action: "child_data_purged",
      entity_type: "child_profile",
      entity_id: child.uuid,
      before_data: {
        child_uuid: child.uuid,
        status: CHILD_STATUS_CODEC.toLabel(child.status),
      },
      after_data: {
        child_uuid: child.uuid,
        status: "pending_deletion",
        purge_at: purgeAt.toISOString(),
      },
    });
  });

  return {
    uuid: child.uuid,
    status: "pending_deletion" as const,
    purge_at: purgeAt.toISOString(),
  };
}

export async function cancelChildProfileDeletion(params: {
  userId: number;
  childUuid: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const repos = useOwnerRepositories();

  const updated = await repos.childProfiles.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const child = await txRepos.childProfiles.findByUuidForUser(
      params.childUuid,
      params.userId
    );
    if (!child) {
      throw new NotFoundError("NOT_FOUND");
    }
    if (child.status !== CHILD_STATUS.PENDING_DELETION) {
      throw new InvalidStatusTransitionError(
        "Hồ sơ không ở trạng thái chờ xoá."
      );
    }
    if (!child.purgeAt || child.purgeAt.getTime() <= now.getTime()) {
      throw new AccountPurgedError(
        "Hồ sơ trẻ đã hết thời hạn hoàn tác và không thể huỷ xoá."
      );
    }

    const [maxAllowedChildren, allChildren] = await Promise.all([
      resolveMaxAllowedChildren(txRepos, params.userId, now),
      txRepos.childProfiles.listAllByUser(params.userId),
    ]);
    const otherNonArchivedCount = allChildren.filter(
      (c) => c.id !== child.id && c.status !== CHILD_STATUS.ARCHIVED
    ).length;
    if (otherNonArchivedCount >= maxAllowedChildren) {
      throw new ChildLimitExceededError(
        `Không thể huỷ xoá. Gói dịch vụ đã đạt hạn mức tối đa ${maxAllowedChildren} hồ sơ trẻ.`
      );
    }

    const cancelled = await txRepos.childProfiles.cancelPurgeToArchived(
      child.id,
      params.userId,
      now
    );
    if (!cancelled) {
      throw new AccountPurgedError(
        "Hồ sơ trẻ đã hết thời hạn hoàn tác hoặc trạng thái đã thay đổi."
      );
    }
    return cancelled;
  });

  return {
    uuid: updated.uuid,
    status: CHILD_STATUS_CODEC.toLabel(updated.status),
  };
}

async function findOtherChildWithActiveSession(
  repos: MindKidRepositories,
  children: readonly ChildProfileEntity[],
  targetChildId: number
): Promise<ChildProfileEntity | null> {
  for (const other of children) {
    if (other.id === targetChildId) {
      continue;
    }
    const inProgress = await repos.playSessions.findLatestInProgressForChild(
      other.id
    );
    if (inProgress) {
      return other;
    }
  }
  return null;
}

function assertValidParentGateForSwitch(params: {
  gateToken: string | undefined;
  userId: number;
  parentGateSecret: string;
}): void {
  const gateToken = String(params.gateToken || "");
  if (
    !(
      gateToken &&
      isValidParentGateToken(gateToken, params.userId, params.parentGateSecret)
    )
  ) {
    throw new ParentGateRequiredError(
      "Cần xác nhận cổng người lớn khi đổi hồ sơ trẻ."
    );
  }
}

export async function activateChildProfileForUser(params: {
  userId: number;
  childUuid: string;
  currentActiveUuid?: string;
  gateToken?: string;
  parentGateSecret: string;
}) {
  const repos = useOwnerRepositories();
  const targetChild = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (targetChild?.status !== CHILD_STATUS.ACTIVE) {
    throw new NotFoundError(
      "Không tìm thấy hồ sơ trẻ hoặc hồ sơ đã bị lưu trữ."
    );
  }

  const isSwitchingFromOtherCookie =
    Boolean(params.currentActiveUuid) &&
    params.currentActiveUuid !== params.childUuid;
  const allChildren = await repos.childProfiles.listAllByUser(params.userId);
  const hasMultipleActiveChildren = allChildren.some(
    (c) => c.status === CHILD_STATUS.ACTIVE && c.id !== targetChild.id
  );
  const childWithActiveSession = params.currentActiveUuid
    ? null
    : await findOtherChildWithActiveSession(repos, allChildren, targetChild.id);

  const needsParentGate =
    isSwitchingFromOtherCookie ||
    (!params.currentActiveUuid &&
      (hasMultipleActiveChildren || childWithActiveSession !== null));

  if (needsParentGate) {
    assertValidParentGateForSwitch({
      gateToken: params.gateToken,
      userId: params.userId,
      parentGateSecret: params.parentGateSecret,
    });

    if (params.currentActiveUuid && isSwitchingFromOtherCookie) {
      const previousChild = await repos.childProfiles.findByUuidForUser(
        params.currentActiveUuid,
        params.userId
      );
      if (previousChild) {
        await repos.playSessions.abandonActiveForChild(previousChild.id);
      }
    }
    if (childWithActiveSession) {
      await repos.playSessions.abandonActiveForChild(childWithActiveSession.id);
    }
  }

  const currentYear = new Date().getFullYear();
  return {
    child: {
      uuid: targetChild.uuid,
      display_name: targetChild.displayName,
      avatar_id: targetChild.avatarId,
      age_band: deriveAgeBand(targetChild.birthYear, currentYear),
    },
  };
}

export async function archiveChildProfileForUser(params: {
  userId: number;
  childUuid: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (!child) {
    throw new NotFoundError("NOT_FOUND");
  }
  if (child.status === CHILD_STATUS.PENDING_DELETION) {
    throw new ChildPendingDeletionError();
  }

  const now = new Date();
  const updated = await repos.childProfiles.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const row = await txRepos.childProfiles.archive(
      child.id,
      params.userId,
      now,
      null
    );
    if (!row) {
      const current = await txRepos.childProfiles.findByUuidForUser(
        params.childUuid,
        params.userId
      );
      if (current?.status === CHILD_STATUS.PENDING_DELETION) {
        throw new ChildPendingDeletionError();
      }
      throw new InternalError("ARCHIVE_FAILED");
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: params.userId,
      action: "child_profile_archived",
      entity_type: "child_profile",
      entity_id: row.uuid,
      before_data: {
        child_uuid: row.uuid,
        status: CHILD_STATUS_CODEC.toLabel(child.status),
      },
      after_data: {
        child_uuid: row.uuid,
        status: CHILD_STATUS_CODEC.toLabel(row.status),
      },
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });
    return row;
  });

  return {
    uuid: updated.uuid,
    status: CHILD_STATUS_CODEC.toLabel(updated.status),
  };
}

export async function archiveChildProfileByManager(params: {
  managerId: number;
  childUuid: string;
  reason: string;
  ipAddress: string | null;
  userAgent: string;
}) {
  const trimmedReason = params.reason.trim();
  if (trimmedReason.length < 10) {
    throw new AdminNoteRequiredError();
  }

  const repos = useOwnerRepositories();
  const targetChild = await repos.childProfiles.findByUuid(params.childUuid);
  if (!targetChild) {
    throw new NotFoundError();
  }
  if (targetChild.status === CHILD_STATUS.PENDING_DELETION) {
    throw new ChildPendingDeletionError();
  }

  const result = await executeArchiveChildProfile({
    childId: targetChild.id,
    userId: targetChild.userId,
    reason: trimmedReason,
  });

  await repos.childProfiles.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: params.managerId,
      action: "child_profile_archived",
      entity_type: "child_profile",
      entity_id: targetChild.uuid,
      before_data: {
        child_uuid: targetChild.uuid,
        status: CHILD_STATUS_CODEC.toLabel(targetChild.status),
      },
      after_data: { child_uuid: targetChild.uuid, status: result.status },
      reason: trimmedReason,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });
  });

  return {
    success: true,
    status: result.status,
    uuid: result.uuid,
  };
}

export async function restoreChildProfileForUser(params: {
  userId: number;
  childUuid: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const repos = useOwnerRepositories();

  const updated = await repos.childProfiles.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const child = await txRepos.childProfiles.findByUuidForUser(
      params.childUuid,
      params.userId
    );
    if (!child) {
      throw new NotFoundError("NOT_FOUND");
    }
    if (child.status === CHILD_STATUS.PENDING_DELETION) {
      throw new ChildPendingDeletionError();
    }
    if (child.status !== CHILD_STATUS.ARCHIVED) {
      throw new InvalidStatusTransitionError(
        "Chỉ có thể khôi phục hồ sơ đang ở trạng thái lưu trữ."
      );
    }
    if (child.purgeAt && child.purgeAt.getTime() <= now.getTime()) {
      throw new AccountPurgedError(
        "Hồ sơ trẻ đã hết thời hạn lưu trữ 30 ngày và không thể khôi phục."
      );
    }

    await requireCurrentConsent(params.userId, "child_data");

    const [maxAllowedChildren, nonArchivedCount] = await Promise.all([
      resolveMaxAllowedChildren(txRepos, params.userId, now),
      txRepos.childProfiles.countNonArchivedByUser(params.userId),
    ]);

    if (nonArchivedCount >= maxAllowedChildren) {
      throw new ChildLimitExceededError(
        `Không thể khôi phục. Gói dịch vụ đã đạt hạn mức tối đa ${maxAllowedChildren} hồ sơ trẻ đang hoạt động.`
      );
    }

    const restored = await txRepos.childProfiles.restore(
      child.id,
      params.userId,
      now
    );
    if (!restored) {
      throw new InvalidStatusTransitionError(
        "Không thể khôi phục hồ sơ trẻ do trạng thái đã thay đổi hoặc hết hạn."
      );
    }
    return restored;
  });

  return {
    uuid: updated.uuid,
    status: CHILD_STATUS_CODEC.toLabel(updated.status),
  };
}
