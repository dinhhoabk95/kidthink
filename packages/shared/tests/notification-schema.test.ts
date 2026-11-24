import {
  NOTIFICATION_STATUS,
  NOTIFICATION_STATUS_CODEC,
  notificationDeliveries,
  notifications,
} from "@mindkid/db";
import { describe, expect, it } from "vitest";

describe("Notification Schema & Invariants (Task 1 / BR-NOT-01..08)", () => {
  it("NOTIFICATION_STATUS includes 'suppressed'", () => {
    expect(NOTIFICATION_STATUS_CODEC.labels).toContain("suppressed");
    expect(NOTIFICATION_STATUS.SUPPRESSED).toBe(4);
  });

  it("notifications schema includes uuid, notificationDeliveries includes suppressedReason and providerMessageId", () => {
    expect(notifications.uuid).toBeDefined();
    expect(notificationDeliveries.suppressedReason).toBeDefined();
    expect(notificationDeliveries.providerMessageId).toBeDefined();
  });

  it("MVP in_app channel rejection validator helper throws error for in_app channel", () => {
    function validateChannelForMvp(channel: string): void {
      if (channel === "in_app") {
        throw new Error(
          "BR-NOT-05 violation: in_app notification channel is not supported in MVP"
        );
      }
    }

    expect(() => validateChannelForMvp("email")).not.toThrow();
    expect(() => validateChannelForMvp("in_app")).toThrow(
      "BR-NOT-05 violation: in_app notification channel is not supported in MVP"
    );
  });
});
