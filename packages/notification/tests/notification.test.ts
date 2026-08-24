import { describe, expect, it } from "vitest";
import {
  FakeLocalEmailDriver,
  NodemailerSmtpDriver,
  parseAndVerifySesNotification,
  renderEmailTemplate,
  verifySnsCertUrl,
} from "#src/index";

const FAKE_MSG_ID_REGEX = /^msg_fake_/;

describe("@mindkid/notification tests", () => {
  describe("Typed MJML renderer", () => {
    it("renders all 11 notification template codes successfully", async () => {
      const templates = [
        {
          code: "email_verification",
          payload: {
            url: "https://tinimath.vn/verify?code=123",
            code: "123456",
          },
        },
        {
          code: "password_reset",
          payload: { url: "https://tinimath.vn/reset?token=xyz" },
        },
        {
          code: "order_submitted",
          payload: {
            orderCode: "ORD-001",
            packageName: "Standard",
            amountFormatted: "499.000đ",
          },
        },
        {
          code: "order_approved",
          payload: { orderCode: "ORD-001", packageName: "Standard" },
        },
        {
          code: "order_rejected",
          payload: { orderCode: "ORD-001", reason: "Chưa chuyển khoản" },
        },
        {
          code: "subscription_expiring",
          payload: { packageName: "Standard", daysLeft: 3 },
        },
        { code: "subscription_expired", payload: { packageName: "Standard" } },
        {
          code: "weekly_progress",
          payload: { childName: "Bé An", lessonsCompleted: 5, starsEarned: 15 },
        },
        {
          code: "content_new",
          payload: {
            title: "Bài học mới",
            description: "Cập nhật bài toán đếm",
          },
        },
        {
          code: "admin_order_pending",
          payload: { orderCode: "ORD-001", countPending: 2 },
        },
        {
          code: "admin_alert",
          payload: { alertTitle: "High Load", message: "CPU > 90%" },
        },
      ] as const;

      for (const t of templates) {
        const res = await renderEmailTemplate(t.code as any, t.payload);
        expect(res.subject).toBeTruthy();
        expect(res.html).toContain("<!doctype html>");
        expect(res.text).toBeTruthy();
      }
    });

    it("escapes HTML special characters in template variables to prevent XSS", async () => {
      const res = await renderEmailTemplate("order_rejected", {
        orderCode: "ORD-XSS",
        reason: "<script>alert('xss')</script>",
      });

      expect(res.html).not.toContain("<script>");
      expect(res.html).toContain(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
      );
    });

    it("throws error when missing required variables", async () => {
      await expect(
        renderEmailTemplate("email_verification", { code: "123" })
      ).rejects.toThrow("Missing required variable 'url'");
    });
  });

  describe("Email drivers", () => {
    it("FakeLocalEmailDriver records sent emails in memory", async () => {
      const driver = new FakeLocalEmailDriver();
      const res = await driver.sendEmail({
        to: "parent@example.com",
        code: "email_verification",
        payload: { url: "https://tinimath.vn/v", code: "123456" },
      });

      expect(res.sent).toBe(true);
      expect(res.providerMessageId).toMatch(FAKE_MSG_ID_REGEX);
      expect(driver.getSentMails()).toHaveLength(1);
    });

    it("NodemailerSmtpDriver lazy initializes and validates email recipient", async () => {
      const driver = new NodemailerSmtpDriver({
        host: "smtp.mailtrap.io",
        port: 2525,
        user: "test_user",
        pass: "test_pass",
        from: "noreply@tinimath.vn",
      });

      await expect(
        driver.sendEmail({
          to: "invalid-email",
          code: "email_verification",
          payload: { url: "x", code: "123" },
        })
      ).rejects.toThrow("BR-NOT-02 violation");
    });
  });

  describe("SNS / SES Verifier", () => {
    it("verifySnsCertUrl enforces AWS SNS domain pattern", () => {
      expect(
        verifySnsCertUrl(
          "https://sns.us-east-1.amazonaws.com/SimpleNotificationService.pem"
        )
      ).toBe(true);
      expect(
        verifySnsCertUrl("https://sns.ap-southeast-1.amazonaws.com/cert.pem")
      ).toBe(true);
      expect(verifySnsCertUrl("https://hacker.com/cert.pem")).toBe(false);
      expect(
        verifySnsCertUrl("http://sns.us-east-1.amazonaws.com/cert.pem")
      ).toBe(false);
    });

    it("parseAndVerifySesNotification parses valid SES event inside SNS message", () => {
      const snsMsg = {
        Type: "Notification",
        MessageId: "sns-123",
        TopicArn: "arn:aws:sns:ap-southeast-1:123456789012:tinimath-ses-events",
        Message: JSON.stringify({
          eventType: "Bounce",
          mail: { messageId: "ses-msg-1", destination: ["user@example.com"] },
          bounce: {
            bounceType: "Permanent",
            bouncedRecipients: [{ emailAddress: "user@example.com" }],
          },
        }),
        Timestamp: new Date().toISOString(),
        SignatureVersion: "1",
        Signature: "dummy_signature",
        SigningCertURL: "https://sns.ap-southeast-1.amazonaws.com/cert.pem",
      };

      const res = parseAndVerifySesNotification(snsMsg, {
        allowedTopicArns: [
          "arn:aws:sns:ap-southeast-1:123456789012:tinimath-ses-events",
        ],
      });

      expect(res.valid).toBe(true);
      expect(res.event?.eventType).toBe("Bounce");
      expect(res.event?.mail.messageId).toBe("ses-msg-1");
    });

    it("rejects SNS payload with disallowed TopicArn", () => {
      const snsMsg = {
        Type: "Notification",
        MessageId: "sns-123",
        TopicArn: "arn:aws:sns:ap-southeast-1:999999999999:malicious-topic",
        Message: "{}",
        Timestamp: new Date().toISOString(),
        SignatureVersion: "1",
        Signature: "dummy",
        SigningCertURL: "https://sns.ap-southeast-1.amazonaws.com/cert.pem",
      };

      const res = parseAndVerifySesNotification(snsMsg, {
        allowedTopicArns: [
          "arn:aws:sns:ap-southeast-1:123456789012:tinimath-ses-events",
        ],
      });

      expect(res.valid).toBe(false);
      expect(res.error).toContain("TopicArn not in allow-list");
    });
  });
});
