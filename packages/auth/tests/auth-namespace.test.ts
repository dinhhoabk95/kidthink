import { describe, expect, it } from "vitest";
import { deriveInstanceSecret } from "#src/index";

describe("Better Auth Instance Domain-Separated Secrets (BR-AUT-39)", () => {
  const ROOT_SECRET = "0123456789abcdef0123456789abcdef";

  it("derives distinct deterministic secrets for user and manager instances", () => {
    const userSecret = deriveInstanceSecret(ROOT_SECRET, "user");
    const managerSecret = deriveInstanceSecret(ROOT_SECRET, "manager");

    expect(userSecret).not.toBe(managerSecret);
    expect(userSecret.length).toBeGreaterThanOrEqual(43);
    expect(deriveInstanceSecret(ROOT_SECRET, "user")).toBe(userSecret);
  });

  it("rejects root secrets shorter than 32 bytes", () => {
    expect(() => deriveInstanceSecret("short-secret", "user")).toThrow(
      "at least 32 bytes"
    );
  });
});
