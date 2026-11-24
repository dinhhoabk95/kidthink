import { AUTOMATED_PAYMENT_PROVIDERS } from "@mindkid/shared";
import { getRouterParam } from "h3";
import { z } from "zod";
import { createUserOrderCheckoutSession } from "#server/services/order-service";
import { throwValidationError } from "#server/utils/api-error";
import { defineApiRoute } from "#server/utils/define-api-route";

const orderParamSchema = z.object({
  uuid: z.string().uuid(),
});

const checkoutSessionSchema = z.object({
  provider: z.enum(AUTOMATED_PAYMENT_PROVIDERS).default("payos"),
  return_url: z.string().url().optional(),
  // Accepted in schema so client payload does not fail validation, but always ignored (BR-APM-03)
  amount_vnd: z.number().optional(),
});

export default defineApiRoute({
  auth: "user",
  body: checkoutSessionSchema,
  handler: async ({ event, auth, body }) => {
    const rawUuid =
      getRouterParam(event, "uuid") || event.context?.params?.uuid;
    const paramParsed = orderParamSchema.safeParse({ uuid: rawUuid });
    if (!paramParsed.success) {
      throwValidationError(paramParsed.error);
    }

    return await createUserOrderCheckoutSession({
      userId: auth.user_id,
      orderUuid: paramParsed.data.uuid,
      provider: body.provider ?? "payos",
    });
  },
});
