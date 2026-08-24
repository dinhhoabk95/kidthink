import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_TYPES,
  OPTIONAL_NOTIFICATION_CODES,
  validateNotificationPreferencesUpdate,
} from "#src/notifications";

describe("Notification Registry & Preferences Guard (Task 2 / BR-NOT-01 & BR-NOT-06)", () => {
  it("has exactly 14 defined notification types as const", () => {
    const keys = Object.keys(NOTIFICATION_TYPES);
    expect(keys).toHaveLength(14);
  });

  it("only weekly_progress and content_new are opt-outable", () => {
    expect(OPTIONAL_NOTIFICATION_CODES).toEqual([
      "weekly_progress",
      "content_new",
    ]);
  });

  it("validateNotificationPreferencesUpdate passes for valid optional keys", () => {
    const result = validateNotificationPreferencesUpdate({
      weekly_progress: false,
      content_new: true,
    });
    expect(result).toEqual({
      weekly_progress: false,
      content_new: true,
    });
  });

  it("Ca âm BR-NOT-01: updating preference for order_approved throws error", () => {
    expect(() =>
      validateNotificationPreferencesUpdate({ order_approved: false })
    ).toThrow(
      "BR-NOT-01 violation: Cannot update preference for non-opt-outable notification 'order_approved'"
    );
  });

  it("Ca âm BR-NOT-06: marketing or promo notification types do not exist in registry", () => {
    const keys = Object.keys(NOTIFICATION_TYPES);
    const marketingKeys = keys.filter(
      (k) =>
        k.includes("promo") || k.includes("marketing") || k.includes("sale")
    );
    expect(marketingKeys).toHaveLength(0);
  });
});
