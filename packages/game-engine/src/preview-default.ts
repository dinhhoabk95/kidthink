/**
 * Payload xem trước mặc định cho mọi template (Task #313 Phase 24, mục 9).
 *
 * Trước đây preview-sandbox chỉ có payload viết tay cho vài template, còn lại rơi
 * vào một payload chung không hợp lệ ở 20+ mã. Nguồn thật của "một level mẫu hợp
 * lệ" là fixture đầu tiên của chính engine (đã có test hợp đồng), nên lấy ở đây.
 * Nạp lười từng template để trang chỉ tải fixture của mã đang xem (`BR-TAK-08`).
 */

import { AGE_BANDS, type AgeBand } from "#src/contracts/types.js";
import { getGameTemplate } from "#src/generated/template-registry.js";

export interface PreviewDefault {
  readonly content: object;
  readonly difficulty: object;
  /** Band đầu tiên template không cấm; không có thì `AGE_BANDS[0]`. */
  readonly ageBand: AgeBand;
}

interface FixtureRow {
  readonly content: object;
  readonly difficulty: object;
}

const FIXTURE_LOADERS: Readonly<
  Record<string, () => Promise<readonly FixtureRow[]>>
> = {
  "GT-000": () =>
    import("#src/templates/GT-000/fixtures.js").then((m) => m.GT000_FIXTURES),
  "GT-001": () =>
    import("#src/templates/GT-001/fixtures.js").then((m) => m.GT001_FIXTURES),
  "GT-002": () =>
    import("#src/templates/GT-002/fixtures.js").then((m) => m.GT002_FIXTURES),
  "GT-003": () =>
    import("#src/templates/GT-003/fixtures.js").then((m) => m.GT003_FIXTURES),
  "GT-004": () =>
    import("#src/templates/GT-004/fixtures.js").then((m) => m.GT004_FIXTURES),
  "GT-005": () =>
    import("#src/templates/GT-005/fixtures.js").then((m) => m.GT005_FIXTURES),
  "GT-006": () =>
    import("#src/templates/GT-006/fixtures.js").then((m) => m.GT006_FIXTURES),
  "GT-007": () =>
    import("#src/templates/GT-007/fixtures.js").then((m) => m.GT007_FIXTURES),
  "GT-008": () =>
    import("#src/templates/GT-008/fixtures.js").then((m) => m.GT008_FIXTURES),
  "GT-009": () =>
    import("#src/templates/GT-009/fixtures.js").then((m) => m.GT009_FIXTURES),
  "GT-010": () =>
    import("#src/templates/GT-010/fixtures.js").then((m) => m.GT010_FIXTURES),
  "GT-011": () =>
    import("#src/templates/GT-011/fixtures.js").then((m) => m.GT011_FIXTURES),
  "GT-012": () =>
    import("#src/templates/GT-012/fixtures.js").then((m) => m.GT012_FIXTURES),
  "GT-013": () =>
    import("#src/templates/GT-013/fixtures.js").then((m) => m.GT013_FIXTURES),
  "GT-014": () =>
    import("#src/templates/GT-014/fixtures.js").then((m) => m.GT014_FIXTURES),
  "GT-015": () =>
    import("#src/templates/GT-015/fixtures.js").then((m) => m.GT015_FIXTURES),
  "GT-016": () =>
    import("#src/templates/GT-016/fixtures.js").then((m) => m.GT016_FIXTURES),
  "GT-017": () =>
    import("#src/templates/GT-017/fixtures.js").then((m) => m.GT017_FIXTURES),
  "GT-018": () =>
    import("#src/templates/GT-018/fixtures.js").then((m) => m.GT018_FIXTURES),
  "GT-019": () =>
    import("#src/templates/GT-019/fixtures.js").then((m) => m.GT019_FIXTURES),
  "GT-020": () =>
    import("#src/templates/GT-020/fixtures.js").then((m) => m.GT020_FIXTURES),
  "GT-021": () =>
    import("#src/templates/GT-021/fixtures.js").then((m) => m.GT021_FIXTURES),
  "GT-022": () =>
    import("#src/templates/GT-022/fixtures.js").then((m) => m.GT022_FIXTURES),
  "GT-023": () =>
    import("#src/templates/GT-023/fixtures.js").then((m) => m.GT023_FIXTURES),
  "GT-024": () =>
    import("#src/templates/GT-024/fixtures.js").then((m) => m.GT024_FIXTURES),
  "GT-025": () =>
    import("#src/templates/GT-025/fixtures.js").then((m) => m.GT025_FIXTURES),
  "GT-026": () =>
    import("#src/templates/GT-026/fixtures.js").then((m) => m.GT026_FIXTURES),
  "GT-027": () =>
    import("#src/templates/GT-027/fixtures.js").then((m) => m.GT027_FIXTURES),
  "GT-028": () =>
    import("#src/templates/GT-028/fixtures.js").then((m) => m.GT028_FIXTURES),
  "GT-029": () =>
    import("#src/templates/GT-029/fixtures.js").then((m) => m.GT029_FIXTURES),
  "GT-030": () =>
    import("#src/templates/GT-030/fixtures.js").then((m) => m.GT030_FIXTURES),
  "GT-031": () =>
    import("#src/templates/GT-031/fixtures.js").then((m) => m.GT031_FIXTURES),
  "GT-032": () =>
    import("#src/templates/GT-032/fixtures.js").then((m) => m.GT032_FIXTURES),
  "GT-033": () =>
    import("#src/templates/GT-033/fixtures.js").then((m) => m.GT033_FIXTURES),
  "GT-034": () =>
    import("#src/templates/GT-034/fixtures.js").then((m) => m.GT034_FIXTURES),
  "GT-035": () =>
    import("#src/templates/GT-035/fixtures.js").then((m) => m.GT035_FIXTURES),
  "GT-036": () =>
    import("#src/templates/GT-036/fixtures.js").then((m) => m.GT036_FIXTURES),
  "GT-037": () =>
    import("#src/templates/GT-037/fixtures.js").then((m) => m.GT037_FIXTURES),
};

function firstAllowedBand(templateCode: string): AgeBand {
  const banned: readonly string[] =
    getGameTemplate(templateCode)?.banned_age_bands ?? [];
  return AGE_BANDS.find((band) => !banned.includes(band)) ?? AGE_BANDS[0];
}

/** Level mẫu đầu tiên của template, hoặc `null` khi mã không có fixture. */
export async function loadPreviewDefault(
  templateCode: string
): Promise<PreviewDefault | null> {
  const load = FIXTURE_LOADERS[templateCode];
  const first = load ? (await load())[0] : undefined;
  if (!first) {
    return null;
  }
  return {
    content: first.content,
    difficulty: first.difficulty,
    ageBand: firstAllowedBand(templateCode),
  };
}
