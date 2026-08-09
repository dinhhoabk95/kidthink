import { describe, expect, it } from "vitest";
import {
  CHILD_PROFILE_CLOSED_COLUMNS,
  ChildFieldNotAllowedError,
  getValidBirthYearRange,
  isValidAvatarId,
  isValidBirthYear,
  parseChildProfileInput,
} from "../src/index.ts";

describe("Child Data Compliance Tests — Tasks 5, 6, 7", () => {
  it("BR-CDC-01 & BR-SPT-01: CHILD_PROFILE_CLOSED_COLUMNS contains exact 12 columns", () => {
    expect(CHILD_PROFILE_CLOSED_COLUMNS.length).toBe(12);
    expect(CHILD_PROFILE_CLOSED_COLUMNS).toContain("uuid");
    expect(CHILD_PROFILE_CLOSED_COLUMNS).toContain("avatar_id");
    expect(CHILD_PROFILE_CLOSED_COLUMNS).toContain("relationship");
    expect(CHILD_PROFILE_CLOSED_COLUMNS).toContain("current_curriculum_id");
    expect(CHILD_PROFILE_CLOSED_COLUMNS).toContain("daily_play_cap_minutes");
    expect(CHILD_PROFILE_CLOSED_COLUMNS).toContain("status");
  });

  it("BR-CDC-01: parseChildProfileInput accepts valid closed fields and rejects unallowed fields with CHILD_FIELD_NOT_ALLOWED (400)", () => {
    const currentYear = 2026;
    const validPayload = {
      display_name: "Bé Nam",
      birth_year: 2021,
      avatar_id: "preset_lion_01",
      relationship: "child",
      daily_play_cap_minutes: 30,
    };

    const parsed = parseChildProfileInput(validPayload, currentYear);
    expect(parsed.display_name).toBe("Bé Nam");
    expect(parsed.birth_year).toBe(2021);

    // Negative test: payload contains unallowed fields (full_name, school)
    const invalidPayload = {
      ...validPayload,
      full_name: "Nguyen Van A",
      school: "Truong Mam Non Son Ca",
      secret_value: "sensitive_data_123",
    };

    try {
      parseChildProfileInput(invalidPayload, currentYear);
      expect.fail("Should have thrown ChildFieldNotAllowedError");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ChildFieldNotAllowedError);
      const e = err as ChildFieldNotAllowedError;
      expect(e.code).toBe("CHILD_FIELD_NOT_ALLOWED");
      expect(e.statusCode).toBe(400);
      expect(e.unallowedFields).toEqual([
        "full_name",
        "school",
        "secret_value",
      ]);

      // Negative assertion: Error message MUST NOT echo raw values of unallowed fields!
      expect(e.message).not.toContain("Nguyen Van A");
      expect(e.message).not.toContain("Truong Mam Non Son Ca");
      expect(e.message).not.toContain("sensitive_data_123");
    }
  });

  it("BR-CDC-04: isValidAvatarId allows preset IDs and rejects paths, URLs, and data URIs", () => {
    expect(isValidAvatarId("preset_cat_01")).toBe(true);
    expect(isValidAvatarId("avatar_bear_42")).toBe(true);

    // Rejections
    expect(isValidAvatarId("/images/avatar.png")).toBe(false);
    expect(isValidAvatarId("C:\\images\\avatar.jpg")).toBe(false);
    expect(isValidAvatarId("http://example.com/photo.jpg")).toBe(false);
    expect(isValidAvatarId("https://cdn.com/child.png")).toBe(false);
    expect(
      isValidAvatarId("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...")
    ).toBe(false);
  });

  it("BR-CDC-01 & §7.1: getValidBirthYearRange and isValidBirthYear compute range relative to current year", () => {
    const currentYear = 2026;
    const range = getValidBirthYearRange(currentYear);
    // [2026 - 7, 2026 - 2] = [2019, 2024]
    expect(range).toEqual({ minYear: 2019, maxYear: 2024 });

    expect(isValidBirthYear(2021, currentYear)).toBe(true);
    expect(isValidBirthYear(2019, currentYear)).toBe(true);
    expect(isValidBirthYear(2024, currentYear)).toBe(true);

    // Rejections:
    // 1. Future birth year (2027)
    expect(isValidBirthYear(2027, currentYear)).toBe(false);
    // 2. Child aged 10 (born 2016 -> 2026 - 2016 = 10 years old)
    expect(isValidBirthYear(2016, currentYear)).toBe(false);
  });
});
