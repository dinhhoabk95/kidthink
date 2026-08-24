import { describe, expect, it } from "vitest";
import { projectChildForAdmin } from "#src/admin-child-projection";

describe("Task 4 & D-JF: Admin Child Projection (BR-CPA-02, BR-CPA-03, BR-USD-02)", () => {
  it("projects exact 4 fields (display_name, age_band, status, created_at) plus uuid and purge_at if present", () => {
    const rawChild = {
      id: 101,
      uuid: "child-uuid-12345",
      userId: 50,
      displayName: "Bé Cún",
      birthYear: 2021,
      avatarId: "avatar-preset-01",
      relationship: "child",
      currentCurriculumId: 1,
      dailyPlayCapMinutes: 60,
      status: "active",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    };

    const projected = projectChildForAdmin(rawChild, 2026);

    expect(projected).toEqual({
      uuid: "child-uuid-12345",
      display_name: "Bé Cún",
      age_band: "5-6",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
    });

    // Verify forbidden fields are absent
    expect((projected as any).birth_year).toBeUndefined();
    expect((projected as any).avatar_id).toBeUndefined();
    expect((projected as any).current_curriculum_id).toBeUndefined();
    expect((projected as any).daily_play_cap_minutes).toBeUndefined();
  });

  it("derives age_band correctly across different age groups", () => {
    const currentYear = 2026;
    expect(
      projectChildForAdmin(
        {
          uuid: "1",
          displayName: "A",
          birthYear: 2023,
          status: "active",
          createdAt: "2026-01-01",
        },
        currentYear
      ).age_band
    ).toBe("3-4");

    expect(
      projectChildForAdmin(
        {
          uuid: "2",
          displayName: "B",
          birthYear: 2022,
          status: "active",
          createdAt: "2026-01-01",
        },
        currentYear
      ).age_band
    ).toBe("4-5");

    expect(
      projectChildForAdmin(
        {
          uuid: "3",
          displayName: "C",
          birthYear: 2020,
          status: "active",
          createdAt: "2026-01-01",
        },
        currentYear
      ).age_band
    ).toBe("5-6");
  });
});
