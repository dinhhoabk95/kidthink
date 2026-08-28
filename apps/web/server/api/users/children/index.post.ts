import {
  childProfiles,
  consentLogs,
  entitlements,
  getOwnerDb,
  users,
} from "@mindkid/db";
import {
  deriveAgeBand,
  isValidAvatarPreset,
  parseChildProfileInput,
} from "@mindkid/shared";
import { and, count, eq, gt, isNull, ne, or } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  type H3Event,
  readBody,
  setResponseStatus,
} from "h3";
import {
  assertRequestBodySize,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

function parseAndValidateInput(rawBody: unknown, currentYear: number) {
  try {
    return parseChildProfileInput(rawBody, currentYear);
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    if (errorObj?.code === "CHILD_FIELD_NOT_ALLOWED") {
      throw createError({
        statusCode: 400,
        statusMessage: "CHILD_FIELD_NOT_ALLOWED",
        data: {
          code: "CHILD_FIELD_NOT_ALLOWED",
          message:
            "Form chỉ chấp nhận 4 trường: display_name, birth_year, avatar_id, relationship.",
        },
      });
    }
    if (errorObj?.message === "INVALID_BIRTH_YEAR") {
      throw createError({
        statusCode: 422,
        statusMessage: "CHILD_AGE_OUT_OF_RANGE",
        data: {
          code: "CHILD_AGE_OUT_OF_RANGE",
          message:
            "MindKid là sản phẩm dành riêng cho trẻ từ 3–6 tuổi. Vui lòng chọn năm sinh phù hợp.",
        },
      });
    }
    throw createError({
      statusCode: 400,
      statusMessage: "VALIDATION_FAILED",
      data: { code: "VALIDATION_FAILED", message: errorObj?.message || "" },
    });
  }
}

async function verifyChildConsentAndQuota(event: H3Event, userId: number) {
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
    .limit(1);

  if (!existingConsent) {
    setResponseStatus(event, 428);
    throw createError({
      statusCode: 428,
      statusMessage: "CONSENT_REQUIRED",
      data: {
        code: "CONSENT_REQUIRED",
        message: "Cần đồng ý thu thập dữ liệu trẻ em trước khi tạo hồ sơ.",
      },
    });
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

  const [{ value: childCount }] = await db
    .select({ value: count() })
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.userId, userId),
        ne(childProfiles.status, "archived")
      )
    );

  if (childCount >= maxAllowedChildren) {
    setResponseStatus(event, 402);
    throw createError({
      statusCode: 402,
      statusMessage: "CHILD_LIMIT_EXCEEDED",
      data: {
        code: "CHILD_LIMIT_EXCEEDED",
        message: `Gói dịch vụ hiện tại cho phép tối đa ${maxAllowedChildren} hồ sơ trẻ. Nâng cấp gói để thêm hồ sơ mới.`,
      },
    });
  }
}

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const user = await requireWebUserSession(event);
  const db = getOwnerDb();
  const [account] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, user.user_id))
    .limit(1);

  if (account?.status !== "active") {
    setResponseStatus(event, 403);
    throw createError({
      statusCode: 403,
      statusMessage: "EMAIL_NOT_VERIFIED",
      data: {
        code: "EMAIL_NOT_VERIFIED",
        message: "Tài khoản cần xác thực email trước khi tạo hồ sơ trẻ.",
      },
    });
  }

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};
  const currentYear = new Date().getFullYear();

  const parsedInput = parseAndValidateInput(rawBody, currentYear);

  if (!isValidAvatarPreset(parsedInput.avatar_id)) {
    setResponseStatus(event, 400);
    throw createError({
      statusCode: 400,
      statusMessage: "AVATAR_NOT_IN_PRESET",
      data: {
        code: "AVATAR_NOT_IN_PRESET",
        message: "Hình đại diện phải thuộc bộ 12 preset minh hoạ có sẵn.",
      },
    });
  }

  const age = currentYear - parsedInput.birth_year;
  if (age < 3 || age > 6) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "CHILD_AGE_OUT_OF_RANGE",
      data: {
        code: "CHILD_AGE_OUT_OF_RANGE",
        message:
          "MindKid là sản phẩm dành riêng cho trẻ từ 3–6 tuổi. Vui lòng chọn năm sinh phù hợp.",
      },
    });
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

  setResponseStatus(event, 201);
  return {
    uuid: newChild.uuid,
    display_name: newChild.displayName,
    age_band: ageBand,
    avatar_id: newChild.avatarId,
  };
});
