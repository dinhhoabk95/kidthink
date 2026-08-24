import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalFileEmailAdapter } from "#src/email-sender";

describe("LocalFileEmailAdapter (Task 3 / BR-NOT-02)", () => {
  const testDir = ".backups/test-emails";

  it("writes email to local file and returns providerMessageId", async () => {
    const adapter = new LocalFileEmailAdapter(testDir);
    const res = await adapter.sendEmail({
      to: "parent@example.com",
      code: "order_approved",
      payload: { orderId: "ORD-123" },
    });

    expect(res.sent).toBe(true);
    expect(res.providerMessageId).toBeDefined();

    const filePath = path.join(testDir, `${res.providerMessageId}.json`);
    expect(fs.existsSync(filePath)).toBe(true);

    const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(fileContent.to).toBe("parent@example.com");
    expect(fileContent.code).toBe("order_approved");
    expect(fileContent.payload).toEqual({ orderId: "ORD-123" });

    // Clean up
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("BR-NOT-02: throws error if recipient is not a valid email string", async () => {
    const adapter = new LocalFileEmailAdapter(testDir);
    await expect(
      adapter.sendEmail({
        to: "child_profile_123" as any,
        code: "order_approved",
        payload: {},
      })
    ).rejects.toThrow("BR-NOT-02 violation");
  });

  it("suppresses email for deleted accounts", async () => {
    const adapter = new LocalFileEmailAdapter(testDir);
    const res = await adapter.sendEmail({
      to: "deleted@example.com",
      code: "weekly_progress",
      payload: {},
      recipientStatus: "deleted",
    });

    expect(res.sent).toBe(false);
    expect(res.suppressedReason).toBe("ACCOUNT_DELETED");
  });
});
