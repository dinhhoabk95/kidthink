import { getOwnerDb, notificationDeliveries } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";

interface SnsEnvelope {
  Type: string;
  MessageId?: string;
  Message?: string;
  Subject?: string;
}

interface SesEventMessage {
  notificationType: "Delivery" | "Bounce" | "Complaint";
  mail?: {
    messageId?: string;
    destination?: string[];
  };
  bounce?: {
    bounceType?: string;
    bounceSubType?: string;
    bouncedRecipients?: Array<{
      emailAddress?: string;
      diagnosticCode?: string;
    }>;
  };
  complaint?: {
    complaintFeedbackType?: string;
  };
}

function parseSesMessage(
  body: SnsEnvelope | SesEventMessage
): SesEventMessage | null {
  if (
    "Type" in body &&
    body.Type === "Notification" &&
    typeof body.Message === "string"
  ) {
    try {
      return JSON.parse(body.Message) as SesEventMessage;
    } catch {
      return null;
    }
  }
  if ("notificationType" in body) {
    return body as SesEventMessage;
  }
  return null;
}

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
  sesMessage: SesEventMessage
): Promise<void> {
  const db = getOwnerDb();
  const bounceReason =
    sesMessage.bounce?.bouncedRecipients?.[0]?.diagnosticCode ||
    sesMessage.bounce?.bounceType ||
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
  sesMessage: SesEventMessage
): Promise<void> {
  const db = getOwnerDb();
  const complaintReason =
    sesMessage.complaint?.complaintFeedbackType || "Spam complaint";
  await db
    .update(notificationDeliveries)
    .set({
      status: "suppressed",
      suppressedReason: complaintReason,
    })
    .where(eq(notificationDeliveries.providerMessageId, messageId));
}

export default defineEventHandler(async (event) => {
  const body =
    (event.context?.body as SnsEnvelope | SesEventMessage | null) ||
    ((event as Record<string, unknown>)._body as
      | SnsEnvelope
      | SesEventMessage
      | null) ||
    ((await readBody(event).catch(() => null)) as
      | SnsEnvelope
      | SesEventMessage
      | null);

  if (!body) {
    return { status: "ignored" };
  }

  if ("Type" in body && body.Type === "SubscriptionConfirmation") {
    return { status: "subscription_confirmed" };
  }

  const sesMessage = parseSesMessage(body);
  if (!sesMessage?.mail?.messageId) {
    return { status: "no_message_id" };
  }

  const messageId = sesMessage.mail.messageId;

  if (sesMessage.notificationType === "Delivery") {
    await handleDelivery(messageId);
  } else if (sesMessage.notificationType === "Bounce") {
    await handleBounce(messageId, sesMessage);
  } else if (sesMessage.notificationType === "Complaint") {
    await handleComplaint(messageId, sesMessage);
  }

  return { status: "processed", message_id: messageId };
});
