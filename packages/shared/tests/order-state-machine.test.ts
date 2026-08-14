import { ORDER_PENDING_TTL_HOURS, SOFT_UNLOCK_DAYS } from "@kidthink/config";
import { describe, expect, it } from "vitest";
import {
  assertPaymentOrderTransition,
  canTransitionPaymentOrderStatus,
  computeOrderPendingExpiresAt,
  computeSoftUnlockExpiresAt,
  formatTransferNote,
  isTerminalPaymentOrderStatus,
  PAYMENT_ORDER_TERMINAL_STATES,
  PAYMENT_ORDER_TRANSITIONS,
  type PaymentOrderStatus,
} from "../src/payment-state-machine.ts";

const ERR_INVALID_TRANSITION = /INVALID_STATUS_TRANSITION/;
const TRANSFER_NOTE_PATTERN = /^TM[A-Z0-9]{8}$/;

describe("Payment Order State Machine (BR-PAY-01, BR-PAY-08, Spec §7.1)", () => {
  const ALL_STATES: PaymentOrderStatus[] = [
    "draft",
    "pending",
    "pending_proof",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "cancelled",
    "expired",
  ];

  it("validates all permitted transitions defined in §7.1 matrix", () => {
    // draft -> pending, cancelled
    expect(canTransitionPaymentOrderStatus("draft", "pending")).toBe(true);
    expect(canTransitionPaymentOrderStatus("draft", "cancelled")).toBe(true);

    // pending -> pending_proof, submitted, cancelled, expired
    expect(canTransitionPaymentOrderStatus("pending", "pending_proof")).toBe(
      true
    );
    expect(canTransitionPaymentOrderStatus("pending", "submitted")).toBe(true);
    expect(canTransitionPaymentOrderStatus("pending", "cancelled")).toBe(true);
    expect(canTransitionPaymentOrderStatus("pending", "expired")).toBe(true);

    // pending_proof -> submitted, cancelled, expired
    expect(canTransitionPaymentOrderStatus("pending_proof", "submitted")).toBe(
      true
    );
    expect(canTransitionPaymentOrderStatus("pending_proof", "cancelled")).toBe(
      true
    );
    expect(canTransitionPaymentOrderStatus("pending_proof", "expired")).toBe(
      true
    );

    // submitted -> under_review, approved, rejected
    expect(canTransitionPaymentOrderStatus("submitted", "under_review")).toBe(
      true
    );
    expect(canTransitionPaymentOrderStatus("submitted", "approved")).toBe(true);
    expect(canTransitionPaymentOrderStatus("submitted", "rejected")).toBe(true);

    // under_review -> approved, rejected
    expect(canTransitionPaymentOrderStatus("under_review", "approved")).toBe(
      true
    );
    expect(canTransitionPaymentOrderStatus("under_review", "rejected")).toBe(
      true
    );
  });

  it("rejects all forbidden transitions with INVALID_STATUS_TRANSITION", () => {
    for (const from of ALL_STATES) {
      const allowed = PAYMENT_ORDER_TRANSITIONS[from];
      for (const to of ALL_STATES) {
        if (!allowed.includes(to)) {
          expect(canTransitionPaymentOrderStatus(from, to)).toBe(false);
          expect(() => assertPaymentOrderTransition(from, to)).toThrowError(
            ERR_INVALID_TRANSITION
          );
        }
      }
    }
  });

  it("enforces that all 4 terminal states have 0 outgoing transitions", () => {
    expect(PAYMENT_ORDER_TERMINAL_STATES).toEqual([
      "approved",
      "rejected",
      "cancelled",
      "expired",
    ]);

    for (const term of PAYMENT_ORDER_TERMINAL_STATES) {
      expect(isTerminalPaymentOrderStatus(term)).toBe(true);
      expect(PAYMENT_ORDER_TRANSITIONS[term]).toHaveLength(0);
      for (const target of ALL_STATES) {
        expect(canTransitionPaymentOrderStatus(term, target)).toBe(false);
        expect(() => assertPaymentOrderTransition(term, target)).toThrowError(
          ERR_INVALID_TRANSITION
        );
      }
    }
  });

  it("formats transfer note deterministically from UUID", () => {
    const note1 = formatTransferNote("550e8400-e29b-41d4-a716-446655440000");
    expect(note1).toBe("TM550E8400");
    expect(note1).toMatch(TRANSFER_NOTE_PATTERN);

    const note2 = formatTransferNote("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    expect(note2).toBe("TMA1B2C3D4");
  });

  it("calculates soft unlock and pending expiration using constants", () => {
    expect(SOFT_UNLOCK_DAYS).toBe(3);
    expect(ORDER_PENDING_TTL_HOURS).toBe(48);

    const baseDate = new Date("2026-08-15T10:00:00.000Z");
    const softUnlockExp = computeSoftUnlockExpiresAt(baseDate);
    expect(softUnlockExp.toISOString()).toBe("2026-08-18T10:00:00.000Z");

    const pendingExp = computeOrderPendingExpiresAt(baseDate);
    expect(pendingExp.toISOString()).toBe("2026-08-17T10:00:00.000Z");
  });
});
