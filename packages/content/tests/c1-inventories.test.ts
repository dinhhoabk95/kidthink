import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  C1_MEASURE_DIMENSION_INVENTORY,
  C1_NUMBER_BOND_INVENTORY,
  C1_NUMERAL_INVENTORY,
  C1_ORDINAL_INVENTORY,
  C1_PATTERN_UNIT_INVENTORY,
  C1_QUANTITY_REP_INVENTORY,
} from "../src/inventories/index.js";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

const LEADING_SLASH_RE = /^\//;

describe("C1 Value Inventories (Task #265 / L2)", () => {
  // T2.1 c1-numeral: đúng 21 mục, value phủ trọn 0–20 không trùng không sót
  it("T2.1: c1-numeral has exactly 21 items and covers 0–20 without duplicate or omission", () => {
    expect(C1_NUMERAL_INVENTORY).toHaveLength(21);
    const values = C1_NUMERAL_INVENTORY.map((item) => item.value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(21);
    for (let i = 0; i <= 20; i++) {
      expect(uniqueValues.has(i)).toBe(true);
    }
  });

  // T2.2 c1-numeral: mọi audio_path tồn tại thật trên đĩa
  it("T2.2: c1-numeral all audio_path files exist on disk", () => {
    for (const item of C1_NUMERAL_INVENTORY) {
      expect(item.audio_path).toBeTruthy();
      const relativePath = item.audio_path.replace(
        LEADING_SLASH_RE,
        "apps/web/public/"
      );
      const fullPath = resolve(REPO_ROOT, relativePath);
      expect(existsSync(fullPath), `Audio file not found: ${fullPath}`).toBe(
        true
      );
    }
  });

  // T2.3 c1-number-bond: đúng 65 mục, và part_a + part_b === whole cho từng mục
  it("T2.3: c1-number-bond has 65 items and part_a + part_b === whole for each item", () => {
    expect(C1_NUMBER_BOND_INVENTORY).toHaveLength(65);
    for (const item of C1_NUMBER_BOND_INVENTORY) {
      expect(item.part_a + item.part_b).toBe(item.whole);
    }
  });

  // T2.4 c1-number-bond: với mỗi whole 1–10 có đúng whole + 1 mục
  it("T2.4: c1-number-bond has exactly whole + 1 items for each whole 1–10", () => {
    for (let whole = 1; whole <= 10; whole++) {
      const itemsForWhole = C1_NUMBER_BOND_INVENTORY.filter(
        (item) => item.whole === whole
      );
      expect(itemsForWhole).toHaveLength(whole + 1);
      const partAs = new Set(itemsForWhole.map((item) => item.part_a));
      expect(partAs.size).toBe(whole + 1);
      for (let a = 0; a <= whole; a++) {
        expect(partAs.has(a)).toBe(true);
      }
    }
  });

  // T2.5 c1-quantity-rep: 8 kind phân biệt, min_value ≤ max_value cho từng mục
  it("T2.5: c1-quantity-rep has 8 distinct kinds, min_value <= max_value for each item", () => {
    expect(C1_QUANTITY_REP_INVENTORY).toHaveLength(8);
    const kinds = new Set(C1_QUANTITY_REP_INVENTORY.map((item) => item.kind));
    expect(kinds.size).toBe(8);
    for (const item of C1_QUANTITY_REP_INVENTORY) {
      expect(item.min_value).toBeLessThanOrEqual(item.max_value);
    }
  });

  // T2.6 c1-measure-dimension: 6 mục, pole_more khác pole_less cho từng mục
  it("T2.6: c1-measure-dimension has 6 items, pole_more !== pole_less for each item", () => {
    expect(C1_MEASURE_DIMENSION_INVENTORY).toHaveLength(6);
    for (const item of C1_MEASURE_DIMENSION_INVENTORY) {
      expect(item.pole_more).toBeTruthy();
      expect(item.pole_less).toBeTruthy();
      expect(item.pole_more).not.toBe(item.pole_less);
    }
  });

  // T2.7 c1-ordinal: position phủ trọn 1–10
  it("T2.7: c1-ordinal covers positions 1–10 completely", () => {
    expect(C1_ORDINAL_INVENTORY).toHaveLength(10);
    const positions = new Set(
      C1_ORDINAL_INVENTORY.map((item) => item.position)
    );
    expect(positions.size).toBe(10);
    for (let pos = 1; pos <= 10; pos++) {
      expect(positions.has(pos)).toBe(true);
    }
  });

  it("c1-pattern-unit has 6 items with valid signatures and periods", () => {
    expect(C1_PATTERN_UNIT_INVENTORY).toHaveLength(6);
    for (const item of C1_PATTERN_UNIT_INVENTORY) {
      expect(item.signature.length).toBe(item.period);
    }
  });

  it("TD.1: lookup helpers work correctly for all 6 C1 inventories", async () => {
    const {
      getNumeral,
      findNumeral,
      getNumberBond,
      getOrdinal,
      getOrdinalByPosition,
      getMeasureDimension,
      getPatternUnit,
      getQuantityRep,
      ALLOWED_MEASURE_UNIT_KINDS,
    } = await import("../src/inventories/index.js");

    // Numeral
    expect(getNumeral("n0").value).toBe(0);
    expect(getNumeral("n10").glyph).toBe("10");
    expect(findNumeral("unknown")).toBeUndefined();
    expect(() => getNumeral("unknown")).toThrow();

    // Number bond
    expect(getNumberBond("bond_1_0_1").whole).toBe(1);
    expect(getNumberBond("bond_10_5_5").part_a).toBe(5);

    // Ordinal
    expect(getOrdinal("ord_1").position).toBe(1);
    expect(getOrdinalByPosition(10).glyph).toBe("10.");

    // Measure dimension
    expect(getMeasureDimension("dim_length").unit_kind).toBe("length");
    expect(ALLOWED_MEASURE_UNIT_KINDS).toContain("length");

    // Pattern unit
    expect(getPatternUnit("pat_ab").signature).toBe("AB");

    // Quantity rep
    expect(getQuantityRep("rep_ten_frame").kind).toBe("ten-frame");
  });
});
