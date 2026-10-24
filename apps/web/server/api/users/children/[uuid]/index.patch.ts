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
import { z } from "zod";

import { requireWebUserSession } from "#server/utils/auth-runtime";

type RelationshipKind = "child" | "student" | "other";

interface PatchChildBody {
  display_name?: string;
  birth_year?: number;
  avatar_id?: string;
  relationship?: RelationshipKind;
}

interface ChildProfileUpdatePayload {
  updatedAt: Date;
  displayName?: string;
  avatarId?: string;
  birthYear?: number;
  relationship?: RelationshipKind;
}

const patchChildSchema = z
  .object({
    display_name: z.string().optional(),
    birth_year: z.number().int().optional(),
    avatar_id: z.string().optional(),
    relationship: z.enum(["child", "student", "other"]).optional(),
  })
  .strict();

function validatePatchDisplayName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 40) {
    throw new ValidationError("Tên gọi từ 1 đến 40 ký tự.");
  }
  return trimmed;
}

function validatePatchAvatarId(avatarId: string): string {
  if (!isValidAvatarPreset(avatarId)) {
    throw new AvatarNotInPresetError(
      "Hình đại diện phải thuộc bộ 12 preset minh hoạ có sẵn."
    );
  }
  return avatarId;
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

function buildChildUpdates(
  rawBody: PatchChildBody,
  currentYear: number,
  existingBirthYear?: number
): ChildProfileUpdatePayload {
  const parsedResult = patchChildSchema.safeParse(rawBody);
  if (!parsedResult.success) {
    throw new ChildFieldNotAllowedError(
      "Chỉ cho phép cập nhật: display_name, birth_year, avatar_id, relationship."
    );
  }

  const body = parsedResult.data;
  const displayName =
    typeof body.display_name === "string"
      ? validatePatchDisplayName(body.display_name)
      : undefined;

  const avatarId =
    body.avatar_id === undefined
      ? undefined
      : validatePatchAvatarId(body.avatar_id);

  const birthYear =
    body.birth_year === undefined
      ? undefined
      : validatePatchBirthYear(body.birth_year, currentYear, existingBirthYear);

  return {
    updatedAt: new Date(),
    ...(displayName === undefined ? {} : { displayName }),
    ...(avatarId === undefined ? {} : { avatarId }),
    ...(birthYear === undefined ? {} : { birthYear }),
    ...(body.relationship === undefined
      ? {}
      : { relationship: body.relationship }),
  };
}

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    throw new NotFoundError("NOT_FOUND");
  }

  const eventContext = event.context as { body?: PatchChildBody };
  const body: PatchChildBody =
    eventContext?.body || (await readBody<PatchChildBody>(event)) || {};
  const currentYear = new Date().getFullYear();

  const updates = buildChildUpdates(body, currentYear, child.birthYear);

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
