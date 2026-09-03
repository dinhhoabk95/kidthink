/**
 * Generated registry of game level template builders (Task #208).
 * Single Source of Truth: Generated from directory structure.
 */

import type { Projection } from "@mindkid/shared";
import { projectGT000 } from "./gt-000.js";
import { projectGT001 } from "./gt-001.js";
import { projectGT002 } from "./gt-002.js";
import { projectGT003 } from "./gt-003.js";
import { projectGT004 } from "./gt-004.js";
import { projectGT005 } from "./gt-005.js";
import { projectGT006 } from "./gt-006.js";
import { projectGT007 } from "./gt-007.js";
import { projectGT008 } from "./gt-008.js";
import { projectGT009 } from "./gt-009.js";
import { projectGT011 } from "./gt-011.js";
import { projectGT012 } from "./gt-012.js";
import { projectGT014 } from "./gt-014.js";
import { projectGT015 } from "./gt-015.js";
import { projectGT018 } from "./gt-018.js";
import { projectGT020 } from "./gt-020.js";
import { projectGT021 } from "./gt-021.js";
import { projectGT022 } from "./gt-022.js";
import { projectGT023 } from "./gt-023.js";
import { projectGT024 } from "./gt-024.js";
import { projectGT025 } from "./gt-025.js";
import { projectGT026 } from "./gt-026.js";
import { projectGT027 } from "./gt-027.js";
import { projectGT028 } from "./gt-028.js";
import { projectGT029 } from "./gt-029.js";
import { projectGT030 } from "./gt-030.js";
import { projectGT031 } from "./gt-031.js";
import { projectGT033 } from "./gt-033.js";
import { projectGT034 } from "./gt-034.js";
import { projectGT035 } from "./gt-035.js";
import { projectGT036 } from "./gt-036.js";

export const ALL_BUILDERS: Record<string, Projection> = {
  "GT-000": projectGT000,
  "GT-001": projectGT001,
  "GT-002": projectGT002,
  "GT-003": projectGT003,
  "GT-004": projectGT004,
  "GT-005": projectGT005,
  "GT-006": projectGT006,
  "GT-007": projectGT007,
  "GT-008": projectGT008,
  "GT-009": projectGT009,
  "GT-011": projectGT011,
  "GT-012": projectGT012,
  "GT-014": projectGT014,
  "GT-015": projectGT015,
  "GT-018": projectGT018,
  "GT-020": projectGT020,
  "GT-021": projectGT021,
  "GT-022": projectGT022,
  "GT-023": projectGT023,
  "GT-024": projectGT024,
  "GT-025": projectGT025,
  "GT-026": projectGT026,
  "GT-027": projectGT027,
  "GT-028": projectGT028,
  "GT-029": projectGT029,
  "GT-030": projectGT030,
  "GT-031": projectGT031,
  "GT-033": projectGT033,
  "GT-034": projectGT034,
  "GT-035": projectGT035,
  "GT-036": projectGT036,
};

export const BUILDER_TEMPLATE_CODES: readonly string[] =
  Object.keys(ALL_BUILDERS);

export function getBuilder(templateCode: string): Projection | undefined {
  return ALL_BUILDERS[templateCode];
}
