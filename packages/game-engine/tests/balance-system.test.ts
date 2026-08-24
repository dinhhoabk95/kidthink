import { describe, expect, it } from "vitest";
import {
  canAchieveBalance,
  computeTiltAngle,
  getBalanceState,
  sumWeights,
} from "#src/systems/balance-system";

describe("balanceSystem (BR-MTB-15)", () => {
  it("computes sum of weights correctly", () => {
    expect(sumWeights([])).toBe(0);
    expect(
      sumWeights([
        { item_id: "1", weight: 3 },
        { item_id: "2", weight: 5 },
      ])
    ).toBe(8);
  });

  it("computes tilt angle within [-25, 25] bounds", () => {
    expect(computeTiltAngle(5, 5)).toBe(0);
    expect(computeTiltAngle(10, 5)).toBe(-25); // left heavy
    expect(computeTiltAngle(5, 10)).toBe(25); // right heavy
    expect(computeTiltAngle(5, 7)).toBe(10); // right slightly heavy (delta 2 * 5 = 10 deg)
  });

  it("determines balance state correctly", () => {
    expect(getBalanceState(5, 5)).toBe("balanced");
    expect(getBalanceState(8, 3)).toBe("left_heavy");
    expect(getBalanceState(2, 6)).toBe("right_heavy");
  });

  it("checks whether balance is achievable from tray items", () => {
    // left: 8, right: 5. Tray: [2, 3, 5]. Can add 3 to right -> 8 = 8
    expect(
      canAchieveBalance(
        [{ item_id: "l1", weight: 8 }],
        [{ item_id: "r1", weight: 5 }],
        [
          { item_id: "t1", weight: 2 },
          { item_id: "t2", weight: 3 },
          { item_id: "t3", weight: 5 },
        ]
      )
    ).toBe(true);

    // left: 10, right: 2. Tray: [1, 1]. Max right is 4 != 10
    expect(
      canAchieveBalance(
        [{ item_id: "l1", weight: 10 }],
        [{ item_id: "r1", weight: 2 }],
        [
          { item_id: "t1", weight: 1 },
          { item_id: "t2", weight: 1 },
        ]
      )
    ).toBe(false);
  });
});
