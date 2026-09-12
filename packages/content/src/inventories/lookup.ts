/**
 * Hàm tra cứu kho giá trị C1 (Task #271 TD.1 / BR-SVI-06..12).
 *
 * Cung cấp bảng tra và hàm truy xuất an toàn cho 6 kho giá trị C1:
 * - c1-numeral (21 chữ số 0..20)
 * - c1-number-bond (65 phân tách số whole 1..10)
 * - c1-ordinal (10 số thứ tự thứ nhất..thứ mười)
 * - c1-measure-dimension (6 chiều đo đối lập)
 * - c1-pattern-unit (6 đơn vị lặp quy luật)
 * - c1-quantity-rep (8 lối biểu diễn lượng)
 *
 * Invariant: Strict TypeScript — NO any, NO unknown.
 */

import type { DatasetAsset, DatasetItem } from "@mindkid/shared";
import {
  C1_MEASURE_DIMENSION_INVENTORY,
  type MeasureDimensionInventoryItem,
} from "./c1-measure-dimension.js";
import {
  C1_NUMBER_BOND_INVENTORY,
  type NumberBondInventoryItem,
} from "./c1-number-bond.js";
import {
  C1_NUMERAL_INVENTORY,
  type NumeralInventoryItem,
} from "./c1-numeral.js";
import {
  C1_ORDINAL_INVENTORY,
  type OrdinalInventoryItem,
} from "./c1-ordinal.js";
import {
  C1_PATTERN_UNIT_INVENTORY,
  type PatternUnitInventoryItem,
} from "./c1-pattern-unit.js";
import {
  C1_QUANTITY_REP_INVENTORY,
  type QuantityRepInventoryItem,
  type QuantityRepKind,
} from "./c1-quantity-rep.js";

// ── 1. NUMERAL ──────────────────────────────────────────────────────────────

export const NUMERAL_BY_ID: ReadonlyMap<string, NumeralInventoryItem> = new Map(
  C1_NUMERAL_INVENTORY.map((item) => [item.id, item])
);

export const NUMERAL_BY_VALUE: ReadonlyMap<number, NumeralInventoryItem> =
  new Map(C1_NUMERAL_INVENTORY.map((item) => [item.value, item]));

export function findNumeral(id: string): NumeralInventoryItem | undefined {
  return NUMERAL_BY_ID.get(id);
}

export function getNumeral(id: string): NumeralInventoryItem {
  const item = NUMERAL_BY_ID.get(id);
  if (!item) {
    throw new Error(
      `[inventories] Không tìm thấy chữ số id="${id}" trong C1_NUMERAL_INVENTORY`
    );
  }
  return item;
}

export function findNumeralByValue(
  value: number
): NumeralInventoryItem | undefined {
  return NUMERAL_BY_VALUE.get(value);
}

export function getNumeralByValue(value: number): NumeralInventoryItem {
  const item = NUMERAL_BY_VALUE.get(value);
  if (!item) {
    throw new Error(
      `[inventories] Không tìm thấy chữ số value=${value} trong C1_NUMERAL_INVENTORY`
    );
  }
  return item;
}

// ── 2. NUMBER BOND ──────────────────────────────────────────────────────────

export const NUMBER_BOND_BY_ID: ReadonlyMap<string, NumberBondInventoryItem> =
  new Map(C1_NUMBER_BOND_INVENTORY.map((item) => [item.id, item]));

export function findNumberBond(
  id: string
): NumberBondInventoryItem | undefined {
  return NUMBER_BOND_BY_ID.get(id);
}

export function getNumberBond(id: string): NumberBondInventoryItem {
  const item = NUMBER_BOND_BY_ID.get(id);
  if (!item) {
    throw new Error(
      `[inventories] Không tìm thấy phân tách số id="${id}" trong C1_NUMBER_BOND_INVENTORY`
    );
  }
  return item;
}

export function getNumberBondsByWhole(
  whole: number
): readonly NumberBondInventoryItem[] {
  return C1_NUMBER_BOND_INVENTORY.filter((item) => item.whole === whole);
}

// ── 3. ORDINAL ──────────────────────────────────────────────────────────────

export const ORDINAL_BY_ID: ReadonlyMap<string, OrdinalInventoryItem> = new Map(
  C1_ORDINAL_INVENTORY.map((item) => [item.id, item])
);

export const ORDINAL_BY_POSITION: ReadonlyMap<number, OrdinalInventoryItem> =
  new Map(C1_ORDINAL_INVENTORY.map((item) => [item.position, item]));

export function findOrdinal(id: string): OrdinalInventoryItem | undefined {
  return ORDINAL_BY_ID.get(id);
}

export function getOrdinal(id: string): OrdinalInventoryItem {
  const item = ORDINAL_BY_ID.get(id);
  if (!item) {
    throw new Error(
      `[inventories] Không tìm thấy số thứ tự id="${id}" trong C1_ORDINAL_INVENTORY`
    );
  }
  return item;
}

export function findOrdinalByPosition(
  position: number
): OrdinalInventoryItem | undefined {
  return ORDINAL_BY_POSITION.get(position);
}

export function getOrdinalByPosition(position: number): OrdinalInventoryItem {
  const item = ORDINAL_BY_POSITION.get(position);
  if (!item) {
    throw new Error(
      `[inventories] Không tìm thấy số thứ tự position=${position} trong C1_ORDINAL_INVENTORY`
    );
  }
  return item;
}

// ── 4. MEASURE DIMENSION ───────────────────────────────────────────────────

export const MEASURE_DIMENSION_BY_ID: ReadonlyMap<
  string,
  MeasureDimensionInventoryItem
