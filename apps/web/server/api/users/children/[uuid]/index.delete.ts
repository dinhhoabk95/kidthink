import { NotFoundError } from "@mindkid/errors/common";
import {
  defineEventHandler,
  deleteCookie,
  getCookie,
  getRouterParam,
  readBody,
} from "h3";
import { z } from "zod";
import { deleteChildProfileForUser } from "#server/services/child-service";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";

interface DeleteChildBodyInput {
  password?: string;
  confirm_name?: string;
}

const deleteChildSchema = z.object({
  password: z.string().optional().default(""),
  confirm_name: z.string().optional().default(""),
});

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const eventBody = (event.context as { body?: DeleteChildBodyInput })?.body;
  const raw =
    eventBody ||
    (await readBody<DeleteChildBodyInput>(event).catch(() => ({})));
  const parsed = deleteChildSchema.safeParse(raw);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await deleteChildProfileForUser({
    userId: Number(userSession.user_id),
    childUuid: uuid,
    password: parsed.data.password,
    confirmName: parsed.data.confirm_name,
  });

  if (getCookie(event, "active_child_id") === uuid) {
    deleteCookie(event, "active_child_id", { path: "/" });
  }

  return result;
});
