import { describe, expect, it } from "vitest";
import { defaultChargeHandler } from "./payment-jobs.js";

type DueSubscription = Parameters<typeof defaultChargeHandler>[0];

function subWithSnapshot(snapshot: DueSubscription["consentSnapshot"]) {
  return { id: 7, consentSnapshot: snapshot } as DueSubscription;
}

describe("BR-RBL-07 — defaultChargeHandler không tự báo đã thu tiền", () => {
  it("auto_charge_ready=true vẫn paid:false và không sinh transactionRef", async () => {
    const outcome = await defaultChargeHandler(
      subWithSnapshot({ auto_charge_ready: true })
    );
    expect(outcome.paid).toBe(false);
    expect(outcome.transactionRef).toBeUndefined();
  });

  it("không có snapshot cũng paid:false", async () => {
    const outcome = await defaultChargeHandler(subWithSnapshot(null));
    expect(outcome.paid).toBe(false);
  });
});
