import {
  childProfiles,
  consentLogs,
  entitlements,
  getOwnerDb,
  users,
} from "@mindkid/db";
import { ConsentRequiredError } from "@mindkid/errors/account";
import { RestrictedModeError } from "@mindkid/errors/auth";
import { ChildLimitExceededError } from "@mindkid/errors/billing";
import {
  AvatarNotInPresetError,
  ChildAgeOutOfRangeError,
  ChildFieldNotAllowedError,
} from "@mindkid/errors/child";
import { InternalError, ValidationError } from "@mindkid/errors/common";
import {
  type CreateChildProfileInput,
  deriveAgeBand,
  isValidAvatarPreset,
  parseChildProfileInput,
} from "@mindkid/shared";
import { and, count, desc, eq, gt, isNull, ne, or } from "drizzle-orm";
import {
  defineEventHandler,
  type H3Event,
  readBody,
  setResponseStatus,
} from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

type RawChildInputValue = string | number | boolean | null | undefined;
type RawChildInputRecord = Record<string, RawChildInputValue>;

interface ValidationErrorShape {
  code?: string;
  message?: string;
}

function parseAndValidateInput(
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

async function verifyChildConsentAndQuota(
  _event: H3Event,
  userId: number
): Promise<void> {
  const db = getOwnerDb();

  // Check child_data consent (BR-CPC-05)
  const [existingConsent] = await db
    .select()
    .from(consentLogs)
    .where(
      and(
        eq(consentLogs.userId, userId),
        eq(consentLogs.consentType, "child_data")
      )
    )
    .orderBy(desc(consentLogs.createdAt), desc(consentLogs.id))
    .limit(1);

  if (existingConsent?.action !== "accepted") {
    throw new ConsentRequiredError(
      "Cần đồng ý thu thập dữ liệu trẻ em trước khi tạo hồ sơ."
    );
  }

  // Quota check (BR-CPC-07)
  const activeEntitlements = await db
    .select({ key: entitlements.entitlementKey })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userId, userId),
        eq(entitlements.status, "active"),
        or(
          isNull(entitlements.expiresAt),
          gt(entitlements.expiresAt, new Date())
        )
      )
    );
  const entitlementKeys = new Set(activeEntitlements.map((row) => row.key));
  let maxAllowedChildren = 1;
  if (entitlementKeys.has("play_premium_games")) {
    maxAllowedChildren = 5;
  } else if (entitlementKeys.has("play_standard_games")) {
    maxAllowedChildren = 3;
  }

  const [childCountRow] = await db
    .select({ value: count() })
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.userId, userId),
        ne(childProfiles.status, "archived")
      )
    );
  const childCount = childCountRow?.value ?? 0;

  if (childCount >= maxAllowedChildren) {
    throw new ChildLimitExceededError(
      `Gói dịch vụ hiện tại cho phép tối đa ${maxAllowedChildren} hồ sơ trẻ. Nâng cấp gói để thêm hồ sơ mới.`
    );
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const db = getOwnerDb();
  const [account] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, user.user_id))
    .limit(1);

  if (account?.status !== "active") {
    throw new RestrictedModeError(
      "Tài khoản cần xác thực email trước khi tạo hồ sơ trẻ."
    );
  }

  const eventBody = (event.context as { body?: RawChildInputRecord })?.body;
  const rawBody =
    eventBody || ((await readBody<RawChildInputRecord>(event)) ?? {});
  const currentYear = new Date().getFullYear();

  const parsedInput = parseAndValidateInput(rawBody, currentYear);

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

  const userId = Number(user.user_id);
  await verifyChildConsentAndQuota(event, userId);

  const ageBand = deriveAgeBand(parsedInput.birth_year, currentYear);

  const [newChild] = await db
    .insert(childProfiles)
    .values({
      userId,
      displayName: parsedInput.display_name,
      birthYear: parsedInput.birth_year,
      avatarId: parsedInput.avatar_id,
      relationship: parsedInput.relationship || "child",
      dailyPlayCapMinutes: 60,
      status: "active",
    })
    .returning();

  if (!newChild) {
    throw new InternalError("Tạo hồ sơ trẻ thất bại");
  }

  setResponseStatus(event, 201);
  return {
    uuid: newChild.uuid,
    display_name: newChild.displayName,
    age_band: ageBand,
    avatar_id: newChild.avatarId,
  };
});
