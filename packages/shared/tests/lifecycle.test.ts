import { describe, expect, it } from "vitest";
import {
  CONTENT_LIFECYCLE_STATUSES,
  canTransition,
  isInitialStatusValid,
} from "../src/lifecycle.ts";

describe("P0.6 Task 2 — Bảng chuyển trạng thái (content-lifecycle.md §7.1)", () => {
  it("Kiểm tra đầy đủ 36 ô trong bảng chuyển trạng thái (6x6 matrix)", () => {
    const validPairs: Record<string, string[]> = {
      draft: ["in_review"],
      in_review: ["draft", "approved", "rejected"],
      approved: ["draft", "published"],
      published: ["archived"],
      archived: ["published"], // Needs super_admin role
      rejected: ["draft"],
    };

    let totalPairsCount = 0;
    let validPairsCount = 0;
    let invalidPairsCount = 0;

    for (const from of CONTENT_LIFECYCLE_STATUSES) {
      for (const to of CONTENT_LIFECYCLE_STATUSES) {
        totalPairsCount++;
        const expectedValid = validPairs[from]?.includes(to) ?? false;

        if (from === "archived" && to === "published") {
          // Requires super_admin
          expect(canTransition(from, to, "content_reviewer")).toBe(false);
          expect(canTransition(from, to, "super_admin")).toBe(true);
        } else {
          const result = canTransition(from, to, "content_reviewer");
          expect(result).toBe(expectedValid);
        }

        if (expectedValid) {
          validPairsCount++;
        } else {
          invalidPairsCount++;
        }
      }
    }

    expect(totalPairsCount).toBe(36);
    expect(validPairsCount).toBe(9);
    expect(invalidPairsCount).toBe(27);
  });

  it("BR-CLC-02: draft -> published bị từ chối", () => {
    expect(canTransition("draft", "published")).toBe(false);
  });

  it("Trạng thái khởi sinh hợp lệ chỉ gồm draft và published", () => {
    expect(isInitialStatusValid("draft")).toBe(true);
    expect(isInitialStatusValid("published")).toBe(true);

    expect(isInitialStatusValid("in_review")).toBe(false);
    expect(isInitialStatusValid("approved")).toBe(false);
    expect(isInitialStatusValid("archived")).toBe(false);
    expect(isInitialStatusValid("rejected")).toBe(false);
  });
});
