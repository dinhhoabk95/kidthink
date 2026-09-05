// Test helper — map of fixtures for test harness only
import { GT000_FIXTURES } from "#src/templates/GT-000/fixtures.js";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures.js";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures.js";
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures.js";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures.js";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures.js";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures.js";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures.js";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures.js";
import { GT010_FIXTURES } from "#src/templates/GT-010/fixtures.js";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures.js";
import { GT012_FIXTURES } from "#src/templates/GT-012/fixtures.js";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures.js";
import { GT014_FIXTURES } from "#src/templates/GT-014/fixtures.js";
import { GT015_FIXTURES } from "#src/templates/GT-015/fixtures.js";
import { GT016_FIXTURES } from "#src/templates/GT-016/fixtures.js";
import { GT017_FIXTURES } from "#src/templates/GT-017/fixtures.js";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures.js";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures.js";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures.js";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures.js";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures.js";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures.js";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures.js";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures.js";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures.js";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures.js";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures.js";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures.js";
import { GT033_FIXTURES } from "#src/templates/GT-033/fixtures.js";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures.js";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures.js";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures.js";

export type FixturePayload = Record<
  string,
  string | number | boolean | null | undefined | object
>;

export interface FixtureRecord {
  readonly content: FixturePayload;
  readonly difficulty: FixturePayload;
}

export const FIXTURES_BY_CODE: Record<string, readonly FixtureRecord[]> = {
  "GT-000": GT000_FIXTURES,
  "GT-001": GT001_FIXTURES,
  "GT-002": GT002_FIXTURES,
  "GT-003": GT003_FIXTURES,
  "GT-004": GT004_FIXTURES,
  "GT-005": GT005_FIXTURES,
  "GT-006": GT006_FIXTURES,
  "GT-007": GT007_FIXTURES,
  "GT-008": GT008_FIXTURES,
  "GT-009": GT009_FIXTURES,
  "GT-010": GT010_FIXTURES,
  "GT-011": GT011_FIXTURES,
  "GT-012": GT012_FIXTURES,
  "GT-013": GT013_FIXTURES,
  "GT-014": GT014_FIXTURES,
  "GT-015": GT015_FIXTURES,
  "GT-016": GT016_FIXTURES,
  "GT-017": GT017_FIXTURES,
  "GT-018": GT018_FIXTURES,
  "GT-019": GT019_FIXTURES,
  "GT-020": GT020_FIXTURES,
  "GT-021": GT021_FIXTURES,
  "GT-022": GT022_FIXTURES,
  "GT-023": GT023_FIXTURES,
  "GT-024": GT024_FIXTURES,
  "GT-025": GT025_FIXTURES,
  "GT-026": GT026_FIXTURES,
  "GT-027": GT027_FIXTURES,
  "GT-028": GT028_FIXTURES,
  "GT-029": GT029_FIXTURES,
  "GT-030": GT030_FIXTURES,
  "GT-031": GT031_FIXTURES,
  "GT-032": GT032_FIXTURES,
  "GT-033": GT033_FIXTURES,
  "GT-034": GT034_FIXTURES,
  "GT-035": GT035_FIXTURES,
  "GT-036": GT036_FIXTURES,
};
