import { CompetencyCodeSchema, StrandCodeSchema } from "@kidthink/shared";
import { describe, expect, it } from "vitest";
import { COMPETENCIES, STRANDS } from "../src/index.js";

describe("COMPETENCIES", () => {
  it("has exactly 6 entries", () => {
    expect(COMPETENCIES).toHaveLength(6);
  });

  it("codes are C1..C6 in order", () => {
    const codes = COMPETENCIES.map((c) => c.code);
    expect(codes).toEqual(["C1", "C2", "C3", "C4", "C5", "C6"]);
  });

  it("all codes pass CompetencyCodeSchema", () => {
    for (const c of COMPETENCIES) {
      expect(() => CompetencyCodeSchema.parse(c.code)).not.toThrow();
    }
  });

  it("all have non-empty English and Vietnamese names", () => {
    for (const c of COMPETENCIES) {
      expect(c.name_en.length).toBeGreaterThan(0);
      expect(c.name_vi.length).toBeGreaterThan(0);
    }
  });
});

describe("STRANDS", () => {
  it("has exactly 41 entries", () => {
    expect(STRANDS).toHaveLength(41);
  });

  it("all codes pass StrandCodeSchema", () => {
    for (const s of STRANDS) {
      expect(() => StrandCodeSchema.parse(s.code)).not.toThrow();
    }
  });

  it("all competency_codes pass CompetencyCodeSchema", () => {
    for (const s of STRANDS) {
      expect(() => CompetencyCodeSchema.parse(s.competency_code)).not.toThrow();
    }
  });

  it("each strand belongs to a valid competency", () => {
    const competencyCodes = new Set(COMPETENCIES.map((c) => c.code));
    for (const s of STRANDS) {
      expect(competencyCodes.has(s.competency_code)).toBe(true);
    }
  });

  it("strand code prefix matches its competency_code", () => {
    for (const s of STRANDS) {
      expect(s.code.startsWith(`${s.competency_code}.`)).toBe(true);
    }
  });

  it("strand count per competency matches taxonomy docs", () => {
    const counts: Record<string, number> = {};
    for (const s of STRANDS) {
      counts[s.competency_code] = (counts[s.competency_code] ?? 0) + 1;
    }
    expect(counts).toEqual({
      C1: 10,
      C2: 8,
      C3: 8,
      C4: 4,
      C5: 5,
      C6: 6,
    });
  });

  it("all have non-empty English and Vietnamese names", () => {
    for (const s of STRANDS) {
      expect(s.name_en.length).toBeGreaterThan(0);
      expect(s.name_vi.length).toBeGreaterThan(0);
    }
  });

  it("strand codes are unique", () => {
    const codes = STRANDS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
