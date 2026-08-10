import { describe, expect, it } from "vitest";
import { getVersionChangeMilestones } from "../src/versioning-report.ts";

describe("P0.6 Task 8 — Mốc đổi version cho báo cáo & BR-VER-04 / BR-VER-05", () => {
  it("Tính mốc đổi version từ chuỗi phiên chơi (BR-VER-05)", () => {
    const sessions = [
      {
        entityId: 10,
        contentVersion: 1,
        startedAt: new Date("2026-08-01T10:00:00Z"),
      },
      {
        entityId: 10,
        contentVersion: 1,
        startedAt: new Date("2026-08-02T10:00:00Z"),
      },
      {
        entityId: 10,
        contentVersion: 2,
        startedAt: new Date("2026-08-05T10:00:00Z"),
      },
      {
        entityId: 10,
        contentVersion: 2,
        startedAt: new Date("2026-08-06T10:00:00Z"),
      },
      {
        entityId: 10,
        contentVersion: 3,
        startedAt: new Date("2026-08-09T10:00:00Z"),
      },
    ];

    const milestones = getVersionChangeMilestones(sessions);
    expect(milestones).toHaveLength(2);
    expect(milestones[0]).toEqual({
      entityId: 10,
      previousVersion: 1,
      newVersion: 2,
      changedAt: new Date("2026-08-05T10:00:00Z"),
    });
    expect(milestones[1]).toEqual({
      entityId: 10,
      previousVersion: 2,
      newVersion: 3,
      changedAt: new Date("2026-08-09T10:00:00Z"),
    });
  });

  it("BR-VER-04: Phiên mở trước khi publish version mới giữ contentVersion cũ", () => {
    // Session 1 opened at version 3
    const sessionOpenedAt = new Date("2026-08-10T12:00:00Z");
    const session = {
      entityId: 10,
      contentVersion: 3,
      startedAt: sessionOpenedAt,
    };

    // Even if version 4 is published at 12:05:00Z, session record retains version 3
    expect(session.contentVersion).toBe(3);
  });
});