> = new Map(C1_MEASURE_DIMENSION_INVENTORY.map((item) => [item.id, item]));

export const ALLOWED_MEASURE_UNIT_KINDS: readonly string[] = [
  "length",
  "height",
  "weight",
  "size",
  "quantity",
  "capacity",
] as const;

export function findMeasureDimension(
  id: string
): MeasureDimensionInventoryItem | undefined {
  return MEASURE_DIMENSION_BY_ID.get(id);
}

export function getMeasureDimension(id: string): MeasureDimensionInventoryItem {
  const item = MEASURE_DIMENSION_BY_ID.get(id);
  if (!item) {
    throw new Error(
      `[inventories] Không tìm thấy chiều đo id="${id}" trong C1_MEASURE_DIMENSION_INVENTORY`
    );
  }
  return item;
}

// ── 5. PATTERN UNIT ────────────────────────────────────────────────────────

export const PATTERN_UNIT_BY_ID: ReadonlyMap<string, PatternUnitInventoryItem> =
  new Map(C1_PATTERN_UNIT_INVENTORY.map((item) => [item.id, item]));

export function findPatternUnit(
  id: string
): PatternUnitInventoryItem | undefined {
  return PATTERN_UNIT_BY_ID.get(id);
}

export function getPatternUnit(id: string): PatternUnitInventoryItem {
  const item = PATTERN_UNIT_BY_ID.get(id);
  if (!item) {
    throw new Error(
      `[inventories] Không tìm thấy đơn vị quy luật id="${id}" trong C1_PATTERN_UNIT_INVENTORY`
    );
  }
  return item;
}

// ── 6. QUANTITY REP ────────────────────────────────────────────────────────

export const QUANTITY_REP_BY_ID: ReadonlyMap<string, QuantityRepInventoryItem> =
  new Map(C1_QUANTITY_REP_INVENTORY.map((item) => [item.id, item]));

export const QUANTITY_REP_BY_KIND: ReadonlyMap<
  QuantityRepKind,
  QuantityRepInventoryItem
> = new Map(C1_QUANTITY_REP_INVENTORY.map((item) => [item.kind, item]));

export function findQuantityRep(
  id: string
): QuantityRepInventoryItem | undefined {
  return QUANTITY_REP_BY_ID.get(id);
}

export function getQuantityRep(id: string): QuantityRepInventoryItem {
  const item = QUANTITY_REP_BY_ID.get(id);
  if (!item) {
    throw new Error(
      `[inventories] Không tìm thấy lối biểu diễn lượng id="${id}" trong C1_QUANTITY_REP_INVENTORY`
    );
  }
  return item;
}

// ── 7. DATASET ITEM BUILDERS ───────────────────────────────────────────────

export function numeralItem(
  id: string,
  overrides?: {
    readonly label?: string;
    readonly image?: DatasetAsset;
    readonly category?: Readonly<Record<string, string>>;
    readonly contrast_group?: string;
    readonly metadata?: Readonly<Record<string, string | number | boolean>>;
  }
): DatasetItem {
  const item = getNumeral(id);
  return {
    id: item.id,
    label: overrides?.label ?? item.label,
    glyph: item.glyph,
    value: item.value,
    audio_path: item.audio_path,
    image: overrides?.image,
    category: overrides?.category,
    contrast_group: overrides?.contrast_group,
    metadata: overrides?.metadata,
  };
}

export function ordinalItem(
  id: string,
  overrides?: {
    readonly label?: string;
    readonly value?: number;
    readonly image?: DatasetAsset;
    readonly category?: Readonly<Record<string, string>>;
    readonly contrast_group?: string;
    readonly metadata?: Readonly<Record<string, string | number | boolean>>;
  }
): DatasetItem {
  const item = getOrdinal(id);
  return {
    id: item.id,
    label: overrides?.label ?? item.label,
    glyph: item.glyph,
    value: overrides?.value ?? item.position,
    audio_path: item.audio_path,
    image: overrides?.image,
    category: overrides?.category,
    contrast_group: overrides?.contrast_group,
    metadata: {
      ...overrides?.metadata,
      position: item.position,
    },
  };
}

export function numberBondItem(
  id: string,
  overrides?: {
    readonly label?: string;
    readonly glyph?: string;
    readonly image?: DatasetAsset;
    readonly category?: Readonly<Record<string, string>>;
    readonly contrast_group?: string;
    readonly metadata?: Readonly<Record<string, string | number | boolean>>;
  }
): DatasetItem {
  const item = getNumberBond(id);
  return {
    id: item.id,
    label: overrides?.label ?? item.label,
    glyph: overrides?.glyph,
    value: item.whole,
    image: overrides?.image,
    category: overrides?.category,
    contrast_group: overrides?.contrast_group,
    metadata: {
      ...overrides?.metadata,
      whole: item.whole,
      part_a: item.part_a,
      part_b: item.part_b,
    },
  };
}

export function measureDimensionItems(
  id: string,
  options?: {
    readonly moreImage?: DatasetAsset;
    readonly lessImage?: DatasetAsset;
    readonly moreAudioPath?: string;
    readonly lessAudioPath?: string;
  }
): readonly [DatasetItem, DatasetItem] {
  const dim = getMeasureDimension(id);
  return [
    {
      id: `${dim.id}_more`,
      label: dim.pole_more,
      image: options?.moreImage,
      audio_path: options?.moreAudioPath,
      category: {
        dimension: dim.unit_kind,
        pole: "more",
      },
    },
    {
      id: `${dim.id}_less`,
      label: dim.pole_less,
      image: options?.lessImage,
      audio_path: options?.lessAudioPath,
      category: {
        dimension: dim.unit_kind,
        pole: "less",
      },
    },
  ];
}
