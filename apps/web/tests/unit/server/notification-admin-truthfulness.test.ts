import {
  getNotificationTemplateState,
  listNotificationTemplateStates,
  publishNotificationTemplate,
  renderEmailTemplate,
  resetNotificationTemplateOverrides,
  saveNotificationTemplateDraft,
} from "@mindkid/notification";
import { beforeEach, describe, expect, it } from "vitest";
import { sanitizeNotificationPayload } from "#server/api/managers/notifications/index.get";

describe("Notification Admin Truthfulness (BR-NTA-01..07, #299 S4)", () => {
  beforeEach(() => {
    resetNotificationTemplateOverrides();
  });

  it("Scenario: BR-NTA-03 — draft template is persisted but NEVER used by renderEmailTemplate until published", async () => {
    const initialRendered = await renderEmailTemplate("order_approved", {
      orderCode: "MK-100",
      packageName: "Gói Gia Đình",
    });
    expect(initialRendered.subject).toContain("MK-100");
    expect(initialRendered.html).toContain("Gói Gia Đình");

    // Save a draft override
    const draftState = saveNotificationTemplateDraft({
      code: "order_approved",
      subject: "[Draft] Đơn #{{orderCode}} đang chờ duyệt mẫu",
      body: "<p>Bản nháp cho gói {{packageName}} (#{{orderCode}})</p>",
      updatedByManagerId: 1,
      baseVersion: 1,
    });

    expect(draftState.status).toBe("draft");
    expect(draftState.content_version).toBe(2);
    expect(draftState.published_version).toBe(1);

    // Worker render (useDraft = false by default) MUST still use published v1 (BR-NTA-03)
    const workerRenderedWhileDraft = await renderEmailTemplate(
      "order_approved",
      {
        orderCode: "MK-100",
        packageName: "Gói Gia Đình",
      }
    );
    expect(workerRenderedWhileDraft.subject).not.toContain("[Draft]");
    expect(workerRenderedWhileDraft.html).not.toContain("Bản nháp cho gói");

    // Admin preview with useDraft = true sees the draft
    const previewDraft = await renderEmailTemplate(
      "order_approved",
      {
        orderCode: "MK-100",
        packageName: "Gói Gia Đình",
      },
      { useDraft: true }
    );
    expect(previewDraft.subject).toContain("[Draft] Đơn #MK-100");
    expect(previewDraft.html).toContain("Bản nháp cho gói Gói Gia Đình");

    // Publish the template -> worker now uses published v2
    const publishedState = publishNotificationTemplate({
      code: "order_approved",
      updatedByManagerId: 1,
    });
    expect(publishedState.status).toBe("published");
    expect(publishedState.content_version).toBe(2);
    expect(publishedState.published_version).toBe(2);

    const workerRenderedAfterPublish = await renderEmailTemplate(
      "order_approved",
      {
        orderCode: "MK-200",
        packageName: "Gói Giáo Viên",
      }
    );
    expect(workerRenderedAfterPublish.subject).toContain("[Draft] Đơn #MK-200");
    expect(workerRenderedAfterPublish.html).toContain(
      "Bản nháp cho gói Gói Giáo Viên"
    );

    const listed = listNotificationTemplateStates();
    const orderApprovedInList = listed.find((t) => t.code === "order_approved");
    expect(orderApprovedInList?.status).toBe("published");
    expect(orderApprovedInList?.content_version).toBe(2);
    expect(getNotificationTemplateState("order_approved").status).toBe(
      "published"
    );
  });

  it("Scenario: BR-NTA-04 — sanitizeNotificationPayload masks all sensitive token/otp/secret fields while preserving business codes", () => {
    const sanitized = sanitizeNotificationPayload(
      {
        order_code: "MK-999",
        package_code: "standard",
        otp: "123456",
        code: "654321",
        token: "raw-token-abc",
        reset_token: "reset-secret-xyz",
        verify_token: "verify-secret-xyz",
        password: "plain-password",
      },
      "password_reset"
    );

    expect(sanitized).toEqual({
      order_code: "MK-999",
      package_code: "standard",
      otp: "******",
      code: "******",
      token: "******",
      reset_token: "******",
      verify_token: "******",
      password: "******",
    });
  });
});
