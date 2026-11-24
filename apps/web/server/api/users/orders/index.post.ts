import { defineEventHandler, getHeader, setResponseStatus } from "h3";
import { z } from "zod";
import { createUserOrder } from "#server/services/order-service";
import { throwValidationError } from "#server/utils/api-error";
import {
  enforceTwoAxisRateLimit,
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { readJsonBodyWithLimit } from "#server/utils/request-body";

const createOrderSchema = z.object({
  package_code: z.string().min(1),
  offer_code: z.string().min(1),
  amount_vnd: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  await enforceTwoAxisRateLimit(
    event,
    "payment:create",
    String(session.user_id)
  );

  const rawBody = await readJsonBodyWithLimit(event);
  const parsed = createOrderSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const order = await createUserOrder({
    userId: session.user_id,
    packageCode: parsed.data.package_code,
    offerCode: parsed.data.offer_code,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? null,
  });

  setResponseStatus(event, 201);
  return order;
});
