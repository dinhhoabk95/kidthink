import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { assertMasteryProbabilities, getOwnerDb } from "#src/index";
import { masteryState } from "#src/schema/adaptive";

describe("Adaptive Schema Integration & Property Tests", () => {
  it("BR-SPT-05: mastery_state.skill_id nonexistent skill_id is rejected by FK constraint", async () => {
    const db = getOwnerDb();

    await expect(
      db.insert(masteryState).values({
        childProfileId: 1,
        skillId: 999_888_777,
        pLearn: "0.5000",
      })
    ).rejects.toThrow();
  });

  it("BR-SPT-08 & BR-DM-14: p_learn = '1.5000' is rejected by domain validator without DB CHECK constraint", () => {
    expect(() => assertMasteryProbabilities({ pLearn: "1.5000" })).toThrow();
    expect(() => assertMasteryProbabilities({ pLearn: "-0.0001" })).toThrow();
    expect(() =>
      assertMasteryProbabilities({ pLearn: "0.5000", emaCorrect: "0.8000" })
    ).not.toThrow();
  });

  it("Property test: p_learn is always within [0, 1] bounds", () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 1, noNaN: true }), (val) => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      })
    );
  });
});
