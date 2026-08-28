import { createSign, generateKeyPairSync } from "node:crypto";
import {
  getOwnerDb,
  notificationDeliveries,
  notifications,
  users,
} from "@mindkid/db";
import { buildSnsStringToSign, type SnsMessage } from "@mindkid/notification";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import sesSnsHandler from "#server/api/guest/webhooks/ses-sns.post";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const CERT_PEM = String(publicKey.export({ type: "spki", format: "pem" }));

function mockSnsEvent(body: unknown) {
  return {
    method: "POST",
    node: { req: { headers: {} }, res: {} },
    context: { body },
    _body: body,
  } as unknown as Parameters<typeof sesSnsHandler>[0];
}

/** Mỗi ca dùng một URL riêng: `fetchSnsSigningCert` nhớ đệm theo URL. */
function stubCertFetch(certUrl: string, pem = CERT_PEM): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (String(url) !== certUrl) {
        return Promise.resolve({ ok: false, text: () => Promise.resolve("") });
      }
      return Promise.resolve({ ok: true, text: () => Promise.resolve(pem) });
    })
  );
}

function snsNotification(params: {
  certUrl: string;
  sesMessage: unknown;
}): SnsMessage {
  return {
    Type: "Notification",
    MessageId: `sns-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
    TopicArn: "arn:aws:sns:ap-southeast-1:123456789012:mindkid-ses-events",
    Message: JSON.stringify(params.sesMessage),
    Timestamp: new Date().toISOString(),
    SignatureVersion: "1",
    Signature: "",
    SigningCertURL: params.certUrl,
  };
}

function sign(msg: SnsMessage): SnsMessage {
  const signer = createSign("RSA-SHA1");
  signer.update(buildSnsStringToSign(msg) ?? "", "utf8");
  return { ...msg, Signature: signer.sign(privateKey, "base64") };
}

async function seedQueuedDelivery(providerMessageId: string) {
  const db = getOwnerDb();
  const [user] = await db
    .insert(users)
    .values({
      email: `ses_sns_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
      displayName: "SES SNS User",
    })
    .returning();

  const [notification] = await db
    .insert(notifications)
    .values({
      recipientType: "user",
      recipientId: user.id,
      templateCode: "email_verification",
    })
    .returning();

  const [delivery] = await db
    .insert(notificationDeliveries)
    .values({
      notificationId: notification.id,
      channel: "email",
      status: "queued",
      providerMessageId,
    })
    .returning();

  return { user, delivery };
}

async function readStatus(deliveryId: number): Promise<string> {
  const db = getOwnerDb();
  const [row] = await db
    .select()
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.id, deliveryId));
  return row.status;
}

describe("POST /api/guest/webhooks/ses-sns", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a forged signature and leaves the delivery untouched", async () => {
    const providerMessageId = `ses-forged-${Date.now()}`;
    const { delivery } = await seedQueuedDelivery(providerMessageId);
    const certUrl = `https://sns.ap-southeast-1.amazonaws.com/forged-${Date.now()}.pem`;
    stubCertFetch(certUrl);

    const msg = snsNotification({
      certUrl,
      sesMessage: {
        notificationType: "Bounce",
        mail: { messageId: providerMessageId, destination: ["a@example.com"] },
        bounce: { bounceType: "Permanent" },
      },
    });
    msg.Signature = Buffer.from("forged").toString("base64");

    await expect(sesSnsHandler(mockSnsEvent(msg))).rejects.toThrow();
    expect(await readStatus(delivery.id)).toBe("queued");
  });

  it("rejects an unsigned payload that carries no SNS envelope", async () => {
    const providerMessageId = `ses-bare-${Date.now()}`;
    const { delivery } = await seedQueuedDelivery(providerMessageId);

    // Đây chính là hình dạng mà route cũ nhận và xử lý: không phong bì SNS,
    // không chữ ký, chỉ mỗi thân sự kiện SES.
    await expect(
      sesSnsHandler(
        mockSnsEvent({
          notificationType: "Bounce",
          mail: {
            messageId: providerMessageId,
            destination: ["a@example.com"],
          },
          bounce: { bounceType: "Permanent" },
        })
      )
    ).rejects.toThrow();
    expect(await readStatus(delivery.id)).toBe("queued");
  });

  it("rejects a cert URL outside the AWS SNS domain", async () => {
    const providerMessageId = `ses-ssrf-${Date.now()}`;
    const { delivery } = await seedQueuedDelivery(providerMessageId);
    const certUrl = "https://attacker.example.com/cert.pem";
    stubCertFetch(certUrl);

    const msg = sign(
      snsNotification({
        certUrl,
        sesMessage: {
          notificationType: "Bounce",
          mail: {
            messageId: providerMessageId,
            destination: ["a@example.com"],
          },
          bounce: { bounceType: "Permanent" },
        },
      })
    );

    await expect(sesSnsHandler(mockSnsEvent(msg))).rejects.toThrow();
    expect(await readStatus(delivery.id)).toBe("queued");
  });

  it("marks the delivery dispatched when the signature verifies", async () => {
    const providerMessageId = `ses-ok-${Date.now()}`;
    const { delivery } = await seedQueuedDelivery(providerMessageId);
    const certUrl = `https://sns.ap-southeast-1.amazonaws.com/ok-${Date.now()}.pem`;
    stubCertFetch(certUrl);

    const msg = sign(
      snsNotification({
        certUrl,
        sesMessage: {
          notificationType: "Delivery",
          mail: {
            messageId: providerMessageId,
            destination: ["a@example.com"],
          },
        },
      })
    );

    const res = await sesSnsHandler(mockSnsEvent(msg));

    expect(res.status).toBe("processed");
    expect(await readStatus(delivery.id)).toBe("dispatched");
  });

  it("records a bounce as failed when the signature verifies", async () => {
    const providerMessageId = `ses-bounce-${Date.now()}`;
    const { delivery } = await seedQueuedDelivery(providerMessageId);
    const certUrl = `https://sns.ap-southeast-1.amazonaws.com/bounce-${Date.now()}.pem`;
    stubCertFetch(certUrl);

    const msg = sign(
      snsNotification({
        certUrl,
        sesMessage: {
          notificationType: "Bounce",
          mail: {
            messageId: providerMessageId,
            destination: ["a@example.com"],
          },
          bounce: {
            bounceType: "Permanent",
            bouncedRecipients: [{ diagnosticCode: "550 mailbox not found" }],
          },
        },
      })
    );

    await sesSnsHandler(mockSnsEvent(msg));

    expect(await readStatus(delivery.id)).toBe("failed");
  });
});
