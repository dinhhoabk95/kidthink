import { describe, expect, it } from "vitest";
import {
  type EmailTemplateCode,
  FakeLocalEmailDriver,
  NodemailerSmtpDriver,
  renderEmailTemplate,
} from "#src/index";

const FAKE_MSG_ID_REGEX = /^msg_fake_/;

describe("@mindkid/notification tests (BR-NOT-09, BR-NOT-10, BR-NOT-13)", () => {
  describe("Typed MJML renderer (BR-NOT-08, BR-NOT-09)", () => {
    it("renders all notification template codes successfully", async () => {
      const templates: ReadonlyArray<{
        code: EmailTemplateCode;
        payload: Record<string, string | number>;
      }> = [
        {
          code: "email_verification",
          payload: {
            url: "https://tinimath.vn/verify?code=123",
            code: "123456",
          },
        },
        {
          code: "email_verification",
          payload: {
            url: "https://tinimath.vn/xac-thuc?token=abc",
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
        {
          code: "social_identity_linked",
          payload: { provider: "google" },
        },
        {
          code: "social_identity_unlinked",
          payload: { provider: "facebook" },
        },
      ];

      for (const t of templates) {
        const res = await renderEmailTemplate(t.code, t.payload);
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

  describe("Email drivers (BR-NOT-02, BR-NOT-10, BR-NOT-13)", () => {
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

    it("NodemailerSmtpDriver lazy initializes and validates email recipient (BR-NOT-02, BR-NOT-10)", async () => {
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
});
