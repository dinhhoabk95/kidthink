import { childProfiles, getOwnerDb } from "@mindkid/db";
import {
  AvatarNotInPresetError,
  ChildAgeOutOfRangeError,
  ChildFieldNotAllowedError,
} from "@mindkid/errors/child";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
import { deriveAgeBand, isValidAvatarPreset } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readBody } from "h3";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

function validatePatchDisplayName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 40) {
    throw new ValidationError("Tên gọi từ 1 đến 40 ký tự.");
  }
  return trimmed;
}

function validatePatchBirthYear(
  birthYear: unknown,
  currentYear: number
): number {
  if (typeof birthYear !== "number" || !Number.isInteger(birthYear)) {
    throw new ValidationError("VALIDATION_FAILED");
  }
  const age = currentYear - birthYear;
  if (age < 3 || age > 6) {
    throw new ChildAgeOutOfRangeError(
      "MindKid là sản phẩm dành riêng cho trẻ từ 3–6 tuổi."
    );
  }
  return birthYear;
}

import { z } from "zod";

const patchChildSchema = z
  .object({
    display_name: z.string().optional(),
    birth_year: z.number().int().optional(),
    avatar_id: z.string().optional(),
    relationship: z.enum(["child", "student", "other"]).optional(),
  })
  .strict();

function buildChildUpdates(rawBody: unknown, currentYear: number) {
  const parsedResult = patchChildSchema.safeParse(rawBody);
  if (!parsedResult.success) {
    throw new ChildFieldNotAllowedError(
      "Chỉ cho phép cập nhật: display_name, birth_year, avatar_id, relationship."
    );
  }

  const body = parsedResult.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.display_name === "string") {
    updates.displayName = validatePatchDisplayName(body.display_name);
  }

  if (body.avatar_id !== undefined) {
    if (
      typeof body.avatar_id !== "string" ||
      !isValidAvatarPreset(body.avatar_id)
    ) {
      throw new AvatarNotInPresetError(
        "Hình đại diện phải thuộc bộ 12 preset minh hoạ có sẵn."
      );
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
      throw new ValidationError("VALIDATION_FAILED");
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
    throw new NotFoundError("NOT_FOUND");
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // Verify ownership at DB level (BR-CPC-09)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    throw new NotFoundError("NOT_FOUND");
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

  if (!updated) {
    throw new InternalError("Cập nhật thông tin trẻ thất bại");
  }

  return {
    uuid: updated.uuid,
    display_name: updated.displayName,
    birth_year: updated.birthYear,
    age_band: deriveAgeBand(updated.birthYear, currentYear),
    avatar_id: updated.avatarId,
    relationship: updated.relationship,
  };
});
