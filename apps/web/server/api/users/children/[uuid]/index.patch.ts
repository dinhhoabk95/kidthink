import { childProfiles, getOwnerDb } from "@mindkid/db";
import { deriveAgeBand, isValidAvatarPreset } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "../../../../utils/auth-runtime.js";

const ALLOWED_UPDATE_KEYS = new Set([
  "display_name",
  "birth_year",
  "avatar_id",
  "relationship",
]);

function validatePatchDisplayName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 40) {
    throw createError({
      statusCode: 400,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "Tên gọi từ 1 đến 40 ký tự.",
      },
    });
  }
  return trimmed;
}

function validatePatchBirthYear(
  birthYear: unknown,
  currentYear: number
): number {
  if (typeof birthYear !== "number" || !Number.isInteger(birthYear)) {
    throw createError({ statusCode: 400, statusMessage: "VALIDATION_FAILED" });
  }
  const age = currentYear - birthYear;
  if (age < 3 || age > 6) {
    throw createError({
      statusCode: 422,
      statusMessage: "CHILD_AGE_OUT_OF_RANGE",
      data: {
        code: "CHILD_AGE_OUT_OF_RANGE",
        message: "TiniMath là sản phẩm dành riêng cho trẻ từ 3–6 tuổi.",
      },
    });
  }
  return birthYear;
}

function buildChildUpdates(body: Record<string, unknown>, currentYear: number) {
  const extraFields = Object.keys(body).filter(
    (key) => !ALLOWED_UPDATE_KEYS.has(key)
  );
  if (extraFields.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "CHILD_FIELD_NOT_ALLOWED",
      data: {
        code: "CHILD_FIELD_NOT_ALLOWED",
        message:
          "Chỉ cho phép cập nhật: display_name, birth_year, avatar_id, relationship.",
      },
    });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.display_name === "string") {
    updates.displayName = validatePatchDisplayName(body.display_name);
  }

  if (body.avatar_id !== undefined) {
    if (
      typeof body.avatar_id !== "string" ||
      !isValidAvatarPreset(body.avatar_id)
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "AVATAR_NOT_IN_PRESET",
        data: {
          code: "AVATAR_NOT_IN_PRESET",
          message: "Hình đại diện phải thuộc bộ 12 preset minh hoạ có sẵn.",
        },
      });
    }
    updates.avatarId = body.avatar_id;
  }

  if (body.birth_year !== undefined) {
    updates.birthYear = validatePatchBirthYear(body.birth_year, currentYear);
  }

  if (body.relationship !== undefined) {
    if (
      body.relationship !== "child" &&
      body.relationship !== "student" &&
      body.relationship !== "other"
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "VALIDATION_FAILED",
      });
    }
    updates.relationship = body.relationship;
  }

  return updates;
}

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // Verify ownership at DB level (BR-CPC-09)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const body =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};
  const currentYear = new Date().getFullYear();

  const updates = buildChildUpdates(body, currentYear);

  const [updated] = await db
    .update(childProfiles)
    .set(updates)
    .where(eq(childProfiles.id, child.id))
    .returning();

  return {
    uuid: updated.uuid,
    display_name: updated.displayName,
    birth_year: updated.birthYear,
    age_band: deriveAgeBand(updated.birthYear, currentYear),
    avatar_id: updated.avatarId,
    relationship: updated.relationship,
  };
});
