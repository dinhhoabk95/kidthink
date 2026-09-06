import { getOwnerDb, notificationDeliveries } from "@mindkid/db";
import { WebhookSignatureInvalidError } from "@mindkid/errors/billing";
import { type SnsMessage, verifySnsSignature } from "@mindkid/notification";
import { eq } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { readRequestBody } from "#server/utils/request-body";

/**
 * Phong bì SNS. Đây là **toàn bộ** danh tính của người gọi: endpoint nằm dưới
 * `/api/guest/` nên không có phiên, không có cookie, không có header bí mật.
 * Chữ ký RSA trên phong bì là thứ duy nhất phân biệt AWS với người lạ.
 *
 * Cấm — NEVER xử lý thân sự kiện SES khi chưa qua `verifySnsSignature`: mọi
 * nhánh dưới đều ghi `notification_deliveries`.
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

/**
 * SES gửi `notificationType` ở định dạng thông báo cũ và `eventType` ở định
 * dạng Event Publishing. Chấp cả hai — route trước chỉ đọc `notificationType`.
 */
const SesEventSchema = z.object({
  notificationType: z.enum(["Delivery", "Bounce", "Complaint"]).optional(),
  eventType: z.enum(["Delivery", "Bounce", "Complaint"]).optional(),
  mail: z.object({
    messageId: z.string().min(1),
    destination: z.array(z.string()).optional(),
  }),
  bounce: z
    .object({
      bounceType: z.string().optional(),
      bounceSubType: z.string().optional(),
      bouncedRecipients: z
        .array(
          z.object({
            emailAddress: z.string().optional(),
            diagnosticCode: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  complaint: z
    .object({
      complaintFeedbackType: z.string().optional(),
    })
    .optional(),
});

type SesEvent = z.infer<typeof SesEventSchema>;

async function handleDelivery(messageId: string): Promise<void> {
  const db = getOwnerDb();
  await db
    .update(notificationDeliveries)
    .set({
      status: "dispatched",
      dispatchedAt: new Date(),
    })
    .where(eq(notificationDeliveries.providerMessageId, messageId));
}

async function handleBounce(
  messageId: string,
  sesEvent: SesEvent
): Promise<void> {
  const db = getOwnerDb();
  const bounceReason =
    sesEvent.bounce?.bouncedRecipients?.[0]?.diagnosticCode ||
    sesEvent.bounce?.bounceType ||
    "Bounced";
  await db
    .update(notificationDeliveries)
    .set({
      status: "failed",
      error: bounceReason,
    })
    .where(eq(notificationDeliveries.providerMessageId, messageId));
}

async function handleComplaint(
  messageId: string,
  sesEvent: SesEvent
): Promise<void> {
  const db = getOwnerDb();
  const complaintReason =
    sesEvent.complaint?.complaintFeedbackType || "Spam complaint";
  await db
    .update(notificationDeliveries)
    .set({
      status: "suppressed",
      suppressedReason: complaintReason,
    })
    .where(eq(notificationDeliveries.providerMessageId, messageId));
}

export default defineEventHandler(async (event) => {
  const envelope = SnsEnvelopeSchema.safeParse(await readRequestBody(event));
  if (!envelope.success) {
    throw new WebhookSignatureInvalidError("Yêu cầu thiếu phong bì SNS đã ký.");
  }

  const message = envelope.data as SnsMessage;
  if (!(await verifySnsSignature(message))) {
    throw new WebhookSignatureInvalidError(
      "Chữ ký SNS không hợp lệ hoặc chứng chỉ ký không thuộc AWS."
    );
  }

  if (message.Type !== "Notification") {
    return { status: "subscription_confirmed" };
  }

  const parsedMessage = ((): unknown => {
    try {
      return JSON.parse(message.Message);
    } catch {
      return null;
    }
  })();

  const sesEvent = SesEventSchema.safeParse(parsedMessage);
  if (!sesEvent.success) {
    return { status: "no_message_id" };
  }

  const messageId = sesEvent.data.mail.messageId;
  const kind = sesEvent.data.notificationType ?? sesEvent.data.eventType;

  if (kind === "Delivery") {
    await handleDelivery(messageId);
  } else if (kind === "Bounce") {
    await handleBounce(messageId, sesEvent.data);
  } else if (kind === "Complaint") {
    await handleComplaint(messageId, sesEvent.data);
  }

  return { status: "processed", message_id: messageId };
});
