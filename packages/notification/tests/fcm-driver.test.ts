import { describe, expect, it, vi } from "vitest";
import { type FcmAdminMessaging, sendFcmWebPush } from "#src/fcm-driver";

describe("FCM Server Driver Unit Tests", () => {
  it("BR-BPS-05 & BR-BPS-06: Sends minimal payload without child PII and returns dispatched status", async () => {
    const mockMessaging: FcmAdminMessaging = {
      send: vi.fn().mockResolvedValue("projects/test/messages/msg_12345"),
    };

    const result = await sendFcmWebPush(mockMessaging, "fcm_token_xyz", {
      notificationId: 101,
      title: "Thông báo mới",
      body: "Nội dung thông báo",
      actionUrl: "/me/notifications",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("dispatched");
    expect(result.providerMessageId).toBe("projects/test/messages/msg_12345");

    // Verify sent payload has no child PII keys
    expect(mockMessaging.send).toHaveBeenCalledWith({
      token: "fcm_token_xyz",
      notification: {
        title: "Thông báo mới",
        body: "Nội dung thông báo",
      },
      data: {
        notification_id: "101",
        action_url: "/me/notifications",
      },
    });
  });

  it("BR-BPS-08: Marks status invalid and terminal on token not registered error", async () => {
    const mockMessaging: FcmAdminMessaging = {
      send: vi.fn().mockRejectedValue({
        code: "messaging/registration-token-not-registered",
        message: "Requested entity was not found.",
      }),
    };

    const result = await sendFcmWebPush(mockMessaging, "fcm_token_expired", {
      notificationId: 102,
      title: "Title",
      body: "Body",
      actionUrl: "/me",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("invalid");
    expect(result.terminal).toBe(true);
  });

  it("BR-BPS-08: Marks status failed and non-terminal on transient network error", async () => {
    const mockMessaging: FcmAdminMessaging = {
      send: vi.fn().mockRejectedValue({
        code: "messaging/internal-error",
        message: "Internal server error",
      }),
    };

    const result = await sendFcmWebPush(mockMessaging, "fcm_token_valid", {
      notificationId: 103,
      title: "Title",
      body: "Body",
      actionUrl: "/me",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.terminal).toBe(false);
  });
});
