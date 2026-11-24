import type { KogumaUnitDef } from "./koguma-types.js";
import { KOGUMA_LA_UNITS_A } from "./koguma-units-la-a.js";
import { KOGUMA_LA_UNITS_B } from "./koguma-units-la-b.js";

export const KOGUMA_LA_UNITS: readonly KogumaUnitDef[] = [
  ...KOGUMA_LA_UNITS_A,
  ...KOGUMA_LA_UNITS_B,
];
