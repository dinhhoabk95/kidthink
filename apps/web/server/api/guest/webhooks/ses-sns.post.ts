import { WebhookSignatureInvalidError } from "@mindkid/errors/billing";
import type { SnsMessage } from "@mindkid/notification";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { processSesSnsNotification } from "#server/services/notification-service";
import { readRequestBody } from "#server/utils/request-body";

/**
 * Phong bì SNS. Đây là **toàn bộ** danh tính của người gọi: endpoint nằm dưới
 * `/api/guest/` nên không có phiên, không có cookie, không có header bí mật.
 * Chữ ký RSA trên phong bì là thứ duy nhất phân biệt AWS với người lạ.
 */
const SnsEnvelopeSchema = z.object({
  Type: z.enum([
    "Notification",
    "SubscriptionConfirmation",
    "UnsubscribeConfirmation",
  ]),
  MessageId: z.string().min(1),
  TopicArn: z.string().min(1),
  Subject: z.string().optional(),
  Message: z.string(),
  Timestamp: z.string().min(1),
  SignatureVersion: z.string().min(1),
  Signature: z.string().min(1),
  SigningCertURL: z.string().url(),
  SubscribeURL: z.string().optional(),
  Token: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const envelope = SnsEnvelopeSchema.safeParse(await readRequestBody(event));
  if (!envelope.success) {
    throw new WebhookSignatureInvalidError("Yêu cầu thiếu phong bì SNS đã ký.");
  }

  return await processSesSnsNotification(envelope.data as SnsMessage);
});
